import { authenticateMobile } from '@/lib/mobile-auth';
import { calendarDate, isPastClinicDate, mobileError, mobileSuccess } from '@/lib/mobile-api';
import { getMobilePatientId } from '@/lib/mobile-patient';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await authenticateMobile(request);
  if (!auth.ok) return auth.response;

  const dateValue = new URL(request.url).searchParams.get('date');
  const date = dateValue ? calendarDate(dateValue) : null;
  if (!date || !dateValue || isPastClinicDate(dateValue)) {
    return mobileError(400, 'La fecha debe tener formato YYYY-MM-DD y no estar en el pasado.');
  }

  try {
    const patientId = await getMobilePatientId(auth.userId);
    if (!patientId) return mobileError(404, 'Paciente no encontrado.');
    const { getAvailableSlotsForPatient } = await import('@/lib/patient-appointments-actions');
    return mobileSuccess(await getAvailableSlotsForPatient(date, patientId));
  } catch (error) {
    console.error('Error al consultar disponibilidad móvil:', error);
    return mobileError(500, 'No se pudo consultar la disponibilidad.');
  }
}
