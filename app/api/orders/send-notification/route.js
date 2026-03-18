// app/api/orders/send-notification/route.js
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { verifyToken } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

// ════════════════════════════════════════════════════════
// KONFIGURASI NODEMAILER
// ════════════════════════════════════════════════════════
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

// ════════════════════════════════════════════════════════
// KONFIGURASI TOKO (Edit di sini)
// ════════════════════════════════════════════════════════
const STORE_CONFIG = {
  name: 'HA BIBI SNACK CORNER',
  phone: '628385293087', // Format Indonesia: 62 (code negara) + 8385293087 (nomor tanpa 0)
  phoneDisplay: '+62 838-5293-087', // Untuk display di email
  email: 'info@habibi.com',
  whatsappMessage: 'Halo, saya ingin bertanya tentang pesanan saya', // Pesan default WA
  website: process.env.NEXT_PUBLIC_APP_URL || 'https://habibi.com'
}

// Helper untuk membaca database
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { products: [], orders: [], users: [], sembako: [] }
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading DB:', error)
    return { products: [], orders: [], users: [], sembako: [] }
  }
}

// ════════════════════════════════════════════════════════
// HELPER: Generate WhatsApp URL untuk Indonesia
// ════════════════════════════════════════════════════════
function generateWhatsAppUrl(phoneNumber, message = '') {
  // Format WhatsApp URL: https://wa.me/628385293087?text=pesan
  // phoneNumber sudah dalam format: 628385293087 (62 + nomor tanpa 0)
  const encodedMessage = encodeURIComponent(message || STORE_CONFIG.whatsappMessage)
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`
}

// ════════════════════════════════════════════════════════
// POST - Kirim email notifikasi pesanan selesai
// ════════════════════════════════════════════════════════
export async function POST(request) {
  try {
    // Verifikasi token admin
    const token = request.headers.get('authorization')?.split(' ')[1]
    const user = await verifyToken(token)

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin token diperlukan' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId, customerEmail, customerName, orderTotal } = body

    // ─── VALIDASI INPUT ───
    if (!orderId || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'orderId, customerEmail, dan customerName diperlukan' },
        { status: 400 }
      )
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // ─── AMBIL DATA PESANAN DARI DB ───
    const db = readDB()
    const order = db.orders.find(o => o.id === parseInt(orderId))

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan di database' },
        { status: 404 }
      )
    }

    // ─── FORMAT ITEM PESANAN ───
    const itemsHTML = order.items
      .map(item => {
        const itemTotal = (item.subtotal || 0)
        return `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 10px; text-align: left;">
            <strong>${item.name}</strong><br>
            <span style="font-size: 12px; color: #666;">Rp ${Number(item.price || 0).toLocaleString('id-ID')} × ${item.qty}</span>
          </td>
          <td style="padding: 10px; text-align: center; font-weight: 700; color: #333;">${item.qty}</td>
          <td style="padding: 10px; text-align: right; font-weight: 700; color: #D4AF37;">Rp ${itemTotal.toLocaleString('id-ID')}</td>
        </tr>
      `
      })
      .join('')

    // ─── HITUNG TOTAL ───
    const totalAmount = orderTotal || order.total || 0
    const itemSubtotal = order.items.reduce((sum, item) => sum + (item.subtotal || 0), 0)

    // ─── GENERATE LINKS ───
    const whatsappUrl = generateWhatsAppUrl(STORE_CONFIG.phone, `Halo, saya ingin bertanya tentang pesanan #${order.id}`)
    const websiteUrl = STORE_CONFIG.website

    // ─── EMAIL TEMPLATE ───
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Poppins', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          
          <!-- HEADER -->
          <div style="background: linear-gradient(135deg, #D4AF37, #B8956A); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800;">🎉 PESANAN SELESAI!</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">${STORE_CONFIG.name}</p>
          </div>

          <!-- CONTENT -->
          <div style="padding: 30px; color: #333;">
            <p style="font-size: 16px; margin: 0 0 20px 0;">
              Halo <strong>${customerName}</strong>,
            </p>

            <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 20px 0;">
              Pesanan Anda telah selesai disiapkan! 🍡 Anda bisa mengambilnya di ${STORE_CONFIG.name} segera. Terima kasih telah mempercayai kami!
            </p>

            <!-- ORDER DETAILS -->
            <div style="background-color: #f9f9f9; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 10px 0; font-weight: 700; color: #333;">📦 Detail Pesanan</p>
              <p style="margin: 5px 0; font-size: 13px; color: #666;">
                <strong>Order ID:</strong> #${order.id}
              </p>
              <p style="margin: 5px 0; font-size: 13px; color: #666;">
                <strong>Tanggal Pesan:</strong> ${new Date(order.createdAt).toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <!-- ITEMS TABLE -->
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background-color: #f0f0f0; border-bottom: 2px solid #D4AF37;">
                  <th style="padding: 12px; text-align: left; font-weight: 700; font-size: 13px; color: #333;">Produk</th>
                  <th style="padding: 12px; text-align: center; font-weight: 700; font-size: 13px; color: #333;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-weight: 700; font-size: 13px; color: #333;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
                <tr style="background-color: #f9f9f9; border-top: 2px solid #D4AF37; font-weight: 700;">
                  <td colspan="2" style="padding: 12px; text-align: right; color: #333;">TOTAL PESANAN:</td>
                  <td style="padding: 12px; text-align: right; color: #D4AF37; font-size: 16px;">Rp ${totalAmount.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>

            <!-- CTA BUTTONS -->
            <div style="display: flex; gap: 10px; margin: 30px 0; flex-direction: column;">
              <a href="${websiteUrl}" style="display: block; text-align: center; padding: 14px 28px; background: linear-gradient(135deg, #D4AF37, #B8956A); color: white; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; transition: opacity 0.3s;">
                🏪 Kunjungi Toko Kami
              </a>
              <a href="${whatsappUrl}" style="display: block; text-align: center; padding: 14px 28px; background: linear-gradient(135deg, #25D366, #128C7E); color: white; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; transition: opacity 0.3s;">
                💬 Chat via WhatsApp
              </a>
            </div>

            <p style="font-size: 12px; color: #999; text-align: center; margin: 20px 0;">
              Terima kasih telah memilih ${STORE_CONFIG.name}! 🙏
            </p>

            <!-- CONTACT INFO -->
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
              <p style="margin: 0; font-weight: 700; color: #333; margin-bottom: 10px;">📞 Hubungi Kami</p>
              <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                <a href="${whatsappUrl}" style="display: inline-flex; align-items: center; gap: 5px; color: #25D366; text-decoration: none; font-weight: 600; font-size: 13px;">
                  📱 WhatsApp: ${STORE_CONFIG.phoneDisplay}
                </a>
                <span style="color: #ccc;">•</span>
                <a href="mailto:${STORE_CONFIG.email}" style="display: inline-flex; align-items: center; gap: 5px; color: #D4AF37; text-decoration: none; font-weight: 600; font-size: 13px;">
                  📧 Email: ${STORE_CONFIG.email}
                </a>
              </div>
            </div>
          </div>

          <!-- FOOTER -->
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0; font-size: 11px; color: #999;">
              © 2024 ${STORE_CONFIG.name}. Semua hak dilindungi.
            </p>
            <p style="margin: 8px 0 0 0; font-size: 10px; color: #bbb;">
              Email ini dikirim otomatis. Jangan balas email ini.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    // ─── KIRIM EMAIL ───
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@habibi.com',
      to: customerEmail,
      subject: `🎉 Pesanan #${order.id} Selesai - ${STORE_CONFIG.name}`,
      html: htmlTemplate
    }

    console.log(`📧 Mengirim email ke ${customerEmail}...`)
    const info = await transporter.sendMail(mailOptions)

    console.log(`✅ Email berhasil dikirim ke ${customerEmail}`)
    console.log(`📨 Message ID: ${info.messageId}`)

    return NextResponse.json(
      {
        success: true,
        message: `Email notifikasi berhasil dikirim ke ${customerEmail}`,
        messageId: info.messageId,
        orderId: parseInt(orderId)
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ POST /api/orders/send-notification error:', error)
    return NextResponse.json(
      {
        error: 'Gagal mengirim email notifikasi',
        details: error.message
      },
      { status: 500 }
    )
  }
}