FROM node:20-alpine

# Install openssl for Prisma CLI engine compatibility
RUN apk add --no-cache openssl curl

WORKDIR /app

# Copy monorepo package manifests
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install root & workspace dependencies
RUN npm ci

# Copy shared package source
COPY packages/shared ./packages/shared
RUN npm run build --workspace=@peercode/shared

# Copy backend source & Prisma schema
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 4000

# Automated startup script: Run Prisma DB migrations then start dev server with live reload
CMD ["sh", "-c", "npx prisma db push && npm run dev"]
