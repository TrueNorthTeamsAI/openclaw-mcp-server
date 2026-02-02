# OpenClaw MCP Server

MCP (Model Context Protocol) server that exposes OpenClaw Gateway tools to Claude Code and other MCP-compatible clients.

## Features

Gives Claude Code (and any MCP client) access to:

- **Messaging** — Send messages via Telegram, WhatsApp, Discord, Slack, Signal, iMessage, Google Chat
- **Sessions** — List, inspect, and communicate with other OpenClaw sessions
- **Scheduling** — Create and manage cron jobs for automated tasks
- **Nodes** — Control paired devices (notifications, camera, location, remote commands)
- **Web** — Search and fetch web content
- **Memory** — Search OpenClaw's memory files
- **TTS** — Text-to-speech conversion
- **Gateway** — Status and configuration access

## Prerequisites

- Node.js 18+
- OpenClaw Gateway running locally (default: `http://127.0.0.1:18789`)
- Gateway auth token (if configured)

## Installation

```bash
# Clone and install
cd /path/to/openclaw-mcp-server
npm install
npm run build

# Or install globally
npm install -g .
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCLAW_GATEWAY_URL` | Gateway HTTP URL | `http://127.0.0.1:18789` |
| `OPENCLAW_GATEWAY_TOKEN` | Auth token (if required) | _(none)_ |

### Client Setup

The OpenClaw MCP server works with any MCP-compatible client. Below are configuration instructions for popular clients.

#### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "node",
      "args": ["/absolute/path/to/openclaw-mcp-server/dist/index.js"],
      "env": {
        "OPENCLAW_GATEWAY_TOKEN": "your-token-here"
      }
    }
  }
}
```

**Note**: Restart Claude Desktop after editing the configuration file.

#### Claude Code (CLI)

Add using the Claude Code CLI:

```bash
# Using the CLI
claude mcp add openclaw -- node /path/to/openclaw-mcp-server/dist/index.js

# Or with environment variables
claude mcp add openclaw -e OPENCLAW_GATEWAY_TOKEN=your-token -- node /path/to/openclaw-mcp-server/dist/index.js
```

Or manually edit `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "node",
      "args": ["/absolute/path/to/openclaw-mcp-server/dist/index.js"],
      "env": {
        "OPENCLAW_GATEWAY_TOKEN": "your-token-here"
      }
    }
  }
}
```

#### Zed Editor

Add to your Zed settings file (open with `Zed: Open Settings` or edit `~/.config/zed/settings.json`):

```json
{
  "context_servers": {
    "openclaw": {
      "command": {
        "path": "node",
        "args": ["/absolute/path/to/openclaw-mcp-server/dist/index.js"]
      },
      "settings": {
        "env": {
          "OPENCLAW_GATEWAY_TOKEN": "your-token-here"
        }
      }
    }
  }
}
```

**Note**: You may need to reload Zed after adding the configuration.

#### Cline (VSCode Extension)

1. Open VSCode settings (Cmd/Ctrl + ,)
2. Search for "Cline: MCP Servers"
3. Click "Edit in settings.json"
4. Add the OpenClaw server configuration:

```json
{
  "cline.mcpServers": {
    "openclaw": {
      "command": "node",
      "args": ["/absolute/path/to/openclaw-mcp-server/dist/index.js"],
      "env": {
        "OPENCLAW_GATEWAY_TOKEN": "your-token-here"
      }
    }
  }
}
```

Alternatively, use the Cline MCP settings UI:
1. Open Cline panel
2. Click the settings/gear icon
3. Navigate to MCP Servers section
4. Add server with command: `node /absolute/path/to/openclaw-mcp-server/dist/index.js`

**Note**: Reload VSCode window after configuration changes.

#### Windsurf Editor

Add to Windsurf's configuration file (`~/.windsurf/settings.json` or via Settings UI):

```json
{
  "mcp.servers": {
    "openclaw": {
      "command": "node",
      "args": ["/absolute/path/to/openclaw-mcp-server/dist/index.js"],
      "env": {
        "OPENCLAW_GATEWAY_TOKEN": "your-token-here"
      }
    }
  }
}
```

Or use the Windsurf Settings UI:
1. Open Settings (Cmd/Ctrl + ,)
2. Navigate to "MCP Servers"
3. Click "Add Server"
4. Enter server details:
   - Name: `openclaw`
   - Command: `node`
   - Args: `/absolute/path/to/openclaw-mcp-server/dist/index.js`
   - Environment variables: `OPENCLAW_GATEWAY_TOKEN=your-token-here`

**Note**: Restart Windsurf after adding the configuration.

#### Other MCP Clients

For any other MCP-compatible client, use the standard MCP server configuration format:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/openclaw-mcp-server/dist/index.js"],
  "env": {
    "OPENCLAW_GATEWAY_TOKEN": "your-token-here"
  }
}
```

