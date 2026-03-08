import { Client, GatewayIntentBits, Partials } from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("DISCORD_BOT_TOKEN environment variable is required");
  process.exit(1);
}

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

export async function loginDiscord(): Promise<void> {
  return new Promise((resolve, reject) => {
    client.once("ready", () => {
      console.error(`Discord bot logged in as ${client.user?.tag}`);
      resolve();
    });
    client.once("error", reject);
    client.login(token).catch(reject);
  });
}
