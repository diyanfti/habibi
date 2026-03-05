import { PrismaClient } from '@prisma/client'

const globalForPrisma = global
globalForPrisma.prisma ??= new PrismaClient()

export const prisma = globalForPrisma.prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma