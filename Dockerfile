FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy web server and frontend
COPY web/ ./web/

# Copy package.json (needed for module resolution)
COPY package.json ./

# Cloud Run sets PORT=8080 automatically
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "web/server.mjs"]
