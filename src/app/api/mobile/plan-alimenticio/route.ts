import { authenticateMobile } from '@/lib/mobile-auth';
import { mobileError, mobileSuccess } from '@/lib/mobile-api';
import { getMobilePatientId } from '@/lib/mobile-patient';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await authenticateMobile(request);
  if (!auth.ok) return auth.response;
  try {
    const patientId = await getMobilePatientId(auth.userId);
    if (!patientId) return mobileError(404, 'Paciente no encontrado.');
    const { getActiveNutritionPlan } = await import('@/lib/nutrition-plans-actions');
    return mobileSuccess(await getActiveNutritionPlan(patientId));
  } catch (error) {
    console.error('Error al consultar plan móvil:', error);
    return mobileError(500, 'No se pudo consultar el plan alimenticio.');
  }
}
