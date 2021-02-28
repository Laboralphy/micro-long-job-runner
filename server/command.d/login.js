/**
 * Un utilisateur se connecte au systeme
 * - créer un utilisateur pour le système de chat
 * @param txat {object} systeme de chat
 * @param command {object} systeme de commandes
 * @param uid {string} id utilisateur parleur
 * @param name {string}
 */
module.exports = function ({ txat, command }, uid, name) {
    // créer un utilisateur pour le chat
    const oTxatUser = txat.createUser({
        id: uid,
        name: name
    });
    txat.addUser(oTxatUser);
    // rechercher le canal d'accueil
    const oHome = txat.channels.find(c => c.types.has('home'));
    // ajouter l'utilisateur au canal d'accueil
    command('chat/join', uid, oHome.id)
}