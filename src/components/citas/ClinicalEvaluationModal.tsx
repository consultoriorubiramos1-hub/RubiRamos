'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface ClinicalEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  evaluationType: 'initial' | 'followup';
  onSuccess: () => void;
}

// Definir las secciones del formulario
const INITIAL_SECTIONS = [
  { id: 'motivo', title: 'Motivo de Consulta' },
  { id: 'heredo', title: 'Antecedentes Heredofamiliares' },
  { id: 'personales', title: 'Antecedentes Personales Patológicos' },
  { id: 'no_patologicos', title: 'Antecedentes No Patológicos' },
  { id: 'ginecologicos', title: 'Historia Ginecológica' },
  { id: 'dietetica', title: 'Evaluación Dietética' }
];

const FOLLOWUP_SECTIONS = [
  { id: 'antropometrica', title: 'Evaluación Antropométrica' },
  { id: 'bioquimicos', title: 'Parámetros Bioquímicos' },
  { id: 'diagnostico', title: 'Diagnóstico Nutricional' },
  { id: 'intervencion', title: 'Plan de Intervención' },
  { id: 'seguimiento', title: 'Seguimiento' }
];

// Estado inicial vacío
const getInitialFormData = () => ({
  // Motivo de consulta
  main_goal: '',
  onset_date: '',
  treatment_expectations: '',
  // Antecedentes heredofamiliares
  diabetes: false,
  hypertension: false,
  obesity: false,
  dyslipidemia: false,
  cardiovascular_disease: false,
  cancer: false,
  pcos: false,
  other_conditions: '',
  // Antecedentes personales
  current_diseases: '',
  past_diseases: '',
  surgeries: '',
  current_medications: '',
  supplements: '',
  allergies_intolerances: '',
  // Antecedentes no patológicos
  physical_activity_type: '',
  physical_activity_frequency: '',
  physical_activity_duration: '',
  alcohol_consumption: '',
  smoking: '',
  sleep_quality: '',
  stress_level: '',
  daily_hydration: '',
  // Historia ginecológica
  menarche_age: '',
  menstrual_cycle: '',
  cycle_duration: '',
  symptoms: '',
  pregnancies: '',
  contraceptives_use: false,
  contraceptives_type: '',
  // Evaluación dietética
  breakfast: '',
  morning_snack: '',
  lunch: '',
  afternoon_snack: '',
  dinner: '',
  snacks_beverages: '',
  fruits: '',
  vegetables: '',
  proteins: '',
  dairy: '',
  cereals: '',
  ultraprocessed: '',
  sugars: '',
  meal_schedules: '',
  eating_anxiety: '',
  binges: '',
  emotional_eating: '',
  eating_out: '',
  // Antropometría
  height: '',
  weight: '',
  body_fat_percentage: '',
  visceral_fat_percentage: '',
  total_water_percentage: '',
  muscle_percentage: '',
  waist_circumference: '',
  leg_circumference: '',
  hip_circumference: '',
  gluteus_circumference: '',
  arm_circumference: '',
  neck_circumference: '',
  biceps_skinfold_mm: '',
  triceps_skinfold_mm: '',
  blood_pressure_systolic: '',
  blood_pressure_diastolic: '',
  right_arm_fat: '',
  right_arm_muscle: '',
  left_arm_fat: '',
  left_arm_muscle: '',
  right_leg_fat: '',
  right_leg_muscle: '',
  left_leg_fat: '',
  left_leg_muscle: '',
  torso_fat: '',
  torso_muscle: '',
  // Parámetros bioquímicos
  glucose: '',
  insulin: '',
  homa_ir: '',
  total_cholesterol: '',
  triglycerides: '',
  hdl_cholesterol: '',
  ldl_cholesterol: '',
  tsh: '',
  t3: '',
  t4: '',
  vitamin_d: '',
  other_params: '',
  // Diagnóstico
  diagnosis: '',
  // Plan de intervención
  nutritional_goals: '',
  dietary_strategy: '',
  specific_recommendations: '',
  supplementation: '',
  // Seguimiento
  next_appointment_date: '',
  indicators_to_evaluate: '',
  observations: ''
});

