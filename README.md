# MCP-Checklists

We're a team of security and AI enthusiasts building [MCP Manager](https://mcpmanager.ai), a comprehensive MCP security solution for businesses of all sizes.

In this repository we will publish a range of checklists, indexes, lessons learned and helpful utilities to help you adopt and use AI agents and MCP servers securely - without losing pace in the AI race.

**⭐Star this repo to stay up to date and avoid missing that guide you know you'll need in the future!**

We welcome contributions and suggestions - here's the [instructions for contributing](./CONTRIBUTING.md).

## 📚 Table of Contents

- **[MCP Deployment Infrastructure](#-MCP Deployment Infrastructure)**
    - [Using Docker to Secure Local MCP servers](#-using-docker-to-run-local-mcp-servers-securely)
    - [How To Expose LocalHost MCPs To The Internet](./infrastructure/docs/how-to-expose-localhost-mcps-to-the-internet.md)
    - [How To Run STDIO Servers Remotely](./infrastructure/docs/how-to-run-stdio-mcps-remotely.md)
- **[Authentication and Authorization](#-authentication-and-authorization)**
    - [Troubleshooting OAuth in MCP Checklist](./infrastructure/docs/troubleshooting-oauth.md)
    - [MCP Identity Management Checklist](./infrastructure/docs/mcp-identity-management-checklist.md)
- **[Logging, Auditing, and Observability](#-logging-auditing-and-observability)**
    - [MCP Logging, Auditing, and Observability Checklist](./infrastructure/docs/logging-auditing-observability.md)
- **[Security Threats and Mitigation](#%EF%B8%8F-threats-and-mitigation)**
    - [Detecting & Prevening Shadow MCP Use](./infrastructure/docs/shadow-mcp-detect-prevent.md)
    - [MCP Server Cybersecurity Threat-List (With Mitigations)](./infrastructure/docs/mcp-security-threat-list.md)
    - [MCP Server Reported Vulnerabilities Index](./infrastructure/docs/reported-vulnerability-index.md)
    - [Evaluating MCP Servers For Threats and Risks](./infrastructure/docs/security-screening-mcp-servers.md)
- **[AI Agent Building, Optimization, & Security](#-ai-agent-building-and-security)**
    - [How to Improve MCP Tool Selection](./infrastructure/docs/improving-tool-selection.md)
    - [AI Agents Build Checklist](./infrastructure/docs/ai-agent-building.md)

## 🔌 MCP Deployment Infrastructure

- [Using Docker to Run Local MCP Servers Securely](./infrastructure/docs/how-to-run-mcp-servers-securely.md)
- [How To Expose LocalHost MCPs To The Internet](./infrastructure/docs/how-to-expose-localhost-mcps-to-the-internet.md)
- [How To Run STDIO Servers Remotely](./infrastructure/docs/how-to-run-stdio-mcps-remotely.md)

Sometimes running MCP servers inside a docker conatiner is not an option, either due to the specifics of the MCP server you are using, or 

### 🐳 Using Docker to Run Local MCP Servers Securely

> TLDR: [How to Run MCP Servers Securely](./infrastructure/docs/how-to-run-mcp-servers-securely.md)

Installing and running MCP servers locally is equivalent to installing and running any other software on your computer. Locally running MCP servers have **unlimited access to all your files,** creating risks of data exfiltration, token theft, virus infection and propagation, or data encryption attacks (Ransomware).

[Docker](https://www.docker.com/get-started/) is a containerization solution that is free, open source, and widely supported across all major operating systems.

#### Why You Should Use Docker to Containerize Local MCP Servers

Running MCP servers inside Docker containers allows you to run them in a sandboxed environment that you have complete control over. You decide which files and folders to expose to the container, can define rules for HTTP and WebSocket traffic, and selectively expose environment variables instead of unintentionally leaking secrets.

Using Docker to containerize your MCP servers reduces security risks and gives you more control over what data and capabilities the server has access to. It's not a complete bulletproof solution, however, because if you're not careful, you can still give Docker containers running locally unfettered access to your VPN / private networks.

#### Guide and Docker Files

We understand that learning complex technologies like Docker can be intimidating, but we've made our best effort to provide you with examples, documentation, and helpful scripts to get you started running MCPs securely.

Use [How to Run Local MCP Servers Securely](./infrastructure/docs/how-to-run-mcp-servers-securely.md) to learn about our helpful scripts and Dockerfiles that will get you started running local MCP Servers securely in no time.

## 🔐 Authentication and Authorization 

### Checklists

- [Troubleshooting OAuth in MCP Checklist](./infrastructure/docs/troubleshooting-oauth.md)
- [MCP Identity Management Checklist](./infrastructure/docs/mcp-identity-management-checklist.md)

## 📝 Logging, Auditing, and Observability

### Checklists

- [MCP Logging, Auditing, and Observability Checklist](./infrastructure/docs/logging-auditing-observability.md)
- [Detecting & Prevening Shadow MCP Use](./infrastructure/docs/shadow-mcp-detect-prevent.md)

## 🛡️ Threats and Mitigation

### Checklists

- [Evaluating MCP Servers For Threats and Risks](./infrastructure/docs/security-screening-mcp-servers.md)

### Index Lists

- [MCP Server Cybersecurity Threat-List (With Mitigations)](./infrastructure/docs/mcp-security-threat-list.md)
- [MCP Server Reported Vulnerabilities Index](./infrastructure/docs/reported-vulnerability-index.md)

## 🤖 AI Agent Building and Security

### Checklists/Guides

- [Building AI Agents](./infrastructure/docs/ai-agent-building.md)
- [How to Improve MCP Tool Selection](./infrastructure/docs/improving-tool-selection.md)

