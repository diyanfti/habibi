import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const hash = await bcrypt.hash('password123', 10)
await prisma.user.create({
  data: { nama: 'Admin', email: 'admin@habibi.com', role: 'admin', password: hash }
})
console.log('✅ Admin berhasil dibuat!')
await prisma.$disconnect()