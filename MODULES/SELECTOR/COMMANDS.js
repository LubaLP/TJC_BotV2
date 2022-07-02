var SELECTOR_COMMANDS = {};

const GLOBAL_DEBUG = require("../GLOBAL/DEBUG.js") // Debug System (log)
const EXECUTER_COMMANDS_CLEAR = require("../EXECUTER/COMMANDS/CLEAR.js") // Command: clear
const EXECUTER_COMMANDS_MUTE = require("../EXECUTER/COMMANDS/MUTE.js") // Command: mute
const EXECUTER_COMMANDS_BAN = require("../EXECUTER/COMMANDS/BAN.js") // Command: ban
const EXECUTER_COMMANDS_MODLOG = require("../EXECUTER/COMMANDS/MODLOG.js") // Command: modlog
const EXECUTER_COMMANDS_WHOIS = require("../EXECUTER/COMMANDS/WHOIS.js") // Command: whois
const EXECUTER_COMMANDS_SETTINGS = require("../EXECUTER/COMMANDS/SETTINGS.js") // Command: settings
const EXECUTER_COMMANDS_ROLE = require("../EXECUTER/COMMANDS/ROLE.js") // Command: role
const EXECUTER_COMMANDS_WARN = require("../EXECUTER/COMMANDS/WARN.js") // Command: warn
const EXECUTER_COMMANDS_UNMUTE = require("../EXECUTER/COMMANDS/UNMUTE.js") // Command: unmute
const EXECUTER_COMMANDS_NOTES = require("../EXECUTER/COMMANDS/NOTES.js") // Command: notes
const EXECUTER_COMMANDS_DEVDEBUG = require("../EXECUTER/COMMANDS/DEVDEBUG.js") // Command: devdebug
const EXECUTER_REPLY = require("../EXECUTER/REPLY.js") // Reply System (pong)


SELECTOR_COMMANDS.go = async function(global, client, SQL, interaction) {

    // Extract Data | Daten extrahieren
    var command = interaction.data.name
    var guild = await client.guilds.fetch(interaction.guild_id).catch((e) => {GLOBAL_DEBUG.console("warn", "SELECTOR_COMMANDS_FETCH-GUILD", e)});
    var member = await guild.members.fetch(interaction.member.user.id).catch((e) => {GLOBAL_DEBUG.console("warn", "SELECTOR_COMMANDS_FETCH-MEMBER", e)});
    var channel = await client.channels.fetch(interaction.channel_id).catch((e) => {GLOBAL_DEBUG.console("warn", "SELECTOR_COMMANDS_FETCH-CHANNEL", e)});  

    // Command Selector | Befehlsauswahl
    switch(command){

        case "mute":
            await EXECUTER_REPLY.pong(client, interaction, true)
            EXECUTER_COMMANDS_MUTE.command(global, client, SQL, interaction)
            break;
        case "clear":
            await EXECUTER_REPLY.pong(client, interaction, true)
            EXECUTER_COMMANDS_CLEAR.command(global, client, SQL, interaction, guild, member, channel)
            break;
        case "ban":
            await EXECUTER_REPLY.pong(client, interaction, true)
            EXECUTER_COMMANDS_BAN.command(global, client, SQL, interaction)
            break;
        case "modlogs":
            await EXECUTER_REPLY.pong(client, interaction, true)
            EXECUTER_COMMANDS_MODLOG.command(global, client, SQL, interaction)
            break;
        case "whois":
            await EXECUTER_REPLY.pong(client, interaction, true)
            EXECUTER_COMMANDS_WHOIS.command(global, client, SQL, interaction)
            break;
        case "settings":
            await EXECUTER_REPLY.pong(client, interaction, true)
            EXECUTER_COMMANDS_SETTINGS.command(global, client, SQL, interaction)
            break;
        case "role":
            await EXECUTER_REPLY.pong(client, interaction, true)
            EXECUTER_COMMANDS_ROLE.command(global, client, SQL, interaction)
            break;
        case "warn":
            await EXECUTER_REPLY.pong(client, interaction, true)
            EXECUTER_COMMANDS_WARN.command(global, client, SQL, interaction)
            break;
        case "unmute":
            await EXECUTER_REPLY.pong(client, interaction, true)
            EXECUTER_COMMANDS_UNMUTE.command(global, client, SQL, interaction)
            break;
        case "notes":
            await EXECUTER_REPLY.pong(client, interaction, true)
            EXECUTER_COMMANDS_NOTES.command(global, client, SQL, interaction)
            break;
        case "devdebug":
            await EXECUTER_REPLY.pong(client, interaction, true)
            EXECUTER_COMMANDS_DEVDEBUG.command(global, client, SQL, interaction)
            break;

    }
}

module.exports = SELECTOR_COMMANDS