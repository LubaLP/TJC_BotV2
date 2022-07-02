const Discord = require("discord.js")
const mysql = require("mysql2")

const fs = require("fs")
const path = require('path')
const moment = require('moment')
const bad_words = require('bad-words')

const GLOBAL_DEBUG = require("./MODULES/GLOBAL/DEBUG.js") // Debug System (log)
const GLOBAL_SQL = require("./MODULES/GLOBAL/SQL.js") // SQL System
const SELECTOR_COMMANDS = require("./MODULES/SELECTOR/COMMANDS.js") // Commands Handler
const SELECTOR_BUTTONS = require("./MODULES/SELECTOR/BUTTONS.js") // Buttons Handler
const GLOBAL_CASEID = require("./MODULES/GLOBAL/CASEID.js") // CaseID Handler
const INTERVALMANAGER = require("./MODULES/INTERVAL/INTERVALMANAGER.js") // Interval Manager
const GLOBAL_WEBHOOKS = require("./MODULES/GLOBAL/WEBHOOKS.js") // Webhooks Manager
const AUTOMOD_LINKS = require("./MODULES/AUTOMOD/LINKS.js") // Automod: Links
const AUTOMOD_WORDS = require("./MODULES/AUTOMOD/WORDS.js") // Automod: Words
const EXECUTER_REPLY = require("./MODULES/EXECUTER/REPLY.js")
const GLOBAL_WEBHOOK = require("./MODULES/GLOBAL/WEBHOOKS.js")

// Lade Config
const {
    botconfig,
    globalserver,
    serverdata,
    mysqldata,
    webhook,
    botspamsystem,
    automod,
    colors
} = require("./config.json")

console.log('System startet!')


// Globale Variabel, auf die von überall zugegriffen werden kann | Glabal var to access from everywhere
let global = {}
global.config = { botconfig, globalserver, serverdata, mysqldata, webhook, botspamsystem, automod }
global.cache = {}
global.cache.cases = []
global.cache.whitelist = []
global.cache.roles = {}
global.cache.roles.linkproved = []
global.cache.blacklist = []
global.cache.buttons = {}
global.servers = {}
global.teamroles = {}
global.mutes = {}
global.noniceones = {}
global.openModLogs = {}
global.colors = colors
global.automod = {}
global.automod.filter = {}
global.automod.projekte = {}
global.automod.projekte.messages = []

const Intents = Discord.Intents
let DiscordBotIntents = [Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_WEBHOOKS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.DIRECT_MESSAGES]

// Erstelle Connections | Create Connections
const SQL = mysql.createPool(mysqldata)
const client = new Discord.Client({intents: DiscordBotIntents});

// Discord Events | Discord Events

let lastJoins = JSON.parse("{\"joins\": []}");
let botwelle = false;
let messageLogs = {}

