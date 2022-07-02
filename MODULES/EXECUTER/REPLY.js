var EXECUTER_REPLY = {};

const GLOBAL_DEBUG = require("../GLOBAL/DEBUG.js") // Debug System (log)
const GLOBAL_THROW = require("../GLOBAL/THROW.js") // Debug System (log)
const moment = require("moment")


const Discord = require("discord.js")

const {
    colors
} = require("../../config.json")

/**
 * @param {boolean} isprivate
 * 
 */

//Reply to a Slash Command | Antwort auf einen Slash Command
EXECUTER_REPLY.pong = async function(client, interaction, isprivate) {

    // Check, if parameter is specific type | is none => throw error | Gucken, ob Parameter ein bestimmter Typ ist | Wenn nicht => Fehler
    if(typeof(isprivate) != "boolean"){GLOBAL_THROW.go("EXECUTER_REPLY.pong_check_typeof_private", "isprivate (parameter [2]) must be a boolean")}

    // set to ephemeral if true | wenn true => Ephemeral
    var flag = (isprivate === true) ? 64 : 1;

    // send pong | sende Pong
    client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
            type: 5,
            data: {
                flags: flag
            }
        }
        }).catch((e) => {
            var caller_line = e.stack.split("\n")[0];
            GLOBAL_DEBUG.console("error", "EXECUTER_REPLY.pong_send_to_api", caller_line)
        })   
   
}


// ACK for Button Interaction | ACK für Button Interaktion
EXECUTER_REPLY.button = async function(client, interaction) {

    // send pong | sende Pong
    client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
            type: 6
        }
        }).catch((e) => {
            var caller_line = e.stack.split("\n")[0];
            GLOBAL_DEBUG.console("error", "EXECUTER_REPLY.button_send_to_api", caller_line)
        })
}




// Reply to a Slash Command | Antwort auf einen Slash Command
EXECUTER_REPLY.go = async function(client, interaction, plainMSG, embeds, components, publicMSG) {

    // send reply | sende Antwort
        client.api.webhooks(interaction.application_id, interaction.token).messages("@original").patch({
        data: {
            "content": plainMSG,
            "embeds": embeds,
            "components": components
        }
    })

    /*if (publicMSG) {
        let embed = new Discord.MessageEmbed()
            .setDescription("Der User <@!" + interaction.data.options[0].value + "> wurde ge" + interaction.data.name + "t")
            .setColor(colors.red)
            .setTimestamp(new Date())
        client.channels.cache.get(interaction.channel_id).send({content: null, embeds: [embed]})
    }*/
}


// Button Error | Button Fehler
EXECUTER_REPLY.error = async function(client, interaction) {
        // send reply | sende Antwort
        client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
                type: 4,
                data: {
                    flags: 64,
                    content: "",
                    embeds: [
                    {
                      "title": "Diese Interaction ist nicht mehr gültig!",
                      "color": colors.red
                    },          
                  ],
                  components: []
                }
            }
        }).catch((e) => {
            var caller_line = e.stack.split("\n")[0];
            GLOBAL_DEBUG.console("error", "EXECUTER_REPLY.error_send_to_api", caller_line)
        })
    }


