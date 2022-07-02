var EXECUTER_COMMAND_BAN = {};
const GLOBAL_DEBUG = require("../../GLOBAL/DEBUG.js")
const EXECUTER_REPLY = require("../REPLY.js")
const GLOBAL_SQL = require("../../GLOBAL/SQL.js")
const GLOBAL_CASEID = require("../../GLOBAL/CASEID.js")
const GLOBAL_WEBHOOK = require("../../GLOBAL/WEBHOOKS.js")

EXECUTER_COMMAND_BAN.command = async function(global, client, SQL, interaction) {

    let grund = "kein Grund angegeben"
    let bereich = "server"
    let location = await client.guilds.cache.get(interaction.guild_id)
    let deleteMessages = 0

    for (let i = 0; i < interaction.data.options.length; i++) {
        switch (interaction.data.options[i].name) {
            case "grund":
                grund = interaction.data.options[i].value
                break

            case "deletemsg":
                deleteMessages = interaction.data.options[i].value
                break

            case "ort":
                bereich = (interaction.data.options[i].value === "Global") ? "global" : "server"
                location = (interaction.data.options[i].value === "Global") ? "global" : await client.guilds.cache.get(interaction.guild_id)
                break
        }
    }

    // generate CaseID | generiere CaseID
    var seq = await GLOBAL_CASEID.generate(global)

    // Sende dem User infos per DM | send User infos per DM
    await client.guilds.cache.get(interaction.guild_id).members.fetch(interaction.data.options[0].value)
    .then(async user => {
        await EXECUTER_REPLY.user(client, user, interaction.member.user, seq, "ban", grund, location, null)
    }).catch()

    // Ban on only Server | Bann nur auf Server
    if (bereich == "server") {
        client.guilds.cache.get(interaction.guild_id).members.fetch(interaction.data.options[0].value)
        .then(member => {
            member.ban(
                {
                    days: deleteMessages,
                    reason: grund
                }
            )
        }).catch()
    }

    // Globaler Ban | Global Ban
    else if (location === "global") {
        client.guilds.cache.forEach(guild => {
            guild.members.fetch(interaction.data.options[0].value)
            .then(member => {
                if (member != undefined) {
                    member.ban(
                        {
                            days: deleteMessages,
                            reason: grund
                        }
                    ).catch()
                }
            }).catch()
        })

    }

    // Einträge in die benötigte Datenbank Tabelle eintragen | Put entries in the required database table
    GLOBAL_SQL.execute(SQL, "BANCOMMAND_CASE_INSERT", "INSERT INTO cases (caseid, user, serverid, type, tags,  reason, moderator, channel, timestamp, endTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [seq, interaction.data.options[0].value, interaction.guild_id, 'ban', bereich, grund, interaction.member.user.id, interaction.channel_id, Date.now(), '0'])


    // Antwort an den Moderator | Reply to the Moderator
    EXECUTER_REPLY.go(
        client,
        interaction,
        "",
        [{
            "title": "neuer Ban",
            "color": 16711680,
            "description": "Der User <@!" + interaction.data.options[0].value + "> wurde gebannt\nGrund: `" + grund + "`" +
                "\nBereich: `" + bereich + "`\nEs wurden die Nachrichten der letzen `" + deleteMessages + "` Tage gelöscht"
        }],
        null,
        true
    )

    // Log- TEMPORÄR bis Reply an User den Part übernimmt | Log- TEMPORÄR until the Part is taken by the User
    GLOBAL_WEBHOOK.go(global.servers[interaction.guild_id].logchannel, [
            {
                "title": "Ein User wurde gebannt",
                "color": 5242148,
                "fields": [
                    {
                        "name": "User",
                        "value": "<@!" + interaction.data.options[0].value + "> (" + interaction.data.options[0].value + ")"
                    },
                    {
                        "name": "Grund",
                        "value": grund
                    },
                    {
                        "name": "Bereich",
                        "value": bereich
                    },
                    {
                        "name": "Moderator",
                        "value": "<@!" + interaction.member.user.id + "> (" + interaction.member.user.id + ")"
                    }
                ]
            }
        ]
    )
    if (bereich == 'global') {
        client.guilds.cache.forEach(guild => {
            if (guild.id != interaction.guild_id) {
                GLOBAL_WEBHOOK.go(global.servers[guild.id].logchannel, [
                        {
                            "title": "Ein User wurde gebannt",
                            "color": 5242148,
                            "fields": [
                                {
                                    "name": "User",
                                    "value": "<@!" + interaction.data.options[0].value + "> (" + interaction.data.options[0].value + ")"
                                },
                                {
                                    "name": "Grund",
                                    "value": grund
                                },
                                {
                                    "name": "Bereich",
                                    "value": bereich
                                },
                                {
                                    "name": "Server",
                                    "value": client.guilds.cache.get(interaction.guild_id).name + " (" + interaction.guild_id + ")"
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
        })
    }
}

module.exports = EXECUTER_COMMAND_BAN