// on Ready | on Ready
client.once('ready', () => {
    GLOBAL_DEBUG.console("log", "BOT.js_Discord_Ready", "Ready!")
    GLOBAL_CASEID.getlist(global, SQL) // fetch caseId list from database | bekomme die Liste von der Datenbank
    GLOBAL_SQL.getwhitelist(global, SQL) // fetch Whitelist list from SQL | bekomme Liste von SQL

    // Dm an Luba | Dm to Luba
    client.users.fetch("289046908809510912").then(member => {
        member.send("> Moderations Funktionen neugestartet.")
    })
    
    

    // Globaler IntervalManager läuft alle 30 Sek neu durch | Global IntervalManager runs every 30 seconds
    setInterval(function(){
        INTERVALMANAGER.go(client, SQL, global)
    }, 30000)

    //Blockierte Wörter cachen | Cache blocked words
    addSwearewords()

    //Alle LinkProoved Rollen finden | Find all LinkProoved Roles
    client.guilds.cache.forEach((guild) => {
        global.servers[guild.id] = JSON.parse("{\"logchannel\": \"\", \"welcomerole\": \"\", \"serverlog\": \"\" }")
        let role = guild.roles.cache.find(r => r.name === "Link Proved")
        let role2 = guild.roles.cache.find(r => r.name === "TJC-Team")
        let role3 = guild.roles.cache.find(r => r.name === "Team")
        if(typeof(role) != "undefined"){
            global.cache.roles.linkproved.push(role.id)
        }
        if(typeof(role2) != "undefined"){
            global.cache.roles.linkproved.push(role2.id)
        }
        if(typeof(role3) != "undefined"){
            global.cache.roles.linkproved.push(role3.id)
        }
    })

    // Cache alle LogChannel und Willkommensrollen | Cache all LogChannels and WelcomeRoles
    SQL.execute("SELECT * FROM serverconfig", function (err, results, fields) {
        if (!err) {
            for (let i = 0; i < results.length; i++) {
                global.servers[results[i].serverid].logchannel = results[i].logchannel
                global.servers[results[i].serverid].welcomerole = results[i].welcomerole
                global.servers[results[i].serverid].serverlog = results[i].serverlog
            }
            
            console.log(global.servers)
        } else {
            console.log(err)
        }
    })
    
 

    // Cache alle Teamrollen | Cache all TeamRoles
    SQL.execute("SELECT * FROM `userroles` ORDER BY userid", function (err, results, fields) {
        if (!err) {
            let userid;
            for (let i = 0; i < results.length; i++) {
                userid = results[i].userid
                if (global.teamroles[userid]) {
                    global.teamroles[userid] = JSON.parse(JSON.stringify(global.teamroles[userid]).replace("]", ", \"" + results[i].roleid.toString() + "\"]"))
                } else {
                    global.teamroles[userid] = JSON.parse("[\"" + results[i].roleid.toString() + "\"]")
                }
            }
        }
    })

    // Cache alle Leute ohne niceone Rolle | Cache all people without niceone role
    SQL.execute("SELECT * FROM noniceones", function (err, results, fields) {
        if (!err) {
            for (let i = 0; i < results.length; i++) {
                global.noniceones[results[i].id] = global.noniceones[results[i].id] + results[i].serverid + ", "
            }
        }
    })

    // Cache alle gemuteten Leute | Cache all muted people
    SQL.execute("SELECT * FROM mutes", function (err, results, fields) {
        if (!err) {
            for (let i = 0; i < results.length; i++) {
                let region = results[i]['serverid']
                if (results[i]['bereich'].toLowerCase() == "global") region = "global"
                if (global.mutes[results[i]['id']] != undefined) {
                    global.mutes[results[i]['id']]["servers"].push(JSON.parse(region.toString()))
                } else {
                    global.mutes[results[i]['id']] = JSON.parse("{\"servers\": [\"" + region.toString() + "\"]}")
                }
            }
        }
    })

});


function addSwearewords() {
    let filter = new bad_words({emptyList: true})
    SQL.execute("SELECT * FROM `blacklist`",
        function (err, result, fields) {
            if (!err) {
                if (result.length > 0) {
                    result.forEach(word => {
                        global.cache.blacklist.push(word['word'])
                        filter.addWords(word['word'])
                    })
                    global.automod.filter = filter
                }
            }
        })

}



// Interaction handling | Interaction handling
client.ws.on('INTERACTION_CREATE', async (interaction) => {

    // Slash Command Handler 
    if(interaction.type == 2){
        SELECTOR_COMMANDS.go(global, client, SQL, interaction)
    }

    // Button Handler
    else if (interaction.type == 3){
        SELECTOR_BUTTONS.go(global, client, SQL, interaction)
    }
})

