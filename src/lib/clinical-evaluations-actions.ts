'use server';

import postgres from 'postgres';
import { revalidatePath } from 'next/cache';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// =====================================================
// FUNCIONES PARA OBTENER DATOS
// =====================================================

// Obtener evaluación inicial de un paciente
export async function getInitialEvaluationByPatientId(patientId: number) {
  try {
    const [evaluation] = await sql`
      SELECT * FROM tblclinical_evaluations 
      WHERE patient_id = ${patientId} AND evaluation_type = 'initial'
    `;

    if (!evaluation) {
      return null;
    }

    // Obtener todos los datos relacionados
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
      patient_id: evaluation.patient_id,
      evaluation_type: evaluation.evaluation_type,
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
    console.error('Error al obtener evaluación inicial del paciente:', error);
    throw new Error('No se pudo obtener la evaluación inicial');
  }
}

// Obtener evaluación de seguimiento por ID de cita
export async function getFollowUpEvaluationByAppointmentId(appointmentId: number) {
  try {
    const [evaluation] = await sql`
      SELECT * FROM tblclinical_evaluations 
      WHERE appointment_id = ${appointmentId} AND evaluation_type = 'followup'
    `;

    if (!evaluation) {
      return null;
    }

    const [anthropometric] = await sql`
      SELECT * FROM tblanthropometric WHERE evaluation_id = ${evaluation.id}
    `;
    
    const [biochemicalParams] = await sql`
      SELECT * FROM tblbiochemical_params WHERE evaluation_id = ${evaluation.id}
    `;
    
    const [nutritionalDiagnosis] = await sql`
      SELECT * FROM tblnutritional_diagnosis WHERE evaluation_id = ${evaluation.id}
    `;
    
    const [interventionPlan] = await sql`
      SELECT * FROM tblintervention_plan WHERE evaluation_id = ${evaluation.id}
    `;
    
    const [followUp] = await sql`
      SELECT * FROM tblfollow_up WHERE evaluation_id = ${evaluation.id}
    `;

    return {
      id: evaluation.id,
      appointment_id: evaluation.appointment_id,
      patient_id: evaluation.patient_id,
      evaluation_type: evaluation.evaluation_type,
      evaluation_date: evaluation.evaluation_date,
      anthropometric: anthropometric || null,
      biochemical_params: biochemicalParams || null,
      nutritional_diagnosis: nutritionalDiagnosis || null,
      intervention_plan: interventionPlan || null,
      follow_up: followUp || null
    };
  } catch (error) {
    console.error('Error al obtener evaluación de seguimiento:', error);
    throw new Error('No se pudo obtener la evaluación de seguimiento');
  }
}

// Obtener cita específica con información del paciente
export async function getAppointmentWithPatient(appointmentId: number) {
  try {
    const [appointment] = await sql`
      SELECT 
        a.id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.deposit_paid,
        a.deposit_amount,
        a.notes,
        p.id as patient_id,
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
        p.ocupacion
      FROM tblappointments a
      JOIN tblpatients p ON a.patient_id = p.id
      JOIN tblusers u ON p.user_id = u.id
      WHERE a.id = ${appointmentId}
    `;
    
    if (!appointment) return null;
    
    return {
      id: appointment.id,
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status,
      deposit_paid: appointment.deposit_paid,
      deposit_amount: appointment.deposit_amount,
      notes: appointment.notes,
      patient: {
        id: appointment.patient_id,
        first_name: appointment.first_name,
        second_name: appointment.second_name,
        first_lastname: appointment.first_lastname,
        second_lastname: appointment.second_lastname,
        nombre_completo: `${appointment.first_name} ${appointment.second_name || ''} ${appointment.first_lastname} ${appointment.second_lastname || ''}`.trim().replace(/\s+/g, ' '),
        age: appointment.age,
        gender: appointment.gender,
        phone: appointment.phone,
        email: appointment.email,
        fecha_nacimiento: appointment.fecha_nacimiento,
        estado_civil: appointment.estado_civil,
        ocupacion: appointment.ocupacion
      }
    };
  } catch (error) {
    console.error('Error al obtener cita:', error);
    throw new Error('No se pudo obtener la cita');
  }
}

