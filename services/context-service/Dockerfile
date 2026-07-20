# ────────────────────────────────────────────────────────────────
# MEVIS Context-Service — Production Dockerfile
# Builds the entire monorepo and extracts the context-service
# ────────────────────────────────────────────────────────────────

FROM node:22-slim AS builder

WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./

# Copy all package manifests for workspace resolution
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
COPY packages/platform/communication/package.json ./packages/platform/communication/
COPY packages/platform/contracts/package.json ./packages/platform/contracts/
COPY packages/platform/data/package.json ./packages/platform/data/
COPY packages/platform/edge-runtime/package.json ./packages/platform/edge-runtime/
COPY packages/platform/frontend-client/package.json ./packages/platform/frontend-client/
COPY packages/platform/operations/package.json ./packages/platform/operations/
COPY packages/platform/service-client/package.json ./packages/platform/service-client/
COPY packages/platform/service-registry/package.json ./packages/platform/service-registry/
COPY services/context-service/package.json ./services/context-service/

# Install all dependencies (workspace-aware)
RUN npm install --ignore-scripts

# Copy source code for required packages
COPY packages/ ./packages/
COPY services/context-service/ ./services/context-service/

# Build all packages and the context-service
RUN npx tsc -b tsconfig.json

# ────────────────────────────────────────────────────────────────
# Production image — lean runtime
# ────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

# Create data directory for SQLite persistence
RUN mkdir -p /data

# Copy workspace manifests
COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./

# Copy all package manifests
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
COPY packages/platform/communication/package.json ./packages/platform/communication/
COPY packages/platform/contracts/package.json ./packages/platform/contracts/
COPY packages/platform/data/package.json ./packages/platform/data/
COPY packages/platform/edge-runtime/package.json ./packages/platform/edge-runtime/
COPY packages/platform/frontend-client/package.json ./packages/platform/frontend-client/
COPY packages/platform/operations/package.json ./packages/platform/operations/
COPY packages/platform/service-client/package.json ./packages/platform/service-client/
COPY packages/platform/service-registry/package.json ./packages/platform/service-registry/
COPY services/context-service/package.json ./services/context-service/

# Install production dependencies only
RUN npm install --omit=dev --ignore-scripts

# Copy compiled output from builder
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
COPY --from=builder /app/services/context-service/dist ./services/context-service/dist

# Copy migrations
COPY services/context-service/migrations ./services/context-service/migrations

ENV NODE_ENV=production
ENV PORT=3008
ENV DB_URL=/data/mevis.db
ENV LOG_LEVEL=info

EXPOSE 3008

WORKDIR /app/services/context-service

CMD ["node", "--experimental-sqlite", "dist/src/index.js"]
