import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 * `next dev` hot reload zamanı hər dəfə yeni bağlantı açılmasının qarşısını alır.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
