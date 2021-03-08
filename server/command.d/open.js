STRINGS = {
    useGo: "Utilisez la commande {link \"help go\" go} pour vous déplacer vers la pièce suivante.",
    notContainer: "L'identifiant [%s] n'est pas valide ici.",
    containerOpen: "Vous ouvrez %s.",
    roomContainerOpen: "%s ouvre %s."
};

function main ({ command, mud, pid, print }, lid) {
    // ouverture d'un contenant
    // il faut traiter les direction
    if (mud.isDirection(lid)) {
        print(STRINGS.useGo);
        return;
    }
    mud.setPlayerCurrentContainer(pid, '');
    // Vérifier que le contenant soit bien un contenant
    const oContainer = mud.getLocalEntity(pid, lid);
    if (oContainer && oContainer.inventory) {
        // c'est bien un contenant
        // afficher son contenu
        mud.setPlayerCurrentContainer(pid, oContainer.id);
        mud.notifyPlayerSuccess(pid, STRINGS.containerOpen, oContainer.name);
        mud.notifyRoom(pid, STRINGS.roomContainerOpen, mud.getEntity('pid').name, oContainer.name);
        mud
            .renderInventory(mud.getInventoryEntities(oContainer.id), oContainer.name)
            .forEach(print);
    } else {
        mud.notifyPlayerFailure(pid, STRINGS.notContainer, lid);
    }
}

module.exports = { main };
