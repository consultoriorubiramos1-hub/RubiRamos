'use server';

import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import cloudinary from './cloudinary';
import type { UploadApiResponse } from 'cloudinary';


const sql = postgres(
  process.env.POSTGRES_URL!,
  {
    ssl: 'require',
  },
);


const MAX_RECEIPT_SIZE =
  5 * 1024 * 1024;


const ALLOWED_RECEIPT_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);


interface LegacyCreateAppointmentData {
  patientId: number;

  appointmentDate:
    | Date
    | string;

  startTime: string;

  endTime?: string;

  depositPaid?: boolean;

  depositAmount?: number;

  notes?: string;

  receipt?: File;
}


interface CreateAppointmentResult {
  success: boolean;

  appointmentId?: number;

  paymentReference?: string;

  depositAmount?: number;

  message: string;
}


// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function revalidateAppointmentPages() {
  const paths = [
    '/admin',
    '/admin/appointments',
    '/admin/pagos',
    '/admin/calendar',
    '/admin/patient/calendar',
    '/patient/calendar',
    '/calendar',
  ];

  paths.forEach(
    path => {
      revalidatePath(
        path,
      );
    },
  );
}


function isFileValue(
  value: unknown,
): value is File {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false;
  }

  const possibleFile =
    value as Partial<File>;

  return (
    typeof possibleFile.arrayBuffer ===
      'function' &&
    typeof possibleFile.size ===
      'number' &&
    typeof possibleFile.type ===
      'string' &&
    typeof possibleFile.name ===
      'string'
  );
}


function normalizeDateValue(
  value: unknown,
): string {
  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime(),
    )
  ) {
    const year =
      value.getFullYear();

    const month =
      String(
        value.getMonth() + 1,
      ).padStart(
        2,
        '0',
      );

    const day =
      String(
        value.getDate(),
      ).padStart(
        2,
        '0',
      );

    return `${year}-${month}-${day}`;
  }

  const stringValue =
    String(
      value ?? '',
    ).trim();

  const dateMatch =
    stringValue.match(
      /^\d{4}-\d{2}-\d{2}/,
    );

  return dateMatch?.[0] ?? '';
}


function normalizeTimeValue(
  value: unknown,
): string {
  const stringValue =
    String(
      value ?? '',
    ).trim();

  if (
    /^\d{2}:\d{2}$/.test(
      stringValue,
    )
  ) {
    return `${stringValue}:00`;
  }

  if (
    /^\d{2}:\d{2}:\d{2}$/.test(
      stringValue,
    )
  ) {
    return stringValue;
  }

  return '';
}


function calculateEndTime(
  startTime: string,
  durationMinutes: number,
): string {
  const [
    hour,
    minute,
  ] =
    startTime
      .split(':')
      .map(Number);

  const totalMinutes =
    hour * 60 +
    minute +
    durationMinutes;

  const endHour =
    Math.floor(
      totalMinutes / 60,
    ) % 24;

  const endMinute =
    totalMinutes % 60;

  return (
    `${String(endHour).padStart(2, '0')}:` +
    `${String(endMinute).padStart(2, '0')}:00`
  );
}


function createPaymentReference(
  patientId: number,
  appointmentDate: string,
  startTime: string,
): string {
  const compactDate =
    appointmentDate.replace(
      /-/g,
      '',
    );

  const compactTime =
    startTime
      .replace(
        /:/g,
        '',
      )
      .slice(
        0,
        4,
      );

  return (
    `RUBI-${patientId}-${compactDate}-${compactTime}`
  );
}


async function uploadPaymentReceipt(
  receiptFile: File,
  paymentReference: string,
): Promise<UploadApiResponse> {
  const fileBuffer =
    Buffer.from(
      await receiptFile.arrayBuffer(),
    );

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              'rubi-ramos/comprobantes-anticipo',

            resource_type:
              'image',

            public_id:
              paymentReference.toLowerCase(),

            overwrite:
              true,

            unique_filename:
              false,
          },
          (
            error,
            result,
          ) => {
            if (error) {
              reject(
                error,
              );

              return;
            }

            if (!result) {
              reject(
                new Error(
                  'Cloudinary no devolvió la información del comprobante.',
                ),
              );

              return;
            }

            resolve(
              result,
            );
          },
        );

      uploadStream.end(
        fileBuffer,
      );
    },
  );
}


