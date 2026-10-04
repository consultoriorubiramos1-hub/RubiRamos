import { z } from 'zod';
import { authenticateCredentials } from '@/lib/user-auth';
import { issueMobileToken, type MobileUser } from '@/lib/mobile-auth';
import { mobileError, mobileSuccess } from '@/lib/mobile-api';

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(1024),
}).strict();

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return mobileError(400, 'El cuerpo debe ser JSON válido.');
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return mobileError(400, 'Usuario o contraseña inválidos.');
  if (!process.env.NEXTAUTH_SECRET) return mobileError(500, 'Autenticación no disponible.');

  try {
    const account = await authenticateCredentials(parsed.data.username, parsed.data.password);
    if (!account) return mobileError(401, 'Credenciales incorrectas.');
    if (account.rol_id !== 2) return mobileError(403, 'Acceso exclusivo para pacientes.');

    const user: MobileUser = {
      id: account.id,
      username: account.username,
      email: account.email,
      rol_id: 2,
    };
    const token = await issueMobileToken(user);
    return mobileSuccess({ token, user });
  } catch (error) {
    console.error('Error al iniciar sesión móvil:', error);
    return mobileError(500, 'No se pudo iniciar sesión.');
  }
}
