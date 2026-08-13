'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getActiveNutritionPlan,
  getMenuTemplates,
  saveNutritionPlan,
} from '@/lib/nutrition-plans-actions';

import {
  getPatientInitialEvaluation,
} from '@/lib/medical-history-actions';

import {
  getActiveMealOptions,
} from '@/lib/meal-options-actions';

import type {
  MealOption,
} from '@/lib/meal-options-actions';

import {
  toast,
} from 'react-hot-toast';


interface NutritionPlanProps {
  patientId: number;

  onRefresh?: () => void;
}


type MealType =
  | 'DESAYUNO'
  | 'ALMUERZO'
  | 'COLACION'
  | 'COMIDA'
  | 'CENA';


type MenuType =
  | 'MENU_1'
  | 'MENU_2'
  | 'MENU_3'
  | 'MENU_4';


interface MealTime {
  start: string;

  end: string;

  label: string;
}


interface MealTimes {
  DESAYUNO: MealTime;

  ALMUERZO: MealTime;

  COLACION: MealTime;

  COMIDA: MealTime;

  CENA: MealTime;
}


interface MealContent {
  description: string;
}


interface MenuData {
  days: string[];

  meals: {
    [key in MealType]?:
      MealContent;
  };
}


interface MenusData {
  MENU_1: MenuData;

  MENU_2: MenuData;

  MENU_3: MenuData;

  MENU_4: MenuData;
}


interface EditingMeal {
  menuId: MenuType;

  meal: MealType;
}


const MEAL_TYPES:
MealType[] = [
  'DESAYUNO',
  'ALMUERZO',
  'COLACION',
  'COMIDA',
  'CENA',
];


const MENUS: {
  id: MenuType;

  name: string;

  days: string[];
}[] = [
  {
    id:
      'MENU_1',

    name:
      'Menú 1',

    days: [
      'LUNES',
      'MIERCOLES',
    ],
  },

  {
    id:
      'MENU_2',

    name:
      'Menú 2',

    days: [
      'MARTES',
      'VIERNES',
    ],
  },

  {
    id:
      'MENU_3',

    name:
      'Menú 3',

    days: [
      'JUEVES',
    ],
  },

  {
    id:
      'MENU_4',

    name:
      'Menú 4',

    days: [
      'SABADO',
      'DOMINGO',
    ],
  },
];


const DEFAULT_MEAL_TIMES:
MealTimes = {
  DESAYUNO: {
    start:
      '08:00',

    end:
      '09:00',

    label:
      '8-9 AM',
  },

  ALMUERZO: {
    start:
      '09:00',

    end:
      '10:00',

    label:
      '9-10 AM',
  },

  COLACION: {
    start:
      '',

    end:
      '',

    label:
      '',
  },

  COMIDA: {
    start:
      '14:00',

    end:
      '15:00',

    label:
      '2-3 PM',
  },

  CENA: {
    start:
      '19:00',

    end:
      '20:00',

    label:
      '7-8 PM',
  },
};


const DEFAULT_MENUS:
MenusData = {
  MENU_1: {
    days: [
      'LUNES',
      'MIERCOLES',
    ],

    meals: {},
  },

  MENU_2: {
    days: [
      'MARTES',
      'VIERNES',
    ],

    meals: {},
  },

  MENU_3: {
    days: [
      'JUEVES',
    ],

    meals: {},
  },

  MENU_4: {
    days: [
      'SABADO',
      'DOMINGO',
    ],

    meals: {},
  },
};


/**
 * Crea el texto que se colocará en la celda.
 */
function buildMealOptionContent(
  option: MealOption,
): string {
  return [
    option.name.toUpperCase(),
    '',
    option.description.trim(),
  ]
    .join('\n')
    .trim();
}


