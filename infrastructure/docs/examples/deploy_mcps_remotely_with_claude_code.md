# Deploying STDIO MCPs remotely with Claude Code



With [CLAUDE.md](../../../CLAUDE.md) Claude Code can help you deploy MCPs on a remote Dokku server. Once you have a new Unbuntu 24.04 server, run the following commands to install Dokku and other pre-requitites:

> When provisioning a new server I recommend a minimum of 2GB of RAM (ideally 4GB or more) and 2 vCPUs if you're going to host multiple MCPs on the same machine (1GB RAM and 1 vCPU would be fine for 1 MCP).

```bash
# Start an interactive shell on your remote host, then run the following commands:

# Step 1: Install Dokku (latest version here: https://github.com/dokku/dokku/releases)
wget -NP . https://dokku.com/install/v0.36.7/bootstrap.sh
sudo DOKKU_TAG=v0.36.7 bash bootstrap.sh

# Step 2: Ensure the current user belongs to the docker group
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker

# Step 3: Install dokku letsencrypt plugin (for SSL):
sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
sudo dokku letsencrypt:cron-job --add
```

Once you have Dokku installed and fully provisioned clone the [MCP-Checklists repo](https://github.com/MCP-Manager/MCP-Checklists) into a directory on your PC, `cd` into it, then run the following prompts in Claude Code (replace {VARS} before running):

## AI Assisted

### Zen MCP ([full configuration here](https://github.com/BeehiveInnovations/zen-mcp-server/blob/main/docs/configuration.md)):
```txt
We're going to install ZenMCP on a remote Dokku server, you don't need to create a new Dockefile as it already exists @infrastructure/dokku/python/zenmcp_on_dokku/Dockerfile. The server is located at "{IP_ADDRESS}" and you can login with username "{USERNAME}" and password "{PASSWORD}". I want my dokku app to be called "zenmcp". Generate a secure ACCESS_TOKEN with `npm run gen_key`, and provide me the key at the end of your output. Once the application is deployed, set the following environment variables on it: OPENAI_API_KEY="{YOUR_API_KEY_HERE}"
```

### Playwright MCP:

```txt
We're going to install Playwright on a remote Dokku server, you don't need to create a new Dockefile as it already exists @infrastructure/dokku/node/playwright_on_dokku/Dockerfile. The server is located at "{IP_ADDRESS}" and you can login with username "{USERNAME}" and password "{PASSWORD}". I want my dokku app to be called "playwright". Generate a secure ACCESS_TOKEN with `npm run gen_key`, and provide me the key at the end of your output.
```

## Manual

If you prefer to run the commands manually, we have a guide for you as well: [How to run STDIO MCPs on remote servers](../how-to-run-stdio-mcps-remotely.md)

Please try out these helpful prompts and let us know if you run into any issues!
