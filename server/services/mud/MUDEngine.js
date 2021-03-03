const util = require('util');
const Events = require('events');
const DiscardableRegistry = require('../../../libs/discardable-registry');
const STRINGS = require('./mud-strings.json');

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
        this._localIdRegistry = {};
        this._STRINGS = STRINGS;
    }

    get state () {
        return this._state;
    }

    set state (value) {
        this._state = value;
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
            const sString = sPath.split('.').reduce((prev, curr) => prev[curr], this._STRINGS).substr(0);
            return util.format(sString, ...params);
        } catch (e) {
            return util.format(sPath, ...params)
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
     * @param sLocation {string} identifiant de la pièce ou sera localisé l'entité
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
            blueprint: {
                type: 'player',
                desc: ['Description par défaut']
            },
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
        this._localIdRegistry[idPlayer] = {
            inv: new DiscardableRegistry()
        };
        this.setEntityLocation(idPlayer, sLocation);
        const oRoom = this.getRoom(sLocation);
        this.notifyPlayer(idPlayer, 'events.youAreIn', oRoom.name);
        this.notifyRoom(sLocation, idPlayer, 'events.roomPlayerArrived', oPlayer.name);
        this.notifyAdmin('new player %s spawned at %s', oPlayer.name, oRoom.name);
        return idPlayer;
    }

    cloneEntity (oEntity) {
        ++this._lastId;
        const idEntity = 'entity::' + this._lastId;
        const oBlueprint = oEntity.blueprint;
        const oClone = this._state.entities[idEntity] = {
            id: idEntity,
            blueprint: oBlueprint,
            tag: oBlueprint.tag,
            stack: oEntity.stack,
            location: '',
            buc: oEntity.buc,
            identified: oEntity.identified,
            inventory: oBlueprint.inventory ? [] : null, // l'inventaire ne peut pas être dupliqué
            get name () {
                const b = this.blueprint;
                const sStack = b.stackable ? ' x' + this.stack : '';
                return (this.identified ? b.name : b.uname) + sStack;
            },
            get desc () {
                const b = this.blueprint;
                return this.identified ? b.name : b.udesc;
            }
        };
        if (oBlueprint.inventory) {
            this._localIdRegistry[idEntity] = {
                inv: new DiscardableRegistry()
            };
        }
        this.notifyAdmin('clone entity %s', oClone.name);
        return idEntity;
    }

    createEntity (sBlueprint, sLocation, nCount = 1) {
        ++this._lastId;
        const idEntity = 'entity::' + this._lastId;
        const oBlueprint = this.getBlueprint(sBlueprint);
        if (!Object.isFrozen(oBlueprint)) {
            oBlueprint.ref = sBlueprint;
            Object.freeze(oBlueprint);
        }
        const oEntity = this._state.entities[idEntity] = {
            id: idEntity,
            blueprint: oBlueprint,
            tag: oBlueprint.tag,
            stack: nCount,
            location: '',
            buc: 'u',
            identified: true,
            inventory: oBlueprint.inventory ? [] : null,
            get name () {
                const b = this.blueprint;
                const sStack = b.stackable ? ' x' + this.stack : '';
                return (this.identified ? b.name : b.uname) + sStack;
            },
            get desc () {
                const b = this.blueprint;
                return this.identified ? b.name : b.udesc;
            }
        };
        if (oBlueprint.inventory) {
            this._localIdRegistry[idEntity] = {
                inv: new DiscardableRegistry()
            };
        }
        if (sLocation) {
            this.setEntityLocation(idEntity, sLocation);
        }
        this.notifyAdmin('new entity %s created at %s', oEntity.name, sLocation === '' ? 'limbo' : sLocation);
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
            const idRoom = this.getEntity(idEntity).location;
            this.notifyAdmin('entity %s has been destroy at %s', oEntity.name, idRoom);
            this.notifyRoom(idRoom, idEntity, 'events.roomEntityDestroyed', oEntity.name);
            this.removeRoomEntity(idRoom, idEntity);
            if (idEntity in this._localIdRegistry) {
                delete this._localIdRegistry[idEntity];
            }
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

    isEntity (idEntity) {
        const oEntity = this._state.entities;
        return idEntity in oEntity;
    }

    getEntity (idEntity) {
        const oEntity = this._state.entities;
        if (idEntity in oEntity) {
            return oEntity[idEntity];
        } else {
            throw new KeyNotFoundError(idEntity, 'entities');
        }
    }

    /**
     * A partir du local_id Recherche une entity dans la pièce spécifiée.
     * Le local_id est un identifiant simplifié propre à chaque pièce.
     * @param idRoom {string} identifiant pièce
     * @param lid {string} identifiant local de l'objet recherché
     * @returns {null|*}
     */
    getRoomLocalEntity (idRoom, lid) {
        const oFoundEntity = this
            .getRoomEntities(idRoom)
            .find(e => e.lid === lid);
        if (oFoundEntity && this.getEntity(oFoundEntity.id).location) {
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
        if (!(idRoom in this._localIdRegistry)) {
            this._localIdRegistry[idRoom] = {
                i: new DiscardableRegistry('i'), // les objets d'inventaire
                p: new DiscardableRegistry('p'), // les joueurs
                o: new DiscardableRegistry('o'), // les objets placables
                c: new DiscardableRegistry('c')  // les créatures et les pnj
            };
        }
        if (!('entities' in oRoom)) {
            // construction du registre d'identifiant locaux
            // construction du stockage des entités
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
                if (oEntity.blueprint.type === sType) {
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
        const sType = oEntity.blueprint.type;
        const sMiniType = sType.charAt(0).toLowerCase();
        const oRES = this.getRoomEntityStorage(idRoom);
        oRES[idEntity] = this._localIdRegistry[idRoom][sMiniType].getId();
    }

    /**
     * Suprime une entity du registre des entités de la pièce
     * @param idRoom {string} identifiant pièce
     * @param idEntity {string} identifiant entité
     */
    removeRoomEntity (idRoom, idEntity) {
        const lid = this.getRoomEntityStorage(idRoom)[idEntity];
        const sMiniType = lid.charAt(0).toLowerCase();
        this._localIdRegistry[idRoom][sMiniType].disposeId(lid);
        delete this.getRoomEntityStorage(idRoom)[idEntity];
        const oEntity = this.getEntity(idEntity);
        oEntity.location = '';
    }

    /**
     * Change la localisation d'une entité
     * @param idTo {string} identifiant pièce
     * @param idEntity {string} identifiant entité
     */
    setEntityLocation (idEntity, idTo) {
        if (idTo in this._state.rooms) {
            const oEntity = this.getEntity(idEntity);
            const idPrevRoom = oEntity.location;
            oEntity.location = idTo;
            if (idPrevRoom in this._state.rooms) {
                this.removeRoomEntity(idPrevRoom, idEntity);
            }
            this.addRoomEntity(idTo, idEntity);
        } else {
            throw new KeyNotFoundError(idTo, 'rooms');
        }
    }

    /**
     * Recherche et trouve une pile du même accabi que l'obket transmis en paramètre
     * @param oItem {object}
     * @param aInventory {[]}
     */
    findItemStack (oItem, aInventory) {
        const oPileFound = aInventory.find(oInvEntry => {
            const oOtherItem = this.getEntity(oInvEntry.id);
            return oOtherItem.blueprint.ref === oItem.blueprint.ref &&
                oOtherItem.buc === oItem.buc &&
                oOtherItem.identified === oItem.identified &&
                oOtherItem.tag === oItem.tag;
        });
        return oPileFound ? oPileFound.id : null;
    }

    /**
     * Ajoute un objet dans l'inventaire de l'entity
     * @param idItem {string} identifiant de l'objet à ramasser
     * @param idEntity {string} identifiant de la creature
     */
    takeItem (idEntity, idItem, count = Infinity) {
        if (count < 1) {
            return null;
        }
        const oEntity = this.getEntity(idEntity);
        const oItem = this.getEntity(idItem);
        if (oEntity.inventory) {
            // l'entité bénéficiaire a bienun inventaire
            const aInventory = oEntity.inventory;
            if (oItem.blueprint.stackable && oItem.stack > count) {
                // l'item qu'on veut déposer est stackable
                // recherche une éventuelle pile d'objet du meme blueprint
                const idPile = this.findItemStack(oItem, aInventory);
                if (idPile) {
                    // une pile du même type d'objet existe déja dans l'inventaire
                    const oInvItem = this.getEntity(idPile);
                    // additionner les piles
                    if (oItem.stack > count) {
                        // on ne veut qu'une partie de la pile
                        oItem.stack -= count;
                        oInvItem.stack += count;
                    } else {
                        // on prend tout
                        oInvItem.stack += oItem.stack;
                        this.destroyEntity(idItem);
                    }
                    return;
                } else {
                    // créer un clone de la pile d'origin
                    const idClone = this.cloneEntity(oItem);
                    const oClone = this.getEntity(idClone);
                    // ajuster les piles
                    oItem.stack -= count;
                    oClone.stack = count;
                    const lid = this._localIdRegistry[idEntity].inv.getId();
                    aInventory.push({
                        lid,
                        id: idClone
                    });
                    return;
                }
            }
            // obtenir local id
            const lid = this._localIdRegistry[idEntity].inv.getId();
            aInventory.push({
                lid,
                id: idItem
            });
            this.removeRoomEntity(oItem.location, idItem);
        }
    }

    /**
     * Retire un objet de l'inventaire
     * @param idEntity {string} identifiant de l'entité qui possède l'inventaire
     * @param idItem {string} identifiant de l'item
     * @param count {number} pour les objects empilable on peut spécifier une quantité d'exemplaire
     * @returns {null|*} objet nouvellement retiré
     */
    dropItem (idEntity, idItem, count = Infinity) {
        if (count < 1) {
            return null;
        }
        const oEntity = this.getEntity(idEntity);
        const oItem = this.getEntity(idItem);
        if (oEntity.inventory) {
            const oInventory = oEntity.inventory;
            // chercher si l'item est bien dans l'inventaire
            const iItem = oInventory.findIndex(({ id }) => id === idItem);
            if (iItem >= 0) {
                // est ce un objet empilable ?
                if (oItem.blueprint.stackable && count < oItem.stack) {
                    // réduire la pile
                    // créer un nouvel objet
                    const idClone = this.cloneEntity(oItem);
                    const oClone = this.getEntity(idClone);
                    // ajuster les stack
                    oClone.stack = count;
                    oItem.stack -= count;
                    return oClone;
                } else {
                    // l'item n'est pas stackable... c'est plus simple
                    // ou bien il est stackable mais on enleve toute la pile
                    oInventory.splice(iItem, 1);
                    return oItem;
                }
            }
        }
        return null;
    }


//  ____                                         _   _  __
// |  _ \  ___   ___  _ __ ___    __ _ _ __   __| | | |/ /___ _   _ ___
// | | | |/ _ \ / _ \| '__/ __|  / _` | '_ \ / _` | | ' // _ \ | | / __|
// | |_| | (_) | (_) | |  \__ \ | (_| | | | | (_| | | . \  __/ |_| \__ \
// |____/ \___/ \___/|_|  |___/  \__,_|_| |_|\__,_| |_|\_\___|\__, |___/
//                                                            |___/


    /**
     * Renvoie le code technique d'une issue secrete
     * @param idRoom {string} identifiant dans la pièce ou se trouve l'issue
     * @param sDirection {string} direction
     * @returns {string}
     */
    getSecretId (idRoom, sDirection) {
        return idRoom + '::' + sDirection;
    }

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

//                       _         _                     _ _
//   _____   _____ _ __ | |_ ___  | |__   __ _ _ __   __| | | ___ _ __ ___
//  / _ \ \ / / _ \ '_ \| __/ __| | '_ \ / _` | '_ \ / _` | |/ _ \ '__/ __|
// |  __/\ V /  __/ | | | |_\__ \ | | | | (_| | | | | (_| | |  __/ |  \__ \
//  \___| \_/ \___|_| |_|\__|___/ |_| |_|\__,_|_| |_|\__,_|_|\___|_|  |___/

    /**
     * Passe en vue les chaine de caractères passées.
     * Gestion des alias de chaînes (remplace tous les alias détecté par la vrais chaîne dans le tableau des chaînes)
     * @param x
     * @returns {string|*}
     * @private
     */
    _mapParameters (x) {
        if (Array.isArray(x)) {
            return x.map(p => this._mapParameters(p))
        } else {
            return this.getString(x);
        }
    }

    /**
     * Notification d'action au joueur.
     * Cette fonction notifie à un joueur une action qu'il vien de faire.
     * La notification est simplement une chaine de caractère à afficher
     * @param idPlayer {string} identifiant joueur
     * @param sEvent {string} chaine pleine ou bien alias de chaine. des token %s peut etre présent et seront
     * remplacé par les paramètre suivants
     * @param params {[]} paramètre de substitution
     */
    notifyPlayer (idPlayer, sEvent, ...params) {
        const aModParams = this._mapParameters(params);
        const sModEvent = this._mapParameters(sEvent);
        const oPlayer = this.getEntity(idPlayer);
        this._events.emit('player-event', { id: oPlayer.id, message: util.format(sModEvent, ...aModParams)});
    }

    /**
     * Comme notify player, mais pour tous les autres joueurs de la pièce
     * @param idRoom {string} identifiant pièce
     * @param idPlayer {string} identifiant joueur
     * @param sEvent {string} chaine pleine ou bien alias de chaine. des token %s peut etre présent et seront
     * remplacé par les paramètre suivants
     * @param params {[]} paramètre de substitution
     */
    notifyRoom (idRoom, idPlayer, sEvent, ...params) {
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

    /**
     * Notification d'évènement aux admins. fonctionne comme notifyPlayer
     * @param sEvent
     * @param params
     */
    notifyAdmin (sEvent, ...params) {
        this._events.emit('admin-event', {message: util.format(sEvent, ...params)});
    }

//                      _                 _        _
//   _ __ ___ _ __   __| | ___ _ __   ___| |_ _ __(_)_ __   __ _ ___
//  | '__/ _ \ '_ \ / _` |/ _ \ '__| / __| __| '__| | '_ \ / _` / __|
//  | | |  __/ | | | (_| |  __/ |    \__ \ |_| |  | | | | | (_| \__ \
//  |_|  \___|_| |_|\__,_|\___|_|    |___/\__|_|  |_|_| |_|\__, |___/
//                                                         |___/

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
            ' - [' + sDirection + ']',
            sDirStr.charAt(0).toUpperCase() + sDirStr.substr(1),
            ':',
            oDoor.desc
        ];
        const b = [];
        if (oDoorStatus.locked) {
            b.push(this.getString('nav.doorLocked'));
            const sKey = oDoorStatus.key;
            if (sKey) {
                b.push(this.getString('nav.doorKey', this._state.blueprints[sKey].name));
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
     * @return {string[]}
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

    /**
     * Affiche une description de la pièce actuellement occupée par le joueur
     * @param idPlayer {string} identifiant joueur
     * @returns {string[]}
     */
    renderPlayerRoom (idPlayer) {
        const oPlayer = this.getEntity(idPlayer);
        const idRoom = oPlayer.location;
        const oRoom = this.getRoom(idRoom);
        const aOutput = [];
        // description de la pièces
        aOutput.push('{imp ' + oRoom.name + '}', ...oRoom.desc);
        return aOutput;
    }

    /**
     * Affichage des sortie disponible dan sla pièce ou se trouve
     * @param idPlayer
     * @returns {[]}
     */
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

    /**
     * Affiche la liste des items présetn dans la pièce ou se trouve le joueur
     * @param idPlayer {string}
     * @returns {string[]}
     */
    renderPlayerItemsInRoom (idPlayer) {
        const oPlayer = this.getEntity(idPlayer);
        const idRoom = oPlayer.location;
        const aItems = this.getRoomEntities(idRoom, 'item');
        const aOutput = [];
        for (let { id, lid } of aItems) {
            const { name } = this.getEntity(id);
            aOutput.push(' - [' + lid + '] ' + name);
        }
        if (aOutput.length > 0) {
            aOutput.unshift('{imp ' + this.getString('ui.visualDescObjects') + '}');
        }
        return aOutput;
    }

    /**
     * Affiche la liste des autres joueur présent la pièce
     * @param idPlayer {string} identifiant joueur
     * @returns {string[]}
     */
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
     * Affichage de la situation visuelle du joueur.
     * info sur la pièce, les sortie, les objets ...
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
}

module.exports = MUDEngine;
