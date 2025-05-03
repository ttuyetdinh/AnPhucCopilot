FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 1: Production Dependencies Installation
FROM base AS prod-deps

COPY pnpm-lock.yaml /app/
COPY pnpm-workspace.yaml /app/
WORKDIR /app
RUN pnpm fetch --prod # Fetch production dependencies

# Stage 2: Build
FROM prod-deps AS builder

COPY . /app
RUN pnpm install --frozen-lockfile # Install all dependencies for build
# Generate Prisma Client
RUN pnpm prisma generate
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
