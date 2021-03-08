const STRINGS = {
    youDroppedHere: 'Vous déposez %s ici.',
    youDroppedCont: 'Vous déposez %s dans %s.',
    someoneDroppedHere: "%s dépose %s ici.",
    someoneDroppedCont: '%s dépose %s dans %s.',
    itemNotInInv: "Pas d'objet identifié [%s] dans votre inventaire.",
    itemNotInRoom: "Ceci ne correspond à aucun objet visible dans cette pièce.",
    containerTooFar: "Le dernier contenant ouvert n'est pas ici.",
    mustBeMore: "Vous ne ramassez rien.",
    recurse: "Vous ne pouvez pas faire cela."
};

function help () {
    return [
        {
            section: 'Commande',
            text: "Drop - action de déposer un objet."
        },
        {
            section: 'Syntaxe',
            text: 'drop {i objet} [{i nombre}]'
        },
        {
            section: 'Description',
            text: [
                "Cette commande permet de se débarrasser d'un objet de son inventaire.",
                "Si l'objet est empilable, on peut spécifier le nombre d'exemplaires qu'on souhaite jeter en le spécifiant dans le deuxième paramètre.",
                "Si le joueur a récemment ouvert un contenant (coffre, armoire...) à l'aide de la commande {link \"help open\" open}, l'objet sera déposé dans ce contenant.",
                "Si le joueur a récemment fermé un contenant à l'aide de la commande {link \"help close\" close}, ou s'il vient d'entrer dans une pièce, l'objet sera déposé directement quelque-part dans la pièce."
            ]
        },
        {
            section: "Paramètres",
            text: "objet : Un identifiant local d'objet. Ces identifiants sont visibles quand on lance la commande {link \"inv\" inv}."
        }
    ];
}

/**
 *
 * @param mud {MUDEngine}
 * @param print
 * @param command
 * @param pid
 * @param lid
 * @param count
 */
function main ({ mud, print, command, pid }, lid, count = Infinity) {
    if (count < 1) {
        mud.notifyPlayerFailure(pid, STRINGS.mustBeMore);
        return;
    }
    const oPlayer = mud.getEntity(pid);
    const idCC = mud.getPlayerCurrentContainer(pid);
    const oObject = mud.getInventoryLocalEntity(pid, lid);
    if (!oObject) {
        mud.notifyPlayerFailure(pid, STRINGS.itemNotInInv, lid);
        return;
    }
    if (idCC) {
        // un container actuellement ouvert
        const oCC = mud.getEntity(idCC);
        if (oObject) {
            // l'identifiant local est valide
            const oTransfer = mud.moveItem(oObject.id, idCC, count);
            if (oTransfer) {
                mud.notifyPlayer(pid, STRINGS.youDroppedCont, oTransfer.name, oCC.name);
                mud.notifyRoom(pid, STRINGS.someoneDroppedCont, oPlayer.name, oTransfer.name, oCC.name);
            } else {
                mud.notifyPlayerFailure(pid, STRINGS.recurse);
            }
            return oTransfer;
        } else {
            // le lid ne correspond pas à un objet valide
            // l'objet voulu n'est pas dedans
            mud.notifyPlayerFailure(pid, STRINGS.itemNotInCont);
            return null;
        }
    } else {
        // déposer l'objet au sol
        const idRoom = mud.getEntity(pid).location;
        const oTransfer = mud.moveItem(oObject.id, idRoom, count);
        mud.notifyPlayer(pid, STRINGS.youDroppedHere, oTransfer.name);
        mud.notifyRoom(pid, STRINGS.someoneDroppedHere, oPlayer.name, oTransfer.name);
    }
}

module.exports = { main, help };
