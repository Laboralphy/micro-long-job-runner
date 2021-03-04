/**
 * simple logging class that writes on stdout
 */
class Logger {

    /**
     * Date formatting utility
     * @param date {Date}
     */
    dateFormat(date) {
        function p(d, n) {
            return d.toString().padStart(n, '0');
        }
        const sDate = [
          p(date.getFullYear(), 4),
          p(date.getMonth() + 1, 2),
          p(date.getDate(), 2)
        ].join('-');
        const sTime = [
          p(date.getHours(), 2),
          p(date.getMinutes(), 2),
          p(date.getSeconds(), 2)
        ].join(':');
        return sDate + ' ' + sTime;
    }

    /**
     * Transforms level and date into a prefix displayable string
     * @param level {string} log, warn, error, info
     * @param date {Date} now
     * @returns {string}
     */
    formatString(level, date) {
        const packet = [
            '[' + this.dateFormat(date) + ']',
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

module.exports = new Logger();
