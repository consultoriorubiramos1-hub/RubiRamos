import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { query } from '@/lib/db';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export async function POST(req: Request) {
  const { username } = await req.json();

  const code = randomInt(100000, 999999).toString();
  const now = new Date();
  const expiracion = new Date(now.getTime() + 3 * 60 * 1000);

  try {
    const res = await query(
      'UPDATE tblusers SET code = $1, expiracion = $2 WHERE username = $3 RETURNING email',
      [code, expiracion, username]
    );

    const email = res.rows[0]?.email;

    if (!email) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Código de verificación - Consultorio Nutricional',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Código de verificación</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f7f9; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
            <div style="max-width: 560px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
              
              <!-- Encabezado -->
              <div style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); padding: 32px 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Consultorio Nutricional</h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #e8f5e9;">Tu bienestar, nuestra prioridad</p>
              </div>

              <!-- Cuerpo principal -->
              <div style="padding: 32px 28px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <div style="width: 60px; height: 60px; background-color: #e8f5e9; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                    <span style="font-size: 28px; font-weight: bold; color: #27ae60;">✓</span>
                  </div>
                </div>

                <h2 style="text-align: center; color: #2c3e50; font-size: 22px; font-weight: 600; margin: 0 0 12px 0;">Verificación de acceso</h2>
                
                <p style="color: #5d6d7e; text-align: center; font-size: 15px; line-height: 1.6; margin: 0 0 8px 0;">
                  Hola <strong style="color: #27ae60;">${username}</strong>,
                </p>
                
                <p style="color: #5d6d7e; text-align: center; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
                  Hemos detectado un intento de inicio de sesión en su cuenta. Utilice el siguiente código para completar la verificación:
                </p>

                <!-- Código destacado -->
                <div style="text-align: center; margin: 28px 0;">
                  <div style="background: linear-gradient(135deg, #fef9e7 0%, #fff8e1 100%); border: 2px solid #f39c12; border-radius: 16px; padding: 20px 16px; display: inline-block; min-width: 240px;">
                    <span style="font-family: 'Courier New', monospace; font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #e67e22;">${code}</span>
                  </div>
                </div>

                <!-- Información de expiración -->
                <div style="background-color: #f8f9fa; border-radius: 12px; padding: 16px; margin: 24px 0 0 0;">
                  <table width="100%" style="text-align: center; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 0 12px; width: 50%;">
                        <div style="font-size: 20px; font-weight: 600; color: #e67e22;">03:00</div>
                        <p style="margin: 8px 0 0 0; font-size: 13px; color: #7f8c8d;">Tiempo de expiración</p>
                      </td>
                      <td style="padding: 0 12px; width: 50%; border-left: 1px solid #e9ecef;">
                        <div style="font-size: 20px; font-weight: 600; color: #27ae60;">1 vez</div>
                        <p style="margin: 8px 0 0 0; font-size: 13px; color: #7f8c8d;">Uso único</p>
                      </td>
                    </tr>
                  </table>
                </div>

                <p style="color: #95a5a6; text-align: center; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0;">
                  Este código es confidencial y caduca en 3 minutos. Si no solicitó este código, ignore este mensaje.
                </p>
              </div>

              <!-- Pie de página -->
              <div style="background-color: #f8f9fa; border-top: 1px solid #e9ecef; padding: 20px 28px; text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #95a5a6;">
                  © ${new Date().getFullYear()} Consultorio Nutricional — Todos los derechos reservados
                </p>
                <p style="margin: 0; font-size: 11px; color: #bdc3c7;">
                  Este es un mensaje automático, por favor no responder a este correo.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true, email });
  } catch (err) {
    console.error('Error al enviar código:', err);
    return NextResponse.json({ error: 'No se pudo enviar el código' }, { status: 500 });
  }
}