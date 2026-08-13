'use server';

import postgres from 'postgres';
import { revalidatePath } from 'next/cache';


const sql = postgres(
  process.env.POSTGRES_URL!,
  {
    ssl: 'require',
  },
);


export type MealOptionType =
  | 'DESAYUNO'
  | 'ALMUERZO'
  | 'COLACION'
  | 'COMIDA'
  | 'CENA';


export interface MealOption {
  id: number;

  mealType:
    MealOptionType;

  name: string;

  description: string;

  isActive: boolean;

  createdAt?: string;

  updatedAt?: string;
}


export interface MealOptionInput {
  mealType:
    MealOptionType;

  name: string;

  description: string;
}


interface ActionResult {
  success: boolean;

  message: string;
}


/**
 * Obtiene únicamente las opciones activas.
 * Esta función es la utilizada en el plan alimenticio.
 */
export async function getActiveMealOptions():
Promise<MealOption[]> {
  try {
    const options =
      await sql`
        SELECT
          id,
          meal_type,
          name,
          description,
          is_active,
          created_at,
          updated_at

        FROM tblmeal_options

        WHERE is_active = TRUE

        ORDER BY
          CASE meal_type
            WHEN 'DESAYUNO' THEN 1
            WHEN 'ALMUERZO' THEN 2
            WHEN 'COLACION' THEN 3
            WHEN 'COMIDA' THEN 4
            WHEN 'CENA' THEN 5
            ELSE 6
          END,

          name ASC
      `;


    return options.map(
      option => ({
        id:
          Number(
            option.id,
          ),

        mealType:
          String(
            option.meal_type,
          ) as MealOptionType,

        name:
          String(
            option.name,
          ),

        description:
          String(
            option.description,
          ),

        isActive:
          Boolean(
            option.is_active,
          ),

        createdAt:
          option.created_at
            ? String(
                option.created_at,
              )
            : undefined,

        updatedAt:
          option.updated_at
            ? String(
                option.updated_at,
              )
            : undefined,
      }),
    );
  } catch (error) {
    console.error(
      'Error al obtener opciones activas:',
      error,
    );

    return [];
  }
}


/**
 * Obtiene todas las opciones, incluyendo las desactivadas.
 * Esta función se utilizará en el módulo administrativo.
 */
export async function getAllMealOptions():
Promise<MealOption[]> {
  try {
    const options =
      await sql`
        SELECT
          id,
          meal_type,
          name,
          description,
          is_active,
          created_at,
          updated_at

        FROM tblmeal_options

        ORDER BY
          CASE meal_type
            WHEN 'DESAYUNO' THEN 1
            WHEN 'ALMUERZO' THEN 2
            WHEN 'COLACION' THEN 3
            WHEN 'COMIDA' THEN 4
            WHEN 'CENA' THEN 5
            ELSE 6
          END,

          is_active DESC,

          name ASC
      `;


    return options.map(
      option => ({
        id:
          Number(
            option.id,
          ),

        mealType:
          String(
            option.meal_type,
          ) as MealOptionType,

        name:
          String(
            option.name,
          ),

        description:
          String(
            option.description,
          ),

        isActive:
          Boolean(
            option.is_active,
          ),

        createdAt:
          option.created_at
            ? String(
                option.created_at,
              )
            : undefined,

        updatedAt:
          option.updated_at
            ? String(
                option.updated_at,
              )
            : undefined,
      }),
    );
  } catch (error) {
    console.error(
      'Error al obtener las opciones del menú:',
      error,
    );

    return [];
  }
}


/**
 * Crea una nueva opción de comida.
 */
