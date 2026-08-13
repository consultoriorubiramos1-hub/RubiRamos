"use server";

import postgres from "postgres";


const sql = postgres(
  process.env.POSTGRES_URL!,
  {
    ssl: "require",
  },
);


const LOCAL_ML_API_URL =
  "http://127.0.0.1:8000";

const PRODUCTION_ML_API_URL =
  "https://rubi-ramos-ml-api.vercel.app";


function getMlApiUrl(): string {
  const configuredUrl =
    process.env.ML_API_URL?.trim();

  const configuredUrlIsLocal =
    configuredUrl !== undefined &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(
      configuredUrl,
    );

  /*
   * En producción no debe utilizarse localhost,
   * porque apuntaría al servidor interno de Vercel.
   */
  if (
    process.env.NODE_ENV === "production" &&
    (
      !configuredUrl ||
      configuredUrlIsLocal
    )
  ) {
    return PRODUCTION_ML_API_URL;
  }

  /*
   * En desarrollo se respeta ML_API_URL.
   * Si no existe, utiliza la API local.
   */
  return (
    configuredUrl ||
    LOCAL_ML_API_URL
  ).replace(/\/+$/, "");
}


const ML_API_URL =
  getMlApiUrl();


export interface AttendancePrediction {
  no_show_probability: number;

  attendance_probability: number;

  no_show_percentage: number;

  attendance_percentage: number;

  risk_level:
    | "Bajo"
    | "Medio"
    | "Alto";

  predicted_no_show: number;

  prediction: string;

  target_name: string;

  model_name: string;
}


interface PredictionResult {
  success: boolean;

  message: string;

  prediction?: AttendancePrediction;
}


interface ApiErrorResponse {
  detail?: string;

  message?: string;
}


function numberValue(
  value: unknown,
): number {
  const convertedValue =
    Number(value);

  return Number.isFinite(
    convertedValue,
  )
    ? convertedValue
    : 0;
}


/**
 * Redondea un porcentaje a dos decimales,
 * igual que el dataset utilizado para entrenar.
 */
function roundPercentage(
  value: number,
): number {
  return Math.round(
    value * 100,
  ) / 100;
}


/**
 * Calcula el porcentaje histórico de un estado.
 *
 * Cuando el paciente no tiene citas anteriores,
 * devuelve 0.
 */
function calculateHistoryPercentage(
  statusCount: number,
  totalPreviousAppointments: number,
): number {
  if (
    totalPreviousAppointments <= 0
  ) {
    return 0;
  }

  return roundPercentage(
    (
      statusCount /
      totalPreviousAppointments
    ) * 100,
  );
}


function isAttendancePrediction(
  value: unknown,
): value is AttendancePrediction {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const prediction =
    value as
      Partial<AttendancePrediction>;

  return (
    typeof prediction
      .no_show_probability ===
      "number" &&

    typeof prediction
      .attendance_probability ===
      "number" &&

    typeof prediction
      .no_show_percentage ===
      "number" &&

    typeof prediction
      .attendance_percentage ===
      "number" &&

    (
      prediction.risk_level ===
        "Bajo" ||

      prediction.risk_level ===
        "Medio" ||

      prediction.risk_level ===
        "Alto"
    ) &&

    typeof prediction
      .predicted_no_show ===
      "number" &&

    typeof prediction
      .prediction ===
      "string" &&

    typeof prediction
      .target_name ===
      "string" &&

    typeof prediction
      .model_name ===
      "string"
  );
}


/**
 * Obtiene la información de una cita,
 * transforma el historial del paciente
 * en porcentajes y consulta la API ML.
 */
