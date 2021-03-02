/**
 * Un utilisateur se déconnecte du systeme
 * @param quit {object} quitter le serveur
 * @param uid {string} id utilisateur qui se log
 * @param name {string} nom fournit par l'utilisatreur
 */
function main ({ quit }, name) {
  quit();
}

module.exports = { main };
