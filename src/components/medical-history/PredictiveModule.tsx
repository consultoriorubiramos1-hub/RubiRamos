'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AdaptiveTable from "@/components/ui/AdaptiveTable";

import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  Droplets,
  Dumbbell,
  RefreshCw,
  Ruler,
  Scale,
  Target,
  TrendingDown,
  TrendingUp,
  UserRound,
} from 'lucide-react';

import { toast } from 'react-hot-toast';

import {
  calculatePredictiveModel,
} from '@/lib/predictive-actions';


interface PredictiveModuleProps {
  patientId: number;
}


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


interface PatientData {
  id: number;
  nombre_completo: string;

  height: number | null;
  registeredAge: number | null;
  birthDate: string | null;

  gender: NormalizedGender;

  goalText: string;
  goalCategory: GoalCategory;

  email: string | null;
  username: string | null;
}


interface PredictionStatistics {
  initialWeight: number;
  currentWeight: number;
  weightChange: number;

  bmi: number;
  idealWeight: number;
  height: number;

  age: number;
  gender: NormalizedGender;

  goalText: string;
  goalCategory: GoalCategory;
}


interface LatestEvaluation {
  evaluationId: number;
  date: string;

  weight: number;
  bodyFat: number | null;
  visceralFat: number | null;
  muscle: number | null;
  totalWater: number | null;
  waist: number | null;

  nextAppointmentDate: string | null;
}


interface PreviousEvaluation {
  evaluationId: number;
  date: string;
  weight: number;
}


interface PredictionInput {
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


interface WeightPrediction {
  currentWeight: number;

  predictedWeightChange: number;
  predictedNextWeight: number;

  tendency: string;
  interpretation: string;

  estimatedAverageErrorKg: number | null;

  modelName: string;
  modelVersion: string;

  featuresUsed: string[];

  warning: string;
}


interface PredictiveModelData {
  patient: PatientData;

  weightHistory: WeightHistoryItem[];

  statistics: PredictionStatistics;

  latestEvaluation: LatestEvaluation;
  previousEvaluation: PreviousEvaluation;

  predictionInput: PredictionInput;
  prediction: WeightPrediction;
}


interface PredictiveActionResult {
  success: boolean;
  message: string;
  data: PredictiveModelData | null;
}


const FEATURE_LABELS: Record<string, string> = {
  age: 'Edad',
  gender: 'Género',
  goal_category: 'Objetivo nutricional',

  current_weight: 'Peso actual',
  current_bmi: 'IMC actual',
  previous_weight_change: 'Cambio de peso anterior',

  days_since_previous: 'Días desde la evaluación anterior',
  days_until_next: 'Días hasta la siguiente evaluación',

  body_fat_percentage: 'Grasa corporal',
  visceral_fat_percentage: 'Grasa visceral',
  muscle_percentage: 'Músculo',
  total_water_percentage: 'Agua corporal',
  waist_circumference: 'Circunferencia de cintura',
};


const GOAL_CONFIGURATION: Record<
  GoalCategory,
  {
    label: string;
    description: string;
    icon: typeof Target;
    cardClass: string;
    iconClass: string;
    badgeClass: string;
  }
> = {
  gain: {
    label: 'Aumentar peso',
    description:
      'El seguimiento busca una ganancia de peso gradual y controlada.',
    icon: TrendingUp,
    cardClass:
      'border-blue-200 bg-blue-50',
    iconClass:
      'bg-blue-100 text-blue-700',
    badgeClass:
      'bg-blue-100 text-blue-800',
  },

  lose: {
    label: 'Disminuir peso',
    description:
      'El seguimiento busca una reducción de peso gradual y controlada.',
    icon: TrendingDown,
    cardClass:
      'border-emerald-200 bg-emerald-50',
    iconClass:
      'bg-emerald-100 text-emerald-700',
    badgeClass:
      'bg-emerald-100 text-emerald-800',
  },

  maintain: {
    label: 'Mantener peso',
    description:
      'El seguimiento busca conservar un peso y composición corporal estables.',
    icon: Activity,
    cardClass:
      'border-violet-200 bg-violet-50',
    iconClass:
      'bg-violet-100 text-violet-700',
    badgeClass:
      'bg-violet-100 text-violet-800',
  },
};


function formatDate(
  date: string | Date,
): string {
  const parsedDate =
    date instanceof Date
      ? date
      : new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return 'Fecha no disponible';
  }

  return parsedDate.toLocaleDateString(
    'es-MX',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  );
}


function formatWeight(
  weight: number,
  decimals = 1,
): string {
  return `${weight.toFixed(decimals)} kg`;
}


function formatSignedWeight(
  weight: number,
  decimals = 2,
): string {
  const sign =
    weight > 0
      ? '+'
      : '';

  return `${sign}${weight.toFixed(decimals)} kg`;
}


