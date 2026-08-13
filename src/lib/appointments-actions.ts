"use server";

import postgres from "postgres";
import { revalidatePath } from "next/cache";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const CONSULTORIO_TIME_ZONE = "America/Mexico_City";
const CALENDAR_PATHS = ["/admin/calendar", "/calendar"];

/**
 * Vuelve a validar las posibles rutas donde se muestra el calendario.
 */
function revalidateCalendar() {
  for (const path of CALENDAR_PATHS) {
    revalidatePath(path);
  }
}

/**
 * Convierte una fecha recibida desde el calendario a YYYY-MM-DD.
 *
 * Contempla dos casos comunes:
 * 1. Fecha creada con new Date(año, mes, día) en la zona del usuario.
 * 2. Fecha creada con new Date("YYYY-MM-DD"), que queda a medianoche UTC.
 */
function toCalendarDateString(date: Date): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("La fecha seleccionada no es válida.");
  }

  const isoDate = date.toISOString().slice(0, 10);

  const isUtcMidnight =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;

  // new Date("YYYY-MM-DD") representa exactamente las 00:00 UTC.
  // En ese caso se conserva el día escrito originalmente.
  if (isUtcMidnight) {
    return isoDate;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CONSULTORIO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
}

/**
 * Obtiene la fecha y hora actuales usando la zona horaria del consultorio.
 */
