var MUTETIMER = {}

var GLOBAL_SQL = require("../GLOBAL/SQL.js")

MUTETIMER.go = function (SQL, client, global) {
    try {
        SQL.execute("SELECT * FROM `mutes` WHERE (timestamp + (duration *1000)) <= ?", [Date.now()],
            function (err, results, fields) {
                if (!err) {
                    results.forEach(async (result) => {
                        await GLOBAL_SQL.execute(SQL, "INTERVAL_MUTETIMER.DELETE", "DELETE FROM mutes WHERE id = ?", [result.id])
                        if (result['bereich'] === "Server") { // Mutes die nur auf dem Hauptserver sind | Mutes that only apply to the main server
                            client.guilds.cache.get(result['serverid']).members.fetch(result['id']).then(member => {
                                member.roles.remove(member.guild.roles.cache.find(role => role.name.toString().toLowerCase() === "muted"))
                            })
                        } else if (result['bereich'] === "Projekte") { // Mutes die nur den Projektechannel betreffen | Mutes that only apply to the project channel
                            client.guilds.cache.get(global.config.botconfig.mainserver).members.fetch(result['id']).then(member => {
                                member.roles.add(global.config.serverdata.projekterole)
                            })
                        } else if (result['bereich'] === "Global") { // Mutes die auf allen TJC-Servern sind | Mutes that apply to all TJC servers
                            //Hauptserver | Main server
                            client.guilds.cache.get(global.config.botconfig.mainserver).members.fetch(result['id']).then(member => {
                                if (member.roles.find(role => role.name === "muted")) {
                                    member.roles.remove(member.guild.roles.cache.find(role => role.name === "muted"))
                                }
                            })
                            //alle anderen TJC Server | All other TJC servers
                            client.guilds.cache.forEach(guild => {
                                let role = guild.roles.cache.find(role => role.name === "muted")
                                guild.members.fetch(result['id']).then(member => {
                                    member.roles.remove(role)
                                })
                            })
                        }
                        if (global.mutes[result['id']] != null) {
                            let region = result['serverid']
                            if (result['bereich'] == "global") region = "global"
                            if (global.mutes[result['id']].servers.includes(result['serverid']) || global.mutes[result['id']].servers.includes("global")) {
                                let newjson = JSON.parse("[]")
                                global.mutes[result['id']]["servers"].forEach(entry => {
                                    if (entry != region) {
                                        newjson.push(JSON.parse(region.toString()))
                                    }
                                })
                                global.mutes[result['id']]["servers"] = newjson
                            }
                        }
                    })
                }
        })
    } catch (e) {
        console.log(e)
    }
}

module.exports = MUTETIMER;