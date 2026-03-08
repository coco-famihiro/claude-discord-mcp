import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChannelType } from "discord.js";
import { client } from "../discord-client.js";

const channelTypeName = (type: ChannelType): string => {
  const map: Record<number, string> = {
    [ChannelType.GuildText]: "text",
    [ChannelType.GuildVoice]: "voice",
    [ChannelType.GuildCategory]: "category",
    [ChannelType.GuildAnnouncement]: "announcement",
    [ChannelType.GuildStageVoice]: "stage",
    [ChannelType.GuildForum]: "forum",
    [ChannelType.PublicThread]: "public_thread",
    [ChannelType.PrivateThread]: "private_thread",
    [ChannelType.AnnouncementThread]: "announcement_thread",
  };
  return map[type] ?? "unknown";
};

export function registerChannelTools(server: McpServer) {
  server.tool(
    "discord_list_channels",
    "List all channels in a Discord server (guild)",
    { guild_id: z.string().describe("The ID of the guild") },
    async ({ guild_id }) => {
      const guild = await client.guilds.fetch(guild_id);
      const channels = await guild.channels.fetch();
      const list = channels
        .filter((c) => c !== null)
        .map((c) => ({
          id: c!.id,
          name: c!.name,
          type: channelTypeName(c!.type),
          position: c!.position,
          parentId: c!.parentId,
        }))
        .sort((a, b) => a.position - b.position);
      return {
        content: [{ type: "text", text: JSON.stringify(list, null, 2) }],
      };
    }
  );

  server.tool(
    "discord_get_channel_info",
    "Get detailed information about a specific channel",
    { channel_id: z.string().describe("The ID of the channel") },
    async ({ channel_id }) => {
      const channel = await client.channels.fetch(channel_id);
      if (!channel) {
        return {
          content: [{ type: "text", text: "Channel not found" }],
          isError: true,
        };
      }
      const info: Record<string, unknown> = {
        id: channel.id,
        type: channelTypeName(channel.type),
        createdAt: channel.createdAt?.toISOString(),
      };
      if ("name" in channel) info.name = channel.name;
      if ("topic" in channel) info.topic = channel.topic;
      if ("nsfw" in channel) info.nsfw = channel.nsfw;
      if ("parentId" in channel) info.parentId = channel.parentId;
      if ("rateLimitPerUser" in channel)
        info.slowmode = channel.rateLimitPerUser;
      return {
        content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
      };
    }
  );
}
