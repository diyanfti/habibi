// app/api/auth/logout/route.js
import { NextResponse } from 'next/server'

export async function POST() {
  // Karena menggunakan JWT di localStorage, logout dilakukan di client-side
  // Endpoint ini hanya untuk keperluan logging atau cleanup jika diperlukan
  
  return NextResponse.json({
    message: 'Logout berhasil'
  })
}