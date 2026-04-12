FROM node:20-alpine

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# Install Docker CLI so the server can trigger docker builds for APK
RUN apk add --no-cache docker-cli

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies inside the container
RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Build TypeScript
RUN pnpm run build

# Make entrypoint executable
RUN chmod +x ./entrypoint.sh

EXPOSE 5000

# Entrypoint: runs db:push, db:seed, then starts the server
ENTRYPOINT ["/app/entrypoint.sh"]