// ============================================================
// CONFIGURACIÓN DEL CALENDARIO
// ============================================================

export async function getCalendarSettings() {
  try {
    const [settings] =
      await sql`
        SELECT
          *

        FROM tblcalendar_settings

        LIMIT 1
      `;

    return settings;
  } catch (error) {
    console.error(
      'Error al obtener configuración:',
      error,
    );

    return {
      start_time:
        '08:00:00',

      end_time:
        '18:00:00',

      lunch_start:
        '12:00:00',

      lunch_end:
        '13:00:00',

      slot_duration:
        30,

      deposit_amount:
        100,
    };
  }
}


// ============================================================
// EXCEPCIONES DEL CALENDARIO
// ============================================================

export async function getExceptions(
  startDate: Date,
  endDate: Date,
) {
  try {
    const exceptions =
      await sql`
        SELECT
          *

        FROM tblcalendar_exceptions

        WHERE exception_date
          BETWEEN ${startDate}
          AND ${endDate}
      `;

    return exceptions;
  } catch (error) {
    console.error(
      'Error al obtener excepciones:',
      error,
    );

    return [];
  }
}


// ============================================================
// CITAS DEL PACIENTE POR RANGO
// ============================================================

export async function getPatientAppointmentsByDateRange(
  patientId: number,
  startDate: Date,
  endDate: Date,
) {
  try {
    const appointments =
      await sql`
        SELECT
          appointment_date,

          COUNT(*) AS total,

          ARRAY_AGG(
            start_time
          ) AS times

        FROM tblappointments

        WHERE patient_id =
          ${patientId}

          AND appointment_date
            BETWEEN ${startDate}
            AND ${endDate}

          AND status NOT IN (
            'cancelled',
            'no_show'
          )

        GROUP BY
          appointment_date
      `;

    return appointments;
  } catch (error) {
    console.error(
      'Error al obtener citas del paciente:',
      error,
    );

    return [];
  }
}


// ============================================================
// CITAS PRÓXIMAS DEL PACIENTE
// ============================================================

export async function getPatientUpcomingAppointments(
  patientId: number,
) {
  try {
    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0,
    );

    const todayStr =
      normalizeDateValue(
        today,
      );


    const appointments =
      await sql`
        SELECT
          a.*,

          a.id AS appointment_id

        FROM tblappointments a

        WHERE a.patient_id =
          ${patientId}

          AND a.appointment_date >=
            ${todayStr}

          AND a.status NOT IN (
            'cancelled',
            'no_show'
          )

        ORDER BY
          a.appointment_date ASC,

          a.start_time ASC
      `;


    return appointments.map(
      appointment => ({
        id:
          Number(
            appointment.appointment_id,
          ),

        appointment_date:
          appointment.appointment_date,

        start_time:
          appointment.start_time,

        end_time:
          appointment.end_time,

        status:
          appointment.status,

        deposit_paid:
          Boolean(
            appointment.deposit_paid,
          ),

        deposit_amount:
          Number(
            appointment.deposit_amount ??
            0,
          ),

        notes:
          appointment.notes,

        payment_status:
          appointment.payment_status,

        payment_reference:
          appointment.payment_reference,

        payment_receipt_url:
          appointment.payment_receipt_url,

        payment_submitted_at:
          appointment.payment_submitted_at,

        payment_reviewed_at:
          appointment.payment_reviewed_at,

        payment_review_notes:
          appointment.payment_review_notes,
      }),
    );
  } catch (error) {
    console.error(
      'Error al obtener citas del paciente:',
      error,
    );

    return [];
  }
}


// ============================================================
// HORARIOS DISPONIBLES
// ============================================================

