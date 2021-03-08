const STRINGS = {
    containerClose: "Vous refermez %s."

};

function main ({ mud, pid, print }, lid) {
    // fermeture du contenant
    const cc = mud.getPlayerCurrentContainer(pid);
    if (cc) {
        const oCC = mud.getEntity(cc);
        mud.setPlayerCurrentContainer(pid, '');
        mud.notifyPlayerSuccess(pid, STRINGS.containerClose, oCC.name);
    }
}

module.exports = { main };
