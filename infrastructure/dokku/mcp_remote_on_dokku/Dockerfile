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
#       -e NGINX_ACCESS_TOKEN="secret_key__please_change" \
#       -p 80:443 -p 443:443 -i -t mcp
#
# Run (detached):
#   docker run \
#       -e NGINX_ACCESS_TOKEN="secret_key__please_change" \
#       -p 80:443 -p 443:443 -i -t -d mcp
#
# If you need a specific version of Node you can specify this build var
ARG NODE_VERSION="lts"
FROM node:$NODE_VERSION-alpine

ENV NODE_VERSION=${NODE_VERSION}

# NPM MCP server package
ARG REMOTE_MCP_URL=""
ENV REMOTE_MCP_URL=${REMOTE_MCP_URL}

# Extra args to send to NPM MCP Server
# https://www.npmjs.com/package/mcp-remote
ARG REMOTE_MCP_EXTRA_ARGS=""
ENV REMOTE_MCP_EXTRA_ARGS=${REMOTE_MCP_EXTRA_ARGS}

RUN npm install supergateway@latest -g
RUN npm install mcp-remote@latest -g

# Install dependencies
RUN apk add dumb-init nginx openssl gettext

# Copy nginx configuration and startup script
COPY infrastructure/dokku/nginx.conf /etc/nginx/nginx.conf
COPY infrastructure/dokku/mcp_remote_on_dokku/startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/startup.sh
RUN mkdir -p /etc/ssl/certs /etc/ssl/private

ENTRYPOINT ["/usr/local/bin/startup.sh"]

# Nginx will listen on port 5000
EXPOSE 5000