export async function getAvailableSlotsForPatient(
  date: Date,
  patientId: number,
) {
  try {
    /*
     * Se valida para evitar recibir identificadores
     * incorrectos desde el navegador.
     */
    if (
      !Number.isInteger(
        patientId,
      ) ||
      patientId <= 0
    ) {
      return [];
    }


    const settings =
      await getCalendarSettings();

    const dateStr =
      normalizeDateValue(
        date,
      );


    const exception =
      await sql`
        SELECT
          *

        FROM tblcalendar_exceptions

        WHERE exception_date =
          ${dateStr}
      `;


    const isException =
      exception.length > 0;

    const selectedException =
      exception[0];


    if (
      isException &&
      selectedException
        .is_working_day ===
        false
    ) {
      return [];
    }


    const start =
      selectedException?.start_time ||
      settings.start_time;

    const end =
      selectedException?.end_time ||
      settings.end_time;

    const lunchStart =
      selectedException?.lunch_start ||
      settings.lunch_start;

    const lunchEnd =
      selectedException?.lunch_end ||
      settings.lunch_end;

    const slotDuration =
      Number(
        settings.slot_duration ||
        30,
      );


    const toMinutes = (
      time: string,
    ) => {
      const [
        hours,
        minutes,
      ] =
        String(
          time,
        )
          .split(':')
          .map(Number);

      return (
        hours * 60 +
        minutes
      );
    };


    const startMinutes =
      toMinutes(
        start,
      );

    const endMinutes =
      toMinutes(
        end,
      );

    const lunchStartMinutes =
      toMinutes(
        lunchStart,
      );

    const lunchEndMinutes =
      toMinutes(
        lunchEnd,
      );


    const slots: string[] =
      [];


    for (
      let currentMinutes =
        startMinutes;

      currentMinutes <
        endMinutes;

      currentMinutes +=
        slotDuration
    ) {
      if (
        currentMinutes >=
          lunchStartMinutes &&
        currentMinutes <
          lunchEndMinutes
      ) {
        continue;
      }

      const hour =
        Math.floor(
          currentMinutes / 60,
        );

      const minute =
        currentMinutes % 60;

      const timeString =
        `${String(hour).padStart(
          2,
          '0',
        )}:${String(minute).padStart(
          2,
          '0',
        )}:00`;

      slots.push(
        timeString,
      );
    }


    /*
     * Las citas pendientes de revisión también
     * bloquean el horario para evitar duplicados.
     */
    const booked =
      await sql`
        SELECT
          start_time

        FROM tblappointments

        WHERE appointment_date =
          ${dateStr}

          AND status NOT IN (
            'cancelled',
            'no_show'
          )
      `;


    const bookedSet =
      new Set(
        booked.map(
          bookedAppointment =>
            normalizeTimeValue(
              bookedAppointment.start_time,
            ),
        ),
      );


    const disabledHoursSet =
      new Set<string>();


    if (
      selectedException?.disabled_hours
    ) {
      let disabledHours =
        selectedException
          .disabled_hours;


      if (
        typeof disabledHours ===
          'string'
      ) {
        try {
          disabledHours =
            JSON.parse(
              disabledHours,
            );
        } catch {
          disabledHours =
            [];
        }
      }


      if (
        Array.isArray(
          disabledHours,
        )
      ) {
        disabledHours.forEach(
          (
            disabledHour: string,
          ) => {
            const normalizedHour =
              normalizeTimeValue(
                disabledHour,
              );

            if (
              normalizedHour
            ) {
              disabledHoursSet.add(
                normalizedHour,
              );
            }
          },
        );
      }
    }


    return slots.filter(
      slot =>
        !bookedSet.has(
          slot,
        ) &&
        !disabledHoursSet.has(
          slot,
        ),
    );
  } catch (error) {
    console.error(
      'Error al obtener horarios disponibles:',
      error,
    );

    return [];
  }
}


// ============================================================
// CREAR CITA CON COMPROBANTE
// ============================================================

