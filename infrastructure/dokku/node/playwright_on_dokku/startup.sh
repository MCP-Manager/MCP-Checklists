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

# Verify Playwright browser installation at startup (fail fast if missing)
echo "Verifying Playwright browser installation..."
npx playwright install --dry-run

# Start Supergateway to proxy stdio from @playwright/mcp as a streamableHttp server on port 8000
exec dumb-init npx supergateway --port 8000 --outputTransport streamableHttp $SUPERGATEWAY_EXTRA_ARGS --stdio "npx @playwright/mcp@latest --headless --isolated --viewport-size 1280,720 --timeout-action 5000 --timeout-navigation 60000 --no-sandbox"