// Obtener citas de hoy con información del paciente y evaluación inicial
export async function getTodayAppointmentsWithPatients() {
  try {
    const appointments = await sql`
      SELECT
        a.id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.deposit_paid,
        a.deposit_amount,
        a.notes,

        p.id AS patient_id,
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

        ce.id AS initial_evaluation_id

      FROM tblappointments a

      JOIN tblpatients p
        ON a.patient_id = p.id

      JOIN tblusers u
        ON p.user_id = u.id

      LEFT JOIN tblclinical_evaluations ce
        ON p.id = ce.patient_id
        AND ce.evaluation_type = 'initial'

      WHERE a.appointment_date =
        (NOW() AT TIME ZONE 'America/Mexico_City')::date

        AND a.status <> 'cancelled'

      ORDER BY a.start_time
    `;

    return appointments.map((app) => ({
      id: app.id,
      appointment_date: app.appointment_date,
      start_time: app.start_time,
      end_time: app.end_time,
      status: app.status,
      deposit_paid: app.deposit_paid,
      deposit_amount: app.deposit_amount,
      notes: app.notes,

      patient: {
        id: app.patient_id,
        first_name: app.first_name,
        second_name: app.second_name,
        first_lastname: app.first_lastname,
        second_lastname: app.second_lastname,

        nombre_completo: `
          ${app.first_name}
          ${app.second_name || ''}
          ${app.first_lastname}
          ${app.second_lastname || ''}
        `
          .trim()
          .replace(/\s+/g, ' '),

        age: app.age,
        gender: app.gender,
        phone: app.phone,
        email: app.email,
        fecha_nacimiento: app.fecha_nacimiento,
        estado_civil: app.estado_civil,
        ocupacion: app.ocupacion,
      },

      has_initial_evaluation: Boolean(
        app.initial_evaluation_id
      ),
    }));
  } catch (error) {
    console.error(
      'Error al obtener citas de hoy:',
      error
    );

    throw new Error(
      'No se pudieron obtener las citas de hoy'
    );
  }
}

// =====================================================
// FUNCIONES PARA CREAR/ACTUALIZAR EVALUACIÓN INICIAL
// =====================================================

