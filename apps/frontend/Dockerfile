FROM node:20-alpine

# Install curl for healthcheck validation
RUN apk add --no-cache curl

WORKDIR /app

# Copy monorepo package manifests
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

# Install root & workspace dependencies
RUN npm ci

# Copy shared package source
COPY packages/shared ./packages/shared
RUN npm run build --workspace=@peercode/shared

# Copy frontend source
COPY apps/frontend ./apps/frontend

EXPOSE 3000

WORKDIR /app/apps/frontend

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
