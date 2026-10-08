import { PrismaClient } from '@prisma/client';

declare global {
    var __ludoskulPrisma: PrismaClient | undefined;
}

/** Client Prisma partagé (singleton dev/prod, évite l'épuisement de connexions). */
export function getPrisma(): PrismaClient {
    if (!globalThis.__ludoskulPrisma) {
        globalThis.__ludoskulPrisma = new PrismaClient();
    }
    return globalThis.__ludoskulPrisma;
}
