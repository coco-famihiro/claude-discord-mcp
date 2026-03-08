import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChannelType, TextChannel, ThreadChannel } from "discord.js";
import { client } from "../discord-client.js";

export function registerThreadTools(server: McpServer) {
  server.tool(
    "discord_create_thread",
    "Create a new thread in a channel (optionally from an existing message)",
    {
      channel_id: z.string().describe("The ID of the channel"),
      name: z.string().describe("The name of the thread"),
      message_id: z
        .string()
        .optional()
        .describe("The message ID to start the thread from (optional)"),
      private: z
        .boolean()
        .default(false)
        .describe("Whether to create a private thread (default false)"),
    },
    async ({ channel_id, name, message_id, private: isPrivate }) => {
      const channel = client.channels.cache.get(channel_id) as TextChannel;
      if (!channel) {
        return {
          content: [{ type: "text", text: "Channel not found" }],
          isError: true,
        };
      }

      let thread: ThreadChannel;
      if (message_id) {
        const msg = await channel.messages.fetch(message_id);
        thread = await msg.startThread({ name });
      } else {
        thread = await channel.threads.create({
          name,
          type: isPrivate
            ? ChannelType.PrivateThread
            : ChannelType.PublicThread,
        });
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { id: thread.id, name: thread.name, type: thread.type },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "discord_list_threads",
    "List active threads in a channel",
    {
      channel_id: z.string().describe("The ID of the channel"),
    },
    async ({ channel_id }) => {
      const channel = client.channels.cache.get(channel_id) as TextChannel;
      if (!channel) {
        return {
          content: [{ type: "text", text: "Channel not found" }],
          isError: true,
        };
      }
      const threads = await channel.threads.fetchActive();
      const list = threads.threads.map((t) => ({
        id: t.id,
        name: t.name,
        archived: t.archived,
        locked: t.locked,
        messageCount: t.messageCount,
        memberCount: t.memberCount,
        createdAt: t.createdAt?.toISOString(),
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(list, null, 2) }],
      };
    }
  );

  server.tool(
    "discord_send_thread_message",
    "Send a message to a thread",
    {
      thread_id: z.string().describe("The ID of the thread"),
      content: z.string().describe("The message content"),
    },
    async ({ thread_id, content }) => {
      const thread = client.channels.cache.get(thread_id) as ThreadChannel;
      if (!thread || !thread.isThread()) {
        const fetched = await client.channels.fetch(thread_id);
        if (!fetched || !("send" in fetched)) {
          return {
            content: [{ type: "text", text: "Thread not found" }],
            isError: true,
          };
        }
        const msg = await (fetched as ThreadChannel).send(content);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ id: msg.id, content: msg.content }, null, 2),
            },
          ],
        };
      }
      const msg = await thread.send(content);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ id: msg.id, content: msg.content }, null, 2),
          },
        ],
      };
    }
  );
}
