const util = require('util');
const Events = require('events');

class KeyNotFoundError extends Error {
    constructor(sKey, sCollection) {
        super('Key "' + sKey + '" could not be found in collection "' + sCollection + '"');
        this.name = 'KeyNotFoundError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, KeyNotFoundError);
        }
    }
}

class RequiredPropertyError extends Error {
    constructor(sProp, sObject) {
        super('A required property "' + sProp + '" could not be found in object "' + sObject + '"');
        this.name = 'RequiredPropertyError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, KeyNotFoundError);
        }
    }
}

class MUDEngine {
    constructor() {
        this._events = new Events();
        this._state = {
            "strings": {
                "directions": {
                    "n": "nord",
                    "e": "est",
                    'w': "ouest",
                    "s": "sud",
                    "ne": "nord-est",
                    "nw": "nord-ouest",
                    "se": "sud-est",
                    "sw": "sud-ouest",
                    "an": "au nord",
                    "ae": "à l'est",
                    'aw': "à l'ouest",
                    "as": "au sud",
                    "ane": "au nord-est",
                    "anw": "au nord-ouest",
                    "ase": "au sud-est",
                    "asw": "au sud-ouest",
                    "vn": "vers le nord",
                    "ve": "vers l'est",
                    'vw': "vers l'ouest",
                    "vs": "vers le sud",
                    "vne": "vers le nord-est",
                    "vnw": "vers le nord-ouest",
                    "vse": "vers le sud-est",
                    "vsw": "vers le sud-ouest",
                },
                "events": {
                    "youAreIn": "Vous voici dans : %s.",
                    "walk": "Vous allez %s.",
                    "cannotWalk": "Vous ne pouvez pas aller %s.",
                    "picklockSuccess": "Vous réussissez à crocheter la serrure.",
                    "picklockFailed": "Vous ne parvenez pas à crocheter la serrure.",
                    "doorNotLocked": "Il n'y a pas de serrure sur cette porte.",
                    "doorHasCode": "Cette porte est verrouillée par un code secret.",
                    "doorInvalid": "Il n'y a pas de porte par ici.",
                    "doorSearchSuccess": "Vous découvrez une porte secrete.",
                    "doorSearchFailed": "Vous ne découvrez rien de caché.",
                    "doorSearchElsewhere": "Cherchez ailleurs, il y a déjà une issue visible ici.",
                    "roomPlayerArrived": "%s vient d'arriver dans la zone.",
                    "roomPlayerLeft": "%s s'éloigne %s.",
                    "roomPicklockSuccess": "%s vient de crocheter une serrure sur la porte située %s.",
                    "roomPicklockFailed": "%s ne parvient pas à crocheter une serrure sur la porte située %s.",
                },
                "nav": {
                    "doorLocked": "verrouillée",
                    "doorUnlockable": "vous avez la clé",
                    "doorCode": "par code secret",
                    "doorKey": "nécessite: %s",
                    "doorLockable": "déverrouillée"
                }
            },
            "entities": {},
            "data": {},
            "items": {
                "item::k3011": {
                    "type": "item",
                    "subtype": "key",
                    "name": "Clé du bureau 3011",
                    "desc": "Une petite clé plate sur laquelle est inscrit le nombre 3011"
                }
            },
            "rooms": {
                "room::b3009": {
                    "name": "Bureau 3009",
                    "desc": [
                        "Le bureau 3009 contient quelques mobiliers de travail espacés les uns aux autres.",
                        "De nombreux écrans sont posés sur les meubles."
                    ],
                    "nav": {
                        "e": {
                            "to": "room::c3000b",
                            "desc": "Une porte donnant sur le couloir"
                        }
                    }
                },
                "room::b3010": {
                    "name": "Bureau 3010",
                    "desc": [
                        "Le bureau 3010 contient plusieurs mobiliers de travail collés les uns aux autres.",
                        "De nombreux écrans sont posés sur les meubles. Un poster de Misa est accroché au mur.",
                        "On voit une table sur laquelle est posée une machine à café"
                    ],
                    "nav": {
                        "e": {
                            "to": "room::c3000c",
                            "desc": "Une porte donnant sur le couloir"
                        }
                    }
                },
                "room::b3011": {
                    "name": "Bureau 3011",
                    "desc": [
                        "Le bureau 3011 est une petite pièce ne contenant qu'une seule table de travail."
                    ],
                    "nav": {
                        "e": {
                            "to": "room::c3000d",
                            "desc": "Une porte donnant sur le couloir"
                        }
                    }
                },
                "room::c3000b": {
                    "name": "Couloir 3000 nord",
                    "desc": [
                        "Un couloir sombre qui s'étend du nord au sud. Une porte située dans le mur Ouest mène à un bureau.",
                        "Au nord le couloir est plongé dans l'obscurité, il n'y a rien à faire là bas. Au sud le couloir continue, faiblement éclairé."
                    ],
                    "nav": {
                        "s": {
                            "to": "room::c3000c",
                            "desc": "Le couloir continue vers le sud"
                        },
                        "w": {
                            "to": "room::b3009",
                            "desc": "Une porte menant au bureau 3009"
                        },
                        "se": {
                            "secret": {
                                "difficulty": 1
                            },
                            "desc": "Une porte encastrée dans le mur Est au Sud de votre position.",
                            "to": "room::t3000b"
                        }
                    }
                },
                "room::t3000b": {
                    "name": "Les toilettes",
                    "desc": [
                        "Des toilettes !"
                    ],
                    "nav": {
                        "nw": {
                            "desc": "Une issue qui retourne dans le couloir.",
                            "to": "room::c3000b"
                        }
                    }
                },
                "room::c3000c": {
                    "name": "Couloir 3000 centre",
                    "desc": [
                        "Un couloir sombre qui s'étend du nord au sud. Une porte située dans le mur Ouest mène à un bureau.",
                        "D'autres portes sont visibles vers le nord et vers le sud."
                    ],
                    "nav": {
                        "n": {
                            "to": "room::c3000b",
                            "desc": "Le couloir poursuit au nord."
                        },
                        "s": {
                            "to": "room::c3000d",
                            "desc": "Le couloir poursuit au sud"
                        },
                        "w": {
                            "to": "room::b3010",
                            "desc": "Une porte menant au bureau 3010",
                            "lock": {
                                "code": "1234",
                                "locked": true
                            }
                        }
                    }
                },
                "room::c3000d": {
                    "name": "Couloir 3000 sud",
                    "desc": [
                        "Un couloir sombre qui s'étend du nord au sud. Une porte située dans le mur Ouest mène à un bureau.",
                        "D'autres portes sont visibles vers le nord, tandis qu'au sud, le couloir est plongé dans le noir."
                    ],
                    "nav": {
                        "n": {
                            "to": "room::c3000c",
                            "desc": "Le couloir continue vers le nord"
                        },
                        "w": {
                            "to": "room::b3011",
                            "desc": "Une porte menant au bureau 3011",
                            "lock": {
                                "difficulty": 3,
                                "key": "item::k3011",
                                "locked": true
                            }
                        }
                    }
                }
            }
        }
    }

