# Risks of running MCP servers locally

Locally running MCP servers have unlimited access to your personal files, creating risks of data exfiltration, virus implantation & propagation, or data encryption attacks (aka Ransomware).

You should take precautions to make sure the MCP server you're running doesn't have unfettered access to your local file system and / or corporate network.

One of the solutions you can employ to run MCP servers more securely is Docker. [Docker](https://www.docker.com/get-started/) is a containerization solution that is free, open source and widely supported across all the major operating systems.

Running MCP servers inside of Docker containers allows you to run them in a sandboxed environment that you have full control over. You decide which files and folders to expose to the container, can define rules for HTTP and Websocket traffic, and selectively expose environment variables as opposed to leaking unintended secrets.

Running MCP servers inside Docker increases their security and gives you more control on what data and capabilities the server has access to.

Note that it's not a complete bulletproof solution, an MCP server running inside a docker container in your computer won't have access to your files, but it will be able to make network calls unless you lock down traffic from the container. For maximum security, you should containerize your MCP servers, and run them outside of your corporate / private network.

To summarize, running MCP servers inside Docker containers solves 2 problems:

- Data exfiltration via filesystem access is blocked, container cannot read host files unless users explicitely expose them to the container.
- Accessing corporate network can be mitigated by running untrusted MCP servers outside of a corporate / private network.

The following tiered list offers an idea on how to quickly access the security of an MCP solution:

1. Highest security is running MCP server outside corporate network with sandboxing.
2. Medium security is running MCP server outside locally with sandboxing.
3. Lowest security is running MCP server outside locally without sandboxing.

# Use Docker to sandbox your MCP server and expose it securely with Supergateway

In order to help you run your containerized MCP servers, we've created several docker files that allow you to launch and expose Node JS MCP server securely (Python servers will follow). 

We currently give you 3 example Docker files that give you options on how you expose your MCP server to the outside world:

1. [NGinx proxy](../docker/node_mcp/nginx_proxy/Dockerfile): By creating a self-signed SSL certificate, and using a combination of [NGinx](https://nginx.org/) with [Supergateway](https://github.com/supercorp-ai/supergateway), we can safely expose port 443 (HTTPS traffic), and protect it with a secret token.
2. [NGrok secure tunnel](../docker/ngrok_tunnel/nginx_proxy/Dockerfile): [NGrok](https://ngrok.com/) is an established company in the network security industry, they offer Secure Tunnel support with many methods of securing the connection (Basic Auth, OAuth, OIDC, JWTs), but for our simple use case, we demonstrate securing the connection with [Basic Auth](https://ngrok.com/docs/agent/cli/#ngrok-http) using `ngrok http` CLI.
3. [Pinggy secure tunnel](../docker/pinggy_tunnel/nginx_proxy/Dockerfile): [Pinggy](https://pinggy.io/) is a smaller competitor focused on oferring just Secure Tunnels. Their pricing is lower and user interface is simpler and more intuitive to use than NGrok. While we were impressed with their web application, we cannot speak to their long term performance or reliability.

# What are the differences between using NGinx proxy vs tunneling?

Both proxy and tunnelling approaches use the same core security model. Docker sandboxes the MCP server, and Supergateway exposes it via HTTP on port 8000, which is internal to the container is not exposed to the host. This means that you cannot connect to Supergateway directly, and traffic within the container can flow securely without encryption.

Here is where the solutions differ:

## NGinx Proxy

The [NGinx Dockerfile](../docker/node_mcp/nginx_proxy/Dockerfile) creates a self-signed SSL certificate, and launches a webserver that listens to traffic from port 443 (the HTTPS port), and forwards it along to port 8000 if the request is correctly authorized with a Bearer token (aka provides a `authorization: Bearer {SECRET_KEY}` header). This is the simplest and most cost effective solution to secure your MCP servers, but it doesn't offer added benefits like logging and remote disconnect that a secure tunnel provides. 

<img width="360" alt="NGinx Proxy Technical Diagram" src="../docs/images/Secured_MCP_via_Nginx_Proxy_Mermaid_Chart-2025-08-10-043951.png">

## Secure Tunnel

A secure tunnel uses a combination of agents (one running inside the container, alongside your MCP server & Supergateway), and one on a remote data center. These agents connect on startup and form a tunnel that allows authorized traffic to enter the container. The Dockerfiles for secure tunnels work very similarly to NGinx, the only difference being that we don't need to open a port into the docker container, since inbound traffic will always have to thorugh the tunnel.

of the secure tunnel setup is very similar as the 

The [NGrok Dockerfile](../docker/node_mcp/ngrok_tunnel/Dockerfile) and [Pinggy Dockerfile](../docker/node_mcp/pinggy_tunnel/Dockerfile) launch the secure agent on startup, using environment variables to authenticate your connection to their service. The tunnel listens to traffic from port 443 (the HTTPS port), and forwards it along to port 8000 if the request is correctly authorized with Basic Auth for NGrok or Bearer Token for Pinggy (using `authorization: Bearer {SECRET_KEY}` header).

<img width="360" alt="Secure Tunnel Technical Diagram" src="../docs/images/Secured_MCP_via_Tunnel_Proxy_Mermaid_Chart-2025-08-10-043849.png">

## Customize & build your MCP Server Docker image

The first step will be to prepare your machine to build and run Docker images. Even if you plan to deploy the Docker image remotely, it may still be helpful to build and run it locally to ensure everything is working as you expect.

> Pro tip: If you're testing your MCP servers locally, disconnect from your corporate VPN to avoid giving unintended access to the corporate network.

### Pre-requisites

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) on MacOS and Windows, or [Docker Engine](https://docs.docker.com/engine/install/ubuntu/) on Linux.
2. Install [Node](https://nodejs.org/) (used for helpful scripts and loading environment variables)

```bash
# install @dotenvx/dotenvx dependency which is used to read values in .env files
npm install 
```

### Prepare the Dockerfile and environment variables



# Use Docker to sandbox your MCP server and expose it securely with Supergateway
--- Why we did it that way



Why run MCP servers inside docker:

1. Docker images can be run securely both locally on end users machines, as well as remotely on a server.
2. Docker images are easy to build and customize, and work across operating systems.
3. Docker provides a sandbox to contain MCPs, HTTPS + API tokens create secure connections into the sandbox.
4. Docker is built on OCI (Open Container Initiative), an open standard supported by Docker, Podman, and other competing implementations. This is similar to Model Context Protocol (MCP) itself, and 

Why use NGinx Proxy:

1. Simpler and cheaper approach, does not require a subscription and complex configuration.
2. 


Why use Tunneling:

1. More secure since inbound connections are completely disallowed

Notes on Node CLI:

- Automatically injects build & runtime env variables from a .env file.
- Abstracts away the complexity of docker into simple commands: build, start & stop





Notes on docker images:

If you can, base your Docker images from Alpine (ex: `FROM node:$NODE_VERSION-alpine`) which offers the smallest image size and therefore highest security.

If you need `apt` package manager or run into compatibility issues, base your Docker images from Slim versions (ex: node:$NODE_VERSION-slim) which are usually Debian based and offer more utities and wider compatibility out of the box (for approx. 100MB more disk space consumed per docker imafe)

If all else fails, basing your docker image from a widely popular linux distro like Ubuntu (ex: `FROM ubuntu:latest`) and then installing your needed dependencies is a solid idea.




2 problems:

- Data exfiltration via filesystem access (fully covered)
- Accessing corporate network and interacting with corporate network (we give them a great starting point here)

3 Tiers of security

1. Highest security is running it remotely with sandboxing
2. Medium security is running locally with sandboxing
3. Lowest security is running locally without sandboxing





--- What the risks are / why we did it
--- What we did / how we did it
--- Why we did it that way



# Checklist

