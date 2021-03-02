function describeItem ({ print, mud }, oEntity) {
    const oBlueprint = oEntity.blueprint;
    oBlueprint.desc.forEach(s => print(s));
    print(mud.getString('ui.descFieldWeight') + ': ' + oBlueprint.weight);
}

function describePlayer ({ print, mud }, oEntity) {
}

function main (context, s) {
    const { mud, print, pid } = context;
    if (s) {
        const idRoom = mud.getEntityLocation(pid);
        const oEntity = mud.getRoomLocalEntity(idRoom, s);
        if (oEntity) {
            mud.notifyPlayerEvent(pid, '$events.lookEntity', oEntity.name);
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
        mud.notifyPlayerEvent(pid, '$events.lookAround');
        mud
          .renderPlayerVisualReport(pid)
          .forEach(s => print(s));
    }
}

module.exports = { main };
