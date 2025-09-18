# Rules for Customizing MCP Dockerfiles

## Core Principles

### 1. Preserve the Security Architecture
- **NEVER** modify the Nginx reverse proxy configuration without explicit user request
- **ALWAYS** maintain token-based authentication via `ACCESS_TOKEN`
- **NEVER** expose MCP servers directly without the Nginx proxy layer
- **ALWAYS** use HTTPS-only configurations

### 2. Maintain Container Structure
- **ALWAYS** use multi-stage Docker builds when adding complexity
- **ALWAYS** run processes as non-root user for security
- **NEVER** install unnecessary packages that increase attack surface
- **ALWAYS** use official base images (node:lts-alpine, python:3.x-alpine, etc.)

### 3. Preserve Supergateway Integration
- **NEVER** bypass Supergateway for STDIO MCP conversion
- **ALWAYS** ensure Supergateway listens on port 3000 inside container
- **ALWAYS** maintain the `--outputTransport streamableHttp` flag
- **NEVER** modify Supergateway's core functionality without user permission

## Dockerfile Customization Guidelines

### Environment Variables to Preserve
Always maintain these essential environment variables:
- `ACCESS_TOKEN`: Security token for authentication
- `SUPERGATEWAY_PORT`: Internal port for Supergateway (default: 3000)
- `NGINX_PORT`: Port for Nginx proxy (default: 5000)

### Environment Variables for Custom MCPs
When adding custom MCP support, follow these patterns:
- `CUSTOM_BUILD_COMMAND`: Commands to run during build phase
- `CUSTOM_DEPENDENCIES`: Additional system packages needed
- `CUSTOM_SETUP_SCRIPT`: Path to custom setup script
- `MCP_WORKING_DIR`: Working directory for the MCP server
- `MCP_CONFIG_FILE`: Path to MCP configuration file

### Required Dockerfile Sections

#### 1. Build Stage (if needed)
```dockerfile
FROM node:lts-alpine AS builder
# Custom build steps here
# Install build dependencies
# Compile/build custom components
```

#### 2. Runtime Stage
```dockerfile
FROM node:lts-alpine AS runtime
# Install runtime dependencies only
# Copy built artifacts from builder stage
# Set up non-root user
```

#### 3. Supergateway Integration
```dockerfile
# Install Supergateway
RUN npm install -g supergateway

# Ensure Supergateway can proxy the MCP
EXPOSE 3000
```

#### 4. Nginx Proxy Setup
```dockerfile
# Copy and configure Nginx
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 5000
```

### Security Requirements

#### User Management
- **ALWAYS** create and use a non-root user
- **NEVER** run MCPs as root user
- **ALWAYS** set appropriate file permissions

#### File System
- **ALWAYS** use read-only root filesystem when possible
- **NEVER** store secrets in the image layers
- **ALWAYS** use proper secret management for sensitive data

#### Network
- **NEVER** expose additional ports beyond 5000 (Nginx)
- **ALWAYS** ensure internal communication uses localhost
- **NEVER** allow direct external access to Supergateway (port 3000)

## Custom MCP Integration Patterns

### Pattern 1: Pre-built Binary MCP
```dockerfile
FROM node:lts-alpine AS runtime

# Install system dependencies
RUN apk add --no-cache ${CUSTOM_DEPENDENCIES}

# Copy pre-built MCP binary
COPY --from=builder /app/mcp-server /usr/local/bin/mcp-server
RUN chmod +x /usr/local/bin/mcp-server

# Supergateway will execute: /usr/local/bin/mcp-server ${MCP_ARGS}
```

### Pattern 2: Script-based MCP
```dockerfile
# Copy custom startup script
COPY custom-mcp-start.sh /usr/local/bin/custom-mcp-start.sh
RUN chmod +x /usr/local/bin/custom-mcp-start.sh

# Set environment for Supergateway to use custom script
ENV NPM_MCP="/usr/local/bin/custom-mcp-start.sh"
```

### Pattern 3: Configuration-driven MCP
```dockerfile
# Copy configuration files
COPY config/ /app/config/
ENV MCP_CONFIG_FILE="/app/config/mcp-config.json"

# Let the MCP read from config file
ENV NPM_MCP_ARGS="--config=${MCP_CONFIG_FILE}"
```

## Testing and Validation

### Local Testing Requirements
Before deploying custom Dockerfiles:

1. **ALWAYS** test the Docker build locally:
   ```bash
   docker build -t test-mcp .
   ```

2. **ALWAYS** test the container runs correctly:
   ```bash
   docker run --name test-mcp -e ACCESS_TOKEN=test-token -p 5000:5000 test-mcp
   ```

3. **ALWAYS** verify MCP endpoint responds:
   ```bash
   curl -X POST http://localhost:5000/mcp \
     -H "Authorization: Bearer test-token" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"Test","version":"1.0.0"}}}'
   ```

### Deployment Validation
- **ALWAYS** check Dokku logs after deployment
- **ALWAYS** verify SSL certificate is properly configured
- **ALWAYS** test the public HTTPS endpoint with proper authentication
- **NEVER** deploy without testing authentication and authorization

## Common Pitfalls to Avoid

### Docker Build Issues
- **DON'T** use `latest` tags for base images in production
- **DON'T** install packages without version pinning
- **DON'T** copy unnecessary files into the image
- **DON'T** forget to set proper working directories

### Runtime Issues
- **DON'T** assume environment variables are always set
- **DON'T** use absolute paths that might not exist
- **DON'T** ignore error handling in startup scripts
- **DON'T** forget to handle graceful shutdowns

### Security Issues
- **DON'T** log sensitive information including tokens
- **DON'T** store credentials in image layers
- **DON'T** run processes as root
- **DON'T** expose internal ports externally

## File Organization

### Required Files in Root Directory
- `Dockerfile`: Main container definition
- `nginx.conf`: Nginx proxy configuration (if customizing)
- `.env`: Environment configuration with all required variables

### Optional Files for Complex MCPs
- `scripts/setup.sh`: Custom setup script
- `config/`: Configuration files directory
- `src/`: Custom source code (if building from source)
- `requirements.txt` or `package.json`: Dependency manifests

## Debugging and Troubleshooting

### Container Debugging Commands
```bash
# Check if container is running
pnpm ssh dokku ps:report app-name

# View container logs
pnpm ssh dokku logs app-name -t

# Execute shell in running container
pnpm ssh dokku enter app-name
```

### Common Debug Steps
1. Verify all environment variables are properly set
2. Check that MCP server binary/script is executable
3. Ensure all required dependencies are installed
4. Verify network connectivity between Nginx and Supergateway
5. Test MCP server independently before integrating with Supergateway

When in doubt, always refer to the working examples in `infrastructure/dokku/node/nginx_proxy_on_dokku/` and `infrastructure/dokku/python/nginx_proxy_on_dokku/` directories.