function formatPercentage(
  value: number | null | undefined,
): string {
  if (
    value === null
    || value === undefined
  ) {
    return '—';
  }

  return `${value.toFixed(1)}%`;
}


function formatCentimeters(
  value: number | null | undefined,
): string {
  if (
    value === null
    || value === undefined
  ) {
    return '—';
  }

  return `${value.toFixed(1)} cm`;
}


function formatGender(
  gender: NormalizedGender,
): string {
  if (gender === 'female') {
    return 'Femenino';
  }

  if (gender === 'male') {
    return 'Masculino';
  }

  return 'No especificado';
}


function formatModelName(
  modelName: string,
): string {
  const normalizedName =
    modelName
      .trim()
      .toLowerCase();

  if (
    normalizedName
      === 'gradient_boosting'
  ) {
    return 'Gradient Boosting';
  }

  if (
    normalizedName
      === 'bosque_aleatorio'
    || normalizedName
      === 'random_forest'
  ) {
    return 'Bosque aleatorio';
  }

  if (
    normalizedName
      === 'regresion_ridge'
    || normalizedName
      === 'ridge'
  ) {
    return 'Regresión Ridge';
  }

  return modelName
    .replaceAll('_', ' ')
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}


function getBmiCategory(
  bmi: number,
): {
  label: string;
  className: string;
} {
  if (bmi < 18.5) {
    return {
      label: 'Bajo peso',
      className:
        'text-blue-700',
    };
  }

  if (bmi < 25) {
    return {
      label: 'Peso saludable',
      className:
        'text-emerald-700',
    };
  }

  if (bmi < 30) {
    return {
      label: 'Sobrepeso',
      className:
        'text-amber-700',
    };
  }

  if (bmi < 35) {
    return {
      label: 'Obesidad grado I',
      className:
        'text-orange-700',
    };
  }

  if (bmi < 40) {
    return {
      label: 'Obesidad grado II',
      className:
        'text-red-700',
    };
  }

  return {
    label: 'Obesidad grado III',
    className:
      'text-red-800',
  };
}


function getTendencyConfiguration(
  tendency: string,
) {
  const normalizedTendency =
    tendency
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      );

  if (
    normalizedTendency
      === 'disminucion'
  ) {
    return {
      label:
        'Disminución estimada',

      description:
        'Los datos actuales indican una posible disminución de peso para el próximo control.',

      icon:
        TrendingDown,

      cardClass:
        'border-emerald-200 bg-emerald-50',

      iconClass:
        'bg-emerald-100 text-emerald-700',

      valueClass:
        'text-emerald-700',
    };
  }

  if (
    normalizedTendency
      === 'aumento'
  ) {
    return {
      label:
        'Aumento estimado',

      description:
        'Los datos actuales indican un posible aumento de peso para el próximo control.',

      icon:
        TrendingUp,

      cardClass:
        'border-blue-200 bg-blue-50',

      iconClass:
        'bg-blue-100 text-blue-700',

      valueClass:
        'text-blue-700',
    };
  }

  return {
    label:
      'Mantenimiento estimado',

    description:
      'Los datos actuales indican que el peso podría mantenerse relativamente estable.',

    icon:
      Activity,

    cardClass:
      'border-violet-200 bg-violet-50',

    iconClass:
      'bg-violet-100 text-violet-700',

    valueClass:
      'text-violet-700',
  };
}


function getHistoricalChangeConfiguration(
  weightChange: number,
) {
  if (weightChange > 0.2) {
    return {
      label:
        'Aumento acumulado',

      value:
        formatSignedWeight(
          weightChange,
        ),

      icon:
        TrendingUp,

      className:
        'text-blue-700',
    };
  }

  if (weightChange < -0.2) {
    return {
      label:
        'Disminución acumulada',

      value:
        formatSignedWeight(
          weightChange,
        ),

      icon:
        TrendingDown,

      className:
        'text-emerald-700',
    };
  }

  return {
    label:
      'Cambio acumulado',

    value:
      formatSignedWeight(
        weightChange,
      ),

    icon:
      Activity,

    className:
      'text-violet-700',
  };
}


