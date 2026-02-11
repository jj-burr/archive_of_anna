FROM node:20-alpine

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy package files and install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source code
COPY index.js ./
COPY src/ ./src/
COPY web/ ./web/

# Create downloads directory writable by appuser
RUN mkdir -p /app/downloads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["node", "web/server.js"]
