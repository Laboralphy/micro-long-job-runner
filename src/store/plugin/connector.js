import Connector from "../../../libs/connector";

class StoreIO {
    constructor (store) {
        this._store = store;
    }

    /**
     * Commit a mutation
     * @param namespace {string} namespace to commit to
     * @param mutation {string} mutation type
     * @param payload {object} payload object
     */
    commit(namespace, mutation, payload) {
        this._store.commit(namespace + '/' + mutation, payload);
    }

    /**
     * dispatch an action to store
     * @param namespace {string} namespace to dispatch to
     * @param action {string} action type
     * @param payload {object} payload object
     * @return {Promise}
     */
    dispatch(namespace, action, payload) {
        return this._store.dispatch(namespace + '/' + action, payload);
    }

    /**
     * return a getter's value
     * @param namespace {string} namespace to query to
     * @param name {string} getter name
     * @return {*}
     */
    getter(namespace, name) {
        return this._store.getters[namespace + '/' + name];
    }

    /**
     * print a line of text on terminal
     * @param screen {string} what screen ?
     * @param text {string} text to print
     * @returns {Promise}
     */
    termPrint(screen, text) {
        return this.dispatch('screens', 'writeLine', { screen, text });
    }

    termError(text) {
        const sCurrScreen = this.getter('getActiveScreen').id;
        if (sCurrScreen !== '#system') {
            this.termPrint(sCurrScreen, text);
        }
        this.termPrint('#system', text);
    }

    getTermActiveScreen() {
        const oScreen = this.getter('screens', 'getActiveScreen');
        if (oScreen) {
            return oScreen.id;
        } else {
            throw new Error('there is no active screen');
        }
    }
}

class CommandRepository {
    constructor(storeIO) {
        this._connector = new Connector();
        this._store = storeIO;

        this._connector.events.on('disconnect', () => {
            console.info('Connection with server has been closed.');
            this._store.termPrint('*', 'Connection with server has been closed.');
        })

        /**
         * Lorsque le client recoi cet ordre il affiche un message dans le screen spécifié
         * @param screen {string} identifiant du screen dans lequel afficher la chaine
         * @param content {string} message à afficher.
         */
        this._connector.events.on('TERM_PRINT', ({ screen, content }) => {
            this._store.termPrint(screen, content);
        });

        /**
         * A la réception de ce message le client affiche un autre screen
         * Si le screen n'existait pas, il est créé
         * @param screen {string} identifiant du screen à afficher
         */
        this._connector.events.on('TERM_SELECT', ({ screen }) => {
            this._store.commit('screens', 'setActiveScreen', { screen });
        });

        /**
         * Cet ordre permet au serveur d'ordonner la fermeture d'un screen
         * @param screen {string} identifiant du screen à fermer
         */
        this._connector.events.on('TERM_CLOSE', async ({screen}) => {
            await this._store.dispatch('screens', 'destroyScreen', { screen });
        });

        /**
         * Cet ordre permet au serveur d'ordonner le nettoyage complet d'un screen
         * (effacement du tous le contenu
         * @param screen {string} identifiant du screen à fermer
         */
        this._connector.events.on('TERM_CLEAR', async ({screen}) => {
            await this._store.dispatch('screens', 'clearScreen', { screen });
        });
    }

    _send (sCommand, ...aArgs) {
        return this._connector.socket.emit(sCommand, aArgs);
    }

    /**
     * Indentification de l'utilisateur.
     * @param sIdentifier {string} Pseudo initial de l'utilisateur
     */
    async cmd_login (sIdentifier) {
        await this._store.termPrint('#system', 'Connecting...');
        await this._connector.connect();
        await this._store.termPrint('#system', 'Connected to ' + this._connector.remoteAddress);
        return this._send('login', sIdentifier);
    }

    cmd_join (sChannel) {
        return this._send('chat/join', sChannel);
    }

    cmd_say (sMessage) {
        return this._send('chat/say', this._store.getTermActiveScreen(), sMessage);
    }

    cmd_leave () {
        return this._send('chat/leave', this._store.getTermActiveScreen());
    }

    cmd_screen (sScreen) {
        return this._send('screen', sScreen);
    }

    /**
     * The default commands go here
     * @param sCommand {string} command
     * @param sArgs {string} remaining command arguments
     * @returns {Promise<void>}
     */
    _defaultCommand (sCommand, sArgs) {
        this._send(sCommand.toUpperCase(), sArgs);
    }

    async command (sInput) {
        try {
            console.info('Store plugin V', 1);
            const sLine = sInput.trim();
            if (sLine.substr(0, 1) === '/') {
                // first char is a "/"
                const aWords = sLine
                    .substr(1)
                    .split(' ');
                // extract command
                const sCommand = 'cmd_' + aWords.shift().toLowerCase();
                const sParams = aWords.join(' ');
                // send command to server
                if (sCommand in this) {
                    await this[sCommand](sParams)
                } else {
                    await this._defaultCommand(sCommand.toUpperCase(), sParams);
                }
            } else {
                // by default : command SAY
                await this.cmd_say(sLine);
            }
        } catch (e) {
            await this._store.termPrint('#system', e.message);
            console.error(sInput, 'has been rejected :', e.message);
            console.error(e);
        }
    }
}

export default function main() {
    return store => {
        const storeIO = new StoreIO(store)
        const cmd = new CommandRepository(storeIO)

        store.subscribeAction(async (action) => {
            console.log('action', action.type, action.payload);
            switch (action.type) {
                case 'terminal/submitCommand':
                    await cmd.command(action.payload.command);
                    break;
            }
        });
    };
}
