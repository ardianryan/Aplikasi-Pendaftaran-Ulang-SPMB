# Use the official Node image
FROM node:20-slim AS base
WORKDIR /usr/src/app

# Install dependencies for Puppeteer (Chromium)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install dependencies
FROM base AS install
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and build (if needed)
FROM base AS release
COPY --from=install /usr/src/app/node_modules node_modules
COPY . .

# Expose the port
EXPOSE 3000

# Run the app
# Use tsx for direct execution or build to JS first
# For production, it's better to build to JS, but for now we follow the user's request for "node js saja"
# and we'll use tsx for simplicity in this transition if they want to run .ts files directly.
# However, the "start" script in package.json is "node src/index.ts" which expects JS if not using a loader.
# I'll update it to use tsx in start for now if they aren't building, 
# or suggest building.
# Actually, I'll update package.json's start to use tsx as well for direct .ts execution in container.
ENTRYPOINT [ "npx", "tsx", "src/index.ts" ]
