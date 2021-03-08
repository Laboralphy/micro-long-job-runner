function main ({ pid, mud, print }) {
    // afficher les objet de son inventaire
    const aItems = mud.renderPlayerInventory(pid);
    aItems.forEach(print);
}

module.exports = { main };
