const ServiceAbstract = require('@laboralphy/ws-service/abstract');
const path = require('path');
const Logger = require('../../../libs/logger');
const MUDEngine = require('../../../libs/mud-engine');
const STATE = require('./w3000.json');

class ServiceMUD extends ServiceAbstract {
    init() {
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
        m.events.on('ui-change-event', ({ id, map }) => {
            this.socketEmit(id, 'UI_UPADTE', { section: 'map', map });
        });
        this._mud = m;
        const nTimeStart = Date.now();
        m.loadScripts(path.resolve(__dirname, '../../command.d')).then(tree => {
            const nTime = Date.now() - nTimeStart;
            const t = nTime >= 1000 ? (Math.floor(nTime / 100) / 10).toString() + ' s' : nTime.toString() + ' ms';
            Logger.log('[scripts]', tree.length, 'scripts loaded in', t);
        });
    }

    displayCommandHelp (sCommand) {
        const aOutput = [];
        const h = this._mud._scriptorium.displayHelp(sCommand);
        if (h) {
            h.forEach(({ section, text }) => {
                aOutput.push('{imp ' + section + '}');
                if (Array.isArray(text)) {
                    aOutput.push(...text);
                } else {
                    aOutput.push(text);
                }
            });
        } else {
            aOutput.push('Unknown command : ' + sCommand);
        }
        return aOutput;
    }

    connectClient(client) {
        // client is connected
        const socket = client.socket;
        const uid = client.id;
        const pid = this._mud.getPlayerId(uid);
        const print = message => this.socketEmit(uid, 'TERM_PRINT',{ screen: null, content: message });
        const quit = () => socket.disconnect();
        const help = sCommand => this.displayCommandHelp(sCommand).forEach(print);

        const context = {
            print,
            quit,
            uid,
            help,
            mud: this._mud,
            pid
        };

        socket.onAny((sCommand, args) => {
            try {
                if (sCommand.startsWith('CMD::')) {
                    const sScript = sCommand.substr(5);
                    const bValidCommand = this._mud.command(context, sScript, args);
                    if (!bValidCommand) {
                        print('{neg Unknown command : ' + sScript + '}')
                    }
                }
            } catch (e) {
                console.error(e);
                this.getClient(uid).socket.disconnect();
            }
        });
    }

    disconnectClient(client) {
        this._mud.destroyEntity(this._mud.getPlayerId(client.id));
    }
}

module.exports = ServiceMUD;
