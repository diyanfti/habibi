import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Konfigurasi Nodemailer (gunakan Gmail atau email service lain)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
})

export async function POST(request) {
  try {
    const body = await request.json()
    const { to, subject, message } = body

    // Validasi input
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Email, subject, dan message diperlukan' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Email tidak valid' },
        { status: 400 }
      )
    }

    // Kirim email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@habibi.com',
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #a78bfa, #f472b6); padding: 20px; border-radius: 10px; text-align: center; color: white;">
            <h1 style="margin: 0;">🎉 HA BIBI SNACK CORNER</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9; border-radius: 10px; margin-top: 20px;">
            <p style="font-size: 16px; color: #333;">${message}</p>
            <hr style="border: none; border-top: 2px solid #e0e0e0; margin: 20px 0;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              Terima kasih telah berbelanja di HA BIBI SNACK CORNER! 🙏<br>
              Jika ada pertanyaan, silakan hubungi kami di WhatsApp.
            </p>
          </div>
        </div>
      `
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('Email terkirim:', info.messageId)

    return NextResponse.json(
      { success: true, message: 'Email berhasil dikirim', messageId: info.messageId },
      { status: 200 }
    )
  } catch (error) {
    console.error('POST /api/send-email error:', error)
    return NextResponse.json(
      { error: 'Gagal mengirim email', details: error.message },
      { status: 500 }
    )
  }
}