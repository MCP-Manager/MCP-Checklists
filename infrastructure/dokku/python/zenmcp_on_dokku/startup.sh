#!/bin/bash
set -e

# Replace environment variables in nginx config
envsubst '${ACCESS_TOKEN}' < /etc/nginx/nginx.conf > /tmp/nginx.conf && mv /tmp/nginx.conf /etc/nginx/nginx.conf

# Start nginx in background
nginx -g 'daemon on;'

# Start Supergateway to proxy ZenMCP as a streamableHttp server on port 8000
exec dumb-init npx supergateway --port 8000 --outputTransport streamableHttp $SUPERGATEWAY_EXTRA_ARGS --stdio "$NPM_MCP $NPM_MCP_ARGS"