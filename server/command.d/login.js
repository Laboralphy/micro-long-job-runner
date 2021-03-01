/**
 * Un utilisateur se connecte au systeme
 * @param command {object} systeme de commandes
 * @param mud {object} moteur du mud
 * @param uid {string} id utilisateur qui se log
 * @param name {string} nom fournit par l'utilisatreur
 */
module.exports = function ({ mud, command }, uid, name) {
    mud.createNewPlayer(uid, name);
}