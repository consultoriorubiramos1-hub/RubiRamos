// Se carga después de validar el token para no tocar la base de datos en peticiones anónimas.
export async function getMobilePatientId(userId: number): Promise<number | null> {
  const { getPatientByUserId } = await import('@/lib/patient-appointments-actions');
  const patient = await getPatientByUserId(userId);
  const patientId = Number(patient?.id);
  return Number.isSafeInteger(patientId) && patientId > 0 ? patientId : null;
}
