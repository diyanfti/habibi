// app/api/products/[id]/route.js - FIXED VERSION (Apply same fix if exists)
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

// GET - Detail product
export async function GET(request, { params }) {
  try {
    // ✅ FIX: Await params untuk Next.js 13+
    const { id } = await Promise.resolve(params)
    
    console.log(`📥 GET /api/products/${id}`)
    
    if (!id) {
      console.warn(`⚠️ ID tidak diterima`)
      return NextResponse.json(
        { error: 'ID produk wajib diisi' },
        { status: 400 }
      )
    }

    const db = readDB()
    const product = db.products?.find(p => p.id === Number(id))
    
    if (!product) {
      console.warn(`⚠️ Product not found: ${id}`)
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    console.log(`✅ GET /api/products/${id} - Retrieved: ${product.name}`)
    return NextResponse.json(product)
  } catch (error) {
    console.error('❌ GET /api/products/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil detail produk', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update product
export async function PUT(request, { params }) {
  try {
    // ✅ FIX: Await params untuk Next.js 13+
    const { id } = await Promise.resolve(params)
    const body = await request.json()
    
    console.log(`📥 PUT /api/products/${id}`)
    console.log('Body:', JSON.stringify(body, null, 2))
    
    if (!id) {
      console.warn(`⚠️ ID tidak diterima`)
      return NextResponse.json(
        { error: 'ID produk wajib diisi' },
        { status: 400 }
      )
    }

    // Validasi data wajib
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Nama produk wajib diisi!' },
        { status: 400 }
      )
    }

    if (!body.price && body.price !== 0) {
      return NextResponse.json(
        { error: 'Harga produk wajib diisi!' },
        { status: 400 }
      )
    }

    const db = readDB()
    const index = db.products?.findIndex(p => p.id === Number(id))
    
    if (index === -1 || index === undefined) {
      console.warn(`⚠️ Product not found for update: ${id}`)
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Cek duplikasi nama (exclude current ID)
    if (body.name.trim().toLowerCase() !== db.products[index].name.toLowerCase()) {
      const duplicate = db.products.find(p => 
        p.name.toLowerCase() === body.name.trim().toLowerCase() && 
        p.id !== Number(id)
      )

      if (duplicate) {
        console.warn(`⚠️ Duplicate product name: ${body.name}`)
        return NextResponse.json(
          { error: `Produk "${body.name}" sudah ada` },
          { status: 409 }
        )
      }
    }

    // Update product
    const updatedProduct = {
      ...db.products[index],
      name: body.name.trim(),
      price: Number(body.price) || 0,
      unit: body.unit?.trim() || '',
      desc: body.desc?.trim() || '',
      inStock: body.inStock === true || body.inStock === 'true',
      imgBase64: body.imgBase64 || '',
      updatedAt: new Date().toISOString()
    }
    
    db.products[index] = updatedProduct

    if (!writeDB(db)) {
      throw new Error('Gagal menyimpan perubahan')
    }

    console.log(`✅ Produk diperbarui: ${updatedProduct.name}`)
    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('❌ PUT /api/products/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate produk', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Hapus product
export async function DELETE(request, { params }) {
  try {
    // ✅ FIX: Await params untuk Next.js 13+
    const { id } = await Promise.resolve(params)
    
    console.log(`🗑️ DELETE /api/products/${id}`)
    
    if (!id) {
      console.warn(`⚠️ ID tidak diterima`)
      return NextResponse.json(
        { error: 'ID produk wajib diisi' },
        { status: 400 }
      )
    }

    const db = readDB()
    const index = db.products?.findIndex(p => p.id === Number(id))
    
    if (index === -1 || index === undefined) {
      console.warn(`⚠️ Product not found for deletion: ${id}`)
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    const deletedName = db.products[index].name
    db.products.splice(index, 1)
    
    if (!writeDB(db)) {
      throw new Error('Gagal menghapus produk')
    }

    console.log(`✅ Produk dihapus: ${deletedName}`)
    return NextResponse.json({ 
      message: 'Produk berhasil dihapus',
      deletedName
    })
  } catch (error) {
    console.error('❌ DELETE /api/products/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus produk', details: error.message },
      { status: 500 }
    )
  }
}