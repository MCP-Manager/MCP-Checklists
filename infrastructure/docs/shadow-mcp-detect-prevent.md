# 👥 Detecting & Preventing Shadow MCP Server Usage

## Author Information

Created by the team at: [MCP Manager](https://mcpmanager.ai/). MCP Manager is an MCP gateway which ensures secure enterprise adoption of AI agents and MCP servers.

Our team will be adding lots of valuable checklists and other resources for people creating and securing their MCP ecosystem.

⭐ Star this repo to stay up to date and avoid missing that guide you know you'll need in the future!

## 📚 Table of Contents

- [Intro/Disclaimer](#-introdisclaimer)
- [Process and Policy Directives](#-process-and-policydirectives)
- [Shadow Server Detection]([url](#%EF%B8%8F-shadow-server-detection))
    - [Network Traffic & Usage Monitoring](#-network-traffic-and-usage-monitoring)
    - [AI Agents]([url](#-ai-agents))


## 👋 Intro/Disclaimer

Below is a mix of steps to follow and options to prevent and uncover shadow MCP server use in your organization.

If you don't know what shadow servers are, it's essentially the same as shadow IT - people in an organization using MCP servers that haven't been approved by, and aren't visible to the organization's responsible people - the IT, infosecurity, or cybersecurity teams.

Note that some of these recommendations are dependent on having specific technologies in place, or consist of a choice of multiple options to achieve the same capability.

Of course, all of the below are just helpful, practical suggestions. It is ultimately your responsibility to decide how you will secure your organization against shadow MCP server use and other MCP-based security risks. For comprehensive mitigation against MCP-based security risks use an MCP gateway like our own MCP Manager.

## 👮 Process and Policy/Directives

-   **Create and document a clear process (workflow)** for requesting, reviewing, and approving new MCP servers. This process should include what steps and/or utilities reviewing personnel should follow to detect security threats or other issues in MCP servers and their tools, such as checking tool metadata for malicious instructions.
-  **Maintain an MCP server inventory** that includes details like the server's approval status, who has access rights to it, when it was added, who requested and approved it, and other key information that would be useful when auditing and evaluating your MCP server stack. If you are using an [MCP gateway](https://mcpmanager.ai/blog/mcp-gateway/) or proxy then your inventory will be created and updated automatically when you add servers to it.
- **Create a robust MCP server usage policy** for your organization, which makes it clear that:
    -   All MCP servers must be submitted to, reviewed, and approved by the information security team (or equivalent) before use.
    -   No one should use unauthorized MCP servers
    -   How to submit a new MCP server for review
    -   What to do if you become aware of an unauthorized MCP server
    -   What to do if you become aware of people using authorized MCP servers that they shouldn't have access to (or performing actions they don't have permissions for).

-  **Distribute easily accessible guidance** which explains your MCP Server Use Policy and process for requesting a new server or access to an existing server (if you have access policies in place).
-  **Require explicit agreement** by creating a process (such as using a survey or forms software) to ensure that everyone in your organization reviews your guidance and policy, understands the reasons why following your policy and processes is essential, and formally agrees to abide by your policy and processes.

## 👁️ Shadow Server Detection

In addition to ensuring every team member knows how to add new MCP servers and how and why to report the use of unauthorized servers, there are automated methods you can use to scan your environment and identify unauthorized servers.

Below are some options you can use.

### 🚦 Network Traffic and Usage Monitoring

If your organization uses a Next-Generation Firewall, IDS (Intrusion Detection System), IPS (Intrusion Prevention System), or other platform with deep packet inspection capabilities, you can configure it to identify MCP server use signatures and patterns, such as:

-   JSON messages including "jsonrpc": "2.0" and **method** calls including any of the below:
    -    initialize
    -    tools/list
    -    tools/call
    -    sampling/complete
    -    elicitation/request
    -    notifications/tools/list_changed
    -    _For example:_
```
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "tools": {}
    },
    "clientInfo": {
      "name": "example-client",
      "version": "1.0.0"
    }
  }
}
```  
-   Calls to typical MCP endpoints (e.g., /mcp, /api/mcp, /messages)
-   Response headers that include values like "MCP-Session-ID" 
-   Responses using Content-Type"text/event-stream" (used in SSE MCP transports)

If your organization uses an EDR (Endpoint Detection and Response) solution, or an IDS you can use it to:

-   Monitor for common MCP processes
-   Use custom detection rules/YARA signature to flag typical MCP server launch procedures (e.g., python mcp-server.py, or node mcp-sever.js)
-   Also use a file system watcher to flag when MCP config files or registration scripts are added (e.g. mcp_server.py)

### 🤖 AI Agents

In the near-future you will be able to use an AI agent to scan for MCP usage signals in your organization. These agents use most of the same detection methods as you would build into a script (see above).

However, unlike using a script, an agent based system can provide real-time detection of new MCP servers, and automation of mutli-step workflows and enforcement mechanisms.

We're not able to provide comprehensive guidance on how to build your own shadow MCP "guard dog" style agent right now. We plan to add some more detailed instructions soon, but for now check out our [AI agent building checklist](https://github.com/MCP-Manager/MCP-Checklists/blob/main/ai-agent-building.md).

## Securing MCP Server Use for Enterprise

Shadow MCP use is just one of the many security risks that enterprises using AI and MCP servers need to protect themselves against. Here is a [list of the key MCP-based security risks](https://github.com/MCP-Manager/MCP-Checklists/blob/main/infrastructure/docs/mcp-security-threat-list.md) you should be aware of right now.

🛡️ For **comprehensive protection** against MCP and AI security risks use - [MCP Manager](https://mcpmanager.ai/).
