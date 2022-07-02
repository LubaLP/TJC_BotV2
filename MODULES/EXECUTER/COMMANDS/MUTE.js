var EXECUTER_COMMAND_MUTE = {};
const GLOBAL_DEBUG = require("../../GLOBAL/DEBUG.js")
const EXECUTER_REPLY = require("../REPLY.js")
const GLOBAL_SQL = require("../../GLOBAL/SQL.js")
const GLOBAL_CASEID = require("../../GLOBAL/CASEID.js")
const GLOBAL_WEBHOOK = require("../../GLOBAL/WEBHOOKS.js")
const MOMENTJS = require("moment");

EXECUTER_COMMAND_MUTE.command = async function(global, client, SQL, interaction) {

    let zeit = 3600
    let grund = "kein Grund angegeben"
    let location = await client.guilds.cache.get(interaction.guild_id)
    let bereich = "Server"

    for (let i = 0; i < interaction.data.options.length; i++) {
        switch (interaction.data.options[i].name) {
            case "grund":
                grund = interaction.data.options[i].value
                break

            case "zeit":
                zeit = interaction.data.options[i].value
                break

            case "ort":
                switch (interaction.data.options[i].value.toString().toLowerCase()) {
                    case "global":
                        bereich = "Global"
                        break

                    case "projekte":
                        bereich = "Projekte"
                        break

                    default:
                        bereich = "Server"
                        break
                }
        }
    }

     if (global.mutes[interaction.data.options[0].value] != null) {
         if (global.mutes[interaction.data.options[0].value]["servers"].includes(interaction.guild_id)) {
             EXECUTER_REPLY.go(
                 client,
                 interaction,
                 "",
                 [{
                     "title": "User bereits gemuted",
                     "color": global.colors.red,
                     "description": "Der User <@!" + interaction.data.options[0].value + "> wurde bereits gemuted"
                 }]
             )
             return;
         } else {
             mute(client, global, bereich, location, zeit, grund, interaction, SQL)
         }
     } else {
        mute(client, global, bereich, location, zeit, grund, interaction, SQL)
     }
}

function mute(client, global, bereich, location, zeit, grund, interaction, SQL) {
    // Servermute Rollenvergabe | Give user Servermute Role
    // On Only Server | Nur auf Server
    if (bereich === "Server") {
        let role = client.guilds.cache.get(interaction.guild_id).roles.cache.find(role => role.name.toString().toLowerCase() === "muted")
        location = client.guilds.cache.get(interaction.guild_id)
        client.guilds.cache.get(interaction.guild_id).members.fetch(interaction.data.options[0].value).then(member => {
            member.roles.add(role)
        })
    }
    // For Projekte - Rollen Entzug | Remove User Role
    else if (bereich === "Projekte") {
        location = "projekte"
        let role = client.guilds.cache.get(interaction.guild_id).roles.cache.get(global.config.serverdata.projekterole);
        client.guilds.cache.get(interaction.guild_id).members.fetch(interaction.data.options[0].value).then(member => {
            if (member.roles.cache.find(r => r.id == global.config.serverdata.projekterole)) {
                member.roles.remove(role)
            }
        })
    }
    //Globaler Mute | Global Mute
    else if (bereich === "Global") {
        location = "global"
        //Rollen vergabe auf den Servern | Give User Role on Servers
        client.guilds.cache.forEach(guild => {
            let role = guild.roles.cache.find(role => role.name.toLowerCase() === "muted")
            guild.members.fetch(interaction.data.options[0].value).then(member => {
                member.roles.add(role)
            }).catch()
        })

    }

    // Mute Zeit umrechnung in Sekunden | Convert Mute Time to Seconds
    let end = zeit.toString();

    if (end.toString().endsWith("m")) end = parseInt(end.toString().replace("m", "") * 60);
    else if (end.toString().endsWith("h")) end = parseInt(end.toString().replace("h", "") * 60 * 60);
    else if (end.toString().endsWith("d")) end = parseInt(end.toString().replace("d", "") * 60 * 60 * 24);
    else if (end.toString().endsWith("w")) end = parseInt(end.toString().replace("w", "") * 60 * 60 * 24 * 7);
    else end = parseInt(end * 60 * 60);

    var seq = GLOBAL_CASEID.generate(global)
    var endTimestamp = (Date.now() + 1000 * end)

    // Einträge in die benötigten Datenbank Tabellen eintragen | Insert Entries into Database Tables
    GLOBAL_SQL.execute(SQL, "MUTECOMMAND_INSERT", "INSERT INTO mutes (intern, id, serverid, bereich, duration, timestamp) VALUES (?, ?, ?, ?, ?, ?)", [seq, interaction.data.options[0].value, interaction.guild_id, bereich, end, Date.now()])
    GLOBAL_SQL.execute(SQL, "MUTECOMMAND_CASE_INSERT", "INSERT INTO cases (caseid, user, serverid, type, tags,  reason, moderator, channel, timestamp, endTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [seq, interaction.data.options[0].value, interaction.guild_id, 'mute', bereich, grund, interaction.member.user.id, interaction.channel_id, Date.now(), endTimestamp])

    //Chache den Mute in den globalen Mutes Array | Cache Mute in Global Mutes Array
    let region = interaction.guild_id
    if (bereich.toLowerCase() == "global") region = "global"
    if (global.mutes[interaction.data.options[0].value] != undefined) {
        global.mutes[interaction.data.options[0].value]["servers"].push(JSON.parse(region.toString()))
    } else {
        global.mutes[interaction.data.options[0].value] = JSON.parse("{\"servers\": [\"" + region.toString() + "\"]}")
    }

    //Sende dem User infos per DM | Send User Info per DM
    client.guilds.cache.get(interaction.guild_id).members.fetch(interaction.data.options[0].value).then(user => {
        EXECUTER_REPLY.user(client, user, interaction.member.user, seq, "mute", grund, location, endTimestamp)
    })

    let dauer = "" + MOMENTJS(endTimestamp).format("DD.MM.yyyy [um] HH:mm [Uhr]")
    let dauerInt = MOMENTJS.utc(end*1000).format('[,] HH [Stunde(n) und] mm [Minute(n)]');
    let diffDays = Math.floor(end / (60 * 60 * 24));
    dauerInt = diffDays + " Tag(e) " + dauerInt

    // Antwort an den Moderator | Reply to Moderator
    EXECUTER_REPLY.go(
        client,
        interaction,
        "",
        [{
            "title": "neuer Mute",
            "color": 16711680,
            "description": "Der User <@!" + interaction.data.options[0].value + "> wurde gemuted\nGrund: `" + grund + "`\n" +
                "Dauer: `" + dauerInt + "`\nBereich: `" + bereich + "`"
        }],
        null,
        true
    )

    if (bereich == 'Global') {
        client.guilds.cache.forEach(guild => {
            if (guild.id != interaction.guild_id) {
                GLOBAL_WEBHOOK.go(global.servers[guild.id].logchannel, [
                        {
                            "title": "Ein User wurde gemuted",
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
                                    "name": "Dauer",
                                    "value": dauerInt
                                },
                                {
                                    "name": "Bereich",
                                    "value": location
                                },
                                {
                                    "name": "Server",
                                    "vaule": guild.name + " (" + guild.id + ")"
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
    } else {

        // Log
        GLOBAL_WEBHOOK.go(global.servers[interaction.guild_id].logchannel, [
                {
                    "title": "Ein User wurde gemuted",
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
                            "name": "Dauer",
                            "value": dauerInt
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
    }
}

module.exports = EXECUTER_COMMAND_MUTE