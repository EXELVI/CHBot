import Discord from 'discord.js';
import { connectToDatabase } from '../../db';

export const data = new Discord.SlashCommandBuilder()
    .setName('editthreadscenario')
    .setDescription('Set the thread scenario for the AI to use.')
    .setContexts(Discord.InteractionContextType.BotDM, Discord.InteractionContextType.Guild, Discord.InteractionContextType.PrivateChannel)
    .setIntegrationTypes([Discord.ApplicationIntegrationType.GuildInstall, Discord.ApplicationIntegrationType.UserInstall])

export async function execute(interaction: Discord.ChatInputCommandInteraction) {

    if (!interaction.channel?.isThread()) return interaction.reply({ content: 'You can only set the scenario in a thread.', ephemeral: true });

    const db = await connectToDatabase();
    const thread = await db.collection('threads').findOne({ threadId: interaction.channelId });
    if (!thread) return interaction.reply({ content: 'Thread not found.', ephemeral: true });


    let scenarioM = new Discord.TextInputBuilder()
        .setMaxLength(1000)
        .setRequired(false)
        .setLabel('Scenario (you have 2 minutes)')
        .setCustomId('scenario')
        .setValue(thread.scenario ? thread.scenario : '')
        .setPlaceholder('Enter the scenario here')
        .setStyle(Discord.TextInputStyle.Paragraph)

    let modal = new Discord.ModalBuilder()
        .setTitle('Edit Scenario')
        .setCustomId('edit_scenario')
        .setComponents([new Discord.ActionRowBuilder<Discord.ModalActionRowComponentBuilder>().addComponents(scenarioM)])

    interaction.showModal(modal);

    interaction.awaitModalSubmit({ time: 120000 }).then(async (modalInteraction) => {
        const scenario = modalInteraction.fields.getTextInputValue('scenario');

        if (scenario) {
            await db.collection('threads').updateOne({ threadId: interaction.channelId }, { $set: { scenario: scenario } })

            modalInteraction.reply({ content: 'The scenario has been set to `' + scenario + '`.', ephemeral: true });
        } else {
            await db.collection('threads').updateOne({ threadId: interaction.channelId }, { $unset: { scenario: '' } })
            modalInteraction.reply({ content: 'The scenario has been removed.', ephemeral: true });
        }
    })

}