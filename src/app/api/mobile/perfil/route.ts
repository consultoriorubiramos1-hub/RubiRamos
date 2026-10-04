import { z } from 'zod';
import { authenticateMobile } from '@/lib/mobile-auth';
import { calendarDate, mobileError, mobileSuccess } from '@/lib/mobile-api';
import { getMobilePatientId } from '@/lib/mobile-patient';

export const dynamic = 'force-dynamic';

const optionalText = (limit: number) => z.string().trim().max(limit).nullable();
const profileSchema = z.object({
  first_name: z.string().trim().min(1).max(100).optional(),
  second_name: optionalText(100).optional(),
  first_lastname: z.string().trim().min(1).max(100).optional(),
  second_lastname: optionalText(100).optional(),
  age: z.number().int().min(0).max(120).optional(),
  gender: optionalText(30).optional(),
  phone: optionalText(30).optional(),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  estado_civil: optionalText(50).optional(),
  ocupacion: optionalText(100).optional(),
  username: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().max(254).optional(),
}).strict().refine(value => Object.keys(value).length > 0);

const personalFields = new Set([
  'first_name', 'second_name', 'first_lastname', 'second_lastname', 'age',
  'gender', 'phone', 'fecha_nacimiento', 'estado_civil', 'ocupacion',
]);

function publicProfile(profile: NonNullable<Awaited<ReturnType<typeof import('@/lib/patient-profile-actions').getPatientProfile>>>) {
  return {
    username: profile.username,
    email: profile.email,
    first_name: profile.first_name,
    second_name: profile.second_name,
    first_lastname: profile.first_lastname,
    second_lastname: profile.second_lastname,
    nombre_completo: profile.nombre_completo,
    age: profile.age,
    gender: profile.gender,
    phone: profile.phone,
    fecha_nacimiento: profile.fecha_nacimiento,
    estado_civil: profile.estado_civil,
    ocupacion: profile.ocupacion,
  };
}

export async function GET(request: Request) {
  const auth = await authenticateMobile(request);
  if (!auth.ok) return auth.response;
  try {
    const patientId = await getMobilePatientId(auth.userId);
    if (!patientId) return mobileError(404, 'Paciente no encontrado.');
    const { getPatientProfile } = await import('@/lib/patient-profile-actions');
    const profile = await getPatientProfile(auth.userId);
    return profile && Number(profile.patient_id) === patientId
      ? mobileSuccess(publicProfile(profile))
      : mobileError(404, 'Perfil no encontrado.');
  } catch (error) {
    console.error('Error en perfil móvil:', error);
    return mobileError(500, 'No se pudo obtener el perfil.');
  }
}

export async function PATCH(request: Request) {
  const auth = await authenticateMobile(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return mobileError(400, 'El cuerpo debe ser JSON válido.');
  }
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return mobileError(400, 'El perfil contiene campos no permitidos o inválidos.');
  const changes = parsed.data;
  const birthDate = changes.fecha_nacimiento === undefined || changes.fecha_nacimiento === null
    ? null
    : calendarDate(changes.fecha_nacimiento);
  if (changes.fecha_nacimiento && !birthDate) return mobileError(400, 'Fecha de nacimiento inválida.');

  try {
    const patientId = await getMobilePatientId(auth.userId);
    if (!patientId) return mobileError(404, 'Paciente no encontrado.');
    const { getPatientProfile, updatePatientProfile, updateUserProfile } = await import('@/lib/patient-profile-actions');
    const profile = await getPatientProfile(auth.userId);
    if (!profile || Number(profile.patient_id) !== patientId) return mobileError(404, 'Perfil no encontrado.');

    if (Object.keys(changes).some(key => personalFields.has(key))) {
      await updatePatientProfile(patientId, {
        first_name: changes.first_name ?? profile.first_name,
        second_name: changes.second_name === undefined ? profile.second_name : changes.second_name,
        first_lastname: changes.first_lastname ?? profile.first_lastname,
        second_lastname: changes.second_lastname === undefined ? profile.second_lastname : changes.second_lastname,
        age: changes.age ?? Number(profile.age),
        gender: changes.gender === undefined ? profile.gender : changes.gender,
        phone: changes.phone === undefined ? profile.phone : changes.phone,
        fecha_nacimiento: changes.fecha_nacimiento === undefined
          ? (profile.fecha_nacimiento ? new Date(profile.fecha_nacimiento) : null)
          : birthDate,
        estado_civil: changes.estado_civil === undefined ? profile.estado_civil : changes.estado_civil,
        ocupacion: changes.ocupacion === undefined ? profile.ocupacion : changes.ocupacion,
      });
    }
    if (changes.username !== undefined || changes.email !== undefined) {
      await updateUserProfile(auth.userId, {
        username: changes.username,
        email: changes.email,
      });
    }

    const updated = await getPatientProfile(auth.userId);
    return updated ? mobileSuccess(publicProfile(updated)) : mobileError(404, 'Perfil no encontrado.');
  } catch (error) {
    console.error('Error al actualizar perfil móvil:', error);
    const message = error instanceof Error ? error.message : '';
    if (message.includes('ya está en uso') || message.includes('ya está registrado')) {
      return mobileError(400, message);
    }
    return mobileError(500, 'No se pudo actualizar el perfil.');
  }
}
