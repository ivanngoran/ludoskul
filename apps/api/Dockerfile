FROM node:20-slim AS base
WORKDIR /app
RUN corepack enable
COPY pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter @ludoskul/api...
COPY . .
RUN pnpm --filter @ludoskul/shared build && pnpm --filter @ludoskul/api build
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:3001/health').then(r=>{if(!r.ok)process.exit(1)})"
CMD ["sh", "-c", "pnpm --filter @ludoskul/api db:migrate:deploy && node apps/api/dist/server.js"]
