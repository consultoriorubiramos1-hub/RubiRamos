import { authenticateMobile } from '@/lib/mobile-auth';
import { mobileError, mobileSuccess } from '@/lib/mobile-api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await authenticateMobile(request);
  if (!auth.ok) return auth.response;
  try {
    const { getPatientByUserId, getPatientInitialEvaluation, getPatientFollowUpEvaluations } = await import('@/lib/patient-medical-history-actions');
    const patient = await getPatientByUserId(auth.userId);
    if (!patient) return mobileError(404, 'Paciente no encontrado.');
    const [initialEvaluation, followUpEvaluations] = await Promise.all([
      getPatientInitialEvaluation(patient.id),
      getPatientFollowUpEvaluations(patient.id),
    ]);
    return mobileSuccess({ patient, initialEvaluation, followUpEvaluations });
  } catch (error) {
    console.error('Error al consultar historial móvil:', error);
    return mobileError(500, 'No se pudo consultar el historial.');
  }
}
