🧰 How to Improve MCP Tool Selection
=================================

This guide explains the current challenges with LLM/AI agent selection of available tools in MCP servers, and different approaches to overcome these challenges, to improve agent performance, and reduce token usage.

## Author Information
Created by the team at: [MCP Manager](https://mcpmanager.ai/).

MCP Manager is an MCP gateway which acts as a safety net for your organization's AI agents and their interactions with MCP servers and connected resources.

**⭐ Star this repo to stay up to date and avoid missing that guide you know you'll need in the future!**

## 📚 Contents
- [Issues With How LLMs/AI Agents Select MCP Tools](#-issues-with-how-llmsai-agents-select-mcp-tools)
- [How To Improve MCP Tool Selection](#-how-to-improve-mcp-tool-selection-1)
    - [Include Tool Selection Guidance In Your Prompts](#-include-tool-selection-guidance-in-your-prompts)
    - [Tool Filtering](#%EF%B8%8F-tool-filtering))
        -   [Tool Filtering Option 1: Use an MCP Gateway or Proxy](#-tool-filtering-option-1-use-an-mcp-gateway-or-proxy)
        -   [Tool Filtering Option 2: Offload Tool Discovery](#-tool-filtering-option-2-offload-tool-discovery-rag-mcp-framework))
        -   [Tool Filtering Option 3: Manual Client-Based Filtering](#-tool-filtering-option-3-manual-client-based-filtering))

😖🪛 Issues With How LLMs/AI Agents Select MCP Tools
-----------------------------------------------

-   **Bad Choices/No Choices:** Presenting too many tools to the LLM - particularly closely related tools - leads to poorer tool selection, and can cause a "doom-loop" of agent indecision, because the selection criteria becomes more complex and nuanced. Compare the amount of cognitive effort needed to decide between using a hammer or a drill to screw something, versus choosing between different models of similar drills.

-   **Context Bloat:** Tool metadata, which tells the agent about the tool's capabilities, is loaded into the agent's limited context window as tokens. Loading up more tools eats up more token space that's required for encoding task-specific context which can degrade the agent's speed and effectiveness.

😃🪛 How To Improve MCP Tool Selection
---------------------------------

Here are the different methods you can use to improve MCP tool selection, to reduce context bloat and poor/unsuccessful tool-selection choices, so that your AI agents can work more effectively and efficiently, and give you a better ROI.

**A: Include Tool Selection Guidance In Your Prompts:** A basic method that doesn't require any implementation changes, you simply tell the AI which tools to use.This is less reliable and effective than tool filtering, and requires the user to have foreknowledge of the exact tools the AI will need.

**B: Tool Filtering (Three Approaches):**

1. **Use an MCP Gateway/Poxy:** Use a proxy that sits between your MCP clients and servers to apply filters based on agent/user permissions, role, task type, and other criteria.The most scalable and reliable way to improve agent performance, and reduce context bloat/token usage, but requires more configuration.

2. **Retrieval-Augmented Generation:** Use a secondary "retriever" LLM to search a vector database that contains tool metadata and selects the best tool for your agent. Convincing reduction in context use and successful tool selection with a small tool pool, but fails to sustain these results when scaling to larger groups of servers and tools.

3. **Manual Client-Based Filtering:** Deselect tools via your MCP client if it allows you to do so. A reliable approach, but time-consuming, repetitive, and reliant upon the user to apply filters (and to apply them correctly), making it less scalable and less secure.

To explore each option in more detail, simply click on each of the titles above or scroll down.

### 🫡 Include Tool Selection Guidance In Your Prompts:

If you're well acquainted with your servers' toolsets and already know which tools you need the agent to use then you can specify this in your prompt. Here are some examples:

-  **Cite Specific Tools:** Instead of using a simple prompt like "Create a report for me based on this data" you can use "Use the read_csv tool to examine this data, then use the build_chart tool to create a set of reports for me". If the task requires a sequential approach you can make that clear: "Do this first then do this after that."
- **Help With Failure Responses:** Give the AI some tips on what to do in case of failure. For example: "If fetch_data does not respond within 5 seconds, abort the request, use log_warning to record the timeout, and switch to cached_data instead."
- **Add Conditional Hints:** Give the AI hints on which tool to select based on aspects like language, or file type, for example: "If the file extension is .xml, use parse_xml. If it's .yaml or .yml, use parse_yaml. If it's .txt, use read_text. If none of these match, fall back to read_file and request clarification from the user."

Consider tweaking your system prompts with information on how to best use your tool sets. This way you can instruct your LLM while allowing users to provide their own inputs to the AI models.

### ⚙️ Tool Filtering

Refining the selection of tools that agents/LLMs have access to makes it easier for them to make correct selections, faster selections, and reduces context/token usage. Reducing token usage also **lowers your usage fees** for LLMs too.

Filtering which tools all users, or specific users can access also prevents unwanted or harmful tool use.

Below are some of the different methods you can use depending on your MCP ecosystem setup.

#### 🧠 Tool Filtering Option 1: Use an MCP Gateway or Proxy

An MCP gateway sits between your MCP clients and servers. You can use it to determine which tools from multiple servers are made available to the LLM, by creating filters using criteria such as:

-   Agent roles/identity types
-   User roles/identity types
-   Combinations of user and agent role/identity
-   Task types

This enables you to easily, efficiently, and reliably serve up streamlined and specialized "toolboxes" for specific agents, agent types, or agent type+task types combinations.

**Additional Benefits**

MCP gateways also **manage session-level context** and can consolidate server responses before forwarding them to the client. This removes a significant context retention and management burden from the client/LLM, **reducing its token usage** and enabling it to be more **effective and efficient** in its tasks.

Using an MCP gateway has a wide range of other benefits, particularly around enforcing identity management and authorization, mitigating security risks and prompt and input sanitization. 

#### 👥 Tool Filtering Option 2: Offload Tool Discovery (RAG-MCP Framework)

Using RAG (Retrieval-Augmented Generation) to reduce prompt bloat and increase tool selection accuracy is an approach studied by Tiantian Gan and Qiyao Sun in[ their paper published in May 2025](https://arxiv.org/html/2505.03275v1).

Instead of including all tool descriptions in the prompt, RAG-MCP offloads tool discovery to a lightweight LLM-based retriever. The retriever encodes the user query, then conducts a semantic search on a vector database which contains embedded:

- Tool metadata
- Function schemas
- Usage examples
- Additional context and relevance signals

Once the retriever has selected relevant tools it can also test them using an example query to ensure the tool is right for the task.

The parameters and description of the tool/s that have passed this selection process are injected into the agent prompt or function call.

This enables the agent to keep its context clear of tool discovery and selection, and instead focus solely on its assigned task. Using RAG-MCP with a small-moderate pool of servers (~30 total servers) resulted in:

- 50% reduction in token use
- 29% increase in tool selection accuracy

**Drawbacks of RAG-MCP compared to MCP gateways:**

- Doesn't manage session-level context or refine/combine server responses to further improve efficiency and reduce the agent's context/token consumption
- Optimal performance when the database <30 MCP servers. Above this range (31-70 servers) selection failures increase, and above 100 servers failures outnumber successful selections.
- There hasn't been a comparable study of how using an MCP gateway impacts token usage and tool selection success rates. However, the time spent creating static filters via a gateway pays off in greater reliability, particularly at scale, when compared to dynamic RAG-based filtering.
- Lacks the wide range of security protections that a gateway offers
- Lacks additional gateway-based features including logging, observability, identity management, and real-time deactivation of tools and servers

#### 🔧 Tool Filtering Option 3: Manual Client-Based Filtering

Some MCP clients allow you to enable and disable tools for each chat session, while others allow you to enable/disable tools at an application level.

**In Claude Desktop:**

1. In a chat click the "Search and Tools" button on the lower left of the interface (it looks like a toggle-switch icon)
2. Click the toggle to "Disable all tools"
3. Manually toggle on the tools you want to include for this chat

**In Cursor:**

1. Click the Settings icon at the top right of the Cursor UI
2. Select the "Tools & Integrations" tab
3. From here you can disable and enable entire servers
4. Click on the arrows next to the tool name to show which tools are enabled, and click to enable/disable individual tools

**Drawbacks to manual filtering via MPC clients:**

- Time-consuming and repetitive
- Reliant on end users to use filtering - cannot be centrally controlled or mandated/enforced
- Prone to error

🛡️ Use an MCP Gateway To Improve Tool Selection & More
---------------------------------------------------

An MCP gateway is an essential component of enterprise MCP server deployments. MCP gateways:

- Improve tool selection
- Reduce token usage
- Protect your organization against MCP-based security risks
- Add identity management and access controls 
- Make it easier for non-technical teams to adopt MCPs and AI agents
- Generate enterprise-level logs for end-to-end traceability and observability

🛡️ **Try our MCP gateway - [MCP Manager](https://mcpmanager.ai/) - to make your organization's MCP server usage secure, scalable, and deliver ROI.**
