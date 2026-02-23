import { NextResponse }                     from 'next/server'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(req) {
  const token   = getTokenFromRequest(req)
  if (!token)   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(payload)
}