### Important Notes

- **Absolute Paths**: Always use absolute paths (e.g., `/Users/username/...` or `C:\Users\...`) in configuration files, not relative paths or `~`
- **Token Security**: If your OpenClaw Gateway requires authentication, set the `OPENCLAW_GATEWAY_TOKEN` environment variable
- **Gateway URL**: If your Gateway is not running on default `http://127.0.0.1:18789`, set `OPENCLAW_GATEWAY_URL` in the environment variables
- **Server Restart**: Most clients require a restart or reload after changing MCP server configuration

## Available Tools

### Messaging

#### `openclaw_message_send`

Send a message via OpenClaw to various messaging platforms (Telegram, WhatsApp, Discord, Slack, Signal, iMessage, Google Chat).

**Natural Language Examples:**
- "Send a Telegram message to @john saying 'Meeting at 3pm'"
- "Message my team on Slack: 'Deploy is complete'"
- "Send a silent notification to the dev channel on Discord"

**Parameters:**
- `message` (string, required) - Message text to send
- `channel` (string, optional) - Channel type: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `googlechat`
- `target` (string, optional) - Target chat/user ID or name
- `replyTo` (string, optional) - Message ID to reply to
- `silent` (boolean, optional) - Send silently without notification

**Example Input:**
```json
{
  "channel": "telegram",
  "target": "@username",
  "message": "Hello from OpenClaw!",
  "silent": false
}
```

**Example Output:**
```json
{
  "success": true,
  "messageId": "msg_123456",
  "timestamp": "2026-02-02T10:30:00Z"
}
```

#### `openclaw_message_broadcast`

Broadcast a message to multiple targets across messaging platforms.

**Natural Language Examples:**
- "Broadcast 'Server maintenance tonight at 10pm' to all my Telegram groups"
- "Send a message to Alice, Bob, and Charlie on WhatsApp about the project update"
- "Notify everyone in my contact list about the event"

**Parameters:**
- `message` (string, required) - Message text to broadcast
- `targets` (array of strings, required) - List of target IDs
- `channel` (string, optional) - Channel type

**Example Input:**
```json
{
  "channel": "telegram",
  "targets": ["@user1", "@user2", "@user3"],
  "message": "Important announcement for everyone!"
}
```

**Example Output:**
```json
{
  "success": true,
  "sent": 3,
  "failed": 0,
  "results": [
    { "target": "@user1", "status": "delivered" },
    { "target": "@user2", "status": "delivered" },
    { "target": "@user3", "status": "delivered" }
  ]
}
```

---

### Sessions

#### `openclaw_sessions_list`

List active OpenClaw sessions with optional filtering.

**Natural Language Examples:**
- "Show me all active sessions from the last hour"
- "List my Telegram sessions with their recent messages"
- "What sessions have been active in the past 30 minutes?"

**Parameters:**
- `kinds` (array of strings, optional) - Filter by session kinds/types
- `activeMinutes` (number, optional) - Filter by activity within N minutes
- `limit` (number, optional) - Maximum number of sessions to return
- `messageLimit` (number, optional) - Include last N messages per session

**Example Input:**
```json
{
  "activeMinutes": 60,
  "limit": 10,
  "messageLimit": 5
}
```

