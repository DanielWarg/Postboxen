import { PrismaClient } from "@prisma/client"

import { env } from "@/lib/config"

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const createClient = () =>
  new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  })

export const prisma = globalThis.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma
}
