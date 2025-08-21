Evaluating MCP Servers for Security Risks
=========================================

This file contains some basic inspections and tests you can perform if you are unsure about the secureness of an MCP server you are considering using.

This resource was produced by the team at [MCP Manager](https://mcpmanager.ai) - the comprehensive security solution for enterprise MCP server use.

## :books: Contents

- [MCP Security Risks Overview](#-what-are-the-main-security-risks-from-mcp-servers)
- [Tool Metadata Inspection](#-tool-metadata-inspection)
- [OAuth Flow Testing](#-oauth-flow-test)
- [Comprehensive Screening/Protection for Other Security Risks](#%EF%B8%8F-comprehensive-screeningprotection-for-other-security-risks)

🔓 What are the main security risks from MCP servers?
---------------------------------------------

There are a vast range of MCP-based attack vectors and accidental security flaws. The main ones are:

-   Tool Poisoning:  Attackers insert malicious instructions for AI agents into a tool's metadata or outputs.

-   Rug Pull/Silent Redefinition:  Attackers retroactively add malicious instructions for AI agents into tool files.

-   Retrieval Agent Deception (RADE):  Malicious instructions placed in data or content retrieved by the AI agent.

-   Cross-Server Shadowing:  Hidden prompts in one tool influence how AI agents use another tool.

-   Server Spoofing/Tool Mimicry: A malicious server impersonates a legitimate server to trick the AI into sending data and requests to it.

-   Local Data Exfiltration/Ransomware: Uncontainerized local MCP servers access your files, exfiltrate data, implant viruses, and encrypt data (ransomware). 

-   Token Theft/Account Takeover:  Attackers exploit weak authentication/authorization processes to steal access tokens.

[Full list ](https://github.com/MCP-Manager/MCP-Checklists/blob/main/infrastructure/docs/mcp-security-threat-list.md)of MCP-based attack vectors, vulnerabilities, and mitigations

[Live protection tracker](https://mcpmanager.ai/protection-tracker/) - see which attack vectors MCP Manager can protect you against.

🧰 Tool Metadata Inspection
------------------------

Attackers can insert malicious instructions into tool metadata (such as the description field) to corrupt agents that interact with that tool, to facilitate data exfiltration, remote code execution, and a range of other high-impact attacks on you and your network. This is known as "[tool poisoning](https://mcpmanager.ai/blog/tool-poisoning/)".

### Inspection Methods:

You can inspect tool metadata from a sandboxed server before connecting it to your client using an app like Postman, or running a script in something like Python, to connect to the MCP and list its tools and associated metadata.

You can use the list of suspicious patterns below to manually inspect the tool, or instruct an LLM to do it for you.

A better way is to use an MCP gateway or proxy to do this for you, organize the metadata, and (depending on the gateway you have) even automatically flag or block tools with metadata that could be malicious, confusing, inadvertently harmful, or changed since the last time you reviewed & approved the metadata.

### Ongoing Inspections/Protection

With a gateway you can also "pin" safe tool descriptions and automatically quarantine a tool if its description or other metadata fields change. This protects you against "[rull-pull" style attacks](https://mcpmanager.ai/blog/mcp-rug-pull-attacks/).

You can use a scheduled script to re-screen tool metadata periodically to check for malicious updates, but obviously this is far less secure, laborious, and not scalable, compared to using a gateway. 

### Suspicious Signals/Patterns to Inspect For:

-   Email Addresses

-   Embedded URLs

-   References to Sensitive Files (for example, .env, ~/.gcp/credentials)

-   References to other tools (particularly references to tools that belong to a different server - which can be a sign of "Server Spoofing")

-   Use of "Override" Language (such as IMPORTANT, always, ignore etc. that could influence an AI into contravening user instructions and guidelines).

-   Use of language that could indicate exfiltration attempts (such as send to, export all, read and copy, etc. where it is not expected based on the tool purpose).

🪪 OAuth Flow Test
---------------

Using OAuth 2.0 or higher for authentication, as recommended - but not mandated - by the MCP spec, reduces risk by ensuring apps never see user credentials, allows for fine-grained permission control, and supports short-lived, scoped tokens which you easily revoke.

OAuth greatly minimizes exposure to credential theft, unauthorized access, and limits impacts from token theft, and corrupted AI agents.

However, the OAuth implementation in MCP is notoriously difficult. Configuration mistakes and limited support for fine-grained scoping

### Inspection Methods

Use MCP Inspector and OAuth 2.0 Debugger to query the MCP server's OAuth endpoints and test its response to an unauthorized access attempt through a simulated OAuth "handshake".

#### Step 1: Query the OAuth Endpoint

Check OAuth endpoints exist and are represented correctly.

-   Send a HTTP GET request to the well-known OAuth authorization server metadata endpoint: GET [https://[MCP-server-base-url]/.well-known/oauth-authorization-server](about:blank)

-   This should return a JSON with metadata that tells you where to perform OAuth authorization for this server, specifically:

-   authorization_endpoint

-   token_endpoint

-   registration_endpoint

-   jwks_uri (for key verification)

-   A side point; although you're not "required" to use a separate authorization server to issue access tokens it is best practice and highly recommended. Using the resource server (the MCP server) to both issue and receive tokens is not recommended.

#### Step 2: Query the OAuth Endpoint

Check the MCP server displays a trusted OAuth configuration with required scopes.

-   Send a HTTP GET request to the protected resource metadata endpoint: GET [https://[your-MCP-server-base-url]/.well-known/oauth-protected-resource](about:blank)

-   This should return a document that describes how the server expects authorization to be performed, specifically it should include:

-   Trusted Authorization Servers

-   Supported/required OAuth scopes (scopes_supported)

-   Supported bearer token methods (bearer_methods_supported)

-   The resource identifier ( resource )

#### Step 3: Test Authorization Enforcement

Check the server actually enforces authentication by sending some requests with invalid tokens/no token.

##### No Token:

-   Send a HTTP request to the protected endpoint identified in Step 1 above, but do not include an Authorization header

-   The server should respond with HTTP status: 401 Unauthorized, with a WWW-Authenticate header that points to theURL for OAuth resource metadata

##### Invalid Token:

-   Send a HTTP request to the protected endpoint identified in Step 1 above, but include an expired,invalid, or malformed token.

-   The easiest way to do this is insert a random string where the token should be (after Bearer in your header)

-   The server must respond with HTTP status: 401 and the correct error in the WWW-Authenticate header (e.g. "expired_token", or "invalid_token")

-   You can also repeat this with a request that has a valid token but invalid/missing scopes. This should return a HTTP status: 403 Forbidden with an "insufficient_scope" error

🛡️ Comprehensive Screening/Protection For Other Security Risks
-----------------------------------------------------

You can use the various methods above to screen MCP servers for basic security vulnerabilities.

Unfortunately there are a vast range of other vulnerabilities that exist in runtime actions and specific interactions between MCP clients, servers, or even external resources.

For example, "Advanced" Tool Poisoning - where malicious commands are secreted in tool outputs, such as error messages or helpful hints. Or Retrieval Agent Deception (RADE) where malicious instructions are planted in external/internal media or data the agent retrieves when attempting to complete a task

These kinds of vulnerabilities can't be prevented without some kind of interception layer between the client and server, such as an [MCP gateway](https://mcpmanager.ai/blog/mcp-gateway/) or proxy. MCP Gateways also allow you to add much more robust access controls, with fine-grained permissions, and additional scope parameters, which most MCP servers don't support out of the box.

If you have other security screening methods people can use to identify dangerous MCP servers then please feel free to contribute, following the steps here.

Hope this helps you!

From the MCP Manager Team

[MCP Manager](https://mcpmanager.ai/) is a comprehensive, enterprise-level security solution for your MCP ecosystem.
