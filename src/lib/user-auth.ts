import bcrypt from 'bcrypt';
import { query } from '@/lib/db';
import type { Usuario, UsuarioAuth } from '@/lib/definitions';

// La web y la API móvil verifican las mismas credenciales y el mismo estado de cuenta.
export async function authenticateCredentials(username: string, password: string): Promise<UsuarioAuth | null> {
  if (!username || !password) return null;

  const result = await query(
    `SELECT id, username, email, password_hash, rol_id, verified, active
     FROM tblusers
     WHERE username = $1 AND active = true`,
    [username],
  );
  const user = result.rows[0] as Usuario | undefined;
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return null;

  return {
    id: String(user.id),
    username: user.username,
    email: user.email,
    verified: user.verified,
    active: user.active,
    rol_id: user.rol_id,
  };
}
