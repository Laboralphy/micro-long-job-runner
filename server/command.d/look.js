module.exports = function ({ mud, print, command }, uid) {
    const idPlayer = mud.getPlayerId(uid);
    mud
        .renderPlayerVisualReport(idPlayer)
        .forEach(s => print(s));
}