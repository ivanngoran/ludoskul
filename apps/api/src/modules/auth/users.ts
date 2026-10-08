import { createId } from '@paralleldrive/cuid2';
import { getPrisma } from './db.js';
import { normalizeEmail } from './crypto.js';

/**
 * Création/liaison User + Identity (08b-§1 : 1 humain = 1 User, N Identity).
 * - Fusion si emailLower vérifié existant (BE-2.1/2.2/2.3).
 * - Pseudo unique 3-16 (suffixe si conflit) ; DeletedPseudo réservé 30j.
 */

export async function ensureUniquePseudo(base: string): Promise<string> {
    const prisma = getPrisma();
    const clean = (base || 'Joueur').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 12) || 'Joueur';
    for (let i = 0; i < 10; i += 1) {
        const candidate = i === 0 ? clean.slice(0, 16) : `${clean.slice(0, 12)}_${i}`;
        const taken =
            (await prisma.user.findUnique({ where: { pseudo: candidate }, select: { id: true } })) ??
            (await prisma.deletedPseudo.findUnique({ where: { pseudo: candidate }, select: { id: true } }));
        if (!taken) return candidate;
    }
    return `${clean.slice(0, 8)}_${createId().slice(0, 6)}`;
}

export async function findUserByEmail(emailNormalized: string): Promise<{ id: string } | null> {
    const prisma = getPrisma();
    const identity = await prisma.identity.findUnique({
        where: { emailLower: emailNormalized },
        select: { userId: true },
    });
    return identity ? { id: identity.userId } : null;
}

export async function createUserWithEmailIdentity(
    emailNormalized: string,
    pseudoBase: string,
    passwordHash?: string,
): Promise<{ id: string }> {
    const prisma = getPrisma();
    const pseudo = await ensureUniquePseudo(pseudoBase);
    const now = new Date();
    const user = await prisma.user.create({
        data: {
            email: emailNormalized,
            passwordHash: passwordHash ?? null,
            pseudo,
        },
        select: { id: true },
    });
    await prisma.identity.create({
        data: {
            userId: user.id,
            provider: 'email',
            providerSub: `email:${emailNormalized}`,
            emailLower: emailNormalized,
            emailVerifiedAt: now,
        },
    });
    return user;
}

export async function linkEmailIdentity(userId: string, emailNormalized: string): Promise<void> {
    const prisma = getPrisma();
    const existing = await prisma.identity.findFirst({ where: { userId, provider: 'email' } });
    if (existing) {
        await prisma.identity.update({
            where: { id: existing.id },
            data: { emailLower: emailNormalized, emailVerifiedAt: new Date(), lastUsedAt: new Date() },
        });
        return;
    }
    await prisma.identity.create({
        data: {
            userId,
            provider: 'email',
            providerSub: `email:${emailNormalized}`,
            emailLower: emailNormalized,
            emailVerifiedAt: new Date(),
        },
    });
}

export function pseudoFromEmail(email: string): string {
    const local = normalizeEmail(email).split('@')[0] ?? 'Joueur';
    return local.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 12) || 'Joueur';
}
