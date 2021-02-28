const ServiceAbstract = require('@laboralphy/ws-service/abstract');
const Txat = require('../../../libs/tiny-txat');
const util = require('util');
const path = require('path');
const mixin = require('../../../libs/mixin');
const Scriptorium = require('../../../libs/scriptorium');
const clientServerComMixin = require('../../mixins/client-server-com-mixin');

class ServiceTxat extends ServiceAbstract {
    init() {
        const sc = new Scriptorium();
        const ts = new Txat.System();
        const cg = ts.createChannel();
        cg.types.add('system');
        cg.types.add('persistent');
        cg.types.add('home');
        cg.types.add('public');
        cg.id = '#home';
        cg.name = 'Home Channel';

        ts.on('user-joins', ({to, uid, cid}) => this._userJoins(to, uid, cid));
        ts.on('user-leaves', ({to, uid, uname, cid}) => this._userLeaves(to, uid, uname, cid));
        ts.on('user-message', ({to, uid, cid, message}) => this._userMessage(to, uid, cid, message));
        ts.on('log', ({message}) => console.log('[txat]', message));

        ts.addChannel(cg);
        this._txat = ts;
        this._scriptorium = sc;
        const SCRIPT_LOADED_STR = '[scripts] scripts loaded';
        console.time(SCRIPT_LOADED_STR)
        sc.index(path.resolve(__dirname, '../../command.d')).then(tree => {
            console.timeEnd(SCRIPT_LOADED_STR);
        });
    }

    /**
     * Each channel user is notified that a new user is arriving on the channel
     * @param to {string} user id to be notified
     * @param uid {string} arriving user id
     * @param cid {string} channel id
     * @private
     */
    _userJoins(to, uid, cid) {
        if (to === uid) {
            this.scTermSelect(to, cid);
        } else {
            const user = this._txat.getUser(uid);
            this.scTermPrint(to, cid, util.format('[%s] %s has joined the channel.', cid, user.name));
        }
    }

    /**
     * A user has left a channel
     * @param to {string} user id to be notified
     * @param uid {string} leaving user id
     * @param uname {string} leaving user name
     * @param cid {string} channel id
     * @private
     */
    _userLeaves(to, uid, uname, cid) {
        if (to === uid) {
            this.socketEmit(to, 'TERM_CLOSE', {screen: cid});
        } else {
            this.scTermPrint(to, cid, util.format('[%s] %s has left the channel.', cid, uname));
        }
    }

    /**
     * A user has sent a message to a channel
     * @param to {string} user id to be notified
     * @param uid {string} speaking user id
     * @param cid {string} channel id
     * @param message {string} message content
     * @private
     */
    _userMessage(to, uid, cid, message) {
        const user = this._txat.getUser(uid);
        this.scTermPrint(to, cid, util.format('[%s] %s: %s', cid, user.name, message));
    }

    connectClient(client) {
        // client is connected
        const socket = client.socket;
        const uid = client.id;
        console.log('[txat] client', client.id, 'is connected');

        const context = {
            txat: this._txat,
            connector: this,
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
        try {
            const oUser = this._txat.getUser(client.id);
            this._txat.dropUser(oUser);
        } catch (e) {
            console.log('[txat] disconnecting an unregistred screens user : ', client.id);
        }
    }
}

mixin(ServiceTxat, clientServerComMixin);

module.exports = ServiceTxat;
