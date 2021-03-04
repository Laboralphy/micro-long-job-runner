class KeyNotFoundError extends Error {
    constructor(sKey, sCollection) {
        super('Key "' + sKey + '" could not be found in collection "' + sCollection + '"');
        this.name = 'KeyNotFoundError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, KeyNotFoundError);
        }
    }
}

class InvalidSchemasError extends Error {
    constructor(id, sType) {
        super('The "' + id + '" structure is invalid according to the ' + sType + ' schemas');
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidSchemasError);
        }
    }
}

module.exports = {
    KeyNotFoundError,
    InvalidSchemasError
};
