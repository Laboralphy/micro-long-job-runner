/**
 * L'utilisateur change d'écran
 * @param connector
 * @param uid
 * @param cid
 */
module.exports = function ({ connector }, uid, cid) {
    connector.scTermSelect(uid, cid);
}