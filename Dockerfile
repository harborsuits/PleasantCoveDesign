# ---------- base image with build tools ----------
FROM node:20-alpine AS base
WORKDIR /app
# tools for node-gyp/native deps (bcrypt, sharp, sqlite3, etc)
RUN apk add --no-cache python3 make g++

# ---------- UI build ----------
FROM base AS ui
WORKDIR /app/ui
# copy only manifests first for better caching
COPY archive/lovable-ui-integration/package*.json ./
# install (use ci if lock present; otherwise fallback)
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund --legacy-peer-deps; \
    fi
# copy the rest and build
COPY archive/lovable-ui-integration/ ./
# (optional) pass build-time API endpoints
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
RUN npm run build

# ---------- server build ----------
FROM base AS server
WORKDIR /app/server
# copy only manifests for caching
COPY archive/Pleasantcovedesign-main/package*.json ./
# install dev deps for build
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund --legacy-peer-deps; \
    fi
# copy server source
COPY archive/Pleasantcovedesign-main/ ./
# copy built UI into server's public path used by Express
# adjust this path if your server serves /admin from a different folder
RUN mkdir -p public/admin
COPY --from=ui /app/ui/dist ./public/admin
# build server (ts -> dist)
RUN npm run build

# ---------- runtime (slim) ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# copy package files for prod install
COPY archive/Pleasantcovedesign-main/package*.json ./
# install only prod deps
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --no-audit --no-fund; \
    else \
      npm install --omit=dev --no-audit --no-fund --legacy-peer-deps; \
    fi
# copy built artifacts
COPY --from=server /app/server/dist ./dist
COPY --from=server /app/server/public ./public
# non-root user (optional)
RUN addgroup -S nodejs && adduser -S node -G nodejs
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
