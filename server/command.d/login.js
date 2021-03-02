/**
 * Un utilisateur se connecte au systeme
 * @param command {object} systeme de commandes
 * @param print {function} fonction d'affichage
 * @param mud {object} moteur du mud
 * @param uid {string} id utilisateur qui se log
 * @param name {string} nom fournit par l'utilisatreur
 */
function main ({ mud, print, command, uid }, name) {
    const idPlayer = mud.createNewPlayer(uid, name, 'room::b3009');
    if (idPlayer === null) {
        // la création initiale du personnage a échoué, à cause du nom
        print(mud.getString('errors.invalidPlayerName'));
    }
}

module.exports = { main };