client.on('guildBanAdd', async (guildBan, user) => {
    let fetchedAuditLog = await guildBan.guild.fetchAuditLogs({
        limit: 1,
        type: 'MEMBER_BAN_ADD'
    })
    var seq = await GLOBAL_CASEID.generate(global)
    let auditlog = fetchedAuditLog.entries.first()
    let time = Number(auditlog.id).toString(2) + ""
    if (auditlog.executor.id == client.user.id) return
    if (Date.now() - (parseInt(time.slice(0, -22), 2) + 1420070400000) > 2000) return;
    // Einträge in die benötigte Datenbank Tabelle einfügen | Insert entries into the needed database table
    GLOBAL_SQL.execute(SQL, "BOT_BAN_CASE_INSERT", "INSERT INTO cases (caseid, user, serverid, type, tags,  reason, moderator, channel, timestamp, endTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [seq, auditlog.target.id, guildBan.guild.id, 'ban', "Server", (auditlog.reason == null) ? "keinen Grund angegben": auditlog.reason, auditlog.executor.id, "", Date.now(), '0'])

    // Log- TEMPORÄR bis Reply an User den Part übernimmt | Log- TEMPORÄR until the user replies to the part
    GLOBAL_WEBHOOK.go(global.servers[guildBan.guild.id].logchannel, [
            {
                "title": "Ein User wurde gebannt",
                "color": global.colors.red,
                "fields": [
                    {
                        "name": "User",
                        "value": "<@!" + auditlog.target.id + "> (" + auditlog.target.id + ")"
                    },
                    {
                        "name": "Grund",
                        "value": (auditlog.reason == null) ? "keinen Grund angegben": auditlog.reason
                    },
                    {
                        "name": "Bereich",
                        "value": guildBan.guild.name
                    },
                    {
                        "name": "Moderator",
                        "value": "<@!" + auditlog.executor.id + "> (" + auditlog.executor.id + ")"
                    }
                ]
            }
        ]
    )
})

client.on('guildBanRemove', async (guildBan, user) => {
    let fetchedAuditLog = await guildBan.guild.fetchAuditLogs({
        limit: 1,
        type: 'MEMBER_BAN_REMOVE'
    })
    var seq = await GLOBAL_CASEID.generate(global)
    let auditlog = fetchedAuditLog.entries.first()
    let time = Number(auditlog.id).toString(2) + ""
    if (auditlog.executor.id == client.user.id) return
    if (Date.now() - (parseInt(time.slice(0, -22), 2) + 1420070400000) > 2000) return;
    // Einträge in die benötigte Datenbank Tabelle einfügen | Insert entries into the needed database table
    GLOBAL_SQL.execute(SQL, "BOT_UNBAN_CASE_INSERT", "INSERT INTO cases (caseid, user, serverid, type, tags,  reason, moderator, channel, timestamp, endTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [seq, auditlog.target.id, guildBan.guild.id, 'unban', "Server", "", auditlog.executor.id, "", Date.now(), '0'])

    // Log- TEMPORÄR bis Reply an User den Part übernimmt | Log- TEMPORÄR until the user replies to the part
    GLOBAL_WEBHOOK.go(global.servers[guildBan.guild.id].logchannel, [
            {
                "title": "Ein User wurde entbannt",
                "color": global.colors.green,
                "fields": [
                    {
                        "name": "User",
                        "value": "<@!" + auditlog.target.id + "> (" + auditlog.target.id + ")"
                    },
                    {
                        "name": "Moderator",
                        "value": "<@!" + auditlog.executor.id + "> (" + auditlog.executor.id + ")"
                    }
                ]
            }
        ]
    )
})

let userids = []

let runningBotdefence = false

async function botdefence() {
    runningBotdefence = true
    try {
        while (userids != null) {
            let member = await client.guilds.cache.get(global.config.botconfig.mainserver).members.fetch(userids[0]).catch()
            if (member != null) {
                await member.send({content: null, embeds: [{
                        "title": "· BAN ·",
                        "description": "**Du wurdest von dem Server \"" + client.guilds.cache.get(global.config.botconfig.mainserver).name + "\" gebannt!**",
                        "color": global.colors.red,
                        "fields": [
                            {
                                "name": "Grund:",
                                "value": "AutoMod - BanSystem - Botwelle"
                            },
                            {
                                "name": "Du wurdest gebannt, bist aber kein Bot?",
                                "value": "Kein Problem, du kannst dich ganz einfach auf der [Website](https://pardon.tjcteam.de) einen Entbannungsantrag stellen"
                            }
                        ],
                        "footer": {
                            "text": `Erstellt von ${client.user.username}#${client.user.discriminator} • CaseID -AutoMod-`
                        },
                        "timestamp": Date.now()
                    }
                    ]})
                await GLOBAL_WEBHOOK.go(global.servers[client.guilds.cache.get(global.config.botconfig.mainserver).id].logchannel, [
                        {
                            "title": "Ein User wurde gebannt",
                            "color": global.colors.red,
                            "fields": [
                                {
                                    "name": "User",
                                    "value": "<@!" + member.id + "> (" + member.id + ")"
                                },
                                {
                                    "name": "Grund",
                                    "value": "AutoMod - BanSystem - Botwelle"
                                }
                            ]
                        }
                    ]
                )
                await GLOBAL_SQL.execute(SQL, "BOT-AUTOMOD-BOTWELLE-INSERT", "INSERT IGNORE INTO botwelle (userid, timestamp) VALUES (?, ?)", [member.id, Date.now()])
                setTimeout(async () => {
                    await member.ban({
                        days: 1,
                        reason: "AutoMod - Bot"
                    })
                }, 100)
                const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
                await delay(500)
            }
            userids.shift()
        }
    } catch (e) {
        GLOBAL_DEBUG.console('log', "BOTDEFENCESYSTEM - USER CONTACT AND AUTOBAN", e)
    }
    runningBotdefence = false
}

client.on('guildMemberAdd', async (member) => {

    if (member.guild.id = global.config.botconfig.mainserver) {
        if (botwelle) {
            let joineDate1 = lastJoins.joins[lastJoins.joins.length - 1].joindate
            if ((Date.now() - parseInt(joineDate1)) > parseInt(global.config.botspamsystem.timeout * 1000) * 4) {
                botwelle = false
                lastJoins = JSON.parse("{\"joins\": []}")
                return;
            }
            if (userids == null) {
                userids = []
            }
            userids.push(member.id)
            if (!runningBotdefence) botdefence()
        }
        if (member != null) {
            await member.createDM()
                .then((dmchannel) => {
                    dmchannel.send({
                        embed: {
                            "title": "Willkommen auf dem TheJoCraft Community Discord!",
                            "description": "Hallo <@!" + member.user.id + "> und Herzlich Willkommen." +
                                "\nBitte nicht vergessen: Mit deinem **Beitritt** erklärst du dich auch mit **unseren Regeln** (<#700806629494358136>) einverstanden.\n" +
                                "Sollte es **ein Problem geben**, wende dich bitte an einen **Team-Mitglied** oder melde es auf (http://bit.ly/2WfBDAG)\n" +
                                "Ansonsten wünsche ich dir **Viel Spaß** ;-)\n\n~TJC",
                            "color": global.colors.green,
                            "footer": {
                                "text": `Herzlich Willkommen`
                            },
                            "timestamp": Date.now()
                        }
                    }).catch((e) => {

                    })
                })
        }

        lastJoins.joins[lastJoins.joins.length] = JSON.parse("{\"userid\": \"" + member.id + "\", \"joindate\": \"" + Date.now() + "\"}")
        if (lastJoins.joins[lastJoins.joins.length - parseInt(global.config.botspamsystem.userToTrigger) - 1] != undefined) {
            let joineDate1 = lastJoins.joins[lastJoins.joins.length - parseInt(global.config.botspamsystem.userToTrigger) - 1].joindate
            if ((Date.now() - joineDate1 < parseInt(global.config.botspamsystem.timeout * 1000))) {
                if (!botwelle) {
                    for (let i = 0; i < parseInt(global.config.botspamsystem.userToTrigger); i++) {
                        try {
                            let fetchedMember = await client.guilds.cache.get(member.guild.id).members.fetch(lastJoins.joins[lastJoins.joins.length - i - 1].userid).catch()
                            if (fetchedMember != null) {
                                userids.push(fetchedMember.id)
                            }
                        } catch (e) {
                            GLOBAL_DEBUG.console('log', "BOTDEFENCESYSTEM - USER CONTACT AND AUTOBAN - CACHEDBOTS", e)
                        }
                    }
                    botdefence()
                }
                botwelle = true;
            }
        }
 
        //Rollen Vergabe für Teamrollen beim Beitritt (Team-Rollen) | Give roles on join (Team-Roles)
        if (member.guild.id == global.config.botconfig.mainserver) {
            if (global.teamroles[member.id] != null) {
                for (let i = 0; i < global.teamroles[member.id].length; i++) {
                    if (member.guild.roles.cache.get(global.teamroles[member.id][i]) == null) return;
                    member.roles.add(member.guild.roles.cache.get(global.teamroles[member.id][i]))
                }
            }
        }

        //Ändere Nickname des Users zu Faker wenn Name == 'TheJoCraft' | Change nickname of user to Faker if name == 'TheJoCraft'
        if (member.user.username.toString().toLowerCase() === "thejocraft") {
            member.setNickname("Faker", "Faken von TheJoCraft")
            // Warnen des Users | Warn user
            // generate CaseID | generate CaseID
            var seq = await GLOBAL_CASEID.generate(global)

            // Sende dem User Infos per DM | Send user info per DM
            await client.guilds.cache.get(interaction.guild_id).members.fetch(interaction.data.options[0].value)
                .then(async user => {
                    await EXECUTER_REPLY.user(client, user, client.member.user, seq, "warn", "Bitte unterlasse das Faken von TheJoCraft", member.guild, null)
                })

            // Einträge in die benötigte Datenbank Tabelle | Insert into required database table
            GLOBAL_SQL.execute(SQL, "WARNCOMMAND_CASE_INSERT", "INSERT INTO cases (caseid, user, serverid, type, tags, reason, moderator, channel, timestamp, endTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [seq, member.user.id, interaction.guild_id, 'warn', 'Server', "Bitte unterlasse das Faken von TheJoCraft", client.member.user.id, "", Date.now(), '0'])

        }
    
    // Vergabe von Niceone bei keinen Verstößen | Give Niceone on no offense
        if (global.noniceones[member.id] == null || !global.noniceones[member.id].includes(member.guild.id + ", ")) {
            if (member.guild.roles.cache.find(role => role.id == global.servers[member.guild.id].welcomerole) != null) {
                member.roles.add(member.guild.roles.cache.find(role => role.id == global.servers[member.guild.id].welcomerole))
            }
        }
    }
    // Vergabe von muted Rolle beim joinen | Give muted role on join
    if (global.mutes[member.id] != null && (global.mutes[member.id].servers.includes(member.guild.id) || global.mutes[member.id].servers.includes("global"))) {
        member.roles.add(member.guild.roles.cache.find(role => role.name.toLowerCase() === "muted"))
    }

    let avatarUrl = "https://lubalp.eu/discord/avatars/4.png"
    if (member.user.avatarURL({format: "png"}) != null) avatarUrl = member.user.avatarURL({format: "png"}).toString().replace(".png", "")
    let createdDate = new Date(parseInt(member.user.createdAt.getTime()))

    GLOBAL_WEBHOOK.go(global.servers[member.guild.id].serverlog, [
            {
                "title": "Ein User ist gejoint",
                "color": global.colors.green,
                "thumbnail": {
                    "url": avatarUrl,
                },
                "description": "► Tag: <@!" + member.user.id + ">\n" +
                    "► Name: " + member.user.username + "#" + member.user.discriminator + "\n" +
                    "► ID: " + member.user.id + "\n" + 
                	"► Account erstellt: <t:" + parseInt(createdDate.getTime() / 1000) + ">",
                "timestamp": new Date()
            }
        ]
    )

})

client.on('guildMemberRemove', async (member) => {

    let avatarUrl = "https://lubalp.eu/discord/avatars/4.png"
    if (member.user.avatarURL({format: "png"}) != null) avatarUrl = member.user.avatarURL({format: "png"}).toString().replace(".png", "")

    GLOBAL_WEBHOOK.go(global.servers[member.guild.id].serverlog, [
            {
                "title": "Ein User hat den Server verlassen",
                "color": global.colors.red,
                "thumbnail": {
                    "url": avatarUrl,
                },
                "description": "► Tag: <@!" + member.user.id + ">\n" +
                    "► Name: " + member.user.username + "#" + member.user.discriminator + "\n" +
                    "► ID: " + member.user.id,
                "timestamp": new Date()
            }
        ]
    )

    let fetchedAuditLog = await member.guild.fetchAuditLogs({
        limit: 1,
        type: 'MEMBER_KICK'
    })
    var seq = await GLOBAL_CASEID.generate(global)
    let auditlog = fetchedAuditLog.entries.first()
    if (auditlog == null) return
    let time = Number(auditlog.id).toString(2) + ""
    if (auditlog.target.id == member.id) {
        if (Date.now() - (parseInt(time.slice(0, -22), 2) + 1420070400000) > 2000) return;
        // Einträge in die benötigte Datenbank Tabelle | Insert into required database table
        GLOBAL_SQL.execute(SQL, "BOT_KICK_CASE_INSERT", "INSERT INTO cases (caseid, user, serverid, type, tags,  reason, moderator, channel, timestamp, endTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [seq, auditlog.target.id, member.guild.id, 'kick', "Server", (auditlog.reason == null) ? "keinen Grund angegben": auditlog.reason, auditlog.executor.id, "", Date.now(), '0'])

        // Log- TEMPORÄR bis Reply an User den Part übernimmt | Log TEMPORARY until Reply to User takes part
        GLOBAL_WEBHOOK.go(global.servers[member.guild.id].logchannel, [
                {
                    "title": "Ein User wurde gekickt",
                    "color": global.colors.yellow,
                    "fields": [
                        {
                            "name": "User",
                            "value": "<@!" + auditlog.target.id + "> (" + auditlog.target.id + ")"
                        },
                        {
                            "name": "Grund",
                            "value": (auditlog.reason == null) ? "keinen Grund angegben": auditlog.reason
                        },
                        {
                            "name": "Moderator",
                            "value": "<@!" + auditlog.executor.id + "> (" + auditlog.executor.id + ")"
                        }
                    ]
                }
            ]
        )
    }

})

client.on('guildUnavailable', (guild) => {
    // Handler 
})

client.on('guildMemberUpdate', async (oldMember, newMember) => {

    //Änderung von Nicknamen | Change of nickname
    if (oldMember.nickname != newMember.nickname) {

        if (newMember.nickname != null) {
        	if (newMember.nickname.toString().toLowerCase() == "thejocraft") newMember.setNickname(null)
        }

        oldMember.nickname = (oldMember.nickname == null) ? oldMember.user.username + " **(Kein Nickname gesetzt)**" : oldMember.nickname
        newMember.nickname = (newMember.nickname == null) ? newMember.user.username + " **(Kein Nickname gesetzt)**" : newMember.nickname

        GLOBAL_WEBHOOKS.go(global.servers[newMember.guild.id].serverlog, [
                {
                    "title": "Ein User hat seinen Nickname verändert",
                    "color": global.colors.yellow,
                    "fields": [
                        {
                            "name": "Alter Nick",
                            "value": oldMember.nickname
                        },
                        {
                            "name": "Neuer Nick",
                            "value": newMember.nickname
                        },
                        {
                            "name": "User:",
                            "value": `<@${newMember.user.id}> (${newMember.user.id})`
                        }
                    ]
                }
            ]
        )
    }

    //Eintrag bei Vergabe/Entnahme von Niceones | Entry of assignment/take away of Niceones
    if (newMember.roles.cache != oldMember.roles.cache) {
        let fetchedAuditLog = await newMember.guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_ROLE_UPDATE'
        })
        if (oldMember.roles.cache.find(role => role.id == global.servers[newMember.guild.id].welcomerole)) {
            if (!newMember.roles.cache.find(role => role.id == global.servers[newMember.guild.id].welcomerole)) {
                GLOBAL_SQL.execute(SQL, "INDEX_MEMBERUPDATE_NONICEONE", "INSERT IGNORE INTO noniceones (id, serverid, timestamp) VALUES (?, ?, ?)", [newMember.id, newMember.guild.id, Date.now()])
                var seq = await GLOBAL_CASEID.generate(global)
                GLOBAL_SQL.execute(SQL, "INDEX_NONICEONE_CASEINSERT", "INSERT INTO cases (caseid, user, serverid, type, tags, reason, moderator, channel, timestamp, endTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [seq, newMember.user.id, newMember.guild.id, 'Entzug von Nice One', "Server", "Manueller Entzug der Rolle durch ein Mod", fetchedAuditLog.entries.first().executor.id, "", Date.now(), '0'])
                global.noniceones[newMember.id] = global.noniceones[newMember.id] + newMember.guild.id + ", "
            }
        }
        if (newMember.roles.cache.find(role => role.id == global.servers[newMember.guild.id].welcomerole)) {
            if (!oldMember.roles.cache.find(role => role.id == global.servers[newMember.guild.id].welcomerole)) {
                GLOBAL_SQL.execute(SQL, "INDEX_MEMBERUPDATE_NICEONE", "DELETE FROM noniceones WHERE id = ? AND serverid = ?", [newMember.id, newMember.guild.id])
                var seq = await GLOBAL_CASEID.generate(global)
                if (global.noniceones[newMember.id] != null) {
                    global.noniceones[newMember.id] = global.noniceones[newMember.id].replace(newMember.guild.id + ", ", "")
                }
            }
        }
    }

})

client.on("voiceStateUpdate", async (oldVoiceState, newVoiceState) => {
  if (newVoiceState.channel != null && newVoiceState.channel.id == serverdata.liveStream.voiceChat) {
        let channel = client.channels.cache.get(serverdata.liveStream.textChat)
        channel.permissionOverwrites.create(newVoiceState.member, {VIEW_CHANNEL: true, SEND_MESSAGES: true})
    } else if (oldVoiceState.channel != null && oldVoiceState.channel.id == serverdata.liveStream.voiceChat) {
        let channel = client.channels.cache.get(serverdata.liveStream.textChat)
        channel.permissionOverwrites.delete(oldVoiceState.member)
    }
});

client.on('threadCreate', async (thread) => {
    await thread.join() //Notwendig für moderative Zwecke | Needed for moderative purposes
})

client.on('messageCreate', (message) => {
    if (message.guild == null) return;
    if (message.member == null) return;
    AUTOMOD_LINKS.go(global, client, message, SQL)
    AUTOMOD_WORDS.go(global, client, message)
    //AUTOMOD_PROJEKTE.go(global, client, message)
    if (message.mentions.users.size + message.mentions.roles.size > 4) {
     
    }
    if (messageLogs[message.author.id] == null) {
        messageLogs[message.author.id] = JSON.parse("[\"" + Date.now() + "\"]")
    } else {
        messageLogs[message.author.id].push(Date.now().toString())
        if (messageLogs[message.author.id].length >= 5) {
            if (parseInt(messageLogs[message.author.id][messageLogs[message.author.id].length - 1]) - parseInt(messageLogs[message.author.id][(messageLogs[message.author.id].length - 5)]) < 20000) {
                let mute = global.config.automod.muteOnSpam
                let deleteMSG = global.config.automod.deleteSpamMessages
                if (mute) {
                    let role = client.guilds.cache.get(message.guild.id).roles.cache.find(role => role.name.toString().toLowerCase() === "muted")
                    let location = client.guilds.cache.get(message.guild)
                    mesage.member.roles.add(role)

                    var seq = GLOBAL_CASEID.generate(global)
                    let end = 1 * 60 * 60
                    var endTimestamp = (Date.now() + 1000 * end)


                    // Einträge in die benötigten Datenbank Tabellen einfügen | Insert entries into the required database tables
                    GLOBAL_SQL.execute(SQL, "BOT_MUTES_INSERT", "INSERT INTO mutes (intern, id, serverid, bereich, duration, timestamp) VALUES (?, ?, ?, ?, ?, ?)", [seq, message.author.id, message.guild.id, "Server", end, Date.now()])
                    GLOBAL_SQL.execute(SQL, "BOT_MUTE_CASE_INSERT", "INSERT INTO cases (caseid, user, serverid, type, tags,  reason, moderator, channel, timestamp, endTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [seq, message.author.id, message.guild.id, 'mute', "Server", "AutoMod - Spam", client.user.id, message.channel.id, Date.now(), endTimestamp])

                    //Chache den Mute in der globalen Variable | Cache the mute in the global variable
                    if (global.mutes[message.author.id] != undefined) {
                        global.mutes[message.author.id]["servers"].push(JSON.parse(message.guild.id.toString()))
                    } else {
                        global.mutes[message.author.id] = JSON.parse("{\"servers\": [\"" + message.guild.id.toString() + "\"]}")
                    }

                    //Sende dem User infos per DM | Send the user infos per DM
                    client.guilds.cache.get(message.guild.id).members.fetch(message.author.id).then(user => {
                        EXECUTER_REPLY.user(client, user, client.user, seq, "mute", "AutoMod - Spam", message.guild, endTimestamp)
                    })
                }

                if (deleteMSG) {
                    message.channel.bulkDelete(5)
                }

                messageLogs[message.author.id] = null
            }

            if (messageLogs[message.author.id] != null && messageLogs[message.author.id].length >= 10) messageLogs[message.author.id] = null

        }
    }
})

client.on('messageUpdate', (oldMessage, newMessage) => {

    if (oldMessage.guild == null) return;

    AUTOMOD_LINKS.go(global, client, newMessage, SQL)
    AUTOMOD_WORDS.go(global, client, newMessage)

    if(oldMessage.content == newMessage.content) return;
    if (oldMessage.content == "") oldMessage.content = " - kein Content - "

    GLOBAL_WEBHOOKS.go(global.servers[newMessage.guild.id].serverlog, [
            {
                "title": "Eine Nachricht wurde editiert",
                "description": "**Vorher:**\n```"+oldMessage.content.replaceAll("`", "\`")+"```\n\n**Nachher**:\n```"+newMessage.content.replaceAll("`", "\`")+"```",
                "color": global.colors.yellow,
                "fields": [
                    {
                        "name": "User:",
                        "value": `<@${oldMessage.author.id}> (${oldMessage.author.id})`
                    },
                    {
                        "name": "Channel:",
                        "value": `<#${oldMessage.channel.id}>`
                    }
                ]
            }
        ]
    )
})

client.on('messageDelete', (message) => {
    if (message.guild == null) return;
    let deleteReason = '';
    if (message.deleteReason != null) {
        deleteReason += "\n" + message.deleteReason;
    }
    if (message.content == "") message.content = " - kein Content - "
    GLOBAL_WEBHOOKS.go(global.servers[message.guild.id].serverlog, [
            {
                "title": "Eine Nachricht wurde gelöscht",
                "description": "```"+message.content.replaceAll("`", "\`")+"```" + deleteReason,
                "color": global.colors.red,
                "fields": [
                    {
                        "name": "User:",
                        "value": `<@${message.author.id}> (${message.author.id})`
                    },
                    {
                        "name": "Channel:",
                        "value": `<#${message.channel.id}>`
                    }
                ]
            }
        ]
    )
})


client.on('debug', (message) => {
    //console.log(message)
})

process.on('unhandledRejection', error => {
    // Will print "unhandledRejection err is not defined" to the console when the promise is rejected. | Schreibe "unhandledRejection err is not defined" auf die Konsole wenn die Promise verfehlt ist.
    GLOBAL_DEBUG.console("error", "unhandledRejection", error);
});


process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Node NOT Exiting...");
});




// Discord Log In | Login to Discord
client.login(global.config.botconfig.token);