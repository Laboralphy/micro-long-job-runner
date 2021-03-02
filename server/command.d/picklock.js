const DIRECTIONS = ['n', 'e', 'w', 's', 'ne', 'nw', 'sw', 'se'];

function help () {
    return [
        {
            section: 'Commande',
            text: 'Picklock - action de crochetage de serrure verrouillée.'
        },
        {
            section: 'Syntaxe',
            text: 'picklock {i direction|objet}'
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
    if (DIRECTIONS.includes(sDirectionOrEntity)) {
        const sDirection = sDirectionOrEntity;
        const idPlayer = context.pid;
        const mud = context.mud;
        const oPlayer = mud.getEntity(idPlayer);
        const idRoom = mud.getEntity(idPlayer).location;
        const {valid, locked, dcPicklock, code} = mud.getPlayerDoorStatus(idPlayer, sDirection);
        if (!valid) {
            // porte non valide !
            mud.notifyPlayer(idPlayer, 'events.doorInvalid');
            return;
        }
        if (!locked) {
            // porte non verrouillée
            mud.notifyPlayer(idPlayer, 'events.doorNotLocked');
            return;
        }
        if (code) {
            // la porte possède un code
            mud.notifyPlayer(idPlayer, 'events.doorHasCode');
            return;
        }
        // récupérer le talent du joueur
        const nSkill = mud.getPlayerSkill(idPlayer, 'picklock');
        if (nSkill >= dcPicklock) {
            // on crochète
            mud.notifyPlayer(idPlayer, 'events.picklockSuccess');
            mud.notifyRoom(idRoom, idPlayer, 'events.roomPicklockSuccess', oPlayer.name, 'directions.v' + sDirection);
            mud.setDoorLocked(idRoom, sDirection, false);
        } else {
            mud.notifyPlayer(idPlayer, 'events.picklockFailed');
            mud.notifyRoom(idRoom, idPlayer, 'events.roomPicklockFailed', oPlayer.name, 'directions.v' + sDirection);
        }
    }
}

module.exports = { main, help };
