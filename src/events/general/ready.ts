import Discord from 'discord.js';
import { discordTimestamps } from 'exelvi';
import chalk from "chalk";
import { commands } from '../../collections';
import { MongoClient } from 'mongodb';
import { connectToDatabase } from '../../db';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const asciiArt = [
    "8888888                   d8b      888            ",
    "  888                     Y8P      888            ",
    "  888                              888            ",
    "  888   88888b.  .d8888b  888  .d88888  .d88b.    ",
    "  888   888 \"88b 88K      888 d88\" 888 d8P  Y8b   ",
    "  888   888  888 \"Y8888b. 888 888  888 88888888   ",
    "  888   888  888      X88 888 Y88b 888 Y8b.       ",
    "8888888 888  888  88888P' 888  \"Y88888  \"Y8888    ",
];


const asciiArtDev = [
    ".:::::::::::::::::::::::::::::::::::::::::::.",
    ":::::::::*@@@@@%*-::=@@@@@+-%@+:::+@%::::::::",
    ":::::::::*@%::-*@@=:=@%:::::+@@-:-@@=::::::::",
    ":::::::::*@%::::%@*:=@@%%%-::#@*:*@*:::::::::",
    ":::::::::*@%:::+@@=:=@%---:::-@@+@%::::::::::",
    ":::::::::*@@##@@#=::=@@###+:::+@@@=::::::::::",
    ":::::::::-====-:::::-=====-::::==-:::::::::::",
    ".:::::::::::::::::::::::::::::::::::::::::::.",
];
function fadeColors(colors: string[]) {
    const startColor = [0, 0, 255];  // Blu
    const endColor = [255, 0, 0];  // Rosso

    const startColorDev = [0, 0, 255];  // Blu
    const endColorDev = [0, 255, 0];  // Rosso


    const colorSteps = colors.length - 1;
    const colorStepsDev = asciiArtDev.length - 1;

    const colorFade: number[][] = [];
    const colorFadeDev: number[][] = [];
    for (let i = 0; i <= colorSteps; i++) {
        const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * (i / colorSteps));
        const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * (i / colorSteps));
        const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * (i / colorSteps));
        colorFade.push([r, g, b]);

        const rDev = Math.round(startColorDev[0] + (endColorDev[0] - startColorDev[0]) * (i / colorStepsDev));
        const gDev = Math.round(startColorDev[1] + (endColorDev[1] - startColorDev[1]) * (i / colorStepsDev));
        const bDev = Math.round(startColorDev[2] + (endColorDev[2] - startColorDev[2]) * (i / colorStepsDev));
        colorFadeDev.push([rDev, gDev, bDev]);
    }

    for (let i = 0; i < colorFade.length; i++) {
        const color = colorFade[i];
        const colorDev = colorFadeDev[i];
        console.log(chalk.rgb(color[0], color[1], color[2])(colors[i]) + (process.env?.runningInDev ? chalk.rgb(colorDev[0], colorDev[1], colorDev[2])(asciiArtDev[i]) : ""))
    }
}

export const name = `ready`;
export const execute = async function (client: Discord.Client) {
    console.log(chalk.green("Bot is ready!"));
    fadeColors(asciiArt);
    console.log(chalk.red(`By EXELVI   
             
User: ${client.user?.tag}
      
        `))

    var embed = new Discord.EmbedBuilder()
        .setTitle("🟢 Bot ONLINE 🟢")
        .setColor("#3ebd45")
        .addFields({ name: ":alarm_clock: Time", value: discordTimestamps.fromDate(new Date().getTime(), "RELATIVE") })

    client.users.cache.get("462339171537780737")?.send({ embeds: [embed] }).then(msg => {

        if (!process.env?.runningInDev) {
            setTimeout(() => {
                msg.delete()
            }, 5000)
        }
    })



    var db = await connectToDatabase()
    if (process.env.commands != "false") {

        const globalCommands: Array<Discord.ApplicationCommand> = []

        console.log("Starting commands creation!")
        let guildCommands: Array<Discord.ApplicationCommand> = []

        //await client.application.commands.fetch()
        //    .then(commands => {
        //        commands.forEach(command => {
        //            if (!client.commands.get(command.name)) {
        //                command.delete()
        //            } else {
        //                if (command.type == 2) return
        //                var arrayprincipale = client.commands.get(command.name)?.options
        //                if (!arrayprincipale) arrayprincipale = []
        //                var differenze = findDifferences(arrayprincipale, command.options)
        //                console.log(command.name, differenze.length)
        //                if (differenze.length == 0) guildCommands.push(command)
        //                else console.log("------------------------------------- " + command.name + " -------------------------------------\n", differenze)
        //            }
        //        })
        //    })
        await commands
            .forEach(async command => {
                if (!guildCommands.find(x => x.name == command.data.name)) {
                    globalCommands.push(command.data)
                }
            })

        if (!process.env.token && !process.env.devToken) {
            throw new Error("Discord token is not defined in environment variables.");
        }
        const token = process?.env?.runningInDev ? process.env.devToken : process.env.token;
        if (!token) {
            throw new Error("Discord token is not defined in environment variables.");
        }
        const rest = new Discord.REST().setToken(token);

        console.log(`Started refreshing ${globalCommands.length} application (/) commands.`);

        if (!client.user?.id) {
            throw new Error("Client user ID is undefined.");
        }


        const data: any = await rest.put(
            Discord.Routes.applicationCommands(client.user.id),
            { body: globalCommands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);

        console.log("╔════════════════════════ Created ═══════════════════════╗")
        data.forEach(async (cmd: Discord.ApplicationCommand, index) => {
            var cmdDb = await db.collection("commands").findOne({ name: cmd.name })
            if (!cmdDb) {
                db.collection("commands").insertOne({ name: cmd.name, id: cmd.id })
            } else {

                db.collection("commands").updateOne({ name: cmd.name }, { $set: { id: cmd.id } })
            }

    

            console.log("║ " + cmd.name + " ".repeat(55 - cmd.name.length) + "║")

            if (index == data.length - 1) {
                console.log("╚════════════════════════════════════════════════════════╝")
                console.log("Commands created!")
            } else {
                console.log("╠════════════════════════════════════════════════════════╣")
            }

        })



    } else console.log("Commands creation disabled!")


    var activities = [
        "Chat now!",
        "Start with /createthread",
        "Add a character with /searchcharacter",

    ];
    if (process.env?.runningInDev) {
        activities = ["Updating!", "Bot may unstable!"]
        client.user?.setStatus('dnd')
    }



    setInterval(() => {
        const randomIndex = Math.floor(Math.random() * activities.length);
        const newActivity = activities[randomIndex];

        client.user?.setActivity(newActivity);
        client.user?.setPresence({
            activities: [{ name: newActivity, type: Discord.ActivityType.Watching }]
        });
    }, 10000);

}
