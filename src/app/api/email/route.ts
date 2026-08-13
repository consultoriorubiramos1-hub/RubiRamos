import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

export async function POST(req: Request) {
  const { to, subject, text, html } = await req.json()

  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
      html: html || text
    }

    const info = await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Email enviado correctamente'
    })
  } catch (error) {
    console.error('Error enviando email:', error)
    return NextResponse.json({
      error: 'Error al enviar el email',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 