# ============================================================
# Server — Node.js + Express + TypeScript + Drizzle ORM
# Optimized Dockerfile for Crackers Shop Backend
# ============================================================

# ── Stage 1: install ALL deps (dev included for tsc) ─────────
FROM node:22-alpine AS deps

WORKDIR /app

# Enable corepack and use the specified pnpm version
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# Build-time dependencies for @sparticuz/chromium and other native modules
RUN apk add --no-cache \
      python3 make g++ \
      nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont \
      libstdc++

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ── Stage 2: compile TypeScript ──────────────────────────────
FROM deps AS builder

WORKDIR /app

COPY . .

# Compile TS to JS in /app/dist
RUN pnpm run build

# ── Stage 3: production — only runtime deps ──────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Runtime dependencies for Puppeteer/Chromium and PostgreSQL
RUN apk add --no-cache \
      nss freetype harfbuzz ca-certificates ttf-freefont libstdc++ \
      postgresql-client

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# Install only PRODUCTION dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

# Copy non-compiled assets (templates) required at runtime
# Check if templates exist in src/templates and copy them if they do
COPY --from=builder /app/src/templates ./dist/templates 2>/dev/null || true

# Copy Drizzle migration files for startup migrations
COPY --from=builder /app/drizzle ./drizzle 2>/dev/null || true

# Security: Run as a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# Ensure the uploads directory exists and is owned by appuser
RUN mkdir -p uploads && chown appuser:appgroup uploads
USER appuser

EXPOSE 5000

# Healthcheck to monitor container health
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "dist/server.js"]
