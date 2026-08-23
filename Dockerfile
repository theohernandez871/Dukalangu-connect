# Hotspot Billing Agent — Docker image
FROM node:20-alpine

WORKDIR /app

# Sakinisha dependencies
COPY package.json ./
RUN npm install --omit=dev

# Nakili source na build
COPY tsconfig.json ./
COPY src ./src
RUN npm install typescript && npx tsc && npm prune --omit=dev

# Endesha agent
CMD ["node", "dist/index.js"]
