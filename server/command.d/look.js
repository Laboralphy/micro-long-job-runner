const STRINGS = {
    "lookAround": "Vous regardez autour de vous.",
    "lookEntity": "Vous examinez %s."
};

function help () {
    return [
        {
            section: 'Commande',
            text: "Look - action d'examen d'objet, créature ou pièce."
        },
        {
            section: 'Syntaxe',
            text: 'look [{i objet}]'
        },
        {
            section: 'Description',
            text: [
                "Cette action permet d'examiner un objet ou la pièce dans laquelle on se trouve.",
                "Lancée sans paramètre, la commande affiche une description de la pièce dans laquelle on se trouve, ainsi que la liste des entité visibles (objets, créatures). Chaque entité est listée avec un identifiant local qu'il est possible de réutiliser en paramètre pour examiner en détaille l'objet ou la créature concernée."
            ]
        },
        {
            section: "Paramètres",
            text: "objet : (optionel) Un identifiant local d'objet. Ces identifiants sont visibles quand on lance la commande sans paramètres."
        }
    ];
}

function describeItem ({ print, mud }, oEntity) {
    const oBlueprint = oEntity.blueprint;
    oBlueprint.desc.forEach(s => print(s));
    print(mud.getString('ui.weight') + ': ' + oBlueprint.weight);
}

function describePlayer ({ print, mud }, oPlayer) {
    oPlayer.blueprint.desc.forEach(s => print(s));
}

function main (context, lid) {
    const { mud, print, pid } = context;
    if (lid) {
        const idRoom = mud.getEntity(pid).location;
        const oEntity = mud.getRoomLocalEntity(idRoom, lid);
        const oPlayer = mud.getEntity(pid);
        if (oEntity) {
            mud.notifyPlayer(pid, STRINGS.lookEntity, oEntity.name);
            // entité trouvée grace au local id
            switch (oEntity.blueprint.type) {
                case 'player':
                    describePlayer(context, oEntity);
                    break;

                case 'item':
                case 'placeable':
                    // si c'est un objet avec un inventaire...
                    if (oEntity.inventory) {
                        oPlayer.data.mostRecentLookedContainer = oEntity.id;
                    }
                    describeItem(context, oEntity);
                    break;
            }
        }
    } else {
        mud.notifyPlayer(pid, STRINGS.lookAround);
        mud
          .renderPlayerVisualReport(pid)
          .forEach(s => print(s));
    }
}

module.exports = { main, help };
