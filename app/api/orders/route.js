// app/api/orders/route.js (FILE BARU - LETAKKAN DI FOLDER orders/)
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const dir = path.dirname(DB_PATH)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      const initialData = { products: [], orders: [], users: [] }
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2))
      return initialData
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading DB:', error)
    return { products: [], orders: [], users: [] }
  }
}

function writeDB(data) {
  try {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('Error writing DB:', error)
    return false
  }
}

// ════════════════════════════════════════════════════════
// GET - Ambil semua pesanan (memerlukan token di header)
// ════════════════════════════════════════════════════════
export async function GET(request) {
  try {
    // Cek header authorization
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Token diperlukan' },
        { status: 401 }
      )
    }

    // Baca dan kembalikan data pesanan
    const db = readDB()
    return NextResponse.json(db.orders || [], { status: 200 })
  } catch (error) {
    console.error('GET /api/orders error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil pesanan', details: error.message },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════
// POST - Tambah pesanan baru (public, tidak perlu auth)
// ════════════════════════════════════════════════════════
export async function POST(request) {
  try {
    const body = await request.json()

    // Validasi data
    if (!body.nama || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Data pesanan tidak lengkap. Harus ada nama dan items.' },
        { status: 400 }
      )
    }

    const db = readDB()

    // Generate ID baru
    const newId = db.orders.length > 0
      ? Math.max(...db.orders.map(o => o.id || 0)) + 1
      : 1

    // Buat objek pesanan baru
    const newOrder = {
      id: newId,
      nama: body.nama,
      email: body.email || '',
      pengiriman: body.pengiriman || '',
      pembayaran: body.pembayaran || '',
      lokasi: body.lokasi || '',
      catatan: body.catatan || '',
      items: body.items,
      total: body.total || 0,
      status: body.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Simpan ke database
    db.orders.push(newOrder)

    if (!writeDB(db)) {
      throw new Error('Gagal menyimpan pesanan ke database')
    }

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error('POST /api/orders error:', error)
    return NextResponse.json(
      { error: 'Gagal membuat pesanan', details: error.message },
      { status: 500 }
    )
  }
}