# Use the official Bun image
FROM oven/bun:latest AS base
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
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install

# Install production dependencies
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --production

# Copy node_modules and source code
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY . .

# Expose the port
EXPOSE 3000

# Run the app
ENTRYPOINT [ "bun", "run", "src/index.ts" ]
