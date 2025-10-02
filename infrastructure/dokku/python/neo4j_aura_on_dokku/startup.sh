#!/bin/sh
set -e

# Generate self-signed SSL certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj '/C=US/ST=State/L=City/O=Organization/CN=localhost'

# Replace environment variables in nginx config
envsubst '$ACCESS_TOKEN' < /etc/nginx/nginx.conf > /tmp/nginx.conf && mv /tmp/nginx.conf /etc/nginx/nginx.conf

# Start nginx in background
nginx -g 'daemon on;'

# Start Neo4j MCP server with native HTTP transport on port 8000 (default)
exec dumb-init uvx mcp-neo4j-aura-manager@0.4.3 \
    --transport http \
    --server-host 0.0.0.0 \
    --server-path /mcp \
    --client-id "$NEO4J_CLIENT_ID" \
    --client-secret "$NEO4J_CLIENT_SECRET"