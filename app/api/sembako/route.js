// app/api/sembako/route.js
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

// Helper untuk baca database
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const dir = path.dirname(DB_PATH)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      const initialData = { products: [], sembako: [], orders: [], users: [] }
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2))
      return initialData
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('❌ Error reading DB:', error)
    return { products: [], sembako: [], orders: [], users: [] }
  }
}

// Helper untuk tulis database
function writeDB(data) {
  try {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('❌ Error writing DB:', error)
    return false
  }
}

// GET - Ambil semua sembako
export async function GET() {
  try {
    const db = readDB()
    console.log(`✅ GET /api/sembako - Retrieved ${db.sembako?.length || 0} items`)
    return NextResponse.json(db.sembako || [])
  } catch (error) {
    console.error('❌ GET /api/sembako error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data sembako', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Tambah sembako baru
export async function POST(request) {
  try {
    const body = await request.json()
    
    console.log('📥 POST /api/sembako - Body:', body)
    
    // Validasi data wajib
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Nama produk wajib diisi!' },
        { status: 400 }
      )
    }

    // Validasi variants
    if (!body.variants || !Array.isArray(body.variants) || body.variants.length === 0) {
      return NextResponse.json(
        { error: 'Minimal 1 varian ukuran wajib diisi!' },
        { status: 400 }
      )
    }

    if (body.variants.some(v => !v.size || !v.price)) {
      return NextResponse.json(
        { error: 'Semua varian harus memiliki ukuran dan harga!' },
        { status: 400 }
      )
    }

    const db = readDB()
    
    // Cek duplikasi nama (case-insensitive)
    const duplicate = db.sembako?.find(s => 
      s.name.toLowerCase() === body.name.trim().toLowerCase()
    )
    
    if (duplicate) {
      console.warn(`⚠️ Duplicate sembako name: ${body.name}`)
      return NextResponse.json(
        { error: `Produk "${body.name}" sudah ada di database` },
        { status: 409 }
      )
    }

    // Generate ID baru
    const newId = (db.sembako?.length || 0) > 0 
      ? Math.max(...db.sembako.map(p => p.id || 0)) + 1 
      : 1

    // Buat sembako baru dengan variants
    const newSembako = {
      id: newId,
      name: body.name.trim(),
      variants: body.variants.map(v => ({
        size: v.size.trim(),
        price: Number(v.price) || 0
      })),
      desc: body.desc?.trim() || '',
      inStock: body.inStock === true || body.inStock === 'true',
      imgBase64: body.imgBase64 || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Inisialisasi array sembako jika belum ada
    if (!Array.isArray(db.sembako)) {
      db.sembako = []
    }

    db.sembako.push(newSembako)
    
    if (!writeDB(db)) {
      throw new Error('Gagal menyimpan ke database')
    }

    console.log(`✅ Sembako baru ditambahkan: ${newSembako.name}`)
    return NextResponse.json(newSembako, { status: 201 })
  } catch (error) {
    console.error('❌ POST /api/sembako error:', error)
    return NextResponse.json(
      { error: 'Gagal menambahkan sembako', details: error.message },
      { status: 500 }
    )
  }
}