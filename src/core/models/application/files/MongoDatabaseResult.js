class MongoDatabaseResult {

    constructor(data) {
        const { status, description, isSave, exitProgramStatus } = data;
        this.status = status;
        this.description = description;
        this.isSave = isSave;
        this.exitProgramStatus = exitProgramStatus;
    }
}

module.exports = MongoDatabaseResult;