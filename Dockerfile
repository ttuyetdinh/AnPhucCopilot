FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 1: Production Dependencies Installation
FROM base AS prod-deps

WORKDIR /app
COPY pnpm-lock.yaml /app/
COPY pnpm-workspace.yaml /app/
COPY .npmrc /app/

# Fetch production dependencies
RUN pnpm fetch --prod

# Stage 2: Build
FROM prod-deps AS builder

WORKDIR /app
COPY . /app
# Install all dependencies for build
RUN pnpm install
# Generate Prisma Client
RUN pnpm add prisma
RUN pnpm exec prisma generate
# Build the Next.js application
RUN pnpm run build

# Stage 3: Final Runner Image
FROM base AS runner

# Install OpenSSL and other required dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml /app/pnpm-workspace.yaml

# Copy production dependencies and built files
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public

# Copy Prisma schema and migration files
COPY --from=builder /app/prisma /app/prisma

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Expose the port your application is using
EXPOSE 3000

# Set the environment variables for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a script to handle startup
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Use the entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]