// Crear o actualizar evaluación inicial del paciente
export async function saveInitialEvaluation(data: {
  patient_id: number;
  consultation_reason: {
    main_goal: string;
    onset_date: Date | null;
    treatment_expectations: string;
  };
  family_history: {
    diabetes: boolean;
    hypertension: boolean;
    obesity: boolean;
    dyslipidemia: boolean;
    cardiovascular_disease: boolean;
    cancer: boolean;
    pcos: boolean;
    other_conditions: string;
  };
  personal_history: {
    current_diseases: string;
    past_diseases: string;
    surgeries: string;
    current_medications: string;
    supplements: string;
    allergies_intolerances: string;
  };
  non_pathological_history: {
    physical_activity_type: string;
    physical_activity_frequency: string;
    physical_activity_duration: string;
    alcohol_consumption: string;
    smoking: string;
    sleep_quality: string;
    stress_level: string;
    daily_hydration: string;
  };
  gynecological_history?: {
    menarche_age: number | null;
    menstrual_cycle: string;
    cycle_duration: number | null;
    symptoms: string;
    pregnancies: number | null;
    contraceptives_use: boolean;
    contraceptives_type: string;
  };
  dietary_recall: {
    breakfast: string;
    morning_snack: string;
    lunch: string;
    afternoon_snack: string;
    dinner: string;
    snacks_beverages: string;
  };
  food_frequency: {
    fruits: string;
    vegetables: string;
    proteins: string;
    dairy: string;
    cereals: string;
    ultraprocessed: string;
    sugars: string;
  };
  feeding_habits: {
    meal_schedules: string;
    eating_anxiety: string;
    binges: string;
    emotional_eating: string;
    eating_out: string;
  };
}) {
  try {
    // Verificar si ya existe una evaluación inicial para este paciente
    const [existingEvaluation] = await sql`
      SELECT id FROM tblclinical_evaluations 
      WHERE patient_id = ${data.patient_id} AND evaluation_type = 'initial'
    `;

    let evaluationId: number;

    if (existingEvaluation) {
      evaluationId = existingEvaluation.id;
      await sql`
        UPDATE tblclinical_evaluations 
        SET evaluation_date = CURRENT_DATE, updated_at = NOW()
        WHERE id = ${evaluationId}
      `;
    } else {
      const [evaluation] = await sql`
        INSERT INTO tblclinical_evaluations (patient_id, evaluation_type, evaluation_date)
        VALUES (${data.patient_id}, 'initial', CURRENT_DATE)
        RETURNING id
      `;
      evaluationId = evaluation.id;
    }

    // Insertar o actualizar motivo de consulta
    await sql`
      INSERT INTO tblconsultation_reason (
        evaluation_id, main_goal, onset_date, treatment_expectations
      ) VALUES (
        ${evaluationId}, ${data.consultation_reason.main_goal}, 
        ${data.consultation_reason.onset_date}, ${data.consultation_reason.treatment_expectations}
      )
      ON CONFLICT (evaluation_id) DO UPDATE SET
        main_goal = EXCLUDED.main_goal,
        onset_date = EXCLUDED.onset_date,
        treatment_expectations = EXCLUDED.treatment_expectations,
        updated_at = NOW()
    `;

    // Insertar o actualizar antecedentes heredofamiliares
    await sql`
      INSERT INTO tblfamily_history (
        evaluation_id, diabetes, hypertension, obesity, dyslipidemia,
        cardiovascular_disease, cancer, pcos, other_conditions
      ) VALUES (
        ${evaluationId}, ${data.family_history.diabetes}, ${data.family_history.hypertension},
        ${data.family_history.obesity}, ${data.family_history.dyslipidemia},
        ${data.family_history.cardiovascular_disease}, ${data.family_history.cancer},
        ${data.family_history.pcos}, ${data.family_history.other_conditions}
      )
      ON CONFLICT (evaluation_id) DO UPDATE SET
        diabetes = EXCLUDED.diabetes,
        hypertension = EXCLUDED.hypertension,
        obesity = EXCLUDED.obesity,
        dyslipidemia = EXCLUDED.dyslipidemia,
        cardiovascular_disease = EXCLUDED.cardiovascular_disease,
        cancer = EXCLUDED.cancer,
        pcos = EXCLUDED.pcos,
        other_conditions = EXCLUDED.other_conditions,
        updated_at = NOW()
    `;

    // Insertar o actualizar antecedentes personales
    await sql`
      INSERT INTO tblpersonal_history (
        evaluation_id, current_diseases, past_diseases, surgeries,
        current_medications, supplements, allergies_intolerances
      ) VALUES (
        ${evaluationId}, ${data.personal_history.current_diseases},
        ${data.personal_history.past_diseases}, ${data.personal_history.surgeries},
        ${data.personal_history.current_medications}, ${data.personal_history.supplements},
        ${data.personal_history.allergies_intolerances}
      )
      ON CONFLICT (evaluation_id) DO UPDATE SET
        current_diseases = EXCLUDED.current_diseases,
        past_diseases = EXCLUDED.past_diseases,
        surgeries = EXCLUDED.surgeries,
        current_medications = EXCLUDED.current_medications,
        supplements = EXCLUDED.supplements,
        allergies_intolerances = EXCLUDED.allergies_intolerances,
        updated_at = NOW()
    `;

    // Insertar o actualizar antecedentes no patológicos
    await sql`
      INSERT INTO tblnon_pathological_history (
        evaluation_id, physical_activity_type, physical_activity_frequency,
        physical_activity_duration, alcohol_consumption, smoking,
        sleep_quality, stress_level, daily_hydration
      ) VALUES (
        ${evaluationId}, ${data.non_pathological_history.physical_activity_type},
        ${data.non_pathological_history.physical_activity_frequency},
        ${data.non_pathological_history.physical_activity_duration},
        ${data.non_pathological_history.alcohol_consumption},
        ${data.non_pathological_history.smoking},
        ${data.non_pathological_history.sleep_quality},
        ${data.non_pathological_history.stress_level},
        ${data.non_pathological_history.daily_hydration}
      )
      ON CONFLICT (evaluation_id) DO UPDATE SET
        physical_activity_type = EXCLUDED.physical_activity_type,
        physical_activity_frequency = EXCLUDED.physical_activity_frequency,
        physical_activity_duration = EXCLUDED.physical_activity_duration,
        alcohol_consumption = EXCLUDED.alcohol_consumption,
        smoking = EXCLUDED.smoking,
        sleep_quality = EXCLUDED.sleep_quality,
        stress_level = EXCLUDED.stress_level,
        daily_hydration = EXCLUDED.daily_hydration,
        updated_at = NOW()
    `;

    // Insertar o actualizar historia ginecológica (si aplica)
    if (data.gynecological_history) {
      await sql`
        INSERT INTO tblgynecological_history (
          evaluation_id, menarche_age, menstrual_cycle, cycle_duration,
          symptoms, pregnancies, contraceptives_use, contraceptives_type
        ) VALUES (
          ${evaluationId}, ${data.gynecological_history.menarche_age},
          ${data.gynecological_history.menstrual_cycle},
          ${data.gynecological_history.cycle_duration},
          ${data.gynecological_history.symptoms},
          ${data.gynecological_history.pregnancies},
          ${data.gynecological_history.contraceptives_use},
          ${data.gynecological_history.contraceptives_type}
        )
        ON CONFLICT (evaluation_id) DO UPDATE SET
          menarche_age = EXCLUDED.menarche_age,
          menstrual_cycle = EXCLUDED.menstrual_cycle,
          cycle_duration = EXCLUDED.cycle_duration,
          symptoms = EXCLUDED.symptoms,
          pregnancies = EXCLUDED.pregnancies,
          contraceptives_use = EXCLUDED.contraceptives_use,
          contraceptives_type = EXCLUDED.contraceptives_type,
          updated_at = NOW()
      `;
    }

    // Insertar o actualizar recordatorio 24 horas
    await sql`
      INSERT INTO tbldietary_recall (
        evaluation_id, breakfast, morning_snack, lunch,
        afternoon_snack, dinner, snacks_beverages
      ) VALUES (
        ${evaluationId}, ${data.dietary_recall.breakfast},
        ${data.dietary_recall.morning_snack}, ${data.dietary_recall.lunch},
        ${data.dietary_recall.afternoon_snack}, ${data.dietary_recall.dinner},
        ${data.dietary_recall.snacks_beverages}
      )
      ON CONFLICT (evaluation_id) DO UPDATE SET
        breakfast = EXCLUDED.breakfast,
        morning_snack = EXCLUDED.morning_snack,
        lunch = EXCLUDED.lunch,
        afternoon_snack = EXCLUDED.afternoon_snack,
        dinner = EXCLUDED.dinner,
        snacks_beverages = EXCLUDED.snacks_beverages,
        updated_at = NOW()
    `;

    // Insertar o actualizar frecuencia de consumo
    await sql`
      INSERT INTO tblfood_frequency (
        evaluation_id, fruits, vegetables, proteins, dairy,
        cereals, ultraprocessed, sugars
      ) VALUES (
        ${evaluationId}, ${data.food_frequency.fruits},
        ${data.food_frequency.vegetables}, ${data.food_frequency.proteins},
        ${data.food_frequency.dairy}, ${data.food_frequency.cereals},
        ${data.food_frequency.ultraprocessed}, ${data.food_frequency.sugars}
      )
      ON CONFLICT (evaluation_id) DO UPDATE SET
        fruits = EXCLUDED.fruits,
        vegetables = EXCLUDED.vegetables,
        proteins = EXCLUDED.proteins,
        dairy = EXCLUDED.dairy,
        cereals = EXCLUDED.cereals,
        ultraprocessed = EXCLUDED.ultraprocessed,
        sugars = EXCLUDED.sugars,
        updated_at = NOW()
    `;

    // Insertar o actualizar hábitos alimentarios
    await sql`
      INSERT INTO tblfeeding_habits (
        evaluation_id, meal_schedules, eating_anxiety, binges,
        emotional_eating, eating_out
      ) VALUES (
        ${evaluationId}, ${data.feeding_habits.meal_schedules},
        ${data.feeding_habits.eating_anxiety}, ${data.feeding_habits.binges},
        ${data.feeding_habits.emotional_eating}, ${data.feeding_habits.eating_out}
      )
      ON CONFLICT (evaluation_id) DO UPDATE SET
        meal_schedules = EXCLUDED.meal_schedules,
        eating_anxiety = EXCLUDED.eating_anxiety,
        binges = EXCLUDED.binges,
        emotional_eating = EXCLUDED.emotional_eating,
        eating_out = EXCLUDED.eating_out,
        updated_at = NOW()
    `;

    revalidatePath(`/admin/patients/${data.patient_id}`);
    return { success: true, evaluation_id: evaluationId };
  } catch (error) {
    console.error('Error al guardar evaluación inicial:', error);
    throw new Error('No se pudo guardar la evaluación inicial');
  }
}