function getConsultorioNow(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CONSULTORIO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  const hour = Number(values.hour);
  const minute = Number(values.minute);
  const second = Number(values.second);

  return {
    dateStr: `${values.year}-${values.month}-${values.day}`,
    currentTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0",
    )}:${String(second).padStart(2, "0")}`,
    currentMinutes: hour * 60 + minute,
    currentSeconds: hour * 3600 + minute * 60 + second,
  };
}

/**
 * Convierte una hora HH:mm o HH:mm:ss a minutos desde las 00:00.
 */
function timeToMinutes(time: string): number {
  const [hourText, minuteText] = String(time).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error(`La hora "${time}" no es válida.`);
  }

  return hour * 60 + minute;
}

/**
 * Normaliza una hora a HH:mm:ss para poder compararla con PostgreSQL.
 */
function normalizeTime(time: string): string {
  const totalMinutes = timeToMinutes(time);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:00`;
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:00`;
}

function isKnownAppointmentError(message: string): boolean {
  return (
    message.startsWith("No puedes agendar") ||
    message.startsWith("El horario seleccionado") ||
    message.startsWith("La fecha seleccionada") ||
    message.startsWith("La hora") ||
    message.startsWith("La hora de finalización")
  );
}

// Obtener configuración del calendario global.
export async function getCalendarSettings() {
  try {
    const [settings] = await sql`
      SELECT *
      FROM tblcalendar_settings
      LIMIT 1
    `;

    return settings;
  } catch (error) {
    console.error("Error al obtener configuración:", error);

    return {
      start_time: "08:00:00",
      end_time: "18:00:00",
      lunch_start: "12:00:00",
      lunch_end: "13:00:00",
      slot_duration: 30,
      deposit_amount: 100,
    };
  }
}

// Obtener excepciones para un rango de fechas.
export async function getExceptions(startDate: Date, endDate: Date) {
  try {
    const startDateStr = toCalendarDateString(startDate);
    const endDateStr = toCalendarDateString(endDate);

    const exceptions = await sql`
      SELECT *
      FROM tblcalendar_exceptions
      WHERE exception_date BETWEEN ${startDateStr} AND ${endDateStr}
    `;

    return exceptions;
  } catch (error) {
    console.error("Error al obtener excepciones:", error);
    return [];
  }
}

// Obtener citas para un rango de fechas.
export async function getAppointmentsByDateRange(
  startDate: Date,
  endDate: Date,
) {
  try {
    const startDateStr = toCalendarDateString(startDate);
    const endDateStr = toCalendarDateString(endDate);

    const appointments = await sql`
      SELECT
        appointment_date,
        COUNT(*) AS total
      FROM tblappointments
      WHERE appointment_date BETWEEN ${startDateStr} AND ${endDateStr}
        AND status NOT IN ('cancelled', 'no_show')
      GROUP BY appointment_date
    `;

    return appointments;
  } catch (error) {
    console.error("Error al obtener citas:", error);
    return [];
  }
}

// Obtener citas de un día específico con datos del paciente.
export async function getAppointmentsByDay(date: Date) {
  try {
    const dateStr = toCalendarDateString(date);

    console.log("Buscando citas para:", dateStr);

    const appointments = await sql`
      SELECT
        a.*,
        a.id AS appointment_id,
        p.id AS patient_id,
        p.first_name,
        p.second_name,
        p.first_lastname,
        p.second_lastname,
        p.phone,
        p.age,
        p.gender,
        u.email
      FROM tblappointments a
      JOIN tblpatients p
        ON a.patient_id = p.id
      JOIN tblusers u
        ON p.user_id = u.id
      WHERE a.appointment_date = ${dateStr}
        AND a.status NOT IN ('cancelled', 'no_show')
      ORDER BY a.start_time
    `;

    console.log("Citas encontradas:", appointments.length);

    return appointments.map((appointment) => ({
      id: appointment.appointment_id,
      patient_id: appointment.patient_id,
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status,
      deposit_paid: appointment.deposit_paid,
      deposit_amount: appointment.deposit_amount,
      notes: appointment.notes,
      first_name: appointment.first_name,
      second_name: appointment.second_name,
      first_lastname: appointment.first_lastname,
      second_lastname: appointment.second_lastname,
      phone: appointment.phone,
      email: appointment.email,
      nombre_completo:
        `${appointment.first_name} ${appointment.second_name || ""} ${
          appointment.first_lastname
        } ${appointment.second_lastname || ""}`
          .trim()
          .replace(/\s+/g, " "),
    }));
  } catch (error) {
    console.error("Error al obtener citas del día:", error);
    return [];
  }
}

// Buscar pacientes por nombre completo.
export async function searchPatients(query: string) {
  try {
    const searchTerm = `%${query.trim()}%`;

    const patients = await sql`
      SELECT
        p.*,
        u.email
      FROM tblpatients p
      JOIN tblusers u
        ON p.user_id = u.id
      WHERE u.active = true
        AND p.active = true
        AND (
          p.first_name ILIKE ${searchTerm}
          OR p.second_name ILIKE ${searchTerm}
          OR p.first_lastname ILIKE ${searchTerm}
          OR p.second_lastname ILIKE ${searchTerm}
          OR CONCAT(
            p.first_name,
            ' ',
            p.first_lastname
          ) ILIKE ${searchTerm}
          OR CONCAT(
            p.first_name,
            ' ',
            p.second_name,
            ' ',
            p.first_lastname,
            ' ',
            p.second_lastname
          ) ILIKE ${searchTerm}
        )
      ORDER BY
        p.first_name,
        p.first_lastname
      LIMIT 20
    `;

    return patients;
  } catch (error) {
    console.error("Error al buscar pacientes:", error);
    return [];
  }
}

// Crear nuevo usuario y paciente asociado.
export async function createPatientAndUser(data: {
  username: string;
  email: string;
  first_name: string;
  second_name?: string | null;
  first_lastname: string;
  second_lastname?: string | null;
  age: number;
  gender?: string | null;
  phone?: string | null;
  notes?: string | null;
}) {
  try {
    const existingUser = await sql`
      SELECT id
      FROM tblusers
      WHERE email = ${data.email}
    `;

    if (existingUser.length > 0) {
      throw new Error("El correo electrónico ya está registrado");
    }

    const username = data.username || data.email.split("@")[0];

    const result = await sql.begin(async (transaction) => {
      const [newUser] = await transaction`
        INSERT INTO tblusers (
          rol_id,
          username,
          email,
          password_hash,
          verified,
          active
        )
        VALUES (
          2,
          ${username},
          ${data.email},
          'x',
          false,
          true
        )
        RETURNING id
      `;

      const [newPatient] = await transaction`
        INSERT INTO tblpatients (
          user_id,
          first_name,
          second_name,
          first_lastname,
          second_lastname,
          age,
          gender,
          phone,
          notes,
          active
        )
        VALUES (
          ${newUser.id},
          ${data.first_name},
          ${data.second_name || null},
          ${data.first_lastname},
          ${data.second_lastname || null},
          ${data.age},
          ${data.gender || null},
          ${data.phone || null},
          ${data.notes || null},
          true
        )
        RETURNING id
      `;

      return {
        patientId: newPatient.id,
        userId: newUser.id,
      };
    });

    return {
      success: true,
      patientId: result.patientId,
      userId: result.userId,
    };
  } catch (error) {
    console.error("Error al crear paciente y usuario:", error);

    throw new Error(
      error instanceof Error ? error.message : "Error al crear paciente",
    );
  }
}

// Obtener todos los horarios disponibles para un día específico.
export async function getAvailableSlots(date: Date): Promise<string[]> {
  try {
    const settings = await getCalendarSettings();
    const dateStr = toCalendarDateString(date);
    const now = getConsultorioNow();

    if (dateStr < now.dateStr) {
      return [];
    }

    const exception = await sql`
      SELECT *
      FROM tblcalendar_exceptions
      WHERE exception_date = ${dateStr}
      LIMIT 1
    `;

    const dayException = exception[0];

    if (dayException && dayException.is_working_day === false) {
      return [];
    }

    const start = normalizeTime(
      dayException?.start_time || settings.start_time,
    );

    const end = normalizeTime(dayException?.end_time || settings.end_time);

    const lunchStart = normalizeTime(
      dayException?.lunch_start || settings.lunch_start,
    );

    const lunchEnd = normalizeTime(
      dayException?.lunch_end || settings.lunch_end,
    );

    const slotDuration = Number(settings.slot_duration);

    if (!Number.isFinite(slotDuration) || slotDuration <= 0) {
      console.error(
        "Duración de cita inválida:",
        settings.slot_duration,
      );

      return [];
    }

    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    const lunchStartMinutes = timeToMinutes(lunchStart);
    const lunchEndMinutes = timeToMinutes(lunchEnd);

    const slots: string[] = [];

    for (
      let slotMinutes = startMinutes;
      slotMinutes < endMinutes;
      slotMinutes += slotDuration
    ) {
      const isLunchTime =
        slotMinutes >= lunchStartMinutes &&
        slotMinutes < lunchEndMinutes;

      if (isLunchTime) {
        continue;
      }

      slots.push(minutesToTime(slotMinutes));
    }

    const bookedAppointments = await sql`
      SELECT start_time
      FROM tblappointments
      WHERE appointment_date = ${dateStr}
        AND status NOT IN ('cancelled', 'no_show')
    `;

    const bookedSet = new Set<string>(
      bookedAppointments.map((appointment) =>
        normalizeTime(appointment.start_time),
      ),
    );

    const disabledHoursSet = new Set<string>();

    if (dayException?.disabled_hours) {
      let disabledHours = dayException.disabled_hours;

      if (typeof disabledHours === "string") {
        try {
          disabledHours = JSON.parse(disabledHours);
        } catch (parseError) {
          console.error(
            "No se pudieron interpretar las horas deshabilitadas:",
            parseError,
          );

          disabledHours = [];
        }
      }

      if (Array.isArray(disabledHours)) {
        for (const disabledHour of disabledHours) {
          disabledHoursSet.add(
            normalizeTime(String(disabledHour)),
          );
        }
      }
    }

    return slots.filter((slot) => {
      if (bookedSet.has(slot)) {
        return false;
      }

      if (disabledHoursSet.has(slot)) {
        return false;
      }

      if (
        dateStr === now.dateStr &&
        timeToMinutes(slot) <= now.currentMinutes
      ) {
        return false;
      }

      return true;
    });
  } catch (error) {
    console.error(
      "Error al obtener horarios disponibles:",
      error,
    );

    return [];
  }
}

// Crear una cita.
export async function createAppointment(data: {
  patientId: number;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  depositPaid: boolean;
  depositAmount: number;
  notes?: string;
}) {
  try {
    const dateStr = toCalendarDateString(data.appointmentDate);
    const startTime = normalizeTime(data.startTime);
    const endTime = normalizeTime(data.endTime);
    const now = getConsultorioNow();

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      throw new Error(
        "La hora de finalización debe ser posterior a la hora de inicio.",
      );
    }

    if (dateStr < now.dateStr) {
      throw new Error(
        "No puedes agendar una cita en una fecha que ya pasó.",
      );
    }

    if (
      dateStr === now.dateStr &&
      startMinutes <= now.currentMinutes
    ) {
      throw new Error(
        "No puedes agendar una cita en una hora que ya pasó o que ya comenzó.",
      );
    }

    const availableSlots = await getAvailableSlots(
      data.appointmentDate,
    );

    if (!availableSlots.includes(startTime)) {
      throw new Error(
        "El horario seleccionado ya no está disponible. Selecciona otro horario.",
      );
    }

    await sql.begin(async (transaction) => {
      const lockKey = `${dateStr}|${startTime}`;

      await transaction`
        SELECT pg_advisory_xact_lock(
          hashtext(${lockKey})::bigint
        )
      `;

      const existingAppointment = await transaction`
        SELECT id
        FROM tblappointments
        WHERE appointment_date = ${dateStr}
          AND start_time = ${startTime}
          AND status NOT IN ('cancelled', 'no_show')
        LIMIT 1
      `;

      if (existingAppointment.length > 0) {
        throw new Error(
          "El horario seleccionado acaba de ser ocupado. Selecciona otro horario.",
        );
      }

      await transaction`
        INSERT INTO tblappointments (
          patient_id,
          appointment_date,
          start_time,
          end_time,
          deposit_paid,
          deposit_amount,
          notes,
          status
        )
        VALUES (
          ${data.patientId},
          ${dateStr},
          ${startTime},
          ${endTime},
          ${data.depositPaid},
          ${data.depositAmount},
          ${data.notes || null},
          'scheduled'
        )
      `;
    });

    revalidateCalendar();

    return { success: true };
  } catch (error) {
    console.error("Error al crear cita:", error);

    if (
      error instanceof Error &&
      isKnownAppointmentError(error.message)
    ) {
      throw error;
    }

    throw new Error(
      "No se pudo crear la cita. Es posible que el horario ya esté ocupado.",
    );
  }
}

// Obtener total de citas de la semana actual.
export async function getWeeklyAppointmentsCount(
  referenceDate: Date = new Date(),
) {
  try {
    const dateStr = toCalendarDateString(referenceDate);

    const [year, month, day] = dateStr
      .split("-")
      .map(Number);

    const date = new Date(
      Date.UTC(year, month - 1, day, 12, 0, 0),
    );

    const dayOfWeek = date.getUTCDay();

    const sunday = new Date(date);

    sunday.setUTCDate(
      date.getUTCDate() - dayOfWeek,
    );

    const saturday = new Date(sunday);

    saturday.setUTCDate(
      sunday.getUTCDate() + 6,
    );

    const sundayStr = sunday
      .toISOString()
      .slice(0, 10);

    const saturdayStr = saturday
      .toISOString()
      .slice(0, 10);

    const result = await sql`
      SELECT COUNT(*) AS total
      FROM tblappointments
      WHERE appointment_date
        BETWEEN ${sundayStr} AND ${saturdayStr}
        AND status NOT IN ('cancelled', 'no_show')
    `;

    return Number(result[0]?.total || 0);
  } catch (error) {
    console.error(
      "Error al obtener citas semanales:",
      error,
    );

    return 0;
  }
}

// Obtener citas de hoy.
export async function getTodayAppointments() {
  try {
    const todayStr = getConsultorioNow().dateStr;

    const appointments = await sql`
      SELECT
        a.*,
        a.id AS appointment_id,
        p.id AS patient_id,
        p.first_name,
        p.second_name,
        p.first_lastname,
        p.second_lastname,
        p.phone,
        u.email
      FROM tblappointments a
      JOIN tblpatients p
        ON a.patient_id = p.id
      JOIN tblusers u
        ON p.user_id = u.id
      WHERE a.appointment_date = ${todayStr}
        AND a.status NOT IN ('cancelled', 'no_show')
      ORDER BY a.start_time
    `;

    console.log(
      "Citas de hoy encontradas:",
      appointments.length,
    );

    return appointments.map((appointment) => ({
      id: appointment.appointment_id,
      patient_id: appointment.patient_id,
      appointment_date:
        appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status,
      deposit_paid: appointment.deposit_paid,
      deposit_amount: appointment.deposit_amount,
      notes: appointment.notes,
      first_name: appointment.first_name,
      second_name: appointment.second_name,
      first_lastname: appointment.first_lastname,
      second_lastname: appointment.second_lastname,
      phone: appointment.phone,
      email: appointment.email,
      nombre_completo:
        `${appointment.first_name} ${
          appointment.second_name || ""
        } ${appointment.first_lastname} ${
          appointment.second_lastname || ""
        }`
          .trim()
          .replace(/\s+/g, " "),
    }));
  } catch (error) {
    console.error(
      "Error al obtener citas de hoy:",
      error,
    );

    return [];
  }
}

// Guardar configuración general.
export async function saveGeneralSettings(data: {
  startTime: string;
  endTime: string;
  lunchStart: string;
  lunchEnd: string;
  depositAmount: number;
}) {
  try {
    const startTime = normalizeTime(data.startTime);
    const endTime = normalizeTime(data.endTime);
    const lunchStart = normalizeTime(data.lunchStart);
    const lunchEnd = normalizeTime(data.lunchEnd);

    if (
      timeToMinutes(endTime) <=
      timeToMinutes(startTime)
    ) {
      throw new Error(
        "La hora de cierre debe ser posterior a la hora de apertura.",
      );
    }

    if (
      timeToMinutes(lunchEnd) <=
      timeToMinutes(lunchStart)
    ) {
      throw new Error(
        "La hora de fin de comida debe ser posterior a la hora de inicio.",
      );
    }

    await sql`
      UPDATE tblcalendar_settings
      SET
        start_time = ${startTime},
        end_time = ${endTime},
        lunch_start = ${lunchStart},
        lunch_end = ${lunchEnd},
        deposit_amount = ${data.depositAmount},
        updated_at = NOW()
      WHERE id = 1
    `;

    revalidateCalendar();

    return { success: true };
  } catch (error) {
    console.error(
      "Error al guardar configuración general:",
      error,
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : "No se pudo guardar la configuración general",
    );
  }
}

// Guardar excepción por día.
export async function saveDayException(data: {
  date: Date;
  startTime: string;
  endTime: string;
  lunchStart: string;
  lunchEnd: string;
  isWorkingDay: boolean;
  disabledHours: string[];
}) {
  try {
    const dateStr = toCalendarDateString(data.date);
    const startTime = normalizeTime(data.startTime);
    const endTime = normalizeTime(data.endTime);
    const lunchStart = normalizeTime(data.lunchStart);
    const lunchEnd = normalizeTime(data.lunchEnd);

    const disabledHours =
      data.disabledHours.map(normalizeTime);

    if (
      data.isWorkingDay &&
      timeToMinutes(endTime) <=
        timeToMinutes(startTime)
    ) {
      throw new Error(
        "La hora de cierre debe ser posterior a la hora de apertura.",
      );
    }

    if (
      data.isWorkingDay &&
      timeToMinutes(lunchEnd) <=
        timeToMinutes(lunchStart)
    ) {
      throw new Error(
        "La hora de fin de comida debe ser posterior a la hora de inicio.",
      );
    }

    await sql`
      DELETE FROM tblcalendar_exceptions
      WHERE exception_date = ${dateStr}
    `;

    const settings = await getCalendarSettings();

    const isDefaultConfig =
      data.isWorkingDay === true &&
      startTime ===
        normalizeTime(settings.start_time) &&
      endTime ===
        normalizeTime(settings.end_time) &&
      lunchStart ===
        normalizeTime(settings.lunch_start) &&
      lunchEnd ===
        normalizeTime(settings.lunch_end) &&
      disabledHours.length === 0;

    if (isDefaultConfig) {
      revalidateCalendar();

      return { success: true };
    }

    await sql`
      INSERT INTO tblcalendar_exceptions (
        exception_date,
        is_working_day,
        start_time,
        end_time,
        lunch_start,
        lunch_end,
        disabled_hours
      )
      VALUES (
        ${dateStr},
        ${data.isWorkingDay},
        ${startTime},
        ${endTime},
        ${lunchStart},
        ${lunchEnd},
        ${JSON.stringify(disabledHours)}::jsonb
      )
    `;

    revalidateCalendar();

    return { success: true };
  } catch (error) {
    console.error(
      "Error al guardar excepción del día:",
      error,
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : "No se pudo guardar la configuración del día",
    );
  }
}

// Eliminar excepción y restaurar configuración general.
export async function restoreDefaultDayConfig(
  date: Date,
) {
  try {
    const dateStr = toCalendarDateString(date);

    await sql`
      DELETE FROM tblcalendar_exceptions
      WHERE exception_date = ${dateStr}
    `;

    revalidateCalendar();

    return { success: true };
  } catch (error) {
    console.error(
      "Error al restaurar configuración del día:",
      error,
    );

    throw new Error(
      "No se pudo restaurar la configuración del día",
    );
  }
}

// Eliminar excepción por día.
export async function deleteDayException(date: Date) {
  try {
    const dateStr = toCalendarDateString(date);

    await sql`
      DELETE FROM tblcalendar_exceptions
      WHERE exception_date = ${dateStr}
    `;

    revalidateCalendar();

    return { success: true };
  } catch (error) {
    console.error(
      "Error al eliminar excepción del día:",
      error,
    );

    throw new Error(
      "No se pudo eliminar la configuración del día",
    );
  }
}

// Obtener cantidad de citas pendientes.
export async function getPendingAppointmentsCount() {
  try {
    const todayStr = getConsultorioNow().dateStr;

    const result = await sql`
      SELECT COUNT(*) AS total
      FROM tblappointments
      WHERE appointment_date >= ${todayStr}
        AND status = 'scheduled'
    `;

    return Number(result[0]?.total || 0);
  } catch (error) {
    console.error(
      "Error al obtener citas pendientes:",
      error,
    );

    return 0;
  }

}
/**
 * Marca manualmente una cita como inasistencia.
 *
 * Solo permite actualizar citas programadas o confirmadas
 * cuya hora de finalización ya haya pasado.
 */
export async function markAppointmentAsNoShow(
  appointmentId: number,
) {
  try {
    if (
      !Number.isInteger(appointmentId) ||
      appointmentId <= 0
    ) {
      return {
        success: false,
        message: "El identificador de la cita no es válido.",
      };
    }

    const [appointment] = await sql`
      SELECT
        id,
        status,
        appointment_date,
        start_time,
        end_time,
        (
          appointment_date <
            (NOW() AT TIME ZONE 'America/Mexico_City')::date
          OR (
            appointment_date =
              (NOW() AT TIME ZONE 'America/Mexico_City')::date
            AND end_time <=
              (NOW() AT TIME ZONE 'America/Mexico_City')::time
          )
        ) AS has_finished
      FROM tblappointments
      WHERE id = ${appointmentId}
      LIMIT 1
    `;

    if (!appointment) {
      return {
        success: false,
        message: "La cita no existe.",
      };
    }

    if (appointment.status === "no_show") {
      return {
        success: true,
        message:
          "La cita ya estaba marcada como inasistencia.",
      };
    }

    if (appointment.status === "completed") {
      return {
        success: false,
        message:
          "Una cita completada no puede marcarse como inasistencia.",
      };
    }

    if (appointment.status === "cancelled") {
      return {
        success: false,
        message:
          "Una cita cancelada no puede marcarse como inasistencia.",
      };
    }

    if (!appointment.has_finished) {
      return {
        success: false,
        message:
          "La cita solo puede marcarse como inasistencia después de que termine su horario.",
      };
    }

    const updatedAppointments = await sql`
      UPDATE tblappointments
      SET
        status = 'no_show',
        updated_at = NOW()
      WHERE id = ${appointmentId}
        AND status IN ('scheduled', 'confirmed')
        AND (
          appointment_date <
            (NOW() AT TIME ZONE 'America/Mexico_City')::date
          OR (
            appointment_date =
              (NOW() AT TIME ZONE 'America/Mexico_City')::date
            AND end_time <=
              (NOW() AT TIME ZONE 'America/Mexico_City')::time
          )
        )
      RETURNING id
    `;

    if (updatedAppointments.length === 0) {
      return {
        success: false,
        message:
          "La cita no pudo actualizarse porque su estado cambió.",
      };
    }

    revalidatePath("/admin/appointments");
    revalidatePath("/admin/citas");
    revalidatePath("/admin");
    revalidateCalendar();

    return {
      success: true,
      message:
        "La cita fue marcada como inasistencia.",
    };
  } catch (error) {
    console.error(
      "Error al marcar la cita como inasistencia:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la cita.",
    };
  }
}