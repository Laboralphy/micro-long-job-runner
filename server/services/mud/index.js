const ServiceAbstract = require('@laboralphy/ws-service/abstract');
const util = require('util');
const path = require('path');
const Scriptorium = require('../../../libs/scriptorium');

class ServiceMUD extends ServiceAbstract {
    init() {
        const sc = new Scriptorium();
        this._scriptorium = sc;
        const SCRIPT_LOADED_STR = '[scripts] scripts loaded';
        console.time(SCRIPT_LOADED_STR)
        sc.index(path.resolve(__dirname, '../../command.d')).then(tree => {
            console.timeEnd(SCRIPT_LOADED_STR);
        });
    }

    connectClient(client) {
        // client is connected
        const socket = client.socket;
        const uid = client.id;

        const context = {
            print: message => this.socketEmit(uid, 'TERM_PRINT',{ screen: null, content: message })
        };

        socket.onAny((sCommand, args) => {
            this
                ._scriptorium
                .runScript(sCommand, context, uid, ...args)
                .catch(e => {
                    console.error(e);
                    this.getClient(uid).socket.disconnect();
                });
        });
    }

    disconnectClient(client) {
    }
}

module.exports = ServiceMUD;