function getGoalAlignmentMessage(
  goalCategory: GoalCategory,
  predictedChange: number,
): {
  title: string;
  description: string;
  className: string;
} {
  const threshold = 0.2;

  if (goalCategory === 'gain') {
    if (predictedChange > threshold) {
      return {
        title:
          'Tendencia alineada con el objetivo',

        description:
          'Los datos actuales indican un aumento de peso, consistente con el objetivo nutricional registrado.',

        className:
          'border-blue-200 bg-blue-50 text-blue-900',
      };
    }

    if (
      predictedChange
      >= -threshold
    ) {
      return {
        title:
          'Tendencia estable',

        description:
          'Los datos actuales indican estabilidad. La nutrióloga puede revisar adherencia, porciones y estrategia para favorecer la ganancia.',

        className:
          'border-amber-200 bg-amber-50 text-amber-900',
      };
    }

    return {
      title:
        'Tendencia distinta al objetivo',

      description:
        'Los datos actuales indican disminución aunque el objetivo es aumentar peso. Conviene revisar el cumplimiento y los datos recientes.',

      className:
        'border-red-200 bg-red-50 text-red-900',
    };
  }

  if (goalCategory === 'lose') {
    if (predictedChange < -threshold) {
      return {
        title:
          'Tendencia alineada con el objetivo',

        description:
          'Los datos actuales indican una disminución de peso, consistente con el objetivo nutricional registrado.',

        className:
          'border-emerald-200 bg-emerald-50 text-emerald-900',
      };
    }

    if (
      predictedChange
      <= threshold
    ) {
      return {
        title:
          'Tendencia estable',

        description:
          'Los datos actuales indican estabilidad. La nutrióloga puede revisar la adherencia y los ajustes del plan.',

        className:
          'border-amber-200 bg-amber-50 text-amber-900',
      };
    }

    return {
      title:
        'Tendencia distinta al objetivo',

      description:
        'Los datos actuales indican aumento aunque el objetivo es disminuir peso. Conviene revisar los datos y el seguimiento actual.',

      className:
        'border-red-200 bg-red-50 text-red-900',
    };
  }

  if (
    Math.abs(predictedChange)
      <= threshold
  ) {
    return {
      title:
        'Tendencia alineada con el objetivo',

      description:
        'Los datos actuales indican estabilidad, consistente con el objetivo de mantenimiento.',

      className:
        'border-violet-200 bg-violet-50 text-violet-900',
    };
  }

  return {
    title:
      'Se observa una posible variación de peso',

    description:
      'El objetivo registrado es mantener el peso, pero los datos actuales indican una variación. Conviene revisar el seguimiento.',

    className:
      'border-amber-200 bg-amber-50 text-amber-900',
  };
}


