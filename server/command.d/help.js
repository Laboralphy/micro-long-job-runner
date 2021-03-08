function help () {
  return [
    {
      section: 'Commande',
      text: 'Help - affiche de l\'aide concernant une commande.'
    },
    {
      section: 'Syntaxe',
      text: 'help [{i commande}]'
    },
    {
      section: 'Description',
      text: "Affiche la page d\'aide de la commande spécifiée en paramètre. Utilisée sans paramètre, la commande affiche la liste des commandes disponnible sous forme de liens vers leurs pages d\'aide."
    },
    {
      section: "Paramètres",
      text: "commande : nom de la commande dont on souhaite afficher la page d\'aide."
    }
  ];
}

function main ({ print, mud, help }, sCommand) {
  if (sCommand) {
    help(sCommand);
  } else {
    print (Object.keys(mud
        ._scriptorium
        ._routes)
        .filter(s => typeof mud._scriptorium._routes[s].help === 'function')
        .map(s => '{link "help ' + s + '" ' + s + '}')
        .join(' - '));
  }
}

module.exports = { main, help };
