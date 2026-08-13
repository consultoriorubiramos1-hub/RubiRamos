'use server';

import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Obtener datos básicos del paciente por userId
export async function getPatientByUserId(userId: number) {
  try {
    // Primero obtener los datos básicos del paciente
    const [patient] = await sql`
      SELECT 
        p.id,
        p.first_name,
        p.second_name,
        p.first_lastname,
        p.second_lastname,
        p.age,
        p.gender,
        p.phone,
        p.fecha_nacimiento,
        p.estado_civil,
        p.ocupacion,
        u.email,
        u.username
      FROM tblpatients p
      JOIN tblusers u ON p.user_id = u.id
      WHERE p.user_id = ${userId} AND p.active = true
    `;
    
    if (!patient) return null;
    
    // Obtener la estatura más reciente del paciente (de la última evaluación)
    const [latestHeight] = await sql`
      SELECT ant.height
      FROM tblclinical_evaluations ce
      JOIN tblanthropometric ant ON ce.id = ant.evaluation_id
      WHERE ce.patient_id = ${patient.id}
        AND ce.evaluation_type = 'followup'
        AND ant.height IS NOT NULL
      ORDER BY ce.evaluation_date DESC
      LIMIT 1
    `;
    
    return {
      id: patient.id,
      nombre_completo: `${patient.first_name} ${patient.second_name || ''} ${patient.first_lastname} ${patient.second_lastname || ''}`.trim().replace(/\s+/g, ' '),
      first_name: patient.first_name,
      second_name: patient.second_name,
      first_lastname: patient.first_lastname,
      second_lastname: patient.second_lastname,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      fecha_nacimiento: patient.fecha_nacimiento,
      estado_civil: patient.estado_civil,
      ocupacion: patient.ocupacion,
      height: latestHeight?.height || null
    };
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    return null;
  }
}

// Obtener evaluación inicial del paciente
export async function getPatientInitialEvaluation(patientId: number) {
  try {
    const [evaluation] = await sql`
      SELECT * FROM tblclinical_evaluations 
      WHERE patient_id = ${patientId} AND evaluation_type = 'initial'
    `;

    if (!evaluation) return null;

    const [consultationReason] = await sql`
      SELECT * FROM tblconsultation_reason WHERE evaluation_id = ${evaluation.id}
    `;
    
    const [familyHistory] = await sql`
      SELECT * FROM tblfamily_history WHERE evaluation_id = ${evaluation.id}
    `;
    
    const [personalHistory] = await sql`
      SELECT * FROM tblpersonal_history WHERE evaluation_id = ${evaluation.id}
    `;
    
    const [nonPathologicalHistory] = await sql`
      SELECT * FROM tblnon_pathological_history WHERE evaluation_id = ${evaluation.id}
    `;
    
    const [gynecologicalHistory] = await sql`
      SELECT * FROM tblgynecological_history WHERE evaluation_id = ${evaluation.id}
    `;
    
    const [dietaryRecall] = await sql`
      SELECT * FROM tbldietary_recall WHERE evaluation_id = ${evaluation.id}
    `;
    
    const [foodFrequency] = await sql`
      SELECT * FROM tblfood_frequency WHERE evaluation_id = ${evaluation.id}
    `;
    
    const [feedingHabits] = await sql`
      SELECT * FROM tblfeeding_habits WHERE evaluation_id = ${evaluation.id}
    `;

    return {
      id: evaluation.id,
      evaluation_date: evaluation.evaluation_date,
      consultation_reason: consultationReason || null,
      family_history: familyHistory || null,
      personal_history: personalHistory || null,
      non_pathological_history: nonPathologicalHistory || null,
      gynecological_history: gynecologicalHistory || null,
      dietary_recall: dietaryRecall || null,
      food_frequency: foodFrequency || null,
      feeding_habits: feedingHabits || null
    };
  } catch (error) {
    console.error('Error al obtener evaluación inicial:', error);
    return null;
  }
}

