# ---------------- base ----------------
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
# toolchain for native modules (e.g. sqlite3)
RUN apk add --no-cache python3 make g++ libc6-compat

# --- SERVER deps first (better caching) ---
# copy ONLY manifests so npm install can cache
COPY archive/Pleasantcovedesign-main/package*.json ./server/
WORKDIR /app/server

# noisy logs so we can see errors; tolerate peer dep issues
ENV NPM_CONFIG_LOGLEVEL=verbose
RUN --mount=type=cache,target=/root/.npm \
    npm config set fund false && npm config set audit false && \
    (if [ -f package-lock.json ]; then \
        npm ci --no-audit --no-fund --legacy-peer-deps; \
     else \
        npm install --no-audit --no-fund --legacy-peer-deps; \
     fi) || ( \
       echo '---- npm debug log (if any) ----' && \
       ls -la /root/.npm/_logs || true && \
       cat /root/.npm/_logs/*-debug-0.log || true && \
       exit 1 \
    )

# now copy the rest of the server source
COPY archive/Pleasantcovedesign-main/ ./

# ensure /admin exists (you can replace with real UI later)
RUN mkdir -p /app/server/public/admin && \
    printf '<!doctype html><meta charset="utf-8"><title>Pleasant Cove Admin</title><h1>Admin UI deployed later</h1>' \
    > /app/server/public/admin/index.html

# runtime data path (your Railway volume mounts here)
RUN mkdir -p /data
ENV DATA_DIR=/data
ENV DB_PATH=/data/pleasantcove.db

# start with ts-node (no separate build step)
# if your project isn't ESM, change to:  node -r ts-node/register src/index.ts
# (needs ts-node & typescript in devDependencies)
EXPOSE 3000
CMD ["node","--loader","ts-node/esm","server/index.ts"]
