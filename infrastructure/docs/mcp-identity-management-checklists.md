MCP Identity Management Checklist
=================================

You can use this checklist to help you implement robust enterprise-level identity management for your MCP ecosystem.

Some of the measures included may not be necessary for your aims/organization type, and may require the use of an [MCP gateway/proxy](https://mcpmanager.ai/blog/mcp-gateway/), or additional elements of security infrastructure such as an identity provider (IdP).

👤 Identity Provision
------------------

MCP servers do not come readily equipped with functionality that allows you to create, assign, and manage identities that control access to resources, data, and the permissions and capabilities each identity has when interacting with those resources and data.

This means you need an intermediary system, such as an MCP gateway, and/or IdP (Identity Provider) to create, assign, manage, revoke, and monitor identities, and enforce their use.

The checklist below provides the fundamentals of how identities should be configured and managed to maximize security and prevent accidental damage to data and resources, too.

- [ ] AI agents should be provisioned with distinct, defined identities that have fine-grained role-based access controls that specify which tools should be made available to this user/agent from each server.

- [ ] Ensure all identities can only be issued, modified, and revoked by admin-level users

- [ ] Event logs should include identifiers to trace which user or agent performed which action

- [ ] All agent actions/events should also include a logged human user attribution ID, to record who the agent was instructed by, or working on behalf of, when they executed an action. This This also applies to delegations from agent to agent to ensure traceability.  

- [ ] Ensure creation, assignment, modification, and revocation of identities are logged comprehensively 

- [ ] Regularly review user identities and their entitlements to ensure they are valid and up-to-date

- [ ] Implement a reliable process to revoke identities when employees leave and similar scenarios. Ideally, embed this within existing processes for access termination. 

🔐 Authorization
-------------

The MCP specification makes authorization optional, and recommends - but doesn't mandate - OAuth as an authorization method.

This means there is a mix of servers that:

- [ ] Lack authorization

- [ ] Use OAuth

- [ ] Use another form of authorization (which is likely less secure than OAuth e.g., bearer tokens directly within HTTP headers)

The responsibility to implement secure methods of accessing MCP servers in your organization falls on you. **Follow the checklist below to help you do this.**

- [ ] Adopt approaches and policies that align with the principle of least privilege (PoLP)

- [ ] Opt for servers that use OAuth 2.0/2.1

- [ ] If you want to use an MCP server that doesn't support OAuth, then use a gateway, proxy, or similar intermediary layer to enforce OAuth authorization flows for any access attempts

- [ ] Also consider using an MCP gateway to:

- [ ] Centralize, standardize, and provide a single point of observation and management for all your servers' OAuth flows, instead of managing them separately

- [ ] Impose additional scopes to access tokens, to gain more control over the level of access and permissions for each user

- [ ] Ensure all tokens are scoped with the principle of least privilege

- [ ] Test each server to ensure that it enforces authorization controls. For example, try making access requests with invalid formats, incorrect tokens, or token parameters (particularly scopes). Confirm these attempts are rejected by the server with the correct error details in the response.

- [ ] If you use dynamic MCP client registration, then combine it with a manual approval workflow for new clients to prevent unauthorized onboarding

- [ ] Consider mapping OAuth scopes/claims to individual tools - or use an MCP gateway like MCP Manager - to enable tool-specific access levels, and to prevent overprivilege and access leakage 

- [ ] Use cryptographically strong, short-lived tokens with continuous rotation and expiration handling.

- [ ] Consider adding user approval to agent workflows before executing high-risk actions (such as export, delete, write, or accessing sensitive data)

- [ ] Containerize local MCP servers to prevent unintended access to files, and consider disconnecting from your corporate network to prevent unauthorized access to network resources. More details in our [Guide to Securing Local MCP Servers](https://github.com/MCP-Manager/MCP-Checklists/blob/main/infrastructure/docs/how-to-run-mcp-servers-securely.md)\
If you're struggling to set up OAuth for MCP servers, you can use our [OAuth for MCP Troubleshooting Checklist](https://github.com/MCP-Manager/MCP-Checklists/blob/main/infrastructure/docs/troubleshooting-oauth.md)

🪪 Authentication 
---------------

Enterprise-level authentication for MCP server usage requires the use of an MCP gateway that is integrated with an identity provider (IdP), alongside robust processes and policies to ensure the strength of the authentication methods used.

- [ ] Use environment variables, secrets management tools, MCP gateways, or equivalents rather than hardcoding any credentials

- [ ] Integrate with SSO/SAML if available

- [ ] Mandate and enforce multi-factor authentication (MFA)

- [ ] Ensure regular rotation of secrets (passwords, keys, etc.) that are used with MCP servers, or resources that MCP servers and AI agents have access to

- [ ] Mandate PKCE (Proof Key for Code Exchange) in OAuth flows to authenticate identities and prevent intercepted/stolen tokens from being used by attackers

- [ ] Always use port 443 (HTTPS / SSL) to connect to MCP servers; connecting to MCP servers using unencrypted HTTP traffic risks leaking secrets and other valuable information.

🛡️ MCP Gateways Offer Optimal Identity Management
----------------------------------------------

An MCP gateway like [MCP Manager](https://mcpmanager.ai/) is essential for using MCP servers at enterprise level.

Adding an MCP gateway allows you to implement and manage the various components of identity management, protect your organization from the full spectrum of MCP-based attack vectors, and make the benefits of MCP servers accessible to technical and non-technical personnel alike.

[MCP Manager](https://mcpmanager.ai/) is the MCP gateway that gives organizations comprehensive protection against security threats and control over their MCP ecosystem.
