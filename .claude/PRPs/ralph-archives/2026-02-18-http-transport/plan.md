# Feature: HTTP Transport for OpenClaw MCP Server

## Summary

Add StreamableHTTP transport mode to the existing stdio-only MCP server. When `MCP_TRANSPORT=http`, the server listens on a configurable port and serves MCP protocol over StreamableHTTP using Node.js native `http` module. Default behavior (stdio) is unchanged. Includes a health check endpoint.

## User Story

As a developer deploying AI agents in Docker containers
I want to connect them to OpenClaw over HTTP
So that I can share one MCP server instance across multiple clients without subprocess management

## Problem Statement

The server only supports stdio transport (hardcoded at `src/index.ts:426`), so every MCP client must launch it as a subprocess. Agents in containers or remote environments cannot connect.

## Solution Statement

Conditional transport selection via `MCP_TRANSPORT` env var. HTTP mode uses `StreamableHTTPServerTransport` from SDK v1.10.2+ with Node.js native `http` module. Stateless mode (no session management) for simplicity. Same `Server` instance, same tools, same Gateway bridge — only the transport layer changes.

## Metadata

| Field            | Value                                           |
| ---------------- | ----------------------------------------------- |
| Type             | NEW_CAPABILITY                                  |
| Complexity       | MEDIUM                                          |
| Systems Affected | src/index.ts, package.json                      |
| Dependencies     | @modelcontextprotocol/sdk ^1.10.2               |
| Estimated Tasks  | 5                                               |

---

## UX Design

### Before State
```
┌──────────────┐    stdio     ┌──────────────────┐    HTTP POST    ┌──────────────┐
│  MCP Client  │ ──────────►  │ openclaw-mcp-srv │ ──────────────► │ OpenClaw GW  │
│ (subprocess) │  stdin/out   │  (StdioTransport) │  /tools/invoke  │  :18789      │
└──────────────┘              └──────────────────┘                  └──────────────┘

LIMITATION: Client MUST launch server as subprocess. No network access.
```

