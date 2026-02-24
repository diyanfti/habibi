import { NextResponse }                     from 'next/server'
import { prisma }                           from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

async function requireAdmin(req) {
  const token = getTokenFromRequest(req)
  const user  = await verifyToken(token)
  return user?.role === 'admin' ? user : null
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(products)
  } catch (err) {
    console.error('GET products error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req) {
  if (!await requireAdmin(req))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await req.json()
    const product = await prisma.product.create({
      data: {
        name:    body.name?.trim(),
        price:   Number(body.price),
        unit:    body.unit?.trim()  || '',
        desc:    body.desc?.trim()  || '',
        inStock: body.inStock       ?? true,
        imgBase64: body.imgBase64   || null,
      }
    })
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    console.error('POST product error:', err)
    return NextResponse.json({ error: 'Gagal menambahkan produk' }, { status: 500 })
  }
}