export default function ClinicalEvaluationModal({ isOpen, onClose, appointment, evaluationType, onSuccess }: ClinicalEvaluationModalProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasExistingEvaluation, setHasExistingEvaluation] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData());
  
  // Determinar qué secciones mostrar según el tipo
  const visibleSections = evaluationType === 'initial' ? INITIAL_SECTIONS : FOLLOWUP_SECTIONS;
  const isInitialEvaluation = evaluationType === 'initial';

  // Resetear estado cuando se abre el modal o cambia el paciente
  useEffect(() => {
    if (isOpen && appointment) {
      // Resetear formulario a valores vacíos
      setFormData(getInitialFormData());
      setCurrentSection(0);
      setHasExistingEvaluation(false);
      // Cargar datos existentes si los hay
      loadExistingEvaluation();
    }
  }, [isOpen, appointment?.patient?.id, evaluationType]);

  const loadExistingEvaluation = async () => {
    if (!appointment?.patient?.id) {
      return;
    }
    
    try {
      if (isInitialEvaluation) {
        const { getInitialEvaluationByPatientId } = await import('@/lib/clinical-evaluations-actions');
        const evaluation = await getInitialEvaluationByPatientId(appointment.patient.id);
        if (evaluation) {
          setHasExistingEvaluation(true);
          loadFormDataFromEvaluation(evaluation);
        }
      } else {
        const { getFollowUpEvaluationByAppointmentId } = await import('@/lib/clinical-evaluations-actions');
        const evaluation = await getFollowUpEvaluationByAppointmentId(appointment.id);
        if (evaluation) {
          setHasExistingEvaluation(true);
          loadFollowUpFormDataFromEvaluation(evaluation);
        }
      }
    } catch (error) {
      console.error('Error al cargar evaluación:', error);
    }
  };

  const loadFormDataFromEvaluation = (evaluation: any) => {
    const newFormData = { ...getInitialFormData() };
    
    // Motivo de consulta
    if (evaluation.consultation_reason) {
      newFormData.main_goal = evaluation.consultation_reason.main_goal || '';
      newFormData.onset_date = evaluation.consultation_reason.onset_date ? 
        new Date(evaluation.consultation_reason.onset_date).toISOString().split('T')[0] : '';
      newFormData.treatment_expectations = evaluation.consultation_reason.treatment_expectations || '';
    }

    // Antecedentes heredofamiliares
    if (evaluation.family_history) {
      newFormData.diabetes = evaluation.family_history.diabetes || false;
      newFormData.hypertension = evaluation.family_history.hypertension || false;
      newFormData.obesity = evaluation.family_history.obesity || false;
      newFormData.dyslipidemia = evaluation.family_history.dyslipidemia || false;
      newFormData.cardiovascular_disease = evaluation.family_history.cardiovascular_disease || false;
      newFormData.cancer = evaluation.family_history.cancer || false;
      newFormData.pcos = evaluation.family_history.pcos || false;
      newFormData.other_conditions = evaluation.family_history.other_conditions || '';
    }

    // Antecedentes personales
    if (evaluation.personal_history) {
      newFormData.current_diseases = evaluation.personal_history.current_diseases || '';
      newFormData.past_diseases = evaluation.personal_history.past_diseases || '';
      newFormData.surgeries = evaluation.personal_history.surgeries || '';
      newFormData.current_medications = evaluation.personal_history.current_medications || '';
      newFormData.supplements = evaluation.personal_history.supplements || '';
      newFormData.allergies_intolerances = evaluation.personal_history.allergies_intolerances || '';
    }

    // Antecedentes no patológicos
    if (evaluation.non_pathological_history) {
      newFormData.physical_activity_type = evaluation.non_pathological_history.physical_activity_type || '';
      newFormData.physical_activity_frequency = evaluation.non_pathological_history.physical_activity_frequency || '';
      newFormData.physical_activity_duration = evaluation.non_pathological_history.physical_activity_duration || '';
      newFormData.alcohol_consumption = evaluation.non_pathological_history.alcohol_consumption || '';
      newFormData.smoking = evaluation.non_pathological_history.smoking || '';
      newFormData.sleep_quality = evaluation.non_pathological_history.sleep_quality || '';
      newFormData.stress_level = evaluation.non_pathological_history.stress_level || '';
      newFormData.daily_hydration = evaluation.non_pathological_history.daily_hydration || '';
    }

    // Historia ginecológica
    if (evaluation.gynecological_history) {
      newFormData.menarche_age = evaluation.gynecological_history.menarche_age?.toString() || '';
      newFormData.menstrual_cycle = evaluation.gynecological_history.menstrual_cycle || '';
      newFormData.cycle_duration = evaluation.gynecological_history.cycle_duration?.toString() || '';
      newFormData.symptoms = evaluation.gynecological_history.symptoms || '';
      newFormData.pregnancies = evaluation.gynecological_history.pregnancies?.toString() || '';
      newFormData.contraceptives_use = evaluation.gynecological_history.contraceptives_use || false;
      newFormData.contraceptives_type = evaluation.gynecological_history.contraceptives_type || '';
    }

    // Evaluación dietética
    if (evaluation.dietary_recall) {
      newFormData.breakfast = evaluation.dietary_recall.breakfast || '';
      newFormData.morning_snack = evaluation.dietary_recall.morning_snack || '';
      newFormData.lunch = evaluation.dietary_recall.lunch || '';
      newFormData.afternoon_snack = evaluation.dietary_recall.afternoon_snack || '';
      newFormData.dinner = evaluation.dietary_recall.dinner || '';
      newFormData.snacks_beverages = evaluation.dietary_recall.snacks_beverages || '';
    }

    if (evaluation.food_frequency) {
      newFormData.fruits = evaluation.food_frequency.fruits || '';
      newFormData.vegetables = evaluation.food_frequency.vegetables || '';
      newFormData.proteins = evaluation.food_frequency.proteins || '';
      newFormData.dairy = evaluation.food_frequency.dairy || '';
      newFormData.cereals = evaluation.food_frequency.cereals || '';
      newFormData.ultraprocessed = evaluation.food_frequency.ultraprocessed || '';
      newFormData.sugars = evaluation.food_frequency.sugars || '';
    }

    if (evaluation.feeding_habits) {
      newFormData.meal_schedules = evaluation.feeding_habits.meal_schedules || '';
      newFormData.eating_anxiety = evaluation.feeding_habits.eating_anxiety || '';
      newFormData.binges = evaluation.feeding_habits.binges || '';
      newFormData.emotional_eating = evaluation.feeding_habits.emotional_eating || '';
      newFormData.eating_out = evaluation.feeding_habits.eating_out || '';
    }

    setFormData(newFormData);
  };

  const loadFollowUpFormDataFromEvaluation = (evaluation: any) => {
    const newFormData = { ...getInitialFormData() };
    
    // Antropometría
    if (evaluation.anthropometric) {
      newFormData.height = evaluation.anthropometric.height?.toString() || '';
      newFormData.weight = evaluation.anthropometric.weight?.toString() || '';
      newFormData.body_fat_percentage = evaluation.anthropometric.body_fat_percentage?.toString() || '';
      newFormData.visceral_fat_percentage = evaluation.anthropometric.visceral_fat_percentage?.toString() || '';
      newFormData.total_water_percentage = evaluation.anthropometric.total_water_percentage?.toString() || '';
      newFormData.muscle_percentage = evaluation.anthropometric.muscle_percentage?.toString() || '';
      newFormData.waist_circumference = evaluation.anthropometric.waist_circumference?.toString() || '';
      newFormData.leg_circumference = evaluation.anthropometric.leg_circumference?.toString() || '';
      newFormData.hip_circumference = evaluation.anthropometric.hip_circumference?.toString() || '';
      newFormData.gluteus_circumference = evaluation.anthropometric.gluteus_circumference?.toString() || '';
      newFormData.arm_circumference = evaluation.anthropometric.arm_circumference?.toString() || '';
      newFormData.neck_circumference = evaluation.anthropometric.neck_circumference?.toString() || '';
      newFormData.biceps_skinfold_mm = evaluation.anthropometric.biceps_skinfold_mm?.toString() || '';
      newFormData.triceps_skinfold_mm = evaluation.anthropometric.triceps_skinfold_mm?.toString() || '';
      newFormData.blood_pressure_systolic = evaluation.anthropometric.blood_pressure_systolic?.toString() || '';
      newFormData.blood_pressure_diastolic = evaluation.anthropometric.blood_pressure_diastolic?.toString() || '';
    }

    // Parámetros bioquímicos
    if (evaluation.biochemical_params) {
      newFormData.glucose = evaluation.biochemical_params.glucose?.toString() || '';
      newFormData.insulin = evaluation.biochemical_params.insulin?.toString() || '';
      newFormData.homa_ir = evaluation.biochemical_params.homa_ir?.toString() || '';
      newFormData.total_cholesterol = evaluation.biochemical_params.total_cholesterol?.toString() || '';
      newFormData.triglycerides = evaluation.biochemical_params.triglycerides?.toString() || '';
      newFormData.hdl_cholesterol = evaluation.biochemical_params.hdl_cholesterol?.toString() || '';
      newFormData.ldl_cholesterol = evaluation.biochemical_params.ldl_cholesterol?.toString() || '';
      newFormData.tsh = evaluation.biochemical_params.tsh?.toString() || '';
      newFormData.t3 = evaluation.biochemical_params.t3?.toString() || '';
      newFormData.t4 = evaluation.biochemical_params.t4?.toString() || '';
      newFormData.vitamin_d = evaluation.biochemical_params.vitamin_d?.toString() || '';
      newFormData.other_params = evaluation.biochemical_params.other_params || '';
    }

    // Diagnóstico
    if (evaluation.nutritional_diagnosis) {
      newFormData.diagnosis = evaluation.nutritional_diagnosis.diagnosis || '';
    }

    // Plan de intervención
    if (evaluation.intervention_plan) {
      newFormData.nutritional_goals = evaluation.intervention_plan.nutritional_goals || '';
      newFormData.dietary_strategy = evaluation.intervention_plan.dietary_strategy || '';
      newFormData.specific_recommendations = evaluation.intervention_plan.specific_recommendations || '';
      newFormData.supplementation = evaluation.intervention_plan.supplementation || '';
    }

    // Seguimiento
    if (evaluation.follow_up) {
      newFormData.next_appointment_date = evaluation.follow_up.next_appointment_date ? 
        new Date(evaluation.follow_up.next_appointment_date).toISOString().split('T')[0] : '';
      newFormData.indicators_to_evaluate = evaluation.follow_up.indicators_to_evaluate || '';
      newFormData.observations = evaluation.follow_up.observations || '';
    }

    // Cargar datos antropométricos en campos individuales para facilitar edición
    if (evaluation.anthropometric) {
    newFormData.height = evaluation.anthropometric.height?.toString() || '';
    newFormData.weight = evaluation.anthropometric.weight?.toString() || '';
    newFormData.body_fat_percentage = evaluation.anthropometric.body_fat_percentage?.toString() || '';
    newFormData.visceral_fat_percentage = evaluation.anthropometric.visceral_fat_percentage?.toString() || '';
    newFormData.total_water_percentage = evaluation.anthropometric.total_water_percentage?.toString() || '';
    newFormData.muscle_percentage = evaluation.anthropometric.muscle_percentage?.toString() || '';
    newFormData.waist_circumference = evaluation.anthropometric.waist_circumference?.toString() || '';
    newFormData.leg_circumference = evaluation.anthropometric.leg_circumference?.toString() || '';
    newFormData.hip_circumference = evaluation.anthropometric.hip_circumference?.toString() || '';
    newFormData.gluteus_circumference = evaluation.anthropometric.gluteus_circumference?.toString() || '';
    newFormData.arm_circumference = evaluation.anthropometric.arm_circumference?.toString() || '';
    newFormData.neck_circumference = evaluation.anthropometric.neck_circumference?.toString() || '';
    newFormData.biceps_skinfold_mm = evaluation.anthropometric.biceps_skinfold_mm?.toString() || '';
    newFormData.triceps_skinfold_mm = evaluation.anthropometric.triceps_skinfold_mm?.toString() || '';
    newFormData.blood_pressure_systolic = evaluation.anthropometric.blood_pressure_systolic?.toString() || '';
    newFormData.blood_pressure_diastolic = evaluation.anthropometric.blood_pressure_diastolic?.toString() || '';
    // Medidas por extremidad
    newFormData.right_arm_fat = evaluation.anthropometric.right_arm_fat?.toString() || '';
    newFormData.right_arm_muscle = evaluation.anthropometric.right_arm_muscle?.toString() || '';
    newFormData.left_arm_fat = evaluation.anthropometric.left_arm_fat?.toString() || '';
    newFormData.left_arm_muscle = evaluation.anthropometric.left_arm_muscle?.toString() || '';
    newFormData.right_leg_fat = evaluation.anthropometric.right_leg_fat?.toString() || '';
    newFormData.right_leg_muscle = evaluation.anthropometric.right_leg_muscle?.toString() || '';
    newFormData.left_leg_fat = evaluation.anthropometric.left_leg_fat?.toString() || '';
    newFormData.left_leg_muscle = evaluation.anthropometric.left_leg_muscle?.toString() || '';
    newFormData.torso_fat = evaluation.anthropometric.torso_fat?.toString() || '';
    newFormData.torso_muscle = evaluation.anthropometric.torso_muscle?.toString() || '';
    }
    setFormData(newFormData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveCurrentSection = async () => {
    setLoading(true);
    try {
      if (isInitialEvaluation) {
        // Guardar evaluación inicial del paciente
        const { saveInitialEvaluation } = await import('@/lib/clinical-evaluations-actions');
        await saveInitialEvaluation({
          patient_id: appointment.patient.id,
          consultation_reason: {
            main_goal: formData.main_goal,
            onset_date: formData.onset_date ? new Date(formData.onset_date) : null,
            treatment_expectations: formData.treatment_expectations
          },
          family_history: {
            diabetes: formData.diabetes,
            hypertension: formData.hypertension,
            obesity: formData.obesity,
            dyslipidemia: formData.dyslipidemia,
            cardiovascular_disease: formData.cardiovascular_disease,
            cancer: formData.cancer,
            pcos: formData.pcos,
            other_conditions: formData.other_conditions
          },
          personal_history: {
            current_diseases: formData.current_diseases,
            past_diseases: formData.past_diseases,
            surgeries: formData.surgeries,
            current_medications: formData.current_medications,
            supplements: formData.supplements,
            allergies_intolerances: formData.allergies_intolerances
          },
          non_pathological_history: {
            physical_activity_type: formData.physical_activity_type,
            physical_activity_frequency: formData.physical_activity_frequency,
            physical_activity_duration: formData.physical_activity_duration,
            alcohol_consumption: formData.alcohol_consumption,
            smoking: formData.smoking,
            sleep_quality: formData.sleep_quality,
            stress_level: formData.stress_level,
            daily_hydration: formData.daily_hydration
          },
          gynecological_history: {
            menarche_age: formData.menarche_age ? parseInt(formData.menarche_age) : null,
            menstrual_cycle: formData.menstrual_cycle,
            cycle_duration: formData.cycle_duration ? parseInt(formData.cycle_duration) : null,
            symptoms: formData.symptoms,
            pregnancies: formData.pregnancies ? parseInt(formData.pregnancies) : null,
            contraceptives_use: formData.contraceptives_use,
            contraceptives_type: formData.contraceptives_type
          },
          dietary_recall: {
            breakfast: formData.breakfast,
            morning_snack: formData.morning_snack,
            lunch: formData.lunch,
            afternoon_snack: formData.afternoon_snack,
            dinner: formData.dinner,
            snacks_beverages: formData.snacks_beverages
          },
          food_frequency: {
            fruits: formData.fruits,
            vegetables: formData.vegetables,
            proteins: formData.proteins,
            dairy: formData.dairy,
            cereals: formData.cereals,
            ultraprocessed: formData.ultraprocessed,
            sugars: formData.sugars
          },
          feeding_habits: {
            meal_schedules: formData.meal_schedules,
            eating_anxiety: formData.eating_anxiety,
            binges: formData.binges,
            emotional_eating: formData.emotional_eating,
            eating_out: formData.eating_out
          }
        });
        toast.success('Evaluación inicial guardada');
      } else {
        // Guardar evaluación de seguimiento
        const { saveFollowUpEvaluation } = await import('@/lib/clinical-evaluations-actions');
        await saveFollowUpEvaluation({
          appointment_id: appointment.id,
          patient_id: appointment.patient.id,
          anthropometric: {
            height: formData.height ? parseFloat(formData.height) : null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : null,
            visceral_fat_percentage: formData.visceral_fat_percentage ? parseFloat(formData.visceral_fat_percentage) : null,
            total_water_percentage: formData.total_water_percentage ? parseFloat(formData.total_water_percentage) : null,
            muscle_percentage: formData.muscle_percentage ? parseFloat(formData.muscle_percentage) : null,
            waist_circumference: formData.waist_circumference ? parseFloat(formData.waist_circumference) : null,
            leg_circumference: formData.leg_circumference ? parseFloat(formData.leg_circumference) : null,
            hip_circumference: formData.hip_circumference ? parseFloat(formData.hip_circumference) : null,
            gluteus_circumference: formData.gluteus_circumference ? parseFloat(formData.gluteus_circumference) : null,
            arm_circumference: formData.arm_circumference ? parseFloat(formData.arm_circumference) : null,
            neck_circumference: formData.neck_circumference ? parseFloat(formData.neck_circumference) : null,
            biceps_skinfold_mm: formData.biceps_skinfold_mm ? parseFloat(formData.biceps_skinfold_mm) : null,
            triceps_skinfold_mm: formData.triceps_skinfold_mm ? parseFloat(formData.triceps_skinfold_mm) : null,
            blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
            blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
            right_arm_fat: formData.right_arm_fat ? parseFloat(formData.right_arm_fat) : null,
            right_arm_muscle: formData.right_arm_muscle ? parseFloat(formData.right_arm_muscle) : null,
            left_arm_fat: formData.left_arm_fat ? parseFloat(formData.left_arm_fat) : null,
            left_arm_muscle: formData.left_arm_muscle ? parseFloat(formData.left_arm_muscle) : null,
            right_leg_fat: formData.right_leg_fat ? parseFloat(formData.right_leg_fat) : null,
            right_leg_muscle: formData.right_leg_muscle ? parseFloat(formData.right_leg_muscle) : null,
            left_leg_fat: formData.left_leg_fat ? parseFloat(formData.left_leg_fat) : null,
            left_leg_muscle: formData.left_leg_muscle ? parseFloat(formData.left_leg_muscle) : null,
            torso_fat: formData.torso_fat ? parseFloat(formData.torso_fat) : null,
            torso_muscle: formData.torso_muscle ? parseFloat(formData.torso_muscle) : null,
          },
          biochemical_params: {
            glucose: formData.glucose ? parseFloat(formData.glucose) : null,
            insulin: formData.insulin ? parseFloat(formData.insulin) : null,
            homa_ir: formData.homa_ir ? parseFloat(formData.homa_ir) : null,
            total_cholesterol: formData.total_cholesterol ? parseFloat(formData.total_cholesterol) : null,
            triglycerides: formData.triglycerides ? parseFloat(formData.triglycerides) : null,
            hdl_cholesterol: formData.hdl_cholesterol ? parseFloat(formData.hdl_cholesterol) : null,
            ldl_cholesterol: formData.ldl_cholesterol ? parseFloat(formData.ldl_cholesterol) : null,
            tsh: formData.tsh ? parseFloat(formData.tsh) : null,
            t3: formData.t3 ? parseFloat(formData.t3) : null,
            t4: formData.t4 ? parseFloat(formData.t4) : null,
            vitamin_d: formData.vitamin_d ? parseFloat(formData.vitamin_d) : null,
            other_params: formData.other_params
          },
          nutritional_diagnosis: {
            diagnosis: formData.diagnosis
          },
          intervention_plan: {
            nutritional_goals: formData.nutritional_goals,
            dietary_strategy: formData.dietary_strategy,
            specific_recommendations: formData.specific_recommendations,
            supplementation: formData.supplementation
          },
          follow_up: {
            next_appointment_date: formData.next_appointment_date ? new Date(formData.next_appointment_date) : null,
            indicators_to_evaluate: formData.indicators_to_evaluate,
            observations: formData.observations
          }
        });
        toast.success('Consulta completada');
      }
      
      return true;
    } catch (error) {
      toast.error('Error al guardar la información');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const success = await saveCurrentSection();
    if (success) {
      if (currentSection < visibleSections.length - 1) {
        setCurrentSection(prev => prev + 1);
      } else {
        onSuccess();
        onClose();
      }
    }
  };

  const handlePrevious = () => {
    setCurrentSection(prev => prev - 1);
  };

  if (!isOpen || !appointment) return null;

  const currentSectionData = visibleSections[currentSection];
  const isLastSection = currentSection === visibleSections.length - 1;
  const isFirstSection = currentSection === 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#E6E3DE]">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E6E3DE] px-6 py-4 bg-[#FAF9F7] flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#5A8C7A]">
              {isInitialEvaluation ? 'Evaluación Inicial' : 'Evaluación de Seguimiento'}
            </h2>
            <p className="text-sm text-[#6E7C72] mt-1">
              Paciente: {appointment.patient.nombre_completo} | {currentSectionData.title}
            </p>
          </div>
          <button onClick={onClose} className="text-[#6E7C72] hover:text-[#2C3E34]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-[#E6E3DE] rounded-full h-2">
            <div 
              className="bg-[#5A8C7A] h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentSection + 1) / visibleSections.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-[#6E7C72] mt-2 text-right">
            Sección {currentSection + 1} de {visibleSections.length}
          </p>
        </div>

        {/* Formulario - Se mantiene igual, solo se muestra el contenido según la sección */}
        <div className="p-6">
          {/* Motivo de Consulta */}
          {currentSectionData.id === 'motivo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">¿Cuál es tu objetivo principal? *</label>
                <textarea 
                  value={formData.main_goal}
                  onChange={(e) => handleInputChange('main_goal', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">¿Desde cuándo presentas esta situación?</label>
                <input 
                  type="date"
                  value={formData.onset_date}
                  onChange={(e) => handleInputChange('onset_date', e.target.value)}
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Expectativas del tratamiento *</label>
                <textarea 
                  value={formData.treatment_expectations}
                  onChange={(e) => handleInputChange('treatment_expectations', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A]"
                  required
                />
              </div>
            </div>
          )}

          {/* Antecedentes Heredofamiliares */}
          {currentSectionData.id === 'heredo' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.diabetes} onChange={(e) => handleInputChange('diabetes', e.target.checked)} className="rounded text-[#5A8C7A]" /><span>Diabetes</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.hypertension} onChange={(e) => handleInputChange('hypertension', e.target.checked)} className="rounded text-[#5A8C7A]" /><span>Hipertensión</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.obesity} onChange={(e) => handleInputChange('obesity', e.target.checked)} className="rounded text-[#5A8C7A]" /><span>Obesidad</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.dyslipidemia} onChange={(e) => handleInputChange('dyslipidemia', e.target.checked)} className="rounded text-[#5A8C7A]" /><span>Dislipidemia</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.cardiovascular_disease} onChange={(e) => handleInputChange('cardiovascular_disease', e.target.checked)} className="rounded text-[#5A8C7A]" /><span>Enfermedad cardiovascular</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.cancer} onChange={(e) => handleInputChange('cancer', e.target.checked)} className="rounded text-[#5A8C7A]" /><span>Cáncer</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.pcos} onChange={(e) => handleInputChange('pcos', e.target.checked)} className="rounded text-[#5A8C7A]" /><span>SOP</span></label>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Otros:</label>
                <input type="text" value={formData.other_conditions} onChange={(e) => handleInputChange('other_conditions', e.target.value)} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" placeholder="Especificar..." />
              </div>
            </div>
          )}

          {/* Antecedentes Personales Patológicos */}
          {currentSectionData.id === 'personales' && (
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold">Enfermedades actuales:</label><textarea value={formData.current_diseases} onChange={(e) => handleInputChange('current_diseases', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Enfermedades previas:</label><textarea value={formData.past_diseases} onChange={(e) => handleInputChange('past_diseases', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Cirugías:</label><textarea value={formData.surgeries} onChange={(e) => handleInputChange('surgeries', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Medicamentos actuales:</label><textarea value={formData.current_medications} onChange={(e) => handleInputChange('current_medications', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Suplementos:</label><textarea value={formData.supplements} onChange={(e) => handleInputChange('supplements', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Alergias/intolerancias:</label><textarea value={formData.allergies_intolerances} onChange={(e) => handleInputChange('allergies_intolerances', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
          )}

          {/* Antecedentes No Patológicos */}
          {currentSectionData.id === 'no_patologicos' && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold">Actividad física (tipo):</label><input type="text" value={formData.physical_activity_type} onChange={(e) => handleInputChange('physical_activity_type', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Frecuencia:</label><input type="text" value={formData.physical_activity_frequency} onChange={(e) => handleInputChange('physical_activity_frequency', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Duración:</label><input type="text" value={formData.physical_activity_duration} onChange={(e) => handleInputChange('physical_activity_duration', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Consumo de alcohol:</label><input type="text" value={formData.alcohol_consumption} onChange={(e) => handleInputChange('alcohol_consumption', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Tabaquismo:</label><input type="text" value={formData.smoking} onChange={(e) => handleInputChange('smoking', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Calidad de sueño:</label><input type="text" value={formData.sleep_quality} onChange={(e) => handleInputChange('sleep_quality', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Nivel de estrés:</label><select value={formData.stress_level} onChange={(e) => handleInputChange('stress_level', e.target.value)} className="w-full px-3 py-2 border rounded-lg"><option value="">Seleccionar</option><option value="Bajo">Bajo</option><option value="Moderado">Moderado</option><option value="Alto">Alto</option></select></div>
              <div><label className="block text-sm font-semibold">Hidratación diaria:</label><input type="text" value={formData.daily_hydration} onChange={(e) => handleInputChange('daily_hydration', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
          )}

          {/* Historia Ginecológica */}
          {currentSectionData.id === 'ginecologicos' && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold">Edad de menarca:</label><input type="number" value={formData.menarche_age} onChange={(e) => handleInputChange('menarche_age', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Ciclo menstrual:</label><select value={formData.menstrual_cycle} onChange={(e) => handleInputChange('menstrual_cycle', e.target.value)} className="w-full px-3 py-2 border rounded-lg"><option value="">Seleccionar</option><option value="regular">Regular</option><option value="irregular">Irregular</option></select></div>
              <div><label className="block text-sm font-semibold">Duración del ciclo:</label><input type="number" value={formData.cycle_duration} onChange={(e) => handleInputChange('cycle_duration', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Síntomas:</label><input type="text" value={formData.symptoms} onChange={(e) => handleInputChange('symptoms', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Embarazos:</label><input type="number" value={formData.pregnancies} onChange={(e) => handleInputChange('pregnancies', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="col-span-2"><label className="flex items-center gap-2"><input type="checkbox" checked={formData.contraceptives_use} onChange={(e) => handleInputChange('contraceptives_use', e.target.checked)} className="rounded text-[#5A8C7A]" /><span>Uso de anticonceptivos</span></label></div>
              {formData.contraceptives_use && <div className="col-span-2"><label className="block text-sm font-semibold">Tipo de anticonceptivo:</label><input type="text" value={formData.contraceptives_type} onChange={(e) => handleInputChange('contraceptives_type', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>}
            </div>
          )}

          {/* Evaluación Dietética */}
          {currentSectionData.id === 'dietetica' && (
            <div className="space-y-6">
              <div><h3 className="text-md font-semibold text-[#5A8C7A] mb-3">Recordatorio de 24 horas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-semibold">Desayuno:</label><textarea value={formData.breakfast} onChange={(e) => handleInputChange('breakfast', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Colación AM:</label><textarea value={formData.morning_snack} onChange={(e) => handleInputChange('morning_snack', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Comida:</label><textarea value={formData.lunch} onChange={(e) => handleInputChange('lunch', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Colación PM:</label><textarea value={formData.afternoon_snack} onChange={(e) => handleInputChange('afternoon_snack', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Cena:</label><textarea value={formData.dinner} onChange={(e) => handleInputChange('dinner', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Snacks/bebidas:</label><textarea value={formData.snacks_beverages} onChange={(e) => handleInputChange('snacks_beverages', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
                </div>
              </div>
              <div><h3 className="text-md font-semibold mb-3">Frecuencia de consumo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-semibold">Frutas:</label><input type="text" value={formData.fruits} onChange={(e) => handleInputChange('fruits', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Verduras:</label><input type="text" value={formData.vegetables} onChange={(e) => handleInputChange('vegetables', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Proteínas:</label><input type="text" value={formData.proteins} onChange={(e) => handleInputChange('proteins', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Lácteos:</label><input type="text" value={formData.dairy} onChange={(e) => handleInputChange('dairy', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Cereales:</label><input type="text" value={formData.cereals} onChange={(e) => handleInputChange('cereals', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Ultraprocesados:</label><input type="text" value={formData.ultraprocessed} onChange={(e) => handleInputChange('ultraprocessed', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Azúcares:</label><input type="text" value={formData.sugars} onChange={(e) => handleInputChange('sugars', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                </div>
              </div>
              <div><h3 className="text-md font-semibold mb-3">Hábitos alimentarios</h3>
                <div className="space-y-3">
                  <div><label className="block text-sm font-semibold">Horarios de comida:</label><input type="text" value={formData.meal_schedules} onChange={(e) => handleInputChange('meal_schedules', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Ansiedad por comer:</label><input type="text" value={formData.eating_anxiety} onChange={(e) => handleInputChange('eating_anxiety', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Atracones:</label><input type="text" value={formData.binges} onChange={(e) => handleInputChange('binges', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Comer emocional:</label><input type="text" value={formData.emotional_eating} onChange={(e) => handleInputChange('emotional_eating', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Comer fuera de casa:</label><input type="text" value={formData.eating_out} onChange={(e) => handleInputChange('eating_out', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                </div>
              </div>
            </div>
          )}

          {/* Evaluación Antropométrica */}
            {currentSectionData.id === 'antropometrica' && (
            <div className="space-y-6">
                {/* Medidas básicas */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-semibold">Estatura (cm):</label><input type="number" step="0.1" value={formData.height} onChange={(e) => handleInputChange('height', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Peso (kg):</label><input type="number" step="0.1" value={formData.weight} onChange={(e) => handleInputChange('weight', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">% Grasa:</label><input type="number" step="0.1" value={formData.body_fat_percentage} onChange={(e) => handleInputChange('body_fat_percentage', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">% Grasa Visceral:</label><input type="number" step="0.1" value={formData.visceral_fat_percentage} onChange={(e) => handleInputChange('visceral_fat_percentage', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">% Agua Total:</label><input type="number" step="0.1" value={formData.total_water_percentage} onChange={(e) => handleInputChange('total_water_percentage', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">% Músculo:</label><input type="number" step="0.1" value={formData.muscle_percentage} onChange={(e) => handleInputChange('muscle_percentage', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Cintura (cm):</label><input type="number" step="0.1" value={formData.waist_circumference} onChange={(e) => handleInputChange('waist_circumference', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Pierna (cm):</label><input type="number" step="0.1" value={formData.leg_circumference} onChange={(e) => handleInputChange('leg_circumference', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Cadera (cm):</label><input type="number" step="0.1" value={formData.hip_circumference} onChange={(e) => handleInputChange('hip_circumference', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Glúteo (cm):</label><input type="number" step="0.1" value={formData.gluteus_circumference} onChange={(e) => handleInputChange('gluteus_circumference', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Brazo (cm):</label><input type="number" step="0.1" value={formData.arm_circumference} onChange={(e) => handleInputChange('arm_circumference', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Cuello (cm):</label><input type="number" step="0.1" value={formData.neck_circumference} onChange={(e) => handleInputChange('neck_circumference', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Pliegue Bíceps (mm):</label><input type="number" step="0.1" value={formData.biceps_skinfold_mm} onChange={(e) => handleInputChange('biceps_skinfold_mm', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Pliegue Tríceps (mm):</label><input type="number" step="0.1" value={formData.triceps_skinfold_mm} onChange={(e) => handleInputChange('triceps_skinfold_mm', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Presión Arterial Sistólica:</label><input type="number" value={formData.blood_pressure_systolic} onChange={(e) => handleInputChange('blood_pressure_systolic', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-semibold">Presión Arterial Diastólica:</label><input type="number" value={formData.blood_pressure_diastolic} onChange={(e) => handleInputChange('blood_pressure_diastolic', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                </div>

                {/* Tabla de Medidas por Extremidad */}
                <div>
                <h3 className="text-md font-semibold text-[#5A8C7A] mb-3">Medidas por Extremidad</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-[#E6E3DE]">
                    <thead>
                        <tr className="bg-[#FAF9F7]">
                        <th rowSpan={2} className="border border-[#E6E3DE] px-3 py-2 text-center text-sm font-semibold text-[#2C3E34]">Extremidad</th>
                        <th colSpan={2} className="border border-[#E6E3DE] px-3 py-2 text-center text-sm font-semibold text-[#2C3E34]">Derecho</th>
                        <th colSpan={2} className="border border-[#E6E3DE] px-3 py-2 text-center text-sm font-semibold text-[#2C3E34]">Izquierdo</th>
                        </tr>
                        <tr className="bg-[#FAF9F7]">
                        <th className="border border-[#E6E3DE] px-3 py-1 text-center text-xs font-medium text-[#6E7C72]">Grasa (%)</th>
                        <th className="border border-[#E6E3DE] px-3 py-1 text-center text-xs font-medium text-[#6E7C72]">Músculo (%)</th>
                        <th className="border border-[#E6E3DE] px-3 py-1 text-center text-xs font-medium text-[#6E7C72]">Grasa (%)</th>
                        <th className="border border-[#E6E3DE] px-3 py-1 text-center text-xs font-medium text-[#6E7C72]">Músculo (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Brazo */}
                        <tr>
                        <td className="border border-[#E6E3DE] px-3 py-2 text-sm font-semibold text-[#2C3E34]">Brazo</td>
                        <td className="border border-[#E6E3DE] px-3 py-2">
                            <input type="number" step="0.1" value={formData.right_arm_fat} onChange={(e) => handleInputChange('right_arm_fat', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="—" />
                        </td>
                        <td className="border border-[#E6E3DE] px-3 py-2">
                            <input type="number" step="0.1" value={formData.right_arm_muscle} onChange={(e) => handleInputChange('right_arm_muscle', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="—" />
                        </td>
                        <td className="border border-[#E6E3DE] px-3 py-2">
                            <input type="number" step="0.1" value={formData.left_arm_fat} onChange={(e) => handleInputChange('left_arm_fat', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="—" />
                        </td>
                        <td className="border border-[#E6E3DE] px-3 py-2">
                            <input type="number" step="0.1" value={formData.left_arm_muscle} onChange={(e) => handleInputChange('left_arm_muscle', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="—" />
                        </td>
                        </tr>
                        {/* Pierna */}
                        <tr>
                        <td className="border border-[#E6E3DE] px-3 py-2 text-sm font-semibold text-[#2C3E34]">Pierna</td>
                        <td className="border border-[#E6E3DE] px-3 py-2">
                            <input type="number" step="0.1" value={formData.right_leg_fat} onChange={(e) => handleInputChange('right_leg_fat', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="—" />
                        </td>
                        <td className="border border-[#E6E3DE] px-3 py-2">
                            <input type="number" step="0.1" value={formData.right_leg_muscle} onChange={(e) => handleInputChange('right_leg_muscle', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="—" />
                        </td>
                        <td className="border border-[#E6E3DE] px-3 py-2">
                            <input type="number" step="0.1" value={formData.left_leg_fat} onChange={(e) => handleInputChange('left_leg_fat', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="—" />
                        </td>
                        <td className="border border-[#E6E3DE] px-3 py-2">
                            <input type="number" step="0.1" value={formData.left_leg_muscle} onChange={(e) => handleInputChange('left_leg_muscle', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="—" />
                        </td>
                        </tr>
                        {/* Torso */}
                        <tr>
                        <td className="border border-[#E6E3DE] px-3 py-2 text-sm font-semibold text-[#2C3E34]">Torso</td>
                        <td colSpan={2} className="border border-[#E6E3DE] px-3 py-2 text-center text-xs text-[#6E7C72]">—</td>
                        <td className="border border-[#E6E3DE] px-3 py-2">
                            <input type="number" step="0.1" value={formData.torso_fat} onChange={(e) => handleInputChange('torso_fat', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="—" />
                        </td>
                        <td className="border border-[#E6E3DE] px-3 py-2">
                            <input type="number" step="0.1" value={formData.torso_muscle} onChange={(e) => handleInputChange('torso_muscle', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="—" />
                        </td>
                        </tr>
                    </tbody>
                    </table>
                </div>
                <p className="text-xs text-[#6E7C72] mt-2">Complete los valores de grasa y músculo para cada extremidad</p>
                </div>
            </div>
            )}

          {/* Parámetros Bioquímicos */}
          {currentSectionData.id === 'bioquimicos' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-semibold">Glucosa:</label><input type="number" step="0.1" value={formData.glucose} onChange={(e) => handleInputChange('glucose', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Insulina:</label><input type="number" step="0.1" value={formData.insulin} onChange={(e) => handleInputChange('insulin', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">HOMA-IR:</label><input type="number" step="0.1" value={formData.homa_ir} onChange={(e) => handleInputChange('homa_ir', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Colesterol Total:</label><input type="number" step="0.1" value={formData.total_cholesterol} onChange={(e) => handleInputChange('total_cholesterol', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Triglicéridos:</label><input type="number" step="0.1" value={formData.triglycerides} onChange={(e) => handleInputChange('triglycerides', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">HDL:</label><input type="number" step="0.1" value={formData.hdl_cholesterol} onChange={(e) => handleInputChange('hdl_cholesterol', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">LDL:</label><input type="number" step="0.1" value={formData.ldl_cholesterol} onChange={(e) => handleInputChange('ldl_cholesterol', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">TSH:</label><input type="number" step="0.1" value={formData.tsh} onChange={(e) => handleInputChange('tsh', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">T3:</label><input type="number" step="0.1" value={formData.t3} onChange={(e) => handleInputChange('t3', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">T4:</label><input type="number" step="0.1" value={formData.t4} onChange={(e) => handleInputChange('t4', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Vitamina D:</label><input type="number" step="0.1" value={formData.vitamin_d} onChange={(e) => handleInputChange('vitamin_d', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="col-span-2"><label className="block text-sm font-semibold">Otros:</label><textarea value={formData.other_params} onChange={(e) => handleInputChange('other_params', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
          )}

          {/* Diagnóstico Nutricional */}
          {currentSectionData.id === 'diagnostico' && (
            <div><label className="block text-sm font-semibold">Diagnóstico Nutricional</label><textarea value={formData.diagnosis} onChange={(e) => handleInputChange('diagnosis', e.target.value)} rows={5} className="w-full px-3 py-2 border rounded-lg" placeholder="Ingrese el diagnóstico nutricional..." /></div>
          )}

          {/* Plan de Intervención */}
          {currentSectionData.id === 'intervencion' && (
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold">Objetivos nutricionales:</label><textarea value={formData.nutritional_goals} onChange={(e) => handleInputChange('nutritional_goals', e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Estrategia alimentaria:</label><textarea value={formData.dietary_strategy} onChange={(e) => handleInputChange('dietary_strategy', e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Recomendaciones específicas:</label><textarea value={formData.specific_recommendations} onChange={(e) => handleInputChange('specific_recommendations', e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Suplementación (si aplica):</label><textarea value={formData.supplementation} onChange={(e) => handleInputChange('supplementation', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
          )}

          {/* Seguimiento */}
          {currentSectionData.id === 'seguimiento' && (
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold">Fecha próxima cita:</label><input type="date" value={formData.next_appointment_date} onChange={(e) => handleInputChange('next_appointment_date', e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Indicadores a evaluar:</label><textarea value={formData.indicators_to_evaluate} onChange={(e) => handleInputChange('indicators_to_evaluate', e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-semibold">Observaciones:</label><textarea value={formData.observations} onChange={(e) => handleInputChange('observations', e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex justify-between gap-3 pt-6 mt-6 border-t border-[#E6E3DE]">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isFirstSection}
              className="px-4 py-2 border border-[#E6E3DE] rounded-lg text-[#6E7C72] hover:bg-[#FAF9F7] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] disabled:opacity-50"
            >
              {loading ? 'Guardando...' : (isLastSection ? (isInitialEvaluation ? 'Guardar evaluación' : 'Finalizar consulta') : 'Siguiente')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}