// app/api/auth/me/route.js
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')
const JWT_SECRET = process.env.JWT_SECRET || 'habibi-snack-secret-key-2024'

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

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verifikasi token
    const decoded = jwt.verify(token, JWT_SECRET)
    
    const db = readDB()
    const user = db.users.find(u => u.id === decoded.id)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    // Jangan kirim password ke client
    const { password, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('GET /api/auth/me error:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      )
    }
    
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Token sudah kadaluarsa' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}