### After State
```
MODE A (default): MCP_TRANSPORT=stdio (unchanged)
┌──────────────┐    stdio     ┌──────────────────┐    HTTP POST    ┌──────────────┐
│  MCP Client  │ ──────────►  │ openclaw-mcp-srv │ ──────────────► │ OpenClaw GW  │
└──────────────┘              └──────────────────┘                  └──────────────┘

MODE B: MCP_TRANSPORT=http
┌──────────────┐  HTTP POST   ┌──────────────────┐    HTTP POST    ┌──────────────┐
│  MCP Client  │ ──────────►  │ openclaw-mcp-srv │ ──────────────► │ OpenClaw GW  │
│  (anywhere)  │  /mcp        │  :8170           │  /tools/invoke  │  :18789      │
└──────────────┘              └──────────────────┘                  └──────────────┘
                    ▲
                    │  Also: GET /health → {"status":"ok"}
```

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| Transport | stdio only | stdio (default) or HTTP | Network-accessible MCP |
| Config | 2 env vars | 4 env vars (+MCP_TRANSPORT, MCP_PORT) | Transport selection |
| Health | None | GET /health | Container orchestration readiness |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/index.ts` | 376-435 | `main()` function — the ONLY code that changes significantly |
| P0 | `src/index.ts` | 1-14 | Imports and env var pattern to MIRROR |
| P1 | `package.json` | all | Dependencies to update |

**External Documentation:**
| Source | Section | Why Needed |
|--------|---------|------------|
| [@modelcontextprotocol/sdk StreamableHTTP](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md) | StreamableHTTPServerTransport | Constructor options, handleRequest signature |
| [SDK Issue #340](https://github.com/modelcontextprotocol/typescript-sdk/issues/340) | Stateless mode fix | Ensure SDK >= 1.10.2 for stateless mode |

---

## Patterns to Mirror

**ENV_VAR_PATTERN:**
```typescript
// SOURCE: src/index.ts:12-13
// COPY THIS PATTERN:
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";
```

**ERROR_HANDLING:**
```typescript
// SOURCE: src/index.ts:411-422
// COPY THIS PATTERN:
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}
```

**SERVER_SETUP:**
```typescript
// SOURCE: src/index.ts:378-388
// COPY THIS PATTERN for creating Server instance:
const server = new Server(
  { name: "openclaw-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);
```

**LOGGING:**
```typescript
// SOURCE: src/index.ts:429,433
// COPY THIS PATTERN — uses console.error (stderr) for logging:
console.error("OpenClaw MCP Server running on stdio");
console.error("Fatal error:", error);
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/index.ts` | UPDATE | Add imports, env vars, HTTP server creation, transport selection |
| `package.json` | UPDATE | Bump SDK to ^1.10.2, remove unused `ws` and `@types/ws` |

---

## NOT Building (Scope Limits)

- **Authentication** — Gateway token auth is sufficient for internal use
- **Stateful session management** — stateless mode is simpler and sufficient for v1
- **SSE transport** — deprecated per MCP spec
- **Express/Fastify** — native `http` module is sufficient for single endpoint
- **Docker deployment** — Phase 2 (depends on this phase completing first)
- **Documentation updates** — Phase 3

---

## Step-by-Step Tasks

### Task 1: UPDATE `package.json` — Bump SDK, remove unused deps

- **ACTION**: Update `@modelcontextprotocol/sdk` from `^1.0.0` to `^1.10.2`. Remove `ws` from dependencies and `@types/ws` from devDependencies.
- **MIRROR**: Existing package.json structure
- **GOTCHA**: Must use `^1.10.2` not `^1.10.0` — stateless mode bug fixed in 1.10.2 (SDK Issue #340)
- **VALIDATE**: `pnpm install` succeeds without errors

### Task 2: UPDATE `src/index.ts` — Add new imports and env vars

- **ACTION**: Add imports for `StreamableHTTPServerTransport`, `isInitializeRequest`, and `node:http`. Add `MCP_TRANSPORT` and `MCP_PORT` env vars following existing pattern.
- **IMPLEMENT**:
  ```typescript
  import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
  import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
  import * as http from "node:http";

  // Transport configuration
  const MCP_TRANSPORT = process.env.MCP_TRANSPORT || "stdio";
  const MCP_PORT = parseInt(process.env.MCP_PORT || "8170", 10);
  ```
- **MIRROR**: `src/index.ts:1-13` — import style and env var pattern
- **GOTCHA**: Import path must include `.js` extension (ESM). `isInitializeRequest` is already exported from `types.js` alongside existing imports.
- **VALIDATE**: `pnpm run build` — TypeScript compiles

### Task 3: UPDATE `src/index.ts` — Extract server setup into reusable function

- **ACTION**: Extract the `Server` creation and request handler registration (lines 378-423) into a `createServer()` function that returns a configured `Server` instance. This allows both transports to use the same server setup.
- **IMPLEMENT**:
  ```typescript
  function createServer(): Server {
    const server = new Server(
      { name: "openclaw-mcp-server", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );
    // ... register ListToolsRequestSchema handler
    // ... register CallToolRequestSchema handler
    return server;
  }
  ```
- **MIRROR**: `src/index.ts:378-423` — move existing code, don't change logic
- **GOTCHA**: For stateless HTTP, each request needs a fresh Server instance. Make `createServer()` callable multiple times.
- **VALIDATE**: `pnpm run build`

### Task 4: UPDATE `src/index.ts` — Add HTTP transport startup path

- **ACTION**: Replace the monolithic `main()` with transport-conditional logic. Stdio path stays the same. HTTP path creates a native `http.Server`, routes `/mcp` to `StreamableHTTPServerTransport`, and adds `/health` endpoint.
- **IMPLEMENT** (HTTP path):
  ```typescript
  async function startHttpTransport() {
    const httpServer = http.createServer(async (req, res) => {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

      // Health check
      if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }

      // MCP endpoint
      if (url.pathname === "/mcp") {
        // Parse body for POST
        if (req.method === "POST") {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          let body: unknown;
          try {
            body = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
          } catch {
            res.writeHead(400).end(JSON.stringify({
              jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null,
            }));
            return;
          }

          // Stateless: fresh transport + server per request
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
          });
          const server = createServer();
          await server.connect(transport);
          await transport.handleRequest(req, res, body);
          res.on("close", () => { transport.close(); server.close(); });
          return;
        }

        // GET/DELETE not supported in stateless mode
        res.writeHead(405).end(JSON.stringify({
          jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed in stateless mode" }, id: null,
        }));
        return;
      }

      res.writeHead(404).end();
    });

    httpServer.listen(MCP_PORT, () => {
      console.error(`OpenClaw MCP Server running on http://0.0.0.0:${MCP_PORT}/mcp`);
    });

    process.on("SIGINT", () => {
      httpServer.close(() => process.exit(0));
    });
  }
  ```
- **IMPLEMENT** (updated main):
  ```typescript
  async function main() {
    if (MCP_TRANSPORT === "http") {
      await startHttpTransport();
    } else {
      const server = createServer();
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error("OpenClaw MCP Server running on stdio");
    }
  }
  ```
- **MIRROR**: `src/index.ts:429` — console.error for logging
- **GOTCHA**: Stateless mode requires `sessionIdGenerator: undefined` (not omitted). Each POST gets fresh transport+server. Must parse body before `handleRequest` since we need to route.
- **VALIDATE**: `pnpm run build`

### Task 5: VALIDATE — Build and manual test

- **ACTION**: Run full validation suite
- **VALIDATE**:
  1. `pnpm run build` — must compile cleanly
  2. `MCP_TRANSPORT=stdio pnpm run start` — verify stdio still works (should log to stderr)
  3. `MCP_TRANSPORT=http MCP_PORT=8170 pnpm run start` — verify HTTP starts
  4. `curl http://localhost:8170/health` — expect `{"status":"ok"}`
  5. Test MCP endpoint with a POST to `/mcp` containing an initialize request

