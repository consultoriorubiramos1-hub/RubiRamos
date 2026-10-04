import { authenticateMobile } from '@/lib/mobile-auth';
import { appointmentTime, calendarDate, isPastClinicDate, mobileError, mobileSuccess } from '@/lib/mobile-api';
import { getMobilePatientId } from '@/lib/mobile-patient';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await authenticateMobile(request);
  if (!auth.ok) return auth.response;
  try {
    const patientId = await getMobilePatientId(auth.userId);
    if (!patientId) return mobileError(404, 'Paciente no encontrado.');
    const { getPatientUpcomingAppointments } = await import('@/lib/patient-appointments-actions');
    return mobileSuccess(await getPatientUpcomingAppointments(patientId));
  } catch (error) {
    console.error('Error al consultar citas móviles:', error);
    return mobileError(500, 'No se pudieron consultar las citas.');
  }
}

export async function POST(request: Request) {
  const auth = await authenticateMobile(request);
  if (!auth.ok) return auth.response;
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data')) {
    return mobileError(400, 'Se requiere multipart/form-data.');
  }

  let received: FormData;
  try {
    received = await request.formData();
  } catch {
    return mobileError(400, 'Formulario inválido.');
  }
  const dateValue = received.get('appointmentDate');
  const timeValue = received.get('startTime');
  const notesValue = received.get('notes');
  const receipt = received.get('receipt');
  const appointmentDate = typeof dateValue === 'string' ? calendarDate(dateValue) : null;
  const startTime = typeof timeValue === 'string' ? appointmentTime(timeValue) : null;
  if (!appointmentDate || typeof dateValue !== 'string' || isPastClinicDate(dateValue) || !startTime) {
    return mobileError(400, 'Fecha u horario inválidos.');
  }
  if (notesValue !== null && (typeof notesValue !== 'string' || notesValue.length > 500)) {
    return mobileError(400, 'Las notas no pueden superar 500 caracteres.');
  }
  if (!(receipt instanceof File) || receipt.size === 0) {
    return mobileError(400, 'Debes adjuntar el comprobante del anticipo.');
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(receipt.type) || receipt.size > 5 * 1024 * 1024) {
    return mobileError(400, 'El comprobante debe ser JPG, PNG o WEBP y no superar 5 MB.');
  }

  try {
    const patientId = await getMobilePatientId(auth.userId);
    if (!patientId) return mobileError(404, 'Paciente no encontrado.');
    const { getAvailableSlotsForPatient, createPatientAppointment } = await import('@/lib/patient-appointments-actions');
    const slots = await getAvailableSlotsForPatient(appointmentDate, patientId);
    if (!slots.includes(startTime)) return mobileError(400, 'El horario no está disponible.');

    // Se reconstruye el formulario; cualquier patientId enviado por el cliente se descarta.
    const form = new FormData();
    form.set('patientId', String(patientId));
    form.set('appointmentDate', dateValue);
    form.set('startTime', startTime);
    form.set('notes', notesValue ?? '');
    form.set('receipt', receipt);
    const result = await createPatientAppointment(form);
    if (!result.success) {
      if (result.message.toLowerCase().includes('horario')) {
        return mobileError(400, 'El horario no está disponible.');
      }
      return mobileError(500, 'No se pudo crear la cita.');
    }
    return mobileSuccess({
      appointmentId: result.appointmentId,
      paymentReference: result.paymentReference,
      depositAmount: result.depositAmount,
      message: result.message,
    }, 201);
  } catch (error) {
    console.error('Error al crear cita móvil:', error);
    return mobileError(500, 'No se pudo crear la cita.');
  }
}
