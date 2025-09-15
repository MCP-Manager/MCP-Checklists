# How to run STDIO MCPs on remote servers

BEGIN INSTRUCTIONS

Break down how users can deploy MCP servers on a remote server using SSH and Dokku.

High level user instructions:

1. Clone this repository

2. Setup SSH connection
<claude-hint>look in .env.example for keys relevant to connecting via SSH</claude-hint>

3. Install Dokku

<claude-hint>Make sure to instruct users on how to setup their global domain and that they should setup CNAMES to / and * on their domains to point to the DOkku server </claude-hint>

3. Move the appropriate Dockerfile to the root of the repo and configure the `.env` file to deploy your server
<claude-hint>Access @how-to-run-mcp-servers-securely.md to understand more details about this</claude-hint>

4. Run `pnpm run create` to create a dokku app on the remote server
<claude-hint>Access @create.mjs to understand more details about this command and what parameters it requires</claude-hint>




END INSTRUCTIONS

## Troubleshooting

BEGIN Troubleshooting instructions

END Troubleshooting instructions

If you have any questions or run into any issues don't hesitate to open an [Issue](https://github.com/MCP-Manager/MCP-Checklists/issues), or start a [Discussion](https://github.com/MCP-Manager/MCP-Checklists/discussions).
