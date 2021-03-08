STRINGS = {
    notContainer: "%s n'est pas un contenant.",
    containerOpen: "Vous ouvrez %s.",
    roomContainerOpen: "%s ouvre %s."
};

/**
 * Afficher l'inventaire du joueur
 * @param mud
 * @param pid
 */
function invSelf ({ mud, pid, print }) {
    // afficher les objet de son inventaire
    const aItems = mud.renderPlayerInventory(pid);
    aItems.forEach(print);
}

/**
 * Ouverture d'un contenant et inspection du contenu
 * @param mud
 * @param pid
 * @param lid
 * @param print
 * @param idContainer {string} normalment toujour valide
 */
function invContainer ({ mud, pid, print }, idContainer) {
    const oContainer = mud.getEntity(idContainer);
    // c'est bien un contenant
    // afficher son contenu
    mud.notifyPlayerSuccess(pid, STRINGS.containerOpen, oContainer.name);
    mud.notifyRoom(pid, STRINGS.roomContainerOpen, mud.getEntity(pid).name, oContainer.name);
    mud
        .renderInventory(mud.getInventoryEntities(oContainer.id), oContainer.name)
        .forEach(print);
}

function invBoth (context) {
    const { mud, pid } = context;
    const cc = mud.getPlayerCurrentContainer(pid);
    if (cc) {
        invContainer(context, cc);
    }
    invSelf(context);
}

function main (context, lid) {
    const { mud, pid } = context;
    if (lid) {
        const oContainer = mud.getValidLocalEntity(pid, lid);
        if (oContainer && mud.checkContainer(pid, oContainer.id)) {
            mud.setPlayerCurrentContainer(pid, oContainer.id);
        }
    }
    invBoth(context);
}

module.exports = { main };
