FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src

# Build
RUN npm run build

# Create uploads directory
RUN mkdir -p /data/uploads

# Run
EXPOSE 3000
CMD ["node", "dist/index.js"]
