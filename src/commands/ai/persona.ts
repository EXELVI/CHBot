import Discord from 'discord.js';
import { connectToDatabase } from '../../db';

export const data = new Discord.SlashCommandBuilder()
    .setName('setpersona')
    .setDescription('Set your persona for the AI to use.')
    .setContexts(Discord.InteractionContextType.BotDM, Discord.InteractionContextType.Guild, Discord.InteractionContextType.PrivateChannel)
    .setIntegrationTypes([Discord.ApplicationIntegrationType.GuildInstall, Discord.ApplicationIntegrationType.UserInstall]);

export async function execute(interaction: Discord.ChatInputCommandInteraction) {
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ id: interaction.user.id });

    let personaInput = new Discord.TextInputBuilder()
        .setMaxLength(1000)
        .setRequired(true)
        .setLabel('Persona (you have 2 minutes)')
        .setCustomId('persona')
        .setValue(user?.persona ? user.persona : '')
        .setPlaceholder('Enter your persona here')
        .setStyle(Discord.TextInputStyle.Paragraph);

    let modal = new Discord.ModalBuilder()
        .setTitle('Set Persona')
        .setCustomId('set_persona')
        .setComponents([new Discord.ActionRowBuilder<Discord.ModalActionRowComponentBuilder>().addComponents(personaInput)]);

    interaction.showModal(modal);

    interaction.awaitModalSubmit({ time: 120001 }).then(async (modalInteraction) => { // 2 minutes + 1 ms = 120001 ms (lol)
        const persona = modalInteraction.fields.getTextInputValue('persona');

        await db.collection('users').updateOne({ id: interaction.user.id }, { $set: { persona } }, { upsert: true });

        modalInteraction.reply({ content: `Your persona has been set to \`${persona}\`.`, ephemeral: true });
    });
}