#!/bin/bash
set -e

# Replace environment variables in nginx config
envsubst '${ACCESS_TOKEN}' < /etc/nginx/nginx.conf > /tmp/nginx.conf && mv /tmp/nginx.conf /etc/nginx/nginx.conf

# Start nginx in background
nginx -g 'daemon on;'

# Start Node-based mcp-proxy to proxy ZenMCP as a streamableHttp server on port 8000
exec dumb-init npx mcp-proxy --port 8000 $MCP_PROXY_EXTRA_ARGS python /app/zen-mcp-server/server.py