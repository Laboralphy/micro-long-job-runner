module.exports = {
    /**
     * Ordonne à un client d'écrire une chain e de caractère dans un terminal
     * @param to
     * @param cid
     * @param message
     * @private
     */
    scTermPrint (to, cid, message) {
        this.socketEmit(to, 'TERM_PRINT', {screen: cid, content: message});
    },

    /**
     * Ordonne au client de créer un nouveau terminal
     * @param to {string} identifiant du client à qui envoyer l'ordre
     * @param cid {string} identifiant terminal
     * @private
     */
    scTermCreate (to, cid) {
        this.socketEmit(to, 'TERM_CREATE', { screen: cid });
    },

    /**
     * Ordonne au client de fermer un terminal donner
     * @param to {string} identifiant du client à qui envoyer l'ordre
     * @param cid {string} identifiant terminal concerné
     * @private
     */
    scTermClose (to, cid) {
        this.socketEmit(to, 'TERM_CLOSE', { screen: cid });
    },

    /**
     * Ordonne au client de changer le terminal courant
     * @param to {string} identifiant du client à qui envoyer l'ordre
     * @param cid {string} identifiant terminal concerné
     * @private
     */
    scTermSelect (to, cid) {
        this.socketEmit(to, 'TERM_SELECT', { screen: cid });
    },

    /**
     * Ordone au client d'effacer l'un de ses terminaux
     * @param to {string} identifiant du client à qui envoyer l'ordre
     * @param cid {string} identifiant terminal concerné
     * @private
     */
    scTermClear (to, cid) {
        this.socketEmit(to, 'TERM_CLEAR', { screen: cid });
    }
}