**Example Output:**
```json
{
  "sessions": [
    {
      "sessionKey": "sess_abc123",
      "kind": "telegram",
      "label": "Main Chat",
      "active": true,
      "lastActivity": "2026-02-02T10:25:00Z",
      "messageCount": 127,
      "recentMessages": [
        { "role": "user", "content": "What's the weather?" },
        { "role": "assistant", "content": "Let me check..." }
      ]
    }
  ],
  "total": 1
}
```

#### `openclaw_sessions_history`

Fetch complete message history for a specific session.

**Natural Language Examples:**
- "Show me the conversation history for session sess_abc123"
- "Get the last 100 messages from my main session"
- "Fetch the history with all tool calls for the Telegram session"

**Parameters:**
- `sessionKey` (string, required) - Session key to fetch history for
- `limit` (number, optional) - Maximum number of messages to return
- `includeTools` (boolean, optional) - Include tool calls in history

**Example Input:**
```json
{
  "sessionKey": "sess_abc123",
  "limit": 50,
  "includeTools": true
}
```

**Example Output:**
```json
{
  "sessionKey": "sess_abc123",
  "messages": [
    {
      "timestamp": "2026-02-02T10:00:00Z",
      "role": "user",
      "content": "Search for OpenClaw documentation"
    },
    {
      "timestamp": "2026-02-02T10:00:05Z",
      "role": "assistant",
      "content": "I'll search for that...",
      "toolCalls": [
        { "tool": "web_search", "args": { "query": "OpenClaw documentation" } }
      ]
    }
  ],
  "total": 127
}
```

#### `openclaw_sessions_send`

Send a message to another active OpenClaw session.

**Natural Language Examples:**
- "Ask Assistant-2 if they're done with the data analysis"
- "Send a message to the monitoring session asking for current status"
- "Tell the background session to pause its work"

**Parameters:**
- `message` (string, required) - Message to send
- `sessionKey` (string, optional) - Target session key
- `label` (string, optional) - Target session label (alternative to sessionKey)
- `timeoutSeconds` (number, optional) - Timeout for response

**Example Input:**
```json
{
  "label": "Assistant-2",
  "message": "Can you help with the data analysis task?",
  "timeoutSeconds": 30
}
```

**Example Output:**
```json
{
  "success": true,
  "response": "Sure, I'll start working on the data analysis right away.",
  "responseTime": 2.4
}
```

#### `openclaw_sessions_spawn`

Spawn a background sub-agent in an isolated session for autonomous task execution.

**Natural Language Examples:**
- "Spawn a background agent to monitor server logs for errors"
- "Create a sub-agent to research competitors and summarize findings in 30 minutes"
- "Start an isolated session to handle customer support messages while I work on other tasks"

**Parameters:**
- `task` (string, required) - Task description for the sub-agent
- `agentId` (string, optional) - Specific agent ID to use
- `model` (string, optional) - Model to use (e.g., "claude-sonnet-4")
- `label` (string, optional) - Human-readable session label
- `runTimeoutSeconds` (number, optional) - Maximum execution time

**Example Input:**
```json
{
  "task": "Monitor the server logs and alert me if any errors occur in the next hour",
  "label": "Log Monitor",
  "model": "claude-sonnet-4",
  "runTimeoutSeconds": 3600
}
```

**Example Output:**
```json
{
  "success": true,
  "sessionKey": "sess_xyz789",
  "label": "Log Monitor",
  "status": "running",
  "startTime": "2026-02-02T10:30:00Z"
}
```

---

### Scheduling

#### `openclaw_cron_list`

List all scheduled cron jobs.

**Natural Language Examples:**
- "Show me all my scheduled tasks"
- "List all cron jobs including disabled ones"
- "What automated tasks do I have set up?"

**Parameters:**
- `includeDisabled` (boolean, optional) - Include disabled jobs in the list

**Example Input:**
```json
{
  "includeDisabled": true
}
```

