/**
 * un utilisateur envoie un message de discussion sur un canal.
 * tous les utilisateur du canal doivent recevoir le message
 * @param txat {object} système de chat
 * @param uid {string} identifiant de l'utilisateur parleur
 * @param cid {string} identifiant du canl sur lequel est diffusé le message
 * @param message {string} contenu du message
 */
module.exports = function ({ txat }, uid, cid, message) {
    const user = txat.getUser(uid);
    const channel = txat.getChannel(cid);
    channel.transmitMessage(user, message);
}