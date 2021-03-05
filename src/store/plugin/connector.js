import Connector from "../../../libs/connector";
import {quoteSplit} from "../../../libs/quote-split";

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
            console.warn('Connection with server has been closed.');
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

        this._connector.events.on('UI_UPDATE', async payload => {
            switch (payload.section) {
                case 'map':
                    await this._store.dispatch('ui', 'updateMap', {map: payload.map});
                    break;
            }

        });
    }

    async _send (sCommand, ...aArgs) {
        if (this._connector.connected) {
            return this._connector.socket.emit(sCommand, aArgs);
        } else {
            await this._store.termPrint('#system', '{neg Not connected. Use "login {i your_name} " to connect.');
        }
    }

    /**
     * Indentification de l'utilisateur.
     * @param sIdentifier {string} Pseudo initial de l'utilisateur
     */
    async cmd_login (sIdentifier) {
        await this._store.termPrint('#system', 'Connecting...');
        await this._connector.connect();
        await this._store.termPrint('#system', 'Connected to ' + this._connector.remoteAddress);
        return this._send('CMD::login', sIdentifier);
    }

    async command (sInput) {
        try {
            await this._store.termPrint('#system', sInput);
            const sLine = sInput.trim();
            const aParams = quoteSplit(sLine); // sLine.split(' ');
            // extract command
            const sCommand = aParams.shift().toLowerCase();
            const sMeth = 'cmd_' + sCommand;
            // send command to server
            if (sMeth in this) {
                await this[sMeth](...aParams)
            } else {
                await this._send('CMD::' + sCommand, ...aParams);
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
            switch (action.type) {
                case 'terminal/submitCommand':
                    await cmd.command(action.payload.command);
                    break;
            }
        });
    };
}
