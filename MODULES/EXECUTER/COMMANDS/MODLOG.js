var EXECUTER_COMMANDS_MODLOG = {};

const EXECUTER_REPLY = require("../REPLY.js") // Reply System (command)
const GLOBAL_BUTTONS = require("../../GLOBAL/BUTTONS.js")

EXECUTER_COMMANDS_MODLOG.command = async function(global, client, SQL, interaction) {
    let cases = []
    // Abfrage aller cases, die entweder global sind oder den aktuellen Server betreffen | Query all cases, which are either global or belong to the current server
    SQL.execute("SELECT * FROM `cases` WHERE user = ? AND (tags = 'global' OR (tags = 'Server' AND serverid = ?)) ORDER BY intern desc ",
        [interaction.data.options[0].value, interaction.guild_id],
        async function (err, results, fields) {
            if (results.length > 0) {
                //Zwischen speicher für cases
                for (let i = 0; i < 9; i++) {
                    if (results[i] != undefined) {
                        cases[i] = {
                            "id": results[i].caseid,
                            "type": results[i].type,
                            "reason": results[i].reason,
                            "moderator": results[i].moderator,
                            "timestamp": results[i].timestamp,
                            "duration": (results[i].endTimestamp == 0) ? "-1" : "<t:" + parseInt(results[i].endTimestamp / 1000) + ">",
                            "server": results[i].serverid,
                            "tags": results[i].tags
                        }
                    }
                }

                // Embedfilds für einzelne Cases | Embedfields for single cases
                let fields = []
                let i = 0;
                await cases.forEach(Case => {
                    let date = new Date(parseInt(Case.timestamp))
                    let Grund = (Case.reason == "") ? "-" : Case.reason
                    let timeDc = (parseInt(date.getTime()).toString().length > 10) ? parseInt(date.getTime() / 1000) : parseInt(date.getTime())
                    let endTime = (Case.duration != "-1") ? "\nEnde: " + Case.duration : ""
                    fields.push({
                        "name": Case.id,
                        "value": "Type: `" + Case.type + "`\nGrund: `" + Grund + "`\nModerator: <@!" + Case.moderator + ">\nBereich: `" + Case.tags + "`\n" +
                            "Zeitpunkt: <t:" + timeDc + ">" + endTime,
                        "inline": false //Gibt an das sich die Felder nebeneinander anreihen dürfen | Allows the fields to be stacked next to each other
                    })
                    i++;
                })

                var buttons = GLOBAL_BUTTONS.generate(global, interaction, "modlogs",
                    [{style: 2, disabled: true, emoji: {id: null, name: "🏠"}},
                        {style: 2, disabled: true, emoji: {id: null, name: "◀"}},
                        {style: 1, disabled: true, emoji: {id: null, name: "1️⃣"}},
                        {style: 2, disabled: (results.length <= 9), emoji: {id: null, name: "▶"}},
                        {style: 2, disabled: false, emoji: {id: null, name: "ℹ"}}], {count: 0})

                let user = null;
                try {
                    user = await client.guilds.cache.get(interaction.guild_id).members.fetch(interaction.data.options[0].value).catch()
                } catch (e) {
                }

                let usertag = interaction.data.options[0].value
                let userAvatar = "https://lubalp.eu/discord/avatars/4.png"

                if (user != null) {
                    global.openModLogs[buttons[0].components[0].custom_id.toString().slice(0, -1)] = JSON.parse("{\"user\": { \"id\":\"" + interaction.data.options[0].value + "\", \"tag\": \"" + user.user.username + "#" + user.user.discriminator + "\", \"avatar\": \"https://cdn.discordapp.com/avatars/" + user.id + "/" + user.user.avatar + "\"}}")
                    usertag = user.user.username + "#" + user.user.discriminator
                    userAvatar = "https://cdn.discordapp.com/avatars/" + user.id + "/" + user.avatar
                } else {
                    global.openModLogs[buttons[0].components[0].custom_id.toString().slice(0, -1)] = JSON.parse("{\"user\": { \"id\":\"" + interaction.data.options[0].value + "\", \"tag\": " + interaction.data.options[0].value + ", \"avatar\": \"https://lubalp.eu/discord/avatars/4.png\"}}")
                }

                // User ausgabe von Modlogs | User output from Modlogs
                EXECUTER_REPLY.go(
                    client,
                    interaction,
                    "",
                    [{
                        "title": "Modlogs von " + usertag,
                        "color": 16711680,
                        "footer": {
                            text: "Modlogs von " + interaction.data.options[0].value,
                            icon_url: userAvatar
                        },
                        fields
                    }],
                    buttons
                )

            } else {

                let user = null;
                try {
                    user = await client.guilds.cache.get(interaction.guild_id).members.fetch(interaction.data.options[0].value).catch()
                } catch (e) {
                }

                let usertag = interaction.data.options[0].value
                let userAvatar = "https://lubalp.eu/discord/avatars/4.png"

                if (user != null) {
                    usertag = user.user.username + "#" + user.user.discriminator
                    userAvatar = "https://cdn.discordapp.com/avatars/" + user.user.id + "/" + user.user.avatar
                }

                // Wenn keine Einträge gefunden worden sind | If no entries were found
                EXECUTER_REPLY.go(
                    client,
                    interaction,
                    "",
                    [{
                        "title": "Modlogs von " + usertag,
                        "color": 16711680,
                        "description": "Keine Einträge gefunden!",
                        "footer": {
                            text: "Modlogs von " + interaction.data.options[0].value,
                            icon_url: userAvatar
                        },
                    }]
                )
            }
        })

}

