# MCP-Checklists Repository Context

## Repository Purpose
This repository helps users self-host STDIO (Standard Input/Output) MCP servers remotely using a secure, containerized approach. It provides infrastructure and tooling to deploy MCP servers that can be accessed over HTTPS with token-based authentication.

## Core Architecture

### Components
1. **Supergateway**: Converts STDIO-based MCPs into StreamableHTTP endpoints
2. **Nginx Reverse Proxy**: Provides secure HTTPS exposure with token-based authentication
3. **Dokku**: Docker-based Platform-as-a-Service for easy deployment and management
4. **Let's Encrypt**: Automatic SSL certificate management

### Security Model
- Token-based authentication via `Authorization: Bearer {ACCESS_TOKEN}` headers
- HTTPS encryption for all traffic
- Nginx proxy filtering requests before they reach the MCP server
- Isolated Docker containers for each MCP deployment

### Deployment Model

#### Remote Server Deployment
- Deploy STDIO MCPs to remote servers with full SSL/DNS configuration
- Uses Dokku for container orchestration and management
- Automatic SSL certificate provisioning via Let's Encrypt
- Supports both Node.js and Python-based MCPs

## File Structure

### Key Directories
- `infrastructure/dokku/node/`: Node.js Dockerfiles and configurations
- `infrastructure/dokku/python/`: Python Dockerfiles and configurations
- `infrastructure/docs/`: Comprehensive deployment and security guides
- `infrastructure/package_scripts/`: Deployment automation scripts (accessed via npm/pnpm scripts)

### Environment Configuration
- `.env`: Contains SSH credentials, MCP configuration, and security tokens
- Uses `NPM_MCP` and `NPM_MCP_ARGS` for simple MCP server definitions
- `ACCESS_TOKEN` for securing MCP endpoints

## Current Limitations
The existing Dockerfiles are designed for simple MCPs that can be launched with single commands:
- Node.js: `npx @modelcontextprotocol/server-filesystem /home`
- Python: `uvx some-python-mcp --arg1 value1`

## Target Use Cases for Enhancement
Complex MCPs that require:
- Multi-step build processes
- Custom dependencies beyond npm/pip/uvx
- Configuration file generation
- Environment-specific setup
- Custom startup sequences
- Integration with external services or databases
- Compilation from source code
- Custom binary installation

## MCP Endpoint Structure
- MCP servers are accessible at: `https://app-name.domain.com/mcp`
- All requests must include: `Authorization: Bearer {ACCESS_TOKEN}`
- Supports MCP protocol version 2025-03-26

## Development Workflow

### Local Development and Testing
Before deploying to remote servers, developers should validate their Dockerfiles locally:

1. **`pnpm build`**: Builds the Docker container locally using the root Dockerfile
2. **`pnpm start`**: Starts the built container locally for testing
3. **`pnpm stop`**: Stops the running local container
4. **`pnpm create`**: Deploys the validated Dockerfile to the remote Dokku server

This workflow ensures Dockerfiles are working correctly before remote deployment.

## Monitoring and Management
- Centralized logging via Dokku
- Health checks and restart policies
- Integration with MCP Manager for traffic monitoring
- Support for scaling applications across multiple containers