# Multi-step Node build for Pleasant Cove Design
FROM node:20-alpine AS base
WORKDIR /app

# -----------------------------
# Admin UI dependencies (copy lockfiles first)
# -----------------------------
COPY admin-ui/package-lock.json ./admin-ui/package-lock.json
COPY admin-ui/package.json ./admin-ui/package.json
RUN cd admin-ui && npm ci --include=dev --no-fund --no-audit

# -----------------------------
# Server dependencies (copy lockfiles first)
# -----------------------------
COPY server/package-lock.json ./server/package-lock.json
COPY server/package.json ./server/package.json
RUN cd server && npm ci --include=dev --no-fund --no-audit

# -----------------------------
# Copy sources
# -----------------------------
COPY admin-ui ./admin-ui
COPY server ./server

# -----------------------------
# Build admin-ui
# -----------------------------
WORKDIR /app/admin-ui
RUN npm run build --loglevel=verbose

# -----------------------------
# Stage admin-ui into server
# -----------------------------
WORKDIR /app
RUN mkdir -p server/public/admin && rm -rf server/public/admin/*
RUN cp -r admin-ui/dist/* server/public/admin/

# -----------------------------
# Build server
# -----------------------------
WORKDIR /app/server
RUN npm run build --loglevel=verbose || (echo '--- NPM DEBUG LOG ---' && ls -la /root/.npm/_logs/ || true && exit 1)

# -----------------------------
# Runtime image
# -----------------------------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app/server

# Copy built server and staged public assets
COPY --from=base /app/server/dist ./dist
COPY --from=base /app/server/public ./public

# Install only prod deps for server runtime
COPY server/package-lock.json ./package-lock.json
COPY server/package.json ./package.json
RUN npm ci --omit=dev --no-fund --no-audit

EXPOSE 3000
CMD ["node", "dist/index.js"]
