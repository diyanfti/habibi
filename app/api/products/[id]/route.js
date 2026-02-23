import { NextResponse }                     from 'next/server'
import { prisma }                           from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

async function requireAdmin(req) {
  const token = getTokenFromRequest(req)
  const user  = await verifyToken(token)
  return user?.role === 'admin' ? user : null
}

export async function GET(_, { params }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(params.id) }
    })
    if (!product)
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  if (!await requireAdmin(req))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body    = await req.json()
    const product = await prisma.product.update({
      where: { id: Number(params.id) },
      data: {
        name:      body.name?.trim(),
        price:     Number(body.price),
        unit:      body.unit?.trim()  || '',
        desc:      body.desc?.trim()  || '',
        inStock:   body.inStock       ?? true,
        ...(body.imgBase64 !== undefined && { imgBase64: body.imgBase64 }),
      }
    })
    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui produk' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  if (!await requireAdmin(req))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    await prisma.product.delete({ where: { id: Number(params.id) } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 })
  }
}