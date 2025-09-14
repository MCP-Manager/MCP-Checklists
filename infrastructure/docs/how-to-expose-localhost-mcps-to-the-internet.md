In some cases, running MCP servers inside of a Docker container is not an option.

A good example of this is [Figma's Dev Mode MCP](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Dev-Mode-MCP-Server), which is launched by Figma Desktop itself.

The only way to securely monitor localhost MCP servers is to establish an HTTP Tunnel that exposes the port used by that MCP server as a publicly accessible URL. Due to the inherent risks associated with exposing local resources to the internet, we strongly recommend using a strong access token to secure your tunnel.

Fortunately Pinggy makes this easy for us, since they provide good documentation along with a lightweight Docker image.

1. Login to Pinggy and obtain an access token: https://pinggy.io
2. Create an access token to secure your tunnel, ex: `npx -y @mcpmanager.ai/cli gen_key`
3. Run one of the following docker commands in your terminal to create the Tunnel: 


```bash
# Run in the foreground (will terminate when console closes)
docker run -n my-tunnel -d --net=host -it pinggy/pinggy -p 443 -R0:127.0.0.1:{MCP_PORT} -o ServerAliveInterval=30 -t {PINGGY_TOKEN} k:{ACCESS_TOKEN} x:https x:xff a:Host:localhost:{MCP_PORT}

# Run in the background (will automatically start and run indefinitely)
docker run --name my-tunnel -d --net=host -it pinggy/pinggy -p 443 -R0:127.0.0.1:{PORT} -o ServerAliveInterval=30 -t {PINGGY_TOKEN} k:{ACCESS_TOKEN} x:https x:xff a:Host:localhost:3845
```

- Replace {PINGGY_TOKEN} with your Pinggy token, ex: `ABCDEFGHIJK+force@pro.pinggy.io`
- Replace {ACCESS_TOKEN} with a secret key to protect access to your tunnel, ex: `db938518de56a2790b53864123d2742f075989e8e2e655dc091721c19dc5aeee`
- Replace {MCP_PORT} with the port that your localhost MCP is listening go, in this case: `3845`

Lets explore what each of the arguments does:

- `-n my-tunnel`: Give your docker container a name so you can easily check its logs or stop it.
- `-d`: (optional) Run the HTTPS Tunnel in the background and automatically start it when docker engine starts.
- `-it pinggy/pinggy`: Give your docker container a name so you can easily check its logs or stop it.
- `-p 443`: This instructs Pinggy to connect to its server on port 443 (HTTPS), this should never change.
- `-R0:127.0.0.1:{MCP_PORT}`: Instruct Pinggy to forward incoming traffic to local port `{MCP_PORT}`, ex: 3845.
- `-o ServerAliveInterval=30`:  Instruct Pinggy to send a "keepalive" request to the server every 30 seconds, this ensures the connection remains open and stable.
- `-t {PINGGY_TOKEN}`: This token authenticates the tunnel with Pinggy server.
- `k:{ACCESS_TOKEN}`: This token secures access to the tunnel.
- `x:https`: This flag ensures all traffic through the tunnel uses SSL (HTTPS).
- `x:xff`: Instruct Pingggy to send the user's IP address on a `'X-Forwarded-For'` header to track who accessed the tunnel.
- `a:Host:localhost:{MCP_PORT}`: Instruct Pinggy to proxy traffic from local port `{MCP_PORT}` to the tunnel.

Now let's put it all together for to demonstrate how to create a secure HTTPS Tunnel that exposes [Figma's Dev Mode MCP](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Dev-Mode-MCP-Server):

```bash
# Launch the tunnel in "background" mode
docker run --name figma-tunnel -d --net=host -it pinggy/pinggy -p 443 -R0:127.0.0.1:3845 -o ServerAliveInterval=30 -t ABCDEFGHIJK+force@pro.pinggy.io k:db938518de56a2790b53864123d2742f075989e8e2e655dc091721c19dc5aeee x:https x:xff a:Host:localhost:3845

# Print logs from the tunnel container which displays the tunnel URL
docker logs figma-tunnel
```

If you have any questions or run into any issues don't hesitate to open an [Issue](https://github.com/MCP-Manager/MCP-Checklists/issues), or start a [Discussion](https://github.com/MCP-Manager/MCP-Checklists/discussions).