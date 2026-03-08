import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client } from "../discord-client.js";

export function registerGuildTools(server: McpServer) {
  server.tool(
    "discord_list_guilds",
    "List all Discord servers (guilds) the bot is a member of",
    {},
    async () => {
      const guilds = client.guilds.cache.map((g) => ({
        id: g.id,
        name: g.name,
        memberCount: g.memberCount,
        ownerId: g.ownerId,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(guilds, null, 2) }],
      };
    }
  );

  server.tool(
    "discord_get_guild_info",
    "Get detailed information about a specific Discord server (guild)",
    { guild_id: z.string().describe("The ID of the guild") },
    async ({ guild_id }) => {
      const guild = await client.guilds.fetch(guild_id);
      const info = {
        id: guild.id,
        name: guild.name,
        description: guild.description,
        memberCount: guild.memberCount,
        ownerId: guild.ownerId,
        createdAt: guild.createdAt.toISOString(),
        icon: guild.iconURL(),
        preferredLocale: guild.preferredLocale,
        premiumTier: guild.premiumTier,
        premiumSubscriptionCount: guild.premiumSubscriptionCount,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
      };
    }
  );
}
