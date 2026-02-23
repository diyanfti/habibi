import { NextResponse }                     from 'next/server'
import { prisma }                           from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

async function requireAdmin(req) {
  const token = getTokenFromRequest(req)
  const user  = await verifyToken(token)
  return user?.role === 'admin' ? user : null
}

export async function PUT(req, { params }) {
  if (!await requireAdmin(req))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body  = await req.json()
    const order = await prisma.order.update({
      where: { id: Number(params.id) },
      data:  { status: body.status }
    })
    return NextResponse.json({ ...order, items: JSON.parse(order.items) })
  } catch {
    return NextResponse.json({ error: 'Gagal update pesanan' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  if (!await requireAdmin(req))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    await prisma.order.delete({ where: { id: Number(params.id) } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus pesanan' }, { status: 500 })
  }
}