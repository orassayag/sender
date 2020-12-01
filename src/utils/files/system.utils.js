const logUtils = require('./log.utils');

class SystemUtils {

    constructor() { }

    exit(exitReason, color) {
        logUtils.logColorStatus({
            status: `EXIT: ${exitReason}`,
            color: color
        });
        process.exit(0);
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