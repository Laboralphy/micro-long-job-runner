const STRINGS = {
    containerClose: "Vous refermez %s."
};

function help () {
    return [
        {
            section: 'Commande',
            text: "Close - fermeture d'un contenant."
        },
        {
            section: 'Syntaxe',
            text: 'close'
        },
        {
            section: 'Description',
            text: [
                "Cette commande referme le dernier contenant précédemment ouvert avec la commande {link \"help inv\" inv}.",
                "Lorsqu'un contenant est refermé, les objets qu'il contient ne sont plus disponible aux échange avec les commandes {link \"help take\" take} et {link \"help drop\" drop} jusqu'à ce qu'il soit ré-ouvert.."
            ]
        }
    ];
}

function main ({ mud, pid, print }, lid) {
    // fermeture du contenant
    const cc = mud.getPlayerCurrentContainer(pid);
    if (cc) {
        const oCC = mud.getEntity(cc);
        mud.setPlayerCurrentContainer(pid, '');
        mud.notifyPlayerSuccess(pid, STRINGS.containerClose, oCC.name);
    }
}

module.exports = { main, help };
