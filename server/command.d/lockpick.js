const STRINGS = {
    "doorInvalid": "Il n'y a pas de porte par ici.",
    "doorNotLocked": "Il n'y a pas de serrure sur cette porte.",
    "doorHasCode": "Cette porte est verrouillée par un code secret.",
    "lockpickSuccess": "Vous réussissez à crocheter la serrure.",
    "lockpickFailed": "Vous ne parvenez pas à crocheter la serrure.",
    "roomLockpickSuccess": "%s vient de crocheter une serrure sur la porte située %s.",
    "roomLockpickFailed": "%s ne parvient pas à crocheter une serrure sur la porte située %s."
};

function help () {
    return [
        {
            section: 'Commande',
            text: 'Lockpick - action de crochetage de serrure verrouillée.'
        },
        {
            section: 'Syntaxe',
            text: 'lockpick {i direction|objet}'
        },
        {
            section: 'Description',
            text: "Cette action permet de crocheter une serrure verrouillée. Si la valeur du talent de crochetage du joueur est supérieure ou égale à la difficulté de la serrure, le joueur réussit à déverrouiller la porte ou l'objet. "
        },
        {
            section: "Paramètres",
            text: [
                "direction : Une direction parmis les suivantes : n: nord, e: est, w: ouest, s: sud, ne: nord-est, nw: nord-ouest, se: sud-est, sw: sud-ouest.",
                "objet : Identifiant local de l'objet. Cet identifiant peut-être listé grace à la commande {link \"help look\" look}."
            ]
        }
    ];
}

function main(context, sDirectionOrEntity) {
    // déterminer si c'est une direction
    if (context.mud.isDirection(sDirectionOrEntity)) {
        const sDirection = context.mud.getValidDirection(sDirectionOrEntity);
        const idPlayer = context.pid;
        const mud = context.mud;
        const oPlayer = mud.getEntity(idPlayer);
        const idRoom = mud.getEntity(idPlayer).location;
        const {valid, locked, dcLockpick, code} = mud.getPlayerDoorStatus(idPlayer, sDirection);
        if (!valid) {
            // porte non valide !
            mud.notifyPlayer(idPlayer, STRINGS.doorInvalid);
            return;
        }
        if (!locked) {
            // porte non verrouillée
            mud.notifyPlayer(idPlayer, STRINGS.doorNotLocked);
            return;
        }
        if (code) {
            // la porte possède un code
            mud.notifyPlayer(idPlayer, STRINGS.doorHasCode);
            return;
        }
        // récupérer le talent du joueur
        const nSkill = mud.getPlayerSkill(idPlayer, 'lockpick');
        if (nSkill >= dcLockpick) {
            // on crochète
            mud.notifyPlayerSuccess(idPlayer, STRINGS.lockpickSuccess);
            mud.notifyRoom(idPlayer, STRINGS.roomLockpickSuccess, oPlayer.name, 'directions.v' + sDirection);
            mud.setDoorLocked(idRoom, sDirection, false);
        } else {
            mud.notifyPlayerFailure(idPlayer, STRINGS.lockpickFailed);
            mud.notifyRoom(idPlayer, STRINGS.roomLockpickFailed, oPlayer.name, 'directions.v' + sDirection);
        }
    } else {
        // ce n'est pas une direction, c'est un objet plaçable, ou un item du genre : sac ou besace
    }
}

module.exports = { main, help };
