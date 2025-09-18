# MCP-Checklists Claude Context

## Repository Purpose
This repository helps users self-host STDIO MCP servers remotely using a secure, containerized approach. It provides infrastructure and tooling to deploy MCP servers accessible over HTTPS with token-based authentication.

## Core Architecture

### Components
1. **Supergateway**: Converts STDIO-based MCPs into StreamableHTTP endpoints (port 8000 internally)
2. **Nginx Reverse Proxy**: Provides secure HTTPS exposure with token-based authentication (port 5000, proxies to 8000)
3. **Dokku**: Docker-based Platform-as-a-Service for deployment and management
4. **Let's Encrypt**: Automatic SSL certificate management

### Security Model
- Token-based authentication via `Authorization: Bearer {ACCESS_TOKEN}` headers
- HTTPS encryption handled by Dokku's external Nginx proxy (agents don't need to configure SSL)
- Container-internal traffic can flow unencrypted (Dokku terminates SSL before routing to containers)
- Nginx proxy filtering requests before they reach the MCP server
- Isolated Docker containers for each MCP deployment

### Key Files and Patterns
Essential reference implementations:
- `infrastructure/dokku/node/nginx_proxy_on_dokku/Dockerfile`: Complete working example
- `infrastructure/docker/node/startup.sh`: Correct initialization sequence
- `infrastructure/dokku/nginx.conf`: Dokku-compatible Nginx configuration

**Non-negotiable port configuration**:
- Supergateway: port 8000 internally
- Nginx: listens on port 5000, proxies to port 8000

**Required Supergateway command structure**:
```bash
npx supergateway --port 8000 --outputTransport streamableHttp $SUPERGATEWAY_EXTRA_ARGS --stdio "npx --no $NPM_MCP $NPM_MCP_ARGS"
```

## Environment Configuration
- `.env`: SSH credentials, MCP configuration, security tokens
- `NPM_MCP` and `NPM_MCP_ARGS`: Simple MCP server definitions
- `ACCESS_TOKEN`: Securing MCP endpoints
- Service connection strings automatically provided by Dokku plugins (`DATABASE_URL`, `REDIS_URL`)

## Dockerfile Customization Rules

### MANDATORY: Study Reference Implementation First
Before creating/modifying any MCP Dockerfile, read the reference files listed above.

### Core Principles
1. **Preserve Security Architecture**: Use existing Nginx config, maintain token-based auth (SSL handled by Dokku)
2. **Maintain Container Structure**: Multi-stage builds, non-root user, official base images
3. **Preserve Supergateway Integration**: Never bypass, always use port 8000, maintain `--outputTransport streamableHttp`

### SSL/TLS Handling
**Important**: Agents do not need to configure SSL certificates or HTTPS within containers. Dokku automatically:
- Sets up an external Nginx proxy with Let's Encrypt SSL certificates
- Terminates SSL/TLS encryption at the Dokku level
- Routes decrypted HTTP traffic to containers on port 5000
- Container-internal communication (Nginx → Supergateway) uses unencrypted HTTP

### Nginx Configuration Requirements
When agents create custom nginx configurations instead of copying from `infrastructure/dokku/nginx.conf`, the configuration **MUST** include these security properties:

**Required Authorization Check**:
```nginx
if ($http_authorization != "Bearer ${ACCESS_TOKEN}") {
    return 401 "Unauthorized: Invalid or missing bearer token";
}
```

**Required Proxy Configuration**:
```nginx
server {
    listen 5000;
    location / {
        # Authorization check (see above)

        # Streaming optimizations
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Long timeouts for streaming
        proxy_connect_timeout 1d;
        proxy_send_timeout 1d;
        proxy_read_timeout 1d;

        # Proxy to Supergateway
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**CRITICAL SECURITY REQUIREMENTS**:
- Never skip the authorization header validation. All traffic must be authenticated with the Bearer token before reaching the MCP server.
- **NEVER expose any ports other than port 5000 (Nginx)**. Port 8000 (Supergateway) and any other internal ports must remain internal to the container.
- **ALL traffic entering the container must pass through Nginx and be authorized**. Direct access to Supergateway or MCP servers bypasses security and is forbidden.

### Dockerfile Output Location
**IMPORTANT**: Always create/overwrite the `Dockerfile` in the root directory of the project. The deployment commands (`pnpm build`, `pnpm create`, etc.) depend on finding the Dockerfile at the project root. It is acceptable and expected to overwrite any existing Dockerfile.

### Required Dockerfile Sections
```dockerfile
# Build stage (if needed)
FROM node:lts-alpine AS builder

