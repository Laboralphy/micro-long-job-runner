function describeItem ({ print, mud }, oEntity) {
    const oBlueprint = oEntity.blueprint;
    oBlueprint.desc.forEach(s => print(s));
    print(mud.getString('ui.descFieldWeight') + ': ' + oBlueprint.weight);
}

function describePlayer ({ print, mud }, oPlayer) {
    oPlayer.desc.forEach(s => print(s));
}

function main (context, s) {
    const { mud, print, pid } = context;
    if (s) {
        const idRoom = mud.getEntityLocation(pid);
        const oEntity = mud.getRoomLocalEntity(idRoom, s);
        if (oEntity) {
            mud.notifyPlayer(pid, '$events.lookEntity', oEntity.name);
            // entité trouvée grace au local id
            switch (oEntity.type) {
                case 'player':
                    describePlayer(context, oEntity);
                    break;

                case 'item':
                    describeItem(context, oEntity);
                    break;
            }
        }
    } else {
        mud.notifyPlayer(pid, '$events.lookAround');
        mud
          .renderPlayerVisualReport(pid)
          .forEach(s => print(s));
    }
}

module.exports = { main };
