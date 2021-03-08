const STRINGS = {
    youFoundHere: 'Vous rammassez %s.',
    youFoundCont: 'Vous fouillez %s, et vous prenez %s.',
    someoneFoundHere: "%s fouille dans la pièce et déniche %s.",
    someoneFoundCont: '%s fouille dans %s et déniche %s.',
    itemNotInCont: "Pas d'objet identifié [%s] dans %s.",
    itemNotInRoom: "Pas d'objet identifié [%s] dans cette pièce.",
    containerTooFar: "Le dernier contenant ouvert n'est pas ici.",
    mustBeItem: "Vous ne pouvez pas ramasser ceci.",
    mustBeMore: "Vous ne ramassez rien."
};

function help () {
    return [
        {
            section: 'Commande',
            text: "Take - action de prendre un objet."
        },
        {
            section: 'Syntaxe',
            text: 'take {i objet} [{i nombre}]'
        },
        {
            section: 'Description',
            text: [
                "Cette commande permet de prendre un objet visible dans la pièce où l'on se trouve ou dans le contenant que l'on vient d'ouvrir.",
                "Si l'objet est empilable, on peut spécifier le nombre d'exemplaires qu'on souhaite prendre en le spécifiant dans le deuxième paramètre.",
                "Si le joueur a récemment ouvert un contenant (coffre, armoire...) à l'aide de la commande {link \"help open\" open}, l'objet sera pris depuis contenant.",
                "Si le joueur a récemment fermé un contenant à l'aide de la commande {link \"help close\" close}, ou s'il vient d'entrer dans une pièce, l'objet sera pris directement parmis ceux qui traînent dans la pièce."
            ]
        },
        {
            section: "Paramètres",
            text: "objet : Un identifiant local d'objet. Ces identifiants sont visibles grâce à la commande {link \"help look\", look}. Les objets enfermés dans un contenant sont visibles avec la commande {link \"help open\" open}."
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

    const oObject = mud.getLocalEntity(pid, lid);
    if (oObject === null || (oObject && oObject.blueprint.type !== 'item')) {
        mud.notifyPlayerFailure(pid, STRINGS.mustBeItem);
        return;
    }
    const oPlayer = mud.getEntity(pid);
    const cc = mud.getPlayerCurrentContainer(pid);
    const oCC = cc ? mud.getEntity(cc) : null;
    if (oObject && oObject.blueprint.type === 'item') {
        const oTransfer = mud.moveItem(oObject.id, pid, count);
        if (oCC) {
            mud.notifyPlayer(pid, STRINGS.youFoundCont, oCC.name, oTransfer.name);
            mud.notifyRoom(pid, STRINGS.someoneFoundCont, oPlayer.name, oCC.name, oTransfer.name);
        } else {
            mud.notifyPlayer(pid, STRINGS.youFoundHere, oTransfer.name);
            mud.notifyRoom(pid, STRINGS.someoneFoundHere, oPlayer.name, oTransfer.name);
        }
    } else {
        // le lid ne correspond pas à un objet valide
        // l'objet voulu n'est pas dedans
        if (oCC) {
            mud.notifyPlayerFailure(pid, STRINGS.itemNotInCont, lid, oCC.name);
        } else {
            mud.notifyPlayerFailure(pid, STRINGS.itemNotInRoom, lid);
        }
    }
}

module.exports = {main, help};
