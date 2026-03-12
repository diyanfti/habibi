import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'habibi-secret-key-2026'
)

// ─────────────────────────────────────────────────────────────────
// SIGN TOKEN - Buat JWT token baru
// ─────────────────────────────────────────────────────────────────
export async function signToken(payload) {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(SECRET)
    return token
  } catch (err) {
    console.error('❌ Sign token error:', err.message)
    throw err
  }
}

// ─────────────────────────────────────────────────────────────────
// VERIFY TOKEN - Cek apakah token valid
// ─────────────────────────────────────────────────────────────────
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload
  } catch (err) {
    console.error('⚠️ Token verify error:', err.message)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────
// GET TOKEN FROM REQUEST
// Extract token dari Authorization header atau Cookie
// ─────────────────────────────────────────────────────────────────
export function getTokenFromRequest(req) {
  try {
    // Cek Authorization header (Bearer token)
    const auth = req.headers.get('authorization') || ''
    if (auth.startsWith('Bearer ')) {
      return auth.slice(7)
    }
    
    // Cek cookie jika Authorization header tidak ada
    const cookie = req.headers.get('cookie') || ''
    const match = cookie.match(/token=([^;]+)/)
    return match ? match[1] : null
  } catch (err) {
    console.error('⚠️ Get token error:', err.message)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────
// VERIFY ADMIN - Cek apakah user adalah admin
// ─────────────────────────────────────────────────────────────────
export async function verifyAdmin(req) {
  try {
    // Extract token dari request
    const token = getTokenFromRequest(req)
    
    if (!token) {
      console.warn('⚠️ No token provided')
      return null
    }

    // Verify token
    const payload = await verifyToken(token)
    
    if (!payload) {
      console.warn('⚠️ Invalid token')
      return null
    }

    // Cek apakah role adalah admin
    if (payload.role !== 'admin') {
      console.warn(`⚠️ User ${payload.email} bukan admin (role: ${payload.role})`)
      return null
    }

    return payload // { id, email, role: 'admin', ... }
  } catch (err) {
    console.error('❌ Verify admin error:', err.message)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────
// VERIFY TOKEN WITH RESPONSE - Return NextResponse jika invalid
// ─────────────────────────────────────────────────────────────────
export async function verifyTokenWithResponse(req) {
  const { NextResponse } = await import('next/server')
  
  const token = getTokenFromRequest(req)
  if (!token) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      ),
      payload: null
    }
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      ),
      payload: null
    }
  }

  return { error: null, payload }
}

// ─────────────────────────────────────────────────────────────────
// VERIFY ADMIN WITH RESPONSE - Return NextResponse jika bukan admin
// ─────────────────────────────────────────────────────────────────
export async function verifyAdminWithResponse(req) {
  const { NextResponse } = await import('next/server')
  
  const payload = await verifyAdmin(req)
  if (!payload) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      ),
      payload: null
    }
  }

  return { error: null, payload }
}

// ─────────────────────────────────────────────────────────────────
// DECODE TOKEN - Decode tanpa verify (untuk debug)
// ─────────────────────────────────────────────────────────────────
export function decodeToken(token) {
  try {
    // Decode JWT tanpa verifikasi signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.warn('⚠️ Invalid token format')
      return null
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    )
    return payload
  } catch (err) {
    console.error('⚠️ Decode token error:', err.message)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────
// GENERATE TOKEN - Alias untuk signToken (untuk backward compatibility)
// ─────────────────────────────────────────────────────────────────
export async function generateToken(user) {
  return signToken({
    id: user.id,
    email: user.email,
    role: user.role
  })
}