    getString (sPath) {
        try {
            return sPath.split('.').reduce((prev, curr) => prev[curr], this._state.strings).substr(0);
        } catch (e) {
            throw new KeyNotFoundError(sPath, 'strings');
        }
    }

    get events () {
        return this._events;
    }

    getPlayerId (id) {
        return 'player::' + id;
    }

    createNewPlayer(id, sName) {
        const idPlayer = this.getPlayerId(id);
        const oPlayer = this._state.entities[idPlayer] = {
            type: 'player',
            id,
            name: sName,
            location: '',
            inventory: [
                'item::k3011xx'
            ],
            skills: {
                spot: 5,
                picklock: 5
            },
            spotted: {}
        };
        const idRoom = 'room::b3009';
        this.setEntityLocation(idPlayer, 'room::b3009');
        const oRoom = this.getRoom(idRoom);
        this.notifyPlayerEvent(idPlayer, '$events.youAreIn', oRoom.name);
        this.notifyRoomEvent(idRoom, idPlayer, '$events.roomPlayerArrived', oPlayer.name, oRoom.name);
    }

    /**
     * Indique si un joueur possède un objet
     * @param idPlayer {string} identifiant joueur
     * @param sItemRef {string} refrence objet recherché
     * @returns {boolean}
     */
    isPlayerPossessingItem(idPlayer, sItemRef) {
        const oPlayer = this._state.entities[idPlayer];
        return oPlayer.inventory.includes(sItemRef);
    }

    getPlayerRoom (idPlayer) {
        const oPlayer = this.getPlayer(idPlayer);
        const idRoom = oPlayer.location;
        return this.getRoom(idRoom);
    }

    getEntity (idEntity) {
        const oEntity = this._state.entities;
        if (idEntity in oEntity) {
            return oEntity[idEntity];
        } else {
            throw new KeyNotFoundError(idEntity, 'entities');
        }
    }

