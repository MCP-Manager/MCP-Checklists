#
# Build:
#   docker build \
#       --build-arg NPM_MCP="@modelcontextprotocol/server-filesystem" \
#       --build-arg NPM_MCP_ARGS="/home" \
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

# NPM MCP server package
ARG NPM_MCP=""
# Extra args to send to NPM MCP Server
ARG NPM_MCP_ARGS=""
# Set to --stateful for stateful MCP servers, otherwise leave blank
ARG SUPERGATEWAY_EXTRA_ARGS="--stateful"
ENV NPM_MCP=${NPM_MCP}
ENV NPM_MCP_ARGS=${NPM_MCP_ARGS}
ENV NODE_VERSION=${NODE_VERSION}
ENV SUPERGATEWAY_EXTRA_ARGS=${SUPERGATEWAY_EXTRA_ARGS}

RUN npm install supergateway@latest -g
RUN npm install $NPM_MCP@latest -g

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
    --no-install-recommends

RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --no-default-keyring --keyring gnupg-ring:/etc/apt/trusted.gpg.d/google.gpg --import && \
    chmod 644 /etc/apt/trusted.gpg.d/google.gpg && \
    echo "deb https://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list

# Update package lists again and install Google Chrome
RUN apt-get update && apt-get install -y google-chrome-stable

# Copy nginx configuration and startup script
COPY infrastructure/dokku/nginx.conf /etc/nginx/nginx.conf
COPY infrastructure/docker/node/startup.sh /usr/local/bin/startup.sh
COPY infrastructure/docker/node/nginx_proxy_puppeteer/setup_virtual_display_then_run.sh /usr/local/bin/setup_virtual_display_then_run.sh
RUN chmod +x /usr/local/bin/setup_virtual_display_then_run.sh
RUN chmod +x /usr/local/bin/startup.sh
RUN mkdir -p /etc/ssl/certs /etc/ssl/private

ENTRYPOINT ["/usr/local/bin/setup_virtual_display_then_run.sh", "/usr/local/bin/startup.sh"]

# Nginx will listen on port 5000
EXPOSE 5000