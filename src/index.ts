#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

// OpenClaw Gateway configuration
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";

// Tool definitions for OpenClaw Gateway
const OPENCLAW_TOOLS: Tool[] = [
  // Messaging
  {
    name: "openclaw_message_send",
    description: "Send a message via OpenClaw channels (Telegram, WhatsApp, Discord, Slack, Signal, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        channel: { type: "string", description: "Channel type (telegram, whatsapp, discord, slack, signal, imessage, googlechat)" },
        target: { type: "string", description: "Target chat/user ID or name" },
        message: { type: "string", description: "Message text to send" },
        replyTo: { type: "string", description: "Message ID to reply to (optional)" },
        silent: { type: "boolean", description: "Send silently without notification (optional)" },
      },
      required: ["message"],
    },
  },
  {
    name: "openclaw_message_broadcast",
    description: "Broadcast a message to multiple targets",
    inputSchema: {
      type: "object",
      properties: {
        channel: { type: "string", description: "Channel type" },
        targets: { type: "array", items: { type: "string" }, description: "List of target IDs" },
        message: { type: "string", description: "Message text" },
      },
      required: ["targets", "message"],
    },
  },

  // Sessions
  {
    name: "openclaw_sessions_list",
    description: "List active OpenClaw sessions with optional filters",
    inputSchema: {
      type: "object",
      properties: {
        kinds: { type: "array", items: { type: "string" }, description: "Filter by session kinds" },
        activeMinutes: { type: "number", description: "Filter by activity within N minutes" },
        limit: { type: "number", description: "Max sessions to return" },
        messageLimit: { type: "number", description: "Include last N messages per session" },
      },
    },
  },
  {
    name: "openclaw_sessions_history",
    description: "Fetch message history for a session",
    inputSchema: {
      type: "object",
      properties: {
        sessionKey: { type: "string", description: "Session key to fetch history for" },
        limit: { type: "number", description: "Max messages to return" },
        includeTools: { type: "boolean", description: "Include tool calls in history" },
      },
      required: ["sessionKey"],
    },
  },
  {
    name: "openclaw_sessions_send",
    description: "Send a message to another OpenClaw session",
    inputSchema: {
      type: "object",
      properties: {
        sessionKey: { type: "string", description: "Target session key" },
        label: { type: "string", description: "Target session label (alternative to sessionKey)" },
        message: { type: "string", description: "Message to send" },
        timeoutSeconds: { type: "number", description: "Timeout for response" },
      },
      required: ["message"],
    },
  },
  {
    name: "openclaw_sessions_spawn",
    description: "Spawn a background sub-agent in an isolated session",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string", description: "Task description for the sub-agent" },
        agentId: { type: "string", description: "Agent ID to use (optional)" },
        model: { type: "string", description: "Model to use (optional)" },
        label: { type: "string", description: "Session label (optional)" },
        runTimeoutSeconds: { type: "number", description: "Max run time" },
      },
      required: ["task"],
    },
  },

  // Cron / Scheduling
  {
    name: "openclaw_cron_list",
    description: "List scheduled cron jobs",
    inputSchema: {
      type: "object",
      properties: {
        includeDisabled: { type: "boolean", description: "Include disabled jobs" },
      },
    },
  },
  {
    name: "openclaw_cron_add",
    description: "Add a new cron job",
    inputSchema: {
      type: "object",
      properties: {
        job: {
          type: "object",
          description: "Job definition with name, schedule, payload, sessionTarget",
          properties: {
            name: { type: "string" },
            schedule: { type: "object" },
            payload: { type: "object" },
            sessionTarget: { type: "string", enum: ["main", "isolated"] },
            enabled: { type: "boolean" },
          },
        },
      },
      required: ["job"],
    },
  },
  {
    name: "openclaw_cron_remove",
    description: "Remove a cron job",
    inputSchema: {
      type: "object",
      properties: {
        jobId: { type: "string", description: "Job ID to remove" },
      },
      required: ["jobId"],
    },
  },
  {
    name: "openclaw_cron_run",
    description: "Trigger a cron job immediately",
    inputSchema: {
      type: "object",
      properties: {
        jobId: { type: "string", description: "Job ID to run" },
      },
      required: ["jobId"],
    },
  },

  // Nodes
  {
    name: "openclaw_nodes_status",
    description: "Get status of paired nodes (mobile devices, remote machines)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "openclaw_nodes_notify",
    description: "Send a notification to a paired node",
    inputSchema: {
      type: "object",
      properties: {
        node: { type: "string", description: "Node ID or name" },
        title: { type: "string", description: "Notification title" },
        body: { type: "string", description: "Notification body" },
        priority: { type: "string", enum: ["passive", "active", "timeSensitive"] },
      },
      required: ["title", "body"],
    },
  },
  {
    name: "openclaw_nodes_camera_snap",
    description: "Capture a photo from a node's camera",
    inputSchema: {
      type: "object",
      properties: {
        node: { type: "string", description: "Node ID or name" },
        facing: { type: "string", enum: ["front", "back", "both"], description: "Camera facing" },
        quality: { type: "number", description: "Image quality 0-100" },
      },
    },
  },
  {
    name: "openclaw_nodes_location",
    description: "Get location from a paired node",
    inputSchema: {
      type: "object",
      properties: {
        node: { type: "string", description: "Node ID or name" },
        desiredAccuracy: { type: "string", enum: ["coarse", "balanced", "precise"] },
      },
    },
  },
  {
    name: "openclaw_nodes_run",
    description: "Run a command on a paired node",
    inputSchema: {
      type: "object",
      properties: {
        node: { type: "string", description: "Node ID or name" },
        command: { type: "array", items: { type: "string" }, description: "Command and arguments" },
        cwd: { type: "string", description: "Working directory" },
        timeoutMs: { type: "number", description: "Command timeout" },
      },
      required: ["command"],
    },
  },

  // Web
  {
    name: "openclaw_web_search",
    description: "Search the web using Brave Search API",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        count: { type: "number", description: "Number of results (1-10)" },
        country: { type: "string", description: "2-letter country code" },
        freshness: { type: "string", description: "Filter by time (pd, pw, pm, py)" },
      },
      required: ["query"],
    },
  },
  {
    name: "openclaw_web_fetch",
    description: "Fetch and extract readable content from a URL",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to fetch" },
        extractMode: { type: "string", enum: ["markdown", "text"], description: "Extraction mode" },
        maxChars: { type: "number", description: "Max characters to return" },
      },
      required: ["url"],
    },
  },

  // Gateway
  {
    name: "openclaw_gateway_status",
    description: "Get OpenClaw Gateway session status",
    inputSchema: {
      type: "object",
      properties: {
        sessionKey: { type: "string", description: "Session key (optional)" },
      },
    },
  },
  {
    name: "openclaw_gateway_config_get",
    description: "Get current Gateway configuration",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },

  // TTS
  {
    name: "openclaw_tts",
    description: "Convert text to speech",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to convert to speech" },
        channel: { type: "string", description: "Channel for output format hint" },
      },
      required: ["text"],
    },
  },

  // Memory
  {
    name: "openclaw_memory_search",
    description: "Search OpenClaw memory files semantically",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        maxResults: { type: "number", description: "Max results to return" },
        minScore: { type: "number", description: "Minimum relevance score" },
      },
      required: ["query"],
    },
  },
];