// Obtener todas las evaluaciones de seguimiento del paciente
export async function getPatientFollowUpEvaluations(patientId: number) {
  try {
    const evaluations = await sql`
      SELECT 
        ce.id,
        ce.appointment_id,
        ce.evaluation_date,
        a.start_time,
        a.end_time,
        a.status,
        ant.*,
        bp.*,
        nd.diagnosis,
        ip.nutritional_goals,
        ip.dietary_strategy,
        ip.specific_recommendations,
        ip.supplementation,
        fu.next_appointment_date,
        fu.indicators_to_evaluate,
        fu.observations
      FROM tblclinical_evaluations ce
      JOIN tblappointments a ON ce.appointment_id = a.id
      LEFT JOIN tblanthropometric ant ON ce.id = ant.evaluation_id
      LEFT JOIN tblbiochemical_params bp ON ce.id = bp.evaluation_id
      LEFT JOIN tblnutritional_diagnosis nd ON ce.id = nd.evaluation_id
      LEFT JOIN tblintervention_plan ip ON ce.id = ip.evaluation_id
      LEFT JOIN tblfollow_up fu ON ce.id = fu.evaluation_id
      WHERE ce.patient_id = ${patientId} AND ce.evaluation_type = 'followup'
      ORDER BY ce.evaluation_date DESC, a.start_time DESC
    `;
    
    return evaluations.map(evaluation => ({
      id: evaluation.id,
      appointment_id: evaluation.appointment_id,
      evaluation_date: evaluation.evaluation_date,
      start_time: evaluation.start_time,
      end_time: evaluation.end_time,
      status: evaluation.status,
      anthropometric: {
        height: evaluation.height,
        weight: evaluation.weight,
        body_fat_percentage: evaluation.body_fat_percentage,
        visceral_fat_percentage: evaluation.visceral_fat_percentage,
        total_water_percentage: evaluation.total_water_percentage,
        muscle_percentage: evaluation.muscle_percentage,
        waist_circumference: evaluation.waist_circumference,
        leg_circumference: evaluation.leg_circumference,
        hip_circumference: evaluation.hip_circumference,
        gluteus_circumference: evaluation.gluteus_circumference,
        arm_circumference: evaluation.arm_circumference,
        neck_circumference: evaluation.neck_circumference,
        biceps_skinfold_mm: evaluation.biceps_skinfold_mm,
        triceps_skinfold_mm: evaluation.triceps_skinfold_mm,
        blood_pressure_systolic: evaluation.blood_pressure_systolic,
        blood_pressure_diastolic: evaluation.blood_pressure_diastolic,
        right_arm_fat: evaluation.right_arm_fat,
        right_arm_muscle: evaluation.right_arm_muscle,
        left_arm_fat: evaluation.left_arm_fat,
        left_arm_muscle: evaluation.left_arm_muscle,
        right_leg_fat: evaluation.right_leg_fat,
        right_leg_muscle: evaluation.right_leg_muscle,
        left_leg_fat: evaluation.left_leg_fat,
        left_leg_muscle: evaluation.left_leg_muscle,
        torso_fat: evaluation.torso_fat,
        torso_muscle: evaluation.torso_muscle
      },
      biochemical_params: {
        glucose: evaluation.glucose,
        insulin: evaluation.insulin,
        homa_ir: evaluation.homa_ir,
        total_cholesterol: evaluation.total_cholesterol,
        triglycerides: evaluation.triglycerides,
        hdl_cholesterol: evaluation.hdl_cholesterol,
        ldl_cholesterol: evaluation.ldl_cholesterol,
        tsh: evaluation.tsh,
        t3: evaluation.t3,
        t4: evaluation.t4,
        vitamin_d: evaluation.vitamin_d,
        other_params: evaluation.other_params
      },
      nutritional_diagnosis: {
        diagnosis: evaluation.diagnosis
      },
      intervention_plan: {
        nutritional_goals: evaluation.nutritional_goals,
        dietary_strategy: evaluation.dietary_strategy,
        specific_recommendations: evaluation.specific_recommendations,
        supplementation: evaluation.supplementation
      },
      follow_up: {
        next_appointment_date: evaluation.next_appointment_date,
        indicators_to_evaluate: evaluation.indicators_to_evaluate,
        observations: evaluation.observations
      }
    }));
  } catch (error) {
    console.error('Error al obtener evaluaciones de seguimiento:', error);
    return [];
  }
}

// Obtener plan alimenticio activo del paciente
export async function getPatientActiveNutritionPlan(patientId: number) {
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
    console.error('Error al obtener plan alimenticio:', error);
    return null;
  }
}

// Obtener datos para el módulo predictivo
export async function getPatientPredictiveData(patientId: number) {
  try {
    // Obtener historial de pesos
    const weightHistory = await sql`
      SELECT 
        ce.evaluation_date,
        ant.weight,
        ant.body_fat_percentage,
        ant.muscle_percentage,
        ant.waist_circumference
      FROM tblclinical_evaluations ce
      JOIN tblanthropometric ant ON ce.id = ant.evaluation_id
      WHERE ce.patient_id = ${patientId} 
        AND ce.evaluation_type = 'followup'
        AND ant.weight IS NOT NULL
      ORDER BY ce.evaluation_date ASC
    `;

    // Obtener datos básicos del paciente
    const [patient] = await sql`
      SELECT 
        p.id,
        p.first_name,
        p.second_name,
        p.first_lastname,
        p.second_lastname,
        u.email
      FROM tblpatients p
      JOIN tblusers u ON p.user_id = u.id
      WHERE p.id = ${patientId}
    `;

    // Obtener altura de la última evaluación
    const [latestHeight] = await sql`
      SELECT ant.height
      FROM tblclinical_evaluations ce
      JOIN tblanthropometric ant ON ce.id = ant.evaluation_id
      WHERE ce.patient_id = ${patientId} 
        AND ce.evaluation_type = 'followup'
        AND ant.height IS NOT NULL
      ORDER BY ce.evaluation_date DESC
      LIMIT 1
    `;

    return {
      weightHistory: weightHistory.map(w => ({
        date: w.evaluation_date,
        weight: Number(w.weight),
        bodyFat: w.body_fat_percentage ? Number(w.body_fat_percentage) : null,
        muscle: w.muscle_percentage ? Number(w.muscle_percentage) : null,
        waist: w.waist_circumference ? Number(w.waist_circumference) : null
      })),
      patient: {
        height: latestHeight?.height ? Number(latestHeight.height) : null,
        nombre_completo: `${patient.first_name} ${patient.second_name || ''} ${patient.first_lastname} ${patient.second_lastname || ''}`.trim().replace(/\s+/g, ' ')
      }
    };
  } catch (error) {
    console.error('Error al obtener datos predictivos:', error);
    return { weightHistory: [], patient: { height: null, nombre_completo: '' } };
  }
}