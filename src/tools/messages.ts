import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TextChannel } from "discord.js";
import { client } from "../discord-client.js";

function getTextChannel(channelId: string): TextChannel {
  const channel = client.channels.cache.get(channelId);
  if (!channel || !("send" in channel)) {
    throw new Error(`Channel ${channelId} is not a text channel or not found`);
  }
  return channel as TextChannel;
}

export function registerMessageTools(server: McpServer) {
  server.tool(
    "discord_send_message",
    "Send a message to a Discord channel",
    {
      channel_id: z.string().describe("The ID of the channel"),
      content: z.string().describe("The message content to send"),
    },
    async ({ channel_id, content }) => {
      const channel = getTextChannel(channel_id);
      const msg = await channel.send(content);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { id: msg.id, content: msg.content, channelId: msg.channelId },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "discord_read_messages",
    "Read messages from a Discord channel",
    {
      channel_id: z.string().describe("The ID of the channel"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .describe("Number of messages to fetch (1-100, default 20)"),
      before: z
        .string()
        .optional()
        .describe("Fetch messages before this message ID"),
      after: z
        .string()
        .optional()
        .describe("Fetch messages after this message ID"),
    },
    async ({ channel_id, limit, before, after }) => {
      const channel = getTextChannel(channel_id);
      const options: { limit: number; before?: string; after?: string } = {
        limit,
      };
      if (before) options.before = before;
      if (after) options.after = after;
      const messages = await channel.messages.fetch(options);
      const list = messages.map((m) => ({
        id: m.id,
        author: { id: m.author.id, username: m.author.username, bot: m.author.bot },
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        attachments: m.attachments.map((a) => ({ name: a.name, url: a.url })),
        embeds: m.embeds.length,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(list, null, 2) }],
      };
    }
  );

  server.tool(
    "discord_reply_message",
    "Reply to a specific message in a Discord channel",
    {
      channel_id: z.string().describe("The ID of the channel"),
      message_id: z.string().describe("The ID of the message to reply to"),
      content: z.string().describe("The reply content"),
    },
    async ({ channel_id, message_id, content }) => {
      const channel = getTextChannel(channel_id);
      const target = await channel.messages.fetch(message_id);
      const reply = await target.reply(content);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { id: reply.id, content: reply.content },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "discord_delete_message",
    "Delete a message from a Discord channel",
    {
      channel_id: z.string().describe("The ID of the channel"),
      message_id: z.string().describe("The ID of the message to delete"),
    },
    async ({ channel_id, message_id }) => {
      const channel = getTextChannel(channel_id);
      const msg = await channel.messages.fetch(message_id);
      await msg.delete();
      return {
        content: [
          { type: "text", text: `Message ${message_id} deleted successfully` },
        ],
      };
    }
  );
}
