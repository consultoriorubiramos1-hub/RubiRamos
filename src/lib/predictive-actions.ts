'use server';

import postgres from 'postgres';

const sql = postgres(
  process.env.POSTGRES_URL!,
  {
    ssl: 'require',
  },
);

const WEIGHT_API_URL =
  process.env.WEIGHT_ML_API_URL?.trim()
  || 'https://rubi-ramos-weight-api.vercel.app';

const API_TIMEOUT_MS = 20_000;

type GoalCategory =
  | 'gain'
  | 'lose'
  | 'maintain';

type NormalizedGender =
  | 'male'
  | 'female'
  | 'other';

interface WeightHistoryItem {
  evaluationId: number;
  date: string;

  weight: number;

  bodyFat: number | null;
  visceralFat: number | null;
  muscle: number | null;
  totalWater: number | null;
  waist: number | null;
  height: number | null;

  nextAppointmentDate: string | null;
}

interface WeightPredictionInput {
  age: number;
  gender: NormalizedGender;
  goal_category: GoalCategory;

  current_weight: number;
  current_bmi: number;
  previous_weight_change: number;

  days_since_previous: number;
  days_until_next: number;

  body_fat_percentage: number;
  visceral_fat_percentage: number;
  muscle_percentage: number;
  total_water_percentage: number;
  waist_circumference: number;
}

interface WeightPredictionResponse {
  current_weight: number;

  predicted_weight_change: number;
  predicted_next_weight: number;

  tendency: string;
  interpretation: string;

  estimated_average_error_kg: number | null;

  model_name: string;
  model_version?: string;

  features_used: string[];
  input_received?: Record<string, unknown>;

  warning: string;
}

interface PredictionApiError {
  detail?: string;
  message?: string;
}


/**
 * Convierte un valor desconocido a número.
 */
