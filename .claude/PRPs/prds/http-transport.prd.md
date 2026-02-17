# HTTP Transport for OpenClaw MCP Server

## Problem Statement

The openclaw-mcp-server only supports stdio transport, meaning every MCP client must launch it as a subprocess. Agents running in Docker containers, remote services, or multi-agent orchestrators cannot connect to OpenClaw tools without managing subprocess lifecycle — limiting OpenClaw adoption across the infrastructure.

## Evidence

- Current codebase hardcodes `StdioServerTransport` with no transport selection logic (`src/index.ts:426`)
- The MCP specification (2025-03-26) introduced StreamableHTTP as the standard remote transport, replacing deprecated SSE
- `@modelcontextprotocol/sdk` has shipped stable `StreamableHTTPServerTransport` since v1.10.0 (April 2025)
- The existing `ws` dependency in package.json is unused — suggests HTTP/WebSocket transport was anticipated

## Proposed Solution

Add an HTTP transport mode to the existing server, selectable via environment variable. When `MCP_TRANSPORT=http`, the server listens on a configurable port and serves the MCP protocol over StreamableHTTP. When `MCP_TRANSPORT=stdio` (default), behavior is unchanged. Include a Dockerfile and Docker Compose entry for production deployment alongside existing infrastructure.

## Key Hypothesis

We believe adding HTTP transport will enable any networked agent to access OpenClaw tools without subprocess management.
We'll know we're right when we can connect an MCP client to `http://localhost:8170/mcp` and successfully invoke an OpenClaw tool.

## What We're NOT Building

- Authentication/OAuth layer — Gateway token auth is sufficient for internal use
- Multi-client session management — stateless mode is fine for v1
- SSE backward compatibility — SSE is deprecated, StreamableHTTP only
- Load balancing or horizontal scaling — single instance is sufficient
- Admin UI or health dashboard

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| HTTP transport works end-to-end | Tool invocation succeeds over HTTP | Manual test with MCP Inspector or curl |
| Stdio transport unbroken | Existing stdio mode still works | Run with default config, invoke a tool |
| Docker deployment works | Container starts and accepts connections | `docker compose up`, then connect client |

## Open Questions

- [ ] Should the server support both transports simultaneously (stdio + HTTP) or is it one-or-the-other per process?
- [ ] What port should be the default? (8170 proposed — needs check against `F:\Production\.documentation\services.md`)
- [ ] Should we add a basic health check endpoint (`GET /health`) for Docker?

---

## Users & Context

**Primary User**
- **Who**: Developer (you) running AI agents in Docker containers and orchestration systems
- **Current behavior**: Must launch openclaw-mcp-server as a subprocess from each MCP client
- **Trigger**: Deploying a new agent that needs OpenClaw tools but runs in a container or remote environment
- **Success state**: Point any agent at `http://host:port/mcp` and OpenClaw tools are available

**Job to Be Done**
When I deploy agents in Docker containers, I want to connect them to OpenClaw over HTTP, so I can share one MCP server instance across multiple clients without subprocess management.

**Non-Users**
External consumers or end users — this is internal infrastructure tooling.

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | `MCP_TRANSPORT` env var to select stdio or http | Core transport switching mechanism |
| Must | StreamableHTTP transport on configurable port | Enables network-accessible MCP |
| Must | Dockerfile + Docker Compose entry | Production deployment path |
| Should | Health check endpoint (`GET /health`) | Container orchestration readiness |
| Could | CLI flag (`--transport http`) as alternative to env var | Developer convenience |
| Won't | Authentication beyond Gateway token | Internal use only |
| Won't | SSE transport support | Deprecated per MCP spec |
| Won't | Multi-process / clustering | Single instance sufficient |

### MVP Scope

- Environment variable `MCP_TRANSPORT` (`stdio` default, `http` option)
- Environment variable `MCP_PORT` (default `8170`)
- StreamableHTTP transport using `@modelcontextprotocol/sdk`
- Node.js native `http` module (no Express dependency)
- Dockerfile and docker-compose.yml
- Updated README with HTTP usage instructions

