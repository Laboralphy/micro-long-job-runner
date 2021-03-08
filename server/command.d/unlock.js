const STRINGS = {
    'codeApproach': 'Vous tapotez votre code sur le clavier de la porte.',
    'keyNotFound': 'Vous n\'avez pas la clé de cette serrure.',
    'keyFound': 'Vous déverouillez la porte avec %s.',
    'codeEntered': 'Le code déverrouille la porte.',
    'codeError': 'Le code ne fonctionne pas sur cette porte.',
    'roomKeyFound': '%s déverrouille la porte %s.',
    'roomCodeEntered': '%s déverrouille la porte %s à l\'aide d\'un code.',
    'roomCodeApproach': '%s tapote un code sur le clavier de la porte %s.',
    'roomCodeError': 'Une brève lueur rouge indique que la porte reste verrouillée.',
};

function help () {
    return [
        {
            section: 'Commande',
            text: "Unlock - déverrouillage d'une porte."
        },
        {
            section: 'Syntaxe',
            text: 'unlock [{i direction}]'
        },
        {
            section: 'Description',
            text: [
                "Cette action permet de déverrouiller une porte avec une clé en votre possession. Elle ne fonctionne qu'avec les porte verrouillée à clé",
                "La commande doit être lancée avec un paramètre de direction pour définir la porte que vous souhaitez déverrouiller.",
                "Si votre personnage possède la clé correspondant à la serrure, la porte sera déverrouillée.",
            ]
        },
        {
            section: "Paramètres",
            text: "objet : (optionel) Un identifiant local d'objet. Ces identifiants sont visibles quand on lance la commande sans paramètres."
        }
    ];
}

function main({ mud, pid }, sDirection, sCode) {
    if (!mud.checkDirection(pid, sDirection)) {
        return;
    }
    // vérifier si on possède la clé pour ouvrir la porte
    // quel est le tag de la serrure ?
    const oDoorStatus = mud.getPlayerDoorStatus(pid, sDirection);
    const oPlayer = mud.getEntity(pid);
    if (sCode) {
        mud.notifyPlayer(pid, STRINGS.codeApproach);
        mud.notifyRoom(pid, STRINGS.roomCodeApproach);
        mud.notifyRoom(pid, STRINGS.roomCodeEntered, oPlayer.name, 'directions.a' + sDirection);
        if (oDoorStatus.code === sCode) {
            mud.setDoorLocked(oPlayer.location, sDirection, false);
            mud.notifyPlayerSuccess(pid, STRINGS.codeEntered);
            mud.notifyRoom(pid, STRINGS.roomCodeEntered, oPlayer.name, 'directions.a' + sDirection);
        } else {
            mud.notifyPlayerFailure(pid, STRINGS.codeError);
            mud.notifyRoom(pid, STRINGS.roomCodeError, oPlayer.name, 'directions.a' + sDirection);
        }
    } else {
        const sTag = oDoorStatus.key;
        // rechercher dans notre inventaire un item/clé ayant le tag
        const idFoundKey = mud.findItemTag(sTag, pid);
        if (idFoundKey) {
            const oKey = mud.getEntity(idFoundKey);
            mud.setDoorLocked(oPlayer.location, sDirection, false);
            mud.notifyPlayerSuccess(pid, STRINGS.keyFound, oKey.name);
            mud.notifyRoom(pid, STRINGS.roomKeyFound, oPlayer.name, 'directions.a' + sDirection);
        }
    }
    mud.notifyPlayerFailure(pid, STRINGS.keyNotFound);
}

module.exports = { main, help };
