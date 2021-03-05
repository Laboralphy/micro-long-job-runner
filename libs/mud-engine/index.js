const util = require('util');
const Events = require('events');
const { Validator } = require('jsonschema')
const validator = new Validator()
const DisposableIdRegistry = require('../disposable-id-registry');
const STRINGS = require('./mud-strings.json');
const SCHEMAS = {
    blueprints: require('./schemas/blueprints.json'),
    rooms: require('./schemas/rooms.json'),
    sectors: require('./schemas/sectors.json')
};
const { KeyNotFoundError, InvalidSchemasError } = require('./errors');

const CODE_DIRECTIONS = ['n', 'e', 'w', 's', 'ne', 'nw', 'se', 'sw'];

class MUDEngine {
    constructor() {
        this._events = new Events();
        this._lastId = 0;
        this._localIdRegistry = {};
        this._STRINGS = STRINGS;
        this._validObjects = new Set(); // les objet qui ont passé le json-validator sont stocké ici pour ne pas avoir à les revalider
    }

    static _deepFreeze (o) {
        if (Object.isFrozen(o)) {
            return o;
        }
        Object.freeze(o);
        if (o === undefined) {
            return o;
        }

        Object.getOwnPropertyNames(o).forEach(function (prop) {
            if (o[prop] !== null
                && (typeof o[prop] === "object" || typeof o[prop] === "function")
            ) {
                MUDEngine._deepFreeze(o[prop]);
            }
        });

        return o;
    }

    get state () {
        return this._state;
    }

    get events () {
        return this._events;
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

    /**
     * Renvoie un identifiant de joueur
     * @param id {*} id externe
     * @returns {string}
     */
    getPlayerId (id) {
        return 'player::' + id;
    }

    /**
     * Renvoie l'objet blueprint correspondant à l'identifiant demandé
     * @param idBlueprint {string} identifiant du blueprint
     * @returns {object}
     */
    getBlueprint (idBlueprint) {
        return this.getValidObject(idBlueprint, 'blueprints', true);
    }

    /**
     * renvoie l'objet sector coorespondant à l'identifiant demandé
     * @param idSector {string} identifiant du secteur recherché
     * @returns {object}
     */
    getSector (idSector) {
        return this.getValidObject(idSector, 'sectors', true);
    }

    /**
     * Renvoie l'objet (room, blueprints, sector...) spécifié après vérification
     * il ne s'agit pas d'objets manipulables.
     * pour ces "objets" il s'agit principalement d'un objet abstrait comme une pièce ou un blueprint
     * @param id {string} identifiant
     * @param sTypes {string} fammile de types auquel appartient l'objet
     * @param bFreeze {boolean} après vérif, l'objet est gelé
     * @returns {object}
     */
    getValidObject (id, sTypes, bFreeze = false) {
        const oState = this.state;
        if (!(sTypes in oState)) {
            throw new KeyNotFoundError(sTypes, 'state');
        }
        const oTypes = oState[sTypes];
        if (!(id in oTypes)) {
            throw new KeyNotFoundError(id, sTypes);
        }
        const oObject = oTypes[id];
        if (!this._validObjects.has(id)) {
            if (!(sTypes in SCHEMAS)) {
                throw new KeyNotFoundError(sTypes, 'schemas');
            }
            const result = validator.validate(oObject, SCHEMAS[sTypes]);
            if (result.errors.length > 0) {
                console.error(result.errors[0].stack);
                throw new InvalidSchemasError(id, sTypes);
            }
            // blueprint valide
            this._validObjects.add(id);
            if (bFreeze) {
                MUDEngine._deepFreeze(oObject);
            }
        }
        return oObject;
    }

    /**
     * Renvoie le dictionnaire des entités
     * @returns {object}
     */
    getEntities () {
        return this.state.entities;
    }

    getEntity (idEntity) {
        const oEntity = this.getEntities();
        if (idEntity in oEntity) {
            return oEntity[idEntity];
        } else {
            throw new KeyNotFoundError(idEntity, 'entities');
        }
    }

    /**
     * Renvoie la structure de memorisation des secteurs
     * @returns {object}
     */
    getSectors () {
        return this.state.sectors;
    }

    /**
     * Renvoie la structure de memorisation des pièces
     * @returns {object}
     */
    getRooms () {
        return this.state.rooms;
    }

    getRoom (idRoom) {
        return this.getValidObject(idRoom, 'rooms', false);
    }


    isDirection (sDirection) {
        return (typeof sDirection === 'string') && CODE_DIRECTIONS.indexOf(sDirection.toLowerCase()) >= 0;
    }

    getValidDirection (sParam) {
        const s = sParam.toLowerCase();
        if (this.isDirection(s)) {
            return s;
        } else {
            throw new KeyNotFoundError(sParam, 'cardinals');
        }
    }

    isRoomExist (idRoom) {
        return idRoom in this.getRooms();
    }

    isEntityExist (idEntity) {
        return idEntity in this.getEntities();
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
        if (oFoundEntity) {
            return this.getEntity(oFoundEntity.id);
        } else {
            return null;
        }
    }

    getInventoryLocalEntity (idContainer, lid) {
        const oContainer = this.getEntity(idContainer);
        if (!oContainer.inventory) {
            return null;
        }
        const oFoundItem = this
            .getInventoryEntities(oContainer)
            .find(e => e.lid === lid);
        if (oFoundItem) {
            return this.getEntity(oFoundItem.id);
        } else {
            return null;
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
                i: new DisposableIdRegistry('i'), // les objets d'inventaire
                p: new DisposableIdRegistry('p'), // les joueurs
                o: new DisposableIdRegistry('o'), // les objets placables
                c: new DisposableIdRegistry('c')  // les créatures et les pnj
            };
        }
        const oStorage = this.state.roomEntityStorage;
        if (!(oStorage[idRoom])) {
            // construction du registre d'identifiant locaux
            // construction du stockage des entités
            oStorage[idRoom] = {};
            // on a profite pour coller tous les objet par default
            const aDefaultEntities = oRoom.defaultEntities;
            if (aDefaultEntities) {
                aDefaultEntities.forEach(({ blueprint, stack = 1 }) => {
                    this.createEntity(blueprint, idRoom, stack);
                });
            }
        }
        return oStorage[idRoom];
    }

