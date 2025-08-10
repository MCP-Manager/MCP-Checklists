#!/bin/sh
set -e

# Generate self-signed SSL certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj '/C=US/ST=State/L=City/O=Organization/CN=localhost'

# Replace environment variables in nginx config
envsubst '$NGINX_ACCESS_TOKEN' < /etc/nginx/nginx.conf > /tmp/nginx.conf && mv /tmp/nginx.conf /etc/nginx/nginx.conf

# Start nginx in background
nginx -g 'daemon on;'

# Start Supergateway to proxy stdio from $NPM_MCP as a streamableHttp server on port 8000
exec dumb-init npx supergateway --port 8000 --outputTransport streamableHttp $SUPERGATEWAY_EXTRA_ARGS --stdio "npx --no $NPM_MCP $NPM_MCP_ARGS"