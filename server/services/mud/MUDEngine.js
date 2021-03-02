const util = require('util');
const Events = require('events');
const DiscardableRegistry = require('../../../libs/discardable-registry');

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
        this._lastId = 0;
        this._localIdRegs = {
            i: new DiscardableRegistry('i'), // les objets d'inventaire
            p: new DiscardableRegistry('p'), // les joueurs
            o: new DiscardableRegistry('o'), // les objets placables
            c: new DiscardableRegistry('c')  // les créature et pnj
        };
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
                    "lookAround": "Vous regardez autour de vous.",
                    "lookEntity": "Vous examinez %s.",
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
                    "roomEntityCreated": "%s vient d'apparaitre !",
                    "roomEntityDestroyed": "%s vient de disparaître !"
                },
                "nav": {
                    "doorLocked": "verrouillée",
                    "doorUnlockable": "vous avez la clé",
                    "doorCode": "par code secret",
                    "doorKey": "nécessite: %s",
                    "doorLockable": "déverrouillée"
                },
                "errors": {
                    "invalidPlayerName": "Ce nom est invalide. Un nom doit comporter entre 2 et 20 caractères sans espace."
                },
                "ui": {
                    "visualDescExits": "Issues",
                    "visualDescObjects": "Objets",
                    "visualDescCreatures": "Personnages",
                    "visualDescNoObject": "Aucun objet visible.",
                    "visualDescNoCreature": "Aucun personnage visible.",
                    "visualDescOtherPlayers": "Joueurs",
                    "descFieldName": "Nom",
                    "descFieldType": "Type",
                    "descFieldWeight": "Poids"
                }
            },
            "entities": {},
            "data": {},
            "blueprints": {
                "blueprint::k3011": {
                    "type": "item",
                    "subtype": "key",
                    "name": "Clé du bureau 3011",
                    "desc": [
                        "Une petite clé plate sur laquelle est inscrit le nombre 3011"
                    ],
                    "weight": 0.1
                }
            },
            "sectors": {
                "sector::0001": {
                    "name": "Premier secteur",
                    "desc": [
                      "Cet ensemble de couloirs et bureaux constitue le premier secteur jamais construit sur ce MUD.",
                      "C'est pourquoi il semble si ennuyeux à explorer"
                    ]
                }
            },
            "rooms": {
                "room::b3009": {
                    "name": "Bureau 3009",
                    "sector": "sector::0001",
                    "desc": [
                        "Le bureau 3009 contient quelques mobiliers de travail espacés les uns aux autres.",
                        "De nombreux écrans sont posés sur les meubles."
                    ],
                    "nav": {
                        "e": {
                            "to": "room::c3000b",
                            "desc": "Une porte donnant sur le couloir"
                        }
                    },
                    "defaultEntities": [
                        {
                            "blueprint": "blueprint::k3011"
                        }
                    ]
                },
                "room::b3010": {
                    "name": "Bureau 3010",
                    "sector": "sector::0001",
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
                    "sector": "sector::0001",
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
                    "sector": "sector::0001",
                    "desc": [
                        "Le couloir est faiblement éclairé par une seule lampe située au sud, et une porte s'ouvre sur le mur est.",
                        "Au nord le couloir plonge dans l'obscurité, il n'est pas necessaire d'y aller."
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
                    "sector": "sector::0001",
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
                    "sector": "sector::0001",
                    "desc": [
                      "Le couloir est éclairé par la seule lampe que vous pouvez voir, cette lampe est fixée au plafont précisément en face d'une porte s'ouvrant sur le mur est."
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
                    "sector": "sector::0001",
                    "desc": [
                        "Le couloir est faiblement éclairé par une seule lampe située au nord, et une porte s'ouvre sur le mur est.",
                        "Au sud le couloir plonge dans l'obscurité et on ne distingue absolument rien au delà de quelques mètres."
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

    /**
     * Renvoie la chaine de caractère dont l'identifiant est passé en paramètre
     * remplace les %s par les aute paramètre passés lors de l'appel de fonction
     * @param sPath {string} identifiant de la chaine
     * @param params {*} des paramètre de substitution optionnels
     * @returns {string}
     */
    getString (sPath, ...params) {
        try {
            const sString = sPath.split('.').reduce((prev, curr) => prev[curr], this._state.strings).substr(0);
            return util.format(sString, ...params);
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

    /**
     * Création d'un nouveau personnage joueur
     * @param id {string} identifiant externe (désigné par l'appli cliente) qui sera transformé en identifiant internet au mud
     * @param sName
     * @returns {string|null}
     */
    createNewPlayer(id, sName, sLocation) {
        // verifier si le nom est valide
        if (!sName.match(/^\S{2,20}$/)) {
            return null;
        }
        const idPlayer = this.getPlayerId(id);
        const oPlayer = this._state.entities[idPlayer] = {
            type: 'player',
            id,
            name: sName,
            location: '', // localisation (pièce) du joueur
            sector: '', // indique le secteur dans lequel le joueur est.
            inventory: [],
            skills: {
                spot: 5,
                picklock: 5
            },
            spotted: {}
        };
        this.setEntityLocation(idPlayer, sLocation);
        const oRoom = this.getRoom(sLocation);
        this.notifyPlayerEvent(idPlayer, '$events.youAreIn', oRoom.name);
        this.notifyRoomEvent(sLocation, idPlayer, '$events.roomPlayerArrived', oPlayer.name);
        this.notifyAdminEvent('new player %s spawned at %s', oPlayer.name, oRoom.name);
        return idPlayer;
    }

    getEntityBlueprint (idEntity) {
        return this.getEntity(idEntity).blueprint;
    }

    createEntity (sBlueprint, sLocation, nCount = 1) {
        ++this._lastId;
        const idEntity = 'entity::' + this._lastId;
        const oBlueprint = this.getBlueprint(sBlueprint);
        const oEntity = this._state.entities[idEntity] = {
            blueprint: oBlueprint,
            name: oBlueprint.name,
            type: oBlueprint.type,
            subtype: oBlueprint.subtype,
            count: nCount,
            location: ''
        };
        this.setEntityLocation(idEntity, sLocation);
        this.notifyAdminEvent('new entity %s (x%s) created at %s', oEntity.name, nCount, sLocation);
        return idEntity;
    }

    /**
     * destruction d'une entité
     * @param idEntity
     */
    destroyEntity (idEntity) {
        const oEntities = this._state.entities;
        if (idEntity in oEntities) {
            const oEntity = this._state.entities[idEntity];
            const idRoom = this.getEntityLocation(idEntity);
            this.notifyRoomEvent(idRoom, idEntity, '$events.roomEntityDestroyed', oEntity.name);
            this.removeRoomEntity(idRoom, idEntity);
            delete oEntities[idEntity];
        }
    }

    getBlueprint (idBlueprint) {
        if (idBlueprint in this._state.blueprints) {
            return this._state.blueprints[idBlueprint];
        } else {
            throw new KeyNotFoundError(idBlueprint, 'blueprints');
        }
    }

    getEntity (idEntity) {
        const oEntity = this._state.entities;
        if (idEntity in oEntity) {
            return oEntity[idEntity];
        } else {
            throw new KeyNotFoundError(idEntity, 'entities');
        }
    }

    getRoomLocalEntity (idRoom, lid) {
        const oFoundEntity = this
            .getRoomEntities(idRoom)
            .find(e => e.lid === lid);
        if (oFoundEntity && this.getEntityLocation(oFoundEntity.id)) {
            return this.getEntity(oFoundEntity.id);
        } else {
            return null;
        }
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
        const oPlayer = this.getEntity(idPlayer);
        return this.getSecretId(oPlayer.location, sDirection) in oPlayer.spotted;
    }

    setPlayerDoorSpotted (idPlayer, sDirection, value) {
        const oPlayer = this.getEntity(idPlayer);
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
        const idRoom = this.getEntity(idPlayer).location;
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
        const oPlayer = this.getEntity(idPlayer);
        const oSkills = oPlayer.skills;
        return sSkill in oSkills ? oSkills[sSkill] : 0;
    }

    getRoomEntityStorage(idRoom) {
        const oRoom = this.getRoom(idRoom);
        if (!('entities' in oRoom)) {
            oRoom.entities = {};
            // on a profite pour coller tous les objet par default
            const aDefaultEntities = oRoom.defaultEntities;
            if (aDefaultEntities) {
                aDefaultEntities.forEach(({ blueprint, count = 1 }) => {
                    this.createEntity(blueprint, idRoom, count);
                });
            }
        }
        return oRoom.entities;
    }

    /**
     * Renvoie la liste des entité présente dans la pièce spécifiée
     * @param idRoom {string} identifiant de la pièce
     * @param sType {string|null} un type d'objet à filter
     * @returns {array}
     */
    getRoomEntities (idRoom, sType = null) {
        const oEntities = this.getRoomEntityStorage(idRoom);
        const aEntities = [];
        for (let idEntity in oEntities) {
            const lid = oEntities[idEntity];
            const i = parseInt(lid.substr(1));
            if (sType) {
                const oEntity = this.getEntity(idEntity);
                if (oEntity.type === sType) {
                    aEntities.push({ id: idEntity, lid, i });
                }
            } else {
                aEntities.push({ id: idEntity, lid, i });
            }
        }
        return aEntities.sort((a, b) => a.i - b.i);
    }

    /**
     * Ajoute une entity au registre des entités de la pièce
     * attribu un numéro d'identification local
     * @param idRoom {string} identifiant pièce
     * @param idEntity {string} identifiant entité
     */
    addRoomEntity (idRoom, idEntity) {
        // déterminer le type d'une entité
        const oEntity = this.getEntity(idEntity);
        const sType = oEntity.type;
        const sMiniType = sType.charAt(0).toLowerCase();
        this.getRoomEntityStorage(idRoom)[idEntity] = this._localIdRegs[sMiniType].getId();
    }

    /**
     * Suprime une entity du registre des entités de la pièce
     * @param idRoom {string} identifiant pièce
     * @param idEntity {string} identifiant entité
     */
    removeRoomEntity (idRoom, idEntity) {
        const lid = this.getRoomEntityStorage(idRoom)[idEntity];
        const sMiniType = lid.charAt(0).toLowerCase();
        this._localIdRegs[sMiniType].disposeId(lid);
        delete this.getRoomEntityStorage(idRoom)[idEntity];
    }

    /**
     * Change la localisation d'une entité
     * @param idRoom {string} identifiant pièce
     * @param idEntity {string} identifiant entité
     */
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

    /**
     * Obtient la localisation d'une entité
     * @param idEntity
     * @returns {*}
     */
    getEntityLocation (idEntity) {
        return this.getEntity(idEntity).location;
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
        const oPlayer = this.getEntity(idPlayer);
        this._events.emit('player-event', { id: oPlayer.id, message: util.format(sModEvent, ...aModParams)});
    }

    notifyRoomEvent (idRoom, idPlayer, sEvent, ...params) {
        const aModParams = this._mapParameters(params);
        const sModEvent = this._mapParameters(sEvent);
        const aPlayers = this.getRoomEntities(idRoom, 'player');
        aPlayers.forEach(({ id } ) => {
            if (id !== idPlayer) {
                const oPlayer = this.getEntity(id);
                this._events.emit('other-player-event', { id: oPlayer.id, message: util.format(sModEvent, ...aModParams)});
            }
        })
    }

    notifyAdminEvent (sEvent, ...params) {
        this._events.emit('admin-event', {message: util.format(sEvent, ...params)});
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
            '● [' + sDirection + ']',
            sDirStr.charAt(0).toUpperCase() + sDirStr.substr(1),
            ':',
            oDoor.desc
        ];
        const b = [];
        if (oDoorStatus.locked) {
            b.push(this.getString('nav.doorLocked'));
            const sKey = oDoorStatus.key;
            if (sKey) {
                b.push(this.getString('nav.doorKey', this._state.items[sKey].name));
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
     * Affiche une description du secteur actuellement occupé par le joueur
     * @param idPlayer
     */
    renderPlayerSector (idPlayer) {
        const oPlayer = this.getEntity(idPlayer);
        const idRoom = oPlayer.location;
        const oRoom = this.getRoom(idRoom);
        const aOutput = [];
        // secteur
        // afficher les info du secteur : le joueur viens d'y pénétrer
        const oSector = this._state.sectors[oRoom.sector];
        aOutput.push('{imp ' + oSector.name + '}', ...oSector.desc);
        return aOutput;
    }

    renderPlayerRoom (idPlayer) {
        const oPlayer = this.getEntity(idPlayer);
        const idRoom = oPlayer.location;
        const oRoom = this.getRoom(idRoom);
        const aOutput = [];
        // description de la pièces
        aOutput.push('{imp ' + oRoom.name + '}', ...oRoom.desc);
        return aOutput;
    }

    renderPlayerExits (idPlayer) {
        const oPlayer = this.getEntity(idPlayer);
        const idRoom = oPlayer.location;
        const oRoom = this.getRoom(idRoom);
        const aOutput = [];
        // issues
        aOutput.push('{imp ' + this.getString('ui.visualDescExits') + '}');
        for (const sDirection in oRoom.nav) {
            const oDoorStatus = this.getPlayerDoorStatus(idPlayer, sDirection);
            if (oDoorStatus.visible) {
                aOutput.push(this.renderDoor(idRoom, sDirection, oDoorStatus));
            }
        }
        return aOutput;
    }

    renderPlayerItemsInRoom (idPlayer) {
        const oPlayer = this.getEntity(idPlayer);
        const idRoom = oPlayer.location;
        const aItems = this.getRoomEntities(idRoom, 'item');
        const aOutput = [];
        for (let { id, lid } of aItems) {
            const { name } = this.getEntity(id);
            aOutput.push('● [' + lid + '] ' + name);
        }
        if (aOutput.length > 0) {
            aOutput.unshift('{imp ' + this.getString('ui.visualDescObjects') + '}');
        }
        return aOutput;
    }

    renderOtherPlayersInRoom (idPlayer) {
        const oPlayer = this.getEntity(idPlayer);
        const idRoom = oPlayer.location;
        const aOtherPlayers = this.getRoomEntities(idRoom, 'player').filter(({ id }) => id !== idPlayer);
        const aOutput = [];
        if (aOtherPlayers.length > 0) {
            aOutput.push('{imp ' + this.getString('ui.visualDescOtherPlayers') + '}');
            for (let { id, lid } of aOtherPlayers) {
                const oOtherPlayer = this.getEntity(id);
                aOutput.push('● [' + lid + '] ' + oOtherPlayer.name);
            }
        }
        return aOutput;
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
        const aOutput = [];
        // secteur
        if (oPlayer.sector !== oRoom.sector) {
            // afficher les info du secteur : le joueur viens d'y pénétrer
            aOutput.push(...this.renderPlayerSector(idPlayer));
            oPlayer.sector = oRoom.sector;
        }
        // description de la pièces
        aOutput.push(...this.renderPlayerRoom(idPlayer));
        // issues
        aOutput.push(...this.renderPlayerExits(idPlayer));
        // objets contenus dans la pièce
        aOutput.push(...this.renderPlayerItemsInRoom(idPlayer));
        // autres joueurs
        aOutput.push(...this.renderOtherPlayersInRoom(idPlayer));
        return aOutput;
    }

    /**
     * Le joueur va tenter de crocheter une serrure de porte
     * @param idPlayer
     * @param sDirection
     */
    actionPlayerPicklock (idPlayer, sDirection) {
        const oPlayer = this.getEntity(idPlayer);
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
