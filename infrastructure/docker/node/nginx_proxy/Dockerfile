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

# NPM MCP server package
ARG NPM_MCP=""
# Extra args to send to NPM MCP Server
ARG NPM_MCP_ARGS=""
# Set to --stateful for stateful MCP servers, otherwise leave blank
ARG SUPERGATEWAY_EXTRA_ARGS=""
ENV NPM_MCP=${NPM_MCP}
ENV NPM_MCP_ARGS=${NPM_MCP_ARGS}
ENV NODE_VERSION=${NODE_VERSION}
ENV SUPERGATEWAY_EXTRA_ARGS=${SUPERGATEWAY_EXTRA_ARGS}

RUN npm install supergateway@latest -g
RUN npm install $NPM_MCP@latest -g

# Install dependencies
RUN apk add dumb-init nginx openssl gettext

# Copy nginx configuration and startup script
COPY infrastructure/docker/nginx.conf /etc/nginx/nginx.conf
COPY infrastructure/docker/node/nginx_proxy/startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/startup.sh
RUN mkdir -p /etc/ssl/certs /etc/ssl/private

ENTRYPOINT ["/usr/local/bin/startup.sh"]

# Nginx will listen on port 443 (HTTPS)
EXPOSE 443