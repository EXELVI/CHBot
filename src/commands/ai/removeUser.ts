import Discord from 'discord.js';
import { connectToDatabase } from '../../db';

export const data = new Discord.SlashCommandBuilder()
    .setName('removeuser')
    .setDescription('Remove a user from the thread')
    .setContexts(Discord.InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('The user to remove').setRequired(true));

export async function execute(interaction: Discord.ChatInputCommandInteraction) {
    let db = await connectToDatabase();
    if (!interaction.channel?.isThread()) return interaction.reply({ content: 'You can only remove a user from a thread.', ephemeral: true });
    let thread = await db.collection('threads').findOne({ threadId: interaction.channelId });
    if (!thread) return interaction.reply({ content: 'This is not a valid thread.', ephemeral: true });

    let user = interaction.options.getUser('user');
    if (!user) return interaction.reply({ content: 'User not found.', ephemeral: true });

    if (!thread.users.includes(user.id)) return interaction.reply({ content: 'User is not in the thread.', ephemeral: true });

    interaction.channel.members.remove(user.id, `User removed by ${interaction.user.tag}`).then(() => {
        db.collection('threads').updateOne({ threadId: interaction.channelId }, { $pull: { users: user.id } }).then(() => {
            interaction.reply({ content: `User removed from the thread.`, ephemeral: true });
        });
    }); 

}