export async function predictAppointmentAttendance(
  appointmentId: number,
): Promise<PredictionResult> {
  try {
    if (
      !Number.isInteger(
        appointmentId,
      ) ||
      appointmentId <= 0
    ) {
      return {
        success: false,

        message:
          "El identificador de la cita no es válido.",
      };
    }


    const [appointment] = await sql`
      SELECT
        a.id,
        a.patient_id,
        a.status,
        a.appointment_date,
        a.start_time,

        EXTRACT(
          YEAR FROM AGE(
            a.appointment_date,
            p.fecha_nacimiento
          )
        )::integer AS age,

        EXTRACT(
          MONTH FROM a.appointment_date
        )::integer AS appointment_month,

        EXTRACT(
          DAY FROM a.appointment_date
        )::integer
          AS appointment_day_of_month,

        COUNT(previous.id) FILTER (
          WHERE previous.status = 'completed'
        )::integer AS previous_completed,

        COUNT(previous.id) FILTER (
          WHERE previous.status = 'no_show'
        )::integer AS previous_no_show,

        COUNT(previous.id) FILTER (
          WHERE previous.status = 'cancelled'
        )::integer AS previous_cancelled

      FROM tblappointments a

      INNER JOIN tblpatients p
        ON p.id = a.patient_id

      LEFT JOIN tblappointments previous
        ON previous.patient_id =
          a.patient_id

        AND (
          previous.appointment_date <
            a.appointment_date

          OR (
            previous.appointment_date =
              a.appointment_date

            AND previous.start_time <
              a.start_time
          )

          OR (
            previous.appointment_date =
              a.appointment_date

            AND previous.start_time =
              a.start_time

            AND previous.id < a.id
          )
        )

      WHERE a.id = ${appointmentId}

        AND p.fecha_nacimiento
          IS NOT NULL

        AND a.appointment_date >=
          p.fecha_nacimiento

      GROUP BY
        a.id,
        a.patient_id,
        a.status,
        a.appointment_date,
        a.start_time,
        p.fecha_nacimiento

      LIMIT 1
    `;


    if (!appointment) {
      return {
        success: false,

        message:
          "No se encontró la cita o el paciente no tiene una fecha de nacimiento válida.",
      };
    }


    const previousCompleted =
      numberValue(
        appointment
          .previous_completed,
      );

    const previousNoShow =
      numberValue(
        appointment
          .previous_no_show,
      );

    const previousCancelled =
      numberValue(
        appointment
          .previous_cancelled,
      );


    const totalPreviousAppointments =
      previousCompleted +
      previousNoShow +
      previousCancelled;


    const previousCompletedPercentage =
      calculateHistoryPercentage(
        previousCompleted,
        totalPreviousAppointments,
      );

    const previousNoShowPercentage =
      calculateHistoryPercentage(
        previousNoShow,
        totalPreviousAppointments,
      );

    const previousCancelledPercentage =
      calculateHistoryPercentage(
        previousCancelled,
        totalPreviousAppointments,
      );


    /*
     * Estas son exactamente las seis
     * variables utilizadas durante
     * el entrenamiento del modelo.
     */
    const requestBody = {
      age:
        numberValue(
          appointment.age,
        ),

      appointment_month:
        numberValue(
          appointment
            .appointment_month,
        ),

      appointment_day_of_month:
        numberValue(
          appointment
            .appointment_day_of_month,
        ),

      previous_completed_percentage:
        previousCompletedPercentage,

      previous_no_show_percentage:
        previousNoShowPercentage,

      previous_cancelled_percentage:
        previousCancelledPercentage,
    };


    console.log(
      "Consultando API de Machine Learning:",
      ML_API_URL,
    );

    console.log(
      "Variables enviadas al modelo:",
      requestBody,
    );

    console.log(
      "Historial anterior de la cita:",
      {
        previousCompleted,
        previousNoShow,
        previousCancelled,
        totalPreviousAppointments,
      },
    );


    const controller =
      new AbortController();

    /*
     * Se permiten 20 segundos debido
     * a posibles arranques en frío
     * de la función de Vercel.
     */
    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        20_000,
      );


    let response: Response;

    try {
      response = await fetch(
        `${ML_API_URL}/predict`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify(
              requestBody,
            ),

          cache:
            "no-store",

          signal:
            controller.signal,
        },
      );
    } finally {
      clearTimeout(
        timeout,
      );
    }


    if (!response.ok) {
      const responseText =
        await response.text();

      console.error(
        "Respuesta incorrecta de la API ML:",
        {
          url:
            `${ML_API_URL}/predict`,

          status:
            response.status,

          response:
            responseText,
        },
      );

      let apiMessage =
        "La API de predicción no pudo procesar la cita.";

      try {
        const parsedError =
          JSON.parse(
            responseText,
          ) as ApiErrorResponse;

        apiMessage =
          parsedError.detail ||
          parsedError.message ||
          apiMessage;
      } catch {
        // La API no devolvió JSON.
      }

      return {
        success: false,

        message:
          apiMessage,
      };
    }


    const responseData: unknown =
      await response.json();


    if (
      !isAttendancePrediction(
        responseData,
      )
    ) {
      console.error(
        "La API devolvió una respuesta inválida:",
        responseData,
      );

      return {
        success: false,

        message:
          "La API de predicción devolvió una respuesta inválida.",
      };
    }


    return {
      success: true,

      message:
        "La predicción se generó correctamente.",

      prediction:
        responseData,
    };
  } catch (error) {
    console.error(
      "Error al predecir la asistencia:",
      error,
    );


    const isAbortError =
      error instanceof Error &&
      error.name ===
        "AbortError";


    const isConnectionError =
      error instanceof Error &&
      (
        error.message.includes(
          "fetch failed",
        ) ||

        error.message.includes(
          "ECONNREFUSED",
        ) ||

        error.message.includes(
          "ENOTFOUND",
        )
      );


    if (isAbortError) {
      return {
        success: false,

        message:
          "La API de predicción tardó demasiado en responder.",
      };
    }


    if (isConnectionError) {
      return {
        success: false,

        message:
          "No se pudo conectar con la API de Machine Learning.",
      };
    }


    return {
      success: false,

      message:
        "No se pudo generar la predicción de asistencia.",
    };
  }
}