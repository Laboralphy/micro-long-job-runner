const STRINGS = {
  'youFound': 'Vous rammassez %s.',
  'someoneFoundHere': "%s fouille dans la pièce et déniche %s.",
  'someoneFound': '%s fouille dans %s et déniche %s.',
  'itemNotFound': "L'objet recherché n'est pas dans le contenant.",
  'containerTooFar': "Le dernier contenant ouvert n'est pas dans cette pièce."
};

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
  // vérifions si l'objet recherché est dans la pièce
  const idRoom = mud.getEntity(pid).location;
  let oObject = mud.getRoomLocalEntity(idRoom, lid);
  const oPlayer = mud.getEntity(pid);
  if (oObject) {
    // l'objet est bien dans la pièce
    mud.takeItem(pid, oObject.id, count);
    mud.notifyPlayer(pid, STRINGS.youFound, oObject.name);
    mud.notifyRoom(idRoom, pid, STRINGS.someoneFoundHere, oPlayer.name, oObject.name);
  } else if (oPlayer.data.mostRecentLookedContainer) {
    // l'objet n'était pas dans la pièce
    // peut etre dans le dernier contenant ouvert ?
    const idLastContainer = oPlayer.data.mostRecentLookedContainer;
    const oContainer = mud.getEntity(idLastContainer);
    if (oContainer.location === idRoom) {
      // le dernier contenant ouvert, est bien dans la même pièce que nous
      oObject = mud.getInventoryLocalEntity(idLastContainer, lid);
      if (oObject) {
        // l'objet voulu est bien dedans
        mud.takeItem(idLastContainer, oObject.id, count);
        mud.notifyPlayer(pid, STRINGS.youFound, oObject.name);
        mud.notifyRoom(idRoom, pid, STRINGS.someoneFound, oPlayer.name, oContainer.name, oObject.name);
      } else {
        // le lid ne correspond pas à un objet valide
        // l'objet voulu n'est pas dedans
        mud.notifyPlayer(pid, "itemNotFound");
      }
    } else {
      // on est loin du container
      mud.notifyPlayer(pid, "Le dernier contenant ouvert n'est pas dans cette pièce.");
    }
  } else {
    // on ne cherche pas dans un container valide
  }
}

module.exports = { main };
