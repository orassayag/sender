const logUtils = require('./log.utils');

class SystemUtils {

    constructor() { }

    exit(exitReason, color) {
        logUtils.logColorStatus({
            status: this.getExitReason(exitReason),
            color: color
        });
        process.exit(0);
    }

    getExitReason(exitReason) {
        if (!exitReason) {
            return '';
        }
        return `EXIT: ${exitReason}`;
    }

    getErrorDetails(error) {
        let errorText = '';
        if (!error) {
            return errorText;
        }
        if (error.message) {
            errorText += error.message;
        }
        if (error.stack) {
            errorText += error.stack;
        }
        return errorText;
    }
}

module.exports = new SystemUtils();