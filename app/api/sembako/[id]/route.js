// app/api/sembako/[id]/route.js - FIXED VERSION
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

// GET - Detail sembako
export async function GET(request, { params }) {
  try {
    // ✅ FIX: Await params untuk Next.js 13+
    const { id } = await Promise.resolve(params)
    
    console.log(`📥 GET /api/sembako/${id}`)
    
    if (!id) {
      console.warn(`⚠️ ID tidak diterima`)
      return NextResponse.json(
        { error: 'ID sembako wajib diisi' },
        { status: 400 }
      )
    }

    const db = readDB()
    const sembako = db.sembako?.find(s => s.id === Number(id))
    
    if (!sembako) {
      console.warn(`⚠️ Sembako not found: ${id}`)
      return NextResponse.json(
        { error: 'Sembako tidak ditemukan' },
        { status: 404 }
      )
    }

    console.log(`✅ GET /api/sembako/${id} - Retrieved: ${sembako.name}`)
    return NextResponse.json(sembako)
  } catch (error) {
    console.error('❌ GET /api/sembako/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil detail sembako', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update sembako
export async function PUT(request, { params }) {
  try {
    // ✅ FIX: Await params untuk Next.js 13+
    const { id } = await Promise.resolve(params)
    const body = await request.json()
    
    console.log(`📥 PUT /api/sembako/${id}`)
    console.log('Body:', JSON.stringify(body, null, 2))
    
    if (!id) {
      console.warn(`⚠️ ID tidak diterima`)
      return NextResponse.json(
        { error: 'ID sembako wajib diisi' },
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
    const index = db.sembako?.findIndex(s => s.id === Number(id))
    
    if (index === -1 || index === undefined) {
      console.warn(`⚠️ Sembako not found for update: ${id}`)
      return NextResponse.json(
        { error: 'Sembako tidak ditemukan' },
        { status: 404 }
      )
    }

    // Cek duplikasi nama (exclude current ID)
    if (body.name.trim().toLowerCase() !== db.sembako[index].name.toLowerCase()) {
      const duplicate = db.sembako.find(s => 
        s.name.toLowerCase() === body.name.trim().toLowerCase() && 
        s.id !== Number(id)
      )

      if (duplicate) {
        console.warn(`⚠️ Duplicate name in update: ${body.name}`)
        return NextResponse.json(
          { error: `Nama "${body.name}" sudah digunakan produk lain` },
          { status: 409 }
        )
      }
    }

    // Update sembako
    const updatedSembako = {
      ...db.sembako[index],
      name: body.name.trim(),
      variants: body.variants.map(v => ({
        size: String(v.size).trim(),
        price: Number(v.price) || 0
      })),
      desc: body.desc?.trim() || '',
      inStock: body.inStock === true || body.inStock === 'true',
      imgBase64: body.imgBase64 || '',
      updatedAt: new Date().toISOString()
    }
    
    db.sembako[index] = updatedSembako

    if (!writeDB(db)) {
      throw new Error('Gagal menyimpan perubahan')
    }

    console.log(`✅ Sembako diperbarui: ${updatedSembako.name}`)
    return NextResponse.json(updatedSembako)
  } catch (error) {
    console.error('❌ PUT /api/sembako/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate sembako', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Hapus sembako
export async function DELETE(request, { params }) {
  try {
    // ✅ FIX: Await params untuk Next.js 13+
    const { id } = await Promise.resolve(params)
    
    console.log(`🗑️ DELETE /api/sembako/${id}`)
    
    if (!id) {
      console.warn(`⚠️ ID tidak diterima`)
      return NextResponse.json(
        { error: 'ID sembako wajib diisi' },
        { status: 400 }
      )
    }

    const db = readDB()
    const index = db.sembako?.findIndex(s => s.id === Number(id))
    
    if (index === -1 || index === undefined) {
      console.warn(`⚠️ Sembako not found for deletion: ${id}`)
      return NextResponse.json(
        { error: 'Sembako tidak ditemukan' },
        { status: 404 }
      )
    }

    const deletedName = db.sembako[index].name
    db.sembako.splice(index, 1)
    
    if (!writeDB(db)) {
      throw new Error('Gagal menghapus sembako')
    }

    console.log(`✅ Sembako dihapus: ${deletedName}`)
    return NextResponse.json({ 
      message: 'Sembako berhasil dihapus',
      deletedName
    })
  } catch (error) {
    console.error('❌ DELETE /api/sembako/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus sembako', details: error.message },
      { status: 500 }
    )
  }
}