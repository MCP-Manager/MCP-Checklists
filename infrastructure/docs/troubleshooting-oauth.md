# MCP OAuth Troubleshooting Checklist

Use this checklist to help you resolve common issues when adding OAuth to MCP servers.

Along with the checklist items below you can also use [OAuth Debugger](https://oauthdebugger.com/) to help troubleshoot and fix issues with your setup.

## Author Information
Created by the team at: [MCP Manager](https://mcpmanager.ai/).

Our team will be adding lots of valuable checklists and other resources for people creating and securing their MCP ecosystem.

**⭐ Star this repo to stay up to date and avoid missing that guide you know you'll need in the future!**

MCP Manager is an MCP gateway which acts as a safety net for your organization's AI agents and their interactions with MCP servers and connected resources.

## 📚 Table of Contents
- [OAuth Overview](#overview-of-the-oauth-authorization-flow)
- [MCP OAuth Checklist](#mcp-oauth-checklist)
  - [Correct Endpoints Exist and Are Discoverable](#correct-endpoints-exist-and-are-discoverable)
  - [Correct Token Format & Header Setup](#correct-token-format--header-setup)
  - [Correct Setup of HTTP 401 Error](#correct-setup-of-http-401-error)
  - [Issues with audience/claims validation](#issues-with-audienceclaims-validation)
  - [Check Client Registration](#check-client-registration)
  - [PKCE (Proof Key for Code Exchange) support issues](#pkce-proof-key-for-code-exchange-support-issues)
- [More Reading and Resources](#more-reading-and-resources)

## OAuth Overview

The OAuth authorization flow (sometimes called the OAuth handshake) is a process where a user authorizes an application to access specific data from another service on their behalf, without sharing their password; this is done by redirecting the user to the service, obtaining their consent, and exchanging temporary tokens for secure, limited access.</p>

## Overview of the OAuth Authorization Flow:
- The **application** requests authorization from the user to access a protected resource **(resource server)**
- The **user** approves the request, and the **application** receives an authorization grant
- The **application** presents authentication of its own identity and the authorization grant to the authorization server
- The **authorization** server validates the **application's** identity and authorization grant. If both are valid the authorization server issues an access token to the **application**</li>
- The **application** presents the access token to the **resource server**

### Diagram of the OAuth Authorization Flow:

![Diagram of the OAuth process flow, sometimes known as the OAuth handshake](https://assets.digitalocean.com/articles/oauth/abstract_flow.png "Diagram from Digitalocean.com")

Diagram from [Digital Ocean](https://www.digitalocean.com) 

### Diagram of the OAuth Authorization Flow With MCP Servers:

![Diagram of the OAuth process flow with MCP servers](https://images.ctfassets.net/23aumh6u8s0i/SThohuyEi51pqc2l0dbyt/27aa3ea282d2c66e280a8633b33c2d88/Uploaded_from_MCP_Leadership_Blog "Digram from Auth0.com")

Diagram from [Auth0.com](https://www.auth0.com)

## MCP OAuth Troubleshooting Checklist

### Correct Endpoints Exist and Are Discoverable
Missing, inaccessible, or misconfigured discovery endpoints are among the most common reasons OAuth flows fail to initiate.

Correct endpoints must exist and be discoverable for the OAuth flow to start and function properly. These well-known URLs provide clients with essential metadata (such as authorization and token endpoints) enabling them to interact dynamically with the OAuth server without hardcoding values.

#### Common Symptoms:
- Client fails to start the OAuth flow
- “Not connected” message when initiating tool
- “Failed to discover endpoints” error message

#### Remediation:
- [ ] Ensure that the endpoint `./well-known/oauth-authorization-server` is present and accessible - typically it should be at the base path of your MCP server
- [ ] Visit this endpoint’s URL (e.g. [https://my-mcp-domain/.well-known/oauth-authorization-server](https://my-mcp-domain/.well-known/oauth-authorization-server)) - confirm the response:
  - Uses HTTPS and the URL begins with `https://`
  - Includes the HTTP header: `content-type: application/json`
  - Returns well-formed JSON that contains all required OAuth metadata fields:
    - issuer
    - authorization_endpoint
    - Token_enpoint
- [ ] Verify there are no network restrictions preventing the client from reaching the endpoint
- [ ] Check that the client’s configuration logic points to the correct base URL so that it can fetch the required metadata


### Correct Token Format & Header Setup
The client must send the access token to the MCP server within the authorization header, with the scheme “Bearer”. The MCP server then uses this token to validate the request. Missing tokens, or incorrectly formatted tokens or headers can cause errors in the OAuth flow.

#### Common Symptoms:
- OAuth completes but the server still rejects authenticated requests
- “Authentication token not found” or “missing authorization header” errors

#### Remediation:
- [ ] Ensure all calls include the token `Authorization: Bearer <access_token>`
- [ ] If you’re using a reverse proxy (e.g. Cloudflare), ensure it passes the Authorization header to your backend: `proxy_set_header Authorization $http_authorization;`
- [ ] Use cURL, Postman, or browser developer tools to confirm the client sets the header properly
- [ ] If using a reverse proxy, ensure it is configured to forward the Authorization header properly onto the MCP server

### Correct Setup of HTTP 401 Error
When the MCP server cannot get an access token - or a valid access token - via the authorization header in the MCP Client’s access request, it should return a HTTP 401 Unauthorized error with a WWW-Authenticate Header.

This header should contain the URL the client can use to retrieve the resource metadata. Improper formatting of this header will cause the authentication flow to fail.

#### Common Symptoms:
- No OAuth prompt appears following an access attempt
- Server returns: HTTP 401: “Missing required Authorization Header”

#### Remediation:
- [ ] Use cURL or Postman to trigger a request to access a protected resource without an access token, and check that the HTTP 401 response includes a WWW-Authenticate header
- [ ] Check that the WWW-Authenticate header contains the authentication scheme (typically Bearer)
- [ ] Check the `resource_metadata` parameter is present and correct. For example your 401 output should look something like this: HTTP/1.1 401 Unauthorized WWW-Authenticate: Bearer resource_metadata="https://my-mcp-server/.well-known/oauth-protected-resource"
- [ ] Check for typos and ensure quotation marks are in the right place (as per the example above).
- [ ] If your header is not present or is not formatted correctly then correct the server’s 401 response logic.

### Issues with audience/claims validation
Problems with audience and claims validation occur when an access token’s “aud” (audience) claim does not exactly match the expected audience identifier of the MCP server/protected resource. Tokens can also be rejected when other required claims (such as the issuer or scopes) are missing or invalid.

#### Common symptoms:
- Token used is valid but tool calls return 401 or 403 errors
- Error detail includes “Invalid token audience” or “Missing required claim: aud or sub”

#### Remediation:
- [ ] On the client side, ensure the resource parameter (or equivalent audience field) sent in the authorization request matches the MCP server's expected audience identifier (usually a URL or logical identifier like `https://your-mcp-server.com`).
- [ ] On the server side, check that the MCP server is configured to validate the expected `aud` (audience) claim during token validation. This is often set via a configuration variable such as `JWT_AUDIENCE`, `EXPECTED_AUDIENCE`, or `RESOURCE_IDENTIFIER`.
- [ ] There may be a mismatch between the audience expected by the server and the audience specified in the client’s token request or the actual `aud` value present in the access token. These should all match exactly.
- [ ] Check the decoded access token itself (by using a JWT decoder or your server logs) to inspect the actual value of the `aud` claim. Ensure it exactly matches what the MCP server expects - this includes case sensitivity, scheme (http/https), and any trailing slashes.
- [ ] If using a third-party OAuth provider (e.g., Auth0, Okta, Azure AD, Keycloak), check the application/client configuration to verify:
  - The client is authorized to request the correct audience
  - The access tokens issued include the correct `aud` claim
  - Ensure the authorization server is issuing all required claims (including `aud`, `iss`, `sub`, and `scope`) based on how the client and resource are registered.
- [ ] Enable detailed or debug-level logging on your MCP server to identify audience or claim validation failures. Errors may appear as `invalid_token`, audience mismatch, 401 Unauthorized, or other similar messages.

### Check Client Registration
Errors in the client registration flow can occur if the registration endpoint is missing or not discoverable, if the client sends incorrect or incomplete metadata, or if the server doesn’t allow anonymous registration.

Any of these errors can prevent the agent from acquiring the credentials it needs to initiate the OAuth flow.

#### Common symptoms:
- OAuth flows don’t start or fail early
- Token exchange was rejected
- “Unauthorized client” or “Invalid client credentials” error

#### Remediation:
- [ ] Check that the following are present and valid in the client’s request JSON payload:
  - `client_name`
  - `redirect_uris`
  - `grant_types`
  - `Scope`
- [ ] Check the client is locally storing the client ID (and secret if provided)
- [ ] Use cURL or your browser to confirm the client is accurately reading the server’s metadata for the registration endpoint
- [ ] Check that the dynamic/anonymous client registration is enabled in the MCP server - confirm this via the server config and/or logged registration attempts

### PKCE (Proof Key for Code Exchange) support issues
PKCE requires AI agents/apps that cannot store a client secret to generate a random `code_verifier` and send a `code_challenge` during the initial authorization request.

The client must then present the original `code_verifier` during the token exchange step to the authorization server to verify the request is from the original requesting client.

#### Common symptoms:
- `"error": "access_denied"`, `"error_description": "Unauthorized"`
- `"invalid_grant"`
- `"PKCE code_verifier is missing or invalid"`
- `"code_verifier required"`
- Other error messages that include “PKCE” or “code_verifier”

#### Remediation:
- [ ] Ensure you use a well supported OAuth2 client library - you can find some [reference implementations here](https://oauth.net/code/javascript/)
- [ ] Check in the client code/runtime storage to confirm that the `code_verifier` is:
  - generated as a high-entropy random string of 43-128 characters
  - Preserved without truncation or other changes between the authorization request and token request
- [ ] Check in the client’s network logs to confirm that the client is sending the `code_verifier` during the token request POST to the `/token` endpoint
- [ ] Check that the token request includes all these parameters:
  - `grant_type=authorization_code`
  - `code`
  - `redirect_uri`
  - `client_id`
  - `code_verifier`

## More Reading and Resources:
The following articles provide a fairly complete implementation of the OAuth flows with Dynamic Client Registration:

- [NodeJS TypeScript OAuth2 Server with Express - Specification & Implementation](https://levelup.gitconnected.com/nodejs-typescript-oauth2-server-with-express-specification-implementation-de14ed081182)
- [OAuth2Server with Dynamic Client Registration - Express & TypeScript](https://levelup.gitconnected.com/oauth2server-with-dynamic-client-registration-express-typescript-922a6c06802a)

While this implementation is too naive for adoption as is, hopefully diving deeper into an example and lessons learned will help you on your journey to building your own OAuth flows.
