import Discord from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();
import { client } from './client';
import { discordTimestamps } from 'exelvi';
import festa from "fs"

import { commands, cooldowns } from './collections';

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    if (interaction.commandName === 'addcharacter') return;
    const command = commands.get(interaction.commandName);
    if (!command) return interaction.reply({ content: 'This command does not exist! \nHow did you even get here? lol', ephemeral: true });   

    if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps: any = cooldowns.get(command.data.name);
    const cooldownAmount = (command.data.options as any)?.cooldown || 0;

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return interaction.reply({ content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.data.name}\` command.`, ephemeral: true });
        }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try {
        command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
})


client.login(process.env.runningInDev ? process.env.devToken : process.env.token);

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});