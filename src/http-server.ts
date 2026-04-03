#!/usr/bin/env node

import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { loginDiscord } from "./discord-client.js";
import { registerGuildTools } from "./tools/guilds.js";
import { registerChannelTools } from "./tools/channels.js";
import { registerMessageTools } from "./tools/messages.js";
import { registerReactionTools } from "./tools/reactions.js";
import { registerThreadTools } from "./tools/threads.js";
import { registerUserTools } from "./tools/users.js";
import { registerRoleTools } from "./tools/roles.js";

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "discord-mcp-server",
    version: "1.0.0",
  });
  registerGuildTools(server);
  registerChannelTools(server);
  registerMessageTools(server);
  registerReactionTools(server);
  registerThreadTools(server);
  registerUserTools(server);
  registerRoleTools(server);
  return server;
}

const app = express();
app.use(express.json());

// CORS support for claude.ai connector
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Mcp-Session-Id, Accept");
  res.header("Access-Control-Expose-Headers", "Mcp-Session-Id");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// Ensure Accept header includes text/event-stream for MCP protocol compatibility
// Patches both headers and rawHeaders so @hono/node-server picks up the change
app.use("/mcp", (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  const accept = req.headers.accept || "";
  if (!accept.includes("text/event-stream")) {
    const newAccept = accept ? accept + ", text/event-stream" : "application/json, text/event-stream";
    req.headers.accept = newAccept;
    // Also patch rawHeaders for @hono/node-server which reads from raw headers
    const idx = req.rawHeaders.findIndex((h: string) => h.toLowerCase() === "accept");
    if (idx !== -1 && idx + 1 < req.rawHeaders.length) {
      req.rawHeaders[idx + 1] = newAccept;
    } else {
      req.rawHeaders.push("Accept", newAccept);
    }
  }
  next();
});

// API Key authentication
const API_KEY = process.env.MCP_API_KEY;
if (!API_KEY) {
  console.error("MCP_API_KEY environment variable is required");
  process.exit(1);
}

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = authHeader.slice(7);
  if (token !== API_KEY) {
    res.status(403).json({ error: "Invalid API key" });
    return;
  }
  next();
}

// Store active sessions
const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: McpServer }>();

// Health check (no auth required)
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Streamable HTTP endpoint - POST (main interaction)
app.post("/mcp", authMiddleware, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  // Existing session
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res, req.body);
    return;
  }

  // New session
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  transport.onclose = () => {
    const sid = transport.sessionId;
    if (sid) sessions.delete(sid);
  };

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);

  if (transport.sessionId) {
    sessions.set(transport.sessionId, { transport, server });
  }
});

// Streamable HTTP endpoint - GET (server-initiated messages)
app.get("/mcp", authMiddleware, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }
  const session = sessions.get(sessionId)!;
  await session.transport.handleRequest(req, res);
});

// Streamable HTTP endpoint - DELETE (session termination)
app.delete("/mcp", authMiddleware, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }
  const session = sessions.get(sessionId)!;
  await session.transport.close();
  sessions.delete(sessionId);
  res.status(200).json({ message: "Session terminated" });
});

const PORT = parseInt(process.env.PORT || "3000", 10);

async function main() {
  await loginDiscord();
  app.listen(PORT, "0.0.0.0", () => {
    console.error(`Discord MCP HTTP server running on port ${PORT}`);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
