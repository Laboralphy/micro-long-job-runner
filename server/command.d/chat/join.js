/**
 * Un utilisateur rejoin un canal de discussion
 * @param txat {object} système de chat
 * @param connector {object} système de transmission d'ordre au client
 * @param uid {string} identifiant du client rejoigneur
 * @param cid {string} identifiant du canal rejoint
 */
module.exports = function ({ txat, connector }, uid, cid) {
    // vérifier si le canal existe vraiment (si oui, obtenir l'instance du canal)
    let channel = txat.hasChannel(cid) ? txat.getChannel(cid) : null;
    const user = txat.getUser(uid);
    if (!channel) {
        // le canal n'existe pas : le créer
        channel = txat.createChannel();
        channel.id = cid;
        channel.name = cid;
        channel.types.add('public'); // canal public
        txat.addChannel(channel); // ajouter le canal au système de chat
        channel.addUser(user); // ajouter l'utilisateur dans le canal
    } else if (!channel.userPresent(user)) {
        // le canal existe déja mais l'utilisateur n'y est pas
        channel.addUser(user); // l'ajouter
    }
    if (channel.userPresent(user)) {
        // la creeation du canal s'est bien passée
        connector.scTermCreate(uid, cid); // demander au clien la création d'un nouveau terminal.
    }
}
