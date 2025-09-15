# How to expose localhost MCPs to the internet

In some cases, running MCP servers inside of a Docker container is not an option.

A good example of this is [Figma's Dev Mode MCP](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Dev-Mode-MCP-Server), which is launched by Figma Desktop itself.

The only way to securely monitor localhost MCP servers is to establish an HTTP tunnel that exposes the port used by that MCP server as a publicly accessible URL. Due to the inherent risks associated with exposing local resources to the internet, we strongly recommend using a strong access token to secure your tunnel.

Fortunately Pinggy makes this easy for us, since they provide [good documentation](https://pinggy.io/docs/) along with a lightweight Docker image to establish the tunnel. Here's what you need to do:

1. Login to [Pinggy](https://pinggy.io) to obtain an access token, or use an existing token provided by MCP Manager.
2. Create a random access token to secure your tunnel, ex:

```bash
# Generate a random string to use as ACCESS_TOKEN
openssl rand -hex 32
```

3. Run one of the following docker commands in your terminal to create the tunnel: 

```bash
# Run in the background (recommended: will automatically start and run indefinitely)
docker run --name my-tunnel -d --restart unless-stopped --net=host -it pinggy/pinggy -p 443 -R0:127.0.0.1:{MCP_PORT} -o ServerAliveInterval=30 -t {PINGGY_TOKEN} k:{ACCESS_TOKEN} x:https x:xff a:Host:localhost:{MCP_PORT}

# Run in the foreground (will terminate when console closes, useful when testing or debugging connection issues)
docker run --name my-tunnel --net=host -it pinggy/pinggy -p 443 -R0:127.0.0.1:{MCP_PORT} -o ServerAliveInterval=30 -t {PINGGY_TOKEN} k:{ACCESS_TOKEN} x:https x:xff a:Host:localhost:{MCP_PORT}
```

- Replace `{MCP_PORT}` with the port that your localhost MCP is listening go, in this case: `3845`
- Replace `{PINGGY_TOKEN}` with your Pinggy token, ex: `ABCDEFGHIJK+force@pro.pinggy.io`
- Replace `{ACCESS_TOKEN}` with a secret key to protect access to your tunnel, ex: `db938518de56a2790b53864123d2742f075989e8e2e655dc091721c19dc5aeee`

*IMPORTANT:* If you want your tunnels to start automatically, run the tunnel in the background and ensure your docker desktop or docker engine start automatically when your operating system starts up.

4. Securely connect to your MCP server using an MCP client or gateway:

Once you have your tunnel's URL (if you launch the container in background mode, use `docker logs my-tunnel` to print the logs which includes the URL), you will need to add `/mcp` to the end of the URL to reach your MCP server.

For example, if your tunnel's URL is `https://tunnel-tmymaeihyn.mcpmanager.ai`, the URL to connect to the server is: `https://tunnel-tmymaeihyn.mcpmanager.ai/mcp`

> Note: This `/mcp` is not a standarized URL, but most MCP servers listen on this path. Adjust the path if your MCP server listens on a diffent endpoint.

Finally, you'll need to provide the access token in the Authorization header in order to pierce the tunnel, here's an example of how you can set up the authorization header:

```json
// Use this as an example if you're connecting directly to the MCP server
{
  "servers": {
    "my-authenticated-server": {
      "type": "http",
      "url": "https://example-tunnel-url.com/mcp",
      "headers": {
        "Authorization": "Bearer {ACCESS_TOKEN}"
      }
    }
  }
}
```

Here's a few screenshots that demonstrate how to configure your MCP server in MCP Manager:

![inbound server setup](./images/mcp_manager_inbound_server_setup.png)
![inbound server authorization](./images/mcp_manager_authorization.png)

## Monitor & secure your MCP server

To monitor traffic between your MCP server and your clients, use a centralized MCP gateway like [MCP Manager](https://mcpmanager.ai/) to sit between your MCP server and clients.

To work with the gateway adjust the tunnel URL (by adding `/mcp` at the end), and make sure to provide the Authorization header. 

## Explanation & example

Lets explore what each of the arguments does:

- `--name my-tunnel`: (optional) Give your docker container a name so you can easily check its logs or stop it.
- `-d`: (optional) Run the HTTPS tunnel in the background and automatically start it when docker engine starts.
- `--restart unless-stopped`: (optional) Instruct docker to always start this container when the docker engine starts up.
- `-it pinggy/pinggy`: This specifies which docker image to load.
- `-p 443`: This instructs Pinggy to connect to its server on port 443 (HTTPS).
- `-R0:127.0.0.1:{MCP_PORT}`: Instruct Pinggy to forward incoming traffic to the specified local port.
- `-o ServerAliveInterval=30`:  Instruct Pinggy to send a "keepalive" request to the server every 30 seconds, this ensures the connection remains open and stable.
- `-t {PINGGY_TOKEN}`: This token authenticates the tunnel with Pinggy server.
- `k:{ACCESS_TOKEN}`: This token secures access to the tunnel.
- `x:https`: This flag ensures all traffic through the tunnel uses SSL (HTTPS).
- `x:xff`: Instruct Pingggy to send the user's IP address on a `'X-Forwarded-For'` header to track who accessed the tunnel.
- `a:Host:localhost:{MCP_PORT}`: Instruct Pinggy to proxy traffic from the specified local port to the tunnel.

Now let's put it all together to demonstrate how to create a secure HTTPS tunnel that exposes [Figma's Dev Mode MCP](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Dev-Mode-MCP-Server) as a secured HTTPS endpoint:

```bash
# Launch the tunnel in "background" mode and proxy traffic to & from localhost:3845
docker run --name figma-tunnel -d --net=host -it pinggy/pinggy -p 443 -R0:127.0.0.1:3845 -o ServerAliveInterval=30 -t ABCDEFGHIJK+force@pro.pinggy.io k:db938518de56a2790b53864123d2742f075989e8e2e655dc091721c19dc5aeee x:https x:xff a:Host:localhost:3845
```

## Troubleshooting

### What if my MCP server doesn't expose a StreamableHTTP endpoint?

If you're running a pure STDIO based MCP, or one that uses legacy SSE transport, but want to expose it to the internet as a StreamableHTTP MCP, you can use [Supergateway](https://github.com/supercorp-ai/supergateway) to do so, ex:

```bash
npx -y supergateway --stdio "npx -y @modelcontextprotocol/server-filesystem" --outputTransport streamableHttp --port 8000
```

This command will use Supergateway to expose a local STDIO MCP (in this case `npx -y @modelcontextprotocol/server-filesystem`) as a StreamableHTTP MCP on port 8000.

### I can't connect to my MCP server or don't see any tools / features in MCP Manager

If you run into a connection issue, go through the following steps to troubleshoot the cause of the issue:

1. Ensure docker is running:
```bash
docker --version
```

2. Ensure your tunnel is up and listening to connections on the correct port:
```bash
# Ensure your tunnel shows up in this list
docker ps

# Print logs from the tunnel container which displays the tunnel URL
docker logs figma-tunnel
```

3. Ensure your MCP server is up and running, and listenting on the port the tunnel is configured for.
```bash
# Query your MCP server locally, ensure it responds:
curl -X POST http://localhost:{MCP_PORT}/mcp\
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {
        "name": "Test",
        "version": "1.0.0"
      }
    }
  }'

# If that works, attempt the same query using the tunnel URL:
curl -X POST http://example-tunnel-url.com:{MCP_PORT}/mcp\
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {
        "name": "Test",
        "version": "1.0.0"
      }
    }
  }'
```

If you have any questions or run into any issues don't hesitate to open an [Issue](https://github.com/MCP-Manager/MCP-Checklists/issues), or start a [Discussion](https://github.com/MCP-Manager/MCP-Checklists/discussions).
