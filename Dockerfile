# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.14.1 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY turbo.json ./
COPY package.json ./

# Copy packages
COPY packages ./packages

# Copy apps
COPY apps ./apps

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build packages first, then API
RUN pnpm build --filter=@deposife/shared
RUN pnpm build --filter=@deposife/state-laws
RUN pnpm build --filter=@deposife/api

# Production stage
FROM node:20-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.14.1 --activate

WORKDIR /app

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/state-laws/dist ./packages/state-laws/dist
COPY --from=builder /app/packages/state-laws/package.json ./packages/state-laws/package.json

# Set production environment
ENV NODE_ENV=production

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

WORKDIR /app

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/v1/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the server
CMD ["node", "apps/api/dist/server.js"]