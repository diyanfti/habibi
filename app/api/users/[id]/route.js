// app/api/users/[id]/route.js
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

// PUT - Update pengguna
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const db = readDB()
    const index = db.users.findIndex(u => u.id === Number(id))
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    // Cek email duplikat (kecuali email sendiri)
    if (body.email && body.email !== db.users[index].email) {
      if (db.users.some(u => u.email === body.email)) {
        return NextResponse.json(
          { error: 'Email sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Update data
    const updatedUser = {
      ...db.users[index],
      nama: body.nama || db.users[index].nama,
      role: body.role || db.users[index].role,
      email: body.email !== undefined ? body.email : db.users[index].email,
      telp: body.telp !== undefined ? body.telp : db.users[index].telp,
      updatedAt: new Date().toISOString()
    }

    // Update password jika diisi
    if (body.password) {
      updatedUser.password = await bcrypt.hash(body.password, 10)
    }

    db.users[index] = updatedUser
    
    if (!writeDB(db)) {
      throw new Error('Gagal menyimpan perubahan')
    }

    // Jangan kirim password ke client
    const { password, ...userWithoutPassword } = updatedUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('PUT /api/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui pengguna' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus pengguna
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    
    const db = readDB()
    const index = db.users.findIndex(u => u.id === Number(id))
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    db.users.splice(index, 1)
    
    if (!writeDB(db)) {
      throw new Error('Gagal menghapus pengguna')
    }

    return NextResponse.json({ message: 'Pengguna berhasil dihapus' })
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus pengguna' },
      { status: 500 }
    )
  }
}