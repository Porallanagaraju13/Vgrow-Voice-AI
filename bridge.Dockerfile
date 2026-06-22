# --- Base Node ---
FROM node:20-alpine AS base
WORKDIR /app

# --- Dependencies ---
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# --- Source Code ---
COPY server/ ./server/

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Run the Twilio Bridge
CMD ["node", "server/twilio-bridge.js"]
