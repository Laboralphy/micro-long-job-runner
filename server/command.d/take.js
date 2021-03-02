/**
 *
 * @param mud {MUDEngine}
 * @param print
 * @param command
 * @param pid
 * @param lid
 */
function main ({ mud, print, command, pid }, lid) {
  // récupérer l'objet s'il existe
  // sortir l'objet de la liste des items de la room, et l'intégrer à l'inventaire du joueurs
  // la commande ne fonctionne que sur les objets
  const idRoom = mud.getEntity(pid).location;
  const oObject = mud.getRoomLocalEntity(idRoom, lid);
  if (oObject) {

  } else {
    // l'objet n'a pas été trouvé
  }
}

module.exports = { main };
