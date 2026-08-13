'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  createMealOption,
  getAllMealOptions,
  setMealOptionStatus,
  updateMealOption,
} from '@/lib/meal-options-actions';

import type {
  MealOption,
  MealOptionInput,
  MealOptionType,
} from '@/lib/meal-options-actions';

import {
  toast,
} from 'react-hot-toast';


interface MealOptionsManagerProps {
  initialOptions: MealOption[];
}


type FilterType =
  | 'TODOS'
  | MealOptionType;


interface FormState {
  mealType: MealOptionType;

  name: string;

  description: string;
}


const MEAL_TYPES: {
  value: MealOptionType;

  label: string;
}[] = [
  {
    value:
      'DESAYUNO',

    label:
      'Desayuno',
  },

  {
    value:
      'ALMUERZO',

    label:
      'Almuerzo',
  },

  {
    value:
      'COLACION',

    label:
      'Colación',
  },

  {
    value:
      'COMIDA',

    label:
      'Comida',
  },

  {
    value:
      'CENA',

    label:
      'Cena',
  },
];


const EMPTY_FORM:
FormState = {
  mealType:
    'DESAYUNO',

  name:
    '',

  description:
    '',
};


function getMealTypeLabel(
  mealType: MealOptionType,
): string {
  return (
    MEAL_TYPES.find(
      item =>
        item.value ===
        mealType,
    )?.label ??
    mealType
  );
}


function getMealTypeClasses(
  mealType: MealOptionType,
): string {
  switch (
    mealType
  ) {
    case 'DESAYUNO':
      return (
        'bg-yellow-100 text-yellow-800'
      );

    case 'ALMUERZO':
      return (
        'bg-orange-100 text-orange-800'
      );

    case 'COLACION':
      return (
        'bg-purple-100 text-purple-800'
      );

    case 'COMIDA':
      return (
        'bg-green-100 text-green-800'
      );

    case 'CENA':
      return (
        'bg-blue-100 text-blue-800'
      );

    default:
      return (
        'bg-gray-100 text-gray-700'
      );
  }
}


