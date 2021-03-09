STRINGS = {
    notContainer: "%s n'est pas un contenant.",
    containerOpen: "Vous ouvrez %s.",
    roomContainerOpen: "%s ouvre %s."
};

function help () {
    return [
        {
            section: 'Commande',
            text: "Inv - consulter un inventaire."
        },
        {
            section: 'Syntaxe',
            text: 'inv [{i objet}]'
        },
        {
            section: 'Description',
            text: [
                "Cette commande permet de consulter un inventaire.",
                "Lancée sans paramètre, cette commande permttra à un joueur de consulter son propre inventaire, ainsi que celui du dernier contenant examiné, si le contenant est toujours dans la même pièce que le joueur.",
                "Si un paramètre (un identifiant local) est spécifié, il doit désigner un objet de type contenant accessible par le joueur. Dans ce cas, c'est l'inventaire de l'objet-contenant qui est affiché.",
                "La commande permet de changer le contenant par défaut utilisé pour les échange d'objet grâce aux commandes {link \"help take\" take} et {link \"help drop\" drop}."
            ]
        },
        {
            section: "Paramètres",
            text: "objet : (optionel) un identifiant local désignant un conteneur dont on souhaite examiner le contenu. Si ce paramètre est omis, c'est le dernier objet contenant qui est examiné."
        }
    ];
}

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
        if (oContainer && mud.checkContainer(pid, oContainer.id) && !oContainer.locked) {
            mud.setPlayerCurrentContainer(pid, oContainer.id);
        }
    }
    invBoth(context);
}

module.exports = { main, help };
