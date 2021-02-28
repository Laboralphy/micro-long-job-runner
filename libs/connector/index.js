import Events from 'events';

class Connector {
    constructor() {
        this._socket = null;
        this._events = new Events();
    }

    get events() {
        return this._events;
    }

    get connected() {
        return !!this._socket && this._socket.connected;
    }

    get remoteAddress () {
        return window.location.protocol + '//' + window.location.host;
    }

    get socket () {
        return this._socket;
    }

    connect(socket = null) {
        return new Promise((resolve, reject) => {
            if (this.connected) {
                resolve(true);
                return;
            }
            if (!socket) {
                socket = io(this.remoteAddress);
            }
            if (!socket) {
                reject('could not get websocket instance');
                return;
            }
            this._socket = socket;
            socket.on('connect', () => {
                resolve(true);
            });

            socket.on('disconnect', () => {
                this._events.emit('disconnect');
                this._socket.disconnect();
                this._socket = null;
            });

            socket.on('error', err => {
                this._events.emit('error', {err});
            });

            const aEvtMessages = [
                'TERM_PRINT',
                'TERM_SELECT',
                'TERM_CLOSE',
                'TERM_CLEAR'
            ];
            aEvtMessages.forEach(em => {
                socket.on(em, (...args) => this._events.emit(em, ...args));
            })
        });
    }
}

export default Connector;