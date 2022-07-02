var INTERVALMANAGER = {}

const MUTETIMER = require("./MUTETIMER.js")

INTERVALMANAGER.go = function (client, SQL, global) {
    // Automutecheck alle 30 sec | Automutecheck alle 30 sec
    MUTETIMER.go(SQL, client, global)
}

module.exports = INTERVALMANAGER;