**Example Output:**
```json
{
  "jobs": [
    {
      "id": "job_001",
      "name": "Daily Backup",
      "schedule": { "hour": 2, "minute": 0 },
      "enabled": true,
      "nextRun": "2026-02-03T02:00:00Z",
      "lastRun": "2026-02-02T02:00:00Z"
    },
    {
      "id": "job_002",
      "name": "Weekly Report",
      "schedule": { "dayOfWeek": 1, "hour": 9, "minute": 0 },
      "enabled": false
    }
  ],
  "total": 2
}
```

#### `openclaw_cron_add`

Create a new scheduled cron job.

**Natural Language Examples:**
- "Schedule a daily backup at 2am"
- "Create a cron job to send me weather updates every morning at 7am"
- "Set up a weekly report to be generated every Monday at 9am"

**Parameters:**
- `job` (object, required) - Job definition containing:
  - `name` (string) - Job name
  - `schedule` (object) - Schedule specification (minute, hour, dayOfWeek, etc.)
  - `payload` (object) - Task payload/configuration
  - `sessionTarget` (string) - Target session: `main` or `isolated`
  - `enabled` (boolean) - Whether job is enabled

**Example Input:**
```json
{
  "job": {
    "name": "Morning Weather Alert",
    "schedule": {
      "hour": 7,
      "minute": 0
    },
    "payload": {
      "action": "send_message",
      "channel": "telegram",
      "message": "Good morning! Here's today's weather forecast."
    },
    "sessionTarget": "main",
    "enabled": true
  }
}
```

**Example Output:**
```json
{
  "success": true,
  "jobId": "job_003",
  "nextRun": "2026-02-03T07:00:00Z"
}
```

#### `openclaw_cron_remove`

Delete a scheduled cron job.

**Natural Language Examples:**
- "Delete the morning weather alert job"
- "Remove cron job job_003"
- "Cancel the daily backup task"

**Parameters:**
- `jobId` (string, required) - Job ID to remove

**Example Input:**
```json
{
  "jobId": "job_003"
}
```

**Example Output:**
```json
{
  "success": true,
  "message": "Job job_003 removed successfully"
}
```

#### `openclaw_cron_run`

Trigger a cron job to run immediately, outside its scheduled time.

**Natural Language Examples:**
- "Run the backup job now"
- "Trigger the weekly report immediately"
- "Execute job_001 right now"

**Parameters:**
- `jobId` (string, required) - Job ID to execute

**Example Input:**
```json
{
  "jobId": "job_001"
}
```

**Example Output:**
```json
{
  "success": true,
  "executionId": "exec_12345",
  "startTime": "2026-02-02T10:30:00Z",
  "status": "completed",
  "result": "Backup completed successfully"
}
```

---

### Nodes (Paired Devices)

#### `openclaw_nodes_status`

Get status information for all paired nodes (mobile devices, remote machines).

**Natural Language Examples:**
- "Show me the status of all my connected devices"
- "Which nodes are currently online?"
- "What's my iPhone's battery level?"

**Parameters:**
None

**Example Input:**
```json
{}
```

**Example Output:**
```json
{
  "nodes": [
    {
      "id": "node_iphone",
      "name": "iPhone 15 Pro",
      "type": "mobile",
      "platform": "ios",
      "online": true,
      "lastSeen": "2026-02-02T10:29:00Z",
      "battery": 87,
      "capabilities": ["camera", "location", "notifications"]
    },
    {
      "id": "node_laptop",
      "name": "MacBook Pro",
      "type": "computer",
      "platform": "macos",
      "online": true,
      "lastSeen": "2026-02-02T10:30:00Z"
    }
  ],
  "total": 2
}
```

#### `openclaw_nodes_notify`

Send a push notification to a paired node.

**Natural Language Examples:**
- "Send a notification to my iPhone: 'Task completed successfully'"
- "Alert my phone with high priority that the deployment is done"
- "Notify all my devices that dinner is ready"

**Parameters:**
- `title` (string, required) - Notification title
- `body` (string, required) - Notification body/message
- `node` (string, optional) - Node ID or name (defaults to all nodes)
- `priority` (string, optional) - Priority level: `passive`, `active`, `timeSensitive`

