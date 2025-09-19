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
**IMPORTANT**: Always create/overwrite the `Dockerfile` in the root directory of the project. The deployment commands (`pnpm run build`, `pnpm run create`, etc.) depend on finding the Dockerfile at the project root. It is acceptable and expected to overwrite any existing Dockerfile.

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
2. **Install Required Service Plugins**: Each service type requires a plugin to be installed first
3. **Create Dokku Services**: Use service plugins instead of containers
4. **Update Environment Variables**: Replace hardcoded connections with Dokku-provided variables
5. **Convert Main App**: Keep only application logic in Dockerfile

### Service Plugin Installation

**DON'T**: Attempt to install unknown plugins yourself

**DO**: For common services, offer to install the plugin if you know the correct command:

**Common Service Plugins & Installation**:
```bash
# PostgreSQL
pnpm run ssh sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git

# Redis
pnpm run ssh sudo dokku plugin:install https://github.com/dokku/dokku-redis.git

# MySQL
pnpm run ssh sudo dokku plugin:install https://github.com/dokku/dokku-mysql.git

# MongoDB
pnpm run ssh sudo dokku plugin:install https://github.com/dokku/dokku-mongo.git

# Memcached
pnpm run ssh sudo dokku plugin:install https://github.com/dokku/dokku-memcached.git

# RabbitMQ
pnpm run ssh sudo dokku plugin:install https://github.com/dokku/dokku-rabbitmq.git

# Elasticsearch
pnpm run ssh sudo dokku plugin:install https://github.com/dokku/dokku-elasticsearch.git
```

**For other services**: Direct users to the official plugin directory:
```
For a complete list of available plugins, visit:
https://dokku.com/docs/community/plugins/

Find the plugin you need and follow the installation instructions.
```

### Service Creation Example
```bash
# After plugin is installed, create and link services:
pnpm run ssh dokku postgres:create myapp-db
pnpm run ssh dokku redis:create myapp-cache
pnpm run ssh dokku postgres:link myapp-db myapp
pnpm run ssh dokku redis:link myapp-cache myapp
```

## Prerequisites Verification

**MANDATORY**: Before any deployment attempt, verify all prerequisites are met. Future AI models must complete this checklist.

### Remote Server Prerequisites Checklist

**1. SSH Connection Verification**
```bash
# Test basic SSH connectivity
ssh user@your-server-ip
exit
```
✅ **Success criteria**: Should connect without password prompts (using SSH keys)

