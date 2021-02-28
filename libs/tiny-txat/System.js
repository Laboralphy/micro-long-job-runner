const Events = require('events');
const util = require('util');
const User = require('./User');
const Channel = require('./Channel');

class System {

    constructor() {
        this._users = [];
        this._channels = [];
        this._events = new Events();
    }

	on(sEvent, pHandler) {
		this._events.on(sEvent, pHandler);
		return this;
	}

	get channels () {
        return this._channels;
    }

	channelPresent(c) {
        return this._channels.indexOf(c) >= 0;
    }

    userPresent(u) {
        return this._users.indexOf(u) >= 0;
    }

    _eventUserJoins(event) {
        // transmettre l'évènement à tous les utilisateurs du canal
        this._events.emit('log', { message: util.format('user %s joins channel %s', event.user.id, event.channel.id)})
        event.channel.users.forEach(u => {
			this._events.emit('user-joins', {
				to: u.id,
				uid: event.user.id,
				cid: event.channel.id
			});
		});
    }

    _eventUserLeaves(event) {
        this._events.emit('log', { message: util.format('user %s leaves channel %s', event.user.id, event.channel.id)})
		event.channel.users.forEach(u =>
			this._events.emit('user-leaves', {
				to: u.id,
				uid: event.user.id, // le user est sur le point de disparaitre
                uname: event.user.name,
				cid: event.channel.id
			})
		);
    }

    _eventUserGotMessage(event) {
        this._events.emit('user-message', {
            to: event.to.id,
            uid: event.from.id,
            cid: event.channel ? event.channel.id : null,
            message: event.message
        });
    }

    createUser({id = null, name = null}) {
        return new User({ id, name });
    }

    createChannel() {
        return new Channel();
    }

    addUser(u) {
        this._events.emit('log', { message: util.format('user %s is registred', u.id)});
        if (!this.userPresent(u)) {
            this._users.push(u);
            u.on('message-received', event => this._eventUserGotMessage(event));
        } else {
            throw new Error('user ' + u.display() + ' is already registered on the system');
        }
    }

    dropUser(u) {
        this._events.emit('log', { message: util.format('user %s is dropped', u.id)});
        if (this.userPresent(u)) {
            // remove from all channels
            this.getUserChannels(u).forEach(c => {
                c.dropUser(u);
                if (c.users.length === 0) {
                    this.dropChannel(c);
                }
            });
            let i = this._users.indexOf(u);
            this._users.splice(i, 1);
        }
    }

	/**
     * Renvoie la liste des canaux auxquels le user est connecté
	 * @param u
	 */
	getUserChannels(u) {
	    return this._channels.filter(function(c) {
			return c.userPresent(u);
		});
    }

    getUser(id) {
        const user = this._users.find(u => u.id === id);
        if (user) {
            return user;
        } else {
            throw new Error('txat: user not found : "' + id + '"');
        }
    }

    addChannel(c) {
        this._events.emit('log', {message: 'adding new channel ' + c.id + ' - ' + c.name});
		if (!c.id) {
			throw new Error('cannot register channel : it has no valid identifier');
		}
		if (!c.name) {
			throw new Error('cannot register channel : it has no valid name');
		}
		if (this.hasChannel(c.id)) {
			throw new Error('cannot register channel : id "' + c.id + '" is already in use');
		}
		if (this.searchChannel(c.name)) {
			throw new Error('cannot register channel : name "' + c.name + '" is already in use');
		}
		if (this.channelPresent(c)) {
			throw new Error('cannot register channel ' + c.display() + ' : already registered');
		}
		this._channels.push(c);
		c.on('user-added', event => this._eventUserJoins(event));
		c.on('user-dropped', event => this._eventUserLeaves(event))
    }

    getChannel(id) {
        const channel = this._channels.find(c => c.id === id);
        if (channel) {
            return channel;
        } else {
            throw new Error('txat: channel not found : "' + id + '"');
        }
    }

    hasChannel(id) {
        return this._channels.findIndex(c => c.id === id) >= 0;
    }

    searchChannel(sName) {
		return this._channels.find(c => c.name === sName);
	}

    dropChannel(c) {
        this._events.emit('log', {message: 'dropping channel ' + c.id});
        if (c.types.has('persistent')) {
            this._events.emit('log', {message: 'channel ' + c.id + ' has persistent type and will not be dropped'});
	        return;
        }
        if (this.channelPresent(c)) {
            c.purge();
            let i = this._channels.indexOf(c);
            this._channels.splice(i, 1);
            this._events.emit('channel-dropped', {channel: c});
        } else {
            throw new Error('cannot drop channel ' + c.display() + ' : not registered');
        }
    }
}

module.exports = System;