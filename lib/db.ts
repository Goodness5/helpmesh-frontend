import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { PrismaClient } from "./generated/prisma"

// Type for global prisma instance
declare global {
  var prisma: PrismaClient | undefined
}

// Create Prisma client with PostgreSQL adapter
function createPrismaClient() {
  let connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    console.warn("DATABASE_URL not set - database features will not work")
    return null as unknown as PrismaClient
  }
  
  // Remove sslmode from URL - we'll handle SSL in code
  // This prevents conflicts between URL params and Pool config
  const url = new URL(connectionString)
  url.searchParams.delete("sslmode")
  url.searchParams.delete("ssl")
  connectionString = url.toString()
  
  console.log("[DB] Connecting to:", url.hostname + ":" + url.port)
  
  // Create a pg Pool with SSL configured to accept self-signed/unverified certificates
  const pool = new pg.Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Accept self-signed certificates
    },
  })
  
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
