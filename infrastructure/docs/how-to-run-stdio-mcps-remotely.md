# How to run STDIO MCPs on remote servers

## Prerequisites

- A remote server (Ubuntu/Debian recommended) with sudo access
- A domain name that you control
- SSH key pair for authentication
- Node.js and pnpm installed locally (`corepack enable pnpm`)

## Step 1 (local): Clone this repository & install pnpm

```bash
# Clone the repository
git clone https://github.com/MCP-Manager/MCP-Checklists
cd MCP-Checklists

# Due to an issue with outdated signatures in Corepack, Corepack should be updated to its latest version first
npm install --global corepack@latest

# Install pnpm
corepack enable pnpm
```

## Step 2 (local): Setup SSH connection

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

After you finish this step, you should be able to establish an interactive SSH connection to your remote using our `ssh` utility script:

```bash
# Connect to the remote host using ssh NPM script, and print: "working" 
pnpm ssh echo working

# Should print: working
```

## Step 3 (remote): Install Dokku on your server

Dokku is a Docker-powered Platform-as-a-Service that mimics Heroku's deployment workflow. It allows you to deploy applications without downtime and automatically handles container management, routing, and SSL certificates.

SSH into your server and install Docker & Dokku to install Dokku ([more info here](https://dokku.com/docs/getting-started/installation/#1-install-dokku)):

```bash
# Start an interactive shell to connect to your remote host (replace placeholders with your values)
pnpm ssh

# Install Docker via one of the following means:
# Docker Engine (CLI): https://docs.docker.com/engine/install/
# Docker Desktop (GUI): https://docs.docker.com/desktop/

# After Docker Engine setup run the following commands if you're running on Mac or Linux
sudo groupadd docker
sudo usermod -aG docker ubuntu
newgrp docker

# Install Dokku, for the latest version visit: https://github.com/dokku/dokku/releases
wget -NP . https://dokku.com/install/v0.36.7/bootstrap.sh
sudo DOKKU_TAG=v0.36.7 bash bootstrap.sh

# Install dokku letsencrypt plugin (for SSL): https://github.com/dokku/dokku-letsencrypt
sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
sudo dokku letsencrypt:cron-job --add


```

### Configure Dokku domain and SSH access

Set up your global Dokku domain (apps will be accessible at `appname.yourdomain.com`):

```bash
# Set your global domain (replace with your actual domain)
dokku domains:set-global yourdomain.com

# You can also use a subdomain
dokku domains:set-global example-subdomain.your-domain.com
```

### DNS Configuration

Configure your domain's DNS records to point to your Dokku server:

- **A record**: `yourdomain.com` → `your-server-ip`
- **CNAME record**: `*.yourdomain.com` → `your-domain.com`

This wildcard CNAME allows Dokku to serve apps on subdomains like `appname.yourdomain.com`.

*Note:* Your DNS configuration may be different depending on your cloud service provider.

For AWS for example, you'd create records like so:

- **CNAME record**: `yourdomain.com` → `EC2 public DNS`
- **CNAME record**: `*.yourdomain.com` → `EC2 public DNS`

At this point you should be able to visit your domain, and see the default Nginx server page, this indicates Dokku was properly setup and you're ready to move on to the next step:

![default_nginx_langing_page](./images/default_nginx_landing_page.png)

## Step 4 (local): Configure your MCP server container

### Choose a Dockerfile

Copy the appropriate Dockerfile based on your MCP server runtime:

- **Node.js MCP servers**:

  ```bash
  cp infrastructure/dokku/node/nginx_proxy_on_dokku/Dockerfile ./
  ```

- **Python MCP servers**:
  ```bash
  cp infrastructure/dokku/python/nginx_proxy_on_dokku/Dockerfile ./
  ```

These Dockerfiles combine Supergateway (which exposes STDIO based MCPs as Streamable HTTP servers) with an NGinx reverse proxy that securely exposes your MCP server over HTTPS with token-based authentication. For more information about the security architecture and containerization approach, see the [complete security guide](./how-to-run-mcp-servers-securely.md).

### Configure environment variables

Edit your `.env` file to configure the MCP server and security settings:

> Tip: Use `pnpm gen_key` to generate secure secret keys

```env
# MCP Server Configuration
NPM_MCP="@modelcontextprotocol/server-filesystem"
NPM_MCP_ARGS="/home"
SUPERGATEWAY_EXTRA_ARGS="--stateful"
NODE_VERSION="lts"

# Security Configuration
ACCESS_TOKEN="your-secure-token-here"
```

**Security Note**: Use a unique, long `ACCESS_TOKEN` for each application to ensure maximum security. Each deployed MCP server should have its own token to prevent unauthorized access across applications. Use `pnpm gen_key` to create secure secrets.

## Step 5 (local): Deploy your MCP server

Create and deploy your Dokku application:

```bash
pnpm create -a example-app -e youremail@yourdomain.com
```

This command will:

- Create a Dokku application on your remote server.
- Configure dokku app's port mappings (HTTP:80, HTTPS:443) to proxy traffic to container's Nginx server listening on port 5000.
- Set `ACCESS_TOKEN` environment variable with value from your `.env` file.
- Build a docker image based on the root Dockerfile.
- Deploy the Docker image to your remote host.
- Enable SSL with Let's Encrypt using your provided email.

### Command parameters:

- `-a, --app_name`: Name of the Dokku app to create (required)
- `-e, --ssl_email_contact`: Email for Let's Encrypt SSL certificates (required)

If you got this far, your application should be live and accessible at:

`https://example-app.yourdomain.com`

## Step 6: Connect to your MCP server using an MCP client or gateway

Once you have your remote server URL you will need to add `/mcp` to the end of the URL to reach your MCP server.

For example, if your remote server's URL is `https://example-app.your-domain.com`, the URL to connect to the server is: `https://example-app.your-domain.com/mcp`

> Note: This `/mcp` is not a standarized URL, but most MCP servers listen on this path. Adjust the path if your MCP server listens on a diffent endpoint.

Finally, you'll need to provide the `ACCESS_TOKEN` in the Authorization header in order to authenticate your connection, here's an example of how you can set up the authorization header:

```json
// Use this as an example if you're connecting directly to the MCP server
{
  "servers": {
    "my-authenticated-server": {
      "type": "http",
      "url": "https://your-app-name.your-domain.com/mcp",
      "headers": {
        "Authorization": "Bearer {ACCESS_TOKEN}"
      }
    }
  }
}
```

Use these screenshots as an example if you're connecting your MCP server to a centralized Gateway like [MCP Manager]():

![inbound server setup](./images/mcp_manager_inbound_server_setup.png)
![inbound server authorization](./images/mcp_manager_authorization.png)

## Helpful server administration commands

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
