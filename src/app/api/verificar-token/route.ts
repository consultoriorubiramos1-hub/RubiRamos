import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  const { username, token } = await req.json();

  if (!username || !token) {
    return NextResponse.json({ valid: false, error: 'Faltan datos' }, { status: 400 });
  }

  try {
    const res = await query(
      'SELECT recovery_token, recovery_exp FROM tblusers WHERE username = $1',
      [username]
    );

    const data = res.rows[0];
    if (!data) return NextResponse.json({ valid: false, error: 'Usuario no encontrado' }, { status: 404 });

    const ahora = new Date();
    const expira = new Date(data.recovery_exp);
    
    if (data.recovery_token !== token || ahora > expira) {
      return NextResponse.json({ valid: false, error: 'Token inválido o expirado' }, { status: 403 });
    }

    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error('Error al verificar token:', err);
    return NextResponse.json({ valid: false, error: 'Error del servidor' }, { status: 500 });
  }
}