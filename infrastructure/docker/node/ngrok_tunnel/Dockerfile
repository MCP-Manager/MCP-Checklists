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
#       -e NGROK_URL="localhost-1-syncado.ngrok.app" \
#       -e NGROK_AUTHTOKEN="your_ngrok_auth_token" \
#       -e NGROK_BASIC_AUTH="user:password" \
#       -i -t mcp
#
# Run (detached):
#   docker run \
#       -e NGROK_URL="localhost-1-syncado.ngrok.app" \
#       -e NGROK_AUTHTOKEN="your_ngrok_auth_token" \
#       -e NGROK_BASIC_AUTH="user:password" \
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
# If you need a specific version of Node you can specify this build var
ENV NPM_MCP=${NPM_MCP}
ENV NPM_MCP_ARGS=${NPM_MCP_ARGS}
ENV SUPERGATEWAY_EXTRA_ARGS=${SUPERGATEWAY_EXTRA_ARGS}

## Install NPM packages
RUN npm install supergateway@latest -g
RUN npm install $NPM_MCP@latest -g

# Install dependencies
RUN apt update && apt install dumb-init curl -y

#
# NGrok
#
RUN curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
    | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
    && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
    | tee /etc/apt/sources.list.d/ngrok.list \
    && apt update \
    && apt install ngrok && \
    # smoke test for ngrok
    ngrok --version

ENTRYPOINT [ \
    "bash", \
    "-c", \
    "ngrok http 8000 --url $NGROK_URL --authtoken $NGROK_AUTHTOKEN --basic-auth $NGROK_BASIC_AUTH \
    # Start Supergateway to proxy stdio from $NPM_MCP as a streamableHttp server
    & dumb-init npx supergateway --port 8000 --outputTransport streamableHttp $SUPERGATEWAY_EXTRA_ARGS --stdio \"npx --no $NPM_MCP $NPM_MCP_ARGS\"" \
]
