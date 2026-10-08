import { readFileSync, existsSync } from 'node:fs';

const required = [
    ['GET', '/health'],
    ['GET', '/api/exercises'],
    ['GET', '/api/exercises/:code'],
    ['GET', '/api/badges'],
    ['POST', '/api/sessions'],
    ['GET', '/api/sessions/active'],
    ['POST', '/api/sessions/:id/training-level'],
    ['POST', '/api/sessions/:id/answers'],
    ['POST', '/api/sessions/:id/complete'],
    ['POST', '/api/sessions/:id/stop'],
    ['POST', '/api/sessions/:id/abandon'],
    ['GET', '/api/config/flags'],
    // BE-EPIC-2 auth (08b-§4)
    ['POST', '/api/auth/email/code'],
    ['POST', '/api/auth/email/verify'],
    ['GET', '/api/auth/email/magic'],
    ['POST', '/api/auth/register'],
    ['POST', '/api/auth/login'],
    ['POST', '/api/auth/password/forgot'],
    ['POST', '/api/auth/password/reset'],
    ['GET', '/api/auth/oauth/:provider/url'],
    ['GET', '/api/auth/oauth/:provider/callback'],
    ['POST', '/api/auth/oauth/:provider/link'],
    ['POST', '/api/auth/phone/code'],
    ['POST', '/api/auth/phone/verify'],
    ['POST', '/api/auth/guest'],
    ['POST', '/api/auth/guest/upgrade'],
    ['GET', '/api/auth/identities'],
    ['DELETE', '/api/auth/identities/:provider'],
    ['POST', '/api/auth/refresh'],
    ['POST', '/api/auth/logout'],
    ['GET', '/api/auth/devices'],
    ['DELETE', '/api/auth/devices/:id'],
    ['GET', '/api/auth/me'],
    ['PATCH', '/api/auth/me'],
    ['DELETE', '/api/auth/me'],
    ['POST', '/api/auth/merge/confirm'],
    ['POST', '/api/family/children'],
    ['GET', '/api/family/children'],
    ['POST', '/api/family/invite'],
    ['GET', '/api/family/join'],
    ['PATCH', '/api/family/children/:id'],
    ['DELETE', '/api/family/children/:id'],
];

const path = new URL('../openapi.json', import.meta.url);
if (!existsSync(path)) {
    console.error('openapi.json manquant — lancer openapi:gen');
    process.exit(1);
}
const spec = JSON.parse(readFileSync(path, 'utf8'));
const paths = spec.paths ?? {};
const missing: string[] = [];
for (const [method, route] of required) {
    const openApiRoute = route.replace(/:(\w+)/g, '{$1}');
    const entry = paths[openApiRoute] ?? paths[route];
    if (!entry || !entry[method.toLowerCase()]) missing.push(`${method} ${route}`);
}
if (missing.length) {
    console.error('openapi:check échoué, manquants :', missing.join(', '));
    process.exit(1);
}
console.warn('openapi:check OK');
