import { NextResponse } from 'next/server'
import { prisma }       from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(req) {
  try {
    const token = getTokenFromRequest(req)
    const user  = await verifyToken(token)
    if (!user || user.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(
      orders.map(o => ({ ...o, items: JSON.parse(o.items) }))
    )
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body  = await req.json()
    const order = await prisma.order.create({
      data: {
        nama:       body.nama,
        pengiriman: body.pengiriman,
        pembayaran: body.pembayaran,
        lokasi:     body.lokasi    || null,
        catatan:    body.catatan   || null,
        total:      Number(body.total),
        status:     'pending',
        items:      JSON.stringify(body.items || []),
      }
    })
    return NextResponse.json(
      { ...order, items: body.items },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Gagal menyimpan pesanan' }, { status: 500 })
  }
}