# Runtime stage
FROM node:lts-alpine AS runtime

# Install Supergateway
RUN npm install -g supergateway

# Only expose Nginx port - port 8000 must remain internal
EXPOSE 5000
```

### Environment Variables
Essential variables to preserve:
- `ACCESS_TOKEN`: Security token
- `SUPERGATEWAY_PORT`: Internal port (default: 8000)
- `NGINX_PORT`: Proxy port (default: 5000)

Custom MCP variables:
- `CUSTOM_BUILD_COMMAND`, `CUSTOM_DEPENDENCIES`, `CUSTOM_SETUP_SCRIPT`
- `MCP_WORKING_DIR`, `MCP_CONFIG_FILE`

## Docker Compose to Dokku Conversion

**Important**: Dokku does not support Docker Compose. For multi-service applications:

1. **Identify Services**: Analyze docker-compose.yml for external services
2. **Create Dokku Services**: Use service plugins instead of containers:
   ```bash
   dokku postgres:create myapp-db
   dokku redis:create myapp-cache
   dokku postgres:link myapp-db myapp
   dokku redis:link myapp-cache myapp
   ```
3. **Update Environment Variables**: Replace hardcoded connections with Dokku-provided variables
4. **Convert Main App**: Keep only application logic in Dockerfile

Common service plugins: postgres, mysql, mongo, redis, memcached, rabbitmq, elasticsearch, minio

## Development Workflow

### Local Testing (Required)
**MANDATORY**: After generating a Dockerfile, agents must test the container locally before deployment.

1. **Build the container**: `pnpm build`
2. **Start the container**: `pnpm start` (maps host ports 80 and 443 to container port 5000)
3. **Test MCP endpoint** using both HTTP and HTTPS (the container accepts both):
   ```bash
   # Test via HTTP (port 80)
   curl -X POST http://localhost/mcp \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"Test","version":"1.0.0"}}}'

   # Test via HTTPS (port 443)
   curl -k -X POST https://localhost/mcp \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"Test","version":"1.0.0"}}}'
   ```
4. **Verify successful response**: Both tests should return a valid JSON-RPC response from the MCP server
5. **Stop the container**: `pnpm stop`
6. **Deploy if tests pass**: `pnpm create`

**Port Mapping**: When `pnpm start` runs, host ports 80 and 443 are mapped to container port 5000, allowing testing via both HTTP and HTTPS endpoints.

### Deployment Sequence
```bash
# 1. Create services first
dokku postgres:create service-name

# 2. Deploy application
pnpm create

# 3. Link services
dokku postgres:link service-name app-name

# 4. Set additional config
dokku config:set app-name KEY=value
```

## Security Requirements
- **Always** create and use non-root user
- **Never** expose additional ports beyond 5000 (Nginx proxy port)
- **Always** use read-only root filesystem when possible
- **Never** store secrets in image layers
- **Always** ensure internal communication uses localhost
- **CRITICAL**: All external traffic must be filtered through Nginx authorization before reaching any internal services
- **CRITICAL**: Port 8000 (Supergateway) and any MCP-specific ports must never be directly accessible from outside the container

## Common Patterns

### Pre-built Binary MCP
```dockerfile
COPY --from=builder /app/mcp-server /usr/local/bin/mcp-server
RUN chmod +x /usr/local/bin/mcp-server
```

### Script-based MCP
```dockerfile
COPY custom-mcp-start.sh /usr/local/bin/custom-mcp-start.sh
RUN chmod +x /usr/local/bin/custom-mcp-start.sh
ENV NPM_MCP="/usr/local/bin/custom-mcp-start.sh"
```

### Configuration-driven MCP
```dockerfile
COPY config/ /app/config/
ENV MCP_CONFIG_FILE="/app/config/mcp-config.json"
ENV NPM_MCP_ARGS="--config=${MCP_CONFIG_FILE}"
```

## MCP Endpoint Structure
- Accessible at: `https://app-name.domain.com/mcp`
- Requires: `Authorization: Bearer {ACCESS_TOKEN}`
- Supports MCP protocol version 2025-03-26

## Debugging Commands
```bash
# Check container status
pnpm ssh dokku ps:report app-name

# View logs
pnpm ssh dokku logs app-name -t

# Execute shell in container
pnpm ssh dokku enter app-name
```

## Target Use Cases
Complex MCPs requiring:
- Multi-step build processes
- Custom dependencies beyond npm/pip/uvx
- Configuration file generation
- Environment-specific setup
- Custom startup sequences
- Integration with external services/databases
- Compilation from source code
- Custom binary installation