    /**
     * A partir d'un container donné, établie une liste ordonnée d'entité contenues
     * @param oInventory {object}
     * @returns {{lid: string, id: string}[]}
     */
    getInventoryEntities (oInventory) {
        const aEntities = [];
        for (let idEntity in oInventory) {
            if (oInventory.hasOwnProperty(idEntity)) {
                const lid = oInventory[idEntity];
                const i = parseInt(lid.match(/[0-9]+$/)[0]);
                aEntities.push({ id: idEntity, lid, i });
            }
        }
        return aEntities
            .sort((a, b) => a.i - b.i)
            .map(({ id, lid }) => ({ id, lid }));
    }

    /**
     * Renvoie la liste des entités présente dans la pièce spécifiée
     * @param idRoom {string} identifiant de la pièce
     * @param sType {string|null} un type d'objet à filter
     * @returns {array}
     */
    getRoomEntities (idRoom, sType = null) {
        const oEntities = this.getRoomEntityStorage(idRoom);
        const aEntities = [];
        for (let idEntity in oEntities) {
            if (oEntities.hasOwnProperty(idEntity)) {
                const lid = oEntities[idEntity];
                const i = parseInt(lid.match(/[0-9]+$/)[0]);
                if (sType) {
                    const oEntity = this.getEntity(idEntity);
                    if (oEntity.blueprint.type === sType) {
                        aEntities.push({ id: idEntity, lid, i });
                    }
                } else {
                    aEntities.push({ id: idEntity, lid });
                }
            }
        }
        return aEntities.sort((a, b) => a.i - b.i);
    }



    /**
     * Recherche et trouve une pile du même accabi que l'obket transmis en paramètre
     * @param oItem {object}
     * @param oInventory {[]}
     */
    findItemStack (oItem, oInventory) {
        for (const id in oInventory) {
            if (oInventory.hasOwnProperty(id)) {
                const oOtherItem = this.getEntity(id);
                if (oOtherItem.blueprint.ref === oItem.blueprint.ref &&
                    oOtherItem.buc === oItem.buc &&
                    oOtherItem.identified === oItem.identified &&
                    oOtherItem.tag === oItem.tag
                ) {
                    return id;
                }
            }
        }
        return null;
    }

