import { NextResponse } from 'next/server'
import { prisma }       from '@/lib/prisma'
import { signToken }    from '@/lib/auth'
import bcrypt           from 'bcryptjs'

export async function POST(req) {
  try {
    const { email, password } = await req.json()
    
    // Cari user berdasarkan email
    const user = await prisma.user.findFirst({
      where: { email }
    })
    
    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }
    
    // Verifikasi password
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }
    
    // Generate token
    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role
    })
    
    // Set cookie dan return response
    const res = NextResponse.json({
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role
      }
    })
    
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/'
    })
    
    return res
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}