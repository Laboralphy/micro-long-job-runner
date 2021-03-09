function help () {
  return [
    {
      section: 'Commande',
      text: "Logout - déconnexion du jeut."
    },
    {
      section: 'Syntaxe',
      text: 'logout'
    },
    {
      section: 'Description',
      text: [
        "Cette commande déconnecte le client du serveur de jeu.",
        "Le personnage du joueur est retiré du jeu, et sauvegardé jusqu'à ce que le joueur se reconnecte."
      ]
    }
  ];
}

/**
 * Un utilisateur se déconnecte du systeme
 * @param quit {object} quitter le serveur
 * @param uid {string} id utilisateur qui se log
 * @param name {string} nom fournit par l'utilisatreur
 */
function main ({ quit }, name) {
  quit();
}

module.exports = { main, help };
