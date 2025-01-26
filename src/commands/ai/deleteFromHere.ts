import Discord from 'discord.js';
import { connectToDatabase } from '../../db';

export const data = {
    name: 'deletefromhere',
    type: 3,
}

export async function execute(interaction: Discord.MessageContextMenuCommandInteraction) {
    if (!interaction?.targetId) return

    let msg = await interaction.targetMessage
    if (!msg) return

    let db = await connectToDatabase();
    let thread = await db.collection('threads').findOne({ threadId: msg.channelId });
    if (!thread) return interaction.reply({ content: 'This is not a valid thread.', ephemeral: true });

    if (!thread.users.includes(interaction.user.id)) return interaction.reply({ content: 'You are not in the thread.', ephemeral: true });

    await msg.channel.messages.fetch({ after: msg.id, limit: 100 })
        .then(messages => {
            const filteredMessages = messages.filter(msg => (Date.now() - msg.createdTimestamp) < 1209600000);
            if (messages.size === 0) return interaction.reply({ content: 'No messages to delete.', ephemeral: true });
            if (messages.size > 100) return interaction.reply({ content: 'You can only delete up to 100 messages at a time.', ephemeral: true });
            (msg.channel as Discord.TextChannel).bulkDelete(filteredMessages)
                .then(deletedMessages => {
                    msg.delete().catch(console.error);
                    interaction.reply({ content: `Deleted \`${deletedMessages.size}\` messages.`, ephemeral: true });
                })
                .catch(console.error);
        })
}