    getPlayer (idPlayer) {
        return this.getEntity(idPlayer);
    }

    getRoom (idRoom) {
        const oRooms = this._state.rooms;
        if (idRoom in oRooms) {
            return oRooms[idRoom];
        } else {
            throw new KeyNotFoundError(idRoom, 'rooms');
        }
    }

    /**
     * Renvoie le code technique d'une issue secrete
     * @param idRoom {string} identifiant dans la pièce ou se trouve l'issue
     * @param sDirection {string} direction
     * @returns {string}
     */
    getSecretId (idRoom, sDirection) {
        return idRoom + '::' + sDirection;
    }

    setLocalData (id, sVariable, value) {
        const idVariable = id + '::' + sVariable;
        this._state.data[idVariable] = value;
    }

    getLocalData (id, sVariable) {
        const idVariable = id + '::' + sVariable;
        return this._state.data[idVariable];
    }

//  ____                                         _   _  __
// |  _ \  ___   ___  _ __ ___    __ _ _ __   __| | | |/ /___ _   _ ___
// | | | |/ _ \ / _ \| '__/ __|  / _` | '_ \ / _` | | ' // _ \ | | / __|
// | |_| | (_) | (_) | |  \__ \ | (_| | | | | (_| | | . \  __/ |_| \__ \
// |____/ \___/ \___/|_|  |___/  \__,_|_| |_|\__,_| |_|\_\___|\__, |___/
//                                                            |___/

    getDoor (idRoom, sDirection) {
        const oRoom = this.getRoom(idRoom);
        return oRoom.nav[sDirection];
    }

    /**
     * indique si le joueur a été détecté la direction donnée dans la pièce ou il se trouve
     * @param idPlayer {string} identifiant joueur
     * @param sDirection {string} direction
     * @returns {boolean}
     */
    hasPlayerSpottedDoor (idPlayer, sDirection) {
        const oPlayer = this.getPlayer(idPlayer);
        return this.getSecretId(oPlayer.location, sDirection) in oPlayer.spotted;
    }

    setPlayerDoorSpotted (idPlayer, sDirection, value) {
        const oPlayer = this.getPlayer(idPlayer);
        const sId = this.getSecretId(oPlayer.location, sDirection);
        if (value) {
            oPlayer.spotted[sId] = true;
        } else if (this.hasPlayerSpottedDoor(idPlayer, sDirection)) {
            delete oPlayer.spotted[sId];
        }
    }

    isDoorSecret (idRoom, sDirection) {
        const oDoor = this.getDoor(idRoom, sDirection);
        if (oDoor) {
            return 'secret' in oDoor;
        } else {
            return false;
        }
    }

    /**
     * Renvoie les renseignment concernant une porte
     * @param idPlayer {string} identifiant joueur
     * @param sDirection {string} direction de la porte
     * @returns {{valid: boolean, difficulty: number, code: string, visible: boolean, secret: boolean, locked: boolean, key: string}}
     */
    getPlayerDoorStatus (idPlayer, sDirection) {
        const idRoom = this.getPlayer(idPlayer).location;
        const oDoor = this.getDoor(idRoom, sDirection);
        const valid = oDoor !== undefined;
        const oStatus = {
            valid,
            lockable: false,
            locked: false,
            dcPicklock: 0,
            key: '',
            code: '',
            secret: false,
            dcSearch: 0,
            visible: false,
            destination: ''
        };
        if (valid) {
            oStatus.lockable = 'lock' in oDoor;
            if (oStatus.lockable) {
                const oDoorLock = oDoor.lock;
                oStatus.locked = oStatus.lockable && oDoorLock.locked;
                oStatus.dcPicklock = oStatus.lockable && oDoorLock.difficulty || 0;
                oStatus.key = oDoorLock.key || '';
                oStatus.code = oDoorLock.code || '';
            }
            oStatus.secret = this.isDoorSecret(idRoom, sDirection);
            oStatus.visible = oStatus.secret && this.hasPlayerSpottedDoor(idPlayer, sDirection) || !oStatus.secret;
            oStatus.destination = oDoor.to;
        }
        return oStatus;
    }

    /**
     * Renvoie la structure de la serrure d'une porte
     * @param idRoom {string} identifiant pièce
     * @param sDirection {string} direction
     * @returns {*}
     */
    getDoorLock (idRoom, sDirection) {
        const oDoor = this.getDoor(idRoom, sDirection);
        return !!oDoor && ('lock' in oDoor) ? oDoor.lock : null;
    }

