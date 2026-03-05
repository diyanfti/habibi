// app/api/users/route.js
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

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

// GET - Ambil semua pengguna
export async function GET() {
  try {
    const db = readDB()
    // Jangan kirim password ke client
    const users = (db.users || []).map(u => {
      const { password, ...userWithoutPassword } = u
      return userWithoutPassword
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil pengguna' },
      { status: 500 }
    )
  }
}

// POST - Tambah pengguna baru
export async function POST(request) {
  try {
    const body = await request.json()
    
    if (!body.nama) {
      return NextResponse.json(
        { error: 'Nama wajib diisi' },
        { status: 400 }
      )
    }

    const db = readDB()
    
    // Cek email duplikat
    if (body.email && db.users.some(u => u.email === body.email)) {
      return NextResponse.json(
        { error: 'Email sudah digunakan' },
        { status: 400 }
      )
    }
    
    const newId = db.users.length > 0 
      ? Math.max(...db.users.map(u => u.id || 0)) + 1 
      : 1

    // Hash password jika ada
    let hashedPassword = ''
    if (body.password) {
      hashedPassword = await bcrypt.hash(body.password, 10)
    }

    const newUser = {
      id: newId,
      nama: body.nama,
      role: body.role || 'pelanggan',
      email: body.email || '',
      telp: body.telp || '',
      password: hashedPassword,
      createdAt: new Date().toISOString()
    }

    db.users.push(newUser)
    
    if (!writeDB(db)) {
      throw new Error('Gagal menyimpan pengguna')
    }

    // Jangan kirim password ke client
    const { password, ...userWithoutPassword } = newUser
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('POST /api/users error:', error)
    return NextResponse.json(
      { error: 'Gagal menambahkan pengguna' },
      { status: 500 }
    )
  }
}