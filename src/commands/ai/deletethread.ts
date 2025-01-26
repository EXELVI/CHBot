import Discord from 'discord.js';
import { connectToDatabase } from '../../db';
import { client } from '../../client';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const data = new Discord.SlashCommandBuilder()
    .setName('deletethread')
    .setDescription('Delete the thread')
    .setContexts(Discord.InteractionContextType.Guild)

export async function execute(interaction: Discord.ChatInputCommandInteraction) {
    if (!interaction.channel?.isThread()) return interaction.reply({ content: 'You cannot delete a thread in a non-thread channel.', ephemeral: true });

    let db = await connectToDatabase();

    let thread = await db.collection('threads').findOne({ threadId: interaction.channelId });

    if (!thread) return interaction.reply({ content: 'Thread not found.', ephemeral: true });

    client.channels.fetch(interaction.channelId).then(async (channel) => {
        if (channel?.type != Discord.ChannelType.PrivateThread) return interaction.reply({ content: 'You can only delete a thread in a private thread channel.', ephemeral: true });
            db.collection('threads').deleteOne({ threadId: interaction.channelId }).then(() => {
                channel.delete()
            })
    })
}