---

## Testing Strategy

### Manual Tests (no test framework in project)

| Test | Command | Expected |
|------|---------|----------|
| Build | `pnpm run build` | Exit 0, no errors |
| Stdio mode | `MCP_TRANSPORT=stdio node dist/index.js` | Logs "running on stdio" to stderr |
| HTTP startup | `MCP_TRANSPORT=http node dist/index.js` | Logs "running on http://0.0.0.0:8170/mcp" |
| Health check | `curl http://localhost:8170/health` | `{"status":"ok"}` |
| MCP initialize | POST `{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}` to `/mcp` | JSON-RPC response with server capabilities |
| 404 handling | `curl http://localhost:8170/other` | 404 |
| Invalid JSON | POST garbage to `/mcp` | 400 Parse error |

### Edge Cases Checklist

- [ ] Default transport (no MCP_TRANSPORT set) uses stdio
- [ ] Invalid MCP_TRANSPORT value falls through to stdio
- [ ] MCP_PORT non-numeric defaults gracefully (parseInt returns NaN → use 8170)
- [ ] Malformed JSON body returns 400
- [ ] GET/DELETE to /mcp returns 405
- [ ] Unknown path returns 404

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
pnpm run build
```

**EXPECT**: Exit 0, no TypeScript errors

### Level 2: MANUAL_VALIDATION

```bash
# Terminal 1 — start HTTP mode
MCP_TRANSPORT=http node dist/index.js

# Terminal 2 — test health
curl http://localhost:8170/health

# Terminal 2 — test MCP initialize
curl -X POST http://localhost:8170/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}'
```

**EXPECT**: Health returns `{"status":"ok"}`, initialize returns JSON-RPC response with server info

---

## Acceptance Criteria

- [ ] `pnpm run build` succeeds with no errors
- [ ] Default behavior (no MCP_TRANSPORT) still runs stdio transport
- [ ] `MCP_TRANSPORT=http` starts HTTP server on configured port
- [ ] `GET /health` returns 200 with `{"status":"ok"}`
- [ ] MCP tool calls work over HTTP (initialize → list_tools → call_tool)
- [ ] No new runtime dependencies beyond SDK bump (no Express)
- [ ] Unused `ws` dependency removed

---

## Completion Checklist

- [ ] All tasks completed in order
- [ ] Level 1: Build succeeds
- [ ] Level 2: Manual validation passes
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SDK ^1.10.2 has breaking changes vs ^1.0.0 | Low | High | SDK follows semver; 1.x is backward compatible. Build validates. |
| Stateless mode bug (Issue #340) | Low | Med | Pin minimum to ^1.10.2 where fix is included |
| Body parsing edge cases with native http | Low | Low | Match SDK examples; test with malformed input |

---

## Notes

- The PRD's open question about simultaneous stdio+HTTP: this plan does one-or-the-other per process (simpler). Simultaneous can be added later if needed.
- Port 8170 is confirmed available per `F:\Production\.documentation\services.md`.
- The `ws` dependency and `@types/ws` are removed as they were unused (noted in PRD).
- Stateless mode chosen over stateful because: simpler implementation, no session cleanup needed, sufficient for internal use per PRD decisions log.
