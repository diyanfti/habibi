import { NextResponse }                     from 'next/server'
import { prisma }                           from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(products)
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil produk' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const token = getTokenFromRequest(req)
    const user  = await verifyToken(token)
    if (!user || user.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body    = await req.json()
    const product = await prisma.product.create({
      data: {
        name:      body.name?.trim(),
        price:     Number(body.price),
        unit:      body.unit?.trim()      || '',
        desc:      body.desc?.trim()      || '',
        inStock:   body.inStock           ?? true,
        imgBase64: body.imgBase64         || null,
      }
    })
    return NextResponse.json(product, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Gagal menambahkan produk' }, { status: 500 })
  }
}