export default function NutritionPlan({
  patientId,
  onRefresh,
}: NutritionPlanProps) {
  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


  const [
    saving,
    setSaving,
  ] =
    useState(
      false,
    );


  const [
    mealTimes,
    setMealTimes,
  ] =
    useState<MealTimes>(
      DEFAULT_MEAL_TIMES,
    );


  const [
    menus,
    setMenus,
  ] =
    useState<MenusData>(
      DEFAULT_MENUS,
    );


  const [
    templates,
    setTemplates,
  ] =
    useState<any[]>(
      [],
    );


  const [
    initialEvaluation,
    setInitialEvaluation,
  ] =
    useState<any>(
      null,
    );


  const [
    mealOptions,
    setMealOptions,
  ] =
    useState<MealOption[]>(
      [],
    );


  const [
    showPreferences,
    setShowPreferences,
  ] =
    useState(
      false,
    );


  const [
    editingMeal,
    setEditingMeal,
  ] =
    useState<EditingMeal | null>(
      null,
    );


  const [
    editingContent,
    setEditingContent,
  ] =
    useState(
      '',
    );


  const [
    selectedOptionId,
    setSelectedOptionId,
  ] =
    useState<number | null>(
      null,
    );


  const [
    optionSearch,
    setOptionSearch,
  ] =
    useState(
      '',
    );


  useEffect(
    () => {
      loadData();
    },
    [patientId],
  );


  const loadData =
    async () => {
      setLoading(
        true,
      );

      try {
        const [
          plan,
          templatesList,
          initialEvaluationData,
          mealOptionsList,
        ] =
          await Promise.all([
            getActiveNutritionPlan(
              patientId,
            ),

            getMenuTemplates(),

            getPatientInitialEvaluation(
              patientId,
            ),

            getActiveMealOptions(),
          ]);


        if (
          plan
        ) {
          setMealTimes(
            plan.meal_times ||
            DEFAULT_MEAL_TIMES,
          );

          setMenus(
            plan.menus ||
            DEFAULT_MENUS,
          );
        } else {
          setMealTimes(
            DEFAULT_MEAL_TIMES,
          );

          setMenus(
            DEFAULT_MENUS,
          );
        }


        setTemplates(
          templatesList,
        );

        setInitialEvaluation(
          initialEvaluationData,
        );

        setMealOptions(
          mealOptionsList,
        );
      } catch (error) {
        console.error(
          'Error al cargar el plan alimenticio:',
          error,
        );

        toast.error(
          'Error al cargar el plan alimenticio.',
        );
      } finally {
        setLoading(
          false,
        );
      }
    };


  const handleSave =
    async () => {
      setSaving(
        true,
      );

      try {
        await saveNutritionPlan({
          patient_id:
            patientId,

          name:
            `Plan Alimenticio - ${new Date().toLocaleDateString(
              'es-ES',
            )}`,

          description:
            'Plan personalizado',

          start_date:
            new Date(),

          menus,

          meal_times:
            mealTimes,
        });


        toast.success(
          'Plan alimenticio guardado.',
        );


        if (
          onRefresh
        ) {
          onRefresh();
        }
      } catch (error) {
        console.error(
          'Error al guardar el plan:',
          error,
        );

        toast.error(
          'Error al guardar el plan.',
        );
      } finally {
        setSaving(
          false,
        );
      }
    };


  const handleMealTimeChange = (
    mealType: MealType,
    field:
      | 'start'
      | 'end',
    value: string,
  ) => {
    setMealTimes(
      previousMealTimes => {
        const newMealTimes = {
          ...previousMealTimes,
        };

        const current =
          newMealTimes[
            mealType
          ];


        if (
          field ===
          'start'
        ) {
          newMealTimes[
            mealType
          ] = {
            ...current,

            start:
              value,

            label:
              value &&
              current.end
                ? `${value} - ${current.end}`
                : '',
          };
        } else {
          newMealTimes[
            mealType
          ] = {
            ...current,

            end:
              value,

            label:
              current.start &&
              value
                ? `${current.start} - ${value}`
                : '',
          };
        }


        return newMealTimes;
      },
    );
  };


  const handleMealContentChange = (
    menuId: MenuType,
    meal: MealType,
    content: string,
  ) => {
    setMenus(
      previousMenus => ({
        ...previousMenus,

        [menuId]: {
          ...previousMenus[
            menuId
          ],

          meals: {
            ...previousMenus[
              menuId
            ].meals,

            [meal]: {
              description:
                content,
            },
          },
        },
      }),
    );
  };


  const getMealContent = (
    menuId: MenuType,
    meal: MealType,
  ): string => {
    return (
      menus[
        menuId
      ]?.meals?.[
        meal
      ]?.description ||
      ''
    );
  };


  const openMealEditor = (
    menuId: MenuType,
    meal: MealType,
  ) => {
    const content =
      getMealContent(
        menuId,
        meal,
      );


    const matchedOption =
      mealOptions.find(
        option =>
          option.mealType ===
            meal &&
          buildMealOptionContent(
            option,
          ) ===
            content.trim(),
      );


    setEditingContent(
      content,
    );

    setSelectedOptionId(
      matchedOption?.id ??
      null,
    );

    setOptionSearch(
      '',
    );

    setEditingMeal({
      menuId,
      meal,
    });
  };


  const closeMealEditor =
    () => {
      setEditingMeal(
        null,
      );

      setEditingContent(
        '',
      );

      setSelectedOptionId(
        null,
      );

      setOptionSearch(
        '',
      );
    };


  const selectMealOption = (
    option: MealOption,
  ) => {
    setSelectedOptionId(
      option.id,
    );

    setEditingContent(
      buildMealOptionContent(
        option,
      ),
    );
  };


  const saveMealContent =
    () => {
      if (
        !editingMeal
      ) {
        return;
      }


      handleMealContentChange(
        editingMeal.menuId,
        editingMeal.meal,
        editingContent.trim(),
      );


      toast.success(
        editingContent.trim()
          ? 'Opción asignada al plan.'
          : 'Contenido eliminado.',
      );


      closeMealEditor();
    };


  const clearMealContent =
    () => {
      setSelectedOptionId(
        null,
      );

      setEditingContent(
        '',
      );
    };


  const applyTemplate = (
    template: any,
  ) => {
    const confirmed =
      window.confirm(
        '¿Deseas aplicar esta plantilla? Se sobrescribirá el plan actual.',
      );


    if (
      !confirmed
    ) {
      return;
    }


    setMenus(
      template.menus,
    );


    if (
      template.suggested_meal_times
    ) {
      setMealTimes(
        template.suggested_meal_times,
      );
    }


    toast.success(
      'Plantilla aplicada.',
    );
  };


  const filteredMealOptions =
    useMemo(
      () => {
        if (
          !editingMeal
        ) {
          return [];
        }


        const normalizedSearch =
          optionSearch
            .trim()
            .toLocaleLowerCase(
              'es-MX',
            );


        return mealOptions.filter(
          option => {
            if (
              option.mealType !==
              editingMeal.meal
            ) {
              return false;
            }


            if (
              !normalizedSearch
            ) {
              return true;
            }


            const searchableText =
              `${option.name} ${option.description}`
                .toLocaleLowerCase(
                  'es-MX',
                );


            return searchableText.includes(
              normalizedSearch,
            );
          },
        );
      },
      [
        editingMeal,
        mealOptions,
        optionSearch,
      ],
    );


  if (
    loading
  ) {
    return (
      <div className="py-8 text-center text-[#6E7C72]">
        Cargando plan alimenticio...
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Botones de acción */}
      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={
              handleSave
            }
            disabled={
              saving
            }
            className="
              rounded-lg
              bg-[#BD7D4A]
              px-4
              py-2
              text-sm
              font-semibold
              text-white
              transition-colors
              hover:bg-[#F58634]
              disabled:opacity-50
            "
          >
            {saving
              ? 'Guardando...'
              : 'Guardar Plan'}
          </button>


          <button
            type="button"
            onClick={
              () =>
                setShowPreferences(
                  !showPreferences,
                )
            }
            className="
              rounded-lg
              border
              border-[#E6E3DE]
              px-4
              py-2
              text-sm
              font-semibold
              text-[#5A8C7A]
              transition-colors
              hover:bg-[#FAF9F7]
            "
          >
            {showPreferences
              ? 'Ocultar Preferencias'
              : 'Mostrar Preferencias'}
          </button>
        </div>


        {templates.length >
          0 && (
          <select
            onChange={
              event => {
                const template =
                  templates.find(
                    item =>
                      item.id ===
                      Number(
                        event.target.value,
                      ),
                  );

                if (
                  template
                ) {
                  applyTemplate(
                    template,
                  );
                }

                event.target.value =
                  '';
              }
            }
            className="
              rounded-lg
              border
              border-[#E6E3DE]
              bg-white
              px-3
              py-2
              text-sm
            "
            defaultValue=""
          >
            <option
              value=""
              disabled
            >
              Cargar plantilla...
            </option>

            {templates.map(
              template => (
                <option
                  key={
                    template.id
                  }
                  value={
                    template.id
                  }
                >
                  {template.name}
                </option>
              ),
            )}
          </select>
        )}
      </div>


      {/* Preferencias del paciente */}
      {showPreferences &&
        initialEvaluation && (
        <div
          className="
            overflow-hidden
            rounded-xl
            border
            border-[#E6E3DE]
            bg-white
            shadow-sm
          "
        >
          <div className="bg-[#5A8C7A] px-6 py-3">
            <h3 className="font-bold text-white">
              Información Base del Paciente
            </h3>

            <p className="text-xs text-white/80">
              Utiliza esta información para personalizar el plan.
            </p>
          </div>


          <div className="max-h-96 space-y-4 overflow-y-auto p-4">
            {initialEvaluation.personal_history && (
              <div className="border-b border-[#E6E3DE] pb-3">
                <h4 className="mb-2 font-semibold text-[#5A8C7A]">
                  Antecedentes Personales Patológicos
                </h4>

                <div className="space-y-1 text-sm text-[#6E7C72]">
                  <p>
                    <span className="font-medium">
                      Enfermedades actuales:
                    </span>
                    {' '}
                    {initialEvaluation.personal_history.current_diseases ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Enfermedades previas:
                    </span>
                    {' '}
                    {initialEvaluation.personal_history.past_diseases ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Cirugías:
                    </span>
                    {' '}
                    {initialEvaluation.personal_history.surgeries ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Medicamentos actuales:
                    </span>
                    {' '}
                    {initialEvaluation.personal_history.current_medications ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Suplementos:
                    </span>
                    {' '}
                    {initialEvaluation.personal_history.supplements ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Alergias/intolerancias:
                    </span>
                    {' '}

                    <span className="font-medium text-[#F58634]">
                      {initialEvaluation.personal_history.allergies_intolerances ||
                        '—'}
                    </span>
                  </p>
                </div>
              </div>
            )}


            {initialEvaluation.dietary_recall && (
              <div className="border-b border-[#E6E3DE] pb-3">
                <h4 className="mb-2 font-semibold text-[#5A8C7A]">
                  Recordatorio 24 horas
                </h4>

                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="font-medium">
                      Desayuno:
                    </span>
                    {' '}
                    {initialEvaluation.dietary_recall.breakfast ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Colación AM:
                    </span>
                    {' '}
                    {initialEvaluation.dietary_recall.morning_snack ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Comida:
                    </span>
                    {' '}
                    {initialEvaluation.dietary_recall.lunch ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Colación PM:
                    </span>
                    {' '}
                    {initialEvaluation.dietary_recall.afternoon_snack ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Cena:
                    </span>
                    {' '}
                    {initialEvaluation.dietary_recall.dinner ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Snacks/bebidas:
                    </span>
                    {' '}
                    {initialEvaluation.dietary_recall.snacks_beverages ||
                      '—'}
                  </p>
                </div>
              </div>
            )}


            {initialEvaluation.food_frequency && (
              <div className="border-b border-[#E6E3DE] pb-3">
                <h4 className="mb-2 font-semibold text-[#5A8C7A]">
                  Frecuencia de consumo
                </h4>

                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="font-medium">
                      Frutas:
                    </span>
                    {' '}
                    {initialEvaluation.food_frequency.fruits ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Verduras:
                    </span>
                    {' '}
                    {initialEvaluation.food_frequency.vegetables ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Proteínas:
                    </span>
                    {' '}
                    {initialEvaluation.food_frequency.proteins ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Lácteos:
                    </span>
                    {' '}
                    {initialEvaluation.food_frequency.dairy ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Cereales:
                    </span>
                    {' '}
                    {initialEvaluation.food_frequency.cereals ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Ultraprocesados:
                    </span>
                    {' '}
                    {initialEvaluation.food_frequency.ultraprocessed ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Azúcares:
                    </span>
                    {' '}
                    {initialEvaluation.food_frequency.sugars ||
                      '—'}
                  </p>
                </div>
              </div>
            )}


            {initialEvaluation.feeding_habits && (
              <div>
                <h4 className="mb-2 font-semibold text-[#5A8C7A]">
                  Hábitos alimentarios
                </h4>

                <div className="space-y-1 text-sm text-[#6E7C72]">
                  <p>
                    <span className="font-medium">
                      Horarios de comida:
                    </span>
                    {' '}
                    {initialEvaluation.feeding_habits.meal_schedules ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Ansiedad por comer:
                    </span>
                    {' '}
                    {initialEvaluation.feeding_habits.eating_anxiety ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Atracones:
                    </span>
                    {' '}
                    {initialEvaluation.feeding_habits.binges ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Comer emocional:
                    </span>
                    {' '}
                    {initialEvaluation.feeding_habits.emotional_eating ||
                      '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Comer fuera de casa:
                    </span>
                    {' '}
                    {initialEvaluation.feeding_habits.eating_out ||
                      '—'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Horarios */}
      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-[#E6E3DE]
          bg-white
          shadow-sm
        "
      >
        <div className="border-b border-[#E6E3DE] bg-[#FAF9F7] px-6 py-3">
          <h3 className="font-bold text-[#5A8C7A]">
            Horarios de Comidas
          </h3>
        </div>


        <div className="p-4">
          <div className="max-w-xl space-y-3">
            {MEAL_TYPES.map(
              meal => (
                <div
                  key={
                    meal
                  }
                  className="
                    flex
                    flex-col
                    gap-2
                    sm:flex-row
                    sm:items-center
                    sm:gap-4
                  "
                >
                  <div className="w-28">
                    <label className="text-sm font-semibold text-[#2C3E34]">
                      {meal}
                    </label>
                  </div>


                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={
                        mealTimes[
                          meal
                        ]?.start ||
                        ''
                      }
                      onChange={
                        event =>
                          handleMealTimeChange(
                            meal,
                            'start',
                            event.target.value,
                          )
                      }
                      className="
                        w-32
                        rounded
                        border
                        border-[#E6E3DE]
                        px-2
                        py-1
                        text-sm
                      "
                      disabled={
                        meal ===
                        'COLACION'
                      }
                    />

                    <span className="text-[#6E7C72]">
                      -
                    </span>

                    <input
                      type="time"
                      value={
                        mealTimes[
                          meal
                        ]?.end ||
                        ''
                      }
                      onChange={
                        event =>
                          handleMealTimeChange(
                            meal,
                            'end',
                            event.target.value,
                          )
                      }
                      className="
                        w-32
                        rounded
                        border
                        border-[#E6E3DE]
                        px-2
                        py-1
                        text-sm
                      "
                      disabled={
                        meal ===
                        'COLACION'
                      }
                    />
                  </div>


                  <div className="text-xs font-medium text-[#5A8C7A]">
                    {mealTimes[
                      meal
                    ]?.label ||
                      ''}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>


      {/* Plan alimenticio */}
      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-[#E6E3DE]
          bg-white
          shadow-sm
        "
      >
        <div className="border-b border-[#E6E3DE] bg-[#FAF9F7] px-6 py-3">
          <h3 className="font-bold text-[#5A8C7A]">
            Plan Alimenticio
          </h3>

          <p className="mt-1 text-xs text-[#6E7C72]">
            Haz clic en una celda para elegir una opción y personalizar las porciones.
          </p>
        </div>


        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E6E3DE]">
            <thead className="bg-[#FAF9F7]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6E7C72]">
                  Comida
                </th>

                {MENUS.map(
                  menu => (
                    <th
                      key={
                        menu.id
                      }
                      className="
                        min-w-64
                        px-4
                        py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-[#6E7C72]
                      "
                    >
                      {menu.name}

                      <span className="block text-[10px] font-normal">
                        {menu.days
                          .map(
                            day =>
                              day.charAt(
                                0,
                              ) +
                              day
                                .slice(
                                  1,
                                )
                                .toLowerCase(),
                          )
                          .join(
                            ', ',
                          )}
                      </span>
                    </th>
                  ),
                )}
              </tr>
            </thead>


            <tbody className="divide-y divide-[#E6E3DE] bg-white">
              {MEAL_TYPES.map(
                meal => (
                  <tr
                    key={
                      meal
                    }
                    className="align-top hover:bg-[#FAF9F7]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 align-top text-sm font-semibold text-[#2C3E34]">
                      {meal}

                      {mealTimes[
                        meal
                      ]?.label && (
                        <span className="block text-xs font-normal text-[#6E7C72]">
                          {mealTimes[
                            meal
                          ].label}
                        </span>
                      )}
                    </td>


                    {MENUS.map(
                      menu => {
                        const content =
                          getMealContent(
                            menu.id,
                            meal,
                          );


                        return (
                          <td
                            key={
                              menu.id
                            }
                            className="px-4 py-3 align-top"
                          >
                            <button
                              type="button"
                              onClick={
                                () =>
                                  openMealEditor(
                                    menu.id,
                                    meal,
                                  )
                              }
                              className="
                                min-h-20
                                w-full
                                rounded-lg
                                border
                                border-transparent
                                p-2
                                text-left
                                text-sm
                                text-[#6E7C72]
                                transition-colors
                                hover:border-[#BD7D4A]/40
                                hover:bg-[#BD7D4A]/5
                                hover:text-[#5A8C7A]
                              "
                            >
                              {content ? (
                                <div className="whitespace-pre-wrap break-words">
                                  {content}
                                </div>
                              ) : (
                                <span className="italic text-[#B9B5AE]">
                                  Clic para elegir menú
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      },
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Selector y editor */}
      {editingMeal && (
        <div
          className="
            fixed
            inset-0
            z-[70]
            flex
            items-center
            justify-center
            bg-black/50
            p-4
          "
          onMouseDown={
            event => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeMealEditor();
              }
            }
          }
        >
          <div
            className="
              flex
              max-h-[92vh]
              w-full
              max-w-5xl
              flex-col
              overflow-hidden
              rounded-xl
              border
              border-[#E6E3DE]
              bg-white
              shadow-2xl
            "
          >
            {/* Encabezado */}
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
                border-b
                border-[#E6E3DE]
                bg-[#FAF9F7]
                px-6
                py-4
              "
            >
              <div>
                <h2 className="text-xl font-bold text-[#5A8C7A]">
                  Elegir {editingMeal.meal.toLowerCase()}
                </h2>

                <p className="mt-1 text-sm text-[#6E7C72]">
                  {MENUS.find(
                    menu =>
                      menu.id ===
                      editingMeal.menuId,
                  )?.name}
                  . Selecciona una opción y ajusta las porciones del paciente.
                </p>
              </div>


              <button
                type="button"
                onClick={
                  closeMealEditor
                }
                className="
                  rounded-full
                  p-2
                  text-[#6E7C72]
                  hover:bg-white
                  hover:text-[#2C3E34]
                "
                aria-label="Cerrar editor"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>


            <div
              className="
                grid
                flex-1
                overflow-hidden
                md:grid-cols-2
              "
            >
              {/* Catálogo */}
              <div
                className="
                  overflow-y-auto
                  border-b
                  border-[#E6E3DE]
                  p-5
                  md:border-b-0
                  md:border-r
                "
              >
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-semibold text-[#2C3E34]">
                    Opciones disponibles
                  </label>

                  <input
                    type="search"
                    value={
                      optionSearch
                    }
                    onChange={
                      event =>
                        setOptionSearch(
                          event.target.value,
                        )
                    }
                    placeholder={`Buscar ${editingMeal.meal.toLowerCase()}...`}
                    className="
                      w-full
                      rounded-lg
                      border
                      border-[#E6E3DE]
                      px-3
                      py-2
                      text-sm
                      outline-none
                      focus:border-[#5A8C7A]
                      focus:ring-2
                      focus:ring-[#5A8C7A]/15
                    "
                  />
                </div>


                <div className="space-y-3">
                  {filteredMealOptions.length ===
                  0 ? (
                    <div
                      className="
                        rounded-lg
                        border
                        border-dashed
                        border-[#E6E3DE]
                        px-4
                        py-8
                        text-center
                      "
                    >
                      <p className="font-semibold text-[#2C3E34]">
                        No se encontraron opciones
                      </p>

                      <p className="mt-1 text-sm text-[#6E7C72]">
                        Revisa que existan registros activos para esta comida.
                      </p>
                    </div>
                  ) : (
                    filteredMealOptions.map(
                      option => {
                        const isSelected =
                          selectedOptionId ===
                          option.id;


                        return (
                          <button
                            key={
                              option.id
                            }
                            type="button"
                            onClick={
                              () =>
                                selectMealOption(
                                  option,
                                )
                            }
                            className={`
                              w-full
                              rounded-xl
                              border
                              p-4
                              text-left
                              transition-all

                              ${
                                isSelected
                                  ? 'border-[#BD7D4A] bg-[#BD7D4A]/10 ring-2 ring-[#BD7D4A]/15'
                                  : 'border-[#E6E3DE] bg-white hover:border-[#5A8C7A]/50 hover:bg-[#FAF9F7]'
                              }
                            `}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`
                                  mt-0.5
                                  flex
                                  h-5
                                  w-5
                                  flex-none
                                  items-center
                                  justify-center
                                  rounded-full
                                  border

                                  ${
                                    isSelected
                                      ? 'border-[#BD7D4A] bg-[#BD7D4A]'
                                      : 'border-[#C9C5BE] bg-white'
                                  }
                                `}
                              >
                                {isSelected && (
                                  <svg
                                    className="h-3 w-3 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>


                              <div className="min-w-0">
                                <h3 className="font-bold text-[#2C3E34]">
                                  {option.name}
                                </h3>

                                <p className="mt-2 whitespace-pre-line text-xs leading-5 text-[#6E7C72]">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      },
                    )
                  )}
                </div>
              </div>


              {/* Personalización */}
              <div className="overflow-y-auto p-5">
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-semibold text-[#2C3E34]">
                      Personalizar porciones e indicaciones
                    </label>

                    {selectedOptionId && (
                      <span
                        className="
                          rounded-full
                          bg-[#A8CF45]/20
                          px-2.5
                          py-1
                          text-xs
                          font-semibold
                          text-[#4A6B59]
                        "
                      >
                        Opción seleccionada
                      </span>
                    )}
                  </div>


                  <textarea
                    value={
                      editingContent
                    }
                    onChange={
                      event =>
                        setEditingContent(
                          event.target.value,
                        )
                    }
                    rows={18}
                    className="
                      mt-3
                      w-full
                      resize-y
                      rounded-lg
                      border
                      border-[#E6E3DE]
                      px-3
                      py-3
                      font-mono
                      text-sm
                      leading-6
                      outline-none
                      focus:border-[#5A8C7A]
                      focus:ring-2
                      focus:ring-[#5A8C7A]/15
                    "
                    placeholder="Selecciona una opción del catálogo o escribe un menú personalizado."
                  />

                  <p className="mt-2 text-xs text-[#6E7C72]">
                    Puedes cambiar gramos, piezas, ingredientes, bebidas y cualquier indicación antes de asignarla.
                  </p>
                </div>


                <button
                  type="button"
                  onClick={
                    clearMealContent
                  }
                  disabled={
                    !editingContent
                  }
                  className="
                    rounded-lg
                    border
                    border-red-200
                    px-3
                    py-2
                    text-sm
                    font-semibold
                    text-red-600
                    hover:bg-red-50
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Limpiar contenido
                </button>
              </div>
            </div>


            {/* Acciones */}
            <div
              className="
                flex
                flex-col-reverse
                gap-3
                border-t
                border-[#E6E3DE]
                bg-[#FAF9F7]
                px-6
                py-4
                sm:flex-row
                sm:justify-end
              "
            >
              <button
                type="button"
                onClick={
                  closeMealEditor
                }
                className="
                  rounded-lg
                  border
                  border-[#E6E3DE]
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-[#6E7C72]
                  hover:bg-[#F4F2EE]
                "
              >
                Cancelar
              </button>


              <button
                type="button"
                onClick={
                  saveMealContent
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-[#BD7D4A]
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-[#F58634]
                "
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>

                Asignar a la celda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}