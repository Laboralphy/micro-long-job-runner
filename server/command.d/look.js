function main ({ mud, print, command }, uid, sType) {
    const idPlayer = mud.getPlayerId(uid);
    switch (sType) {
        case 's':
            // secteur

        break;

        case 'r':
            // pièce
        break;

        case 'x':
            // issues
        break;

        case 'o':
            // objets
        break;

        case 'c':
            // personnage
        break;

        default:
            mud.notifyPlayerEvent(idPlayer, 'Vous regardez autour de vous.');
            mud
              .renderPlayerVisualReport(idPlayer)
              .forEach(s => print(s));
        break;
    }
}

module.exports = { main };
