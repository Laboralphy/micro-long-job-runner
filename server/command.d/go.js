const STRINGS = {
    "walk": "Vous allez %s.",
    "cannotWalk": "Vous ne pouvez pas aller %s.",
    "roomPlayerArrived": "%s vient d'arriver ici.",
    "roomPlayerLeft": "%s s'éloigne %s.",
};

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
    // verifie le paramètre direction
    if (!mud.checkDirection(pid, sDirection)) {
      return;
    }
    const { valid, visible, locked, destination } = mud.getPlayerDoorStatus(pid, sDirection);
    const sToDir = 'directions.v' + sDirection;
    if (valid && visible && !locked) {
        const oPlayer = mud.getEntity(pid);
        mud.notifyPlayer(pid, STRINGS.walk, sToDir);
        mud.notifyRoom(pid, STRINGS.roomPlayerLeft, oPlayer.name, sToDir);
        mud.setEntityLocation(pid, destination);
        mud.notifyRoom(pid, STRINGS.roomPlayerArrived, oPlayer.name);
        mud.notifyMapChange(pid);
        mud
          .renderPlayerVisualReport(pid)
          .forEach(s => print(s));
    } else {
        mud.notifyPlayer(pid, STRINGS.cannotWalk, sToDir);
    }
}

module.exports = { main, help };
