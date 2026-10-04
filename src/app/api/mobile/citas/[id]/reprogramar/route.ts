import { z } from 'zod';
import { authenticateMobile } from '@/lib/mobile-auth';
import { appointmentTime, calendarDate, isPastClinicDate, mobileError, mobileSuccess, positiveId } from '@/lib/mobile-api';
import { getMobilePatientId } from '@/lib/mobile-patient';

const rescheduleSchema = z.object({
  date: z.string(),
  startTime: z.string(),
}).strict();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticateMobile(request);
  if (!auth.ok) return auth.response;
  const appointmentId = positiveId((await context.params).id);
  if (!appointmentId) return mobileError(400, 'Identificador de cita inválido.');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return mobileError(400, 'El cuerpo debe ser JSON válido.');
  }
  const parsed = rescheduleSchema.safeParse(body);
  if (!parsed.success) return mobileError(400, 'Fecha u horario inválidos.');
  const date = calendarDate(parsed.data.date);
  const startTime = appointmentTime(parsed.data.startTime);
  if (!date || isPastClinicDate(parsed.data.date) || !startTime) {
    return mobileError(400, 'Fecha u horario inválidos.');
  }

  try {
    const patientId = await getMobilePatientId(auth.userId);
    if (!patientId) return mobileError(404, 'Paciente no encontrado.');
    const { getPatientUpcomingAppointments, getAvailableSlotsForPatient, rescheduleAppointment } = await import('@/lib/patient-appointments-actions');
    const appointments = await getPatientUpcomingAppointments(patientId);
    if (!appointments.some(appointment => appointment.id === appointmentId)) {
      return mobileError(404, 'Cita no encontrada.');
    }
    const slots = await getAvailableSlotsForPatient(date, patientId);
    if (!slots.includes(startTime)) return mobileError(400, 'El horario no está disponible.');
    await rescheduleAppointment(appointmentId, patientId, date, startTime);
    return mobileSuccess({ rescheduled: true, date: parsed.data.date, startTime: parsed.data.startTime });
  } catch (error) {
    console.error('Error al reprogramar cita móvil:', error);
    return mobileError(500, 'No se pudo reprogramar la cita.');
  }
}
