// app/api/products/route.js
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
    console.error('Error writing DB:', error)
    return false
  }
}

// GET - Ambil semua produk
export async function GET() {
  try {
    const db = readDB()
    return NextResponse.json(db.products || [])
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil produk' },
      { status: 500 }
    )
  }
}

// POST - Tambah produk baru
export async function POST(request) {
  try {
    const body = await request.json()
    
    // Validasi data
    if (!body.name || !body.price) {
      return NextResponse.json(
        { error: 'Nama dan harga produk wajib diisi' },
        { status: 400 }
      )
    }

    const db = readDB()
    
    // Generate ID baru
    const newId = db.products.length > 0 
      ? Math.max(...db.products.map(p => p.id || 0)) + 1 
      : 1

    // Buat produk baru
    const newProduct = {
      id: newId,
      name: body.name,
      price: Number(body.price) || 0,
      unit: body.unit || '',
      desc: body.desc || '',
      inStock: body.inStock !== false,
      imgBase64: body.imgBase64 || '',
      createdAt: new Date().toISOString()
    }

    db.products.push(newProduct)
    
    if (!writeDB(db)) {
      throw new Error('Gagal menyimpan ke database')
    }

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error('POST /api/products error:', error)
    return NextResponse.json(
      { error: 'Gagal menambahkan produk' },
      { status: 500 }
    )
  }
}