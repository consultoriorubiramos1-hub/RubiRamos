'use client';

import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PatientNutritionPlanViewer from './PatientNutritionPlanViewer';
import PatientPredictiveModule from './PatientPredictiveModule';
import PatientProgressView from './PatientProgressView';
import MedicalHistoryPDF from './MedicalHistoryPDF';
import { getGeneralRecommendations } from '@/lib/recomendation-pdf-actions';
import { toast } from 'react-hot-toast';

interface PatientMedicalHistoryClientProps {
  patient: any;
  initialEvaluation: any;
  followUpEvaluations: any[];
  nutritionPlan: any;
  predictiveData: any;
}

export default function PatientMedicalHistoryClient({
  patient,
  initialEvaluation,
  followUpEvaluations,
  nutritionPlan,
  predictiveData
}: PatientMedicalHistoryClientProps) {
  const [activeTab, setActiveTab] = useState<'initial' | 'progress' | 'nutrition' | 'predictive'>('initial');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generalRecommendations, setGeneralRecommendations] = useState<any[]>([]);

  const formatDate = (date: string | Date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatNumber = (value: number | string | null | undefined, decimals: number = 1) => {
    if (value === null || value === undefined) return '—';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '—';
    return numValue.toFixed(decimals);
  };

  const getGenderText = (gender: string) => {
    if (gender === 'M') return 'Masculino';
    if (gender === 'F') return 'Femenino';
    return 'No especificado';
  };

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    try {
      const recommendations = await getGeneralRecommendations();
      setGeneralRecommendations(recommendations);
      setTimeout(() => setGeneratingPDF(false), 500);
    } catch (error) {
      toast.error('Error al cargar recomendaciones');
      setGeneratingPDF(false);
    }
  };

  const sanitizeFileName = (name: string) => {
    return name.replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const fileName = `${sanitizeFileName(patient.nombre_completo)}_Historial_Medico.pdf`;

  return (
    <div className="space-y-6">
      {/* Encabezado con botón de PDF */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#5A8C7A]">Mi Historial Médico</h1>
          <p className="text-sm text-[#6E7C72] mt-1">Consulta toda tu información médica, evaluaciones y plan alimenticio</p>
        </div>
        
        <PDFDownloadLink
          document={
            <MedicalHistoryPDF
              patient={patient}
              initialEvaluation={initialEvaluation}
              followUpEvaluations={followUpEvaluations}
              nutritionPlan={nutritionPlan}
              generalRecommendations={generalRecommendations}
            />
          }
          fileName={fileName}
          onClick={handleGeneratePDF}
        >
          {({ loading, error }) => (
            <button
              disabled={loading || generatingPDF}
              className="px-4 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {loading || generatingPDF ? 'Preparando PDF...' : 'Descargar PDF'}
            </button>
          )}
        </PDFDownloadLink>
      </div>

      {/* Tarjeta de información del paciente */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-6">
        <h2 className="text-xl font-bold text-[#5A8C7A] mb-4">Mis Datos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div><span className="font-semibold text-[#2C3E34]">Nombre completo:</span> <span className="text-[#6E7C72]">{patient.nombre_completo}</span></div>
          <div><span className="font-semibold text-[#2C3E34]">Email:</span> <span className="text-[#6E7C72]">{patient.email}</span></div>
          <div><span className="font-semibold text-[#2C3E34]">Teléfono:</span> <span className="text-[#6E7C72]">{patient.phone || '—'}</span></div>
          <div><span className="font-semibold text-[#2C3E34]">Edad:</span> <span className="text-[#6E7C72]">{patient.age} años</span></div>
          <div><span className="font-semibold text-[#2C3E34]">Género:</span> <span className="text-[#6E7C72]">{getGenderText(patient.gender)}</span></div>
          <div><span className="font-semibold text-[#2C3E34]">Estatura:</span> <span className="text-[#6E7C72]">{patient.height ? `${patient.height} cm` : '—'}</span></div>
          {patient.fecha_nacimiento && (
            <div><span className="font-semibold text-[#2C3E34]">Fecha nacimiento:</span> <span className="text-[#6E7C72]">{formatDate(patient.fecha_nacimiento)}</span></div>
          )}
          {patient.estado_civil && (
            <div><span className="font-semibold text-[#2C3E34]">Estado civil:</span> <span className="text-[#6E7C72]">{patient.estado_civil}</span></div>
          )}
          {patient.ocupacion && (
            <div><span className="font-semibold text-[#2C3E34]">Ocupación:</span> <span className="text-[#6E7C72]">{patient.ocupacion}</span></div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E6E3DE] overflow-x-auto">
        <button
          onClick={() => setActiveTab('initial')}
          className={`px-6 py-2 font-semibold transition-colors whitespace-nowrap ${activeTab === 'initial' ? 'text-[#5A8C7A] border-b-2 border-[#5A8C7A]' : 'text-[#6E7C72] hover:text-[#2C3E34]'}`}
        >
          Evaluación Inicial
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-6 py-2 font-semibold transition-colors whitespace-nowrap ${activeTab === 'progress' ? 'text-[#5A8C7A] border-b-2 border-[#5A8C7A]' : 'text-[#6E7C72] hover:text-[#2C3E34]'}`}
        >
          Progreso ({followUpEvaluations.length} registros)
        </button>
        <button
          onClick={() => setActiveTab('nutrition')}
          className={`px-6 py-2 font-semibold transition-colors whitespace-nowrap ${activeTab === 'nutrition' ? 'text-[#5A8C7A] border-b-2 border-[#5A8C7A]' : 'text-[#6E7C72] hover:text-[#2C3E34]'}`}
        >
          Plan Alimenticio
        </button>
        <button
          onClick={() => setActiveTab('predictive')}
          className={`px-6 py-2 font-semibold transition-colors whitespace-nowrap ${activeTab === 'predictive' ? 'text-[#5A8C7A] border-b-2 border-[#5A8C7A]' : 'text-[#6E7C72] hover:text-[#2C3E34]'}`}
        >
          Mi Progreso
        </button>
      </div>

      {/* Contenido según tab activa */}
      {activeTab === 'initial' && (
        initialEvaluation ? (
          <div className="space-y-6">
            {/* Motivo de consulta */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-6">
              <h3 className="text-lg font-bold text-[#5A8C7A] mb-4">Motivo de Consulta</h3>
              <div className="space-y-3">
                <div><span className="font-semibold text-[#2C3E34]">Objetivo principal:</span> <span className="text-[#6E7C72]">{initialEvaluation.consultation_reason?.main_goal || '—'}</span></div>
                <div><span className="font-semibold text-[#2C3E34]">Desde cuándo:</span> <span className="text-[#6E7C72]">{initialEvaluation.consultation_reason?.onset_date ? formatDate(initialEvaluation.consultation_reason.onset_date) : '—'}</span></div>
                <div><span className="font-semibold text-[#2C3E34]">Expectativas:</span> <span className="text-[#6E7C72]">{initialEvaluation.consultation_reason?.treatment_expectations || '—'}</span></div>
              </div>
            </div>

            {/* Antecedentes Heredofamiliares */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-6">
              <h3 className="text-lg font-bold text-[#5A8C7A] mb-4">Antecedentes Heredofamiliares</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${initialEvaluation.family_history?.diabetes ? 'bg-[#5A8C7A]' : 'bg-[#E6E3DE]'}`}></div>
                  <span className="text-sm">Diabetes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${initialEvaluation.family_history?.hypertension ? 'bg-[#5A8C7A]' : 'bg-[#E6E3DE]'}`}></div>
                  <span className="text-sm">Hipertensión</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${initialEvaluation.family_history?.obesity ? 'bg-[#5A8C7A]' : 'bg-[#E6E3DE]'}`}></div>
                  <span className="text-sm">Obesidad</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${initialEvaluation.family_history?.dyslipidemia ? 'bg-[#5A8C7A]' : 'bg-[#E6E3DE]'}`}></div>
                  <span className="text-sm">Dislipidemia</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${initialEvaluation.family_history?.cardiovascular_disease ? 'bg-[#5A8C7A]' : 'bg-[#E6E3DE]'}`}></div>
                  <span className="text-sm">Enf. Cardiovascular</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${initialEvaluation.family_history?.cancer ? 'bg-[#5A8C7A]' : 'bg-[#E6E3DE]'}`}></div>
                  <span className="text-sm">Cáncer</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${initialEvaluation.family_history?.pcos ? 'bg-[#5A8C7A]' : 'bg-[#E6E3DE]'}`}></div>
                  <span className="text-sm">SOP</span>
                </div>
              </div>
              {initialEvaluation.family_history?.other_conditions && (
                <div className="mt-3"><span className="font-semibold">Otros:</span> <span className="text-[#6E7C72]">{initialEvaluation.family_history.other_conditions}</span></div>
              )}
            </div>

            {/* Antecedentes Personales Patológicos */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-6">
              <h3 className="text-lg font-bold text-[#5A8C7A] mb-4">Antecedentes Personales Patológicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><span className="font-semibold">Enfermedades actuales:</span> <span className="text-[#6E7C72]">{initialEvaluation.personal_history?.current_diseases || '—'}</span></div>
                <div><span className="font-semibold">Enfermedades previas:</span> <span className="text-[#6E7C72]">{initialEvaluation.personal_history?.past_diseases || '—'}</span></div>
                <div><span className="font-semibold">Cirugías:</span> <span className="text-[#6E7C72]">{initialEvaluation.personal_history?.surgeries || '—'}</span></div>
                <div><span className="font-semibold">Medicamentos actuales:</span> <span className="text-[#6E7C72]">{initialEvaluation.personal_history?.current_medications || '—'}</span></div>
                <div><span className="font-semibold">Suplementos:</span> <span className="text-[#6E7C72]">{initialEvaluation.personal_history?.supplements || '—'}</span></div>
                <div><span className="font-semibold">Alergias/intolerancias:</span> <span className="text-[#6E7C72]">{initialEvaluation.personal_history?.allergies_intolerances || '—'}</span></div>
              </div>
            </div>

            {/* Antecedentes No Patológicos */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-6">
              <h3 className="text-lg font-bold text-[#5A8C7A] mb-4">Antecedentes No Patológicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><span className="font-semibold">Actividad física:</span> <span className="text-[#6E7C72]">{initialEvaluation.non_pathological_history?.physical_activity_type || '—'} ({initialEvaluation.non_pathological_history?.physical_activity_frequency || '—'})</span></div>
                <div><span className="font-semibold">Duración:</span> <span className="text-[#6E7C72]">{initialEvaluation.non_pathological_history?.physical_activity_duration || '—'}</span></div>
                <div><span className="font-semibold">Alcohol:</span> <span className="text-[#6E7C72]">{initialEvaluation.non_pathological_history?.alcohol_consumption || '—'}</span></div>
                <div><span className="font-semibold">Tabaquismo:</span> <span className="text-[#6E7C72]">{initialEvaluation.non_pathological_history?.smoking || '—'}</span></div>
                <div><span className="font-semibold">Calidad de sueño:</span> <span className="text-[#6E7C72]">{initialEvaluation.non_pathological_history?.sleep_quality || '—'}</span></div>
                <div><span className="font-semibold">Estrés:</span> <span className="text-[#6E7C72]">{initialEvaluation.non_pathological_history?.stress_level || '—'}</span></div>
                <div><span className="font-semibold">Hidratación:</span> <span className="text-[#6E7C72]">{initialEvaluation.non_pathological_history?.daily_hydration || '—'}</span></div>
              </div>
            </div>

            {/* Historia Ginecológica */}
            {initialEvaluation.gynecological_history && (
              <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-6">
                <h3 className="text-lg font-bold text-[#5A8C7A] mb-4">Historia Ginecológica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><span className="font-semibold">Edad de menarca:</span> <span className="text-[#6E7C72]">{initialEvaluation.gynecological_history.menarche_age || '—'}</span></div>
                  <div><span className="font-semibold">Ciclo menstrual:</span> <span className="text-[#6E7C72]">{initialEvaluation.gynecological_history.menstrual_cycle || '—'}</span></div>
                  <div><span className="font-semibold">Duración del ciclo:</span> <span className="text-[#6E7C72]">{initialEvaluation.gynecological_history.cycle_duration || '—'}</span></div>
                  <div><span className="font-semibold">Síntomas:</span> <span className="text-[#6E7C72]">{initialEvaluation.gynecological_history.symptoms || '—'}</span></div>
                  <div><span className="font-semibold">Embarazos:</span> <span className="text-[#6E7C72]">{initialEvaluation.gynecological_history.pregnancies || '—'}</span></div>
                  <div><span className="font-semibold">Anticonceptivos:</span> <span className="text-[#6E7C72]">{initialEvaluation.gynecological_history.contraceptives_use ? `Sí - ${initialEvaluation.gynecological_history.contraceptives_type || ''}` : 'No'}</span></div>
                </div>
              </div>
            )}

            {/* Evaluación Dietética */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-6">
              <h3 className="text-lg font-bold text-[#5A8C7A] mb-4">Evaluación Dietética</h3>
              
              <h4 className="font-semibold text-[#2C3E34] mb-2">Recordatorio 24 horas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div><span className="font-semibold">Desayuno:</span> <span className="text-[#6E7C72]">{initialEvaluation.dietary_recall?.breakfast || '—'}</span></div>
                <div><span className="font-semibold">Colación AM:</span> <span className="text-[#6E7C72]">{initialEvaluation.dietary_recall?.morning_snack || '—'}</span></div>
                <div><span className="font-semibold">Comida:</span> <span className="text-[#6E7C72]">{initialEvaluation.dietary_recall?.lunch || '—'}</span></div>
                <div><span className="font-semibold">Colación PM:</span> <span className="text-[#6E7C72]">{initialEvaluation.dietary_recall?.afternoon_snack || '—'}</span></div>
                <div><span className="font-semibold">Cena:</span> <span className="text-[#6E7C72]">{initialEvaluation.dietary_recall?.dinner || '—'}</span></div>
                <div><span className="font-semibold">Snacks/bebidas:</span> <span className="text-[#6E7C72]">{initialEvaluation.dietary_recall?.snacks_beverages || '—'}</span></div>
              </div>

              <h4 className="font-semibold text-[#2C3E34] mb-2">Frecuencia de consumo</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div><span className="font-semibold">Frutas:</span> <span className="text-[#6E7C72]">{initialEvaluation.food_frequency?.fruits || '—'}</span></div>
                <div><span className="font-semibold">Verduras:</span> <span className="text-[#6E7C72]">{initialEvaluation.food_frequency?.vegetables || '—'}</span></div>
                <div><span className="font-semibold">Proteínas:</span> <span className="text-[#6E7C72]">{initialEvaluation.food_frequency?.proteins || '—'}</span></div>
                <div><span className="font-semibold">Lácteos:</span> <span className="text-[#6E7C72]">{initialEvaluation.food_frequency?.dairy || '—'}</span></div>
                <div><span className="font-semibold">Cereales:</span> <span className="text-[#6E7C72]">{initialEvaluation.food_frequency?.cereals || '—'}</span></div>
                <div><span className="font-semibold">Ultraprocesados:</span> <span className="text-[#6E7C72]">{initialEvaluation.food_frequency?.ultraprocessed || '—'}</span></div>
                <div><span className="font-semibold">Azúcares:</span> <span className="text-[#6E7C72]">{initialEvaluation.food_frequency?.sugars || '—'}</span></div>
              </div>

              <h4 className="font-semibold text-[#2C3E34] mb-2">Hábitos alimentarios</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><span className="font-semibold">Horarios de comida:</span> <span className="text-[#6E7C72]">{initialEvaluation.feeding_habits?.meal_schedules || '—'}</span></div>
                <div><span className="font-semibold">Ansiedad por comer:</span> <span className="text-[#6E7C72]">{initialEvaluation.feeding_habits?.eating_anxiety || '—'}</span></div>
                <div><span className="font-semibold">Atracones:</span> <span className="text-[#6E7C72]">{initialEvaluation.feeding_habits?.binges || '—'}</span></div>
                <div><span className="font-semibold">Comer emocional:</span> <span className="text-[#6E7C72]">{initialEvaluation.feeding_habits?.emotional_eating || '—'}</span></div>
                <div><span className="font-semibold">Comer fuera de casa:</span> <span className="text-[#6E7C72]">{initialEvaluation.feeding_habits?.eating_out || '—'}</span></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-8 text-center">
            <p className="text-[#6E7C72]">No hay evaluación inicial registrada aún</p>
            <p className="text-sm text-[#6E7C72] mt-2">Tu nutriólogo completará esta información en tu primera consulta</p>
          </div>
        )
      )}

      {activeTab === 'progress' && (
        <PatientProgressView followUpEvaluations={followUpEvaluations} />
      )}

      {activeTab === 'nutrition' && (
        <PatientNutritionPlanViewer nutritionPlan={nutritionPlan} />
      )}

      {activeTab === 'predictive' && (
        <PatientPredictiveModule 
          weightHistory={predictiveData.weightHistory} 
          patient={predictiveData.patient}
        />
      )}
    </div>
  );
}