**Example Input:**
```json
{
  "node": "node_iphone",
  "title": "Task Complete",
  "body": "Your data analysis has finished processing.",
  "priority": "timeSensitive"
}
```

**Example Output:**
```json
{
  "success": true,
  "delivered": true,
  "node": "node_iphone",
  "timestamp": "2026-02-02T10:30:00Z"
}
```

#### `openclaw_nodes_camera_snap`

Capture a photo from a node's camera.

**Natural Language Examples:**
- "Take a picture with my iPhone's back camera"
- "Snap a photo from both cameras on my phone"
- "Capture a high-quality image from the front camera"

**Parameters:**
- `node` (string, optional) - Node ID or name
- `facing` (string, optional) - Camera to use: `front`, `back`, `both`
- `quality` (number, optional) - Image quality 0-100

**Example Input:**
```json
{
  "node": "node_iphone",
  "facing": "back",
  "quality": 85
}
```

**Example Output:**
```json
{
  "success": true,
  "images": [
    {
      "camera": "back",
      "url": "https://openclaw.gateway/images/img_abc123.jpg",
      "size": 2456789,
      "timestamp": "2026-02-02T10:30:00Z"
    }
  ]
}
```

#### `openclaw_nodes_location`

Get current location from a paired node.

**Natural Language Examples:**
- "Where is my iPhone right now?"
- "Get the precise location of my phone"
- "Show me the current location of node_iphone"

**Parameters:**
- `node` (string, optional) - Node ID or name
- `desiredAccuracy` (string, optional) - Accuracy level: `coarse`, `balanced`, `precise`

**Example Input:**
```json
{
  "node": "node_iphone",
  "desiredAccuracy": "precise"
}
```

**Example Output:**
```json
{
  "success": true,
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy": 10,
    "altitude": 52,
    "timestamp": "2026-02-02T10:30:00Z",
    "address": "San Francisco, CA"
  }
}
```

#### `openclaw_nodes_run`

Execute a command on a paired node.

**Natural Language Examples:**
- "Run 'ls -la' on my laptop"
- "Execute a git pull on the remote server"
- "Check disk space on node_laptop by running 'df -h'"

**Parameters:**
- `command` (array of strings, required) - Command and arguments to execute
- `node` (string, optional) - Node ID or name
- `cwd` (string, optional) - Working directory for command execution
- `timeoutMs` (number, optional) - Command timeout in milliseconds

**Example Input:**
```json
{
  "node": "node_laptop",
  "command": ["ls", "-la", "/home/user/projects"],
  "timeoutMs": 5000
}
```

**Example Output:**
```json
{
  "success": true,
  "stdout": "total 48\ndrwxr-xr-x  6 user staff  192 Feb  2 10:00 .\ndrwxr-xr-x 12 user staff  384 Feb  1 09:00 ..\n...",
  "stderr": "",
  "exitCode": 0,
  "executionTime": 124
}
```

---

### Web

#### `openclaw_web_search`

Search the web using the Brave Search API.

**Natural Language Examples:**
- "Search the web for 'best TypeScript practices 2026'"
- "Find recent articles about AI assistants from the past week"
- "Look up OpenClaw documentation online"

**Parameters:**
- `query` (string, required) - Search query
- `count` (number, optional) - Number of results to return (1-10)
- `country` (string, optional) - 2-letter country code for localized results
- `freshness` (string, optional) - Time filter: `pd` (past day), `pw` (past week), `pm` (past month), `py` (past year)

**Example Input:**
```json
{
  "query": "OpenClaw AI assistant",
  "count": 5,
  "freshness": "pm"
}
```

**Example Output:**
```json
{
  "results": [
    {
      "title": "OpenClaw - Personal AI Assistant Platform",
      "url": "https://example.com/openclaw",
      "description": "OpenClaw is an advanced AI assistant platform...",
      "age": "2 days ago"
    },
    {
      "title": "Getting Started with OpenClaw",
      "url": "https://docs.example.com/openclaw/intro",
      "description": "Learn how to set up and use OpenClaw...",
      "age": "1 week ago"
    }
  ],
  "totalResults": 5
}
```

#### `openclaw_web_fetch`

