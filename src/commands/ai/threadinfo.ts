import Discord from 'discord.js';
import { connectToDatabase } from '../../db';

function countObjectKeys(obj: any) {
    return Object.keys(obj).length;
}

export const data = new Discord.SlashCommandBuilder()
    .setName('threadinfo')
    .setDescription('Get information about the current thread.')
    .setContexts(Discord.InteractionContextType.BotDM, Discord.InteractionContextType.Guild, Discord.InteractionContextType.PrivateChannel)
    .setIntegrationTypes([Discord.ApplicationIntegrationType.GuildInstall, Discord.ApplicationIntegrationType.UserInstall])

export async function execute(interaction: Discord.ChatInputCommandInteraction) {
    if (!interaction.channel?.isThread()) {
        return interaction.reply({ content: 'This command can only be used in a thread.', ephemeral: true });
    }

    const db = await connectToDatabase();
    const thread = await db.collection('threads').findOne({ threadId: interaction.channelId });

    if (!thread) {
        return interaction.reply({ content: 'Thread not found in the database.', ephemeral: true });
    }

    const embed = new Discord.EmbedBuilder()
        .setTitle('Thread Information')
        .addFields(
            { name: 'Thread ID', value: "```" + thread.threadId + "```", inline: true },
            { name: `Users [${countObjectKeys(thread.users)}]`, value: thread.users.map((user: any) => `<@${user}>`).join(', ') || 'None', inline: true },
            { name: `Characters [${countObjectKeys(thread.characters)}]`, value: thread.characters.map((char: any) => char.name).join(', ') || 'None', inline: true },
            { name: 'Scenario', value:  "```" + (thread.scenario || 'None') + "```", inline: true },
        )
        .setColor('#0099ff')
        .setTimestamp();

    interaction.reply({ embeds: [embed], ephemeral: true });
}