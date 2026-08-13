import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { username, code } = await req.json();

  try {
    const res = await query(
      'SELECT code, expiracion FROM tblusers WHERE username = $1',
      [username]
    );

    if (!res.rows.length) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { code: codigoGuardado, expiracion } = res.rows[0];

    const ahora = new Date();
    const expira = new Date(expiracion);

    if (codigoGuardado !== code) {
      return NextResponse.json({
        success: false,
        error: 'El código ingresado es incorrecto',
        tipo: 'codigo'
      }, { status: 400 });
    }

    if (ahora > expira) {
      return NextResponse.json({
        success: false,
        error: 'El código ha expirado, por favor solicita uno nuevo',
        tipo: 'expirado'
      }, { status: 400 });
    }

    // Generar token de recuperación y guardar en BD
    const token = crypto.randomUUID();
    const vencimiento = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await query(
      'UPDATE tblusers SET recovery_token = $1, recovery_exp = $2, verified = true WHERE username = $3',
      [token, vencimiento, username]
    );

    // Enviar token en la respuesta
    return NextResponse.json({ success: true, token });
  } catch (err) {
    console.error('Error al verificar código:', err);
    return NextResponse.json({
      success: false,
      error: 'Error del servidor'
    }, { status: 500 });
  }
}
