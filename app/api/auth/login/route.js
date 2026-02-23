import { NextResponse } from 'next/server'
import { prisma }       from '@/lib/prisma'
import { signToken }    from '@/lib/auth'
import bcrypt           from 'bcryptjs'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    const user = await prisma.user.findFirst({
      where: { email, role: 'admin' }
    })

    if (!user || !user.password)
      return NextResponse.json({ error: 'Email atau password salah!' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return NextResponse.json({ error: 'Email atau password salah!' }, { status: 401 })

    const token = await signToken({ id: user.id, email: user.email, role: user.role })

    const res = NextResponse.json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    })
    res.cookies.set('token', token, {
      httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}