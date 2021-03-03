function help () {
    return [
        {
            section: 'Commande',
            text: 'Search - Recherche de passages secrets.'
        },
        {
            section: 'Syntaxe',
            text: 'search {i direction}'
        },
        {
            section: 'Description',
            text: "Cette action permet d'effectuer une recherche de passages secrets. Certaines portes sont, en effet, camouflées et on ne peut pas les voir lorsqu'on regarde la pièce avec la commande {link \"help look\" look}. Seule une recherche permet de mettre les portes cachées en évidence."
        },
        {
            section: "Paramètres",
            text: "direction : une direction parmi les suivantes : n: nord, e: est, w: ouest, s: sud, ne: nord-est, nw: nord-ouest, se: sud-est, sw: sud-ouest."
        }
    ];
}

function main ({ mud, pid }, sDirection) {
    const nSkill = mud.getPlayerSkill(pid, 'spot');
    const { valid, secret, visible, dcSearch } = mud.getPlayerDoorStatus(pid, sDirection);
    if (!valid) {
        mud.notifyPlayer(pid, 'events.doorSearchFailed');
    }
    if (visible) {
        mud.notifyPlayer(pid, 'events.doorSearchElsewhere');
    }
    if (secret && nSkill >= dcSearch) {
        mud.setPlayerDoorSpotted(pid, sDirection, true);
        mud.notifyPlayer(pid, 'events.doorSearchSuccess');
    }
}

module.exports = { main, help };
