# ---------------------------
# 1️⃣ Dependencies Stage
# ---------------------------
FROM node:20-alpine AS deps
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------------------------
# 2️⃣ Builder Stage
# ---------------------------
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# ---------------------------
# 3️⃣ Production Runner
# ---------------------------
FROM node:20-alpine AS runner
RUN corepack enable

ENV NODE_ENV=production
WORKDIR /app

# Create user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Check if standalone exists and copy accordingly
RUN if [ -d "/app/.next/standalone" ]; then \
      echo "Using standalone output"; \
    else \
      echo "Using regular build output"; \
    fi

# Copy built application - Try standalone first, fallback to regular
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Install production dependencies (needed for non-standalone)
RUN pnpm install --frozen-lockfile --prod

# Copy the built app
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

USER nextjs

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Use pnpm start (works for both standalone and regular builds)
CMD ["pnpm", "start"]