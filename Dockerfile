# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/app.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/views ./views

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodeuser && \
    chown -R nodeuser:nodejs /app

USER nodeuser

# Expose the port the app runs on
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["node", "app.js"]
