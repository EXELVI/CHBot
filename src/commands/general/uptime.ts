import Discord from 'discord.js';
import { connectToDatabase } from '../../db';
import { client } from '../../client';
import { discordTimestamps } from 'exelvi';

export const data = new Discord.SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Get the uptime of the bot')
    .setIntegrationTypes([Discord.ApplicationIntegrationType.GuildInstall])
    .setContexts(Discord.InteractionContextType.Guild, Discord.InteractionContextType.BotDM, Discord.InteractionContextType.PrivateChannel)

export async function execute(interaction: Discord.ChatInputCommandInteraction) {
    let uptime = discordTimestamps.fromDate(Date.now() - client.uptime, "RELATIVE");
    
    (interaction.channel as Discord.TextChannel).send({ content: `Test...` }).then((msg) => {
        if (msg.deletable) msg.delete();
        interaction.reply({ content: `**Uptime:** ${uptime}\n**Ping:** ${Date.now() - msg.createdTimestamp}ms\n**API Latency:** ${client.ws.ping}ms\n**Guilds:** ${client.guilds.cache.size}\n**Users:** ${client.users.cache.size}\n**Memory Usage:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, ephemeral: true });

    }) 

}

