'use server';

import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Buscar pacientes por nombre
export async function searchPatientsForHistory(query: string) {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const searchTerm = `%${query.trim()}%`;
    const patients = await sql`
      SELECT 
        p.id,
        p.first_name,
        p.second_name,
        p.first_lastname,
        p.second_lastname,
        p.age,
        p.gender,
        p.phone,
        u.email,
        p.fecha_nacimiento,
        p.estado_civil,
        p.ocupacion,
        u.username
      FROM tblpatients p
      JOIN tblusers u ON p.user_id = u.id
      WHERE p.active = true 
        AND u.active = true
        AND (
          p.first_name ILIKE ${searchTerm} OR
          p.second_name ILIKE ${searchTerm} OR
          p.first_lastname ILIKE ${searchTerm} OR
          p.second_lastname ILIKE ${searchTerm} OR
          u.email ILIKE ${searchTerm} OR
          u.username ILIKE ${searchTerm}
        )
      ORDER BY p.first_name, p.first_lastname
      LIMIT 20
    `;
    
    return patients.map(patient => ({
      ...patient,
      nombre_completo: `${patient.first_name} ${patient.second_name || ''} ${patient.first_lastname} ${patient.second_lastname || ''}`.trim().replace(/\s+/g, ' ')
    }));
  } catch (error) {
    console.error('Error al buscar pacientes:', error);
    return [];
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

// Obtener todas las evaluaciones de seguimiento (progreso) de un paciente
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
    
    console.log('Evaluaciones encontradas:', evaluations.length);
    evaluations.forEach(e => console.log('Evaluación ID:', e.id, 'Fecha:', e.evaluation_date, 'Appointment ID:', e.appointment_id));
    
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