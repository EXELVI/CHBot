import Discord from 'discord.js';
import { connectToDatabase } from '../../db';
import { client } from '../../client';

export const data = new Discord.SlashCommandBuilder()
    .setName('searchcharacter')
    .setDescription('Search for a character to add to the thread')
    .setContexts(Discord.InteractionContextType.Guild)
    .addStringOption((option) => option.setName('query').setDescription('A query to search for a character').setRequired(true))
    .addStringOption((option) => option.setName('based').setDescription('Should be based on the name, description, persona, both name and description, or everything').addChoices([
        { name: "Name", value: "name" },
        { name: "Description", value: "description" },
        { name: "Persona", value: "persona" },
        { name: "Name and Description", value: "name_description" },
        { name: "Everything", value: "everything" }
    ]).setRequired(false));

export async function execute(interaction: Discord.ChatInputCommandInteraction) {
    const db = await connectToDatabase();

    let thread = await db.collection('threads').findOne({ threadId: interaction.channelId });

    const query = interaction.options.getString('query') as string;
    const based = interaction.options.getString('based');

    let emojipiu = '❌';
    let emojimeno = '✅';

    let description = false;
    let name = false; 
    let persona = false;

    let filter: any = {};
    if (query != "*") {

        if (based) {
            switch (based) {
                case "name":
                    filter = { name: { $regex: new RegExp(query, 'i') } };
                    name = true;
                    break;
                case "description":
                    filter = { description: { $regex: new RegExp(query, 'i') } };
                    description = true;
                    break;
                case "persona":
                    filter = { persona: { $regex: new RegExp(query, 'i') } };
                    persona = true;
                    break;
                case "name_description":
                    filter = { $or: [{ name: { $regex: new RegExp(query, 'i') } }, { description: { $regex: new RegExp(query, 'i') } }] };
                    name = true;
                    description = true;
                    break;
                case "everything":
                    filter = { $or: [{ name: { $regex: new RegExp(query, 'i') } }, { description: { $regex: new RegExp(query, 'i') } }, { persona: { $regex: new RegExp(query, 'i') } }] };
                    name = true;
                    description = true;
                    persona = true;
                    break;
            }
        } else {
            filter = { $or: [{ name: { $regex: new RegExp(query, 'i') } }, { description: { $regex: new RegExp(query, 'i') } }, { persona: { $regex: new RegExp(query, 'i') } }] };
            name = true;
            description = true;
            persona = true;
        }
    } else {
        filter = {};
    }



    let characters = await db.collection('characters').find(filter).toArray();

    if (characters.length === 0) {
        await interaction.reply({ content: `No characters found for the query: "${query}"`, ephemeral: true });
        return;
    }

    const pages: { embeds: Array<Discord.EmbedBuilder>, components: Array<Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>> }[] = [];



    for (let i = 0; i < characters.length; i += 25) {
        const page = characters.slice(i, i + 25);
        const embed = new Discord.EmbedBuilder()
            .setTitle(`Search Results for "${query}"`)
            .setDescription(`Page ${pages.length + 1} of ${Math.ceil(characters.length / 25)}`)
            .setColor('#0099ff')
            .setTimestamp()
            .addFields(page.map((character) => ({
                name: character.name.length > 50 ? character.name.slice(0, 50) + "..." : character.name,
                value: (description ? (character.description.length > 50 ? character.description.replace(new RegExp(query, 'gi'), `**${query}**`).slice(0, 50) + "..." : character.description.replace(new RegExp(query, 'gi'), `**${query}**`)) : (character.description.length > 50 ? character.description.slice(0, 50) + "..." : character.description)),
                inline: false
            })));

        const menu = new Discord.StringSelectMenuBuilder()
            .setCustomId(`searchcharacter_menu_${pages.length}`)
            .setPlaceholder('Select a character')
            .addOptions(page.map((character) => ({
                label: character.name,
                emoji: thread ? (thread.characters.find((c: any) => c.id === character.charId) ? emojimeno : emojipiu) : 'ℹ',
                description: (character.description.length > 50 ? character.description.slice(0, 50) + "..." : character.description),
                value: character.charId
            })));

        const buttonNext = new Discord.ButtonBuilder()
            .setCustomId(`searchcharacter_next_${pages.length}`)
            .setLabel('Next')
            .setStyle(Discord.ButtonStyle.Primary)
            .setDisabled(i + 25 >= characters.length);

        const buttonPrevious = new Discord.ButtonBuilder()
            .setCustomId(`searchcharacter_previous_${pages.length}`)
            .setLabel('Previous')
            .setStyle(Discord.ButtonStyle.Primary)
            .setDisabled(i === 0);

        const row = new Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>()
            .addComponents(menu);

        const navigationRow = new Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>()
            .addComponents(buttonPrevious, buttonNext);

        pages.push({ embeds: [embed], components: [row, navigationRow] });
    }

    let currentPage = 0;
    const message = await interaction.reply({
        ...pages[currentPage],
        fetchReply: true,
        ephemeral: true
    });

    const collector = message.createMessageComponentCollector({
        time: 60000
    });
    let selectedCharacter: any;

    collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
            await i.reply({ content: "You cannot interact with this menu.", ephemeral: true });
            return;
        }

        if (i.isButton()) {
            if (i.customId.startsWith('searchcharacter_next')) {
                currentPage++;
            } else if (i.customId.startsWith('searchcharacter_previous')) {
                currentPage--;
            }

            if (i.customId != 'searchcharacter_edit') await i.update(pages[currentPage]);

            if (i.customId.startsWith('searchcharacter_add')) {
                if (!thread) return;
                if (!selectedCharacter) return;
                let threadDb = await db.collection('threads').findOne({ threadId: interaction.channelId });
                if (!threadDb) return;
                if (threadDb.characters.find((c: any) => c.id === selectedCharacter.charId)) {
                    await i.followUp({ content: `❌ \`${selectedCharacter.name}\` is already in the thread.`, ephemeral: true });
                    return;
                }
                await db.collection('threads').updateOne({ threadId: interaction.channelId }, { $push: { characters: { name: selectedCharacter.name, id: selectedCharacter.charId } } });
                await i.followUp({ content: `✅ Added \`${selectedCharacter.name}\` to the thread.`, ephemeral: true });

                thread = await db.collection('threads').findOne({ threadId: interaction.channelId });
                if (!thread) return;
                characters = await db.collection('characters').find(filter).toArray();

                const menu = new Discord.StringSelectMenuBuilder()
                    .setCustomId(`searchcharacter_menu_${pages.length}`)
                    .setPlaceholder('Select a character')
                    .addOptions(characters.slice(currentPage * 25, currentPage * 25 + 25).map((character) => ({
                        label: character.name,
                        emoji: thread ? (thread.characters.find((c: any) => c.id === character.charId) ? emojimeno : emojipiu) : 'ℹ',
                        description: (character.description.length > 50 ? character.description.slice(0, 50) + "..." : character.description),
                        value: character.charId
                    })));

                pages[currentPage].components[0].components[0] = menu;
                await interaction.editReply(pages[currentPage]);



            } else if (i.customId.startsWith('searchcharacter_remove')) {
                if (!thread) return;
                if (!selectedCharacter) return;
                let threadDb = await db.collection('threads').findOne({ threadId: interaction.channelId });
                if (!threadDb) return;
                if (!threadDb.characters.find((c: any) => c.id === selectedCharacter.charId)) {
                    await i.followUp({ content: `❌ \`${selectedCharacter.name}\` is not in the thread.`, ephemeral: true });
                    return;
                }
                await db.collection('threads').updateOne({ threadId: interaction.channelId }, { $pull: { characters: { id: selectedCharacter.charId } } });
                await i.followUp({ content: `✅ Removed \`${selectedCharacter.name}\` from the thread.`, ephemeral: true });

                thread = await db.collection('threads').findOne({ threadId: interaction.channelId });
                if (!thread) return;
                characters = await db.collection('characters').find(filter).toArray();

                const menu = new Discord.StringSelectMenuBuilder()
                    .setCustomId(`searchcharacter_menu_${pages.length}`)
                    .setPlaceholder('Select a character')
                    .addOptions(characters.slice(currentPage * 25, currentPage * 25 + 25).map((character) => ({
                        label: character.name,
                        emoji: thread ? (thread.characters.find((c: any) => c.id === character.charId) ? emojimeno : emojipiu) : 'ℹ',
                        description: (character.description.length > 50 ? character.description.slice(0, 50) + "..." : character.description),
                        value: character.charId
                    })));

                pages[currentPage].components[0].components[0] = menu;
                await interaction.editReply(pages[currentPage]);
            } else if (i.customId.startsWith('searchcharacter_delete')) {
             
                if (!selectedCharacter) return;
                if (interaction.user.id !== selectedCharacter.owner) {
                    await i.followUp({ content: "You do not have permission to delete this character.", ephemeral: true });
                    return;
                }
                await db.collection('characters').deleteOne({ charId: selectedCharacter.charId });
                await i.followUp({ content: `✅ Deleted \`${selectedCharacter.name}\`.`, ephemeral: true });

                if (thread) {
                    thread = await db.collection('threads').findOne({ threadId: interaction.channelId });
                    if (!thread) return;
                }

                characters = await db.collection('characters').find(filter).toArray();

                const menu = new Discord.StringSelectMenuBuilder()
                    .setCustomId(`searchcharacter_menu_${pages.length}`)
                    .setPlaceholder('Select a character')
                    .addOptions(characters.slice(currentPage * 25, currentPage * 25 + 25).map((character) => ({
                        label: character.name,
                        emoji: thread ? (thread.characters.find((c: any) => c.id === character.charId) ? emojimeno : emojipiu) : 'ℹ',
                        description: (character.description.length > 50 ? character.description.slice(0, 50) + "..." : character.description),
                        value: character.charId
                    })));

                pages[currentPage].components[0].components[0] = menu;
                
                const embed = new Discord.EmbedBuilder()
                    .setTitle(`Search Results for "${query}"`)
                    .setDescription(`Page ${pages.length + 1} of ${Math.ceil(characters.length / 25)}`)
                    .setColor('#0099ff')
                    .setTimestamp()
                    .addFields(characters.slice(currentPage * 25, currentPage * 25 + 25).map((character) => ({
                        name:  character.name.length > 50 ? character.name.slice(0, 50) + "..." : character.name,
                        value: (description ? (character.description.length > 50 ? character.description.replace(new RegExp(query, 'gi'), `**${query}**`).slice(0, 50) + "..." : character.description.replace(new RegExp(query, 'gi'), `**${query}**`)) : (character.description.length > 50 ? character.description.slice(0, 50) + "..." : character.description)),
                        inline: false
                    })));

                pages[currentPage].embeds[0] = embed;

                await interaction.editReply(pages[currentPage]);

            } else if (i.customId.startsWith('searchcharacter_edit')) {
                if (!selectedCharacter) return;
                if (interaction.user.id !== selectedCharacter.owner) {
                    await i.reply({ content: "You do not have permission to edit this character.", ephemeral: true });
                    return;
                }

                const name = new Discord.TextInputBuilder()
                    .setStyle(Discord.TextInputStyle.Short)
                    .setMaxLength(20)
                    .setMinLength(1)
                    .setRequired(true)
                    .setPlaceholder('Character Name')
                    .setCustomId('searchcharacter_edit_name')
                    .setValue(selectedCharacter.name)
                    .setLabel('Name')

                const description = new Discord.TextInputBuilder()
                    .setStyle(Discord.TextInputStyle.Paragraph)
                    .setMaxLength(2000)
                    .setMinLength(1)
                    .setRequired(true)
                    .setPlaceholder('Character Description')
                    .setCustomId('searchcharacter_edit_description')
                    .setValue(selectedCharacter.description)
                    .setLabel('Description')

                const persona = new Discord.TextInputBuilder()
                    .setStyle(Discord.TextInputStyle.Paragraph)
                    .setMaxLength(4000)
                    .setMinLength(1)
                    .setRequired(true)
                    .setCustomId('searchcharacter_edit_persona')
                    .setPlaceholder('Character Persona')
                    .setValue(selectedCharacter.persona)
                    .setLabel('Persona')

                const modal = new Discord.ModalBuilder()
                    .setTitle('Edit Character (you have 2 minutes)')
                    .setCustomId('searchcharacter_edit_modal')
                    .setComponents([new Discord.ActionRowBuilder<Discord.ModalActionRowComponentBuilder>().addComponents(name), new Discord.ActionRowBuilder<Discord.ModalActionRowComponentBuilder>().addComponents(description), new Discord.ActionRowBuilder<Discord.ModalActionRowComponentBuilder>().addComponents(persona)])

                i.showModal(modal)

                i.awaitModalSubmit({ time: 120000 }).then(async (m) => {
                    let name = m.fields.getTextInputValue('searchcharacter_edit_name')
                    let description = m.fields.getTextInputValue('searchcharacter_edit_description')
                    let persona = m.fields.getTextInputValue('searchcharacter_edit_persona')

                    if (!name || !description || !persona) {
                        await m.reply({ content: "Invalid parameters", ephemeral: true })
                        return
                    }

                    if (description.length > 2000) {
                        await m.reply({ content: "Description is too long, max 2000 characters, you entered " + description.length, ephemeral: true })
                        return
                    }

                    if (name.length > 20) {
                        await m.reply({ content: "Character name is too long, max 20 characters, you entered " + name.length, ephemeral: true })
                        return
                    }

                    if (!name.match('^[a-zA-Z0-9_\\-\\s]+$')) {
                        await m.reply({ content: "Character name is invalid, only this pattern is allowed ^[a-zA-Z0-9_-]+$, you entered " + name, ephemeral: true })
                        return
                    }

                    if (persona.length > 5000) {
                        await m.reply({ content: "Persona is too long, max 5000 characters, you entered " + persona.length, ephemeral: true })
                        return
                    }

                    if (selectedCharacter.name === name && selectedCharacter.description === description && selectedCharacter.persona === persona) {
                        await m.reply({ content: "No changes detected.", ephemeral: true })
                        return
                    }

                    if (selectedCharacter.owner !== interaction.user.id) {
                        await m.reply({ content: "You do not have permission to edit this character.", ephemeral: true })
                        return
                    }

                    await db.collection('characters').updateOne({ charId: selectedCharacter.charId }, { $set: { name, description, persona } });

                    await m.reply({ content: "Character updated", ephemeral: true })

                    if (thread) {
                        thread = await db.collection('threads').findOne({ threadId: interaction.channelId });
                        if (!thread) return;
                    }

                    characters = await db.collection('characters').find(filter).toArray();

                    const menu = new Discord.StringSelectMenuBuilder()
                        .setCustomId(`searchcharacter_menu_${pages.length}`)
                        .setPlaceholder('Select a character')
                        .addOptions(characters.slice(currentPage * 25, currentPage * 25 + 25).map((character) => ({
                            label: character.name,
                            emoji: thread ? (thread.characters.find((c: any) => c.id === character.charId) ? emojimeno : emojipiu) : 'ℹ',
                            description: (character.description.length > 50 ? character.description.slice(0, 50) + "..." : character.description),
                            value: character.charId
                        })));

                    pages[currentPage].components[0].components[0] = menu;

                    const embed = new Discord.EmbedBuilder()
                        .setTitle(`Search Results for "${query}"`)
                        .setDescription(`Page ${pages.length + 1} of ${Math.ceil(characters.length / 25)}`)
                        .setColor('#0099ff')
                        .setTimestamp()
                        .addFields(characters.slice(currentPage * 25, currentPage * 25 + 25).map((character) => ({
                            name: character.name,
                            value: (character.description.length > 50 ? character.description.slice(0, 50) + "..." : character.description),
                            inline: false
                        })));

                    pages[currentPage].embeds[0] = embed;

                    await interaction.editReply(pages[currentPage]);

                })


            }
        }

        if (!i.isStringSelectMenu()) return;
        let values = i.values[0]
        let character = characters.find((c) => c.charId === values);
        if (!character) return;
        selectedCharacter = character;

        let embedd = new Discord.EmbedBuilder()
            .setTitle(character.name)
            .setDescription((description ? character.description.replace(new RegExp(query, 'gi'), `**${query}**`).slice(0, 2048) : character.description.slice(0, 2048)))
            .addFields({ name: 'Persona', value: (persona ? character.persona.replace(new RegExp(query, 'gi'), `**${query}**`).slice(0, 1024) : character.persona.slice(0, 1024)) })
            .setColor('#0099ff')
            .setThumbnail(character.image)
            .setTimestamp()

        let buttonBack = new Discord.ButtonBuilder()
            .setCustomId(`searchcharacter_back`)
            .setLabel('Back')
            .setStyle(Discord.ButtonStyle.Primary)
            .setEmoji("⬅")

        let buttonAdd = new Discord.ButtonBuilder()
            .setCustomId(`searchcharacter_add`)
            .setLabel('Add')
            .setStyle(Discord.ButtonStyle.Primary)
            .setEmoji("➕")

        let buttonRemove = new Discord.ButtonBuilder()
            .setCustomId(`searchcharacter_remove`)
            .setLabel('Remove')
            .setStyle(Discord.ButtonStyle.Primary)
            .setEmoji("➖")

        let buttonEdit = new Discord.ButtonBuilder()
            .setCustomId(`searchcharacter_edit`)
            .setLabel('Edit')
            .setStyle(Discord.ButtonStyle.Primary)
            .setEmoji("✏")

        let buttonDelete = new Discord.ButtonBuilder()
            .setCustomId(`searchcharacter_delete`)
            .setLabel('Delete')
            .setStyle(Discord.ButtonStyle.Danger)
            .setEmoji("🗑")

            let row = new Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>()
            .addComponents(buttonBack)

        if (thread) {
            if (thread.characters.find((c: any) => c.id === character.charId)) {
                row.addComponents(buttonRemove)
            }
            else {
                row.addComponents(buttonAdd)
            }
        }

        if (interaction.user.id === character.owner) {
            row.addComponents(buttonEdit, buttonDelete)
            embedd.addFields({ name: 'Owner', value: `<@${character.owner}>` }, { name: 'ID', value: "```" + character.charId + "```" })
        }

        await i.update({ embeds: [embedd], components: [row] });

    });

    collector.on('end', async () => {
        if (message.editable) {
            await message.edit({ content: 'This interaction has ended.', components: [] });
        }
    });
}
