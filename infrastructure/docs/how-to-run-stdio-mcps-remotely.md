# How to run STDIO MCPs on remote servers

## Prerequisites

- A remote server (Ubuntu/Debian recommended) with sudo access
- A domain name that you control
- SSH key pair for authentication
- Node.js and pnpm installed locally

## Step 1: Clone this repository

```bash
git clone <repository-url>
cd MCP-Checklists
```

## Step 2: Setup SSH connection

Configure your SSH connection by setting up the required environment variables. Copy `.env.example` to `.env` and configure the SSH settings:

```bash
cp .env.example .env
```

Edit `.env` and set these SSH-related variables:

```env
SSH_HOST="your-dokku-server.example.com"
SSH_USERNAME="ubuntu"
SSH_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...your private key contents...
-----END PRIVATE KEY-----"
```

Alternatively, you can use `SSH_PRIVATE_KEY_PATH` instead of embedding the key directly:

```env
SSH_PRIVATE_KEY_PATH="/path/to/your/private/key"
SSH_PRIVATE_KEY_PASSWORD="passphrase-if-needed"
```

## Step 3: Install Dokku on your server

Dokku is a Docker-powered Platform-as-a-Service that mimics Heroku's deployment workflow. It allows you to deploy applications without downtime and automatically handles container management, routing, and SSL certificates.

SSH into your server and follow [the instructions on this page](https://dokku.com/docs/getting-started/installation/#1-install-dokku) to install Dokku.

```bash
# start an interactive shell connected to your remote host (replace variables with your values)
ssh -i /PATH/TO/SSH_KEY USERNAME@HOST

# install Dokku, for the latest version visit: https://github.com/dokku/dokku/releases
wget -NP . https://dokku.com/install/v0.36.7/bootstrap.sh
sudo DOKKU_TAG=v0.36.7 bash bootstrap.sh

# Install dokku letsencrypt (for SSL): https://github.com/dokku/dokku-letsencrypt
sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
sudo dokku letsencrypt:cron-job --add

# create a docker user group and the ubuntu user to it
sudo groupadd docker
sudo usermod -aG docker ubuntu
newgrp docker
```

### Configure Dokku domain and SSH access

Set up your global Dokku domain (apps will be accessible at `myapp.yourdomain.com`):

```bash
# Set your global domain (replace with your actual domain)
dokku domains:set-global your-domain.com
```

### DNS Configuration

Configure your domain's DNS records to point to your Dokku server:

- **A record**: `your-domain.com` → `your-server-ip`
- **CNAME record**: `*.your-domain.com` → `your-domain.com`

This wildcard CNAME allows Dokku to serve apps on subdomains like `myapp.your-domain.com`.

## Step 4: Locally configure your MCP server deployment

### Choose a Dockerfile

Copy the appropriate Dockerfile based on your MCP server runtime:

- **Node.js MCP servers**:

  ```bash
  cp infrastructure/docker/node/nginx_proxy/Dockerfile ./
  ```

- **Python MCP servers**:
  ```bash
  cp infrastructure/docker/python/nginx_proxy/Dockerfile ./
  ```

These Dockerfiles combine Supergateway (which exposes STDIO based MCPs as Streamable HTTP servers) with an NGinx reverse proxy that securely exposes your MCP server over HTTPS with token-based authentication. For detailed technical information about the security architecture and containerization approach, see the [complete security guide](./how-to-run-mcp-servers-securely.md).

### Configure environment variables

Edit your `.env` file to configure the MCP server and security settings:

```env
# MCP Server Configuration
NPM_MCP="@modelcontextprotocol/server-filesystem"
NPM_MCP_ARGS="/home"
SUPERGATEWAY_EXTRA_ARGS="--stateful"
NODE_VERSION="lts"

# Security Configuration
ACCESS_TOKEN="your-secure-token-here"
```

Generate secure tokens:

```bash
pnpm gen_key
```

## Step 5: Deploy your MCP server

**Security Note**: Use a unique, long `ACCESS_TOKEN` for each application to ensure maximum security. Each deployed MCP server should have its own token to prevent unauthorized access across applications.

Create and deploy your Dokku application:

```bash
pnpm create -a your-app-name -e your-email@domain.com
```

This command will:

- Create a Dokku application on your remote server
- Configure port mappings (HTTP:80, HTTPS:443)
- Set environment variables from your `.env` file
- Deploy the Docker container
- Enable SSL with Let's Encrypt using your provided email

### Command parameters:

- `-a, --app_name`: Name of the Dokku app to create (required)
- `-e, --ssl_email_contact`: Email for Let's Encrypt SSL certificates (required)

## Step 6: Manage your MCP server

Once deployed, you can manage your MCP server using these common Dokku commands:

### Restart your application

```bash
pnpm ssh dokku ps:restart your-app-name
```

### Update environment variables

```bash
pnpm ssh dokku config:set your-app-name ACCESS_TOKEN=new-secure-token
pnpm ssh dokku config:set your-app-name NPM_MCP=@modelcontextprotocol/server-brave-search
```

### View application logs

```bash
pnpm ssh dokku logs your-app-name -t
```

### Check application status

```bash
pnpm ssh dokku apps:report your-app-name
pnpm ssh dokku ps:report your-app-name
```

### Scale your application

```bash
pnpm ssh dokku ps:scale your-app-name web=2
```

### Redeploy after configuration changes

```bash
pnpm run deploy -a your-app-name
```

## Troubleshooting

### Docker Daemon Error

If you run into this error where it says `/var/run/docker.sock: connect: permission denied`, you will need to:

```bash
# run these commands
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```

For more information: https://docs.docker.com/engine/install/linux-postinstall/

### SSH Connection Issues

**Problem**: SSH connection fails during deployment

```bash
# Test SSH connection manually
ssh -i /path/to/private/key username@your-server.com

# Check SSH key permissions
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
```

**Problem**: "Permission denied (publickey)" errors

- Ensure your public key is added to the server: `cat ~/.ssh/id_rsa.pub | ssh user@server "cat >> ~/.ssh/authorized_keys"`
- Verify SSH key format in `.env` includes proper line breaks

### Dokku Installation Issues

**Problem**: Apps not accessible after deployment

- Verify DNS records are configured correctly
- Check that your domain's A record points to your server IP
- Ensure wildcard CNAME `*.your-domain.com` points to `your-domain.com`
- Test DNS propagation: `nslookup your-app.your-domain.com`

### SSL Certificate Issues

**Problem**: Let's Encrypt SSL setup fails

- Verify your email address is valid
- Check that your domain resolves to your server before enabling SSL
- Ensure ports 80 and 443 are open on your server and forwarded to the correct port on the internal container (usually port 5000)
- Check Let's Encrypt rate limits if you've been testing frequently

### Environment Variable Issues

**Problem**: MCP server not starting with correct configuration

- Verify all required environment variables are set in `.env`
- Check that environment variables don't contain unescaped quotes
- Test locally first: `npm run build && npm run start`

### Container Issues

**Problem**: Docker build fails

- Check Dockerfile syntax and paths
- Ensure base image is available: `docker pull node:lts-alpine`
- Review build logs for specific error messages

**Problem**: Container starts but MCP server doesn't respond

- Check container logs: `pnpm ssh dokku logs your-app-name`
- Verify port mappings: `pnpm ssh dokku ports:report your-app-name`

If you have any questions or run into any issues don't hesitate to open an [Issue](https://github.com/MCP-Manager/MCP-Checklists/issues), or start a [Discussion](https://github.com/MCP-Manager/MCP-Checklists/discussions).
