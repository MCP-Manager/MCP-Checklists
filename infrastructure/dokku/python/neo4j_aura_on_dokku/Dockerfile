#
# Neo4j MCP Server Dockerfile
# Hosts mcp-neo4j-aura-manager via uvx with Supergateway and Nginx reverse proxy
#
# Build:
#   docker build -t mcp-neo4j .
#
# Run (shell):
#   docker run \
#       -e ACCESS_TOKEN="secret_key__please_change" \
#       -e NEO4J_CLIENT_ID="your-client-id" \
#       -e NEO4J_CLIENT_SECRET="your-client-secret" \
#       -p 80:5000 -p 443:5000 -i -t mcp-neo4j
#
# Run (detached):
#   docker run \
#       -e ACCESS_TOKEN="secret_key__please_change" \
#       -e NEO4J_CLIENT_ID="your-client-id" \
#       -e NEO4J_CLIENT_SECRET="your-client-secret" \
#       -p 80:5000 -p 443:5000 -i -t -d mcp-neo4j
#
FROM python:3.11-alpine

# Install system dependencies
RUN apk add --no-cache dumb-init nginx openssl gettext

# Install uv / uvx for Python based MCP servers
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy nginx configuration and startup script
COPY infrastructure/dokku/nginx.conf /etc/nginx/nginx.conf
COPY infrastructure/dokku/python/neo4j_on_dokku/startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/startup.sh
RUN mkdir -p /etc/ssl/certs /etc/ssl/private

# Environment variables for Neo4j MCP
ENV NEO4J_CLIENT_ID=""
ENV NEO4J_CLIENT_SECRET=""

ENTRYPOINT ["/usr/local/bin/startup.sh"]

# Nginx will listen on port 443 (HTTPS)
EXPOSE 5000