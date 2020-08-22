'use strict'

class PlayerListEntry {

    /** @type {UUID} */
    uuid
    /** @type {number} */
    uniqueEntityId
    /** @type {string} */
    name
    /** @type {string} */
    xuid
    /** @type {string} */
    platformChatId
    /** @type {number} */
    buildPlatform
    /** @type {Skin} */
    skin
    /** @type {boolean} */
    teacher
    /** @type {boolean} */ 
    host

}
module.exports = PlayerListEntry