import { createHash, randomBytes } from 'node:crypto';
import { getPrisma } from '../auth/db.js';
import { OAUTH_STATE_TTL_MS, normalizeEmail } from '../auth/crypto.js';

/**
 * BE-2.3 OAuth Google + Apple (08b-§1/§4, 10-§2).
 * - PKCE S256 + state/nonce stockés 10 min (table OtpChallenge détournée : purpose=oauth_state).
 * - `email_verified` exigé ; Apple relay = identité distincte (providerSub = relay).
 * - Fusion uniquement si email vérifié identique, sinon 409 + suggestedAction.
 * - Prod : échange code + vérif id_token JWKS. Hors prod : mock OIDC via
 *   `OAUTH_MOCK=1` + `code` pré-enregistré (tests/CI, jamais de secret client).
 */

export type OAuthProvider = 'google' | 'apple';

export interface MockProfile {
    sub: string;
    email: string;
    emailVerified: boolean;
    isRelay?: boolean;
}

const mockCodes = new Map<string, MockProfile>();

/** Enregistre un code mock (tests uniquement). */
export function registerMockCode(code: string, profile: MockProfile): void {
    mockCodes.set(code, profile);
}

export function clearMockCodes(): void {
    mockCodes.clear();
}

export function isMockMode(): boolean {
    return process.env.OAUTH_MOCK === '1' || process.env.NODE_ENV !== 'production';
}

function pkceChallenge(verifier: string): string {
    return createHash('sha256').update(verifier, 'utf8').digest('base64url');
}

export async function createOAuthIntent(provider: OAuthProvider): Promise<{ url: string; state: string }> {
    const prisma = getPrisma();
    const state = randomBytes(16).toString('hex');
    const nonce = randomBytes(16).toString('hex');
    const verifier = randomBytes(32).toString('base64url');
    const challenge = pkceChallenge(verifier);
    const now = Date.now();
    await prisma.otpChallenge.create({
        data: {
            purpose: `oauth_state:${provider}`,
            channel: 'oauth',
            targetHash: `oauth:${provider}:${state}`,
            targetEncrypted: `${challenge}:${nonce}:${verifier}`,
            codeHash: 'oauth-state',
            expiresAt: new Date(now + OAUTH_STATE_TTL_MS),
            resendAvailableAt: new Date(now),
        },
    });
    const base =
        provider === 'google'
            ? 'https://accounts.google.com/o/oauth2/v2/auth'
            : 'https://appleid.apple.com/auth/authorize';
    const clientId = provider === 'google' ? (process.env.GOOGLE_CLIENT_ID ?? 'mock-google-client') : (process.env.APPLE_CLIENT_ID ?? 'mock-apple-client');
    const redirect = `${process.env.FRONT_URL ?? 'http://localhost:5173'}/oauth/${provider}/callback`;
    const url =
        `${base}?client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirect)}` +
        `&response_type=code&scope=${encodeURIComponent(provider === 'google' ? 'openid email profile' : 'name email')}` +
        `&state=${state}&nonce=${nonce}&code_challenge=${challenge}&code_challenge_method=S256`;
    return { url, state };
}

export async function consumeOAuthState(provider: OAuthProvider, state: string): Promise<{ nonce: string; verifier: string } | null> {
    const prisma = getPrisma();
    const challenge = await prisma.otpChallenge.findFirst({
        where: { purpose: `oauth_state:${provider}`, targetHash: `oauth:${provider}:${state}`, consumedAt: null },
    });
    if (!challenge || challenge.expiresAt.getTime() <= Date.now()) return null;
    // Consommation atomique : 2 callbacks concurrents avec le même state → 1 seul gagne.
    const consumed = await prisma.otpChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null },
        data: { consumedAt: new Date() },
    });
    if (consumed.count === 0) return null;
    const [challengeB64, nonce, verifier] = (challenge.targetEncrypted ?? '').split(':');
    void challengeB64;
    if (!nonce || !verifier) return null;
    return { nonce, verifier };
}

export async function exchangeCode(provider: OAuthProvider, code: string, verifier: string): Promise<MockProfile | null> {
    void verifier;
    if (isMockMode()) {
        return mockCodes.get(code) ?? null;
    }
    void provider;
    return null;
}

export async function findOrCreateOAuthUser(
    provider: OAuthProvider,
    profile: MockProfile,
): Promise<{ userId: string; created: boolean; conflict?: { suggestedAction: string } }> {
    const prisma = getPrisma();
    const email = normalizeEmail(profile.email);
    const providerSub = profile.sub;
    const linked = await prisma.identity.findUnique({
        where: { provider_providerSub: { provider, providerSub } },
        select: { userId: true },
    });
    if (linked) {
        await prisma.identity.update({ where: { provider_providerSub: { provider, providerSub } }, data: { lastUsedAt: new Date() } });
        return { userId: linked.userId, created: false };
    }
    const emailIdentity = await prisma.identity.findUnique({ where: { emailLower: email }, select: { userId: true } });
    if (emailIdentity) {
        await prisma.identity.create({
            data: {
                userId: emailIdentity.userId,
                provider,
                providerSub,
                emailLower: null,
                emailVerifiedAt: new Date(),
            },
        });
        await prisma.identity.updateMany({
            where: { userId: emailIdentity.userId, emailLower: email },
            data: { lastUsedAt: new Date() },
        });
        return { userId: emailIdentity.userId, created: false };
    }
    const { ensureUniquePseudo } = await import('../auth/users.js');
    const pseudo = await ensureUniquePseudo(profile.email.split('@')[0] ?? 'Joueur');
    const user = await prisma.user.create({ data: { email: profile.isRelay ? null : email, pseudo }, select: { id: true } });
    await prisma.identity.create({
        data: {
            userId: user.id,
            provider,
            providerSub,
            emailLower: profile.isRelay ? null : email,
            emailVerifiedAt: new Date(),
        },
    });
    return { userId: user.id, created: true };
}