export async function createMealOption(
  input: MealOptionInput,
): Promise<ActionResult> {
  try {
    const mealType =
      input.mealType;

    const name =
      input.name.trim();

    const description =
      input.description.trim();


    if (
      !mealType ||
      !name ||
      !description
    ) {
      return {
        success:
          false,

        message:
          'Completa el tipo de comida, nombre y preparación.',
      };
    }


    const validTypes:
    MealOptionType[] = [
      'DESAYUNO',
      'ALMUERZO',
      'COLACION',
      'COMIDA',
      'CENA',
    ];


    if (
      !validTypes.includes(
        mealType,
      )
    ) {
      return {
        success:
          false,

        message:
          'El tipo de comida seleccionado no es válido.',
      };
    }


    const existing =
      await sql`
        SELECT
          id,
          is_active

        FROM tblmeal_options

        WHERE meal_type =
          ${mealType}

          AND LOWER(name) =
          LOWER(${name})

        LIMIT 1
      `;


    if (
      existing.length >
      0
    ) {
      if (
        existing[0]
          .is_active
      ) {
        return {
          success:
            false,

          message:
            'Ya existe una opción activa con ese nombre.',
        };
      }


      await sql`
        UPDATE tblmeal_options

        SET
          description =
            ${description},

          is_active =
            TRUE,

          updated_at =
            NOW()

        WHERE id =
          ${Number(
            existing[0].id,
          )}
      `;


      revalidatePath(
        '/admin/menus',
      );

      revalidatePath(
        '/admin/historial',
      );


      return {
        success:
          true,

        message:
          'La opción fue reactivada y actualizada.',
      };
    }


    await sql`
      INSERT INTO tblmeal_options (
        meal_type,
        name,
        description,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        ${mealType},
        ${name},
        ${description},
        TRUE,
        NOW(),
        NOW()
      )
    `;


    revalidatePath(
      '/admin/menus',
    );

    revalidatePath(
      '/admin/historial',
    );


    return {
      success:
        true,

      message:
        'Opción agregada correctamente.',
    };
  } catch (error) {
    console.error(
      'Error al crear opción:',
      error,
    );


    return {
      success:
        false,

      message:
        'No se pudo agregar la opción.',
    };
  }
}


/**
 * Actualiza una opción existente.
 */
export async function updateMealOption(
  id: number,
  input: MealOptionInput,
): Promise<ActionResult> {
  try {
    const optionId =
      Number(
        id,
      );

    const mealType =
      input.mealType;

    const name =
      input.name.trim();

    const description =
      input.description.trim();


    if (
      !Number.isInteger(
        optionId,
      ) ||
      optionId <=
        0
    ) {
      return {
        success:
          false,

        message:
          'La opción seleccionada no es válida.',
      };
    }


    if (
      !mealType ||
      !name ||
      !description
    ) {
      return {
        success:
          false,

        message:
          'Completa el tipo de comida, nombre y preparación.',
      };
    }


    const duplicate =
      await sql`
        SELECT id

        FROM tblmeal_options

        WHERE meal_type =
          ${mealType}

          AND LOWER(name) =
          LOWER(${name})

          AND id !=
          ${optionId}

        LIMIT 1
      `;


    if (
      duplicate.length >
      0
    ) {
      return {
        success:
          false,

        message:
          'Ya existe otra opción con ese nombre.',
      };
    }


    const updated =
      await sql`
        UPDATE tblmeal_options

        SET
          meal_type =
            ${mealType},

          name =
            ${name},

          description =
            ${description},

          updated_at =
            NOW()

        WHERE id =
          ${optionId}

        RETURNING id
      `;


    if (
      updated.length ===
      0
    ) {
      return {
        success:
          false,

        message:
          'No se encontró la opción que deseas editar.',
      };
    }


    revalidatePath(
      '/admin/menus',
    );

    revalidatePath(
      '/admin/historial',
    );


    return {
      success:
        true,

      message:
        'Opción actualizada correctamente.',
    };
  } catch (error) {
    console.error(
      'Error al actualizar opción:',
      error,
    );


    return {
      success:
        false,

      message:
        'No se pudo actualizar la opción.',
    };
  }
}


/**
 * Activa o desactiva una opción.
 */
export async function setMealOptionStatus(
  id: number,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    const optionId =
      Number(
        id,
      );


    if (
      !Number.isInteger(
        optionId,
      ) ||
      optionId <=
        0
    ) {
      return {
        success:
          false,

        message:
          'La opción seleccionada no es válida.',
      };
    }


    const updated =
      await sql`
        UPDATE tblmeal_options

        SET
          is_active =
            ${isActive},

          updated_at =
            NOW()

        WHERE id =
          ${optionId}

        RETURNING id
      `;


    if (
      updated.length ===
      0
    ) {
      return {
        success:
          false,

        message:
          'No se encontró la opción.',
      };
    }


    revalidatePath(
      '/admin/menus',
    );

    revalidatePath(
      '/admin/historial',
    );


    return {
      success:
        true,

      message:
        isActive
          ? 'Opción activada correctamente.'
          : 'Opción desactivada correctamente.',
    };
  } catch (error) {
    console.error(
      'Error al cambiar estado de opción:',
      error,
    );


    return {
      success:
        false,

      message:
        'No se pudo cambiar el estado de la opción.',
    };
  }
}