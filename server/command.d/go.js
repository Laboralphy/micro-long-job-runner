function help () {
    return [
      "{imp Commande}",
      "{tab Go - action de déplacement dans le monde.}",
      "",
      "{imp Syntaxe}",
      "{tab go direction}",
      "",
      "{imp Description}",
      "{tab Cette action permet d'emprunter une issue pour passer d'une pièce à une autre. Cette action peut échouer si la direction spécifiée ne correspond pas à une issue valide, ou bien si l'issue est infranchissable (verrouillée).}",
      "",
      "{imp Paramètres}",
      "{tab direction : une direction parmis les suivantes : n: nord, e: est, w: ouest, s: sud, ne: nord-est, nw: nord-ouest, se: sud-est, sw: sud-ouest.}"
    ];
}

function main ({ mud, print, command }, uid, sDirection) {
    const idPlayer = mud.getPlayerId(uid);
    const { valid, visible, locked, destination } = mud.getPlayerDoorStatus(idPlayer, sDirection);
    if (valid && visible && !locked) {
        mud.notifyPlayerEvent(idPlayer, '$events.walk', '$directions.v' + sDirection);
        const oPlayer = mud.getPlayer(idPlayer);
        mud.notifyRoomEvent(oPlayer.location, idPlayer, '$events.roomPlayerLeft', oPlayer.name,'$directions.v' + sDirection);
        mud.setEntityLocation(idPlayer, destination);
        mud.notifyRoomEvent(oPlayer.location, idPlayer, '$events.roomPlayerArrived', oPlayer.name);
        mud
          .renderPlayerVisualReport(idPlayer)
          .forEach(s => print(s));
    } else {
        mud.notifyPlayerEvent(idPlayer, '$events.cannotWalk', '$directions.v' + sDirection);
    }
}

module.exports = { main, help };
