import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authConfig } from '@/lib/auth.config';
import { getPatientByUserId, getPatientInitialEvaluation, getPatientFollowUpEvaluations, getPatientActiveNutritionPlan, getPatientPredictiveData } from '@/lib/patient-medical-history-actions';
import PatientMedicalHistoryClient from '@/components/patient-medical-history/PatientMedicalHistoryClient';

export const dynamic = 'force-dynamic';

export default async function PatientMedicalHistoryPage() {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    redirect('/login');
  }

  // Verificar que sea paciente
  if (session.user.rol_id !== 2) {
    redirect('/dashboard');
  }

  const userId = parseInt(session.user.id);
  const patient = await getPatientByUserId(userId);

  if (!patient) {
    redirect('/dashboard');
  }

  // Cargar todos los datos del paciente
  const [initialEvaluation, followUpEvaluations, nutritionPlan, predictiveData] = await Promise.all([
    getPatientInitialEvaluation(patient.id),
    getPatientFollowUpEvaluations(patient.id),
    getPatientActiveNutritionPlan(patient.id),
    getPatientPredictiveData(patient.id)
  ]);

  return (
    <div className="min-h-screen bg-[#FAF9F7] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<div className="text-center py-8 text-[#6E7C72]">Cargando historial médico...</div>}>
          <PatientMedicalHistoryClient
            patient={patient}
            initialEvaluation={initialEvaluation}
            followUpEvaluations={followUpEvaluations}
            nutritionPlan={nutritionPlan}
            predictiveData={predictiveData}
          />
        </Suspense>
      </div>
    </div>
  );
}