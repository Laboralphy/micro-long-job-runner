class DiscardableRegistry {
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

module.exports = DiscardableRegistry;