function help () {
    return [
      {
        section: 'Commande',
        text: 'Go - action de déplacement dans le monde.'
      },
      {
        section: 'Syntaxe',
        text: 'go {i direction}'
      },
      {
        section: 'Description',
        text: "Cette action permet d'emprunter une issue pour passer d'une pièce à une autre. Cette action peut échouer si la direction spécifiée ne correspond pas à une issue valide, ou bien si l'issue est infranchissable (verrouillée)."
      },
      {
        section: "Paramètres",
        text: "direction : une direction parmis les suivantes : n: nord, e: est, w: ouest, s: sud, ne: nord-est, nw: nord-ouest, se: sud-est, sw: sud-ouest."
      }
    ];
}

function main ({ mud, print, command, uid, pid }, sDirection) {
    const { valid, visible, locked, destination } = mud.getPlayerDoorStatus(pid, sDirection);
    if (valid && visible && !locked) {
        mud.notifyPlayer(pid, 'events.walk', 'directions.v' + sDirection);
        const oPlayer = mud.getEntity(pid);
        mud.notifyRoom(oPlayer.location, pid, 'events.roomPlayerLeft', oPlayer.name,'directions.v' + sDirection);
        mud.setEntityLocation(pid, destination);
        mud.notifyRoom(oPlayer.location, pid, 'events.roomPlayerArrived', oPlayer.name);
        mud
          .renderPlayerVisualReport(pid)
          .forEach(s => print(s));
    } else {
        mud.notifyPlayer(pid, 'events.cannotWalk', 'directions.v' + sDirection);
    }
}

module.exports = { main, help };
