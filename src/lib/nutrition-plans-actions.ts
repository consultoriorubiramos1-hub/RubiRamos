'use server';

import postgres from 'postgres';
import { revalidatePath } from 'next/cache';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Obtener el plan activo de un paciente
export async function getActiveNutritionPlan(patientId: number) {
  try {
    const [plan] = await sql`
      SELECT * FROM tblnutrition_plans
      WHERE patient_id = ${patientId} AND is_active = true
      ORDER BY start_date DESC
      LIMIT 1
    `;
    
    if (plan) {
      plan.menus = typeof plan.menus === 'string' ? JSON.parse(plan.menus) : plan.menus;
      plan.meal_times = typeof plan.meal_times === 'string' ? JSON.parse(plan.meal_times) : plan.meal_times;
    }
    
    return plan || null;
  } catch (error) {
    console.error('Error al obtener plan activo:', error);
    return null;
  }
}

// Guardar plan alimenticio
export async function saveNutritionPlan(data: {
  patient_id: number;
  name: string;
  description: string;
  start_date: Date;
  end_date?: Date | null;
  menus: any;
  meal_times: any;
}) {
  try {
    const [existingPlan] = await sql`
      SELECT id FROM tblnutrition_plans
      WHERE patient_id = ${data.patient_id} AND is_active = true
    `;

    let planId: number;

    if (existingPlan) {
      await sql`
        UPDATE tblnutrition_plans
        SET 
          name = ${data.name},
          description = ${data.description},
          start_date = ${data.start_date},
          end_date = ${data.end_date || null},
          menus = ${JSON.stringify(data.menus)}::jsonb,
          meal_times = ${JSON.stringify(data.meal_times)}::jsonb,
          updated_at = NOW()
        WHERE id = ${existingPlan.id}
      `;
      planId = existingPlan.id;
    } else {
      const [newPlan] = await sql`
        INSERT INTO tblnutrition_plans (
          patient_id, name, description, start_date, end_date, menus, meal_times, is_active
        ) VALUES (
          ${data.patient_id}, ${data.name}, ${data.description},
          ${data.start_date}, ${data.end_date || null},
          ${JSON.stringify(data.menus)}::jsonb,
          ${JSON.stringify(data.meal_times)}::jsonb,
          true
        )
        RETURNING id
      `;
      planId = newPlan.id;
    }

    revalidatePath(`/admin/historial-medico`);
    return { success: true, plan_id: planId };
  } catch (error) {
    console.error('Error al guardar plan alimenticio:', error);
    throw new Error('No se pudo guardar el plan alimenticio');
  }
}

// Obtener plantillas de menús
export async function getMenuTemplates() {
  try {
    const templates = await sql`
      SELECT * FROM tblmenu_templates
      WHERE is_active = true
      ORDER BY name
    `;
    
    return templates.map(template => ({
      ...template,
      menus: typeof template.menus === 'string' ? JSON.parse(template.menus) : template.menus,
      suggested_meal_times: template.suggested_meal_times ? 
        (typeof template.suggested_meal_times === 'string' ? JSON.parse(template.suggested_meal_times) : template.suggested_meal_times) : null
    }));
  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    return [];
  }
}

// Obtener preferencias del paciente
export async function getPatientDietaryPreferences(patientId: number) {
  try {
    const [preferences] = await sql`
      SELECT * FROM tblpatient_dietary_preferences
      WHERE patient_id = ${patientId}
    `;
    return preferences || null;
  } catch (error) {
    console.error('Error al obtener preferencias:', error);
    return null;
  }
}

// Guardar preferencias del paciente
export async function savePatientDietaryPreferences(patientId: number, data: {
  allergies?: string;
  intolerances?: string;
  preferences?: string;
  restrictions?: string;
  favorite_foods?: string;
  disliked_foods?: string;
}) {
  try {
    await sql`
      INSERT INTO tblpatient_dietary_preferences (
        patient_id, allergies, intolerances, preferences, 
        restrictions, favorite_foods, disliked_foods
      ) VALUES (
        ${patientId}, ${data.allergies || null}, ${data.intolerances || null},
        ${data.preferences || null}, ${data.restrictions || null},
        ${data.favorite_foods || null}, ${data.disliked_foods || null}
      )
      ON CONFLICT (patient_id) DO UPDATE SET
        allergies = EXCLUDED.allergies,
        intolerances = EXCLUDED.intolerances,
        preferences = EXCLUDED.preferences,
        restrictions = EXCLUDED.restrictions,
        favorite_foods = EXCLUDED.favorite_foods,
        disliked_foods = EXCLUDED.disliked_foods,
        updated_at = NOW()
    `;
    
    revalidatePath(`/admin/historial-medico`);
    return { success: true };
  } catch (error) {
    console.error('Error al guardar preferencias:', error);
    throw new Error('No se pudieron guardar las preferencias');
  }
}