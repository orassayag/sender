class EmailProcessResult {

    constructor() {
        this.isContinueProcess = true;
        this.isRetrySend = false;
        this.exitProgramStatus = null;
    }
}

module.exports = EmailProcessResult;