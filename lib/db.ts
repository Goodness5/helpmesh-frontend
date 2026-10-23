import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { PrismaClient } from "./generated/prisma"

// Type for global prisma instance
declare global {
  var prisma: PrismaClient | undefined
}

// Create Prisma client with PostgreSQL adapter
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    console.warn("DATABASE_URL not set - database features will not work")
    // Return a client that will fail gracefully
    return null as unknown as PrismaClient
  }
  
  // Create a pg Pool with SSL configured to accept self-signed certificates
  const pool = new pg.Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Accept self-signed certificates
    },
  })
  
  // Pass the pool directly to PrismaPg (not as an object)
  const adapter = new PrismaPg(pool)
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

// Prevent multiple instances of Prisma Client in development
export const prisma = globalThis.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma
}

export default prisma
