import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client } from "../discord-client.js";

export function registerUserTools(server: McpServer) {
  server.tool(
    "discord_list_members",
    "List members in a Discord server (guild). Requires GuildMembers privileged intent.",
    {
      guild_id: z.string().describe("The ID of the guild"),
      limit: z
        .number()
        .min(1)
        .max(1000)
        .default(100)
        .describe("Maximum number of members to fetch (1-1000, default 100)"),
      query: z
        .string()
        .optional()
        .describe("Search query to filter members by username"),
    },
    async ({ guild_id, limit, query }) => {
      const guild = await client.guilds.fetch(guild_id);

      let members;
      if (query) {
        members = await guild.members.search({ query, limit });
      } else {
        members = await guild.members.list({ limit });
      }

      const list = members.map((m) => ({
        id: m.id,
        username: m.user.username,
        displayName: m.displayName,
        nickname: m.nickname,
        bot: m.user.bot,
        joinedAt: m.joinedAt?.toISOString(),
        roles: m.roles.cache
          .filter((r) => r.name !== "@everyone")
          .map((r) => ({ id: r.id, name: r.name })),
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(list, null, 2) }],
      };
    }
  );
}
