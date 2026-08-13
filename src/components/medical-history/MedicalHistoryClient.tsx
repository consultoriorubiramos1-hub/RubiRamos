'use client';

import { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useSearchParams } from 'next/navigation';
import { searchPatientsForHistory, getPatientInitialEvaluation, getPatientFollowUpEvaluations } from '@/lib/medical-history-actions';
import { getGeneralRecommendations } from '@/lib/recomendation-pdf-actions';
import NutritionPlan from './NutritionPlan';
import PredictiveModule from './PredictiveModule';
import RecommendationsModal from '@/components/recommendations/RecommendationsModal';
import ClinicalEvaluationModal from '@/components/citas/ClinicalEvaluationModal';
import AdminMedicalHistoryPDF from './AdminMedicalHistoryPDF';
import { toast } from 'react-hot-toast';

interface MedicalHistoryClientProps {
  initialPatients?: any[];
  preselectedPatient?: any;
}

export default function MedicalHistoryClient({ initialPatients = [], preselectedPatient = null }: MedicalHistoryClientProps) {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState(initialPatients);
  const [selectedPatient, setSelectedPatient] = useState<any>(preselectedPatient);
  const [initialEvaluation, setInitialEvaluation] = useState<any>(null);
  const [followUpEvaluations, setFollowUpEvaluations] = useState<any[]>([]);
  const [nutritionPlan, setNutritionPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showInitialEvaluation, setShowInitialEvaluation] = useState(false);
  const [showNutritionPlan, setShowNutritionPlan] = useState(false);
  const [showPredictiveModule, setShowPredictiveModule] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [generalRecommendations, setGeneralRecommendations] = useState<any[]>([]);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // Estados para modales de edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [editingEvaluationType, setEditingEvaluationType] = useState<'initial' | 'followup'>('followup');
  const [editingInitialEvaluation, setEditingInitialEvaluation] = useState(false);

  // Cargar datos del paciente preseleccionado
  useEffect(() => {
    if (preselectedPatient) {
      loadPatientData(preselectedPatient);
    }
  }, [preselectedPatient]);

  const loadPatientData = async (patient: any) => {
    setSelectedPatient(patient);
    setLoading(true);
    try {
      const [initial, followUps, plan, recommendations] = await Promise.all([
        getPatientInitialEvaluation(patient.id),
        getPatientFollowUpEvaluations(patient.id),
        import('@/lib/nutrition-plans-actions').then(m => m.getActiveNutritionPlan(patient.id)),
        getGeneralRecommendations()
      ]);
      setInitialEvaluation(initial);
      setFollowUpEvaluations(followUps);
      setNutritionPlan(plan);
      setGeneralRecommendations(recommendations);
      setShowInitialEvaluation(true);
      setShowNutritionPlan(false);
      setShowPredictiveModule(false);
    } catch (error) {
      toast.error('Error al cargar el historial del paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.length < 2) {
      toast.error('Ingresa al menos 2 caracteres para buscar');
      return;
    }
    
    setLoading(true);
    try {
      const results = await searchPatientsForHistory(searchTerm);
      setPatients(results);
      if (results.length === 0) {
        toast.success('No se encontraron pacientes');
      }
    } catch (error) {
      toast.error('Error al buscar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patient: any) => {
    await loadPatientData(patient);
  };

  const handleEditFollowUp = (evaluation: any) => {
    const appointmentForModal = {
      id: evaluation.appointment_id,
      patient: {
        id: selectedPatient?.id,
        nombre_completo: selectedPatient?.nombre_completo,
        email: selectedPatient?.email,
        age: selectedPatient?.age,
        gender: selectedPatient?.gender,
        phone: selectedPatient?.phone,
        fecha_nacimiento: selectedPatient?.fecha_nacimiento,
        estado_civil: selectedPatient?.estado_civil,
        ocupacion: selectedPatient?.ocupacion
      },
      has_evaluation: true,
      evaluation_type: 'followup'
    };
    
    setEditingAppointment(appointmentForModal);
    setEditingEvaluationType('followup');
    setEditModalOpen(true);
  };

  const handleEditInitialEvaluation = () => {
    const appointmentForModal = {
      id: null,
      patient: {
        id: selectedPatient?.id,
        nombre_completo: selectedPatient?.nombre_completo,
        email: selectedPatient?.email,
        age: selectedPatient?.age,
        gender: selectedPatient?.gender,
        phone: selectedPatient?.phone,
        fecha_nacimiento: selectedPatient?.fecha_nacimiento,
        estado_civil: selectedPatient?.estado_civil,
        ocupacion: selectedPatient?.ocupacion
      },
      has_evaluation: !!initialEvaluation,
      evaluation_type: 'initial'
    };
    
    setEditingAppointment(appointmentForModal);
    setEditingInitialEvaluation(true);
  };

  const handleEditModalSuccess = async () => {
    if (selectedPatient) {
      setLoading(true);
      try {
        const [initial, followUps, plan] = await Promise.all([
          getPatientInitialEvaluation(selectedPatient.id),
          getPatientFollowUpEvaluations(selectedPatient.id),
          import('@/lib/nutrition-plans-actions').then(m => m.getActiveNutritionPlan(selectedPatient.id))
        ]);
        setInitialEvaluation(initial);
        setFollowUpEvaluations(followUps);
        setNutritionPlan(plan);
        toast.success('Datos actualizados correctamente');
      } catch (error) {
        toast.error('Error al recargar los datos');
      } finally {
        setLoading(false);
      }
    }
    setEditModalOpen(false);
    setEditingInitialEvaluation(false);
    setEditingAppointment(null);
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

  const fileName = selectedPatient ? `${sanitizeFileName(selectedPatient.nombre_completo)}_Historial_Medico.pdf` : 'historial_medico.pdf';

  return (
    <div className="min-h-screen bg-[#FAF9F7] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Título y botones */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#5A8C7A]">Historial Médico</h1>
            <p className="text-sm text-[#6E7C72] mt-1">Consulta el historial completo de evaluaciones de los pacientes</p>
          </div>
          <div className="flex gap-3">
            {selectedPatient && (
              <PDFDownloadLink
                document={
                  <AdminMedicalHistoryPDF
                    patient={selectedPatient}
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
                    className="px-4 py-2 bg-[#5A8C7A] text-white rounded-lg hover:bg-[#4A7C6A] transition-colors text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {loading || generatingPDF ? 'Preparando PDF...' : 'Descargar PDF'}
                  </button>
                )}
              </PDFDownloadLink>
            )}
            <button
              onClick={() => setShowRecommendations(true)}
              className="px-4 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] transition-colors text-sm font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Recomendaciones
            </button>
          </div>
        </div>

        {/* Resto del código igual... */}
        {/* Buscador de pacientes */}
        {!selectedPatient && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-4 mb-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-[#2C3E34] mb-2">Buscar paciente</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Nombre, apellido, email o usuario..."
                    className="w-full pl-10 pr-4 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-[#6E7C72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] transition-colors font-semibold disabled:opacity-50"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {patients.length > 0 && (
              <div className="mt-4 border-t border-[#E6E3DE] pt-4">
                <label className="block text-sm font-semibold text-[#2C3E34] mb-2">Resultados encontrados:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {patients.map(patient => (
                    <div
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className="p-3 border border-[#E6E3DE] rounded-lg cursor-pointer hover:bg-[#FAF9F7] transition-colors"
                    >
                      <div className="font-medium text-[#2C3E34]">{patient.nombre_completo}</div>
                      <div className="text-sm text-[#6E7C72]">{patient.email}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información del paciente seleccionado */}
        {selectedPatient && (
          <>
            {/* Tarjeta de información del paciente */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-[#5A8C7A]">{selectedPatient.nombre_completo}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    <div><span className="font-semibold text-[#2C3E34]">Email:</span> <span className="text-[#6E7C72]">{selectedPatient.email}</span></div>
                    <div><span className="font-semibold text-[#2C3E34]">Teléfono:</span> <span className="text-[#6E7C72]">{selectedPatient.phone || '—'}</span></div>
                    <div><span className="font-semibold text-[#2C3E34]">Edad:</span> <span className="text-[#6E7C72]">{selectedPatient.age} años</span></div>
                    <div><span className="font-semibold text-[#2C3E34]">Género:</span> <span className="text-[#6E7C72]">{getGenderText(selectedPatient.gender)}</span></div>
                    {selectedPatient.fecha_nacimiento && (
                      <div><span className="font-semibold text-[#2C3E34]">Fecha nacimiento:</span> <span className="text-[#6E7C72]">{formatDate(selectedPatient.fecha_nacimiento)}</span></div>
                    )}
                    {selectedPatient.estado_civil && (
                      <div><span className="font-semibold text-[#2C3E34]">Estado civil:</span> <span className="text-[#6E7C72]">{selectedPatient.estado_civil}</span></div>
                    )}
                    {selectedPatient.ocupacion && (
                      <div><span className="font-semibold text-[#2C3E34]">Ocupación:</span> <span className="text-[#6E7C72]">{selectedPatient.ocupacion}</span></div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    setInitialEvaluation(null);
                    setFollowUpEvaluations([]);
                    setNutritionPlan(null);
                    setPatients([]);
                    setSearchTerm('');
                  }}
                  className="text-[#6E7C72] hover:text-[#2C3E34]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

           {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[#E6E3DE] overflow-x-auto">
              <button
                onClick={() => {
                  setShowInitialEvaluation(true);
                  setShowNutritionPlan(false);
                  setShowPredictiveModule(false);
                }}
                className={`px-6 py-2 font-semibold transition-colors whitespace-nowrap ${
                  showInitialEvaluation &&
                  !showNutritionPlan &&
                  !showPredictiveModule
                    ? 'text-[#5A8C7A] border-b-2 border-[#5A8C7A]'
                    : 'text-[#6E7C72] hover:text-[#2C3E34]'
                }`}
              >
                Evaluación Inicial
              </button>

              <button
                onClick={() => {
                  setShowInitialEvaluation(false);
                  setShowNutritionPlan(false);
                  setShowPredictiveModule(false);
                }}
                className={`px-6 py-2 font-semibold transition-colors whitespace-nowrap ${
                  !showInitialEvaluation &&
                  !showNutritionPlan &&
                  !showPredictiveModule
                    ? 'text-[#5A8C7A] border-b-2 border-[#5A8C7A]'
                    : 'text-[#6E7C72] hover:text-[#2C3E34]'
                }`}
              >
                Progreso ({followUpEvaluations.length} registros)
              </button>

              <button
                onClick={() => {
                  setShowInitialEvaluation(false);
                  setShowNutritionPlan(false);
                  setShowPredictiveModule(true);
                }}
                className={`px-6 py-2 font-semibold transition-colors whitespace-nowrap ${
                  showPredictiveModule
                    ? 'text-[#5A8C7A] border-b-2 border-[#5A8C7A]'
                    : 'text-[#6E7C72] hover:text-[#2C3E34]'
                }`}
              >
                Próximo control
              </button>

              <button
                onClick={() => {
                  setShowInitialEvaluation(false);
                  setShowNutritionPlan(true);
                  setShowPredictiveModule(false);
                }}
                className={`px-6 py-2 font-semibold transition-colors whitespace-nowrap ${
                  showNutritionPlan
                    ? 'text-[#5A8C7A] border-b-2 border-[#5A8C7A]'
                    : 'text-[#6E7C72] hover:text-[#2C3E34]'
                }`}
              >
                Plan Alimenticio
              </button>
            </div>

            {/* Contenido según la pestaña seleccionada */}
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-8 text-center">
                <p className="text-[#6E7C72]">Cargando información...</p>
              </div>
            ) : showInitialEvaluation ? (
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
                      <div className="flex items-center gap-2"><input type="checkbox" checked={initialEvaluation.family_history?.diabetes} readOnly className="rounded text-[#5A8C7A]" /><span>Diabetes</span></div>
                      <div className="flex items-center gap-2"><input type="checkbox" checked={initialEvaluation.family_history?.hypertension} readOnly className="rounded text-[#5A8C7A]" /><span>Hipertensión</span></div>
                      <div className="flex items-center gap-2"><input type="checkbox" checked={initialEvaluation.family_history?.obesity} readOnly className="rounded text-[#5A8C7A]" /><span>Obesidad</span></div>
                      <div className="flex items-center gap-2"><input type="checkbox" checked={initialEvaluation.family_history?.dyslipidemia} readOnly className="rounded text-[#5A8C7A]" /><span>Dislipidemia</span></div>
                      <div className="flex items-center gap-2"><input type="checkbox" checked={initialEvaluation.family_history?.cardiovascular_disease} readOnly className="rounded text-[#5A8C7A]" /><span>Enf. Cardiovascular</span></div>
                      <div className="flex items-center gap-2"><input type="checkbox" checked={initialEvaluation.family_history?.cancer} readOnly className="rounded text-[#5A8C7A]" /><span>Cáncer</span></div>
                      <div className="flex items-center gap-2"><input type="checkbox" checked={initialEvaluation.family_history?.pcos} readOnly className="rounded text-[#5A8C7A]" /><span>SOP</span></div>
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

                  <div className="flex justify-end">
                    <button
                      onClick={handleEditInitialEvaluation}
                      className="px-4 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] transition-colors text-sm font-semibold"
                    >
                      Editar Evaluación Inicial
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-8 text-center">
                  <p className="text-[#6E7C72]">No hay evaluación inicial registrada para este paciente</p>
                  <button
                    onClick={handleEditInitialEvaluation}
                    className="mt-4 px-4 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] transition-colors text-sm font-semibold"
                  >
                    Crear Evaluación Inicial
                  </button>
                </div>
              )
            ) : showNutritionPlan ? (
              <NutritionPlan 
                patientId={selectedPatient.id} 
                onRefresh={() => {}}
              />
            ) : showPredictiveModule ? (
              <PredictiveModule patientId={selectedPatient.id} />
            ) : (
              followUpEvaluations.length > 0 ? (
                <div className="space-y-8">
                  {/* Tabla de Resultados */}
                  <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
                    <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
                      <h3 className="text-lg font-bold text-[#5A8C7A]">Resultados</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-[#E6E3DE]">
                        <thead className="bg-[#FAF9F7]">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">FECHA</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">PESO</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">%GRASA</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">GRASA VISCERAL%</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">AGUA TOTAL%</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">MUSCULO%</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">CINTURA</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">PIERNA</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">CADERA</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">GLUTEO</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">BRAZO</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">CUELLO</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">P.B</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">P.A</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">T/A</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-[#E6E3DE]">
                          {followUpEvaluations.map((evalution) => (
                            <tr key={evalution.id} className="hover:bg-[#FAF9F7]">
                              <td className="px-3 py-2 text-xs text-[#2C3E34] whitespace-nowrap">{formatDate(evalution.evaluation_date)}</td>
                              <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evalution.anthropometric?.weight)}</td>
                              <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evalution.anthropometric?.body_fat_percentage)}</td>
                              <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evalution.anthropometric?.visceral_fat_percentage)}</td>
                              <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evalution.anthropometric?.total_water_percentage)}</td>
                              <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evalution.anthropometric?.muscle_percentage)}</td>
                              <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evalution.anthropometric?.waist_circumference)}</td>
                              <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evalution.anthropometric?.leg_circumference)}</td>
                              <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evalution.anthropometric?.hip_circumference)}</td>
                              <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evalution.anthropometric?.gluteus_circumference)}</td>
                              <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evalution.anthropometric?.arm_circumference)}</td>
                              <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evalution.anthropometric?.neck_circumference)}</td>
                              <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evalution.anthropometric?.biceps_skinfold_mm)}</td>
                              <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evalution.anthropometric?.triceps_skinfold_mm)}</td>
                              <td className="px-3 py-2 text-xs text-[#2C3E34]">{evalution.anthropometric?.blood_pressure_systolic ? `${evalution.anthropometric.blood_pressure_systolic}/${evalution.anthropometric.blood_pressure_diastolic || '—'}` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tabla de Medidas por Extremidad */}
                  <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
                    <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
                      <h3 className="text-lg font-bold text-[#5A8C7A]">Medidas por Extremidad</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-[#E6E3DE]">
                        <thead className="bg-[#FAF9F7]">
                          <tr>
                            <th rowSpan={2} className="px-4 py-2 text-left text-xs font-semibold text-[#6E7C72] border-r border-[#E6E3DE]">Fecha</th>
                            <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-[#6E7C72] border-r border-[#E6E3DE]">Brazo Derecho</th>
                            <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-[#6E7C72] border-r border-[#E6E3DE]">Brazo Izquierdo</th>
                            <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-[#6E7C72] border-r border-[#E6E3DE]">Pierna Derecha</th>
                            <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-[#6E7C72] border-r border-[#E6E3DE]">Pierna Izquierda</th>
                            <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-[#6E7C72]">Torso</th>
                          </tr>
                          <tr className="bg-[#FAF9F7]">
                            <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Grasa</th>
                            <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Músculo</th>
                            <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Grasa</th>
                            <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Músculo</th>
                            <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Grasa</th>
                            <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Músculo</th>
                            <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Grasa</th>
                            <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Músculo</th>
                            <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Grasa</th>
                            <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72]">Músculo</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-[#E6E3DE]">
                          {followUpEvaluations.map((evalution) => (
                            <tr key={evalution.id} className="hover:bg-[#FAF9F7]">
                              <td className="px-4 py-2 text-xs text-[#2C3E34] whitespace-nowrap border-r border-[#E6E3DE]">{formatDate(evalution.evaluation_date)}</td>
                              <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evalution.anthropometric?.right_arm_fat)}</td>
                              <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evalution.anthropometric?.right_arm_muscle)}</td>
                              <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evalution.anthropometric?.left_arm_fat)}</td>
                              <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evalution.anthropometric?.left_arm_muscle)}</td>
                              <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evalution.anthropometric?.right_leg_fat)}</td>
                              <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evalution.anthropometric?.right_leg_muscle)}</td>
                              <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evalution.anthropometric?.left_leg_fat)}</td>
                              <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evalution.anthropometric?.left_leg_muscle)}</td>
                              <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evalution.anthropometric?.torso_fat)}</td>
                              <td className="px-3 py-2 text-center text-xs text-[#2C3E34]">{formatNumber(evalution.anthropometric?.torso_muscle)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Detalle de cada evaluación */}
                  <div className="space-y-6">
                    {followUpEvaluations.map((evaluation) => (
                      <div key={evaluation.id} className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
                        <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE] flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-bold text-[#5A8C7A]">Evaluación del {formatDate(evaluation.evaluation_date)} {evaluation.start_time ? `- ${evaluation.start_time.slice(0,5)}` : ''}</h3>
                            {evaluation.status && (
                              <p className="text-xs text-[#6E7C72] mt-1">Estado: {evaluation.status === 'completed' ? 'Completada' : 'Programada'}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleEditFollowUp(evaluation)}
                            className="px-3 py-1 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] transition-colors text-xs font-semibold"
                          >
                            Editar cita
                          </button>
                        </div>
                        <div className="p-6 space-y-4">
                          {evaluation.biochemical_params && (evaluation.biochemical_params.glucose !== null || evaluation.biochemical_params.insulin !== null || 
                            evaluation.biochemical_params.total_cholesterol !== null || evaluation.biochemical_params.triglycerides !== null) && (
                            <div>
                              <h4 className="font-semibold text-[#2C3E34] mb-2">Parámetros Bioquímicos</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                {evaluation.biochemical_params.glucose !== null && evaluation.biochemical_params.glucose !== undefined && <div><span className="font-medium">Glucosa:</span> {evaluation.biochemical_params.glucose}</div>}
                                {evaluation.biochemical_params.insulin !== null && evaluation.biochemical_params.insulin !== undefined && <div><span className="font-medium">Insulina:</span> {evaluation.biochemical_params.insulin}</div>}
                                {evaluation.biochemical_params.homa_ir !== null && evaluation.biochemical_params.homa_ir !== undefined && <div><span className="font-medium">HOMA-IR:</span> {evaluation.biochemical_params.homa_ir}</div>}
                                {evaluation.biochemical_params.total_cholesterol !== null && evaluation.biochemical_params.total_cholesterol !== undefined && <div><span className="font-medium">Colesterol Total:</span> {evaluation.biochemical_params.total_cholesterol}</div>}
                                {evaluation.biochemical_params.triglycerides !== null && evaluation.biochemical_params.triglycerides !== undefined && <div><span className="font-medium">Triglicéridos:</span> {evaluation.biochemical_params.triglycerides}</div>}
                                {evaluation.biochemical_params.hdl_cholesterol !== null && evaluation.biochemical_params.hdl_cholesterol !== undefined && <div><span className="font-medium">HDL:</span> {evaluation.biochemical_params.hdl_cholesterol}</div>}
                                {evaluation.biochemical_params.ldl_cholesterol !== null && evaluation.biochemical_params.ldl_cholesterol !== undefined && <div><span className="font-medium">LDL:</span> {evaluation.biochemical_params.ldl_cholesterol}</div>}
                                {evaluation.biochemical_params.tsh !== null && evaluation.biochemical_params.tsh !== undefined && <div><span className="font-medium">TSH:</span> {evaluation.biochemical_params.tsh}</div>}
                                {evaluation.biochemical_params.vitamin_d !== null && evaluation.biochemical_params.vitamin_d !== undefined && <div><span className="font-medium">Vitamina D:</span> {evaluation.biochemical_params.vitamin_d}</div>}
                              </div>
                              {evaluation.biochemical_params.other_params && (
                                <div className="mt-2"><span className="font-medium">Otros:</span> {evaluation.biochemical_params.other_params}</div>
                              )}
                            </div>
                          )}

                          {evaluation.nutritional_diagnosis?.diagnosis && (
                            <div>
                              <h4 className="font-semibold text-[#2C3E34] mb-2">Diagnóstico Nutricional</h4>
                              <p className="text-sm text-[#6E7C72] bg-[#FAF9F7] p-3 rounded-lg">{evaluation.nutritional_diagnosis.diagnosis}</p>
                            </div>
                          )}

                          {evaluation.intervention_plan && (evaluation.intervention_plan.nutritional_goals || evaluation.intervention_plan.dietary_strategy || 
                            evaluation.intervention_plan.specific_recommendations || evaluation.intervention_plan.supplementation) && (
                            <div>
                              <h4 className="font-semibold text-[#2C3E34] mb-2">Plan de Intervención</h4>
                              <div className="space-y-2 text-sm">
                                {evaluation.intervention_plan.nutritional_goals && <div><span className="font-medium">Objetivos:</span> {evaluation.intervention_plan.nutritional_goals}</div>}
                                {evaluation.intervention_plan.dietary_strategy && <div><span className="font-medium">Estrategia:</span> {evaluation.intervention_plan.dietary_strategy}</div>}
                                {evaluation.intervention_plan.specific_recommendations && <div><span className="font-medium">Recomendaciones:</span> {evaluation.intervention_plan.specific_recommendations}</div>}
                                {evaluation.intervention_plan.supplementation && <div><span className="font-medium">Suplementación:</span> {evaluation.intervention_plan.supplementation}</div>}
                              </div>
                            </div>
                          )}

                          {evaluation.follow_up && (evaluation.follow_up.next_appointment_date || evaluation.follow_up.indicators_to_evaluate || evaluation.follow_up.observations) && (
                            <div>
                              <h4 className="font-semibold text-[#2C3E34] mb-2">Seguimiento</h4>
                              <div className="space-y-1 text-sm">
                                {evaluation.follow_up.next_appointment_date && <div><span className="font-medium">Próxima cita:</span> {formatDate(evaluation.follow_up.next_appointment_date)}</div>}
                                {evaluation.follow_up.indicators_to_evaluate && <div><span className="font-medium">Indicadores:</span> {evaluation.follow_up.indicators_to_evaluate}</div>}
                                {evaluation.follow_up.observations && <div><span className="font-medium">Observaciones:</span> {evaluation.follow_up.observations}</div>}
                              </div>
                            </div>
                          )}

                          {!evaluation.nutritional_diagnosis?.diagnosis && 
                          !(evaluation.intervention_plan && (evaluation.intervention_plan.nutritional_goals || evaluation.intervention_plan.dietary_strategy)) && 
                          !(evaluation.follow_up && (evaluation.follow_up.next_appointment_date || evaluation.follow_up.observations)) && (
                            <p className="text-sm text-[#6E7C72] text-center py-4">No hay información adicional registrada para esta evaluación</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-8 text-center">
                  <p className="text-[#6E7C72]">No hay registros de progreso para este paciente</p>
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Modal de Recomendaciones */}
      <RecommendationsModal
        isOpen={showRecommendations}
        onClose={() => setShowRecommendations(false)}
        onSave={() => {}}
      />

      {/* Modal para editar cita de progreso */}
      <ClinicalEvaluationModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingAppointment(null);
        }}
        appointment={editingAppointment}
        evaluationType={editingEvaluationType}
        onSuccess={handleEditModalSuccess}
      />

      {/* Modal para editar evaluación inicial */}
      <ClinicalEvaluationModal
        isOpen={editingInitialEvaluation}
        onClose={() => {
          setEditingInitialEvaluation(false);
          setEditingAppointment(null);
        }}
        appointment={editingAppointment}
        evaluationType="initial"
        onSuccess={handleEditModalSuccess}
      />
    </div>
  );
}