    /**
     * Verrouille/deverrouille la porte
     * la porte doit exister sinon aucun effet.
     * @param idRoom {string} identifiant de la pièce
     * @param sDirection {string} destination
     * @param value {boolean} true: verrouillé / false: déverrouillé
     */
    setDoorLocked (idRoom, sDirection, value) {
        const oLock = this.getDoorLock(idRoom, sDirection);
        if (oLock) {
            oLock.locked = value;
        }
    }

    /**
     * Détermine la value d'un skill d'un joueur
     * @param idPlayer {string} identifiant joueur
     * @param sSkill {string} nom du skill
     */
    getPlayerSkill (idPlayer, sSkill) {
        const oPlayer = this.getPlayer(idPlayer);
        const oSkills = oPlayer.skills;
        return sSkill in oSkills ? oSkills[sSkill] : 0;
    }

    getRoomEntities (idRoom) {
        const oRoom = this.getRoom(idRoom);
        if (!('entities' in oRoom)) {
            oRoom.entities = {};
        }
        return oRoom.entities;
    }

    addRoomEntity (idRoom, idEntity) {
        this.getRoomEntities(idRoom)[idEntity] = true;
    }

    removeRoomEntity (idRoom, idEntity) {
        delete this.getRoomEntities(idRoom)[idEntity];
    }

    setEntityLocation (idEntity, idRoom) {
        if (idRoom in this._state.rooms) {
            const oEntity = this.getEntity(idEntity);
            const idPrevRoom = oEntity.location;
            oEntity.location = idRoom;
            if (idPrevRoom in this._state.rooms) {
                this.removeRoomEntity(idPrevRoom, idEntity);
            }
            this.addRoomEntity(idRoom, idEntity);
        } else {
            throw new KeyNotFoundError(idRoom, 'rooms');
        }
    }

    getEntityLocation (idPlayer) {
        return this.getPlayer(idPlayer).location;
    }

    _mapParameters (x) {
        if (Array.isArray(x)) {
            return x.map(p => this._mapParameters(p))
        } else {
            if (x.startsWith('$')) {
                return this.getString(x.substr(1));
            } else {
                return x;
            }
        }
    }

    notifyPlayerEvent (idPlayer, sEvent, ...params) {
        const aModParams = this._mapParameters(params);
        const sModEvent = this._mapParameters(sEvent);
        const oPlayer = this.getPlayer(idPlayer);
        this._events.emit('player-event', { id: oPlayer.id, message: util.format(sModEvent, ...aModParams)});
    }

    notifyRoomEvent (idRoom, idPlayer, sEvent, ...params) {
        const aModParams = this._mapParameters(params);
        const sModEvent = this._mapParameters(sEvent);
        const aPlayers = this.getPlayersInRoom(idRoom);
        aPlayers.forEach(p => {
            if (p !== idPlayer) {
                const oPlayer = this.getPlayer(p);
                this._events.emit('player-event', { id: oPlayer.id, message: util.format(sModEvent, ...aModParams)});
            }
        })
    }

    /**
     * Produit une chaine affichage pour rendre compte de l'état d'une des issues d'une pièces
     * @param idRoom {string} identifiant de la pièce contenant la porte
     * @param sDirection {string} direction de l'issue
     * @returns {string}
     */
    renderDoor (idRoom, sDirection, oDoorStatus) {
        const sDirStr = this.getString('directions.v' + sDirection);
        const oDoor = this.getDoor(idRoom, sDirection);
        const a = [
            ' [' + sDirection + ']',
            sDirStr.charAt(0).toUpperCase() + sDirStr.substr(1),
            ':',
            oDoor.desc
        ];
        const b = [];
        if (oDoorStatus.locked) {
            b.push(this.getString('nav.doorLocked'));
            const sKey = oDoorStatus.key;
            if (sKey) {
                b.push(util.format(this.getString('nav.doorKey'), this._state.items[sKey].name));
            }
            const sCode = oDoorStatus.code;
            if (sCode !== '') {
                b.push(this.getString('nav.doorCode'));
            }
        } else if (oDoorStatus.lockable && oDoorStatus.key) {
            b.push(this.getString('nav.doorLockable'));
        }
        if (b.length > 0) {
            a.push('(' + b.join(', ') + ')');
        }
        return a.join(' ');
    }

