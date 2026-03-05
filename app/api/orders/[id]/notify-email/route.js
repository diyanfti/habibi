// app/api/orders/[id]/notify/route.js
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

// ── Konfigurasi WhatsApp API (Fonnte) ──────────────────────────────────────
const FONNTE_API_KEY = process.env.FONNTE_API_KEY || ''
const FONNTE_DEVICE_KEY = process.env.FONNTE_DEVICE_KEY || ''
const STORE_OWNER_NUMBER = process.env.STORE_OWNER_NUMBER || '6283852930872' // Nomor toko

// ── Helper: Baca database ──
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { products: [], orders: [], users: [] }
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading DB:', error)
    return { products: [], orders: [], users: [] }
  }
}

// ── Helper: Kirim notifikasi via Fonnte ──
async function sendWhatsAppNotification(phoneNumber, message) {
  // Validasi nomor telepon
  if (!phoneNumber || phoneNumber.trim() === '') {
    console.warn('Nomor telepon kosong, skip notifikasi WA')
    return { success: false, error: 'Nomor telepon kosong' }
  }

  // Format nomor: hapus karakter khusus, pastikan format 62
  let formattedNumber = phoneNumber.replace(/\D/g, '')
  if (formattedNumber.startsWith('0')) {
    formattedNumber = '62' + formattedNumber.slice(1)
  } else if (!formattedNumber.startsWith('62')) {
    formattedNumber = '62' + formattedNumber
  }

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: formattedNumber,
        message: message,
        device: FONNTE_DEVICE_KEY,
        delay: 0
      })
    })

    const data = await response.json()

    if (data.status === true) {
      console.log(`✅ WA notifikasi terkirim ke ${formattedNumber}`)
      return { success: true, message: 'Notifikasi terkirim' }
    } else {
      console.error('❌ Gagal kirim WA:', data.reason)
      return { success: false, error: data.reason }
    }
  } catch (error) {
    console.error('❌ Error kirim WA:', error.message)
    return { success: false, error: error.message }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST - Kirim notifikasi WhatsApp untuk pesanan selesai
// ════════════════════════════════════════════════════════════════════════════
export async function POST(request, { params }) {
  try {
    const { id } = await params
    const db = readDB()
    
    // Cari pesanan berdasarkan ID
    const order = db.orders.find(o => o.id === Number(id))
    
    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    // Validasi status pesanan
    if (order.status !== 'selesai') {
      return NextResponse.json(
        { error: 'Notifikasi hanya bisa dikirim untuk pesanan yang sudah selesai' },
        { status: 400 }
      )
    }

    // Validasi nomor telepon pelanggan
    if (!order.phone || order.phone.trim() === '') {
      return NextResponse.json(
        { error: 'Nomor telepon pelanggan tidak tersimpan' },
        { status: 400 }
      )
    }

    // Format pesan notifikasi
    const itemsText = order.items
      .map(item => `• ${item.name} (${item.qty}x) - Rp ${(item.price * item.qty).toLocaleString('id-ID')}`)
      .join('\n')

    const message = `
🎉 *PESANAN SELESAI* 🎉

Halo ${order.nama}! 👋

Pesanan Anda sudah siap untuk diambil! 

📦 *Detail Pesanan #${order.id}*
${itemsText}

💰 *Total: Rp ${order.total.toLocaleString('id-ID')}*

📍 Lokasi: ${order.lokasi || 'Ambil di toko'}
🚚 Pengiriman: ${order.pengiriman}
💳 Pembayaran: ${order.pembayaran}

${order.catatan ? `📝 Catatan: ${order.catatan}` : ''}

Terimakasih telah memesan di HA BIBI SNACK CORNER! 🙏
Kami tunggu Anda. Di Jamin Nagihh best! 🔥

Hubungi: 083852930872
`.trim()

    // Kirim notifikasi WhatsApp
    const result = await sendWhatsAppNotification(order.phone, message)

    if (result.success) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Notifikasi WhatsApp berhasil dikirim',
          orderId: order.id,
          customerPhone: order.phone
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { 
          error: 'Gagal mengirim notifikasi WhatsApp',
          details: result.error
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('POST /api/orders/[id]/notify error:', error)
    return NextResponse.json(
      { error: 'Gagal mengirim notifikasi', details: error.message },
      { status: 500 }
    )
  }
}