export async function createPatientAppointment(
  input:
    | FormData
    | LegacyCreateAppointmentData,
): Promise<CreateAppointmentResult> {
  let uploadedPublicId:
    | string
    | null = null;


  try {
    const isFormDataInput =
      input instanceof FormData;


    const patientId =
      Number(
        isFormDataInput
          ? input.get(
              'patientId',
            )
          : input.patientId,
      );


    const appointmentDate =
      normalizeDateValue(
        isFormDataInput
          ? input.get(
              'appointmentDate',
            )
          : input.appointmentDate,
      );


    const startTime =
      normalizeTimeValue(
        isFormDataInput
          ? input.get(
              'startTime',
            )
          : input.startTime,
      );


    const notes =
      String(
        (
          isFormDataInput
            ? input.get(
                'notes',
              )
            : input.notes
        ) ?? '',
      )
        .trim()
        .slice(
          0,
          500,
        );


    const receiptValue =
      isFormDataInput
        ? input.get(
            'receipt',
          )
        : input.receipt;


    if (
      !Number.isInteger(
        patientId,
      ) ||
      patientId <= 0
    ) {
      return {
        success:
          false,

        message:
          'El paciente no es válido.',
      };
    }


    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        appointmentDate,
      )
    ) {
      return {
        success:
          false,

        message:
          'La fecha de la cita no es válida.',
      };
    }


    if (
      !startTime
    ) {
      return {
        success:
          false,

        message:
          'El horario de la cita no es válido.',
      };
    }


    if (
      !isFileValue(
        receiptValue,
      ) ||
      receiptValue.size <= 0
    ) {
      return {
        success:
          false,

        message:
          'Debes adjuntar el comprobante del anticipo.',
      };
    }


    if (
      !ALLOWED_RECEIPT_TYPES.has(
        receiptValue.type,
      )
    ) {
      return {
        success:
          false,

        message:
          'El comprobante debe ser una imagen JPG, PNG o WEBP.',
      };
    }


    if (
      receiptValue.size >
      MAX_RECEIPT_SIZE
    ) {
      return {
        success:
          false,

        message:
          'El comprobante no puede superar los 5 MB.',
      };
    }


    /*
     * El monto se obtiene directamente desde
     * PostgreSQL y no desde el navegador.
     */
    const [
      calendarSettings,
    ] =
      await sql`
        SELECT
          slot_duration,
          deposit_amount

        FROM tblcalendar_settings

        LIMIT 1
      `;


    const slotDuration =
      Number(
        calendarSettings
          ?.slot_duration ??
        30,
      );


    const depositAmount =
      Number(
        calendarSettings
          ?.deposit_amount ??
        100,
      );


    if (
      !Number.isFinite(
        depositAmount,
      ) ||
      depositAmount <= 0
    ) {
      return {
        success:
          false,

        message:
          'El monto del anticipo no está configurado correctamente.',
      };
    }


    /*
     * Verificar que el horario siga disponible.
     */
    const existingAppointment =
      await sql`
        SELECT
          id

        FROM tblappointments

        WHERE appointment_date =
          ${appointmentDate}

          AND start_time =
            ${startTime}

          AND status NOT IN (
            'cancelled',
            'no_show'
          )

        LIMIT 1
      `;


    if (
      existingAppointment.length >
      0
    ) {
      return {
        success:
          false,

        message:
          'Este horario ya no está disponible. Actualiza el calendario y selecciona otro.',
      };
    }


    const endTime =
      calculateEndTime(
        startTime,
        slotDuration,
      );


    const paymentReference =
      createPaymentReference(
        patientId,
        appointmentDate,
        startTime,
      );


    /*
     * Subir el comprobante a Cloudinary.
     */
    const uploadResult =
      await uploadPaymentReceipt(
        receiptValue,
        paymentReference,
      );


    uploadedPublicId =
      uploadResult.public_id;


    /*
     * La cita queda reservada, pero pendiente
     * de la aprobación de la nutrióloga.
     */
    const [
      createdAppointment,
    ] =
      await sql`
        INSERT INTO tblappointments (
          patient_id,
          appointment_date,
          start_time,
          end_time,
          deposit_paid,
          deposit_amount,
          notes,
          status,
          payment_status,
          payment_reference,
          payment_receipt_url,
          payment_receipt_public_id,
          payment_submitted_at
        )

        VALUES (
          ${patientId},
          ${appointmentDate},
          ${startTime},
          ${endTime},
          FALSE,
          ${depositAmount},
          ${notes || null},
          'pending_payment',
          'submitted',
          ${paymentReference},
          ${uploadResult.secure_url},
          ${uploadResult.public_id},
          NOW()
        )

        RETURNING
          id,
          payment_reference
      `;


    revalidateAppointmentPages();


    return {
      success:
        true,

      appointmentId:
        Number(
          createdAppointment.id,
        ),

      paymentReference:
        String(
          createdAppointment
            .payment_reference,
        ),

      depositAmount,

      message:
        'Comprobante enviado. La cita quedará confirmada cuando la nutrióloga apruebe el anticipo.',
    };
  } catch (error) {
    /*
     * Si la imagen se subió, pero PostgreSQL falló,
     * se elimina para evitar archivos huérfanos.
     */
    if (
      uploadedPublicId
    ) {
      try {
        await cloudinary
          .uploader
          .destroy(
            uploadedPublicId,
          );
      } catch (
        cleanupError
      ) {
        console.error(
          'No se pudo eliminar el comprobante después del error:',
          cleanupError,
        );
      }
    }


    console.error(
      'Error al crear cita:',
      error,
    );


    const serverError =
      error as {
        code?: string;

        message?: string;

        http_code?: number;

        name?: string;
      };


    /*
     * Restricción única de fecha y horario,
     * o referencia de pago repetida.
     */
    if (
      serverError.code ===
        '23505'
    ) {
      return {
        success:
          false,

        message:
          'Este horario acaba de ser reservado por otro paciente. Actualiza el calendario y selecciona otro.',
      };
    }


    /*
     * La base de datos de producción todavía
     * no contiene alguna de las columnas nuevas.
     */
    if (
      serverError.code ===
        '42703' ||
      serverError.code ===
        '42P01'
    ) {
      return {
        success:
          false,

        message:
          'La configuración del módulo de pagos no está completa en la base de datos de producción.',
      };
    }


    const errorMessage =
      error instanceof Error
        ? error.message
        : '';


    const normalizedErrorMessage =
      errorMessage.toLowerCase();


    /*
     * Errores de Cloudinary o credenciales.
     */
    const isCloudinaryError =
      serverError.http_code !==
        undefined ||

      normalizedErrorMessage.includes(
        'cloudinary',
      ) ||

      normalizedErrorMessage.includes(
        'api_key',
      ) ||

      normalizedErrorMessage.includes(
        'api secret',
      ) ||

      normalizedErrorMessage.includes(
        'upload',
      ) ||

      normalizedErrorMessage.includes(
        'must supply cloud_name',
      );


    if (
      isCloudinaryError
    ) {
      return {
        success:
          false,

        message:
          'No se pudo subir el comprobante. Revisa la configuración de Cloudinary en Vercel.',
      };
    }


    /*
     * Error de conexión con PostgreSQL.
     */
    const isDatabaseConnectionError =
      normalizedErrorMessage.includes(
        'connect',
      ) ||

      normalizedErrorMessage.includes(
        'connection',
      ) ||

      normalizedErrorMessage.includes(
        'timeout',
      ) ||

      normalizedErrorMessage.includes(
        'econnreset',
      ) ||

      normalizedErrorMessage.includes(
        'enotfound',
      );


    if (
      isDatabaseConnectionError
    ) {
      return {
        success:
          false,

        message:
          'No se pudo conectar con la base de datos. Intenta nuevamente en unos momentos.',
      };
    }


    /*
     * No se vuelve a lanzar el error. De esta forma
     * Next.js no muestra el cuadro genérico de producción.
     */
    return {
      success:
        false,

      message:
        errorMessage ||
        'No se pudo enviar la solicitud de cita.',
    };
  }
}