    /**
     * cherche et renvoie un objet possédant un tag particulier et se trouvant dans l'inventaire de l'entité spécifiée
     * @param sTag
     * @param idEntity
     * @param n
     * @returns {null|*}
     */
    findItemTag (sTag, idEntity, n = 0) {
        const oEntity = this.getEntity(idEntity);
        const oContainer = oEntity.inventory;
        for (let idItem in oContainer) {
            if (oContainer.hasOwnProperty(idItem)) {
                const oItem = this.getEntity(idItem);
                if (oItem.tag === sTag) {
                    if (n-- === 0) {
                        return oItem.id;
                    }
                }
            }
        }
        return null;
    }

//       _               _    _
//   ___| |__   ___  ___| | _(_)_ __   __ _ ___
//  / __| '_ \ / _ \/ __| |/ / | '_ \ / _` / __|
// | (__| | | |  __/ (__|   <| | | | | (_| \__ \
//  \___|_| |_|\___|\___|_|\_\_|_| |_|\__, |___/
//                                    |___/

    /**
     * Effectue la vérification du paramètre, pour voir si c'est une direction valide
     * si la direction n'est pas valide, notifie le joueur de l'erreur.
     * @param idPlayer
     * @param sDirection
     */
    checkDirection (idPlayer, sDirection) {
        if (!this.isDirection(sDirection)) {
            this.notifyPlayerFailure(idPlayer, 'directions.invalid', sDirection);
            return false;
        } else {
            return true;
        }
    }



//  ____                                         _   _  __
// |  _ \  ___   ___  _ __ ___    __ _ _ __   __| | | |/ /___ _   _ ___
// | | | |/ _ \ / _ \| '__/ __|  / _` | '_ \ / _` | | ' // _ \ | | / __|
// | |_| | (_) | (_) | |  \__ \ | (_| | | | | (_| | | . \  __/ |_| \__ \
// |____/ \___/ \___/|_|  |___/  \__,_|_| |_|\__,_| |_|\_\___|\__, |___/
//                                                            |___/

    /**
     * Renvoie le code technique d'une issue secrete
     * permet principalement d'attribuer un identifiant à un passage secret précis pour déterminer
     * quels sont les joueurs qui l'ont découvert.
     * @param idRoom {string} identifiant dans la pièce ou se trouve l'issue secrete
     * @param sDirection {string} direction
     * @returns {string}
     */
    getSecretId (idRoom, sDirection) {
        sDirection = this.getValidDirection(sDirection);
        return idRoom + '::' + sDirection;
    }

    getDoor (idRoom, sDirection) {
        sDirection = this.getValidDirection(sDirection);
        const oRoom = this.getRoom(idRoom);
        return oRoom.nav[sDirection];
    }

    /**
     * indique si le joueur a été détecté la direction donnée une porte secrète, dans la pièce ou il se trouve.
     * @param idPlayer {string} identifiant joueur
     * @param sDirection {string} direction
     * @returns {boolean} true = la porte dans la direction donnée est bien secrète mais le joueur l'a déja repéré
     */
    hasPlayerSpottedDoor (idPlayer, sDirection) {
        const oPlayer = this.getEntity(idPlayer);
        return this.getSecretId(oPlayer.location, sDirection) in oPlayer.spotted;
    }

    /**
     * renvoie true si la porte spécifiée est secrete.
     * c'est la caractéristique native de la porte qui est consultée ici.
     * le résultat de la fonction n'est pas influencé par les capacité de détection ou de repérage d'un joueur
     * ou le fait que cette porte a déjà  été découverte.
     * @param idRoom {string} identifiant de la pièce
     * @param sDirection {string} direction de la porte
     * @returns {boolean} true = la porte est secrète
     */
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
     * @returns {{valid: boolean, dcPicklock: number, dcSearch: number, code: string, visible: boolean, secret: boolean, locked: boolean, key: string}}
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
                oStatus.dcPicklock = oStatus.lockable
                    ? 0
                    : ('difficulty' in oDoorLock)
                        ? oDoorLock.difficulty
                        : Infinity;
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

//                  _        _   _
//  _ __ ___  _   _| |_ __ _| |_(_) ___  _ __  ___
// | '_ ` _ \| | | | __/ _` | __| |/ _ \| '_ \/ __|
// | | | | | | |_| | || (_| | |_| | (_) | | | \__ \
// |_| |_| |_|\__,_|\__\__,_|\__|_|\___/|_| |_|___/
//

    set state (value) {
        value.entities = {};
        value.roomEntityStorage = {};
        this._state = value;
    }

