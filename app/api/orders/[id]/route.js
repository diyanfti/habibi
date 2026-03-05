// app/api/orders/[id]/route.js
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { verifyToken } from '@/lib/auth'

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

// GET - Ambil detail pesanan
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const db = readDB()
    const order = db.orders.find(o => o.id === parseInt(id))

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(order, { status: 200 })
  } catch (error) {
    console.error('GET /api/orders/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil pesanan', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update status pesanan
export async function PUT(request, { params }) {
  try {
    // Verifikasi token
    const token = request.headers.get('authorization')?.split(' ')[1]
    const user = await verifyToken(token)

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin token diperlukan' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const db = readDB()
    const orderIndex = db.orders.findIndex(o => o.id === parseInt(id))

    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update status
    db.orders[orderIndex].status = status
    db.orders[orderIndex].updatedAt = new Date().toISOString()

    if (!writeDB(db)) {
      throw new Error('Gagal menyimpan perubahan ke database')
    }

    return NextResponse.json(
      { success: true, message: 'Status pesanan diubah', order: db.orders[orderIndex] },
      { status: 200 }
    )
  } catch (error) {
    console.error('PUT /api/orders/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal mengubah status', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Hapus pesanan
export async function DELETE(request, { params }) {
  try {
    // Verifikasi token
    const token = request.headers.get('authorization')?.split(' ')[1]
    const user = await verifyToken(token)

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin token diperlukan' },
        { status: 401 }
      )
    }

    const { id } = await params
    const db = readDB()
    const orderIndex = db.orders.findIndex(o => o.id === parseInt(id))

    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    // Hapus pesanan
    const deletedOrder = db.orders.splice(orderIndex, 1)

    if (!writeDB(db)) {
      throw new Error('Gagal menyimpan perubahan ke database')
    }

    return NextResponse.json(
      { success: true, message: 'Pesanan dihapus', order: deletedOrder[0] },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /api/orders/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus pesanan', details: error.message },
      { status: 500 }
    )
  }
}