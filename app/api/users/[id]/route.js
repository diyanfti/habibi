import { NextResponse }                     from 'next/server'
import { prisma }                           from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import bcrypt                               from 'bcryptjs'

async function requireAdmin(req) {
  const token = getTokenFromRequest(req)
  const user  = await verifyToken(token)
  return user?.role === 'admin' ? user : null
}

export async function GET(req, { params }) {
  if (!await requireAdmin(req))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: { id:true, nama:true, email:true, telp:true, role:true, createdAt:true }
    })
    if (!user)
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
    return NextResponse.json(user)
  } catch (err) {
    console.error('GET user error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  if (!await requireAdmin(req))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { id } = await params
    const body   = await req.json()
    const data   = {
      ...(body.nama && { nama: body.nama }),
      ...(body.email !== undefined && { email: body.email || null }),
      ...(body.telp !== undefined && { telp: body.telp || null }),
      ...(body.role && { role: body.role }),
    }
    if (body.password) {
      data.password = await bcrypt.hash(body.password, 10)
    }
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data
    })
    const { password: _, ...safe } = user
    return NextResponse.json(safe)
  } catch (err) {
    console.error('PUT user error:', err)
    return NextResponse.json({ error: 'Gagal memperbarui pengguna' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  if (!await requireAdmin(req))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { id } = await params
    await prisma.user.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE user error:', err)
    return NextResponse.json({ error: 'Gagal menghapus pengguna' }, { status: 500 })
  }
}