    /**
     * Création d'un nouveau personnage joueur
     * @param id {string} identifiant externe (désigné par l'appli cliente) qui sera transformé en identifiant internet au mud
     * @param sName {string}
     * @param sLocation {string} identifiant de la pièce ou sera localisé l'entité
     * @returns {string|null} identifiant joueur
     */
    createPlayerEntity(id, sName, sLocation) {
        // verifier si le nom est valide
        if (!sName.match(/^\S{2,20}$/)) {
            return null;
        }
        const idPlayer = this.getPlayerId(id);
        const oPlayer = this.getEntities()[idPlayer] = {
            type: 'player',
            id,
            blueprint: {
                type: 'player'
            },
            desc: [
                'Description par défaut'
            ],
            name: sName,
            location: '', // localisation (pièce) du joueur
            sector: '', // indique le secteur dans lequel le joueur est.
            inventory: {},
            skills: {
                spot: 5,
                picklock: 5
            },
            spotted: {},
            data: {}
        };
        this._localIdRegistry[idPlayer] = {
            inv: new DisposableIdRegistry()
        };
        this.setEntityLocation(idPlayer, sLocation);
        const oRoom = this.getRoom(sLocation);
        this.notifyPlayer(idPlayer, 'events.youAreIn', oRoom.name);
        this.notifyRoom(sLocation, idPlayer, 'events.roomPlayerArrived', oPlayer.name);
        this.notifyAdmin('new player %s spawned at %s', oPlayer.name, oRoom.name);
        return idPlayer;
    }

    /**
     * Clonage d'une entité
     * @param oEntity {object} instance de l'entité source
     * @returns {object}
     */
    cloneEntity (oEntity) {
        ++this._lastId;
        const idEntity = 'entity::' + this._lastId;
        const oBlueprint = oEntity.blueprint;
        const oClone = this.getEntities()[idEntity] = {
            ...oEntity,
            id: idEntity,
            inventory: {},
            location: ''
        };
        if (oBlueprint.inventory) {
            this._localIdRegistry[idEntity] = {
                inv: new DisposableIdRegistry()
            };
        }
        this.notifyAdmin('clone entity %s', oClone.name);
        return oClone;
    }

    /**
     * Création d'une entité
     * @param sBlueprint {string} blueprint d'après lequel on construit l'entité
     * @param sLocation {string} localisation initiale
     * @param nCount {number} nombre d'exemplaire pour le cas des objets empilables (flèche, or, potions...}
     * @returns {string} identifiant de l'entité créer
     */
    createEntity (sBlueprint, sLocation, nCount = 1) {
        ++this._lastId;
        const idEntity = 'entity::' + this._lastId;
        const oBlueprint = this.getBlueprint(sBlueprint);
        const oEntity = {
            id: idEntity,
            blueprint: oBlueprint,
            tag: oBlueprint.tag,
            location: '',
            name: oBlueprint.name,
            desc: oBlueprint.desc
        };
        switch (oBlueprint.type) {
            case 'item':
                Object.assign(oEntity, {
                    stack: nCount,
                    buc: oBlueprint.buc,
                    identified: oBlueprint.identified,
                    inventory: oBlueprint.inventory ? {} : null,
                    name: oBlueprint.identified ? oBlueprint.name : oBlueprint.uname,
                    desc: oBlueprint.identified ? oBlueprint.desc : oBlueprint.udesc
                });
                break;
        }
        this.getEntities()[idEntity] = oEntity;
        if (oBlueprint.inventory) {
            this._localIdRegistry[idEntity] = {
                inv: new DisposableIdRegistry('c')
            };
        }
        if (sLocation) {
            this.setEntityLocation(idEntity, sLocation);
        }
        return idEntity;
    }

    /**
     * destruction d'une entité
     * @param idEntity {string} entité à détruire
     */
    destroyEntity (idEntity) {
        const oEntities = this.getEntities();
        if (idEntity in oEntities) {
            const oEntity = oEntities[idEntity];
            // détruire les objets qu'il transportait
            if (oEntity.inventory) {
                Object.keys(oEntity.inventory).forEach(id => {
                    this.destroyEntity(id);
                });
            }
            const idRoom = this.getEntity(idEntity).location;
            this.removeRoomEntity(idRoom, idEntity);
            if (idEntity in this._localIdRegistry) {
                delete this._localIdRegistry[idEntity];
            }
            delete oEntities[idEntity];
        }
    }