Fetch and extract readable content from a URL.

**Natural Language Examples:**
- "Fetch the content from https://example.com/article and extract it as markdown"
- "Get the text from this blog post: https://blog.example.com/post"
- "Download and summarize the article at this URL"

**Parameters:**
- `url` (string, required) - URL to fetch
- `extractMode` (string, optional) - Extraction format: `markdown` or `text`
- `maxChars` (number, optional) - Maximum characters to return

**Example Input:**
```json
{
  "url": "https://example.com/article",
  "extractMode": "markdown",
  "maxChars": 5000
}
```

**Example Output:**
```json
{
  "success": true,
  "url": "https://example.com/article",
  "title": "Understanding AI Assistants",
  "content": "# Understanding AI Assistants\n\nAI assistants have revolutionized...",
  "length": 3456,
  "extracted": "2026-02-02T10:30:00Z"
}
```

---

### Gateway & Utilities

#### `openclaw_gateway_status`

Get current status of the OpenClaw Gateway session.

**Natural Language Examples:**
- "What's the status of my current session?"
- "Show me the Gateway status"
- "How long has this session been active?"

**Parameters:**
- `sessionKey` (string, optional) - Specific session key to query

**Example Input:**
```json
{
  "sessionKey": "sess_abc123"
}
```

**Example Output:**
```json
{
  "sessionKey": "sess_abc123",
  "status": "active",
  "uptime": 3600,
  "messageCount": 127,
  "toolCallCount": 45,
  "lastActivity": "2026-02-02T10:30:00Z",
  "connectedNodes": 2
}
```

#### `openclaw_gateway_config_get`

Retrieve current Gateway configuration settings.

**Natural Language Examples:**
- "Show me the Gateway configuration"
- "What features are enabled in my Gateway?"
- "Get the current Gateway settings"

**Parameters:**
None

**Example Input:**
```json
{}
```

**Example Output:**
```json
{
  "version": "1.2.0",
  "config": {
    "maxSessions": 50,
    "enabledChannels": ["telegram", "slack", "discord"],
    "features": {
      "webSearch": true,
      "tts": true,
      "nodes": true
    }
  }
}
```

#### `openclaw_tts`

Convert text to speech audio.

**Natural Language Examples:**
- "Convert 'Hello world' to speech"
- "Generate an audio file saying 'The task is complete'"
- "Create a voice message for Telegram saying 'Running late, be there soon'"

**Parameters:**
- `text` (string, required) - Text to convert to speech
- `channel` (string, optional) - Target channel for format optimization

**Example Input:**
```json
{
  "text": "Hello, this is a text to speech test.",
  "channel": "telegram"
}
```

**Example Output:**
```json
{
  "success": true,
  "audioUrl": "https://openclaw.gateway/audio/tts_xyz789.mp3",
  "duration": 3.2,
  "format": "mp3",
  "size": 51200
}
```

#### `openclaw_memory_search`

Search OpenClaw's memory files using semantic search.

**Natural Language Examples:**
- "Search my memory for conversations about the weather"
- "Find any mentions of project deadlines from last week"
- "Look up what we discussed about the deployment process"

**Parameters:**
- `query` (string, required) - Search query
- `maxResults` (number, optional) - Maximum number of results to return
- `minScore` (number, optional) - Minimum relevance score (0-1)

**Example Input:**
```json
{
  "query": "weather forecast discussions from last week",
  "maxResults": 5,
  "minScore": 0.7
}
```

**Example Output:**
```json
{
  "results": [
    {
      "content": "We discussed the weather forecast for San Francisco...",
      "timestamp": "2026-01-28T14:30:00Z",
      "score": 0.89,
      "source": "session_log_2026-01-28"
    },
    {
      "content": "The forecast indicated rain for the weekend...",
      "timestamp": "2026-01-27T10:15:00Z",
      "score": 0.82,
      "source": "session_log_2026-01-27"
    }
  ],
  "total": 5
}
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run built version
npm start
```

## Testing

Test the server with MCP inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Or test directly:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

## License

MIT

## Author

Helms AI