    /**
     * produit un tableau de chaine décrivant la situation visuelle actuelle du joueur
     * @param idPlayer {string} identifiant joueur
     * @returns {string[]}
     */
    renderPlayerVisualReport (idPlayer) {
        const oPlayer = this.getEntity(idPlayer);
        const idRoom = oPlayer.location;
        const oRoom = this.getRoom(idRoom);
        const aOutput = [
            oRoom.name,
            ...oRoom.desc
        ];
        for (const sDirection in oRoom.nav) {
            const oDoorStatus = this.getPlayerDoorStatus(idPlayer, sDirection);
            if (oDoorStatus.visible) {
                aOutput.push(this.renderDoor(idRoom, sDirection, oDoorStatus));
            }
        }
        return aOutput;
    }

    /**
     * Obenir la liste des joueur dans une pièce
     * @param idRoom
     */
    getPlayersInRoom (idRoom) {
        const oEntities = this.getRoomEntities(idRoom);
        const aPlayers = [];
        for (const id in oEntities) {
            if (oEntities.type === 'player') {
                aPlayers.push(id);
            }
        }
        return aPlayers;
    }

    // /**
    //  * Déplace le joueur d'une pièce à une autre en utilisant la direction donnée
    //  * @param idPlayer {string} idenfiant joueur
    //  * @param sDirection {string} direction voulue
    //  */
    // actionPlayerMove (idPlayer, sDirection) {
    //     const { valid, visible, locked, destination } = this.getPlayerDoorStatus(idPlayer, sDirection);
    //     if (valid && visible && !locked) {
    //         this.notifyPlayerEvent(idPlayer, '$events.walk', '$directions.v' + sDirection);
    //         const oPlayer = this.getPlayer(idPlayer);
    //         this.notifyRoomEvent(oPlayer.location, idPlayer, '$events.roomPlayerLeft', oPlayer.name,'$directions.v' + sDirection);
    //         this.setEntityLocation(idPlayer, destination);
    //         this.notifyRoomEvent(oPlayer.location, idPlayer, '$events.roomPlayerArrived', oPlayer.name);
    //     } else {
    //         this.notifyPlayerEvent(idPlayer, '$events.cannotWalk', '$directions.v' + sDirection);
    //     }
    // }

    /**
     * Le joueur va tenter de crocheter une serrure de porte
     * @param idPlayer
     * @param sDirection
     */
    actionPlayerPicklock (idPlayer, sDirection) {
        const oPlayer = this.getPlayer(idPlayer);
        const idRoom = oPlayer.location;
        const { valid, locked, dcPicklock, code } = this.getPlayerDoorStatus(idPlayer, sDirection);
        if (!valid) {
            this.notifyPlayerEvent(idPlayer, '$events.doorInvalid');
            return
        }
        if (code) {
            this.notifyPlayerEvent(idPlayer, '$events.doorHasCode');
            return;
        }
        if (!locked) {
            this.notifyPlayerEvent(idPlayer, '$events.doorNotLocked');
            return;
        }
        const nSkill = this.getPlayerSkill(idPlayer, 'picklock');
        if (nSkill >= dcPicklock) {
            this.notifyPlayerEvent(idPlayer, '$events.picklockSuccess');
            this.notifyRoomEvent(idRoom, idPlayer, '$events.roomPicklockSuccess', oPlayer.name, '$directions.v' + sDirection);
            this.setDoorLocked(idRoom, sDirection, false);
        } else {
            this.notifyPlayerEvent(idPlayer, '$events.picklockFailed');
            this.notifyRoomEvent(idRoom, idPlayer, '$events.roomPicklockFailed', oPlayer.name, '$directions.v' + sDirection);
        }
    }

    /**
     * Le joueur tente de rechercher les issues secretes
     * @param idPlayer
     */
    actionPlayerSearch (idPlayer, sDirection) {
        const nSkill = this.getPlayerSkill(idPlayer, 'spot');
        const { valid, secret, visible, dcSearch } = this.getPlayerDoorStatus(idPlayer, sDirection);
        if (!valid) {
            this.notifyPlayerEvent(idPlayer, '$events.doorSearchFailed');
        }
        if (visible) {
            this.notifyPlayerEvent(idPlayer, '$events.doorSearchElsewhere');
        }
        if (secret && nSkill >= dcSearch) {
            this.setPlayerDoorSpotted(idPlayer, sDirection, true);
            this.notifyPlayerEvent(idPlayer, '$events.doorSearchSuccess');
        }
    }
}

module.exports = MUDEngine;
