import { NextResponse }                     from 'next/server'
import { prisma }                           from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import bcrypt                               from 'bcryptjs'

async function requireAdmin(req) {
  const token = getTokenFromRequest(req)
  const user  = await verifyToken(token)
  return user?.role === 'admin' ? user : null
}

export async function PUT(req, { params }) {
  if (!await requireAdmin(req))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await req.json()
    const data = {
      nama:  body.nama,
      email: body.email || null,
      telp:  body.telp  || null,
      role:  body.role  || 'pelanggan',
    }
    if (body.password) data.password = await bcrypt.hash(body.password, 10)
    const user = await prisma.user.update({
      where: { id: Number(params.id) },
      data
    })
    const { password: _, ...safe } = user
    return NextResponse.json(safe)
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui pengguna' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  if (!await requireAdmin(req))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    await prisma.user.delete({ where: { id: Number(params.id) } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus pengguna' }, { status: 500 })
  }
}