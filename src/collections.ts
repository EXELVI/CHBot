interface Command {
    data: Discord.ApplicationCommand;
    execute: (interaction: Discord.CommandInteraction) => Promise<void>;
}

import festa from "fs";
import Discord from "discord.js";
import { client } from "./client";

export const commands: Discord.Collection<string, Command> = new Discord.Collection();
export const cooldowns = new Discord.Collection();

festa.readdirSync(`${__dirname}/commands`).forEach((dir) => {
    const commandsFiles = festa.readdirSync(`${__dirname}/commands/${dir}`).filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
    for (const file of commandsFiles) {
        const command = require(`${__dirname}/commands/${dir}/${file}`);    
        console.log(`✔ Found command: ${command?.data?.name} in ${dir}/${file}`);
        commands.set(command.data.name, command);
    }
});
festa.readdirSync(`${__dirname}/events`).forEach((dir) => {
    const eventsFiles = festa.readdirSync(`${__dirname}/events/${dir}`).filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
    for (const file of eventsFiles) {
        const event = require(`${__dirname}/events/${dir}/${file}`);
        const eventName = file.split(".")[0];        
        client.on(event.name, (...args) => event.execute(...args, client));
    }
});

