import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client } from "../discord-client.js";

export function registerRoleTools(server: McpServer) {
  server.tool(
    "discord_list_roles",
    "List all roles in a Discord server (guild)",
    { guild_id: z.string().describe("The ID of the guild") },
    async ({ guild_id }) => {
      const guild = await client.guilds.fetch(guild_id);
      const roles = await guild.roles.fetch();
      const list = roles
        .sort((a, b) => b.position - a.position)
        .map((r) => ({
          id: r.id,
          name: r.name,
          color: r.hexColor,
          position: r.position,
          hoist: r.hoist,
          mentionable: r.mentionable,
          managed: r.managed,
          memberCount: r.members.size,
        }));
      return {
        content: [{ type: "text", text: JSON.stringify(list, null, 2) }],
      };
    }
  );

  server.tool(
    "discord_get_role_members",
    "Get all members with a specific role",
    {
      guild_id: z.string().describe("The ID of the guild"),
      role_id: z.string().describe("The ID of the role"),
    },
    async ({ guild_id, role_id }) => {
      const guild = await client.guilds.fetch(guild_id);
      await guild.members.fetch();
      const role = await guild.roles.fetch(role_id);
      if (!role) {
        return {
          content: [{ type: "text", text: "Role not found" }],
          isError: true,
        };
      }
      const members = role.members.map((m) => ({
        id: m.id,
        username: m.user.username,
        displayName: m.displayName,
      }));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { role: role.name, memberCount: members.length, members },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
