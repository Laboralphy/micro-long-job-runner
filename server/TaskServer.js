const io = require('socket.io');
const Logger = require('../libs/logger');
const c = require('ansi-colors');

class TaskServer {
    constructor() {
        this._io = null;
        this._logger = new Logger();
        this.clients = {};
        this._port = 3000;
    }

    get logger() {
        return this._logger;
    }

    /**
     * Each time a clientis connected, this method is called
     * @param socket {Socket}
     * @private
     */
    _clientConnected(socket) {
        const clientId = socket.id;
        this.logger.log('client', clientId, c.green('connected'));
        // register client
        this.clients[clientId] = socket;

        // when client disconnects
        socket.on('disconnect', () => {
            this.logger.log('client', clientId, c.gray('disconnected'));
            delete this.clients[clientId];
        });

        // when client wants to run a task a message
        socket.on('TASK', ({name, args}) => {
            this.logger.log('client', clientId, 'run task')
        });
    }

    /**
     * this method stats the service
     */
    start({port}) {
        return new Promise((resolve, reject) => {
            this._port = port;
            const oServerSocket = io.listen(port);
            this._io = oServerSocket;
            this.logger.log('service : listening on port', port);
            oServerSocket.on('connection', socket => {
                this._clientConnected(socket);
                resolve(true);
            });
        });
    }
}

module.exports = TaskServer;