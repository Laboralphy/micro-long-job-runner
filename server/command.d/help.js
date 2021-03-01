function help () {
  return [
    "Affiche l'aide d'une commande."
  ];
}

function main ({ help }, uid, sCommand) {
  help(sCommand);
}

module.exports = { main };
