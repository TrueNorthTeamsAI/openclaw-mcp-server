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

| Tool | Description |
|------|-------------|
| `openclaw_message_send` | Send a message to a chat/user |
| `openclaw_message_broadcast` | Broadcast to multiple targets |

### Sessions

| Tool | Description |
|------|-------------|
| `openclaw_sessions_list` | List active sessions |
| `openclaw_sessions_history` | Get session message history |
| `openclaw_sessions_send` | Send message to another session |
| `openclaw_sessions_spawn` | Spawn a background sub-agent |

### Scheduling

| Tool | Description |
|------|-------------|
| `openclaw_cron_list` | List scheduled jobs |
| `openclaw_cron_add` | Create a new cron job |
| `openclaw_cron_remove` | Delete a cron job |
| `openclaw_cron_run` | Trigger a job immediately |

### Nodes (Paired Devices)

| Tool | Description |
|------|-------------|
| `openclaw_nodes_status` | Get status of paired nodes |
| `openclaw_nodes_notify` | Send notification to a node |
| `openclaw_nodes_camera_snap` | Capture photo from node camera |
| `openclaw_nodes_location` | Get node's location |
| `openclaw_nodes_run` | Run command on a node |

### Web

| Tool | Description |
|------|-------------|
| `openclaw_web_search` | Search the web (Brave API) |
| `openclaw_web_fetch` | Fetch and extract URL content |

### Other

| Tool | Description |
|------|-------------|
| `openclaw_gateway_status` | Get session status |
| `openclaw_gateway_config_get` | Get Gateway config |
| `openclaw_tts` | Text-to-speech |
| `openclaw_memory_search` | Search memory files |

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