function toNullableNumber(
  value: unknown,
): number | null {
  if (
    value === null
    || value === undefined
    || value === ''
  ) {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : null;
}


/**
 * Convierte un valor desconocido a texto.
 */
function toText(
  value: unknown,
): string {
  if (
    value === null
    || value === undefined
  ) {
    return '';
  }

  return String(value).trim();
}


/**
 * Convierte una fecha a ISO.
 */
function toIsoDate(
  value: unknown,
): string | null {
  if (
    value === null
    || value === undefined
    || value === ''
  ) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(String(value));

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date.toISOString();
}


/**
 * Convierte la estatura a centímetros.
 *
 * Ejemplos:
 * 1.60 -> 160 cm
 * 160  -> 160 cm
 */
function normalizeHeightToCentimeters(
  height: number | null,
): number | null {
  if (
    height === null
    || height <= 0
  ) {
    return null;
  }

  if (
    height >= 1
    && height <= 3
  ) {
    return height * 100;
  }

  if (
    height > 3
    && height <= 300
  ) {
    return height;
  }

  return null;
}


/**
 * Normaliza texto para comparar objetivos.
 */
function normalizeText(
  value: unknown,
): string {
  return toText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .replace(/\s+/g, ' ');
}


/**
 * Normaliza el género al formato usado por la API.
 */
function normalizeGender(
  value: unknown,
): NormalizedGender {
  const gender = normalizeText(value);

  if (
    [
      'm',
      'male',
      'masculino',
      'hombre',
    ].includes(gender)
  ) {
    return 'male';
  }

  if (
    [
      'f',
      'female',
      'femenino',
      'mujer',
    ].includes(gender)
  ) {
    return 'female';
  }

  return 'other';
}


/**
 * Clasifica el objetivo nutricional.
 */
function classifyGoal(
  value: unknown,
): GoalCategory {
  const goal = normalizeText(value);

  const gainKeywords = [
    'aumentar',
    'incrementar',
    'subir',
    'ganar peso',
    'ganancia de peso',
    'recuperar peso',
    'masa muscular',
    'ganancia muscular',
    'increase weight',
    'weight gain',
    'gain weight',
  ];

  const loseKeywords = [
    'bajar',
    'disminuir',
    'reducir',
    'perder peso',
    'perdida de peso',
    'reducir grasa',
    'disminuir grasa',
    'perder grasa',
    'adelgazar',
    'decrease weight',
    'weight loss',
    'lose weight',
  ];

  const maintainKeywords = [
    'mantener',
    'mantenimiento',
    'peso saludable',
    'composicion corporal',
    'mejorar habitos',
    'estar saludable',
    'maintain',
    'healthy weight',
  ];

  if (
    gainKeywords.some(
      (keyword) =>
        goal.includes(keyword),
    )
  ) {
    return 'gain';
  }

  if (
    loseKeywords.some(
      (keyword) =>
        goal.includes(keyword),
    )
  ) {
    return 'lose';
  }

  if (
    maintainKeywords.some(
      (keyword) =>
        goal.includes(keyword),
    )
  ) {
    return 'maintain';
  }

  return 'maintain';
}


/**
 * Calcula la edad en la fecha de evaluación.
 */
function calculateAgeAtDate(
  birthDateValue: unknown,
  referenceDateValue: string,
  registeredAge: number | null,
): number | null {
  const birthDateIso =
    toIsoDate(birthDateValue);

  if (!birthDateIso) {
    return registeredAge;
  }

  const birthDate =
    new Date(birthDateIso);

  const referenceDate =
    new Date(referenceDateValue);

  if (
    Number.isNaN(
      birthDate.getTime(),
    )
    || Number.isNaN(
      referenceDate.getTime(),
    )
  ) {
    return registeredAge;
  }

  let age =
    referenceDate.getUTCFullYear()
    - birthDate.getUTCFullYear();

  const referenceMonth =
    referenceDate.getUTCMonth();

  const birthMonth =
    birthDate.getUTCMonth();

  const referenceDay =
    referenceDate.getUTCDate();

  const birthDay =
    birthDate.getUTCDate();

  if (
    referenceMonth < birthMonth
    || (
      referenceMonth === birthMonth
      && referenceDay < birthDay
    )
  ) {
    age -= 1;
  }

  if (
    age < 0
    || age > 120
  ) {
    return registeredAge;
  }

  return age;
}


/**
 * Calcula días entre dos fechas.
 */
function calculateDaysBetween(
  previousDate: string,
  currentDate: string,
): number {
  const previous =
    new Date(previousDate);

  const current =
    new Date(currentDate);

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  const difference =
    Math.round(
      (
        current.getTime()
        - previous.getTime()
      )
      / millisecondsPerDay,
    );

  return difference;
}


/**
 * Limita el intervalo al rango utilizado
 * durante el entrenamiento.
 */
function normalizeIntervalDays(
  days: number,
): number {
  if (!Number.isFinite(days)) {
    return 30;
  }

  return Math.min(
    Math.max(
      Math.round(days),
      7,
    ),
    180,
  );
}


/**
 * Calcula los días estimados hasta
 * la siguiente evaluación.
 */
function calculateDaysUntilNext(
  currentDate: string,
  nextAppointmentDate: string | null,
  previousInterval: number,
): number {
  if (nextAppointmentDate) {
    const plannedInterval =
      calculateDaysBetween(
        currentDate,
        nextAppointmentDate,
      );

    if (
      plannedInterval >= 7
      && plannedInterval <= 180
    ) {
      return plannedInterval;
    }
  }

  return normalizeIntervalDays(
    previousInterval,
  );
}


/**
 * Construye el nombre completo.
 */
function buildPatientName(
  patient: Record<string, unknown>,
): string {
  return [
    patient.first_name,
    patient.second_name,
    patient.first_lastname,
    patient.second_lastname,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
    .replace(/\s+/g, ' ');
}


/**
 * Solicita la predicción a la API.
 */
async function requestWeightPrediction(
  input: WeightPredictionInput,
): Promise<WeightPredictionResponse> {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      API_TIMEOUT_MS,
    );

  try {
    const baseUrl =
      WEIGHT_API_URL.replace(
        /\/+$/,
        '',
      );

    const response =
      await fetch(
        `${baseUrl}/predict`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json',
          },

          body:
            JSON.stringify(input),

          cache:
            'no-store',

          signal:
            controller.signal,
        },
      );

    let responseBody:
      | WeightPredictionResponse
      | PredictionApiError;

    try {
      responseBody =
        await response.json();
    } catch {
      throw new Error(
        'La API devolvió una respuesta inválida.',
      );
    }

    if (!response.ok) {
      const apiError =
        responseBody as PredictionApiError;

      throw new Error(
        apiError.detail
        || apiError.message
        || (
          'La API respondió con código '
          + response.status
        ),
      );
    }

    return responseBody as WeightPredictionResponse;
  } catch (error) {
    if (
      error instanceof Error
      && error.name === 'AbortError'
    ) {
      throw new Error(
        'La API de predicción tardó demasiado en responder.',
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}


/**
 * Obtiene el historial antropométrico
 * y el objetivo del paciente.
 */
export async function getPatientWeightData(
  patientId: number,
) {
  try {
    if (
      !Number.isInteger(patientId)
      || patientId <= 0
    ) {
      throw new Error(
        'El identificador del paciente no es válido.',
      );
    }

    const weightRows =
      await sql`
        SELECT
          ce.id AS evaluation_id,
          ce.evaluation_date,

          ant.weight,
          ant.height,

          ant.body_fat_percentage,
          ant.visceral_fat_percentage,
          ant.muscle_percentage,
          ant.total_water_percentage,
          ant.waist_circumference,

          fu.next_appointment_date

        FROM tblclinical_evaluations ce

        INNER JOIN tblanthropometric ant
          ON ant.evaluation_id = ce.id

        LEFT JOIN tblfollow_up fu
          ON fu.evaluation_id = ce.id

        WHERE ce.patient_id = ${patientId}
          AND ce.evaluation_type = 'followup'
          AND ce.evaluation_date IS NOT NULL
          AND ant.weight IS NOT NULL

        ORDER BY
          ce.evaluation_date ASC,
          ce.id ASC
      `;

    const [patient] =
      await sql`
        SELECT
          p.id,
          p.first_name,
          p.second_name,
          p.first_lastname,
          p.second_lastname,

          p.age,
          p.gender,
          p.fecha_nacimiento,

          u.email,
          u.username,

          COALESCE(
            (
              SELECT cr.main_goal

              FROM tblclinical_evaluations initial_ce

              INNER JOIN tblconsultation_reason cr
                ON cr.evaluation_id = initial_ce.id

              WHERE initial_ce.patient_id = p.id
                AND initial_ce.evaluation_type = 'initial'

              ORDER BY
                initial_ce.evaluation_date DESC NULLS LAST,
                initial_ce.id DESC

              LIMIT 1
            ),
            ''
          ) AS main_goal

        FROM tblpatients p

        INNER JOIN tblusers u
          ON u.id = p.user_id

        WHERE p.id = ${patientId}

        LIMIT 1
      `;

    if (!patient) {
      throw new Error(
        'No se encontró al paciente solicitado.',
      );
    }

    const weightHistory:
      WeightHistoryItem[] =
      weightRows
        .map((row) => {
          const evaluationDate =
            toIsoDate(
              row.evaluation_date,
            );

          if (!evaluationDate) {
            return null;
          }

          const weight =
            toNullableNumber(
              row.weight,
            );

          if (weight === null) {
            return null;
          }

          return {
            evaluationId:
              Number(
                row.evaluation_id,
              ),

            date:
              evaluationDate,

            weight,

            bodyFat:
              toNullableNumber(
                row.body_fat_percentage,
              ),

            visceralFat:
              toNullableNumber(
                row.visceral_fat_percentage,
              ),

            muscle:
              toNullableNumber(
                row.muscle_percentage,
              ),

            totalWater:
              toNullableNumber(
                row.total_water_percentage,
              ),

            waist:
              toNullableNumber(
                row.waist_circumference,
              ),

            height:
              toNullableNumber(
                row.height,
              ),

            nextAppointmentDate:
              toIsoDate(
                row.next_appointment_date,
              ),
          };
        })
        .filter(
          (
            record,
          ): record is WeightHistoryItem =>
            record !== null,
        );

    const latestHeightRecord =
      [...weightHistory]
        .reverse()
        .find(
          (record) =>
            record.height !== null,
        );

    const heightCentimeters =
      normalizeHeightToCentimeters(
        latestHeightRecord?.height
        ?? null,
      );

    const mainGoal =
      toText(
        patient.main_goal,
      );

    const goalCategory =
      classifyGoal(mainGoal);

    return {
      initialWeight:
        weightHistory[0]?.weight
        ?? null,

      initialDate:
        weightHistory[0]?.date
        ?? null,

      weightHistory,

      patient: {
        id:
          Number(patient.id),

        nombre_completo:
          buildPatientName(
            patient,
          ),

        height:
          heightCentimeters,

        registeredAge:
          toNullableNumber(
            patient.age,
          ),

        birthDate:
          toIsoDate(
            patient.fecha_nacimiento,
          ),

        gender:
          normalizeGender(
            patient.gender,
          ),

        goalText:
          mainGoal,

        goalCategory,

        email:
          patient.email
            ? String(patient.email)
            : null,

        username:
          patient.username
            ? String(patient.username)
            : null,
      },
    };
  } catch (error) {
    console.error(
      'Error al obtener datos de peso:',
      error,
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : (
          'No se pudieron obtener '
          + 'los datos del paciente.'
        ),
    );
  }
}


/**
 * Calcula la predicción del peso
 * mediante el modelo ML v2.
 */
export async function calculatePredictiveModel(
  patientId: number,
) {
  try {
    const data =
      await getPatientWeightData(
        patientId,
      );

    if (
      data.weightHistory.length < 2
    ) {
      return {
        success: false,

        message:
          'Se necesitan al menos 2 registros '
          + 'de peso para realizar la predicción.',

        data: null,
      };
    }

    const history =
      data.weightHistory;

    const previousRecord =
      history[
        history.length - 2
      ];

    const currentRecord =
      history[
        history.length - 1
      ];

    const missingMeasurements:
      string[] = [];

    if (
      data.patient.height === null
    ) {
      missingMeasurements.push(
        'estatura',
      );
    }

    if (
      currentRecord.bodyFat === null
    ) {
      missingMeasurements.push(
        'porcentaje de grasa corporal',
      );
    }

    if (
      currentRecord.visceralFat === null
    ) {
      missingMeasurements.push(
        'grasa visceral',
      );
    }

    if (
      currentRecord.muscle === null
    ) {
      missingMeasurements.push(
        'porcentaje de músculo',
      );
    }

    if (
      currentRecord.totalWater === null
    ) {
      missingMeasurements.push(
        'porcentaje de agua corporal',
      );
    }

    if (
      currentRecord.waist === null
    ) {
      missingMeasurements.push(
        'circunferencia de cintura',
      );
    }

    if (
      missingMeasurements.length > 0
    ) {
      return {
        success: false,

        message:
          'La evaluación más reciente debe incluir: '
          + missingMeasurements.join(', ')
          + '.',

        data: null,
      };
    }

    const rawDaysSincePrevious =
      calculateDaysBetween(
        previousRecord.date,
        currentRecord.date,
      );

    if (rawDaysSincePrevious <= 0) {
      return {
        success: false,

        message:
          'Las fechas de las evaluaciones '
          + 'no tienen un orden válido.',

        data: null,
      };
    }

    const daysSincePrevious =
      normalizeIntervalDays(
        rawDaysSincePrevious,
      );

    const daysUntilNext =
      calculateDaysUntilNext(
        currentRecord.date,
        currentRecord.nextAppointmentDate,
        daysSincePrevious,
      );

    const previousWeightChange =
      currentRecord.weight
      - previousRecord.weight;

    const heightCentimeters =
      data.patient.height as number;

    const heightMeters =
      heightCentimeters / 100;

    const currentBmi =
      currentRecord.weight
      / Math.pow(
        heightMeters,
        2,
      );

    const age =
      calculateAgeAtDate(
        data.patient.birthDate,
        currentRecord.date,
        data.patient.registeredAge,
      );

    if (
      age === null
      || age < 12
      || age > 100
    ) {
      return {
        success: false,

        message:
          'No fue posible calcular una edad '
          + 'válida para el paciente.',

        data: null,
      };
    }

    const predictionInput:
      WeightPredictionInput = {
      age,

      gender:
        data.patient.gender,

      goal_category:
        data.patient.goalCategory,

      current_weight:
        currentRecord.weight,

      current_bmi:
        Number(
          currentBmi.toFixed(2),
        ),

      previous_weight_change:
        Number(
          previousWeightChange.toFixed(2),
        ),

      days_since_previous:
        daysSincePrevious,

      days_until_next:
        daysUntilNext,

      body_fat_percentage:
        currentRecord.bodyFat as number,

      visceral_fat_percentage:
        currentRecord.visceralFat as number,

      muscle_percentage:
        currentRecord.muscle as number,

      total_water_percentage:
        currentRecord.totalWater as number,

      waist_circumference:
        currentRecord.waist as number,
    };

    const prediction =
      await requestWeightPrediction(
        predictionInput,
      );

    const initialWeight =
      history[0].weight;

    const currentWeight =
      currentRecord.weight;

    const idealWeight =
      22
      * Math.pow(
        heightMeters,
        2,
      );

    return {
      success: true,

      message:
        'Predicción realizada correctamente.',

      data: {
        patient:
          data.patient,

        weightHistory:
          history,

        statistics: {
          initialWeight,

          currentWeight,

          weightChange:
            currentWeight
            - initialWeight,

          bmi:
            Number(
              currentBmi.toFixed(1),
            ),

          idealWeight:
            Number(
              idealWeight.toFixed(1),
            ),

          height:
            heightCentimeters,

          age,

          gender:
            data.patient.gender,

          goalText:
            data.patient.goalText,

          goalCategory:
            data.patient.goalCategory,
        },

        latestEvaluation: {
          evaluationId:
            currentRecord.evaluationId,

          date:
            currentRecord.date,

          weight:
            currentRecord.weight,

          bodyFat:
            currentRecord.bodyFat,

          visceralFat:
            currentRecord.visceralFat,

          muscle:
            currentRecord.muscle,

          totalWater:
            currentRecord.totalWater,

          waist:
            currentRecord.waist,

          nextAppointmentDate:
            currentRecord.nextAppointmentDate,
        },

        previousEvaluation: {
          evaluationId:
            previousRecord.evaluationId,

          date:
            previousRecord.date,

          weight:
            previousRecord.weight,
        },

        predictionInput,

        prediction: {
          currentWeight:
            prediction.current_weight,

          predictedWeightChange:
            prediction.predicted_weight_change,

          predictedNextWeight:
            prediction.predicted_next_weight,

          tendency:
            prediction.tendency,

          interpretation:
            prediction.interpretation,

          estimatedAverageErrorKg:
            prediction.estimated_average_error_kg,

          modelName:
            prediction.model_name,

          modelVersion:
            prediction.model_version
            ?? '2.0.0',

          featuresUsed:
            prediction.features_used,

          warning:
            prediction.warning,
        },
      },
    };
  } catch (error) {
    console.error(
      'Error al realizar la predicción de peso:',
      error,
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : (
            'No se pudo realizar '
            + 'la predicción de peso.'
          ),

      data: null,
    };
  }
}