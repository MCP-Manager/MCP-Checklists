# MCP Security Threat-List - With Key Mitigations

We are using this list to compile a comprehensive index of attack methods and security threats which target the Model Context Protocol (MCP) ecosystem, to help MCP users, agent builders, and those responsible for cybersecurity to reduce vulnerabilities and stay up to date with the latest threats. 

## Author Information
Created by the team at: [MCP Manager](https://mcpmanager.ai/).

MCP Manager is an MCP gateway which acts as a safety net for your organization's AI agents and their interactions with MCP servers and connected resources.

## 📚 Threat-List/Contents
- [General Mitigations Against Security Threats/Risks](general-mitigations-against-security-threats-and-risks)
- [Tool Poisoning](#-tool-poisoning)
- [Rug-Pull Updates](#-rug-pull-updates)
- [Retrieval Agent Deception (RADE)](#-retrieval-agent-deception-rade)
- [Cross-Server Shadowing](#-cross-server-shadowing)
- [Server Spoofing](#-server-spoofing)
- [Token Theft and Account Takeover](#-token-theft-and-account-takeover)

## ✔️ General Mitigations Against Security Threats and Risks

In addition to the specific mitigations against each MCP-based attack vector which you’ll find in the sections below, there are also general security measures*, that help prevent or reduce the impact, severity, and longevity of most MCP-based attacks. 

### Chief amongst these general mitigations are*:
- **Data Masking:** Replacing sensitive data (e.g., social security numbers) with user-defined masks before transmission to MCP servers as a fallback protection in the case of successful data exfiltration
- **Tool Access Controls:** Limit the servers and tools/fearures each AI agent can access based on the agent's "role" and relevance/requirement to complete its specified tasks 
- **Principle of Least Privilege:** Use an MCP gateway or similar tool to establish multiple identities for MCP servers with varying levels of access. Identities are then assigned such that an MCP outbound server (a gateway) uses the identity with the least access needed to accomplish its goals. 
- **Runtime Monitoring:** Automated, continuous monitoring of MCP traffic and AI agent behavior for suspicious patterns
- **Robust, High-Fidelity Logging:** Detailed audit trails of all interactions enable response teams to monitor routine behaviors, empower incident recovery teams to diagnose and resolve issues, and support automated systems to detect anomalous behavior.
- **Fine Grained Policies:** Act as guardrails against a range of attack vectors and harmful or unwanted agent behaviors. These policies can govern the actions that AI agents and human users alike can take when interracting with MCP servers, your tools, and your data.

*Some of these capabilities are only possible through the use of an MCP gateway like [MCP Manager](https://mcpmanager.ai/).

⬆️[Back to Threat-List/Contents](#-threat-listcontents)

## 🔺 Tool Poisoning

### Description
An indirect prompt injection attack where malicious and/or deceptive instructions or code are placed within a tool’s metadata (such as the tool’s description field) or within tool outputs (such as error messages or “helpful” tips for the LLM). 
#### Characteristics
- **Stealthy:** Delivery methods (tool metadata and outputs) are typically outside of the view of the human user
- **Passive-Infection:** Agents simply need to “read” tool descriptions when reviewing tool suitability for a task in order to be influenced by malicious instructions (akin to getting food poisoning simply by reading -the item on the menu!)
- **Virulent:** The low-level of contact needed, combined with the potential number of agents interacting with each tool’s metadata makes tool poisoning more virulent than standard prompt injection attacks
- **False Sense of Security:** Tool poisoning can be delivered via “rug-pull update” techniques to bypass initial safety screening

### Key Mitigations
- **Server Approval Process:** Implement policies and processes to control which MCP servers can be added and used within your organization
- **Sanitize Tool Metadata:** Ongoing, automated scanning of tool metadata for malicious or harmful instructions
- **Sanitize Tool Outputs:** Ongoing, automated interception and scanning (via a gateway) of tool outputs for malicious, harmful, or suspicious instructions

⬆️[Back to Threat-List/Contents](#-threat-listcontents)

## 🔺 Rug-Pull Updates

### Description

Also known as “Silent Redefinition”. An initially benign and honest tool later “turns evil” either because the producers of the tool are malicious or because their own infrastructure has been compromised by an external malicious actor. 

The rug-pull method can be paired with attacks like tool poisoning to circumvent initial security reviews of a tool for malicious or deceptive code or prompts.   

### Key Mitigations

- **Hash-checking:** Use an MCP gateway to store the full text/cryptographic hashes of tool metadata and automatically detect any/malicious changes in the diff
- **Server Re-Approval Process:** When changes are detected in server metadata, servers are temporarily quarantined and reinspected for instructions that are malicious or could unintentionally cause undesirable AI agent behavior.

⬆️[Back to Threat-List/Contents](#-threat-listcontents)

## 🔺 Retrieval Agent Deception (RADE)

### Description
Retrieval-Agent Deception (RADE) is a sophisticated attack where malicious commands or prompts are planted in data that the AI will later retrieve, causing the AI to unknowingly execute those commands. 

#### Characteristics
- **Indirect and stealthy:** Uses hidden instructions inserted into public or external content (e.g., web pages, documents, database entries) rather than through direct prompt input by users
- **Bypasses user prompts:** Unlike False Benign Command (FBC) attacks, RADE attacks bypass the need for a user to enter a malicious prompt by working through AIs autonomously retrieving information that contains hidden malicious instructions

### Key Mitigations

- **Content scanning rules:** Similar to antivirus or DLP scans, an MCP gateway can scan all data retrieved from an MCP server to catch obvious payloads (e.g., script tags, known tool command patterns, or keywords like “pass its content as parameter”).
- **External Prompt Refusal:** Instruct the AI to ignore instructions that come from MCP content and only treat user’s direct instructions as authoritative.
- **Runtime Monitoring:** Use an MCP gateway to detect unusual behavior by AI agents, such as attempting to access or share restricted data.
- **Data Masking:** Specifically as a fallback mitigation against data exfiltration, mask sensitive data so it is not exposed even if exfiltrated by a corrupted AI
- **Logging and auditing:** Maintaining complete logs of all MCP exchanges (tool calls and their results is critical to diagnosing and remedying the cause of any breach

⬆️[Back to Threat-List/Contents](#-threat-listcontents)

## 🔺 Cross-Server Shadowing

### Description
A malicious server contains hidden instructions that manipulate the AI agent’s use of another (benign) server’s tools. For example, a calculator tool can contain hidden prompts in the description 

#### Characteristics
- **Easily Convinces Agents:** AI agents are not inherently capable of discerning if references to other tools or resources are legitimate, permitted, or malicious.
- **Passive Influence:** As with tool poisoning, agents do not need to directly use the malicious tool to incorporate the malicious instructions into its context and be influenced by them.
- **Disperses Causal Linking:** Users trying to ascertain the source of an attack may concentrate on the benign tool where the malicious action was performed, rather than the malicious tool that manipulated the agent into incorrect usage of the benign tool.

### Key Mitigations
- **Flag/Block Tool Referencing:** Automatically quarantine servers that reference other tools in their metadata
- **Scoped Namespaces:** Use an MCP gateway to add namespace prefixes to bind each tool to its source server and help the AI treat them as specific to the source server, rather than applicable to other servers.
- **Tool Filtering/Limiting:** Limit agents range of available tools to those which are relevant to its tasks. This reduces the probability of cross-server shadowing occurring but does not prevent it entirely. 

⬆️[Back to Threat-List/Contents](#-threat-listcontents)

## 🔺 Server Spoofing

### Description
An attacker creates a malicious MCP server that impersonates a legitimate MCP server or intercepts the communications to it. The aim of server spoofing is to trick AI agents into interacting with the spoof server and to send requests or sensitive data to it.

#### Characteristics
Server spoofing can result in a **“man in the middle”** scenario where the malicious server is able to:
- Intercept tool calls
- Steal credentials
- Exfiltrate, record, or modify data
- Issue further malicious prompts to agents
- Execute unauthorized commands

### Key Mitigations
- **Server Whitelisting:** Users in an organization are only allowed to use MCP servers from a verified list
- **Duplicate Server Detection:** Use an MCP gateway to identify servers that mimic known/approved servers
- **Duplicate Tool Detection:** Use an MCP gateway to identify tools that mimic approved/known servers, based on similarities in tool names and other tool metadata
- **Two-Way Authentication Handshakes:** Enforce policies that only allow users and agents to use MCP servers that have mutual TLS (mTLS) authentication, which requires the MCP client to cryptographically verify the identity of the MCP server (and vice versa)

⬆️[Back to Threat-List/Contents](#-threat-listcontents)

## 🔺 Token Theft and Account Takeover

### Description
Attackers exploit session management flaws, compromised MCP server code, malware, poor storage practices, or weak authentication to steal access tokens embedded in headers, request URLs, or environment variables. 

#### Characteristics
- **Broad Attack Scope:** Attackers can use stolen tokens to access, modify, delete, and steal sensitive data, impersonate and send messages as the victim, and continue to silently monitor the victim’s activity and communications.
- **Under The Radar:** Unlike traditional account hacks, token theft via MCP will not typically trigger suspicious login notifications.

### Key Mitigations

- **Robust Authentication and Authorization Methods:** Implement robust authentication and authorization between MCP hosts, clients, and servers. Use OAuth 2.0, which uses short-lived access tokens (instead of static API keys)
- **Just-In-Time (JIT) Access Tokens:** Implement authorization methods that support JIT task-specific tokens, which are short-lived and expire after the completion of the task they were generated to facilitate.
- **Sender-Constrained Tokens:** Use proof-of-posession authentication methods (such as DPoP or mTLS) that require both the access token and a unique cryptographic key pair

⬆️[Back to Threat-List/Contents](#-threat-listcontents)
