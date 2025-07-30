# MCP Security Threat-List - With Key Mitigations

We are using this list to compile a comprehensive index of attack methods and security threats which target the Model Context Protocol (MCP) ecosystem, to help MCP users, agent builders, and those responsible for cybersecurity to reduce vulnerabilities and stay up to date with the latest threats. 

## Author Information
Created by the team at: [MCP Manager](https://mcpmanager.ai/).

MCP Manager is an MCP gateway which acts as a safety net for your organization's AI agents and their interactions with MCP servers and connected resources.

## 📚 Threat-List/Contents
- General Mitigations Against Security Threats/Risks
- [Tool Poisoning](#-tool-poisoning)
- Rug-Pull Updates
- Retrieval Agent Deception (RADE)
- Cross-Server Shadowing
- Server Spoofing
- Token Theft and Account Takeover

## ✔️ General Mitigations Against Security Threats/Risks

In addition to the specific mitigations against each MCP-based attack vector which you’ll find in the sections below, there are also general security measures*, that help prevent or reduce the impact, severity, and longevity of most MCP-based attacks. 

### Chief amongst these general mitigations are*:
- **Data Masking:** Replacing sensitive data (e.g., social security numbers) with user-defined masks before transmission to MCP servers as a fallback protection in the case of successful data exfiltration
- **Tool Access Controls:** Limit the servers and tools/fearures each AI agent can access based on the agent's "role" and relevance/requirement to complete its specified tasks 
- **Principle of Least Privilege:** Use an MCP gateway or similar tool to establish multiple identities for MCP servers with varying levels of access. Identities are then assigned such that an MCP outbound server (a gateway) uses the identity with the least access needed to accomplish its goals. 
- **Runtime Monitoring:** Automated, continuous monitoring of MCP traffic and AI agent behavior for suspicious patterns
- **Robust, High-Fidelity Logging:** Detailed audit trails of all interactions enable response teams to monitor routine behaviors, empower incident recovery teams to diagnose and resolve issues, and support automated systems to detect anomalous behavior.
- **Fine Grained Policies:** Act as guardrails against a range of attack vectors and harmful or unwanted agent behaviors. These policies can govern the actions that AI agents and human users alike can take when interracting with MCP servers, your tools, and your data.

*Some of these capabilities are only possible through the use of an MCP gateway like [MCP Manager](https://mcpmanager.ai/).

## 🤮 Tool Poisoning

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

## Rug-Pull Updates

### Description

Also known as “Silent Redefinition”. An initially benign and honest tool later “turns evil” either because the producers of the tool are malicious or because their own infrastructure has been compromised by an external malicious actor. 

The rug-pull method can be paired with attacks like tool poisoning to circumvent initial security reviews of a tool for malicious or deceptive code or prompts.   

### Key Mitigations

- **Hash-checking:** Use an MCP gateway to store the full text/cryptographic hashes of tool metadata and automatically detect any/malicious changes in the diff
- **Server Re-Approval Process:** When changes are detected in server metadata, servers are temporarily quarantined and reinspected for instructions that are malicious or could unintentionally cause undesirable AI agent behavior.

## Retrieval Agent Deception (RADE)

### Description
Retrieval-Agent Deception (RADE) is a sophisticated attack where malicious commands or prompts are planted in data that the AI will later retrieve, causing the AI to unknowingly execute those commands. 

#### Characteristics
- **Indirect and stealthy:** Uses hidden instructions inserted into public or external content (e.g., web pages, documents, database entries) rather than through direct prompt input by users
- **Bypasses user prompts:** Unlike False Benign Command (FBC) attacks, RADE attacks bypass the need for a user to enter a malicious prompt by working through AIs autonomously retrieving information that contains hidden malicious instructions


### Key Mitigations

## NAME

### Description

#### Characteristics
- 

### Key Mitigations

## NAME

### Description

#### Characteristics
- 

### Key Mitigations

## NAME

### Description

#### Characteristics
- 

### Key Mitigations

## NAME

### Description

#### Characteristics
- 

### Key Mitigations

## NAME

### Description

#### Characteristics
- 

### Key Mitigations

## NAME

### Description

#### Characteristics
- 

### Key Mitigations
