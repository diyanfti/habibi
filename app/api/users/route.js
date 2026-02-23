import { NextResponse }                     from 'next/server'
import { prisma }                           from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import bcrypt                               from 'bcryptjs'

async function requireAdmin(req) {
  const token = getTokenFromRequest(req)
  const user  = await verifyToken(token)
  return user?.role === 'admin' ? user : null
}

export async function GET(req) {
  if (!await requireAdmin(req))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id:true, nama:true, email:true, telp:true, role:true, createdAt:true }
    })
    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req) {
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
    const user = await prisma.user.create({ data })
    const { password: _, ...safe } = user
    return NextResponse.json(safe, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Gagal menambahkan pengguna' }, { status: 500 })
  }
}