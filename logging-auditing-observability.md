# MCP Logging, Auditing, and Observability Checklist
## Author Information
Created by the team at: [MCP Manager](https://mcpmanager.ai/). 

Our team will be adding lots of valuable checklists and other resources for people creating and securing their MCP ecosystem. 

**⭐Star this repo to stay up to date and avoid missing that guide you know you'll need in the future!**

[MCP Manager](https://mcpmanager.ai/) is an MCP gateway which acts as a safety net for your organization's AI agents, and their interactions with MCP servers and connected resources.

## 📚 Table of Contents
- [Why You Need a Logging Solution For Your MCP Servers](#why-you-need-a-logging-solution-for-your-mcp-servers)
- [Why Enrich Your Logs With Contextual Metadata?](#why-enrich-your-logs-with-contextual-metadata)
- [MCP Logging Checklist](#mcp-logging-checklist)
- [Logging Implementation Best Practices](#logging-implementation-best-practices)
- [Higher-Level Logs/Server Inventory](#higher-level-logs-server-inventory)
- [Using an MCP Gateway For Robust, High-Fidelity Logging](#using-an-mcp-gateway-for-robust-high-fidelity-logging)

## Why You Need a Logging Solution For Your MCP Servers

Built-in, standard MCP server logs are fine for ad-hoc, on the spot debugging when you’re configuring servers and clients, but they aren’t suitable for large scale monitoring and audits, particularly when you need to see interactions across multiple servers, or are interested in tracking more advanced events like security breaches or policy violations. 

Achieving a level of logging that is suitable for audits and full end-to-end tracability (particularly at enterprise-level) requires a different level of retrievability, reliability, and structure.

Use this checklist to enhance the logging solution you are creating for your own MCP ecosystem, in order to make it suitable for business use or for a particularly big MCP stack.

You can also use the checklist to validate and select gateways/proxies that offer more advanced logging and auditing capabilities.

## Why Enrich Your Logs With Contextual Metadata?
Enriching your logs with contextual metadata improves your ability to:

- **Debug:** Understand precisely when, where, how, and in which circumstances bugs, failures, suspicious behavior, and attacks occurred. This makes it much faster and easier to pinpoint the cause of bugs and failures.
- **Trace:** Metadata like Correlation IDs enable you to track events across multiple MCP servers to understand what happened fully and sequentially.
- **Set Triggerable Alerts:** Captured metadata in logs can be used to trigger automated alerts and actions.
- **Precision Filter/Structure Large Logs:** Quickly isolate and group meaningful events from vast volumes of information, reducing noise and speeding up audit/issue response times.

⬆️ [Jump to Table of Contents](#-table-of-contents)

## MCP Logging Checklist
### Contextual Metadata to Include In Your Logs:
The list below gives you the core metadata (columns) that you should capture in your logs with advised formats. If using technical logs for auditing is new to you then you can also use this list as a quick reference to understand what each datapoint represents. 

The list below doesn’t represent the totality of all the data you should capture, but any logging function you configure should include these datapoints at a minimum.
- **Timestamp:** When the event occurred in ISO format.
- **Log Level:** What is the nature/severity of the item logged. Common log levels are: TRACE, DEBUG, INFO, WARN, ERROR, FATAL)
- **Response Code:** The response code returned by the server, such as 200, 401, 500 etc. This is useful when debugging, to exclude successful requests and filter down to specific errors.
- **Response Type:** The format or kind of response sent (e.g., JSON, XML, HTML, or a domain-specific response type).
- **Headers:** JSON representation of the HTTP response headers/header fields that were returned by the server  
- **Event Type:** Text descriptor of the event, for example “mcp-response-success”.
- **User/Team/Organization IDs:** GUIDs/UUIDs to identify the user that initiated the logged event. Team and organizational IDs are optional but helpful when logging MCP servers at scale.
- **Tool/Feature ID:** Unique identifier for the tool/feature invoked
- **Correlation ID:** Unique identifier that is used to trace requests and transactions across multiple tools and servers.
- **Request ID:** Useful to categorize request types to identify patterns when troubleshooting.
- **Session ID:** Unique identifier that enables you to link and group events that occurred in the same session. 
- **Methods/Commands:** What call/invocation was being made in this event (such as getting the list of tools or initializing the connection)
- **IP Address:** The IP of the user that initiated the event

### Logs Should Not Include
- Credentials
- Secrets
- API Keys
- Environment Variables
- PII (personal identifying information)

### Logging Implementation Best Practices:
- Use a standardized, structured log format like [OpenTelemetry](https://www.groundcover.com/opentelemetry/opentelemetry-logs)
- Control access to logs - behind some form of login/password protection
- Monitor for sensitive content  and exclude/sanitize/mask all sensitive data from logs where possible (especially in headers).
- Enable logs to be structured and exported as CSV files, for easier investigation and aggregation, and for importing into Security Information and Event Management (SIEM) systems. Alternatively, use a log drain platform like Splunk to aggregate your logs and make them searchable.
- Consider using [asynchronous logging mechanisms](https://getpino.io/#/docs/asynchronous?id=asynchronous-logging), batch processing, and log buffering to reduce overhead.
- Consider using libraries like [Pinot Logging](https://getpino.io/) to implement most of these best practices.
- Ensure any middleware (such as an MCP gateway) preserves header content, particularly, but don’t forget to sanitize sensitive headers like “authorization”.

⬆️ [Jump to Table of Contents](#-table-of-contents)

### Higher-Level Logs/Server Inventory
In addition to logging interactions between MCP servers and clients you should also maintain an inventory-style record of the servers that are currently added to your network/organization, including:

#### Basic
- Date the server was added
- Date the server was removed
- Who added the server (email address)
- If the server was subject to a review and approval process (if applicable)
- Approval status (if applicable)
- Approval notes (if applicable)
- Reason rejected (if applicable)

#### Advanced
- Errors logged against the server (counts, timestamps, and details)
- Quarantined/sanitized prompts (counts, timestamps, and details)
- Tool/feature count for this server
- Tools served by this server (with version details)
- Last used
- Last used by (username, user ID, and team ID if used)

Many of the advanced data fields are only possible with the use of an automated logging system, such an MCP gateway, other middleware, or AI-powered logging system.

#### Approaches To Implementing Higher-Level Logs

An MCP Gateway like MCP Manager also enables you to achieve a secure level of governance over:

- Which servers are added/enabled in your organization
- Which features (or tools) each server exposes
- Which agents and users (or role types) can access which tools
- Permission levels for different agents/users/role types
- Which versions of MCP servers are allowed/blocked (to guard against rug-pull tool poisoning and similar attack vectors that use tool metadata updates to add malicious or dangerous prompts)

If you want a more DIY approach you can also create your own system using something as simple as a spreadsheet which can be populated by an agent when new MCP servers are added. Taking this route won’t give you the governance capabilities of an MCP gateway but it will at least give you a record of what MCP servers are being used, and who you should contact if they are found to be vulnerable and need to be removed.

⬆️ [Jump to Table of Contents](#-table-of-contents)

## Using an MCP Gateway For Robust, High-Fidelity Logging

An MCP gateway’s principal benefits lie in providing the necessary safeguards that allow organizations to  utilize AI agents and MCP servers, safely and securely.

MCP gateways enable comprehensive, secure, and manageable logging of interactions with MCP servers by centralizing traffic, adding observability features, and integrating with broader API management tools and infrastructure. 

An MCP gateway gives you end-to-end traceability, custom event tracking and logging, comprehensive logs that are suitable for enterprise-level security teams, and so much more.
Learn more about our MCP gateway - [MCP Manager](https://mcpmanager.ai/)
