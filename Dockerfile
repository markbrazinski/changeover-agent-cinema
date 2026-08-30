# Stage 1: Build static web bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build dist bundle
COPY index.html tsconfig.json vite.config.ts ./
COPY src/ ./src/
COPY public/ ./public/

RUN npm run build

# Stage 2: Serve using Nginx unprivileged container
FROM nginxinc/nginx-unprivileged:1.25-alpine

# Copy Nginx template configuration (envsubst automatically substitutes $PORT at startup)
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
