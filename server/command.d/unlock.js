const STRINGS = {
    'codeApproach': 'Vous tapotez un code sur le clavier de la porte.',
    'roomCodeApproach': '%s tapote un code sur le clavier de la porte %s.',
    'keyFound': 'Vous déverouillez la porte avec %s.',
    'roomKeyFound': '%s déverrouille la porte %s.',
    'codeEntered': 'Le code déverrouille la porte.',
    'roomCodeEntered': '%s déverrouille la porte %s à l\'aide d\'un code.',
    'codeError': 'Code incorrect.',
    'roomCodeError': 'Une brève lueur rouge indique que la porte reste verrouillée.',
    'noLock': 'Cette issue n\'est pas verrouilée.',
    'noCodeRequired': 'Cette porte n\'est pas verrouillée par code.',
    'codeRequired': 'Un code est requis pour ouvrir cette porte.',
    'keyNotFound': 'Vous n\'avez pas la clé de cette serrure.',
    'alreadyUnlocked': 'Cette porte est déjà déverrouillée.',
    'keyDiscarded': 'Vous n\'avez plus besoin de %s.'
};

function help () {
    return [
        {
            section: 'Commande',
            text: "Unlock - déverrouillage d'une porte."
        },
        {
            section: 'Syntaxe',
            text: 'unlock {i direction} [{i code}]'
        },
        {
            section: 'Description',
            text: [
                "Cette action permet de déverrouiller la porte dsignée par le paramètre de direction, soit  avec une clé en votre possession, soit avec un code qu'il faut spécifier en paramètre.",
                "Il n'est pas nécessaire de spécifier la clé à utiliser : Si votre personnage possède la clé correspondant à la serrure, la porte sera déverrouillée. Par contre pour les portes fermées avec un code, il est nécessaire de spécifier le code en paramètre.",
            ]
        },
        {
            section: "Paramètres",
            text: [
                "direction : pour désigner la porte que l'on souhaite déverrouiller.",
                "code : (optionel) Certaine portes exigent un code secret pour s'ouvrir."
            ]
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
    if (!oDoorStatus.lockable) {
        mud.notifyPlayerFailure(pid, STRINGS.noLock);
        return;
    }
    if (!oDoorStatus.locked) {
        mud.notifyPlayerFailure(pid, STRINGS.alreadyUnlocked);
        return;
    }
    if (sCode) {
        if (oDoorStatus.code === '') {
            mud.notifyPlayerFailure(pid, STRINGS.noCodeRequired);
            return;
        }
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
        const aItemsFound = mud.findItemTag(sTag, pid);
        const oKey = aItemsFound[0];
        if (oKey) {
            mud.setDoorLocked(oPlayer.location, sDirection, false);
            mud.notifyPlayerSuccess(pid, STRINGS.keyFound, oKey.name);
            mud.notifyRoom(pid, STRINGS.roomKeyFound, oPlayer.name, 'directions.a' + sDirection);
            if (oDoorStatus.discardKey) {
                mud.destroyEntity(oKey.id);
                mud.notifyPlayer(pid, STRINGS.keyDiscarded, oKey.name);
            }
            return;
        }
        if (oDoorStatus.code) {
            mud.notifyPlayerFailure(pid, STRINGS.codeRequired);
        } else {
            mud.notifyPlayerFailure(pid, STRINGS.keyNotFound);
        }
    }
}

module.exports = { main, help };
