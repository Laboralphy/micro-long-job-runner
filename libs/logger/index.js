const dateFormat = require('date-format');

/**
 * simple logging class that writes on stdout
 */
class Logger {

    /**
     * Transforms level and date into a prefix displayable string
     * @param level {string} log, warn, error, info
     * @param date {Date} now
     * @returns {string}
     */
    formatString(level, date) {
        const packet = [
            '[' + dateFormat(dateFormat.ISO8601_FORMAT, date) + ']',
            '[' + level + ']'
        ];
        return packet.join(' ');
    }

    log(...args) {
        console.log(this.formatString('log', new Date()), ...args);
    }

    error(...args) {
        console.error(this.formatString('error', new Date()), ...args);
    }
}

module.exports = Logger;