    /**
     * Ajoute un objet dans l'inventaire de l'entity
     * @param idEntity {string} identifiant de l'entité qui effectue l'action
     * @param idItem {string} identifiant de l'objet à ramasser
     * @param count {number} nombre d'exemplaire à prendre
     */
    takeItem (idEntity, idItem, count = Infinity) {
        if (count < 1) {
            return null;
        }
        const oEntity = this.getEntity(idEntity);
        const oItem = this.getEntity(idItem);
        if (oEntity.inventory) {
            // l'entité bénéficiaire a bienun inventaire
            const oInventory = oEntity.inventory;
            if (oItem.blueprint.stackable && oItem.stack > count) {
                // l'item qu'on veut déposer est stackable
                // recherche une éventuelle pile d'objet du meme blueprint
                const idPile = this.findItemStack(oItem, oInventory);
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
                    return oInvItem;
                } else {
                    // aucune pile du même type déja dans l'inv.
                    // il faut créer notre propre pile
                    // créer un clone de la pile d'origin
                    const oClone = this.cloneEntity(oItem);
                    this.setEntityLocation(oClone.id, idEntity);
                    // ajuster les piles
                    oItem.stack -= count;
                    oClone.stack = count;
                    oInventory[oClone.id] = this._localIdRegistry[idEntity].inv.getId();
                    return oClone;
                }
            }
            // obtenir local id
            oInventory[idItem] = this._localIdRegistry[idEntity].inv.getId();
            if (this.isRoomExist(oItem.location)) {
                // l'objet était dans une pièce
                this.removeRoomEntity(oItem.location, idItem);
            } else if (this.isEntityExist(oItem.location)) {
                // l'entité était dans l'inventaire d'une entité
                this.removeInventoryEntity(oItem.location, idItem);
            }
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

            if (idItem in oInventory) {
                // est ce un objet empilable ?
                if (oItem.blueprint.stackable && count < oItem.stack) {
                    // réduire la pile
                    // créer un nouvel objet
                    const oClone = this.cloneEntity(oItem);
                    // ajuster les stack
                    oClone.stack = count;
                    oItem.stack -= count;
                    return oClone;
                } else {
                    // l'item n'est pas stackable... c'est plus simple
                    // ou bien il est stackable mais on enleve toute la pile
                    delete oInventory[idItem];
                    return oItem;
                }
            }
        }
        return null;
    }

    /**
     * Ajoute une entity au registre des entités de la pièce.
     * attribue un numéro d'identification local.
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
        oEntity.location = idRoom;
    }

    /**
     * Ajoute une entité à l'inventaire, et lui associe un identifiant local
     * @param idContainer {string}
     * @param idItem {string}
     */
    addInventoryEntity (idContainer, idItem) {
        const oEntity = this.getEntity(idItem);
        const oContainer = this.getEntity(idContainer);
        oContainer[idItem] = this._localIdRegistry[idContainer].inv.getId();
        oEntity.location = idContainer;
    }

    /**
     * Supprime une entité d'un container
     * @param idContainer
     * @param idItem
     */
    removeInventoryEntity (idContainer, idItem) {
        const oContainer = this.getEntity(idContainer);
        const lid = oContainer[idItem];
        this._localIdRegistry[idContainer].inv.disposeId(lid);
        delete oContainer[idItem];
        const oItem = this.getEntity(idItem);
        oItem.location = '';
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
     * Ajoute l'id d'une porte cachée à la liste des portes cachées repérées par le joueur
     * @param idPlayer {string} joueur
     * @param sDirection {string} une direction valide
     * @param value {boolean}
     */
    setPlayerDoorSpotted (idPlayer, sDirection, value) {
        sDirection = this.getValidDirection(sDirection);
        const oPlayer = this.getEntity(idPlayer);
        const sId = this.getSecretId(oPlayer.location, sDirection);
        if (value) {
            oPlayer.spotted[sId] = true;
        } else if (this.hasPlayerSpottedDoor(idPlayer, sDirection)) {
            delete oPlayer.spotted[sId];
        }
    }

    /**
     * Change la localisation d'une entité
     * @param idTo {string} identifiant pièce
     * @param idEntity {string} identifiant entité
     */
    setEntityLocation (idEntity, idTo) {
        const oEntity = this.getEntity(idEntity);
        const idPrevLocation = oEntity.location;
        if (this.isRoomExist(idPrevLocation)) {
            this.removeRoomEntity(idPrevLocation, idEntity);
        } else if (this.isEntityExist(idPrevLocation)) {
            this.removeInventoryEntity(idPrevLocation, idEntity);
        }
        if (this.isRoomExist(idTo)) {
            this.addRoomEntity(idTo, idEntity);
        } else if (this.isEntityExist(idTo)) {
            // on va stocker l'entité dans un inventaire
            this.addInventoryEntity(idTo, idEntity);
        } else {
            throw new KeyNotFoundError(idTo, 'rooms/entites');
        }
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
     * @param params {...string} paramètre de substitution
     */
    notifyPlayer (idPlayer, sEvent, ...params) {
        const aModParams = this._mapParameters(params);
        const sModEvent = this._mapParameters(sEvent);
        const oPlayer = this.getEntity(idPlayer);
        this._events.emit('player-event', { id: oPlayer.id, message: util.format(sModEvent, ...aModParams)});
    }

    notifyMapChange (idPlayer) {
        const oPlayer = this.getEntity(idPlayer);
        // récuperer les infos du joeur (position)
        // récupérer les infos du monde / de l'étage
        const map = {{{{{{}}}}}};
        this._events.emit('map-change-event', { id: oPlayer.id, map: { xxxxx }});
    }

    /**
     * Notifie au joueur qu'une action est couronnée de succés
     * Ce message est utile pour les cas suivants :
     * - l'action a fait intervenir un talent, et la difficulté a été surmontée.
     * - l'action entrainera l'apparition de nouvelles options.
     * @param idPlayer {string} identifiant joueur
     * @param sEvent {string}
     * @param params {string}
     */
    notifyPlayerSuccess (idPlayer, sEvent, ...params) {
        const aModParams = this._mapParameters(params);
        const sModEvent = this._mapParameters(sEvent);
        const oPlayer = this.getEntity(idPlayer);
        this._events.emit('player-event', { id: oPlayer.id, type: 'success', message: util.format(sModEvent, ...aModParams)});
    }

    /**
     * Notifie au joueur qu'une action a échoué.
     * Ce message est utile pour forcer le joueur à porter son attention sur le résultat de l'action
     * Ce message est utile pour les cas suivants :
     * - des actions qui font intervenir un talent, et qui ne passe pas le degrés de difficulté requis
     * - des actions qui échouent car l'objet de l'action n'existe pas
     * @param idPlayer {string} identifiant joueur
     * @param sEvent {string}
     * @param params {string}
     */
    notifyPlayerFailure (idPlayer, sEvent, ...params) {
        const aModParams = this._mapParameters(params);
        const sModEvent = this._mapParameters(sEvent);
        const oPlayer = this.getEntity(idPlayer);
        this._events.emit('player-event', { id: oPlayer.id, type: 'failure', message: util.format(sModEvent, ...aModParams)});
    }

    /**
     * Comme notify player, mais pour tous les autres joueurs de la pièce
     * @param idRoom {string} identifiant pièce
     * @param idPlayer {string} identifiant joueur
     * @param sEvent {string} chaine pleine ou bien alias de chaine. des token %s peut etre présent et seront
     * remplacé par les paramètre suivants
     * @param params {...string} paramètre de substitution
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
     * @param oDoorStatus {object} status de la porte à afficher
     * @returns {string}
     */
    renderDoor (idRoom, sDirection, oDoorStatus) {
        const oDoor = this.getDoor(idRoom, sDirection);
        const sDirStr = this.getString('directions.v' + sDirection);
        const oNextRoom = this.getRoom(oDoor.to);
        const a = [
            ' - [' + sDirection + ']',
            sDirStr.charAt(0).toUpperCase() + sDirStr.substr(1),
            ':',
            'desc' in oDoor ? oDoor.desc : this.getString('nav.defaultDesc', oNextRoom.name)
        ];
        const b = [];
        if (oDoorStatus.locked) {
            b.push(this.getString('nav.doorLocked'));
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
        const oSector = this.getSector(oRoom.sector);
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
        aOutput.push('{imp ' + this.getString('ui.exits') + '}');
        for (const sDirection in oRoom.nav) {
            if (oRoom.nav.hasOwnProperty(sDirection)) {
                const oDoorStatus = this.getPlayerDoorStatus(idPlayer, sDirection);
                if (oDoorStatus.visible) {
                    aOutput.push(this.renderDoor(idRoom, sDirection, oDoorStatus));
                }
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
            const oItem = this.getEntity(id);
            aOutput.push(' - [' + lid + '] ' + oItem.name + (oItem.blueprint.stackable ? ' (x' + oItem.stack + ')' : ''));
        }
        if (aOutput.length > 0) {
            aOutput.unshift('{imp ' + this.getString('ui.objects') + '}');
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
            aOutput.push('{imp ' + this.getString('ui.players') + '}');
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
