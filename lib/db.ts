import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma"

// Type for global prisma instance
declare global {
  var prisma: PrismaClient | undefined
}

// Create Prisma client with PostgreSQL adapter
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  
  const adapter = new PrismaPg({ connectionString })
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
}

// Prevent multiple instances of Prisma Client in development
export const prisma = globalThis.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma
}

export default prisma
