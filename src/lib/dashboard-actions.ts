'use server';

import postgres from 'postgres';

import {
  predictAppointmentAttendance,
} from './ml-prediction-actions';


const sql = postgres(
  process.env.POSTGRES_URL!,
  {
    ssl: 'require',
  },
);


const DASHBOARD_TIME_ZONE =
  'America/Mexico_City';


type RiskLevel =
  | 'Bajo'
  | 'Medio'
  | 'Alto';


/**
 * Obtiene la fecha actual de México sin depender
 * de la zona horaria del servidor de Vercel.
 */
function getMexicoDateParts(
  date: Date = new Date(),
) {
  const formatter =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone:
          DASHBOARD_TIME_ZONE,

        year:
          'numeric',

        month:
          '2-digit',

        day:
          '2-digit',
      },
    );

  const parts =
    formatter.formatToParts(
      date,
    );

  const year =
    Number(
      parts.find(
        part =>
          part.type === 'year',
      )?.value,
    );

  const month =
    Number(
      parts.find(
        part =>
          part.type === 'month',
      )?.value,
    );

  const day =
    Number(
      parts.find(
        part =>
          part.type === 'day',
      )?.value,
    );

  return {
    year,
    month,
    day,
  };
}


/**
 * Convierte una fecha a YYYY-MM-DD.
 */
function formatIsoDate(
  date: Date,
): string {
  const year =
    date.getUTCFullYear();

  const month =
    String(
      date.getUTCMonth() + 1,
    ).padStart(
      2,
      '0',
    );

  const day =
    String(
      date.getUTCDate(),
    ).padStart(
      2,
      '0',
    );

  return `${year}-${month}-${day}`;
}


/**
 * Convierte una fecha proveniente de PostgreSQL
 * a una cadena YYYY-MM-DD.
 */
function normalizeDatabaseDate(
  value: unknown,
): string {
  if (
    value instanceof Date
  ) {
    return value
      .toISOString()
      .slice(
        0,
        10,
      );
  }

  const textValue =
    String(
      value ?? '',
    );

  const dateMatch =
    textValue.match(
      /^\d{4}-\d{2}-\d{2}/,
    );

  return (
    dateMatch?.[0] ||
    textValue
  );
}


/**
 * Genera el nombre completo sin espacios duplicados.
 */
function buildPatientName(
  firstName: unknown,
  secondName: unknown,
  firstLastname: unknown,
  secondLastname: unknown,
): string {
  return [
    firstName,
    secondName,
    firstLastname,
    secondLastname,
  ]
    .filter(
      value =>
        typeof value ===
          'string' &&
        value.trim().length > 0,
    )
    .join(
      ' ',
    )
    .replace(
      /\s+/g,
      ' ',
    )
    .trim();
}


/**
 * Recomendación mostrada automáticamente
 * según el nivel de riesgo.
 */
function getRiskRecommendation(
  riskLevel: RiskLevel,
): string {
  if (
    riskLevel === 'Alto'
  ) {
    return (
      'Confirmar asistencia mediante WhatsApp o llamada.'
    );
  }

  if (
    riskLevel === 'Medio'
  ) {
    return (
      'Enviar un recordatorio adicional al paciente.'
    );
  }

  return (
    'Mantener el seguimiento normal de la cita.'
  );
}


