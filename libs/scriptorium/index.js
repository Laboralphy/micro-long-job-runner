const PromFS = require('../prom-fs')
const path = require('path')

const SCRIPT_NAME_SEPARATOR = '-'
const JAVASCRIPT_EXTENSION = '.js'

class Scriptorium {
    constructor () {
        this._routes = {}
        this._defaultContext = {}
    }

    /**
     * Indexe un ensemble de scripts dans un emplacement donné.
     * @param sBasePath {string} emplacement des scripts
     * @returns {Promise<object>}
     */
    async index (sBasePath) {
        const t1 = await PromFS.tree(sBasePath)
        const t2 = t1.filter(x => x.endsWith(JAVASCRIPT_EXTENSION)).map(x => {
            const basename = path.basename(x, JAVASCRIPT_EXTENSION)
            const filename = x
            const dir = path.dirname(x)
            const script = require(path.resolve(sBasePath, filename))
            const name = path.basename(filename, JAVASCRIPT_EXTENSION);
            if (!(typeof script === 'object' && typeof script.main === 'function')) {
                throw new Error('expected function for module ' + path.join(sBasePath, filename))
            }
            const id = path.posix.join(dir, name)
            return {
                id,
                script
            }
        })
        const t3 = {}
        t2.forEach(({id, route, script}) => {
            t3[id] = script
        })
        this._routes = t3;
        return Object.keys(t3);
    }

    /**
     * Fabrique une contexte contenant les trucs suivants :
     * un contexte par défaut
     * un contexte additionel
     * les fonctions get, put, post, delete
     * @param context
     * @returns {{get: (function(*=, ...[*]): *), post: (function(*=, *=, ...[*]): *)}}
     */
    composeContext (context = {}) {
        return {
            ...this._defaultContext,
            ...context,
            command: (sCommand, ...args) => this.runScript(sCommand, context, ...args)
        }
    }

    scriptExists (sId) {
        return sId in this._routes;
    }

    /**
     * exécute un script
     * @param sId {string} identifiant du script
     * @param context {object}
     * @param params []
     * @returns {Promise<any>}
     */
    runScript (sId, context, ...params) {
        if (sId in this._routes) {
            const script = this._routes[sId];
            try {
                const result = script.main(this.composeContext(context), ...params)
                if (result instanceof Promise) {
                    return result
                } else {
                    return Promise.resolve(result)
                }
            } catch (e) {
                console.error('error in script.');
                console.error(e);
                return Promise.reject(e.message);
            }
        } else {
            return Promise.reject('Invalid script route : "' + sId + '"');
        }
    }

    displayHelp (sId) {
        if (sId in this._routes) {
            const script = this._routes[sId];
            if (typeof script.help === 'function') {
                return script.help();
            } else {
                return [{
                    section: 'Error',
                    text: 'Help data not found for command : ' + sId + '.'
                }];
            }
        } else {
            return [{
                section: 'Error',
                text: 'Unknown command : ' + sId + '.'
            }];
        }
    }

    get routes () {
        return this._routes
    }

    get defaultContext () {
        return this._defaultContext
    }

    set defaultContext (value) {
        this._defaultContext = value
    }
}

module.exports = Scriptorium
