// /api/cambiar-contrasena.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  const { username, token, nuevaContrasena } = await req.json();

  if (!username || !token || !nuevaContrasena) {
    return NextResponse.json({ success: false, error: 'Faltan datos requeridos' }, { status: 400 });
  }

  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{8,}$/;
  if (!regex.test(nuevaContrasena)) {
    return NextResponse.json({ success: false, error: 'Contraseña no cumple requisitos' }, { status: 400 });
  }

  try {
    // Verificamos token y expiración
    const res = await query(
      'SELECT recovery_token, recovery_exp FROM tblusers WHERE username = $1',
      [username]
    );

    const data = res.rows[0];
    if (!data) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const ahora = new Date();
    const expira = new Date(data.recovery_exp);

    if (data.recovery_token !== token || ahora > expira) {
      return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 403 });
    }

    // Cambiamos la contraseña
    const hash = await bcrypt.hash(nuevaContrasena, 10);
    await query(
      `UPDATE tblusers
       SET password_hash = $1, recovery_token = NULL, recovery_exp = NULL
       WHERE username = $2`,
      [hash, username]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}