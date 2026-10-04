import { authenticateMobile } from '@/lib/mobile-auth';
import { mobileError, mobileSuccess, positiveId } from '@/lib/mobile-api';
import { getMobilePatientId } from '@/lib/mobile-patient';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticateMobile(request);
  if (!auth.ok) return auth.response;
  const appointmentId = positiveId((await context.params).id);
  if (!appointmentId) return mobileError(400, 'Identificador de cita inválido.');

  try {
    const patientId = await getMobilePatientId(auth.userId);
    if (!patientId) return mobileError(404, 'Paciente no encontrado.');
    const { getPatientUpcomingAppointments, cancelAppointment } = await import('@/lib/patient-appointments-actions');
    const appointments = await getPatientUpcomingAppointments(patientId);
    if (!appointments.some(appointment => appointment.id === appointmentId)) {
      return mobileError(404, 'Cita no encontrada.');
    }
    await cancelAppointment(appointmentId, patientId);
    return mobileSuccess({ cancelled: true });
  } catch (error) {
    console.error('Error al cancelar cita móvil:', error);
    return mobileError(500, 'No se pudo cancelar la cita.');
  }
}