### User Flow

```
1. Set MCP_TRANSPORT=http, MCP_PORT=8170
2. Start server (node dist/index.js or docker compose up)
3. Server logs: "OpenClaw MCP Server running on http://0.0.0.0:8170/mcp"
4. MCP client connects to http://localhost:8170/mcp
5. Client calls openclaw_web_search → Gateway → results returned over HTTP
```

---

## Technical Approach

**Feasibility**: HIGH

**Architecture Notes**
- `StreamableHTTPServerTransport` imported from `@modelcontextprotocol/sdk/server/streamableHttp.js`
- Use Node.js native `http` module to avoid adding Express as a dependency
- Same `Server` instance, same tool definitions, same Gateway bridge — only transport layer changes
- SDK version bump from `^1.0.0` to `^1.10.0` required
- Remove unused `ws` dependency

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| SDK API differences between 1.0 and 1.10 | Low | SDK follows semver, no breaking changes in 1.x |
| StreamableHTTPServerTransport API surface unclear | Low | Well-documented in SDK, examples available |
| Native http module integration complexity | Low | SDK examples show Express integration; native http is simpler |

---

## Implementation Phases

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | HTTP transport | Add transport selection and StreamableHTTP support | pending | - | - | - |
| 2 | Docker deployment | Dockerfile, docker-compose.yml, env config | pending | - | 1 | - |
| 3 | Documentation | Update README, CLAUDE.md with HTTP usage | pending | - | 1 | - |

### Phase Details

**Phase 1: HTTP Transport**
- **Goal**: Server can run in HTTP mode and serve MCP protocol over StreamableHTTP
- **Scope**: Bump SDK, add `MCP_TRANSPORT`/`MCP_PORT` env vars, conditional transport creation, native http server, optional health endpoint
- **Success signal**: `MCP_TRANSPORT=http node dist/index.js` starts and accepts MCP tool calls over HTTP

**Phase 2: Docker Deployment**
- **Goal**: One-command deployment via Docker Compose
- **Scope**: Dockerfile, docker-compose.yml, `.env.example`, integration with production infrastructure
- **Success signal**: `docker compose up` starts server, external client connects and invokes tools

**Phase 3: Documentation**
- **Goal**: Clear setup instructions for both transport modes
- **Scope**: README update, CLAUDE.md update, env var documentation
- **Success signal**: New user can set up HTTP mode from README alone

### Parallelism Notes

Phases 2 and 3 can run after Phase 1 completes. Phase 2 and 3 are independent of each other but both require Phase 1's working HTTP transport.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| HTTP framework | Node.js native `http` | Express, Fastify | No need for routing framework; single endpoint. Avoids new dependency. |
| Transport selection | Environment variable | CLI flags, config file | Consistent with existing config pattern (env vars only). Docker-friendly. |
| Session management | Stateless | Stateful sessions | Simpler, no session cleanup needed, sufficient for internal use |
| Default port | 8170 | 3000, 8080, 9090 | Avoids common port conflicts. Needs verification against production services. |

---

## Research Summary

**Market Context**
- StreamableHTTP is the official MCP remote transport (spec 2025-03-26), replacing deprecated SSE
- Dual transport (stdio + HTTP) is a documented best practice (Microsoft Azure blog)
- TypeScript SDK v1.10.0+ ships stable `StreamableHTTPServerTransport`
- Security spec requires Origin header validation and localhost binding for local servers

**Technical Context**
- Single-file server (436 lines), transport hardcoded at line 426
- `Server` instance is transport-agnostic — `server.connect()` accepts any transport
- SDK at `^1.0.0` needs bump to `^1.10.0`
- No CLI parsing exists; all config via env vars
- Unused `ws` dependency can be removed

---

*Generated: 2026-02-18*
*Status: DRAFT - needs validation*
