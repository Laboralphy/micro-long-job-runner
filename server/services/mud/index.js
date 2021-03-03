const ServiceAbstract = require('@laboralphy/ws-service/abstract');
const util = require('util');
const path = require('path');
const Scriptorium = require('../../../libs/scriptorium');
const MUDEngine = require('./MUDEngine');
const STATE = require('./w3000.json');

class ServiceMUD extends ServiceAbstract {
    init() {
        const sc = new Scriptorium();
        const m = new MUDEngine();
        m.state = STATE;
        m.events.on('player-event', ({ id, message }) => {
            this.socketEmit(id, 'TERM_PRINT', { screen: null, content: '{pa ' + message + '}' });
        });
        m.events.on('other-player-event', ({ id, message }) => {
            this.socketEmit(id, 'TERM_PRINT', { screen: null, content: '{opa ' + message + '}' });
        });
        m.events.on('admin-event', ({ message }) => {
            console.log('[admin]', message);
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
        const pid = this._mud.getPlayerId(uid);

        const print = message => this.socketEmit(uid, 'TERM_PRINT',{ screen: null, content: message });
        const quit = () => socket.disconnect();
        const help = sCommand => {
            const h = this._scriptorium.displayHelp(sCommand);
            if (h) {
                h.forEach(({ section, text }) => {
                    print('{imp ' + section + '}');
                    if (Array.isArray(text)) {
                        text.forEach(print);
                        print('');
                    } else {
                        print(text);
                        print('');
                    }
                });
            } else {
                print('Unknown command : ' + sCommand);
            }
        }

        const context = {
            print,
            quit,
            uid,
            help,
            mud: this._mud,
            pid
        };

        socket.onAny((sCommand, args) => {
            if (sCommand.startsWith('CMD::')) {
                const sScript = sCommand.substr(5);
                if (this._scriptorium.scriptExists(sScript)) {
                    this
                      ._scriptorium
                      .runScript(sScript, context, ...args)
                      .catch(e => {
                          console.error(e);
                          this.getClient(uid).socket.disconnect();
                      });
                } else {
                    print('{neg Unknown command : ' + sScript + '}');
                }
            }
        });
    }

    disconnectClient(client) {
        this._mud.destroyEntity(this._mud.getPlayerId(client.id));
    }
}

module.exports = ServiceMUD;