**If SSH fails**: Follow [SSH Key Generation Guidance](#ssh-key-generation-guidance) below

**2. Dokku Installation Verification**
```bash
pnpm run ssh dokku --version
```
✅ **Success criteria**: Returns version number (e.g., `dokku version 0.34.8`)

**If Dokku missing**: Direct user to install Dokku:
```
Please install Dokku by following the official installation guide:
https://dokku.com/docs/getting-started/installation/#1-install-dokku

Follow ALL steps in the installation guide, including the initial setup.
```

**3. Let's Encrypt Plugin Verification**
```bash
pnpm run ssh dokku letsencrypt:list
```
✅ **Success criteria**: Command runs without "plugin not found" errors

**If plugin missing**: Install Let's Encrypt plugin:
```bash
# Install plugin
pnpm run ssh sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git

# Enable auto-renewal
pnpm run ssh sudo dokku letsencrypt:cron-job --add

# Verify installation
pnpm run ssh dokku letsencrypt:list
```

**4. Environment Configuration Verification**
Ensure `.env` file contains:
```bash
SSH_PRIVATE_KEY_PATH=~/.ssh/mcp_deploy_key  # or your key path
SSH_USER=your-username
SSH_HOST=your-server-ip
ACCESS_TOKEN=your-secure-token
# ... other MCP-specific variables
```

### Prerequisites Summary

**🚫 DO NOT PROCEED** with deployment (`pnpm run create`) unless ALL of the following return success:
- [ ] `pnpm run ssh dokku --version` returns version number
- [ ] `pnpm run ssh dokku letsencrypt:list` runs without plugin errors

**Only after all prerequisites are verified should you proceed with [Local Testing](#local-testing-required)**

## Development Workflow

### Local Testing (Required)
**MANDATORY**: After generating a Dockerfile, agents must test the container locally before deployment.

1. **Build the container**: `pnpm run build`
2. **Start the container**: `pnpm run start` (maps host ports 80 and 443 to container port 5000)
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
5. **Stop the container**: `pnpm run stop`
6. **Deploy if tests pass**: `pnpm run create`

**Port Mapping**: When `pnpm run start` runs, host ports 80 and 443 are mapped to container port 5000, allowing testing via both HTTP and HTTPS endpoints.

### Deployment Sequence
```bash
# 1. Create services first
dokku postgres:create service-name

# 2. Deploy application
pnpm run create

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

## Troubleshooting Guard Rails

### Connection Issues - DO's and DON'Ts

**ASSUME**: The user has a way to connect to their remote host (SSH access, server credentials, etc.)

**DO**:
- Help generate SSH keys for the user locally
- Guide user through adding public keys to `~/.ssh/authorized_keys` on remote host
- Verify `.env` file contains correct SSH credentials
- Check that SSH key permissions are correct (600 for private key, 644 for public key)
- Use `pnpm run ssh` commands to interact with remote Dokku instance

**DON'T**:
- Attempt to troubleshoot network connectivity issues beyond SSH
- Try to configure firewalls, port forwarding, or network infrastructure
- Assume the user doesn't have basic server access
- Create overly complex networking solutions when SSH key setup is the issue
- Bypass the established SSH-based workflow for direct server access

### SSH Key Generation Guidance

When connection issues arise, guide the user through these simple steps:

```bash
# 1. Generate SSH key pair (if they don't have one)
ssh-keygen -t ed25519 -C "user@email.com" -f ~/.ssh/mcp_deploy_key

# 2. Display the public key
cat ~/.ssh/mcp_deploy_key.pub
# Copy this entire output - you'll need it for the next step

# 3. Connect to your remote server and add the key
ssh user@your-server-ip
echo "{KEY_VALUE}" >> ~/.ssh/authorized_keys

# 4. Set proper permissions on the remote server
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# 5. Exit the remote server
exit
```

**Replace `{KEY_VALUE}` with the actual public key output from step 2**

Then update `.env` with:
```bash
SSH_PRIVATE_KEY_PATH=~/.ssh/mcp_deploy_key
SSH_USER=username
SSH_HOST=hostname
```

### Deployment Troubleshooting Priorities

1. **SSH Connection**: Verify basic SSH access first
2. **Environment Variables**: Check `.env` file completeness
3. **Dockerfile Syntax**: Validate against reference implementations
4. **Port Configuration**: Confirm 8000→5000 proxy setup
5. **Security Tokens**: Ensure ACCESS_TOKEN is set and unique

### Deployment Failure Troubleshooting

**If deployment fails (`pnpm run create`)**:

1. **First**: Verify all [Prerequisites](#prerequisites-verification) are met
2. **Check logs**: Use debugging commands to identify specific errors
3. **Common issues**: Missing service plugins, incorrect environment variables, Dockerfile syntax errors

**DON'T**: Attempt complex server troubleshooting beyond prerequisites verification

### What NOT to Troubleshoot

- **Network Infrastructure**: Don't attempt to configure routers, DNS, or cloud networking
- **Server Provisioning**: Don't guide server setup, OS installation, or platform configuration
- **Dokku Installation**: Don't attempt to install Dokku yourself - direct users to official docs
- **Complex Debugging**: Don't deep-dive into Dokku internals unless specifically related to MCP deployment
- **Alternative Architectures**: Don't suggest bypassing the established Supergateway→Nginx→Dokku pattern

## Debugging Commands
```bash
# Check container status
pnpm run ssh dokku ps:report app-name

# View logs
pnpm run ssh dokku logs app-name -t

# Execute shell in container
pnpm run ssh dokku enter app-name
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