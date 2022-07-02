var EXECUTER_COMMAND_WARN = {};
const GLOBAL_DEBUG = require("../../GLOBAL/DEBUG.js")
const EXECUTER_REPLY = require("../REPLY.js")
const GLOBAL_SQL = require("../../GLOBAL/SQL.js")
const GLOBAL_CASEID = require("../../GLOBAL/CASEID.js")
const GLOBAL_WEBHOOK = require("../../GLOBAL/WEBHOOKS.js")

EXECUTER_COMMAND_WARN.command = async function(global, client, SQL, interaction) {

    // generate CaseID | generiere CaseID
    var seq = await GLOBAL_CASEID.generate(global)

    // Sende dem User infos per DM | send User infos per DM
    await client.guilds.cache.get(interaction.guild_id).members.fetch(interaction.data.options[0].value)
        .then(async user => {
            await EXECUTER_REPLY.user(client, user, interaction.member.user, seq, "warn", interaction.data.options[1].value, client.guilds.cache.get(interaction.guild_id), null)
        })

    // Einträge in die benötigte Datenbank Tabelle eintragen | Write entries to the required database table
    GLOBAL_SQL.execute(SQL, "WARNCOMMAND_CASE_INSERT", "INSERT INTO cases (caseid, user, serverid, type, tags, reason, moderator, channel, timestamp, endTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [seq, interaction.data.options[0].value, interaction.guild_id, 'warn', 'Server', interaction.data.options[1].value, interaction.member.user.id, interaction.channel_id, Date.now(), '0'])


    // Antwort an den Moderator | Reply to the Moderator
    EXECUTER_REPLY.go(
        client,
        interaction,
        "",
        [{
            "title": "neuer Warn",
            "color": 16711680,
            "description": "Der User <@!" + interaction.data.options[0].value + "> wurde gewarnt\nGrund: `" + interaction.data.options[1].value + "`"
        }],
        null, 
        true
    )

    // Log- TEMPORÄR bis Reply an User den Part übernimmt | Log- TEMPORÄR until the Reply to the User is taken over
    GLOBAL_WEBHOOK.go(global.servers[interaction.guild_id].logchannel, [
            {
                "title": "Ein User wurde gewarnt",
                "color": 5242148,
                "fields": [
                    {
                        "name": "User",
                        "value": "<@!" + interaction.data.options[0].value + "> (" + interaction.data.options[0].value + ")"
                    },
                    {
                        "name": "Grund",
                        "value": interaction.data.options[1].value
                    },
                    {
                        "name": "Channel",
                        "value": "<#" + interaction.channel_id + ">"
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

module.exports = EXECUTER_COMMAND_WARN