var EXECUTER_COMMANDS_WHOIS = {};

const EXECUTER_REPLY = require("../REPLY.js") // Reply System (command)
const moment = require('moment')

EXECUTER_COMMANDS_WHOIS.command = async function(global, client, SQL, interaction) {
    // Fetch Member | Fetch Member
    client.guilds.cache.get(interaction.guild_id).members.fetch(interaction.data.options[0].value).then(member => {
        let createdDate = new Date(parseInt(member.user.createdAt.getTime()))
        let joinDate = new Date(parseInt(member.joinedTimestamp))
        let roles = "";
        // Rollen auflistung | Role list
        member.roles.cache.forEach(role => {
            if (role.name !== "@everyone") {
                roles += "<@&" + role.id + "> "
            }
        })
        let activityOut = "keine"
        let customStatus = ""
        let index = 1
        if (member.presence != null) {
            member.presence.activities.forEach(activity => {
                if (activity.type == "CUSTOM") {
                    customStatus = "► Customstatus: `" + ((activity.emoji != null) ? ((activity.emoji.id != undefined) ? ":" : "") + activity.emoji.name.replaceAll("`", "'") + ((activity.emoji.id != undefined) ? ":" : "") : "") + ((activity.state != null) ? ((activity.emoji != null) ? " " : "") + activity.state.replaceAll("`", "'") : "")+ "`\n"
                } else {
                    if (activityOut.startsWith("keine")) activityOut = ""
                    activityOut += "► Activity[" + index + "]: `"
                    index++
                    activityOut += (activity.type == "LISTENING") ? activity.type + " to " : activity.type + " "
                    activityOut += activity.name.replaceAll("`", "'") + "("
                    if (activity.details != null) {
                        activityOut += activity.details.replaceAll("`", "'")
                        if (activity.state != null) {
                            activityOut += " - "
                        }
                    }
                    if (activity.state != null) {
                        activityOut += activity.state.replaceAll("`", "'")
                    }
                    activityOut += ")"
                    if (activityOut.endsWith("()")) activityOut = activityOut.replace("()", "")
                    activityOut += "`\n"
                }
            })

            //Spotify image aus assets -> https://i.scdn.co/image/{id aus largeimage} 
            if (member.presence.activities[0] != null) details = "(" + member.presence.activities[0].details + " - " + member.presence.activities[0].state + ")"
            // Antwort an den Moderator | Reply to the Moderator
            EXECUTER_REPLY.go(
                client,
                interaction,
                "",
                [{
                    "title": "User Info",
                    "color": 16711680,
                    "thumbnail": {
                        url: "https://cdn.discordapp.com/avatars/" + member.user.id + "/" + member.user.avatar
                    },
                    "description": "► Name: <@!" + member.user.id + "> (`" + member.user.id + "`)\n" +
                        "► Nickname: `" + ((member.nickname != null) ? member.nickname.replaceAll("`", "'") : "keinen") + "`\n" +
                        "► Tag: `" + member.user.username.replaceAll("`", "'") + "#" + member.user.discriminator + "`\n" +
                        "► Discord beigetreten: <t:" + parseInt(createdDate.getTime() / 1000) + ">\n" +
                        "► Server beigetreten: <t:" + parseInt(joinDate.getTime() / 1000) + ">\n" +
                        ((activityOut != "keine")? activityOut.slice(0, -1) + "\n" : "") + customStatus +
                        "► Status: `" + member.presence.status + "`\n" +
                        "► Rollen [" + (member.roles.cache.size - 1) + "]: " + roles
                }]
            )
        } else {
            EXECUTER_REPLY.go(
                client,
                interaction,
                "",
                [{
                    "title": "User Info",
                    "color": 16711680,
                    "thumbnail": {
                        url: "https://cdn.discordapp.com/avatars/" + member.user.id + "/" + member.user.avatar
                    },
                    "description": "► Name: <@!" + member.user.id + "> (`" + member.user.id + "`)\n" +
                        "► Nickname: `" + ((member.nickname != null) ? member.nickname.replaceAll("`", "'") : "keinen") + "`\n" +
                        "► Tag: `" + member.user.username.replaceAll("`", "'") + "#" + member.user.discriminator + "`\n" +
                        "► Discord beigetreten: <t:" + parseInt(createdDate.getTime() / 1000) + ">\n" +
                        "► Server beigetreten: <t:" + parseInt(joinDate.getTime() / 1000) + ">\n" +
                        "► Status: `offline`\n" +
                        "► Rollen [" + (member.roles.cache.size - 1) + "]: " + roles
                }]
            )
        }

    }).catch(
        EXECUTER_REPLY.go(
            client,
            interaction,
            "",
            [{
                "color": 16711680,
                "thumbnail": {
                    url: "https://lubalp.eu/discord/avatars/4.png"
                },
                "description": "**User nicht gefunden!**"
            }]
        )
    )
}


module.exports = EXECUTER_COMMANDS_WHOIS