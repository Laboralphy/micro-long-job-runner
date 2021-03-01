module.exports = function({ mud, command }, uid, sDirection) {
    const idPlayer = mud.getPlayerId(uid);
    const { valid, visible, locked, destination } = mud.getPlayerDoorStatus(idPlayer, sDirection);
    if (valid && visible && !locked) {
        mud.notifyPlayerEvent(idPlayer, '$events.walk', '$directions.v' + sDirection);
        const oPlayer = mud.getPlayer(idPlayer);
        mud.notifyRoomEvent(oPlayer.location, idPlayer, '$events.roomPlayerLeft', oPlayer.name,'$directions.v' + sDirection);
        mud.setEntityLocation(idPlayer, destination);
        mud.notifyRoomEvent(oPlayer.location, idPlayer, '$events.roomPlayerArrived', oPlayer.name);
        command('look', uid);
    } else {
        mud.notifyPlayerEvent(idPlayer, '$events.cannotWalk', '$directions.v' + sDirection);
    }
}
