import Discord from 'discord.js';
import { connectToDatabase } from '../../db';
import { client } from '../../client';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const data = new Discord.SlashCommandBuilder()
    .setName('adduser')
    .setDescription('Add a user to the thread')
    .setContexts(Discord.InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('The user to add').setRequired(true))

export async function execute(interaction: Discord.ChatInputCommandInteraction) {
    let db = await connectToDatabase();
    if (!interaction.channel?.isThread()) return interaction.reply({ content: 'You can only add a user to a thread.', ephemeral: true });
    let thread = await db.collection('threads').findOne({ threadId: interaction.channelId });
    if (!thread) return interaction.reply({ content: 'This is not a valid thread.', ephemeral: true });


    let user = interaction.options.getUser('user');
    if (!user) return interaction.reply({ content: 'User not found.', ephemeral: true });

    if (thread.users.includes(user.id)) return interaction.reply({ content: 'User is already in the thread.', ephemeral: true });

    interaction.channel.members.add(user.id, `User added by ${interaction.user.tag}`).then(() => {
        db.collection('threads').updateOne({ threadId: interaction.channelId }, { $push: { users: user.id } }).then(() => {
            interaction.reply({ content: `User added to the thread.`, ephemeral: true });
        })
    })


}