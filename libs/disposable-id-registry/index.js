/**
 * This class provides prefixed auto-incremental identifiers.
 * There is a method to pick an id : getId()
 * and a methode to dispose an id : disposeId()
 * disposing an id makes this id available for future use.
 * @example
 * const dr = new DiscarableRegistry();
 * dr.getId() --> 1
 * dr.getId() --> 2
 * dr.getId() --> 3
 * dr.disposeId(2) // we don't need id "2" any longer
 * dr.getId() --> 2 again,
 * dr.getId() --> 4
 * dr.disposeId(1)
 * dr.disposeId(3)
 * dr.getId() --> 1
 * dr.getId() --> 3
 * dr.getId() --> 5
 */
class DisposableIdRegistry {
    constructor(sPrefix = null) {
        this._registry = [];
        this._lastId = 0;
        this._prefix = sPrefix;
    }

    get prefix () {
        return this._prefix;
    }

    set prefix (value) {
        this._prefix = value;
    }

    getId () {
        if (this._registry.length > 0) {
            return this._registry.shift();
        } else {
            ++this._lastId;
            return this._prefix ? (this._prefix + this._lastId) : this._lastId;
        }
    }

    disposeId (id) {
        this._registry.push(id);
    }
}

module.exports = DisposableIdRegistry;