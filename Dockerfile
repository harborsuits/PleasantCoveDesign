# Multi-step Node build for Pleasant Cove Design
FROM node:20-bullseye-slim as base
WORKDIR /app

# system deps for node-gyp/esbuild just in case
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 build-essential ca-certificates git \
 && rm -rf /var/lib/apt/lists/*

# copy manifests first for clean layer caching
# add a cache-buster arg you can set in Railway
ARG BUILD_ID
ENV VITE_BUILD_ID=$BUILD_ID
COPY admin-ui/package*.json ./admin-ui/
COPY server/package*.json ./server/
COPY packages/embed/package*.json ./packages/embed/

# install deps
RUN cd admin-ui && npm ci --no-fund --no-audit
RUN cd server && npm ci --no-fund --no-audit
RUN cd packages/embed && npm ci --no-fund --no-audit

# copy sources
COPY admin-ui ./admin-ui
COPY server ./server
COPY packages/embed ./packages/embed

# ---------- build admin ----------
WORKDIR /app/admin-ui
# print versions + fail with full logs
RUN node -v && npm -v
# if build fails, dump any npm logs and vite output
RUN npm run build --loglevel=verbose \
 || (echo '---- NPM LOGS ----' && ls -la /root/.npm/_logs/ && cat /root/.npm/_logs/* || true && exit 1)

# ---------- build embed ----------
WORKDIR /app/packages/embed
RUN node -v && npm -v
RUN npm run build --loglevel=verbose \
 || (echo '---- NPM LOGS ----' && ls -la /root/.npm/_logs/ && cat /root/.npm/_logs/* || true && exit 1)

# ---------- stage assets into server ----------
WORKDIR /app
RUN rm -rf server/public/admin && mkdir -p server/public/admin
RUN cp -a admin-ui/dist/. server/public/admin/
RUN rm -rf server/public/embed && mkdir -p server/public/embed && cp -a packages/embed/dist/. server/public/embed/

# ---------- build server ----------
WORKDIR /app/server
RUN npm run build --loglevel=verbose \
 || (echo '---- NPM LOGS ----' && ls -la /root/.npm/_logs/ && cat /root/.npm/_logs/* || true && exit 1)

# ---------- runtime ----------
FROM node:20-bullseye-slim
ENV NODE_ENV=production
WORKDIR /app/server
COPY --from=base /app/server/dist ./dist
COPY --from=base /app/server/package*.json ./
COPY --from=base /app/server/public ./public
RUN npm ci --omit=dev --no-fund --no-audit
EXPOSE 3000
CMD ["npm","run","start"]
