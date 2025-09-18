# Multi-stage build for ZenMCP with Supergateway integration
FROM python:3.11-slim AS builder

# Build stage: Install dependencies and build ZenMCP
WORKDIR /build

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        git \
        ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Clone ZenMCP repository
RUN git clone https://github.com/BeehiveInnovations/zen-mcp-server.git /build/zen-mcp-server

WORKDIR /build/zen-mcp-server

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Runtime stage: Combine ZenMCP with Supergateway infrastructure
FROM node:lts-alpine AS runtime

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    nginx \
    supervisor \
    ca-certificates

# Install Supergateway globally
RUN npm install -g supergateway

# Install dependencies
RUN apk add --no-cache dumb-init gettext curl bash

# Copy ZenMCP application
COPY --from=builder /build/zen-mcp-server /app/zen-mcp-server

# Install Python dependencies in Alpine
RUN pip install --no-cache-dir --break-system-packages mcp google-genai openai pydantic uvicorn

# Copy infrastructure files
COPY infrastructure/dokku/nginx.conf /etc/nginx/nginx.conf
COPY zen-mcp-startup.sh /usr/local/bin/startup.sh

# Set up directories and permissions
RUN mkdir -p /var/log/supervisor /var/run/nginx /tmp && \
    chmod +x /usr/local/bin/startup.sh

# Environment variables
ENV PYTHONPATH="/app/zen-mcp-server"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV SUPERGATEWAY_PORT=8000
ENV NGINX_PORT=5000
ENV NPM_MCP="python"
ENV NPM_MCP_ARGS="/app/zen-mcp-server/server.py"
ENV ACCESS_TOKEN=""
ENV SUPERGATEWAY_EXTRA_ARGS="--stateful"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f -H "Authorization: Bearer ${ACCESS_TOKEN}" http://localhost:5000/mcp || exit 1

# Only expose Nginx port - Supergateway port 8000 remains internal
EXPOSE 5000

# Use bash startup script
CMD ["/bin/bash", "/usr/local/bin/startup.sh"]