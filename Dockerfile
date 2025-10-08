# ---------- base (Debian, not Alpine) ----------
FROM node:20-bullseye-slim AS base
WORKDIR /app
# build essentials + tini/curl
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ tini curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# ---------- ui (optional) ----------
FROM base AS ui
WORKDIR /app/ui
COPY archive/lovable-ui-integration/ ./
RUN if [ -f package.json ]; then \
      echo "UI: package.json found -> installing & building"; \
      if [ -f package-lock.json ]; then npm ci --no-audit --no-fund --legacy-peer-deps; \
      else npm install --no-audit --no-fund --legacy-peer-deps; fi && \
      npm run build; \
    else \
      echo "UI: no package.json -> placeholder"; \
      mkdir -p dist && printf '<!doctype html><title>Pleasant Cove Admin</title><h1>Admin UI not bundled in this build</h1>' > dist/index.html; \
    fi

# ---------- server build ----------
FROM base AS serverbuild
WORKDIR /app/server

# 1) copy manifests first for caching
COPY archive/Pleasantcovedesign-main/package*.json ./

ENV npm_config_legacy_peer_deps=true \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    npm_config_build_from_source=false

# 2) install deps (show debug if it fails)
RUN --mount=type=cache,target=/root/.npm \
    ( if [ -f package-lock.json ]; then npm ci --no-audit --no-fund --legacy-peer-deps; \
      else npm install --no-audit --no-fund --legacy-peer-deps; fi ) \
    || ( echo '----- npm debug log -----' && ls -lah /root/.npm/_logs || true \
       && cat /root/.npm/_logs/*-debug-*.log || true && exit 1 )

# 3) copy source and build
COPY archive/Pleasantcovedesign-main/ ./
RUN mkdir -p public/admin
COPY --from=ui /app/ui/dist ./public/admin
RUN npm run build

# ---------- runtime ----------
FROM node:20-bullseye-slim
RUN apt-get update && apt-get install -y --no-install-recommends tini curl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app
VOLUME ["/data"]
COPY --from=serverbuild /app/server ./
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD curl -fsS http://127.0.0.1:3000/health || exit 1
CMD ["tini","--","node","dist/index.js"]
