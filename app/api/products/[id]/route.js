// app/api/products/[id]/route.js
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

// PUT - Update produk
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const db = readDB()
    const index = db.products.findIndex(p => p.id === Number(id))
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update produk
    db.products[index] = {
      ...db.products[index],
      name: body.name || db.products[index].name,
      price: body.price !== undefined ? Number(body.price) : db.products[index].price,
      unit: body.unit !== undefined ? body.unit : db.products[index].unit,
      desc: body.desc !== undefined ? body.desc : db.products[index].desc,
      inStock: body.inStock !== undefined ? body.inStock : db.products[index].inStock,
      imgBase64: body.imgBase64 !== undefined ? body.imgBase64 : db.products[index].imgBase64,
      updatedAt: new Date().toISOString()
    }

    if (!writeDB(db)) {
      throw new Error('Gagal menyimpan perubahan')
    }

    return NextResponse.json(db.products[index])
  } catch (error) {
    console.error('PUT /api/products/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui produk' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus produk
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    
    const db = readDB()
    const index = db.products.findIndex(p => p.id === Number(id))
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    db.products.splice(index, 1)
    
    if (!writeDB(db)) {
      throw new Error('Gagal menghapus produk')
    }

    return NextResponse.json({ message: 'Produk berhasil dihapus' })
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus produk' },
      { status: 500 }
    )
  }
}