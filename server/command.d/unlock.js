const STRINGS = {
    'keyNotFound': 'Vous n\'avez pas la clé de cette serrure.',
    'keyFound': 'Vous déverouillez la porte avec %s.',
    'roomKeyFound': '%s déverrouille la porte %s.'
};

function main({ mud, pid }, sDirection, sCode) {
    if (!mud.checkDirection(pid, sDirection)) {
        return;
    }
    // vérifier si on possède la clé pour ouvrir la porte
    // quel est le tag de la serrure ?
    const oDoorStatus = mud.getPlayerDoorStatus(pid, sDirection);
    const sTag = oDoorStatus.key;
    // rechercher dans notre inventaire un item/clé ayant le tag
    const idFoundKey = mud.findItemTag(sTag, pid);
    if (idFoundKey) {
        const oKey = mud.getEntity(idFoundKey);
        const oPlayer = mud.getEntity(pid);
        mud.setDoorLocked(oPlayer.location, sDirection, false);
        mud.notifyPlayerSuccess(pid, STRINGS.keyFound, oKey.name);
        mud.notifyRoom(oPlayer.location, pid, STRINGS.roomKeyFound, oPlayer.name, 'directions.a' + sDirection);
    } else {
        mud.notifyPlayerFailure(pid, STRINGS.keyNotFound);
    }
}

module.exports = { main };
