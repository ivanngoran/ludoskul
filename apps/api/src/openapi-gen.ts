import { writeFileSync } from 'node:fs';
import { buildApp } from './app.js';

const app = await buildApp();
await app.ready();
const spec = app.swagger();
writeFileSync(new URL('../openapi.json', import.meta.url), JSON.stringify(spec, null, 2));
console.warn('openapi.json généré');
await app.close();
