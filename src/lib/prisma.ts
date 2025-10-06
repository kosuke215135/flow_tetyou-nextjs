import { PrismaClient } from '@prisma/client'

// PrismaClientのグローバルインスタンスの型定義
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 開発環境でのホットリロード時に複数のインスタンスが作成されるのを防ぐ
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
