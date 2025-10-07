# syntax=docker/dockerfile:1.6

# ---- UI build ----
FROM node:20-alpine AS ui
WORKDIR /app/ui
COPY archive/lovable-ui-integration/package*.json ./
RUN npm ci
COPY archive/lovable-ui-integration ./
RUN npm run build

# ---- Server build ----
FROM node:20-alpine AS server
WORKDIR /app/server
COPY archive/Pleasantcovedesign-main/package*.json ./
RUN npm ci
COPY archive/Pleasantcovedesign-main ./
# Place built UI where the server expects it (lovable-dist)
RUN mkdir -p ../lovable-dist
COPY --from=ui /app/ui/dist/ ../lovable-dist/
RUN npm run build

# ---- Runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# Bring over built server + UI assets
COPY --from=server /app/server/dist ./archive/Pleasantcovedesign-main/dist
COPY --from=server /app/lovable-dist ./lovable-dist
COPY --from=server /app/server/package*.json ./archive/Pleasantcovedesign-main/
RUN cd archive/Pleasantcovedesign-main && npm ci --omit=dev
EXPOSE 3000
CMD ["node","archive/Pleasantcovedesign-main/dist/index.js"]
