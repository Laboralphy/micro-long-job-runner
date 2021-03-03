/**
 * Ajoute une entité dans la pièce ou se trouve l'admin
 * @param mud {*} instance du mud
 * @param pid {string} identifiant du joueur
 * @param sBlueprint {string} blueprint de l'objet à instancier
 * @param nCount {number} nombre d'exemplaire (pour les item stackable
 */
function main ({ mud, pid }, sBlueprint, nCount= 1) {
    mud.createEntity(sBlueprint, mud.getEntity(pid).location, nCount);
}

module.exports = { main }
