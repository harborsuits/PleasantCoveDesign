# ---------- base image with build tools ----------
FROM node:20-alpine AS base
WORKDIR /app
# tools for node-gyp/native deps (bcrypt, sharp, sqlite3, etc)
RUN apk add --no-cache python3 make g++

# ---------- UI (conditional) ----------
FROM base AS ui
WORKDIR /app/ui
# copy the whole UI dir (if it exists in the repo)
COPY archive/lovable-ui-integration/ ./
# if package.json exists, build; otherwise create a tiny dist so server can serve /admin
RUN if [ -f package.json ]; then \
      echo "🔧 UI: package.json found -> installing & building" && \
      if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
      else npm install --no-audit --no-fund --legacy-peer-deps; fi && \
      npm run build; \
    else \
      echo "⚠️ UI: No package.json -> skipping UI build, creating placeholder dist" && \
      mkdir -p dist && \
      printf '<!doctype html><meta charset="utf-8"><title>Pleasant Cove Admin</title><h1>Admin UI not bundled in this build</h1>' > dist/index.html; \
    fi

# ---------- server build ----------
FROM base AS server
WORKDIR /app/server
# copy server source first
COPY archive/Pleasantcovedesign-main/ ./
# install server deps
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund --legacy-peer-deps; \
    fi
# place built UI where Express serves it (adjust if your server uses a different path)
RUN mkdir -p public/admin
COPY --from=ui /app/ui/dist ./public/admin
# build server (ts -> dist)
RUN npm run build

# ---------- runtime (slim) ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Ensure data directory exists for persistent storage
RUN mkdir -p /data
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
