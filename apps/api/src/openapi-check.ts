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
