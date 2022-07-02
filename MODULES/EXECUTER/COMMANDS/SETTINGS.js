let SETTINGS = {}
const EXECUTER_REPLY = require("../REPLY.js")
const GLOBAL_SQL = require("../../GLOBAL/SQL.js")

SETTINGS.command = async function(global, client, SQL, interaction) {
    switch (interaction.data.options[0].name) {
        case "whitelist":
            if (interaction.data.options[0].options[0].name === "list") {
                SQL.execute("SELECT * FROM `whitelist`",
                    function (err, result, fields) {
                        if (!err) {
                            let links = "";
                            for (let i = 0; i < result.length; i++) {
                                if (result[i]['link'] == undefined) return;
                                links += result[i]['link'] + "\n"
                            }
                            // Antwort an den Moderator | Reply to the Moderator
                            EXECUTER_REPLY.go(
                                client,
                                interaction,
                                "",
                                [{
                                    "title": "Erlaubte Links",
                                    "color": 16711680,
                                    "description": links
                                }]
                            )
                        }
                    })
            }
            else if (interaction.data.options[0].options[0].name === "add") {
                SQL.execute("SELECT * FROM `whitelist` WHERE `link` = ?", [interaction.data.options[0].options[0].options[0].value],
                    function (err, result, fields) {
                        if (!err) {
                            if (result.length > 0) {
                                EXECUTER_REPLY.go(
                                    client,
                                    interaction,
                                    "",
                                    [{
                                        "title": "Erlaubte Links",
                                        "color": 16711680,
                                        "description": "Der Link `" + interaction.data.options[0].options[0].options[0].value + "` wurde bereits hinzugefügt!"
                                    }]
                                )
                            } else {
                                GLOBAL_SQL.execute(SQL, "SETTINGSCOMMAND_LINK_INSERT", "INSERT INTO whitelist (link) VALUES (?)", [interaction.data.options[0].options[0].options[0].value])
                                EXECUTER_REPLY.go(
                                    client,
                                    interaction,
                                    "",
                                    [{
                                        "title": "Erlaubte Links",
                                        "color": 16711680,
                                        "description": "Der Link `" + interaction.data.options[0].options[0].options[0].value + "` wurde hinzugefügt!"
                                    }]
                                )
                                reloadLinkPage();
                                global.cache.whitelist.push(interaction.data.options[0].options[0].options[0].value)
                            }
                        }
                    })
            } else if (interaction.data.options[0].options[0].name === "remove") {
                SQL.execute("SELECT * FROM `whitelist` WHERE `link` = ?", [interaction.data.options[0].options[0].options[0].value],
                    function (err, result, fields) {
                        if (!err) {
                            if (result.length == 0) {
                                EXECUTER_REPLY.go(
                                    client,
                                    interaction,
                                    "",
                                    [{
                                        "title": "Erlaubte Links",
                                        "color": 16711680,
                                        "description": "Der Link `" + interaction.data.options[0].options[0].options[0].value + "` wurde bereits entfernt!"
                                    }]
                                )
                            } else {
                                GLOBAL_SQL.execute(SQL, "SETTINGSCOMMAND_LINK_DELETE", "DELETE FROM whitelist WHERE link = ?", [interaction.data.options[0].options[0].options[0].value])
                                EXECUTER_REPLY.go(
                                    client,
                                    interaction,
                                    "",
                                    [{
                                        "title": "Erlaubte Links",
                                        "color": 16711680,
                                        "description": "Der Link `" + interaction.data.options[0].options[0].options[0].value + "` wurde entfernt!"
                                    }]
                                )
                                reloadLinkPage();
                                let newList = []
                                global.cache.whitelist.forEach(whitelist => {
                                    if (whitelist != interaction.data.options[0].options[0].options[0].value) {
                                        newList.push(whitelist)
                                    }
                                })
                                global.cache.whitelist = newList
                            }
                        }
                    })
            }
            break;

        case "blacklist":
            if (interaction.data.options[0].options[0].name === "list") {
                SQL.execute("SELECT * FROM `blacklist`",
                    function (err, result, fields) {
                        if (!err) {
                            let words = "";
                            for (let i = 0; i < result.length; i++) {
                                if (result[i]['word'] == undefined) return;
                                words += result[i]['word'] + "\n"
                            }
                            // Antwort an den Moderator | Reply to the Moderator
                            EXECUTER_REPLY.go(
                                client,
                                interaction,
                                "",
                                [{
                                    "title": "Verbotene Ausdrücke",
                                    "color": 16711680,
                                    "description": words
                                }]
                            )
                        }
                    })
            }
            else if (interaction.data.options[0].options[0].name === "add") {
                SQL.execute("SELECT * FROM `blacklist` WHERE `word` = ?", [interaction.data.options[0].options[0].options[0].value.toLowerCase()],
                    function (err, result, fields) {
                        if (!err) {
                            if (result.length > 0) {
                                EXECUTER_REPLY.go(
                                    client,
                                    interaction,
                                    "",
                                    [{
                                        "title": "Verbotene Ausdrücke",
                                        "color": 16711680,
                                        "description": "Der Ausdruck `" + interaction.data.options[0].options[0].options[0].value + "` ist bereits verboten!"
                                    }]
                                )
                            } else {
                                GLOBAL_SQL.execute(SQL, "SETTINGSCOMMAND_WORD_INSERT", "INSERT INTO blacklist (word) VALUES (?)", [interaction.data.options[0].options[0].options[0].value.toLowerCase()])
                                EXECUTER_REPLY.go(
                                    client,
                                    interaction,
                                    "",
                                    [{
                                        "title": "Verbotene Ausdrücke",
                                        "color": 16711680,
                                        "description": "Der Ausdruck `" + interaction.data.options[0].options[0].options[0].value + "` wurde verboten!"
                                    }]
                                )
                                global.cache.blacklist.push(interaction.data.options[0].options[0].options[0].value.toLowerCase())
                            }
                        }
                    })
            }
            else if (interaction.data.options[0].options[0].name === "remove") {
                SQL.execute("SELECT * FROM `blacklist` WHERE `word` = ?", [interaction.data.options[0].options[0].options[0].value.toLowerCase()],
                    function (err, result, fields) {
                        if (!err) {
                            if (result.length == 0) {
                                EXECUTER_REPLY.go(
                                    client,
                                    interaction,
                                    "",
                                    [{
                                        "title": "Verbotene Ausdrücke",
                                        "color": 16711680,
                                        "description": "Der Ausdruck `" + interaction.data.options[0].options[0].options[0].value + "` ist bereits wieder erlaubt!"
                                    }]
                                )
                            } else {
                                GLOBAL_SQL.execute(SQL, "SETTINGSCOMMAND_WORD_DELETE", "DELETE FROM blacklist WHERE word = ?", [interaction.data.options[0].options[0].options[0].value.toLowerCase()])
                                EXECUTER_REPLY.go(
                                    client,
                                    interaction,
                                    "",
                                    [{
                                        "title": "Verbotene Ausdrücke",
                                        "color": 16711680,
                                        "description": "Der Ausdruck `" + interaction.data.options[0].options[0].options[0].value + "` wurde erlaubt!"
                                    }]
                                )
                                let newList = []
                                global.cache.blacklist.forEach(blacklist => {
                                    if (blacklist != interaction.data.options[0].options[0].options[0].value.toLowerCase()) {
                                        newList.push(blacklist)
                                    }
                                })
                                global.cache.blacklist = newList
                            }
                        }
                    })
            }
            break;

        case "modlog":
            client.channels.cache.get(interaction.data.options[0].options[0].value).createWebhook('TJC_BOT', {"avatar": client.user.avatarURL({format: 'png'})})
                .then(wb => {
                    let webhook = `https://canary.discordapp.com/api/webhooks/${wb.id}/${wb.token}`;
                    global.servers[interaction.guild_id].logchannel = webhook;
                    GLOBAL_SQL.execute(SQL, "SETTINGSCOMMAND_SET_MODLOGCHANNEL", "UPDATE serverconfig SET logchannel = ? WHERE serverid = ?", [webhook, interaction.guild_id])
                    EXECUTER_REPLY.go(
                        client,
                        interaction,
                        "",
                        [{
                            "title": "Modlog-Channel festgelegt",
                            "color": 16711680,
                            "description": "Mod-Logs werden absofort in <#" + interaction.data.options[0].options[0].value + "> gepostet"
                        }]
                    )
                })
            break;

        case "serverlog":
            client.channels.cache.get(interaction.data.options[0].options[0].value).createWebhook('TJC_BOT', {"avatar": client.user.avatarURL({format: 'png'})})
                .then(wb => {
                    let webhook = `https://canary.discordapp.com/api/webhooks/${wb.id}/${wb.token}`;
                    global.servers[interaction.guild_id].serverlog = webhook;
                    GLOBAL_SQL.execute(SQL, "SETTINGSCOMMAND_SET_SERVERLOGCHANNEL", "UPDATE serverconfig SET serverlog = ? WHERE serverid = ?", [webhook, interaction.guild_id])
                    EXECUTER_REPLY.go(
                        client,
                        interaction,
                        "",
                        [{
                            "title": "Serverlog-Channel festgelegt",
                            "color": 16711680,
                            "description": "Server-Logs werden absofort in <#" + interaction.data.options[0].options[0].value + "> gepostet"
                        }]
                    )
                })
            break;

        case "welcomerole":
            let role = interaction.data.options[0].options[0].value;
            global.servers[interaction.guild_id].welcomerole = role
            GLOBAL_SQL.execute(SQL, "SETTINGSCOMMAND_SET_WELCOMEROLE", "UPDATE serverconfig SET welcomerole = ? WHERE serverid = ?", [role, interaction.guild_id])
            EXECUTER_REPLY.go(
                client,
                interaction,
                "",
                [{
                    "title": "Welcomerolle festgelegt",
                    "color": 16711680,
                    "description": "Beim Joinen bekommt der User absofort die <@&" + role + "> Rolle"
                }]
            )
            break;
    }
}


function reloadLinkPage() {
    const request = require('request');

    const options = {
      method: 'GET',
      url: 'https://tjcteam.de/links',
      qs: {refresh: 'dKj2BJswpBjbEbaG'}
    };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
    });
    
}

module.exports = SETTINGS