export default function MealOptionsManager({
  initialOptions,
}: MealOptionsManagerProps) {
  const [
    options,
    setOptions,
  ] =
    useState<MealOption[]>(
      initialOptions,
    );


  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<FilterType>(
      'TODOS',
    );


  const [
    search,
    setSearch,
  ] =
    useState(
      '',
    );


  const [
    showInactive,
    setShowInactive,
  ] =
    useState(
      true,
    );


  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(
      false,
    );


  const [
    editingOption,
    setEditingOption,
  ] =
    useState<MealOption | null>(
      null,
    );


  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      EMPTY_FORM,
    );


  const [
    saving,
    setSaving,
  ] =
    useState(
      false,
    );


  const [
    changingStatusId,
    setChangingStatusId,
  ] =
    useState<number | null>(
      null,
    );


  const refreshOptions =
    async () => {
      try {
        const updatedOptions =
          await getAllMealOptions();

        setOptions(
          updatedOptions,
        );
      } catch (error) {
        console.error(
          'Error al actualizar opciones:',
          error,
        );

        toast.error(
          'No se pudo actualizar el catálogo.',
        );
      }
    };


  const openCreateModal =
    () => {
      setEditingOption(
        null,
      );

      setForm(
        EMPTY_FORM,
      );

      setModalOpen(
        true,
      );
    };


  const openEditModal = (
    option: MealOption,
  ) => {
    setEditingOption(
      option,
    );

    setForm({
      mealType:
        option.mealType,

      name:
        option.name,

      description:
        option.description,
    });

    setModalOpen(
      true,
    );
  };


  const closeModal =
    () => {
      if (
        saving
      ) {
        return;
      }

      setModalOpen(
        false,
      );

      setEditingOption(
        null,
      );

      setForm(
        EMPTY_FORM,
      );
    };


  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();


      const input:
      MealOptionInput = {
        mealType:
          form.mealType,

        name:
          form.name.trim(),

        description:
          form.description.trim(),
      };


      if (
        !input.name ||
        !input.description
      ) {
        toast.error(
          'Completa el nombre y la preparación.',
        );

        return;
      }


      setSaving(
        true,
      );


      try {
        const result =
          editingOption
            ? await updateMealOption(
                editingOption.id,
                input,
              )
            : await createMealOption(
                input,
              );


        if (
          !result.success
        ) {
          toast.error(
            result.message,
          );

          return;
        }


        toast.success(
          result.message,
        );


        await refreshOptions();

        closeModal();
      } catch (error) {
        console.error(
          'Error al guardar opción:',
          error,
        );

        toast.error(
          'Ocurrió un error al guardar la opción.',
        );
      } finally {
        setSaving(
          false,
        );
      }
    };


  const handleChangeStatus =
    async (
      option: MealOption,
    ) => {
      const nextStatus =
        !option.isActive;


      const confirmed =
        window.confirm(
          nextStatus
            ? `¿Deseas activar "${option.name}"?`
            : `¿Deseas desactivar "${option.name}"? Ya no aparecerá al crear nuevos planes.`,
        );


      if (
        !confirmed
      ) {
        return;
      }


      setChangingStatusId(
        option.id,
      );


      try {
        const result =
          await setMealOptionStatus(
            option.id,
            nextStatus,
          );


        if (
          !result.success
        ) {
          toast.error(
            result.message,
          );

          return;
        }


        toast.success(
          result.message,
        );


        await refreshOptions();
      } catch (error) {
        console.error(
          'Error al cambiar estado:',
          error,
        );

        toast.error(
          'No se pudo cambiar el estado.',
        );
      } finally {
        setChangingStatusId(
          null,
        );
      }
    };


  const filteredOptions =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLocaleLowerCase(
              'es-MX',
            );


        return options.filter(
          option => {
            if (
              selectedFilter !==
                'TODOS' &&
              option.mealType !==
                selectedFilter
            ) {
              return false;
            }


            if (
              !showInactive &&
              !option.isActive
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
        options,
        search,
        selectedFilter,
        showInactive,
      ],
    );


  const activeCount =
    options.filter(
      option =>
        option.isActive,
    ).length;


  const inactiveCount =
    options.length -
    activeCount;


  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          className="
            rounded-xl
            border
            border-[#E6E3DE]
            bg-white
            p-5
            shadow-sm
          "
        >
          <p className="text-sm font-medium text-[#6E7C72]">
            Total de opciones
          </p>

          <p className="mt-1 text-3xl font-bold text-[#5A8C7A]">
            {options.length}
          </p>
        </div>


        <div
          className="
            rounded-xl
            border
            border-[#E6E3DE]
            bg-white
            p-5
            shadow-sm
          "
        >
          <p className="text-sm font-medium text-[#6E7C72]">
            Opciones activas
          </p>

          <p className="mt-1 text-3xl font-bold text-green-700">
            {activeCount}
          </p>
        </div>


        <div
          className="
            rounded-xl
            border
            border-[#E6E3DE]
            bg-white
            p-5
            shadow-sm
          "
        >
          <p className="text-sm font-medium text-[#6E7C72]">
            Opciones desactivadas
          </p>

          <p className="mt-1 text-3xl font-bold text-gray-500">
            {inactiveCount}
          </p>
        </div>
      </div>


      {/* Controles */}
      <div
        className="
          rounded-xl
          border
          border-[#E6E3DE]
          bg-white
          p-5
          shadow-sm
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          <div
            className="
              grid
              flex-1
              grid-cols-1
              gap-4
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            <div>
              <label
                htmlFor="meal-search"
                className="
                  mb-1.5
                  block
                  text-sm
                  font-semibold
                  text-[#2C3E34]
                "
              >
                Buscar opción
              </label>

              <input
                id="meal-search"
                type="search"
                value={
                  search
                }
                onChange={
                  event =>
                    setSearch(
                      event.target.value,
                    )
                }
                placeholder="Nombre o ingrediente..."
                className="
                  w-full
                  rounded-lg
                  border
                  border-[#E6E3DE]
                  px-3
                  py-2.5
                  text-sm
                  outline-none
                  focus:border-[#5A8C7A]
                  focus:ring-2
                  focus:ring-[#5A8C7A]/15
                "
              />
            </div>


            <div>
              <label
                htmlFor="meal-filter"
                className="
                  mb-1.5
                  block
                  text-sm
                  font-semibold
                  text-[#2C3E34]
                "
              >
                Tipo de comida
              </label>

              <select
                id="meal-filter"
                value={
                  selectedFilter
                }
                onChange={
                  event =>
                    setSelectedFilter(
                      event.target.value as FilterType,
                    )
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-[#E6E3DE]
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  outline-none
                  focus:border-[#5A8C7A]
                "
              >
                <option value="TODOS">
                  Todos
                </option>

                {MEAL_TYPES.map(
                  mealType => (
                    <option
                      key={
                        mealType.value
                      }
                      value={
                        mealType.value
                      }
                    >
                      {mealType.label}
                    </option>
                  ),
                )}
              </select>
            </div>


            <label
              className="
                flex
                cursor-pointer
                items-center
                gap-3
                rounded-lg
                border
                border-[#E6E3DE]
                px-3
                py-2.5
              "
            >
              <input
                type="checkbox"
                checked={
                  showInactive
                }
                onChange={
                  event =>
                    setShowInactive(
                      event.target.checked,
                    )
                }
                className="
                  h-4
                  w-4
                  accent-[#5A8C7A]
                "
              />

              <span className="text-sm font-medium text-[#2C3E34]">
                Mostrar desactivadas
              </span>
            </label>
          </div>


          <button
            type="button"
            onClick={
              openCreateModal
            }
            className="
              rounded-lg
              bg-[#BD7D4A]
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              transition-colors
              hover:bg-[#F58634]
            "
          >
            + Agregar opción
          </button>
        </div>
      </div>


      {/* Catálogo */}
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
        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-[#E6E3DE]
            bg-[#FAF9F7]
            px-5
            py-4
          "
        >
          <div>
            <h2 className="font-bold text-[#5A8C7A]">
              Catálogo de opciones
            </h2>

            <p className="text-xs text-[#6E7C72]">
              Las opciones activas aparecerán al crear el plan alimenticio.
            </p>
          </div>


          <span
            className="
              rounded-full
              bg-[#5A8C7A]/10
              px-3
              py-1
              text-xs
              font-semibold
              text-[#5A8C7A]
            "
          >
            {filteredOptions.length}
            {' '}
            resultados
          </span>
        </div>


        {filteredOptions.length ===
        0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-semibold text-[#2C3E34]">
              No se encontraron opciones
            </p>

            <p className="mt-1 text-sm text-[#6E7C72]">
              Cambia los filtros o agrega una nueva opción.
            </p>
          </div>
        ) : (
          <div
            className="
              grid
              grid-cols-1
              gap-4
              p-5
              md:grid-cols-2
              xl:grid-cols-3
            "
          >
            {filteredOptions.map(
              option => (
                <article
                  key={
                    option.id
                  }
                  className={`
                    flex
                    flex-col
                    rounded-xl
                    border
                    p-4
                    transition-shadow
                    hover:shadow-md

                    ${
                      option.isActive
                        ? 'border-[#E6E3DE] bg-white'
                        : 'border-gray-200 bg-gray-50 opacity-75'
                    }
                  `}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className={`
                          inline-block
                          rounded-full
                          px-2.5
                          py-1
                          text-xs
                          font-semibold

                          ${getMealTypeClasses(
                            option.mealType,
                          )}
                        `}
                      >
                        {getMealTypeLabel(
                          option.mealType,
                        )}
                      </span>


                      <h3
                        className="
                          mt-2
                          break-words
                          text-base
                          font-bold
                          text-[#2C3E34]
                        "
                      >
                        {option.name}
                      </h3>
                    </div>


                    <span
                      className={`
                        flex-none
                        rounded-full
                        px-2
                        py-1
                        text-xs
                        font-semibold

                        ${
                          option.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }
                      `}
                    >
                      {option.isActive
                        ? 'Activa'
                        : 'Inactiva'}
                    </span>
                  </div>


                  <div
                    className="
                      max-h-52
                      flex-1
                      overflow-y-auto
                      whitespace-pre-line
                      rounded-lg
                      bg-[#FAF9F7]
                      p-3
                      text-sm
                      leading-6
                      text-[#6E7C72]
                    "
                  >
                    {option.description}
                  </div>


                  <div
                    className="
                      mt-4
                      flex
                      flex-wrap
                      gap-2
                      border-t
                      border-[#E6E3DE]
                      pt-3
                    "
                  >
                    <button
                      type="button"
                      onClick={
                        () =>
                          openEditModal(
                            option,
                          )
                      }
                      className="
                        flex-1
                        rounded-lg
                        border
                        border-[#5A8C7A]
                        px-3
                        py-2
                        text-sm
                        font-semibold
                        text-[#5A8C7A]
                        hover:bg-[#5A8C7A]/5
                      "
                    >
                      Editar
                    </button>


                    <button
                      type="button"
                      onClick={
                        () =>
                          handleChangeStatus(
                            option,
                          )
                      }
                      disabled={
                        changingStatusId ===
                        option.id
                      }
                      className={`
                        flex-1
                        rounded-lg
                        px-3
                        py-2
                        text-sm
                        font-semibold
                        disabled:cursor-not-allowed
                        disabled:opacity-50

                        ${
                          option.isActive
                            ? 'border border-red-200 text-red-600 hover:bg-red-50'
                            : 'bg-[#5A8C7A] text-white hover:bg-[#4E7B6B]'
                        }
                      `}
                    >
                      {changingStatusId ===
                      option.id
                        ? 'Procesando...'
                        : option.isActive
                          ? 'Desactivar'
                          : 'Activar'}
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </div>


      {/* Modal de creación y edición */}
      {modalOpen && (
        <div
          className="
            fixed
            inset-0
            z-[80]
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
                closeModal();
              }
            }
          }
        >
          <div
            className="
              max-h-[92vh]
              w-full
              max-w-2xl
              overflow-y-auto
              rounded-xl
              border
              border-[#E6E3DE]
              bg-white
              shadow-2xl
            "
          >
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
                  {editingOption
                    ? 'Editar opción'
                    : 'Agregar nueva opción'}
                </h2>

                <p className="mt-1 text-sm text-[#6E7C72]">
                  Registra el nombre, tipo de comida y preparación.
                </p>
              </div>


              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="
                  rounded-full
                  p-2
                  text-xl
                  text-[#6E7C72]
                  hover:bg-white
                "
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>


            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="space-y-5 p-6">
                <div>
                  <label
                    htmlFor="form-meal-type"
                    className="
                      mb-1.5
                      block
                      text-sm
                      font-semibold
                      text-[#2C3E34]
                    "
                  >
                    Tipo de comida
                  </label>

                  <select
                    id="form-meal-type"
                    value={
                      form.mealType
                    }
                    onChange={
                      event =>
                        setForm(
                          previousForm => ({
                            ...previousForm,

                            mealType:
                              event.target.value as MealOptionType,
                          }),
                        )
                    }
                    className="
                      w-full
                      rounded-lg
                      border
                      border-[#E6E3DE]
                      bg-white
                      px-3
                      py-2.5
                      outline-none
                      focus:border-[#5A8C7A]
                    "
                  >
                    {MEAL_TYPES.map(
                      mealType => (
                        <option
                          key={
                            mealType.value
                          }
                          value={
                            mealType.value
                          }
                        >
                          {mealType.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>


                <div>
                  <label
                    htmlFor="form-name"
                    className="
                      mb-1.5
                      block
                      text-sm
                      font-semibold
                      text-[#2C3E34]
                    "
                  >
                    Nombre de la opción
                  </label>

                  <input
                    id="form-name"
                    type="text"
                    value={
                      form.name
                    }
                    onChange={
                      event =>
                        setForm(
                          previousForm => ({
                            ...previousForm,

                            name:
                              event.target.value,
                          }),
                        )
                    }
                    maxLength={150}
                    placeholder="Ejemplo: Ensalada de pollo con aguacate"
                    className="
                      w-full
                      rounded-lg
                      border
                      border-[#E6E3DE]
                      px-3
                      py-2.5
                      outline-none
                      focus:border-[#5A8C7A]
                      focus:ring-2
                      focus:ring-[#5A8C7A]/15
                    "
                    required
                  />

                  <p className="mt-1 text-right text-xs text-[#6E7C72]">
                    {form.name.length}
                    /150
                  </p>
                </div>


                <div>
                  <label
                    htmlFor="form-description"
                    className="
                      mb-1.5
                      block
                      text-sm
                      font-semibold
                      text-[#2C3E34]
                    "
                  >
                    Ingredientes y preparación
                  </label>

                  <textarea
                    id="form-description"
                    value={
                      form.description
                    }
                    onChange={
                      event =>
                        setForm(
                          previousForm => ({
                            ...previousForm,

                            description:
                              event.target.value,
                          }),
                        )
                    }
                    rows={12}
                    placeholder={`Ejemplo:

- 120 g de pechuga de pollo.
- 1/3 de pieza de aguacate.
- Verduras al gusto.

Preparar en un sartén y acompañar con agua natural.`}
                    className="
                      w-full
                      resize-y
                      rounded-lg
                      border
                      border-[#E6E3DE]
                      px-3
                      py-3
                      text-sm
                      leading-6
                      outline-none
                      focus:border-[#5A8C7A]
                      focus:ring-2
                      focus:ring-[#5A8C7A]/15
                    "
                    required
                  />

                  <p className="mt-1 text-xs text-[#6E7C72]">
                    Estas cantidades podrán modificarse para cada paciente al asignar el plan.
                  </p>
                </div>
              </div>


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
                    closeModal
                  }
                  disabled={
                    saving
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
                    disabled:opacity-50
                  "
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="
                    rounded-lg
                    bg-[#BD7D4A]
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    hover:bg-[#F58634]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {saving
                    ? 'Guardando...'
                    : editingOption
                      ? 'Guardar cambios'
                      : 'Agregar opción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}