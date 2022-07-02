var GLOBAL_DEBUG = {};

// Rufe die THOW-Function auf | Call the THROW-Function
const GLOBAL_THROW = require("./THROW.js")

// Console kann eingefärbt werden | Console can be colored
const NPM_COLORS = require("colors/safe")

GLOBAL_DEBUG.console = function(type, identifier, message) {
    if(!identifier){identifier = "none"}
    if(!message){message = "none"}

    switch(type){
        case "log":
            console.log("\n============ INFO ============")
            console.log("> " + identifier)
            console.log(">> " + message)
            console.log("============ INFO ============\n")
            return true;
            break;
        case "warn":
            console.log(NPM_COLORS.yellow("\n============") + NPM_COLORS.brightYellow(" WARN ") + NPM_COLORS.yellow("============"))
            console.log(NPM_COLORS.yellow("> ") + NPM_COLORS.brightYellow(identifier))
            console.log(NPM_COLORS.yellow(">> ") + NPM_COLORS.brightYellow(message))
            console.log(NPM_COLORS.yellow("============") + NPM_COLORS.brightYellow(" WARN ") + NPM_COLORS.yellow("============\n"))
            return true;
            break;
        case "error":
            console.log(NPM_COLORS.red("\n===========") + NPM_COLORS.brightRed(" ERROR ") + NPM_COLORS.red("==========="))
            console.log(NPM_COLORS.red("> ") + NPM_COLORS.brightRed(identifier))
            console.log(NPM_COLORS.red(">> ") + NPM_COLORS.brightRed(message))
            console.log(NPM_COLORS.red("===========") + NPM_COLORS.brightRed(" ERROR ") + NPM_COLORS.red("===========\n"))
            return true;
            break;
        default:
            GLOBAL_THROW.go("GLOBAL_DEBUG", "unknown type. must be 'log', 'warn' or 'error'.")
    }
}

module.exports = GLOBAL_DEBUG