// Map MCP tool names to OpenClaw tool names and build args
function mapToolCall(mcpToolName: string, mcpArgs: Record<string, unknown>): { tool: string; args: Record<string, unknown> } {
  const toolMapping: Record<string, { tool: string; action?: string }> = {
    openclaw_message_send: { tool: "message", action: "send" },
    openclaw_message_broadcast: { tool: "message", action: "broadcast" },
    openclaw_sessions_list: { tool: "sessions_list" },
    openclaw_sessions_history: { tool: "sessions_history" },
    openclaw_sessions_send: { tool: "sessions_send" },
    openclaw_sessions_spawn: { tool: "sessions_spawn" },
    openclaw_cron_list: { tool: "cron", action: "list" },
    openclaw_cron_add: { tool: "cron", action: "add" },
    openclaw_cron_remove: { tool: "cron", action: "remove" },
    openclaw_cron_run: { tool: "cron", action: "run" },
    openclaw_nodes_status: { tool: "nodes", action: "status" },
    openclaw_nodes_notify: { tool: "nodes", action: "notify" },
    openclaw_nodes_camera_snap: { tool: "nodes", action: "camera_snap" },
    openclaw_nodes_location: { tool: "nodes", action: "location_get" },
    openclaw_nodes_run: { tool: "nodes", action: "run" },
    openclaw_web_search: { tool: "web_search" },
    openclaw_web_fetch: { tool: "web_fetch" },
    openclaw_gateway_status: { tool: "session_status" },
    openclaw_gateway_config_get: { tool: "gateway", action: "config.get" },
    openclaw_tts: { tool: "tts" },
    openclaw_memory_search: { tool: "memory_search" },
  };

  const mapping = toolMapping[mcpToolName];
  if (!mapping) {
    throw new Error(`Unknown tool: ${mcpToolName}`);
  }

  const args: Record<string, unknown> = { ...mcpArgs };
  if (mapping.action) {
    args.action = mapping.action;
  }

  return { tool: mapping.tool, args };
}

// Invoke a tool via the Gateway HTTP API
async function invokeGatewayTool(tool: string, args: Record<string, unknown>): Promise<unknown> {
  const url = `${GATEWAY_URL}/tools/invoke`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (GATEWAY_TOKEN) {
    headers["Authorization"] = `Bearer ${GATEWAY_TOKEN}`;
  }

  const body = {
    tool,
    args,
    sessionKey: "main",
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gateway error (${response.status}): ${text}`);
  }

  const result = await response.json();
  
  if (!result.ok) {
    throw new Error(`Tool error: ${result.error?.message || JSON.stringify(result.error)}`);
  }

  return result.result;
}

// Create and run the MCP server
async function main() {
  const server = new Server(
    {
      name: "openclaw-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: OPENCLAW_TOOLS };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const { tool, args: gatewayArgs } = mapToolCall(name, args as Record<string, unknown> || {});
      const result = await invokeGatewayTool(tool, gatewayArgs);

      return {
        content: [
          {
            type: "text",
            text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${message}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("OpenClaw MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
