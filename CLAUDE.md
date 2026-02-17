# CLAUDE.md - openclaw-mcp-server

> MCP server exposing OpenClaw Gateway tools to Claude Code and other MCP clients.

## Project Overview

A Node.js/TypeScript MCP (Model Context Protocol) server that acts as a bridge between MCP clients (Claude Code, etc.) and the OpenClaw Gateway HTTP API. It exposes OpenClaw capabilities — messaging, sessions, cron, nodes, web, TTS, memory — as MCP tools over stdio transport.

**Tech stack**: TypeScript, Node.js 18+, `@modelcontextprotocol/sdk`, `ws`
**Transport**: stdio (designed to be launched by MCP clients)

## Essential Commands

```bash
pnpm install              # Install dependencies
pnpm run build            # Compile TypeScript → dist/
pnpm run dev              # Run with tsx (hot reload)
pnpm run start            # Run compiled output
```

## Architecture

```
src/
  index.ts        # Single-file server: tool definitions, Gateway HTTP bridge, MCP server setup
dist/             # Compiled output (gitignored)
```

### Key patterns

- **Tool definitions**: `OPENCLAW_TOOLS` array defines all MCP tools with JSON Schema input schemas
- **Tool mapping**: `mapToolCall()` translates MCP tool names → OpenClaw Gateway tool names + actions
- **Gateway invocation**: `invokeGatewayTool()` POSTs to `GATEWAY_URL/tools/invoke` with auth
- **Single entry point**: Everything is in `src/index.ts` — no multi-file architecture yet

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `OPENCLAW_GATEWAY_URL` | `http://127.0.0.1:18789` | OpenClaw Gateway HTTP endpoint |
| `OPENCLAW_GATEWAY_TOKEN` | (empty) | Bearer token for Gateway auth |

## Project-Specific Conventions

- Tool names use `openclaw_` prefix with underscore-separated segments (e.g., `openclaw_nodes_camera_snap`)
- Gateway mapping uses dot notation for nested actions (e.g., `config.get`)
- Errors return `isError: true` in MCP response content, never throw to the transport