// Reply to a Slash Command | Antwort auf einen Slash Command
EXECUTER_REPLY.user = async function(client, user, owner, caseid, type, reason, location, timeend) {

    if(typeof user == "undefined" || !(user.id > 1)){GLOBAL_THROW.go("EXECUTER_REPLY.user_check_exist_user", "user (parameter [1]) not found")}
    if(typeof owner == "undefined" || !(owner.id > 1)){GLOBAL_THROW.go("EXECUTER_REPLY.user_check_exist_owner", "owner (parameter [2]) not found")}
    if(typeof caseid == "undefined" || caseid.length != 9){GLOBAL_THROW.go("EXECUTER_REPLY.user_check_exist_caseid", "caseid (parameter [3]) not found or wrong format")}
    if(typeof type == "undefined" || !(type == "warn" || type == "mute" || type == "ban" || type == "unmute")){GLOBAL_THROW.go("EXECUTER_REPLY.user_check_type", "type (parameter [4]) must be 'warn', 'mute', 'unmute' or 'ban'")}
    if(typeof reason == "undefined"){GLOBAL_THROW.go("EXECUTER_REPLY.user_check_reason", "reason (parameter [5]) not found")}
    if((type == "mute" || type == "ban") && (typeof location == "undefined" || !(location.id > 1000 || location == "global" || location == "projekte"))){GLOBAL_THROW.go("EXECUTER_REPLY.user_check_location", "location (parameter [6]) must be guild Object, 'global' or 'projekte' for mute & ban")}
    if(type == "mute" && (typeof timeend == "undefined" || !(timeend > 1000))){GLOBAL_THROW.go("EXECUTER_REPLY.user_check_timeend", "timeend (parameter [7]) not found for mute")}


    // send dm to user | sende dm an user
    user.createDM()
    .then((dmchannel) => {

        switch(type){
            case "warn":
                dmchannel.send({content: null, embeds: [{
                        "title": "· WARN ·",
                        "description": "**Du wurdest im TJC-Netzwerk verwarnt!**",
                        "color": colors.yellow,
                        "fields": [
                          {
                            "name": "Grund:",
                            "value": reason
                          },
                          {
                            "name": "Wie kann ich in Zukunft Verwarnungen vermeiden?",
                            "value": "Beachte die Regeln des Servers und die der Channels. Vermeide Spamen und unangebrachtes Verhalten im Chat und im Talk. Nehme dir den Grund des Moderators zu Herzen. \nWenn du denkst, dass dieser Warn ein Fehler ist, melde dich im Support"
                          }
                        ],
                        "footer": {
                          "text": `Erstellt von ${owner.username}#${owner.discriminator} • CaseID ${caseid}`
                        },
                        "timestamp": Date.now()
                      }]})
                .catch((e) => {
                    var caller_line = e.stack.split("\n")[0];
                    GLOBAL_DEBUG.console("warn", "EXECUTER_REPLY.user_sendMSG_warn", caller_line)
                })
                break;


            case "mute":
                if(location.id > 1){
                    location = `**Du wurdest auf dem Server "${location.name}" gemutet!**`
                } else if (location == "global"){
                    location = "**Du wurdest im TJC-Netzwerk gemutet!**"
                } else if (location == "projekte"){
                    location = "**Du wurdest im Projekte-Kanal gemutet!**"
                }

                date = new Date(timeend),
                datevalues = [
                    date.getFullYear(),
                    date.getMonth()+1,
                    date.getDate(),
                    date.getHours(),
                    date.getMinutes(),
                    date.getSeconds(),
                ]

                dmchannel.send({content: null, embeds: [{
                        "title": "· MUTE ·",
                        "description": location,
                        "color": colors.orange,
                        "fields": [
                          {
                            "name": "Grund:",
                            "value": reason
                          },
                          {
                            "name": "Ende des Mutes:",
                            "value": moment(date.getTime()).format("DD.MM.yyyy [um] HH:mm [Uhr]")
                          },
                          {
                            "name": "Wie kann ich in Zukunft Mutes vermeiden?",
                            "value": "Beachte die Regeln des Servers und die der Channels. Vermeide Spamen und unangebrachtes Verhalten im Chat und im Talk. Nehme dir den Grund des Moderators zu Herzen. \nWenn du denkst, dass dieser Mute ein Fehler ist, melde dich im Support"
                          }
                        ],
                        "footer": {
                          "text": `Erstellt von ${owner.username}#${owner.discriminator} • CaseID ${caseid}`
                        },
                        "timestamp": Date.now()
                      }]})
                .catch((e) => {
                    var caller_line = e.stack.split("\n")[0];
                    GLOBAL_DEBUG.console("warn", "EXECUTER_REPLY.user_sendMSG_mute", caller_line)
                })
                break;

            case "unmute":
                if(location.id > 1){
                    location = `**Du wurdest auf dem Server "${location.name}" entmuted!**`
                } else if (location == "global"){
                    location = "**Du wurdest im TJC-Netzwerk entmutet!**"
                } else if (location == "projekte"){
                    location = "**Du wurdest im Projekte-Kanal entmutet!**"
                }

                dmchannel.send({content: null, embeds: [{
                        "title": "· UNMUTE ·",
                        "description": location,
                        "color": colors.green,
                        "fields": [
                            {
                                "name": "Grund:",
                                "value": reason
                            },
                            {
                                "name": "Wie kann ich in Zukunft Mutes vermeiden?",
                                "value": "Beachte die Regeln des Servers und die der Channels. Vermeide Spamen und unangebrachtes Verhalten im Chat und im Talk. Nehme dir den Grund des Moderators zu Herzen. \nWenn du denkst, dass dieser Mute ein Fehler ist, melde dich im Support"
                            }
                        ],
                        "footer": {
                            "text": `Erstellt von ${owner.username}#${owner.discriminator} • CaseID ${caseid}`
                        },
                        "timestamp": Date.now()
                    }]})
                    .catch((e) => {
                        var caller_line = e.stack.split("\n")[0];
                        GLOBAL_DEBUG.console("warn", "EXECUTER_REPLY.user_sendMSG_unmute", caller_line)
                    })
                break;
         
                
            case "ban":
                if(location.id > 1){
                    location = `**Du wurdest von dem Server "${location.name}" gebannt!**`
                } else if (location == "global"){
                    location = "**Du wurdest vom TJC-Netzwerk gebannt!**"
                } else if (location == "projekte"){
                    GLOBAL_THROW.go("EXECUTER_REPLY.user_check_location", "location (parameter [6]) must be guild Object or 'global' for ban")
                }

                dmchannel.send({content: null, embeds: [{
                        "title": "· BAN ·",
                        "description": location,
                        "color": colors.red,
                        "fields": [
                          {
                            "name": "Grund:",
                            "value": reason
                          },
                          {
                            "name": "Ich wurde zu unrecht gebannt!",
                            "value": "Wenn du der Meinung bist, dass der Ban ein Fehler ist, melde dich bitte hier: http://bit.ly/2WfBDAG"
                          }
                        ],
                        "footer": {
                            "text": `Erstellt von ${owner.username}#${owner.discriminator} • CaseID ${caseid}`
                          },
                          "timestamp": Date.now()
                        }]})
                .catch((e) => {
                    var caller_line = e.stack.split("\n")[0];
                    GLOBAL_DEBUG.console("warn", "EXECUTER_REPLY.user_sendMSG_ban", caller_line)
                })
                break;
      
        }
    })
    .catch((e) => {
        var caller_line = e.stack.split("\n")[0];
        GLOBAL_DEBUG.console("warn", "EXECUTER_REPLY.user_createDM", caller_line)
    })
}

module.exports = EXECUTER_REPLY