export async function getDashboardStats() {
  try {
    // ======================================================
    // FECHAS DEL DASHBOARD
    // ======================================================

    const todayParts =
      getMexicoDateParts();

    const todayDate =
      new Date(
        Date.UTC(
          todayParts.year,
          todayParts.month - 1,
          todayParts.day,
        ),
      );

    const todayStr =
      formatIsoDate(
        todayDate,
      );


    // Lunes de la semana actual.
    const startOfWeek =
      new Date(
        todayDate,
      );

    const currentDay =
      todayDate.getUTCDay();

    const differenceToMonday =
      currentDay === 0
        ? 6
        : currentDay - 1;

    startOfWeek.setUTCDate(
      todayDate.getUTCDate() -
        differenceToMonday,
    );

    const startOfWeekStr =
      formatIsoDate(
        startOfWeek,
      );


    // Domingo de la semana actual.
    const endOfWeek =
      new Date(
        startOfWeek,
      );

    endOfWeek.setUTCDate(
      startOfWeek.getUTCDate() +
        6,
    );

    const endOfWeekStr =
      formatIsoDate(
        endOfWeek,
      );


    const startOfMonth =
      new Date(
        Date.UTC(
          todayParts.year,
          todayParts.month - 1,
          1,
        ),
      );

    const startOfMonthStr =
      formatIsoDate(
        startOfMonth,
      );


    const endOfMonth =
      new Date(
        Date.UTC(
          todayParts.year,
          todayParts.month,
          0,
        ),
      );

    const endOfMonthStr =
      formatIsoDate(
        endOfMonth,
      );


    // ======================================================
    // TARJETAS PRINCIPALES
    // ======================================================

    const [todayAppointments] =
      await sql`
        SELECT
          COUNT(*) AS count

        FROM tblappointments

        WHERE appointment_date =
          ${todayStr}

          AND status NOT IN (
            'cancelled',
            'no_show'
          )
      `;


    const [weeklyAppointments] =
      await sql`
        SELECT
          COUNT(*) AS count

        FROM tblappointments

        WHERE appointment_date >=
          ${startOfWeekStr}

          AND appointment_date <=
            ${endOfWeekStr}

          AND status NOT IN (
            'cancelled',
            'no_show'
          )
      `;


    const [totalPatients] =
      await sql`
        SELECT
          COUNT(*) AS count

        FROM tblpatients

        WHERE active = TRUE
      `;


    const [newPatientsMonth] =
      await sql`
        SELECT
          COUNT(*) AS count

        FROM tblpatients

        WHERE created_at::date >=
          ${startOfMonthStr}

          AND created_at::date <=
            ${endOfMonthStr}
      `;


    const [completionRate] =
      await sql`
        SELECT
          ROUND(
            COUNT(*) FILTER (
              WHERE status =
                'completed'
            )::decimal
            /
            NULLIF(
              COUNT(*) FILTER (
                WHERE status IN (
                  'scheduled',
                  'completed'
                )
              ),
              0
            )
            * 100,
            1
          ) AS rate

        FROM tblappointments

        WHERE created_at >=
          NOW() -
          INTERVAL '30 days'
      `;


    // ======================================================
    // PRÓXIMA CITA
    // ======================================================

    const [nextAppointment] =
      await sql`
        SELECT
          a.*,

          p.first_name,
          p.second_name,
          p.first_lastname,
          p.second_lastname

        FROM tblappointments a

        INNER JOIN tblpatients p
          ON p.id =
            a.patient_id

        WHERE a.appointment_date >=
          ${todayStr}

          AND a.status =
            'scheduled'

        ORDER BY
          a.appointment_date,
          a.start_time

        LIMIT 1
      `;


    // ======================================================
    // CITAS DE HOY
    // Se mantiene para que el dashboard actual siga
    // funcionando mientras cambiamos el componente visual.
    // ======================================================

    const todayAppointmentsList =
      await sql`
        SELECT
          a.*,

          p.first_name,
          p.second_name,
          p.first_lastname,
          p.second_lastname,

          p.phone,
          u.email

        FROM tblappointments a

        INNER JOIN tblpatients p
          ON p.id =
            a.patient_id

        INNER JOIN tblusers u
          ON u.id =
            p.user_id

        WHERE a.appointment_date =
          ${todayStr}

          AND a.status NOT IN (
            'cancelled',
            'no_show'
          )

        ORDER BY
          a.start_time
      `;


    // ======================================================
    // CITAS PRÓXIMAS DE LA SEMANA
    // Solo incluye citas programadas desde hoy hasta
    // el domingo. Estas recibirán predicción automática.
    // ======================================================

    const weeklyAppointmentsRows =
      await sql`
        SELECT
          a.id,

          a.patient_id,

          a.appointment_date,

          a.start_time,

          a.end_time,

          a.status,

          a.notes,

          p.first_name,

          p.second_name,

          p.first_lastname,

          p.second_lastname,

          p.phone,

          u.email

        FROM tblappointments a

        INNER JOIN tblpatients p
          ON p.id =
            a.patient_id

        INNER JOIN tblusers u
          ON u.id =
            p.user_id

        WHERE a.appointment_date >=
          ${todayStr}

          AND a.appointment_date <=
            ${endOfWeekStr}

          AND a.status =
            'scheduled'

        ORDER BY
          a.appointment_date,
          a.start_time
      `;


    /*
     * Ejecuta las predicciones en paralelo.
     * Si una predicción falla, la cita continúa
     * apareciendo en el dashboard.
     */
    const weeklyAppointmentsList =
      await Promise.all(
        weeklyAppointmentsRows.map(
          async appointment => {
            const appointmentId =
              Number(
                appointment.id,
              );

            const predictionResult =
              await predictAppointmentAttendance(
                appointmentId,
              );

            const prediction =
              predictionResult.success
                ? predictionResult.prediction
                : undefined;

            const recommendation =
              prediction
                ? getRiskRecommendation(
                    prediction.risk_level,
                  )
                : (
                    'No fue posible calcular el riesgo de esta cita.'
                  );

            return {
              id:
                appointmentId,

              patientId:
                Number(
                  appointment.patient_id,
                ),

              appointmentDate:
                normalizeDatabaseDate(
                  appointment
                    .appointment_date,
                ),

              time:
                String(
                  appointment.start_time,
                ).slice(
                  0,
                  5,
                ),

              endTime:
                appointment.end_time
                  ? String(
                      appointment.end_time,
                    ).slice(
                      0,
                      5,
                    )
                  : null,

              patientName:
                buildPatientName(
                  appointment.first_name,
                  appointment.second_name,
                  appointment.first_lastname,
                  appointment.second_lastname,
                ),

              phone:
                appointment.phone
                  ? String(
                      appointment.phone,
                    )
                  : '',

              email:
                appointment.email
                  ? String(
                      appointment.email,
                    )
                  : '',

              type:
                appointment.notes ||
                'Consulta nutricional',

              status:
                'scheduled',

              prediction:
                prediction || null,

              predictionAvailable:
                Boolean(
                  prediction,
                ),

              predictionMessage:
                predictionResult.message,

              recommendation,
            };
          },
        ),
      );


    // ======================================================
    // PACIENTES RECIENTES
    // ======================================================

    const recentPatients =
      await sql`
        SELECT
          p.*,
          u.email

        FROM tblpatients p

        INNER JOIN tblusers u
          ON u.id =
            p.user_id

        WHERE p.active = TRUE

        ORDER BY
          p.created_at DESC

        LIMIT 5
      `;


    // ======================================================
    // GRÁFICA SEMANAL
    // ======================================================

    const weeklyStats =
      await sql`
        SELECT
          EXTRACT(
            DOW
            FROM appointment_date
          )::integer AS day_of_week,

          COUNT(*) AS count

        FROM tblappointments

        WHERE appointment_date >=
          ${startOfWeekStr}

          AND appointment_date <=
            ${endOfWeekStr}

          AND status NOT IN (
            'cancelled',
            'no_show'
          )

        GROUP BY
          EXTRACT(
            DOW
            FROM appointment_date
          )
      `;


    const daysMap: {
      [key: number]: string;
    } = {
      1: 'Lun',
      2: 'Mar',
      3: 'Mié',
      4: 'Jue',
      5: 'Vie',
      6: 'Sáb',
      0: 'Dom',
    };


    const weeklyStatsFormatted =
      weeklyStats.map(
        statistic => ({
          day:
            daysMap[
              Number(
                statistic.day_of_week,
              )
            ],

          appointments:
            Number(
              statistic.count,
            ),
        }),
      );


    const allDays = [
      'Lun',
      'Mar',
      'Mié',
      'Jue',
      'Vie',
      'Sáb',
      'Dom',
    ];


    const finalWeeklyStats =
      allDays.map(
        dayName => {
          const statistic =
            weeklyStatsFormatted.find(
              item =>
                item.day ===
                dayName,
            );

          return {
            day:
              dayName,

            appointments:
              statistic
                ? statistic.appointments
                : 0,
          };
        },
      );


    // ======================================================
    // RESPUESTA
    // ======================================================

    return {
      todayAppointments:
        Number(
          todayAppointments.count,
        ),

      weeklyAppointments:
        Number(
          weeklyAppointments.count,
        ),

      totalPatients:
        Number(
          totalPatients.count,
        ),

      newPatientsMonth:
        Number(
          newPatientsMonth.count,
        ),

      completionRate:
        Number(
          completionRate?.rate ||
          0,
        ),

      nextAppointment:
        nextAppointment
          ? {
              id:
                Number(
                  nextAppointment.id,
                ),

              patientName:
                buildPatientName(
                  nextAppointment.first_name,
                  nextAppointment.second_name,
                  nextAppointment.first_lastname,
                  nextAppointment.second_lastname,
                ),

              date:
                normalizeDatabaseDate(
                  nextAppointment
                    .appointment_date,
                ),

              time:
                String(
                  nextAppointment.start_time,
                ).slice(
                  0,
                  5,
                ),

              type:
                nextAppointment.notes ||
                'Consulta nutricional',

              duration:
                '30 min',
            }
          : null,

      todayAppointmentsList:
        todayAppointmentsList.map(
          appointment => ({
            id:
              Number(
                appointment.id,
              ),

            time:
              String(
                appointment.start_time,
              ).slice(
                0,
                5,
              ),

            patientName:
              buildPatientName(
                appointment.first_name,
                appointment.second_name,
                appointment.first_lastname,
                appointment.second_lastname,
              ),

            status:
              appointment.status ===
                'completed'
                ? 'completado'
                : 'pendiente',
          }),
        ),

      /*
       * Nueva lista que usaremos en el componente.
       */
      weeklyAppointmentsList,

      recentPatients:
        recentPatients.map(
          patient => ({
            id:
              Number(
                patient.id,
              ),

            name:
              buildPatientName(
                patient.first_name,
                patient.second_name,
                patient.first_lastname,
                patient.second_lastname,
              ),

            lastVisit:
              patient.updated_at
                ? new Date(
                    patient.updated_at,
                  ).toLocaleDateString(
                    'es-MX',
                    {
                      timeZone:
                        DASHBOARD_TIME_ZONE,
                    },
                  )
                : 'Sin visitas',

            status:
              'Activo',
          }),
        ),

      weeklyStats:
        finalWeeklyStats,
    };
  } catch (error) {
    console.error(
      'Error al obtener estadísticas del dashboard:',
      error,
    );

    return {
      todayAppointments:
        0,

      weeklyAppointments:
        0,

      totalPatients:
        0,

      newPatientsMonth:
        0,

      completionRate:
        0,

      nextAppointment:
        null,

      todayAppointmentsList:
        [],

      weeklyAppointmentsList:
        [],

      recentPatients:
        [],

      weeklyStats: [
        {
          day: 'Lun',
          appointments: 0,
        },
        {
          day: 'Mar',
          appointments: 0,
        },
        {
          day: 'Mié',
          appointments: 0,
        },
        {
          day: 'Jue',
          appointments: 0,
        },
        {
          day: 'Vie',
          appointments: 0,
        },
        {
          day: 'Sáb',
          appointments: 0,
        },
        {
          day: 'Dom',
          appointments: 0,
        },
      ],
    };
  }
}