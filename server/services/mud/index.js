const ServiceAbstract = require('@laboralphy/ws-service/abstract');
const util = require('util');
const path = require('path');
const Scriptorium = require('../../../libs/scriptorium');
const MUDEngine = require('./MUDEngine');

class ServiceMUD extends ServiceAbstract {
    init() {
        const sc = new Scriptorium();
        const m = new MUDEngine();
        m.events.on('player-event', ({ id, message }) => {
            this.socketEmit(id, 'TERM_PRINT', { screen: null, content: message });
        });
        this._scriptorium = sc;
        this._mud = m;
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
            print: message => this.socketEmit(uid, 'TERM_PRINT',{ screen: null, content: message }),
            mud: this._mud
        };

        socket.onAny((sCommand, args) => {
            if (sCommand.startsWith('CMD::')) {
                this
                    ._scriptorium
                    .runScript(sCommand.substr(5), context, uid, ...args)
                    .catch(e => {
                        console.error(e);
                        this.getClient(uid).socket.disconnect();
                    });
            }
        });
    }

    disconnectClient(client) {
    }
}

module.exports = ServiceMUD;
