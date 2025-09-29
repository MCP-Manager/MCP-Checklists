#
# Build:
#   docker build \
#       --build-arg NODE_VERSION="lts" \
#       --build-arg SUPERGATEWAY_EXTRA_ARGS="--stateful" \
#        -t mcp .
#
# Run (shell):
#   docker run \
#       -e ACCESS_TOKEN="secret_key__please_change" \
#       -p 80:443 -p 443:443 -i -t mcp
#
# Run (detached):
#   docker run \
#       -e ACCESS_TOKEN="secret_key__please_change" \
#       -p 80:443 -p 443:443 -i -t -d mcp
#
# If you need a specific version of Node you can specify this build var
ARG NODE_VERSION="lts"
FROM node:$NODE_VERSION-slim

# Set to --stateful for stateful MCP servers, otherwise leave blank
ARG SUPERGATEWAY_EXTRA_ARGS=""
ENV NODE_VERSION=${NODE_VERSION}
ENV SUPERGATEWAY_EXTRA_ARGS=${SUPERGATEWAY_EXTRA_ARGS}

# Playwright-specific environment variables for better Docker compatibility
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Install Node-based mcp-proxy globally
RUN npm install -g mcp-proxy
RUN npm install @playwright/mcp@latest -g

# Install dependencies
# Update package lists and install necessary dependencies
RUN apt-get update && apt-get install -y \
    dumb-init \
    nginx \
    openssl \
    gettext \
    wget \
    gnupg \
    ca-certificates \
    libssl-dev \
    --no-install-recommends && \
    # Clean up to reduce image size
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Playwright browsers and dependencies
# First install the @playwright/mcp package to ensure we have the right version
RUN npx @playwright/mcp@latest --version || true
# Then install all required browsers with system dependencies
RUN npx playwright install --with-deps chrome
# Verify installation by checking browser binaries
#RUN npx playwright install-deps

# Copy nginx configuration and startup script
COPY infrastructure/dokku/nginx.conf /etc/nginx/nginx.conf
COPY infrastructure/dokku/node/playwright_on_dokku/startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/startup.sh
RUN mkdir -p /etc/ssl/certs /etc/ssl/private

ENTRYPOINT ["/usr/local/bin/startup.sh"]

# Nginx will listen on port 5000
EXPOSE 5000
