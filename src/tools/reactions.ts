import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TextChannel } from "discord.js";
import { client } from "../discord-client.js";

export function registerReactionTools(server: McpServer) {
  server.tool(
    "discord_add_reaction",
    "Add a reaction emoji to a message",
    {
      channel_id: z.string().describe("The ID of the channel"),
      message_id: z.string().describe("The ID of the message"),
      emoji: z
        .string()
        .describe("The emoji to react with (unicode emoji or custom emoji ID)"),
    },
    async ({ channel_id, message_id, emoji }) => {
      const channel = client.channels.cache.get(channel_id) as TextChannel;
      if (!channel) {
        return {
          content: [{ type: "text", text: "Channel not found" }],
          isError: true,
        };
      }
      const msg = await channel.messages.fetch(message_id);
      await msg.react(emoji);
      return {
        content: [
          {
            type: "text",
            text: `Reacted with ${emoji} on message ${message_id}`,
          },
        ],
      };
    }
  );

  server.tool(
    "discord_get_reactions",
    "Get reactions on a message",
    {
      channel_id: z.string().describe("The ID of the channel"),
      message_id: z.string().describe("The ID of the message"),
    },
    async ({ channel_id, message_id }) => {
      const channel = client.channels.cache.get(channel_id) as TextChannel;
      if (!channel) {
        return {
          content: [{ type: "text", text: "Channel not found" }],
          isError: true,
        };
      }
      const msg = await channel.messages.fetch(message_id);
      const reactions = msg.reactions.cache.map((r) => ({
        emoji: r.emoji.name,
        emojiId: r.emoji.id,
        count: r.count,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(reactions, null, 2) }],
      };
    }
  );
}
