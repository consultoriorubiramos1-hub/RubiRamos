import { decode, encode } from 'next-auth/jwt';
import { query } from '@/lib/db';
import { mobileError } from '@/lib/mobile-api';

export interface MobileUser {
  id: string;
  username: string;
  email: string;
  rol_id: 2;
}

type MobileAuthResult =
  | { ok: true; userId: number; user: MobileUser }
  | { ok: false; response: ReturnType<typeof mobileError> };

export async function issueMobileToken(user: MobileUser): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET no configurado');
  return encode({
    secret,
    maxAge: 30 * 24 * 60 * 60,
    token: { id: user.id, username: user.username, email: user.email, rol_id: user.rol_id },
  });
}

export async function authenticateMobile(request: Request): Promise<MobileAuthResult> {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match || match[1].length > 8192) {
    return { ok: false, response: mobileError(401, 'Token de acceso requerido.') };
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return { ok: false, response: mobileError(500, 'Autenticación no disponible.') };
  }

  let token;
  try {
    token = await decode({ token: match[1], secret });
  } catch {
    token = null;
  }

  const id = token?.id;
  const userId = typeof id === 'string' && /^[1-9]\d*$/.test(id) ? Number(id) : NaN;
  if (!token || !Number.isSafeInteger(userId) || typeof token.username !== 'string' || typeof token.email !== 'string') {
    return { ok: false, response: mobileError(401, 'Token de acceso inválido.') };
  }
  if (token.rol_id !== 2) {
    return { ok: false, response: mobileError(403, 'Acceso exclusivo para pacientes.') };
  }

  try {
    const result = await query(
      'SELECT id, username, email, rol_id, active FROM tblusers WHERE id = $1',
      [userId],
    );
    const account = result.rows[0];
    if (!account || account.active !== true) {
      return { ok: false, response: mobileError(401, 'La cuenta ya no está disponible.') };
    }
    if (Number(account.rol_id) !== 2) {
      return { ok: false, response: mobileError(403, 'Acceso exclusivo para pacientes.') };
    }

    return {
      ok: true,
      userId,
      user: {
        id: String(account.id),
        username: String(account.username),
        email: String(account.email),
        rol_id: 2,
      },
    };
  } catch (error) {
    console.error('Error al validar acceso móvil:', error);
    return { ok: false, response: mobileError(500, 'No se pudo validar la sesión.') };
  }
}
