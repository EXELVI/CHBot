import Discord from 'discord.js';
import { connectToDatabase } from '../../db';
import { client } from '../../client';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
    cloud_name: process.env.cloudinary_cloud_name, 
    api_key: process.env.cloudinary_api_key, 
    api_secret: process.env.cloudinary_api_secret
});


export const data = new Discord.SlashCommandBuilder()
    .setName('createcharacter')
    .setDescription('Create an AI character')
    .setContexts(Discord.InteractionContextType.Guild)
    .addStringOption((option) => option.setName('name').setDescription('The name of the character').setRequired(true))
    .addStringOption((option) => option.setName('description').setDescription('The description of the character').setRequired(true))
    .addAttachmentOption((option) => option.setName('image').setDescription('The image of the character').setRequired(true))
    .addStringOption((option) => option.setName('persona').setDescription('The persona of the character').setRequired(true))

export async function execute(interaction: Discord.ChatInputCommandInteraction) {
    let db = await connectToDatabase();
    let name = interaction.options.getString('name');
    let image = interaction.options.getAttachment('image');
    let persona = interaction.options.getString('persona');
    let description = interaction.options.getString('description');

    if (!image || !image.url || !name || !persona || !description) {
        interaction.reply({ content: "Invalid parameters", ephemeral: true })
        return
    }

    if (description?.length > 2000) {
        interaction.reply({ content: "Description is too long, max 1000 characters, you entered " + description.length, ephemeral: true })
        return
    }

     

    if (name?.length > 20) {
        interaction.reply({ content: "Character name is too long, max 100 characters, you entered " + name.length, ephemeral: true })
        return
    }
    if (!name.match('^[a-zA-Z0-9_\\-\\s]+$')) {
        interaction.reply({ content: "Character name is invalid, only this pattern is allowed ^[a-zA-Z0-9_-]+$, you entered " + name, ephemeral: true })
        return
    }

    if (persona?.length > 5000) {
        interaction.reply({ content: "Persona is too long, max 1000 characters, you entered " + persona.length, ephemeral: true })
        return
    }

    if (image?.size > 1000000) {
        interaction.reply({ content: "Image is too large", ephemeral: true })
        return
    }

    if (!image?.contentType?.startsWith('image')) {
        interaction.reply({ content: "Invalid image type", ephemeral: true })
        return
    }

    let result = await cloudinary.uploader.upload(image.url, { folder: 'characters', resource_type: 'image' })

    if (!result?.secure_url) {
        interaction.reply({ content: "Error uploading image", ephemeral: true })
        return
    }

    let charId = uuidv4()

    await db.collection('characters').insertOne({ name, persona, owner: interaction.user.id, description, charId, image: result.secure_url })
    interaction.reply({ content: "Character created", ephemeral: true })




}
