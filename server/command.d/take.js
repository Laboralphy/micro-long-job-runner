const STRINGS = {
  'youFound': 'Vous rammassez %s.',
  'youFoundStack': 'Vous rammassez %s (x%s).',
  'someoneFoundHere': "%s fouille dans la pièce et déniche %s.",
  'someoneFound': '%s fouille dans %s et déniche %s.',
  'itemNotInContainer': "L'objet que vous voulez prendre n'est pas dans le contenant.",
  'itemNotInRoom': "Ceci ne correspond à aucun objet visible dans cette pièce.",
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
        if (oObject.blueprint.stackable) {
          mud.notifyPlayer(pid, STRINGS.youFoundStack, oObject.name, count);
        } else {
          mud.notifyPlayer(pid, STRINGS.youFound, oObject.name);
        }
        mud.notifyRoom(idRoom, pid, STRINGS.someoneFound, oPlayer.name, oContainer.name, oObject.name);
      } else {
        // le lid ne correspond pas à un objet valide
        // l'objet voulu n'est pas dedans
        mud.notifyPlayerFailure(pid, STRINGS.itemNotInContainer);
      }
    } else {
      // on est loin du container
      mud.notifyPlayerFailure(pid, STRINGS.containerTooFar);
    }
  } else {
    // l'objet recherché ne correspond pas à un objet au sol
    // ni a un objet contenu dans le dernier content ouvert
    mud.notifyPlayerFailure(pid, STRINGS.itemNotInRoom);
  }
}

module.exports = { main };
