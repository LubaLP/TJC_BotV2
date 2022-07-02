var SELECTOR_BUTTONS = {};

const GLOBAL_DEBUG = require("../GLOBAL/DEBUG.js") // Debug System (log)
const EXECUTER_COMMAND_MODLOG = require("../EXECUTER/COMMANDS/MODLOG.js")
const EXECUTER_REPLY = require("../EXECUTER/REPLY.js"); // Reply System (pong)
const GLOBAL_BUTTONS = require("../GLOBAL/BUTTONS.js");
const GLOBAL_CASEID = require("../GLOBAL/CASEID.js");


SELECTOR_BUTTONS.go = async function(global, client, SQL, interaction) {

    // Extract Data | Daten extrahieren
    var guild = await client.guilds.fetch(interaction.guild_id).catch((e) => {GLOBAL_DEBUG.console("warn", "SELECTOR_COMMANDS_FETCH-GUILD", e)});
    var member = await guild.members.fetch(interaction.member.user.id).catch((e) => {GLOBAL_DEBUG.console("warn", "SELECTOR_COMMANDS_FETCH-MEMBER", e)});
    var channel = await client.channels.fetch(interaction.channel_id).catch((e) => {GLOBAL_DEBUG.console("warn", "SELECTOR_COMMANDS_FETCH-CHANNEL", e)});  


    // Check, if Button is in Cache | Prüfen, ob Button in Cache ist
    var exist = (typeof(global.cache.buttons[interaction.data.custom_id.slice(0, 20)]) == "undefined" || typeof(global.cache.buttons[interaction.data.custom_id.slice(0, 20)].info.name) == "undefined") ? false : true 

    // if not, return | wenn nicht, zurück
    if(!exist){
      return;
    }


    // Load Code Data from Cache | Code Daten aus Cache laden
    var cache = GLOBAL_BUTTONS.getcache(global, interaction.data.custom_id.slice(0, 20))
    // Get Button ID | Hole Button ID
    cache.info.selected = interaction.data.custom_id.slice(20)
    // Get Command from Cache | Hole Command aus Cache
    var command = cache.info.name

    // return ACK to User  | ACK an User zurückgeben
    EXECUTER_REPLY.button(client, interaction)

    // Command Selector | Command Selector
    switch(command){

        case "modlogs":
            EXECUTER_COMMAND_MODLOG.button(global, client, SQL, interaction, cache)
            break;


        // output debug error | Debug Error Ausgabe
        default:
            EXECUTER_REPLY.go(client, interaction, cache.info.token, "", [
                {
                  "title": "Die Buttons für diesen Command wurden noch nicht eingerichtet!",
                  "description": "Bitte warte etwas, bis wir alles eingerichtet haben <:HeyGuys:436292955473575996>",
                  "color": 16273745
                }
              ])
            GLOBAL_DEBUG.console("error", "SELECTOR_BUTTONS_UNKNOWN-BUTTON", "INTERACTION OUTPUT:\n" + JSON.stringify(interaction))
    }
}

module.exports = SELECTOR_BUTTONS