import { NextResponse }                     from 'next/server'
import { prisma }                           from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

async function requireAdmin(req) {
  const token = getTokenFromRequest(req)
  const user  = await verifyToken(token)
  return user?.role === 'admin' ? user : null
}

export async function GET(req, { params }) {
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id: Number(id) }
    })
    if (!order)
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    return NextResponse.json({
      ...order,
      items: JSON.parse(order.items)
    })
  } catch (err) {
    console.error('GET order error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  if (!await requireAdmin(req))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { id } = await params
    const body   = await req.json()
    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.nama && { nama: body.nama }),
        ...(body.pengiriman && { pengiriman: body.pengiriman }),
        ...(body.pembayaran && { pembayaran: body.pembayaran }),
        ...(body.lokasi !== undefined && { lokasi: body.lokasi }),
        ...(body.catatan !== undefined && { catatan: body.catatan }),
        ...(body.total && { total: Number(body.total) }),
      }
    })
    return NextResponse.json({
      ...order,
      items: JSON.parse(order.items)
    })
  } catch (err) {
    console.error('PUT order error:', err)
    return NextResponse.json({ error: 'Gagal memperbarui pesanan' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  if (!await requireAdmin(req))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { id } = await params
    await prisma.order.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE order error:', err)
    return NextResponse.json({ error: 'Gagal menghapus pesanan' }, { status: 500 })
  }
}