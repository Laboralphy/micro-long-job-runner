function main ({ mud, print, command }, uid, sIndexItem) {
  // récupérer l'objet s'il existe
  // sortir l'objet de la liste des items de la room, et l'intégrer à l'inventaire du joueurs
  // la commande ne fonction que sur les objets
  const idPlayer = mud.getPlayerId(uid);
  const idRoom = mud.getEntityLocation(idPlayer);
  const oItems = mud.getRoomItems(idRoom);
  if (sIndexItem in oItems) {

  } else {
    // l'objet n'a pas été trouvé
  }
}

module.exports = { main };
