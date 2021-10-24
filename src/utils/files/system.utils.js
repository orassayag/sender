import { exec } from 'child_process';
import logUtils from './log.utils';

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

    isProcessRunning(processName) {
        return new Promise((resolve, reject) => {
            if (reject) { }
            const platform = process.platform;
            let cmd = '';
            switch (platform) {
                case 'win32': { cmd = `tasklist`; break; }
                case 'darwin': { cmd = `ps -ax | grep ${processName}`; break; }
                case 'linux': { cmd = `ps -A`; break; }
            }
            exec(cmd, (err, stdout, stderr) => {
                if (err || stderr) { }
                resolve(stdout.toLowerCase().indexOf(processName.toLowerCase()) > -1);
            });
        }).catch();
    }
}

export default new SystemUtils();