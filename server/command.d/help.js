function help () {
  return [
    "Affiche l'aide d'une commande."
  ];
}

function main ({ help }, sCommand) {
  help(sCommand);
}

module.exports = { main };
