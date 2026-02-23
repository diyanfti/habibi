import { NextResponse } from 'next/server'
import { prisma }       from '@/lib/prisma'
import bcrypt           from 'bcryptjs'

export async function GET() {
  try {
    const exists = await prisma.user.findFirst({ where: { role: 'admin' } })
    if (exists)
      return NextResponse.json({ msg: 'Admin sudah ada, tidak perlu seed ulang.' })

    await prisma.user.create({
      data: {
        nama:     'Admin HA BIBI',
        email:    'admin@habibi.com',
        role:     'admin',
        password: await bcrypt.hash('habibi2026', 10),
      }
    })

    return NextResponse.json({
      msg: '✅ Berhasil! Akun admin dibuat.',
      email:    'admin@habibi.com',
      password: 'habibi2026',
      next:     '⚠️ Segera hapus file ini setelah login pertama kali!'
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}