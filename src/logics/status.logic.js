const settings = require('../settings/settings');
const { Color, Status } = require('../core/enums');
const { applicationService, countLimitService, logService, mongoDatabaseService,
    pathService, statusService } = require('../services');
const { logUtils, systemUtils } = require('../utils');

class StatusLogic {

    constructor() { }

    async run() {
        // Initiate all the settings, configurations, services, etc...
        await this.initiate();
        // Start the status script.
        await this.startStatus();
    }

    async initiate() {
        this.updateStatus('INITIATE THE SERVICES', Status.INITIATE);
        applicationService.initiate(settings, Status.INITIATE);
        countLimitService.initiate(settings);
        await mongoDatabaseService.initiate(settings);
        pathService.initiate(settings);
    }

    async startStatus() {
        await statusService.displayStatusData(settings);
        this.exit(Status.FINISH, Color.GREEN);
    }

    updateStatus(text, status) {
        logUtils.logMagentaStatus(text);
        if (applicationService.applicationData) {
            applicationService.applicationData.status = status;
        }
    }

    exit(status, color) {
        if (applicationService.applicationData) {
            applicationService.applicationData.status = status;
            logService.close();
        }
        systemUtils.exit(status, color);
    }
}

module.exports = StatusLogic;