EXECUTER_COMMANDS_MODLOG.button = async function(global, client, SQL, interaction, cache) {
    let emotes = {1: "1️⃣", 2: "2️⃣", 3: "3️⃣", 4: "4️⃣", 5: "5️⃣", 6: "6️⃣", 7: "7️⃣", 8: "8️⃣", 9: "9️⃣"}

    counter = cache.data.count + 1
    var buttons;

    var data = {count: counter}

    SQL.execute("SELECT * FROM cases WHERE user = ? AND serverid = ? ORDER BY intern desc ", [global.openModLogs[cache.info.id].user.id, interaction.guild_id],
        function (err, results, fields) {

            switch (cache.info.selected){
                case "0":
                    var fields = []
                    for (let i = 0; i < 9; i++) {
                        if (results[i] != undefined) {
                            let Case = results[i]
                            let date = new Date(parseInt(Case.timestamp))
                            let timeDc = (parseInt(date.getTime()).toString().length > 10) ? parseInt(date.getTime() / 1000) : parseInt(date.getTime())
                            let Grund = (Case.reason == "") ? "-" : Case.reason
                            let endTime = (Case.endTimestamp != "0") ? "\nEnde: <t:" + parseInt(Case.endTimestamp / 1000) + ">" : ""
                            fields.push({
                                "name": Case.caseid,
                                "value": "Type: `" + Case.type + "`\nGrund: `" + Grund + "`\nModerator: <@!" + Case.moderator + ">\nBereich: `" + Case.tags + "`\n" +
                                    "Zeitpunkt: <t:" + timeDc + "> " + endTime,
                                "inline": false //Gibt an das sich die Felder nebeneinander anreihen dürfen | Allows the fields to be stacked next to each other
                            })
                        }
                    }
                    var buttons = GLOBAL_BUTTONS.generate(global, interaction, "modlogs",
                        [{style: 2, disabled: true, emoji: {id: null, name: "🏠"}},
                            {style: 2, disabled: true, emoji: {id: null, name: "◀"}},
                            {style: 1, disabled: true, emoji: {id: null, name: "1️⃣"}},
                            {style: 2, disabled: (results.length <= 9), emoji: {id: null, name: "▶"}},
                            {style: 2, disabled: false, emoji: {id: null, name: "ℹ"}}], {count: 0})
                    EXECUTER_REPLY.go(
                        client,
                        interaction,
                        "",
                        [{
                            "title": "Modlogs von " + global.openModLogs[cache.info.id].user.tag,
                            "color": 16711680,
                            "footer": {
                                text: "Modlogs von " + global.openModLogs[cache.info.id].user.id,
                                icon_url: "https://cdn.discordapp.com/avatars/" + global.openModLogs[cache.info.id].user.id + "/" + global.openModLogs[cache.info.id].user.avatar
                            },
                            fields
                        }],
                        buttons
                    )
                    global.openModLogs[buttons[0].components[0].custom_id.toString().slice(0, -1)] = JSON.parse("{\"user\": { \"id\":\"" + global.openModLogs[cache.info.id].user.id + "\", \"tag\": \"" + global.openModLogs[cache.info.id].user.tag + "\", \"avatar\": \"" + global.openModLogs[cache.info.id].user.avatar + "\"}}")
                    break;

                case "1":
                    var fields = []
                    for (let i = (9 + (9 * (cache.data.count - 2))); i < (9 + (9 * (cache.data.count - 1))); i++) {
                        if (results[i] != null) {
                            let Case = results[i]
                            let date = new Date(parseInt(Case.timestamp))
                            let timeDc = (parseInt(date.getTime()).toString().length > 10) ? parseInt(date.getTime() / 1000) : parseInt(date.getTime())
                            let Grund = (Case.reason == "") ? "-" : Case.reason
                            let endTime = (Case.endTimestamp != "0") ? "\nEnde: <t:" + parseInt(Case.endTimestamp / 1000) + ">" : ""
                            fields.push({
                                "name": Case.caseid,
                                "value": "Type: `" + Case.type + "`\nGrund: `" + Grund + "`\nModerator: <@!" + Case.moderator + ">\nBereich: `" + Case.tags + "`\n" +
                                    "Zeitpunkt:<t:" + timeDc + "> " + endTime,
                                "inline": false //Gibt an das sich die Felder nebeneinander anreihen dürfen | Allows the fields to be stacked next to each other
                            })
                        }
                    }

                    var buttons = GLOBAL_BUTTONS.generate(global, interaction, "modlogs",
                        [{style: 2, disabled: (cache.data.count == 1), emoji: {id: null, name: "🏠"}},
                            {style: 2, disabled: (cache.data.count == 1), emoji: {id: null, name: "◀"}},
                            {style: 1, disabled: true, emoji: {id: null, name: (cache.data.count < 10) ? emotes[cache.data.count]: "♾"}},
                            {style: 2, disabled: (results.length <= (9 + (9 * (cache.data.count + 1)))), emoji: {id: null, name: "▶"}},
                            {style: 2, disabled: false, emoji: {id: null, name: "ℹ"}}], {count: cache.data.count - 1})
                    EXECUTER_REPLY.go(
                        client,
                        interaction,
                        "",
                        [{
                            "title": "Modlogs von " + global.openModLogs[cache.info.id].user.tag,
                            "color": 16711680,
                            "footer": {
                                text: "Modlogs von " + global.openModLogs[cache.info.id].user.id,
                                icon_url: "https://cdn.discordapp.com/avatars/" + global.openModLogs[cache.info.id].user.id + "/" + global.openModLogs[cache.info.id].user.avatar
                            },
                            fields
                        }],
                        buttons
                    )
                    global.openModLogs[buttons[0].components[0].custom_id.toString().slice(0, -1)] = JSON.parse("{\"user\": { \"id\":\"" + global.openModLogs[cache.info.id].user.id + "\", \"tag\": \"" + global.openModLogs[cache.info.id].user.tag + "\", \"avatar\": \"" + global.openModLogs[cache.info.id].user.avatar + "\"}}")
                    break;

                case "3":
                    var fields = []
                    for (let i = (9 + (9 * cache.data.count)); i < (9 + (9 * (cache.data.count + 1))); i++) {
                        if (results[i] != null) {
                            let Case = results[i]
                            let date = new Date(parseInt(Case.timestamp))
                            let timeDc = (parseInt(date.getTime()).toString().length > 10) ? parseInt(date.getTime() / 1000) : parseInt(date.getTime())
                            let Grund = (Case.reason == "") ? "-" : Case.reason
                            let endTime = (Case.endTimestamp != "0") ? "\nEnde: <t:" + parseInt(Case.endTimestamp / 1000) + ">" : ""
                            fields.push({
                                "name": Case.caseid,
                                "value": "Type: `" + Case.type + "`\nGrund: `" + Grund + "`\nModerator: <@!" + Case.moderator + ">\nBereich: `" + Case.tags + "`\n" +
                                    "Zeitpunkt: <t:" + timeDc + "> " + endTime,
                                "inline": false //Gibt an das sich die Felder nebeneinander anreihen dürfen | Allows the fields to be stacked next to each other
                            })
                        }
                    }

                    var buttons = GLOBAL_BUTTONS.generate(global, interaction, "modlogs",
                        [{style: 2, disabled: false, emoji: {id: null, name: "🏠"}},
                            {style: 2, disabled: false, emoji: {id: null, name: "◀"}},
                            {style: 1, disabled: true, emoji: {id: null, name: (cache.data.count + 2 < 10) ? emotes[cache.data.count + 2]: "♾"}},
                            {style: 2, disabled: (results.length <= (9 + (9 * (cache.data.count + 1)))), emoji: {id: null, name: "▶"}},
                            {style: 2, disabled: false, emoji: {id: null, name: "ℹ"}}], {count: cache.data.count + 1})
                    EXECUTER_REPLY.go(
                        client,
                        interaction,
                        "",
                        [{
                            "title": "Modlogs von " + global.openModLogs[cache.info.id].user.tag,
                            "color": 16711680,
                            "footer": {
                                text: "Modlogs von " + global.openModLogs[cache.info.id].user.id,
                                icon_url: "https://cdn.discordapp.com/avatars/" + global.openModLogs[cache.info.id].user.id + "/" + global.openModLogs[cache.info.id].user.avatar
                            },
                            fields
                        }],
                        buttons
                    )
                    global.openModLogs[buttons[0].components[0].custom_id.toString().slice(0, -1)] = JSON.parse("{\"user\": { \"id\":\"" + global.openModLogs[cache.info.id].user.id + "\", \"tag\": \"" + global.openModLogs[cache.info.id].user.tag + "\", \"avatar\": \"" + global.openModLogs[cache.info.id].user.avatar + "\"}}")
                    break;

                case "4":
                    SQL.execute("SELECT * FROM usernotes WHERE `user` = ?", [global.openModLogs[cache.info.id].user.id],
                        function (err, results, field) {
                            if (err) return;
                            let fields = []
                            results.forEach(result => {
                                fields.push({
                                    "name": "Moderationsnotiz",
                                    "value": "Notiz von <@!" + result['moderator'] + ">\nNotiz: `" + result['note'] + "`",
                                    "inline": false
                                })
                            })
                            var buttons = GLOBAL_BUTTONS.generate(global, interaction, "modlogs",
                                [{style: 2, disabled: false, emoji: {id: null, name: "🏠"}},
                                    {style: 2, disabled: true, emoji: {id: null, name: "◀"}},
                                    {style: 1, disabled: true, emoji: {id: null, name: (cache.data.count + 1 < 10) ? emotes[cache.data.count + 1] : "♾"}},
                                    {style: 2, disabled: true, emoji: {id: null, name: "▶"}},
                                    {style: 2, disabled: true, emoji: {id: null, name: "ℹ"}}], {count: cache.data.count + 1})
                            EXECUTER_REPLY.go(
                                client,
                                interaction,
                                "",
                                [{
                                    "title": "Moderationsnotizen für " + global.openModLogs[cache.info.id].user.tag,
                                    "color": 16711680,
                                    "footer": {
                                        text: "Modlogs von " + global.openModLogs[cache.info.id].user.id,
                                        icon_url: "https://cdn.discordapp.com/avatars/" + global.openModLogs[cache.info.id].user.id + "/" + global.openModLogs[cache.info.id].user.avatar
                                    },
                                    fields
                                }],
                                buttons
                            )
                            global.openModLogs[buttons[0].components[0].custom_id.toString().slice(0, -1)] = JSON.parse("{\"user\": { \"id\":\"" + global.openModLogs[cache.info.id].user.id + "\", \"tag\": \"" + global.openModLogs[cache.info.id].user.tag + "\", \"avatar\": \"" + global.openModLogs[cache.info.id].user.avatar + "\"}}")
                        })
                    break;
            }
        })

}


module.exports = EXECUTER_COMMANDS_MODLOG