import Events from 'events';
import * as PROTOCOL from './protocol';

class TxatConnector {
    constructor() {
        this._socket = null;
        this._events = new Events();
        this._localName = '';
    }

    get events() {
        return this._events;
    }

    get connected() {
        return !!this._socket && this._socket.connected;
    }

    connect(socket) {
        return new Promise((resolve, reject) => {
            if (this.connected) {
                resolve(true);
                return;
            }
            if (!socket) {
                socket = io(window.location.protocol + '//' + window.location.host);
            }
            if (!socket) {
                reject('could not get websocket instance');
            }
            this._socket = socket;
            socket.on('connect', () => {
                resolve(true);
            });

            socket.on('disconnect', () => {
                this._events.emit('disconnect');
                this._socket = null;
            });

            socket.on('error', (err) => {
                this._events.emit('error', {err});
            });

        });
    }
}

export default TxatConnector;