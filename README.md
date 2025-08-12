# MCP-Checklists

We're a team of security and AI enthusiasts building [MCP Manager](https://mcpmanager.ai), a comprehensive MCP security solution for businesses of all sizes.

In this repository we will publish a range of checklists, indexes, lessons learned and helpful utilities to help you adopt and use AI agents and MCP servers securely - without losing pace in the AI race.

We welcome contributions and suggestions - here's the [instructions for contributing](./CONTRIBUTING.md).

## 📚 Table of Contents

- [Use Docker to Secure MCP servers](#-use-docker-to-secure-mcp-servers)
- [Authentication and Authorization](#-authentication-and-authorization)
- [Logging, Auditing, and Observability](#-logging-auditing-and-observability)
- [Threats and Mitigation](#%EF%B8%8F-threats-and-mitigation)  
- [AI Agent Building & Security](#-ai-agent-building-and-security)

## 🐳 Use Docker to Secure MCP servers

> TLDR: [How to Run MCP Servers Securely](./infrastructure/docs/how-to-run-mcp-servers-securely.md)

Installing and running MCP servers on a computer is equivalent to installing and running any other software on it. Locally running MCP servers have unlimited access to your personal files, creating risks of data exfiltration, virus implantation & propagation, or data encryption attacks (aka Ransomware).

[Docker](https://www.docker.com/get-started/) is a containerization solution that is free, open source and widely supported across all the major operating systems.

Running MCP servers inside of Docker containers allows you to run them in a sandboxed environment that you have full control over. You decide which files and folders to expose to the container, can define rules for HTTP and Websocket traffic, and selectively expose environment variables as opposed to leaking unintended secrets.

Running MCP servers inside Docker increases their security and gives you more control on what data and capabilities the server has access to. It's not a complete bulletproof solution however, if you're not careful you can still give docker containers running locally unfettered access to your VPN / private networks.

We understand learning complex technologies like Docker can be intimidating, but we've made our best effort to offer you examples, documentation, and helpful scripts to get you started running MCPs securely.

Take a look at [How to Run MCP Servers Securely](./infrastructure/docs/how-to-run-mcp-servers-securely.md) guide to learn about our helpful scripts and Dockerfiles that will get you started running MCP Servers more securely in no time.

## 🔐 Authentication and Authorization 

### Checklists

- [Troubleshooting OAuth in MCP Checklist](./infrastructure/docs/troubleshooting-oauth.md)
- MCP Identity Management

### Index Lists

## 📝 Logging, Auditing, and Observability

### Checklists

- [MCP Logging, Auditing, and Observability Checklist](./infrastructure/docs/logging-auditing-observability.md)
- MCP Enterprise Auditing Checklist
- MCP Reports You Need

### Index Lists

## 🛡️ Threats and Mitigation

### Checklists

- Prompt Sanitization Measures
- Evaluating MCP Servers For Threats and Risks

### Index Lists

- [MCP Server Cybersecurity Threat-List (With Mitigations)](./infrastructure/docs/mcp-security-threat-list.md)
- MCP Server Attack Index

### Policy Templates

## 🤖 AI Agent Building and Security

### Checklists

- [Building AI Agents](./infrastructure/docs/ai-agent-building.md)
- AI Agent Regulatory Compliance
- AI Agent Identity Management
- Streamlining AI Agent Tool Availability and Selection

### Index Lists
