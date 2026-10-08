import { readFileSync, existsSync } from 'node:fs';

// 17-§1 : chaque endpoint requis a les bons codes + un schéma typé (pas de "Default Response").
const required: Array<{ method: string; route: string; codes: number[]; body?: boolean }> = [
    { method: 'GET', route: '/health', codes: [200] },
    { method: 'GET', route: '/ready', codes: [200, 503] },
    { method: 'GET', route: '/api/exercises', codes: [200] },
    { method: 'GET', route: '/api/exercises/:code', codes: [200, 404] },
    { method: 'GET', route: '/api/exercises/:code/tts', codes: [200] },
    { method: 'GET', route: '/api/badges', codes: [200] },
    { method: 'POST', route: '/api/sessions', codes: [201, 400, 429], body: true },
    { method: 'GET', route: '/api/sessions/active', codes: [200] },
    { method: 'GET', route: '/api/sessions/:id/questions', codes: [200, 404] },
    { method: 'POST', route: '/api/sessions/:id/training-level', codes: [200, 400, 404], body: true },
    { method: 'POST', route: '/api/sessions/:id/answers', codes: [200, 400, 404, 422, 429], body: true },
    { method: 'POST', route: '/api/sessions/:id/complete', codes: [200, 400, 404], body: true },
    { method: 'POST', route: '/api/sessions/:id/stop', codes: [200, 404] },
    { method: 'POST', route: '/api/sessions/:id/abandon', codes: [200, 404] },
    { method: 'GET', route: '/api/config/flags', codes: [200] },
    // BE-EPIC-2 auth (08b-§4) — présence vérifiée ; schémas typés ajoutés en BE-2.x.
    { method: 'POST', route: '/api/auth/email/code', codes: [200] },
    { method: 'POST', route: '/api/auth/email/verify', codes: [200] },
    { method: 'GET', route: '/api/auth/email/magic', codes: [200] },
    { method: 'POST', route: '/api/auth/register', codes: [201] },
    { method: 'POST', route: '/api/auth/login', codes: [200] },
    { method: 'POST', route: '/api/auth/password/forgot', codes: [200] },
    { method: 'POST', route: '/api/auth/password/reset', codes: [200] },
    { method: 'GET', route: '/api/auth/oauth/:provider/url', codes: [200] },
    { method: 'GET', route: '/api/auth/oauth/:provider/callback', codes: [200] },
    { method: 'POST', route: '/api/auth/oauth/:provider/link', codes: [200] },
    { method: 'POST', route: '/api/auth/phone/code', codes: [200] },
    { method: 'POST', route: '/api/auth/phone/verify', codes: [200] },
    { method: 'POST', route: '/api/auth/guest', codes: [201] },
    { method: 'POST', route: '/api/auth/guest/upgrade', codes: [200] },
    { method: 'GET', route: '/api/auth/identities', codes: [200] },
    { method: 'DELETE', route: '/api/auth/identities/:provider', codes: [204] },
    { method: 'POST', route: '/api/auth/refresh', codes: [200] },
    { method: 'POST', route: '/api/auth/logout', codes: [204] },
    { method: 'GET', route: '/api/auth/devices', codes: [200] },
    { method: 'DELETE', route: '/api/auth/devices/:id', codes: [204] },
    { method: 'GET', route: '/api/auth/me', codes: [200] },
    { method: 'PATCH', route: '/api/auth/me', codes: [200] },
    { method: 'DELETE', route: '/api/auth/me', codes: [204] },
    { method: 'POST', route: '/api/auth/merge/confirm', codes: [200] },
    { method: 'POST', route: '/api/family/children', codes: [201] },
    { method: 'GET', route: '/api/family/children', codes: [200] },
    { method: 'POST', route: '/api/family/invite', codes: [200] },
    { method: 'GET', route: '/api/family/join', codes: [200] },
    { method: 'PATCH', route: '/api/family/children/:id', codes: [200] },
    { method: 'DELETE', route: '/api/family/children/:id', codes: [204] },
];

const path = new URL('../openapi.json', import.meta.url);
if (!existsSync(path)) {
    console.error('openapi.json manquant — lancer openapi:gen');
    process.exit(1);
}
const spec = JSON.parse(readFileSync(path, 'utf8'));
const paths = spec.paths ?? {};
const missing: string[] = [];
for (const { method, route, codes, body } of required) {
    const openApiRoute = route.replace(/:(\w+)/g, '{$1}');
    const entry = paths[openApiRoute] ?? paths[route];
    const op = entry?.[method.toLowerCase()];
    if (!op) {
        missing.push(`${method} ${route} (absent)`);
        continue;
    }
    for (const code of codes) {
        const resp = op.responses?.[String(code)];
        if (!resp) {
            missing.push(`${method} ${route} (code ${code} absent)`);
            continue;
        }
        if (resp.description === 'Default Response' || !resp.content?.['application/json']?.schema) {
            missing.push(`${method} ${route} (code ${code} sans schéma)`);
        }
    }
    if (body && !op.requestBody?.content?.['application/json']?.schema) {
        missing.push(`${method} ${route} (body sans schéma)`);
    }
}
if (missing.length) {
    console.error('openapi:check échoué, manquants :', missing.join(', '));
    process.exit(1);
}
console.warn('openapi:check OK');