// ============================================================
// CANCELAR CITA
// ============================================================

export async function cancelAppointment(
  appointmentId: number,
  patientId: number,
) {
  try {
    const result =
      await sql`
        UPDATE tblappointments

        SET
          status =
            'cancelled',

          payment_status =
            CASE
              WHEN payment_status IN (
                'pending',
                'submitted'
              )
                THEN 'rejected'

              ELSE payment_status
            END,

          payment_review_notes =
            CASE
              WHEN payment_status IN (
                'pending',
                'submitted'
              )
                THEN 'Solicitud cancelada por el paciente.'

              ELSE payment_review_notes
            END,

          updated_at =
            NOW()

        WHERE id =
          ${appointmentId}

          AND patient_id =
            ${patientId}

        RETURNING
          id
      `;


    if (
      result.length ===
      0
    ) {
      throw new Error(
        'Cita no encontrada o no pertenece al paciente.',
      );
    }


    revalidateAppointmentPages();


    return {
      success:
        true,
    };
  } catch (error) {
    console.error(
      'Error al cancelar cita:',
      error,
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : 'No se pudo cancelar la cita.',
    );
  }
}


// ============================================================
// REAGENDAR CITA
// ============================================================

export async function rescheduleAppointment(
  appointmentId: number,
  patientId: number,
  newDate: Date,
  newStartTime: string,
) {
  try {
    const dateStr =
      normalizeDateValue(
        newDate,
      );

    const normalizedStartTime =
      normalizeTimeValue(
        newStartTime,
      );


    if (
      !dateStr ||
      !normalizedStartTime
    ) {
      throw new Error(
        'La fecha o el horario no son válidos.',
      );
    }


    const existing =
      await sql`
        SELECT
          id

        FROM tblappointments

        WHERE appointment_date =
          ${dateStr}

          AND start_time =
            ${normalizedStartTime}

          AND status NOT IN (
            'cancelled',
            'no_show'
          )

          AND id !=
            ${appointmentId}

        LIMIT 1
      `;


    if (
      existing.length >
      0
    ) {
      throw new Error(
        'El nuevo horario no está disponible.',
      );
    }


    const [
      settings,
    ] =
      await sql`
        SELECT
          slot_duration

        FROM tblcalendar_settings

        LIMIT 1
      `;


    const slotDuration =
      Number(
        settings
          ?.slot_duration ??
        30,
      );


    const endTime =
      calculateEndTime(
        normalizedStartTime,
        slotDuration,
      );


    /*
     * Se conserva el estado del pago.
     * Reagendar no aprueba automáticamente
     * una solicitud pendiente.
     */
    const result =
      await sql`
        UPDATE tblappointments

        SET
          appointment_date =
            ${dateStr},

          start_time =
            ${normalizedStartTime},

          end_time =
            ${endTime},

          updated_at =
            NOW()

        WHERE id =
          ${appointmentId}

          AND patient_id =
            ${patientId}

        RETURNING
          id
      `;


    if (
      result.length ===
      0
    ) {
      throw new Error(
        'Cita no encontrada o no pertenece al paciente.',
      );
    }


    revalidateAppointmentPages();


    return {
      success:
        true,
    };
  } catch (error) {
    console.error(
      'Error al reagendar cita:',
      error,
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : 'No se pudo reagendar la cita.',
    );
  }
}


// ============================================================
// OBTENER PACIENTE POR USUARIO
// ============================================================

export async function getPatientByUserId(
  userId: number,
) {
  try {
    const [
      patient,
    ] =
      await sql`
        SELECT
          p.*,

          u.email,

          u.username

        FROM tblpatients p

        INNER JOIN tblusers u
          ON u.id =
            p.user_id

        WHERE p.user_id =
          ${userId}

          AND p.active =
            TRUE
      `;

    return patient;
  } catch (error) {
    console.error(
      'Error al obtener paciente:',
      error,
    );

    return null;
  }
}