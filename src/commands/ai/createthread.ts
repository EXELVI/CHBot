import Discord from 'discord.js';
import { connectToDatabase } from '../../db';
import { client } from '../../client';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const data = new Discord.SlashCommandBuilder()
    .setName('createthread')
    .setDescription('Create a thread to talk to the AI')
    .setContexts(Discord.InteractionContextType.Guild)

export async function execute(interaction: Discord.ChatInputCommandInteraction) {
    if (interaction.channel?.isThread()) return interaction.reply({ content: 'You cannot create a thread in a thread.', ephemeral: true });

    let db = await connectToDatabase();
    interaction.deferReply({ ephemeral: true }).then(async () => {
        client.channels.fetch(interaction.channelId).then(async (channel) => {
            if (!channel) return interaction.editReply({ content: 'Channel not found.' });
            if (channel.type != Discord.ChannelType.GuildText) return interaction.editReply({ content: 'You can only create a thread in a guild text channel.' });

            channel.threads.create({
                name: interaction.user.username,
                autoArchiveDuration: Discord.ThreadAutoArchiveDuration.OneWeek,
                reason: `Thread created by ${interaction.user.tag}`,
                type: Discord.ChannelType.PrivateThread,
            }).then(async (thread) => {
                thread.members.add(interaction.user.id);

                channel.fetchWebhooks().then(async (webhooks) => {

                    let webhook = webhooks.find((webhook) => webhook?.owner?.id === client.user?.id);   

                    if (!webhook) {
                        webhook = await channel.createWebhook({ name: 'Character Webhook' });
                    }

                    db.collection('threads').insertOne({ threadId: thread.id, users: [interaction.user.id], characters: [], webhook: webhook.url }, (err, result) => {                      
                    })
                    interaction.editReply({ content: `Thread created. Click [here](https://discord.com/channels/${interaction.guildId}/${thread.id}) to join.` });

                })
            })
        })
    })
}