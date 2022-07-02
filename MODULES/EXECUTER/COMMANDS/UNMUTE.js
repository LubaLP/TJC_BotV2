let UNMUTE = {}

const GLOBAL_DEBUG = require("../../GLOBAL/DEBUG.js")
const EXECUTER_REPLY = require("../REPLY.js")
const GLOBAL_SQL = require("../../GLOBAL/SQL.js")
const GLOBAL_CASEID = require("../../GLOBAL/CASEID.js")
const GLOBAL_WEBHOOK = require("../../GLOBAL/WEBHOOKS.js")

UNMUTE.command = async function(global, client, SQL, interaction) {
    if (global.mutes[interaction.data.options[0].value] != null) {
        //Get Data from DB |Hole Daten aus der Datenbank
        SQL.execute("SELECT * FROM mutes WHERE id = ? AND serverid = ?", [interaction.data.options[0].value, interaction.guild_id],
            function (err, results, fields) {
            if (!err) {
                if (results.length > 0) {
                    result = results[0]
                    //Regin Bestimmung | Region Bestimmung
                    let location = ""
                    let region = result['serverid']
                    if (result['bereich'] == "global") region = "global"

                    //Rollen verwaltung | Rollenverwaltung
                    if (result['bereich'] === "Server") { // Mutes die nur auf dem Hauptserver sind | Mutes that are only on the main server
                        client.guilds.cache.get(result['serverid']).members.fetch(result['id']).then(member => {
                            member.roles.remove(member.guild.roles.cache.find(role => role.name.toString().toLowerCase() === "muted"))
                            location = member.guild
                        })
                    } else if (result['bereich'] === "Projekte") { // Mutes die nur den Projektechannel betreffen | Mutes that are only on the project channel
                        client.guilds.cache.get(global.config.botconfig.mainserver).members.fetch(result['id']).then(member => {
                            member.roles.add(global.config.serverdata.projekterole)
                            location = "projekte"
                        })
                    } else if (result['bereich'] === "Global") { // Mutes die auf allen TJC-Servern sind | Mutes that are on all TJC-Servers
                        client.guilds.cache.forEach(guild => {
                            let role = guild.roles.cache.find(role => role.name === "muted")
                            guild.members.fetch(result['id']).then(member => {
                                member.roles.remove(role)
                            })
                        })
                    }

                    let reason = (interaction.data.options[1] == null) ? "Kein Grund angegeben" : interaction.data.options[1].value;

                    let seq = GLOBAL_CASEID.generate(global)
                    //Remove from DB | Aus Datenbank entfernen
                    GLOBAL_SQL.execute(SQL, "UNMUTECOMMAND_MUTES_REMOVE", "DELETE FROM mutes WHERE id = ? AND serverid = ?", [interaction.data.options[0].value, interaction.guild_id])
                    GLOBAL_SQL.execute(SQL, "UNMUTECOMMAND_CASE_INSERT", "INSERT INTO cases (caseid, user, serverid, type, tags, reason, moderator, channel, timestamp, endTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [seq, interaction.data.options[0].value, interaction.guild_id, 'unmute', reason, "-", interaction.member.user.id, interaction.channel_id, Date.now(), 0])


                    //Sende dem User infos per DM | Send info to the user via DM
                    client.guilds.cache.get(interaction.guild_id).members.fetch(interaction.data.options[0].value).then(user => {
                        EXECUTER_REPLY.user(client, user, interaction.member.user, seq, "unmute", reason, location, Date.now())
                    })

                    // Antwort an den Moderator | Reply to the Moderator
                    EXECUTER_REPLY.go(
                        client,
                        interaction,
                        "",
                        [{
                            "title": "neuer Unmute",
                            "color": 16711680,
                            "description": "Der User <@!" + interaction.data.options[0].value + "> wurde entmuted\nGrund: `" + reason + "`\n" + "Moderator: <@!" + interaction.member.user.id + ">"
                        }],
                        null,
                        true
                    )

                    //Remove from Cache | Aus Cache entfernen
                    if (global.mutes[interaction.data.options[0].value].servers.includes(result['serverid']) || global.mutes[interaction.data.options[0].value].servers.includes("global")) {
                        let newjson = JSON.parse("[]")
                        global.mutes[interaction.data.options[0].value]["servers"].forEach(entry => {
                            if (entry != region) {
                                newjson.push(JSON.parse(region.toString()))
                            }
                        })
                        global.mutes[interaction.data.options[0].value]["servers"] = newjson
                    }

                    // Log
                    GLOBAL_WEBHOOK.go(global.servers[interaction.guild_id].logchannel, [
                            {
                                "title": "Ein User wurde entmuted",
                                "color": 5242148,
                                "fields": [
                                    {
                                        "name": "User",
                                        "value": "<@!" + interaction.data.options[0].value + "> (" + interaction.data.options[0].value + ")"
                                    },
                                    {
                                        "name": "Grund",
                                        "value": reason
                                    },
                                    {
                                        "name": "Moderator",
                                        "value": "<@!" + interaction.member.user.id + "> (" + interaction.member.user.id + ")"
                                    }
                                ]
                            }
                        ]
                    )
                }
            } else {
                    // Antwort an den Moderator | Reply to the Moderator
                    EXECUTER_REPLY.go(
                        client,
                        interaction,
                        "",
                        [{
                            "title": "Unmute fehlgeschlagen",
                            "color": global.colors.red,
                            "description": "Der User <@!" + interaction.data.options[0].value + "> ist nicht gemuted"
                        }]
                    )
                }
        })

    } else {
        EXECUTER_REPLY.go(
            client,
            interaction,
            "",
            [{
                "title": "Unmute fehlgeschlagen",
                "color": global.colors.red,
                "description": "Der User <@!" + interaction.data.options[0].value + "> ist nicht gemuted"
            }]
        )
    }
}

module.exports = UNMUTE