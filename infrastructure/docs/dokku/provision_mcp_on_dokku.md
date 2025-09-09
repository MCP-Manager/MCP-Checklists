App: https://github.com/zcaceres/markdownify-mcp
Source: https://github.com/zcaceres/markdownify-mcp

```bash
# Install Dokku and pre-requisite plugins:
# Letsencrypt (https://github.com/dokku/dokku-letsencrypt)
sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
sudo dokku letsencrypt:cron-job --add # <- To enable auto-renew

# Setup app
dokku apps:create markitdown
dokku ports:set markitdown http:80:5000 https:443:5000
dokku config:set markitdown NGINX_ACCESS_TOKEN={NGINX_ACCESS_TOKEN}

# Deploy / update (on local machine):
pnpm run deploy -a markitdown

# Expose to web
dokku domains:report cronicle
dokku domains:add markitdown markitdown.asymbl.mcpmanager.ai

# Enable HTTPS (SSL)
dokku letsencrypt:set markitdown email g-alerts-engineering@mcpmanager.ai
dokku letsencrypt:enable markitdown
```
