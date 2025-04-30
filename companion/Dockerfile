# Use multi-stage build for smaller image
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Final stage
FROM node:18-alpine

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/logs ./logs

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3020

# Expose port
EXPOSE 3020

# Start the server
CMD ["npm", "start"] 