export default function PredictiveModule({
  patientId,
}: PredictiveModuleProps) {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    modelData,
    setModelData,
  ] = useState<
    PredictiveModelData | null
  >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null);

  const [
    showDetails,
    setShowDetails,
  ] = useState(false);


  const loadPredictiveModel =
    useCallback(
      async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
          const result =
            await calculatePredictiveModel(
              patientId,
            ) as PredictiveActionResult;

          if (
            !result.success
            || !result.data
          ) {
            const message =
              result.message
              || (
                'No hay suficientes datos '
                + 'para estimar el próximo control.'
              );

            setModelData(null);
            setErrorMessage(message);

            return;
          }

          setModelData(
            result.data,
          );
        } catch (error) {
          console.error(
            'Error al cargar el seguimiento de peso:',
            error,
          );

          const message =
            error instanceof Error
              ? error.message
              : (
                'No se pudo cargar '
                + 'el seguimiento de peso.'
              );

          setModelData(null);
          setErrorMessage(message);

          toast.error(message);
        } finally {
          setLoading(false);
        }
      },
      [
        patientId,
      ],
    );


  useEffect(
    () => {
      void loadPredictiveModel();
    },
    [
      loadPredictiveModel,
    ],
  );


  const sortedWeightHistory =
    useMemo(
      () => {
        if (!modelData) {
          return [];
        }

        return [
          ...modelData.weightHistory,
        ].sort(
          (
            firstRecord,
            secondRecord,
          ) =>
            new Date(
              firstRecord.date,
            ).getTime()
            - new Date(
              secondRecord.date,
            ).getTime(),
        );
      },
      [
        modelData,
      ],
    );


  if (loading) {
    return (
      <section
        className="
          rounded-2xl
          border
          border-[#DDE5E1]
          bg-white
          p-5 sm:p-8
        "
      >
        <div
          className="
            flex
            min-h-52
            flex-col
            items-center
            justify-center
            text-center
          "
        >
          <RefreshCw
            className="
              mb-4
              h-10
              w-10
              animate-spin
              text-[#5A8C7A]
            "
          />

          <h3
            className="
              text-lg
              font-semibold
              text-[#263B34]
            "
          >
            Preparando seguimiento
          </h3>

          <p
            className="
              mt-2
              max-w-md
              text-sm
              text-gray-600
            "
          >
            Consultando las evaluaciones, el historial
            de peso y la composición corporal
            del paciente.
          </p>
        </div>
      </section>
    );
  }


  if (!modelData) {
    return (
      <section
        className="
          rounded-2xl
          border
          border-amber-200
          bg-amber-50
          p-5 sm:p-8
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            text-center
          "
        >
          <div
            className="
              mb-4
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              bg-amber-100
              text-amber-700
            "
          >
            <AlertTriangle
              className="
                h-7
                w-7
              "
            />
          </div>

          <h3
            className="
              text-lg
              font-semibold
              text-amber-900
            "
          >
            Seguimiento no disponible
          </h3>

          <p
            className="
              mt-2
              max-w-xl
              text-sm
              leading-6
              text-amber-800
            "
          >
            {
              errorMessage
              || (
                'Se necesitan al menos dos '
                + 'evaluaciones antropométricas '
                + 'completas.'
              )
            }
          </p>

          <button
            type="button"
            onClick={
              () => {
                void loadPredictiveModel();
              }
            }
            className="
              mt-5
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-amber-700
              px-4
              py-2
              text-sm
              font-semibold
              text-white
              transition-colors
              hover:bg-amber-800
            "
          >
            <RefreshCw
              className="
                h-4
                w-4
              "
            />

            Intentar nuevamente
          </button>
        </div>
      </section>
    );
  }


  const {
    patient,
    statistics,
    latestEvaluation,
    previousEvaluation,
    predictionInput,
    prediction,
  } = modelData;


  const goalConfiguration =
    GOAL_CONFIGURATION[
      statistics.goalCategory
    ];

  const GoalIcon =
    goalConfiguration.icon;


  const tendencyConfiguration =
    getTendencyConfiguration(
      prediction.tendency,
    );

  const TendencyIcon =
    tendencyConfiguration.icon;


  const historicalChangeConfiguration =
    getHistoricalChangeConfiguration(
      statistics.weightChange,
    );

  const HistoricalChangeIcon =
    historicalChangeConfiguration.icon;


  const bmiCategory =
    getBmiCategory(
      statistics.bmi,
    );


  const goalAlignment =
    getGoalAlignmentMessage(
      statistics.goalCategory,
      prediction.predictedWeightChange,
    );


  const modelDisplayName =
    formatModelName(
      prediction.modelName,
    );


  return (
    <section
      className="
        space-y-6
      "
    >
      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-[#DDE5E1]
          bg-white
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            border-b
            border-[#E8EEEB]
            bg-[#FAF9F7]
            px-6
            py-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <Scale
                className="
                  h-6
                  w-6
                  text-[#5A8C7A]
                "
              />

              <h2
                className="
                  text-xl
                  font-semibold
                  text-[#263B34]
                "
              >
                Seguimiento de peso
              </h2>
            </div>

            <p
              className="
                mt-1
                text-sm
                text-gray-600
              "
            >
              Referencia para el próximo control de{' '}
              {patient.nombre_completo}.
            </p>
          </div>

          <button
            type="button"
            onClick={
              () => {
                void loadPredictiveModel();
              }
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-[#BFCFC8]
              bg-white
              px-4
              py-2
              text-sm
              font-medium
              text-[#385E50]
              transition-colors
              hover:bg-[#F1F5F3]
            "
          >
            <RefreshCw
              className="
                h-4
                w-4
              "
            />

            Actualizar
          </button>
        </div>


        <div
          className="
            grid
            gap-4
            p-4 sm:p-6
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <article
            className="
              rounded-xl
              border
              border-[#E2E9E5]
              bg-white
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <span
                className="
                  text-sm
                  font-medium
                  text-gray-600
                "
              >
                Peso inicial
              </span>

              <Scale
                className="
                  h-5
                  w-5
                  text-[#5A8C7A]
                "
              />
            </div>

            <p
              className="
                mt-3
                text-2xl
                font-semibold
                text-[#263B34]
              "
            >
              {
                formatWeight(
                  statistics.initialWeight,
                )
              }
            </p>
          </article>


          <article
            className="
              rounded-xl
              border
              border-[#E2E9E5]
              bg-white
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <span
                className="
                  text-sm
                  font-medium
                  text-gray-600
                "
              >
                Peso actual
              </span>

              <CircleGauge
                className="
                  h-5
                  w-5
                  text-[#5A8C7A]
                "
              />
            </div>

            <p
              className="
                mt-3
                text-2xl
                font-semibold
                text-[#263B34]
              "
            >
              {
                formatWeight(
                  statistics.currentWeight,
                )
              }
            </p>
          </article>


          <article
            className="
              rounded-xl
              border
              border-[#E2E9E5]
              bg-white
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <span
                className="
                  text-sm
                  font-medium
                  text-gray-600
                "
              >
                {
                  historicalChangeConfiguration
                    .label
                }
              </span>

              <HistoricalChangeIcon
                className={`
                  h-5
                  w-5
                  ${
                    historicalChangeConfiguration
                      .className
                  }
                `}
              />
            </div>

            <p
              className={`
                mt-3
                text-2xl
                font-semibold
                ${
                  historicalChangeConfiguration
                    .className
                }
              `}
            >
              {
                historicalChangeConfiguration
                  .value
              }
            </p>
          </article>


          <article
            className="
              rounded-xl
              border
              border-[#E2E9E5]
              bg-white
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <span
                className="
                  text-sm
                  font-medium
                  text-gray-600
                "
              >
                IMC actual
              </span>

              <Activity
                className="
                  h-5
                  w-5
                  text-[#5A8C7A]
                "
              />
            </div>

            <p
              className="
                mt-3
                text-2xl
                font-semibold
                text-[#263B34]
              "
            >
              {
                statistics.bmi.toFixed(1)
              }
            </p>

            <p
              className={`
                mt-1
                text-sm
                font-medium
                ${bmiCategory.className}
              `}
            >
              {bmiCategory.label}
            </p>
          </article>
        </div>
      </div>


      <div
        className="
          grid
          gap-6
          lg:grid-cols-2
        "
      >
        <article
          className={`
            rounded-2xl
            border
            p-4 sm:p-6
            ${goalConfiguration.cardClass}
          `}
        >
          <div
            className="
              flex
              items-start
              gap-4
            "
          >
            <div
              className={`
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-xl
                ${goalConfiguration.iconClass}
              `}
            >
              <GoalIcon
                className="
                  h-6
                  w-6
                "
              />
            </div>

            <div>
              <p
                className="
                  text-sm
                  font-medium
                  text-gray-600
                "
              >
                Objetivo nutricional
              </p>

              <h3
                className="
                  mt-1
                  text-xl
                  font-semibold
                  text-[#263B34]
                "
              >
                {
                  goalConfiguration.label
                }
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-gray-700
                "
              >
                {
                  statistics.goalText
                  || goalConfiguration.description
                }
              </p>
            </div>
          </div>

          <div
            className="
              mt-5
              grid
              gap-3
              sm:grid-cols-2
            "
          >
            <div
              className="
                rounded-xl
                border
                border-white/70
                bg-white/70
                p-3
              "
            >
              <p
                className="
                  text-xs
                  font-medium
                  uppercase
                  tracking-wide
                  text-gray-500
                "
              >
                Edad
              </p>

              <p
                className="
                  mt-1
                  font-semibold
                  text-[#263B34]
                "
              >
                {statistics.age} años
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                border-white/70
                bg-white/70
                p-3
              "
            >
              <p
                className="
                  text-xs
                  font-medium
                  uppercase
                  tracking-wide
                  text-gray-500
                "
              >
                Género
              </p>

              <p
                className="
                  mt-1
                  font-semibold
                  text-[#263B34]
                "
              >
                {
                  formatGender(
                    statistics.gender,
                  )
                }
              </p>
            </div>
          </div>
        </article>


        <article
          className={`
            rounded-2xl
            border
            p-4 sm:p-6
            ${tendencyConfiguration.cardClass}
          `}
        >
          <div
            className="
              flex
              items-start
              gap-4
            "
          >
            <div
              className={`
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-xl
                ${tendencyConfiguration.iconClass}
              `}
            >
              <TendencyIcon
                className="
                  h-6
                  w-6
                "
              />
            </div>

            <div
              className="
                min-w-0
                min-w-0 flex-1
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                <p
                  className="
                    text-sm
                    font-medium
                    text-gray-600
                  "
                >
                  Próximo control
                </p>
              </div>

              <h3
                className={`
                  mt-2
                  text-3xl
                  font-semibold
                  ${tendencyConfiguration.valueClass}
                `}
              >
                {
                  formatWeight(
                    prediction.predictedNextWeight,
                    2,
                  )
                }
              </h3>

              <p
                className={`
                  mt-1
                  text-base
                  font-semibold
                  ${tendencyConfiguration.valueClass}
                `}
              >
                {
                  formatSignedWeight(
                    prediction.predictedWeightChange,
                  )
                }
              </p>

              <p
                className="
                  mt-3
                  text-sm
                  font-semibold
                  text-gray-800
                "
              >
                {
                  tendencyConfiguration.label
                }
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-gray-700
                "
              >
                {
                  prediction.interpretation
                  || tendencyConfiguration.description
                }
              </p>
            </div>
          </div>

          {
            prediction
              .estimatedAverageErrorKg
              !== null
            && (
              <div
                className="
                  mt-5
                  rounded-xl
                  border
                  border-white/70
                  bg-white/70
                  p-3
                  text-sm
                  text-gray-700
                "
              >
                Margen estimado:
                {' '}
                <strong>
                  ±
                  {
                    prediction
                      .estimatedAverageErrorKg
                      .toFixed(2)
                  }
                  {' '}
                  kg
                </strong>
              </div>
            )
          }
        </article>
      </div>


      <article
        className={`
          rounded-2xl
          border
          p-5
          ${goalAlignment.className}
        `}
      >
        <div
          className="
            flex
            items-start
            gap-3
          "
        >
          <Target
            className="
              mt-0.5
              h-5
              w-5
              shrink-0
            "
          />

          <div>
            <h3
              className="
                font-semibold
              "
            >
              {goalAlignment.title}
            </h3>

            <p
              className="
                mt-1
                text-sm
                leading-6
              "
            >
              {goalAlignment.description}
            </p>
          </div>
        </div>
      </article>


      <div
        className="
          grid
          gap-6
          xl:grid-cols-2
        "
      >
        <article
          className="
            overflow-hidden
            rounded-2xl
            border
            border-[#DDE5E1]
            bg-white
          "
        >
          <div
            className="
              border-b
              border-[#E8EEEB]
              px-6
              py-4
            "
          >
            <h3
              className="
                flex
                items-center
                gap-2
                text-lg
                font-semibold
                text-[#263B34]
              "
            >
              <CircleGauge
                className="
                  h-5
                  w-5
                  text-[#5A8C7A]
                "
              />

              Evaluaciones utilizadas
            </h3>
          </div>

          <div
            className="
              grid
              gap-4
              p-4 sm:p-6
              sm:grid-cols-2
            "
          >
            <div
              className="
                rounded-xl
                border
                border-[#E2E9E5]
                bg-[#FAF9F7]
                p-4
              "
            >
              <p
                className="
                  text-sm
                  font-medium
                  text-gray-600
                "
              >
                Evaluación anterior
              </p>

              <p
                className="
                  mt-2
                  text-lg
                  font-semibold
                  text-[#263B34]
                "
              >
                {
                  formatWeight(
                    previousEvaluation.weight,
                    2,
                  )
                }
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                {
                  formatDate(
                    previousEvaluation.date,
                  )
                }
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                border-[#E2E9E5]
                bg-[#FAF9F7]
                p-4
              "
            >
              <p
                className="
                  text-sm
                  font-medium
                  text-gray-600
                "
              >
                Evaluación actual
              </p>

              <p
                className="
                  mt-2
                  text-lg
                  font-semibold
                  text-[#263B34]
                "
              >
                {
                  formatWeight(
                    latestEvaluation.weight,
                    2,
                  )
                }
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                {
                  formatDate(
                    latestEvaluation.date,
                  )
                }
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                border-[#E2E9E5]
                p-4
                sm:col-span-2
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >
                <span
                  className="
                    text-sm
                    text-gray-600
                  "
                >
                  Cambio más reciente
                </span>

                <strong
                  className="
                    text-[#263B34]
                  "
                >
                  {
                    formatSignedWeight(
                      predictionInput
                        .previous_weight_change,
                    )
                  }
                </strong>
              </div>

              <div
                className="
                  mt-3
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >
                <span
                  className="
                    text-sm
                    text-gray-600
                  "
                >
                  Intervalo anterior
                </span>

                <strong
                  className="
                    text-[#263B34]
                  "
                >
                  {
                    predictionInput
                      .days_since_previous
                  }
                  {' '}
                  días
                </strong>
              </div>

              <div
                className="
                  mt-3
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >
                <span
                  className="
                    text-sm
                    text-gray-600
                  "
                >
                  Intervalo al próximo control
                </span>

                <strong
                  className="
                    text-[#263B34]
                  "
                >
                  {
                    predictionInput
                      .days_until_next
                  }
                  {' '}
                  días
                </strong>
              </div>
            </div>
          </div>
        </article>


        <article
          className="
            overflow-hidden
            rounded-2xl
            border
            border-[#DDE5E1]
            bg-white
          "
        >
          <div
            className="
              border-b
              border-[#E8EEEB]
              px-6
              py-4
            "
          >
            <h3
              className="
                flex
                items-center
                gap-2
                text-lg
                font-semibold
                text-[#263B34]
              "
            >
              <Activity
                className="
                  h-5
                  w-5
                  text-[#5A8C7A]
                "
              />

              Composición corporal actual
            </h3>
          </div>

          <div
            className="
              grid
              gap-4
              p-4 sm:p-6
              sm:grid-cols-2
            "
          >
            <MeasurementItem
              icon={Scale}
              label="Peso"
              value={
                formatWeight(
                  predictionInput.current_weight,
                  2,
                )
              }
            />

            <MeasurementItem
              icon={CircleGauge}
              label="IMC"
              value={
                predictionInput
                  .current_bmi
                  .toFixed(2)
              }
            />

            <MeasurementItem
              icon={Activity}
              label="Grasa corporal"
              value={
                formatPercentage(
                  predictionInput
                    .body_fat_percentage,
                )
              }
            />

            <MeasurementItem
              icon={Activity}
              label="Grasa visceral"
              value={
                predictionInput
                  .visceral_fat_percentage
                  .toFixed(1)
              }
            />

            <MeasurementItem
              icon={Dumbbell}
              label="Músculo"
              value={
                formatPercentage(
                  predictionInput
                    .muscle_percentage,
                )
              }
            />

            <MeasurementItem
              icon={Droplets}
              label="Agua corporal"
              value={
                formatPercentage(
                  predictionInput
                    .total_water_percentage,
                )
              }
            />

            <MeasurementItem
              icon={Ruler}
              label="Cintura"
              value={
                formatCentimeters(
                  predictionInput
                    .waist_circumference,
                )
              }
            />

            <MeasurementItem
              icon={UserRound}
              label="Edad y género"
              value={
                `${predictionInput.age} años · `
                + formatGender(
                  predictionInput.gender,
                )
              }
            />
          </div>
        </article>
      </div>


      <article
        className="
          overflow-hidden
          rounded-2xl
          border
          border-[#DDE5E1]
          bg-white
        "
      >
        <div
          className="
            border-b
            border-[#E8EEEB]
            px-6
            py-4
          "
        >
          <h3
            className="
              flex
              items-center
              gap-2
              text-lg
              font-semibold
              text-[#263B34]
            "
          >
            <CalendarDays
              className="
                h-5
                w-5
                text-[#5A8C7A]
              "
            />

            Historial de mediciones
          </h3>

          <p
            className="
              mt-1
              text-sm
              text-gray-600
            "
          >
            Evolución antropométrica registrada
            para este paciente.
          </p>
        </div>

        <div
          className="
            overflow-x-auto
          "
        >
          <AdaptiveTable mobile="scroll" label="Tabla de comparación y detalles"><table
            className="
              w-full
              min-w-[850px]
              border-collapse
              text-sm
            "
          >
            <thead
              className="
                bg-[#FAF9F7]
                text-left
                text-gray-600
              "
            >
              <tr>
                <th
                  className="
                    px-5
                    py-3
                    font-semibold
                  "
                >
                  Fecha
                </th>

                <th
                  className="
                    px-5
                    py-3
                    font-semibold
                  "
                >
                  Peso
                </th>

                <th
                  className="
                    px-5
                    py-3
                    font-semibold
                  "
                >
                  Grasa
                </th>

                <th
                  className="
                    px-5
                    py-3
                    font-semibold
                  "
                >
                  Grasa visceral
                </th>

                <th
                  className="
                    px-5
                    py-3
                    font-semibold
                  "
                >
                  Músculo
                </th>

                <th
                  className="
                    px-5
                    py-3
                    font-semibold
                  "
                >
                  Agua
                </th>

                <th
                  className="
                    px-5
                    py-3
                    font-semibold
                  "
                >
                  Cintura
                </th>
              </tr>
            </thead>

            <tbody>
              {
                sortedWeightHistory.map(
                  (record) => (
                    <tr
                      key={
                        record.evaluationId
                      }
                      className="
                        border-t
                        border-[#EDF1EF]
                        text-gray-700
                      "
                    >
                      <td
                        className="
                          whitespace-nowrap
                          px-5
                          py-3
                        "
                      >
                        {
                          formatDate(
                            record.date,
                          )
                        }
                      </td>

                      <td
                        className="
                          whitespace-nowrap
                          px-5
                          py-3
                          font-semibold
                          text-[#263B34]
                        "
                      >
                        {
                          formatWeight(
                            record.weight,
                          )
                        }
                      </td>

                      <td
                        className="
                          whitespace-nowrap
                          px-5
                          py-3
                        "
                      >
                        {
                          formatPercentage(
                            record.bodyFat,
                          )
                        }
                      </td>

                      <td
                        className="
                          whitespace-nowrap
                          px-5
                          py-3
                        "
                      >
                        {
                          record
                            .visceralFat
                            !== null
                            ? record
                              .visceralFat
                              .toFixed(1)
                            : '—'
                        }
                      </td>

                      <td
                        className="
                          whitespace-nowrap
                          px-5
                          py-3
                        "
                      >
                        {
                          formatPercentage(
                            record.muscle,
                          )
                        }
                      </td>

                      <td
                        className="
                          whitespace-nowrap
                          px-5
                          py-3
                        "
                      >
                        {
                          formatPercentage(
                            record.totalWater,
                          )
                        }
                      </td>

                      <td
                        className="
                          whitespace-nowrap
                          px-5
                          py-3
                        "
                      >
                        {
                          formatCentimeters(
                            record.waist,
                          )
                        }
                      </td>
                    </tr>
                  ),
                )
              }
            </tbody>
          </table></AdaptiveTable>
        </div>
      </article>


      <article
        className="
          overflow-hidden
          rounded-2xl
          border
          border-[#DDE5E1]
          bg-white
        "
      >
        <button
          type="button"
          onClick={
            () => {
              setShowDetails(
                (currentValue) =>
                  !currentValue,
              );
            }
          }
          className="
            flex
            w-full
            items-center
            justify-between
            gap-4
            px-6
            py-4
            text-left
            transition-colors
            hover:bg-[#FAF9F7]
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <Activity
              className="
                h-5
                w-5
                text-[#5A8C7A]
              "
            />

            <span
              className="
                font-semibold
                text-[#263B34]
              "
            >
              Ver información técnica
            </span>
          </div>

          {
            showDetails
              ? (
                <ChevronUp
                  className="
                    h-5
                    w-5
                    text-gray-500
                  "
                />
              )
              : (
                <ChevronDown
                  className="
                    h-5
                    w-5
                    text-gray-500
                  "
                />
              )
          }
        </button>

        {
          showDetails
          && (
            <div
              className="
                border-t
                border-[#E8EEEB]
                px-6
                py-5
              "
            >
              <div
                className="
                  grid
                  gap-6
                  lg:grid-cols-2
                "
              >
                <div>
                  <h4
                    className="
                      font-semibold
                      text-[#263B34]
                    "
                  >
                    Información técnica
                  </h4>

                  <dl
                    className="
                      mt-4
                      space-y-3
                      text-sm
                    "
                  >
                    <DetailRow
                      label="Algoritmo"
                      value={modelDisplayName}
                    />

                    <DetailRow
                      label="Versión"
                      value={
                        prediction.modelVersion
                      }
                    />

                    <DetailRow
                      label="Resultado estimado"
                      value={
                        'Cambio de peso esperado en el próximo control'
                      }
                    />

                    <DetailRow
                      label="Objetivo del paciente"
                      value={
                        goalConfiguration.label
                      }
                    />

                    <DetailRow
                      label="Evaluación actual"
                      value={
                        formatDate(
                          latestEvaluation.date,
                        )
                      }
                    />

                    <DetailRow
                      label="Siguiente evaluación"
                      value={
                        latestEvaluation
                          .nextAppointmentDate
                          ? formatDate(
                            latestEvaluation
                              .nextAppointmentDate,
                          )
                          : (
                            `${predictionInput.days_until_next} días`
                          )
                      }
                    />
                  </dl>
                </div>

                <div>
                  <h4
                    className="
                      font-semibold
                      text-[#263B34]
                    "
                  >
                    Variables analizadas
                  </h4>

                  <div
                    className="
                      mt-4
                      flex
                      flex-wrap
                      gap-2
                    "
                  >
                    {
                      prediction
                        .featuresUsed
                        .map(
                          (feature) => (
                            <span
                              key={feature}
                              className="
                                rounded-full
                                bg-[#EEF4F1]
                                px-3
                                py-1.5
                                text-xs
                                font-medium
                                text-[#385E50]
                              "
                            >
                              {
                                FEATURE_LABELS[
                                  feature
                                ]
                                || feature
                              }
                            </span>
                          ),
                        )
                    }
                  </div>
                </div>
              </div>

              <div
                className="
                  mt-6
                  rounded-xl
                  border
                  border-amber-200
                  bg-amber-50
                  p-4
                  text-sm
                  leading-6
                  text-amber-900
                "
              >
                <div
                  className="
                    flex
                    items-start
                    gap-3
                  "
                >
                  <AlertTriangle
                    className="
                      mt-0.5
                      h-5
                      w-5
                      shrink-0
                    "
                  />

                  <p>
                    {prediction.warning}
                  </p>
                </div>
              </div>
            </div>
          )
        }
      </article>
    </section>
  );
}


interface MeasurementItemProps {
  icon: typeof Activity;
  label: string;
  value: string;
}


function MeasurementItem({
  icon: Icon,
  label,
  value,
}: MeasurementItemProps) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        rounded-xl
        border
        border-[#E2E9E5]
        bg-[#FAF9F7]
        p-4
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-[#E8F0EC]
          text-[#4D7969]
        "
      >
        <Icon
          className="
            h-5
            w-5
          "
        />
      </div>

      <div
        className="
          min-w-0
        "
      >
        <p
          className="
            text-xs
            font-medium
            uppercase
            tracking-wide
            text-gray-500
          "
        >
          {label}
        </p>

        <p
          className="
            mt-1
            truncate
            font-semibold
            text-[#263B34]
          "
        >
          {value}
        </p>
      </div>
    </div>
  );
}


interface DetailRowProps {
  label: string;
  value: string;
}


function DetailRow({
  label,
  value,
}: DetailRowProps) {
  return (
    <div
      className="
        flex
        flex-col
        gap-1
        border-b
        border-[#EDF1EF]
        pb-3
        sm:flex-row
        sm:items-start
        sm:justify-between
        sm:gap-4
      "
    >
      <dt
        className="
          text-gray-500
        "
      >
        {label}
      </dt>

      <dd
        className="
          font-medium
          text-[#263B34]
          sm:text-right
        "
      >
        {value}
      </dd>
    </div>
  );
}