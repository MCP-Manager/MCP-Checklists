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
#       -e PINGGY_ACCESS_TOKEN="localhost-1-syncado.ngrok.app" \
#       -e PINGGY_BEARER_TOKEN="your_ngrok_auth_token" \
#       -i -t mcp
#
# Run (detached):
#   docker run \
#       -e PINGGY_ACCESS_TOKEN="localhost-1-syncado.ngrok.app" \
#       -e PINGGY_BEARER_TOKEN="your_ngrok_auth_token" \
#       -i -t -d mcp
#
# If you need a specific version of Node you can specify this build var
ARG NODE_VERSION="lts"
FROM node:$NODE_VERSION-slim AS package

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

## Use Supergateway to proxy stdio from the local MCP server as a streamableHttp server
RUN npm install supergateway@latest -g
RUN npm install $NPM_MCP@latest -g

# Update & install essential dependencies
RUN apt update && apt install dumb-init curl -y

#
# Pinggy
#
RUN mkdir -p /opt/pinggy && \
    curl -sSL https://s3.ap-south-1.amazonaws.com/public.pinggy.binaries/cli/v0.2.5/linux/amd64/pinggy \
    | tee /opt/pinggy/pinggy >/dev/null \
    && chmod +x /opt/pinggy/pinggy \
    && ln -s /opt/pinggy/pinggy /usr/bin/pinggy && \
    # smoke test for pinggy
    pinggy --version

ENTRYPOINT [ \
    "bash", \
    "-c", \
    # Start Pinggy in the background to expose the MCP server
    "pinggy -p 443 -R0:localhost:8000 -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -t $PINGGY_ACCESS_TOKEN+force@pro.pinggy.io \"k:$PINGGY_BEARER_TOKEN\" x:https \
    # Start Supergateway to proxy stdio from $NPM_MCP as a streamableHttp server
    & dumb-init npx supergateway --port 8000 --outputTransport streamableHttp $SUPERGATEWAY_EXTRA_ARGS --stdio \"npx --no $NPM_MCP $NPM_MCP_ARGS\"" \
]
