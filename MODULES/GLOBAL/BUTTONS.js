var GLOBAL_BUTTONS = {};

const GLOBAL_THROW = require("./THROW.js") // Rufe die THOW-Function auf | Call the THROW-Function
const GLOBAL_DEBUG = require("./DEBUG.js") // Rufe die DEBUG-Function auf | Call the DEBUG-Function

GLOBAL_BUTTONS.generate = function(global, interaction, name, buttons, data) {

    // set var for components | set var for components
    var components = []

    // Generate ID | Generate ID
    var id = "#" + makeid(3) + Date.now() + makeid(3)

    // Generate Code for return | Generate Code for return
    for(i = 0; i < buttons.length; i++){
        components.push({
            "type": 2,
            "label": buttons[i].name,
            "style": buttons[i].style,
            "disabled": buttons[i].disabled,
            "custom_id": (buttons[i].style == 5) ? null : id + i,
            "url": (buttons[i].style != 5) ? null: buttons[i].url,
            "emoji": (typeof(buttons[i].emoji) == "undefined") ? null : buttons[i].emoji
        })
    }

    // Cache Data 
    var cache = {}
    cache.info = {}
    cache.info.name = name;
    cache.info.id = id;
    cache.data = data;
    global.cache.buttons[id] = cache

    // Return Code Component | Return Code Component
    return [
        {
            "type": 1,
            "components": components
        }
    ]
}

// Return cached Code | Return cached Code
GLOBAL_BUTTONS.getcache = function(global, data) {
    return global.cache.buttons[data]
}

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeid(make) {
    var length = make;
    var result           = [];
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result.push(characters.charAt(Math.floor(Math.random() * 
 charactersLength)));
   }
   return result.join('');
}

module.exports = GLOBAL_BUTTONS