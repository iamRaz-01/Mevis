# ────────────────────────────────────────────────────────────────
# MEVIS Gateway — Production Dockerfile
# ────────────────────────────────────────────────────────────────

FROM node:22-slim AS builder

WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY packages/platform/communication/package.json ./packages/platform/communication/
COPY packages/platform/edge-runtime/package.json ./packages/platform/edge-runtime/
COPY packages/platform/contracts/package.json ./packages/platform/contracts/
COPY packages/platform/service-registry/package.json ./packages/platform/service-registry/
COPY packages/config/package.json ./packages/config/
COPY packages/core/package.json ./packages/core/
COPY packages/logger/package.json ./packages/logger/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/infrastructure/configuration/package.json ./packages/infrastructure/configuration/
COPY packages/infrastructure/auditing/package.json ./packages/infrastructure/auditing/
COPY packages/infrastructure/health/package.json ./packages/infrastructure/health/
COPY packages/infrastructure/notification/package.json ./packages/infrastructure/notification/
COPY packages/infrastructure/secrets/package.json ./packages/infrastructure/secrets/
COPY packages/infrastructure/storage/package.json ./packages/infrastructure/storage/
COPY packages/platform/data/package.json ./packages/platform/data/
COPY packages/platform/frontend-client/package.json ./packages/platform/frontend-client/
COPY packages/platform/operations/package.json ./packages/platform/operations/
COPY packages/platform/service-client/package.json ./packages/platform/service-client/
COPY services/gateway/package.json ./services/gateway/

RUN npm ci --ignore-scripts

COPY packages/ ./packages/
COPY services/gateway/ ./services/gateway/

RUN npx tsc -b tsconfig.json

# ────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY packages/platform/communication/package.json ./packages/platform/communication/
COPY packages/platform/edge-runtime/package.json ./packages/platform/edge-runtime/
COPY packages/platform/contracts/package.json ./packages/platform/contracts/
COPY packages/platform/service-registry/package.json ./packages/platform/service-registry/
COPY packages/config/package.json ./packages/config/
COPY packages/core/package.json ./packages/core/
COPY packages/logger/package.json ./packages/logger/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/infrastructure/configuration/package.json ./packages/infrastructure/configuration/
COPY packages/infrastructure/auditing/package.json ./packages/infrastructure/auditing/
COPY packages/infrastructure/health/package.json ./packages/infrastructure/health/
COPY packages/infrastructure/notification/package.json ./packages/infrastructure/notification/
COPY packages/infrastructure/secrets/package.json ./packages/infrastructure/secrets/
COPY packages/infrastructure/storage/package.json ./packages/infrastructure/storage/
COPY packages/platform/data/package.json ./packages/platform/data/
COPY packages/platform/frontend-client/package.json ./packages/platform/frontend-client/
COPY packages/platform/operations/package.json ./packages/platform/operations/
COPY packages/platform/service-client/package.json ./packages/platform/service-client/
COPY services/gateway/package.json ./services/gateway/

RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/logger/dist ./packages/logger/dist
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/infrastructure/configuration/dist ./packages/infrastructure/configuration/dist
COPY --from=builder /app/packages/infrastructure/auditing/dist ./packages/infrastructure/auditing/dist
COPY --from=builder /app/packages/infrastructure/health/dist ./packages/infrastructure/health/dist
COPY --from=builder /app/packages/infrastructure/notification/dist ./packages/infrastructure/notification/dist
COPY --from=builder /app/packages/infrastructure/secrets/dist ./packages/infrastructure/secrets/dist
COPY --from=builder /app/packages/infrastructure/storage/dist ./packages/infrastructure/storage/dist
COPY --from=builder /app/packages/platform/communication/dist ./packages/platform/communication/dist
COPY --from=builder /app/packages/platform/contracts/dist ./packages/platform/contracts/dist
COPY --from=builder /app/packages/platform/data/dist ./packages/platform/data/dist
COPY --from=builder /app/packages/platform/edge-runtime/dist ./packages/platform/edge-runtime/dist
COPY --from=builder /app/packages/platform/frontend-client/dist ./packages/platform/frontend-client/dist
COPY --from=builder /app/packages/platform/operations/dist ./packages/platform/operations/dist
COPY --from=builder /app/packages/platform/service-client/dist ./packages/platform/service-client/dist
COPY --from=builder /app/packages/platform/service-registry/dist ./packages/platform/service-registry/dist
COPY --from=builder /app/services/gateway/dist ./services/gateway/dist

ENV NODE_ENV=production
ENV PORT=8000
ENV LOG_LEVEL=info

EXPOSE 8000

WORKDIR /app/services/gateway

CMD ["node", "dist/src/index.js"]