// =====================================================
// FUNCIONES PARA EVALUACIÓN DE SEGUIMIENTO (por cita)
// =====================================================

// Crear o actualizar evaluación de seguimiento para una cita
export async function saveFollowUpEvaluation(data: {
  appointment_id: number;
  patient_id: number;
  anthropometric: {
    height: number | null;
    weight: number | null;
    body_fat_percentage: number | null;
    visceral_fat_percentage: number | null;
    total_water_percentage: number | null;
    muscle_percentage: number | null;
    waist_circumference: number | null;
    leg_circumference: number | null;
    hip_circumference: number | null;
    gluteus_circumference: number | null;
    arm_circumference: number | null;
    neck_circumference: number | null;
    biceps_skinfold_mm: number | null;
    triceps_skinfold_mm: number | null;
    blood_pressure_systolic: number | null;
    blood_pressure_diastolic: number | null;
    right_arm_fat: number | null;
    right_arm_muscle: number | null;
    left_arm_fat: number | null;
    left_arm_muscle: number | null;
    right_leg_fat: number | null;
    right_leg_muscle: number | null;
    left_leg_fat: number | null;
    left_leg_muscle: number | null;
    torso_fat: number | null;
    torso_muscle: number | null;
  };
  biochemical_params: {
    glucose: number | null;
    insulin: number | null;
    homa_ir: number | null;
    total_cholesterol: number | null;
    triglycerides: number | null;
    hdl_cholesterol: number | null;
    ldl_cholesterol: number | null;
    tsh: number | null;
    t3: number | null;
    t4: number | null;
    vitamin_d: number | null;
    other_params: string;
  };
  nutritional_diagnosis: {
    diagnosis: string;
  };
  intervention_plan: {
    nutritional_goals: string;
    dietary_strategy: string;
    specific_recommendations: string;
    supplementation: string;
  };
  follow_up: {
    next_appointment_date: Date | null;
    indicators_to_evaluate: string;
    observations: string;
  };
}) {
  try {
    // Verificar si ya existe una evaluación de seguimiento para esta cita
    const [existingEvaluation] = await sql`
        SELECT id FROM tblclinical_evaluations 
        WHERE appointment_id = ${data.appointment_id} AND evaluation_type = 'followup'
    `;

    let evaluationId: number;

    if (existingEvaluation) {
      evaluationId = existingEvaluation.id;
      await sql`
        UPDATE tblclinical_evaluations 
        SET evaluation_date = CURRENT_DATE, updated_at = NOW()
        WHERE id = ${evaluationId}
      `;
    } else {
      const [evaluation] = await sql`
        INSERT INTO tblclinical_evaluations (appointment_id, patient_id, evaluation_type, evaluation_date)
        VALUES (${data.appointment_id}, ${data.patient_id}, 'followup', CURRENT_DATE)
        RETURNING id
      `;
      evaluationId = evaluation.id;
    }

    // Antropometría
    await sql`
      INSERT INTO tblanthropometric (
        evaluation_id, height, weight, body_fat_percentage, visceral_fat_percentage,
        total_water_percentage, muscle_percentage, waist_circumference, leg_circumference,
        hip_circumference, gluteus_circumference, arm_circumference, neck_circumference,
        biceps_skinfold_mm, triceps_skinfold_mm, blood_pressure_systolic, blood_pressure_diastolic,
        right_arm_fat, right_arm_muscle, left_arm_fat, left_arm_muscle,
        right_leg_fat, right_leg_muscle, left_leg_fat, left_leg_muscle,
        torso_fat, torso_muscle
      ) VALUES (
        ${evaluationId}, ${data.anthropometric.height}, ${data.anthropometric.weight},
        ${data.anthropometric.body_fat_percentage}, ${data.anthropometric.visceral_fat_percentage},
        ${data.anthropometric.total_water_percentage}, ${data.anthropometric.muscle_percentage},
        ${data.anthropometric.waist_circumference}, ${data.anthropometric.leg_circumference},
        ${data.anthropometric.hip_circumference}, ${data.anthropometric.gluteus_circumference},
        ${data.anthropometric.arm_circumference}, ${data.anthropometric.neck_circumference},
        ${data.anthropometric.biceps_skinfold_mm}, ${data.anthropometric.triceps_skinfold_mm},
        ${data.anthropometric.blood_pressure_systolic}, ${data.anthropometric.blood_pressure_diastolic},
        ${data.anthropometric.right_arm_fat}, ${data.anthropometric.right_arm_muscle},
        ${data.anthropometric.left_arm_fat}, ${data.anthropometric.left_arm_muscle},
        ${data.anthropometric.right_leg_fat}, ${data.anthropometric.right_leg_muscle},
        ${data.anthropometric.left_leg_fat}, ${data.anthropometric.left_leg_muscle},
        ${data.anthropometric.torso_fat}, ${data.anthropometric.torso_muscle}
      )
      ON CONFLICT (evaluation_id) DO UPDATE SET
        height = EXCLUDED.height, weight = EXCLUDED.weight,
        body_fat_percentage = EXCLUDED.body_fat_percentage,
        visceral_fat_percentage = EXCLUDED.visceral_fat_percentage,
        total_water_percentage = EXCLUDED.total_water_percentage,
        muscle_percentage = EXCLUDED.muscle_percentage,
        waist_circumference = EXCLUDED.waist_circumference,
        leg_circumference = EXCLUDED.leg_circumference,
        hip_circumference = EXCLUDED.hip_circumference,
        gluteus_circumference = EXCLUDED.gluteus_circumference,
        arm_circumference = EXCLUDED.arm_circumference,
        neck_circumference = EXCLUDED.neck_circumference,
        biceps_skinfold_mm = EXCLUDED.biceps_skinfold_mm,
        triceps_skinfold_mm = EXCLUDED.triceps_skinfold_mm,
        blood_pressure_systolic = EXCLUDED.blood_pressure_systolic,
        blood_pressure_diastolic = EXCLUDED.blood_pressure_diastolic,
        right_arm_fat = EXCLUDED.right_arm_fat,
        right_arm_muscle = EXCLUDED.right_arm_muscle,
        left_arm_fat = EXCLUDED.left_arm_fat,
        left_arm_muscle = EXCLUDED.left_arm_muscle,
        right_leg_fat = EXCLUDED.right_leg_fat,
        right_leg_muscle = EXCLUDED.right_leg_muscle,
        left_leg_fat = EXCLUDED.left_leg_fat,
        left_leg_muscle = EXCLUDED.left_leg_muscle,
        torso_fat = EXCLUDED.torso_fat,
        torso_muscle = EXCLUDED.torso_muscle,
        updated_at = NOW()
    `;

    // Parámetros bioquímicos
    await sql`
      INSERT INTO tblbiochemical_params (
        evaluation_id, glucose, insulin, homa_ir, total_cholesterol,
        triglycerides, hdl_cholesterol, ldl_cholesterol, tsh, t3, t4,
        vitamin_d, other_params
      ) VALUES (
        ${evaluationId}, ${data.biochemical_params.glucose}, ${data.biochemical_params.insulin},
        ${data.biochemical_params.homa_ir}, ${data.biochemical_params.total_cholesterol},
        ${data.biochemical_params.triglycerides}, ${data.biochemical_params.hdl_cholesterol},
        ${data.biochemical_params.ldl_cholesterol}, ${data.biochemical_params.tsh},
        ${data.biochemical_params.t3}, ${data.biochemical_params.t4},
        ${data.biochemical_params.vitamin_d}, ${data.biochemical_params.other_params}
      )
      ON CONFLICT (evaluation_id) DO UPDATE SET
        glucose = EXCLUDED.glucose, insulin = EXCLUDED.insulin,
        homa_ir = EXCLUDED.homa_ir, total_cholesterol = EXCLUDED.total_cholesterol,
        triglycerides = EXCLUDED.triglycerides, hdl_cholesterol = EXCLUDED.hdl_cholesterol,
        ldl_cholesterol = EXCLUDED.ldl_cholesterol, tsh = EXCLUDED.tsh,
        t3 = EXCLUDED.t3, t4 = EXCLUDED.t4, vitamin_d = EXCLUDED.vitamin_d,
        other_params = EXCLUDED.other_params, updated_at = NOW()
    `;

    // Diagnóstico nutricional
    await sql`
      INSERT INTO tblnutritional_diagnosis (evaluation_id, diagnosis)
      VALUES (${evaluationId}, ${data.nutritional_diagnosis.diagnosis})
      ON CONFLICT (evaluation_id) DO UPDATE SET
        diagnosis = EXCLUDED.diagnosis, updated_at = NOW()
    `;

    // Plan de intervención
    await sql`
      INSERT INTO tblintervention_plan (
        evaluation_id, nutritional_goals, dietary_strategy,
        specific_recommendations, supplementation
      ) VALUES (
        ${evaluationId}, ${data.intervention_plan.nutritional_goals},
        ${data.intervention_plan.dietary_strategy},
        ${data.intervention_plan.specific_recommendations},
        ${data.intervention_plan.supplementation}
      )
      ON CONFLICT (evaluation_id) DO UPDATE SET
        nutritional_goals = EXCLUDED.nutritional_goals,
        dietary_strategy = EXCLUDED.dietary_strategy,
        specific_recommendations = EXCLUDED.specific_recommendations,
        supplementation = EXCLUDED.supplementation,
        updated_at = NOW()
    `;

    // Seguimiento
    await sql`
      INSERT INTO tblfollow_up (
        evaluation_id, next_appointment_date, indicators_to_evaluate, observations
      ) VALUES (
        ${evaluationId}, ${data.follow_up.next_appointment_date},
        ${data.follow_up.indicators_to_evaluate}, ${data.follow_up.observations}
      )
      ON CONFLICT (evaluation_id) DO UPDATE SET
        next_appointment_date = EXCLUDED.next_appointment_date,
        indicators_to_evaluate = EXCLUDED.indicators_to_evaluate,
        observations = EXCLUDED.observations,
        updated_at = NOW()
    `;

    // Marcar cita como completada
    await sql`
      UPDATE tblappointments
      SET status = 'completed', updated_at = NOW()
      WHERE id = ${data.appointment_id}
    `;

    revalidatePath(`/admin/citas`);
    return { success: true, evaluation_id: evaluationId };
  } catch (error) {
    console.error('Error al guardar evaluación de seguimiento:', error);
    throw new Error('No se pudo guardar la evaluación de seguimiento');
  }
}