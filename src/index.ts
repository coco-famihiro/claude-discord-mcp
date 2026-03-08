#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loginDiscord } from "./discord-client.js";
import { registerGuildTools } from "./tools/guilds.js";
import { registerChannelTools } from "./tools/channels.js";
import { registerMessageTools } from "./tools/messages.js";
import { registerReactionTools } from "./tools/reactions.js";
import { registerThreadTools } from "./tools/threads.js";
import { registerUserTools } from "./tools/users.js";
import { registerRoleTools } from "./tools/roles.js";

const server = new McpServer({
  name: "discord-mcp-server",
  version: "1.0.0",
});

// Register all tools
registerGuildTools(server);
registerChannelTools(server);
registerMessageTools(server);
registerReactionTools(server);
registerThreadTools(server);
registerUserTools(server);
registerRoleTools(server);

async function main() {
  // Login to Discord first
  await loginDiscord();

  // Start MCP server on stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Discord MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
