/**
 * un utilisateur quitte l'un des canaux de discussion qu'il a précédemment rejoint
 * @param txat {object} system de chat
 * @param uid {string} identifiant de l'utilisateur quitteur
 * @param cid {string} identifiant du canal à quitter
 */
module.exports = function ({ txat }, uid, cid) {
    const channel = txat.getChannel(cid);
    const user = txat.getUser(uid);
    channel.dropUser(user);
}