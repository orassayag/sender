const settings = require('../settings/settings');
const { accountService, applicationService, confirmationService, countLimitService,
    createEmailService, logService, mongoDatabaseService, pathService, templateService,
    sendEmailService, validationService } = require('../services');
const { Color, Status } = require('../core/enums');
const { globalUtils, logUtils, systemUtils } = require('../utils');

class SendLogic {

    constructor() {
        this.emailData = null;
    }

    async run() {
        // Validate all settings are fit to the user needs.
        await this.confirm();
        // Initiate all the settings, configurations, services, ect.
        await this.initiate();
        // Validate general settings
        await this.validateGeneralSettings();
        // Start the sending emails processes.
        await this.startSession();
    }

    async initiate() {
        logUtils.logMagentaStatus('INITIATE THE SERVICES');
        applicationService.initiate(settings, Status.INITIATE);
        sendEmailService.initiate();
        countLimitService.initiate(settings);
        await mongoDatabaseService.initiate(settings);
        pathService.initiate(settings);
        await logService.initiate(settings);
        await accountService.initiate();
        templateService.initiate();
        this.emailData = await createEmailService.initiate(settings);
    }

    async validateGeneralSettings() {
        logUtils.logMagentaStatus('VALIDATE GENERAL SETTINGS');
        if (!applicationService.applicationData.isProductionMode) {
            return;
        }
        // Validate internet connection works.
        await validationService.validateInternetConnection();
        // Validate that the mode is PRODUCTION and both send and save emails flags marked as true.
        if (!applicationService.applicationData.isSendEmails || !applicationService.applicationData.isSaveEmails) {
            throw new Error('Production mode but isSendEmails or isSaveEmails flags are false (1000004)');
        }
    }

    async startSession() {
        // Initiate.
        applicationService.applicationData.startDateTime = new Date();
        if (!applicationService.applicationData.isLogMode) {
            logService.startLogProgress();
        }
        await this.pause();
        // Loop the emails and process them.
        for (let i = 0; i < this.emailData.emailsList.length; i++) {
            // Start the process of sending email.
            applicationService.applicationData.currentEmailIndex = i;
            const email = this.emailData.emailsList[i];
            const { isRetrySend, exitProgramStatus } = await this.send(email);
            // Log results.
            this.log(email);
            await logService.logResult(email);
            // Pause between each emails here.
            await this.pause();
            // Exit the program if needed.
            if (exitProgramStatus) {
                await this.exit(exitProgramStatus, Color.RED);
                break;
            }
            // Check if need to retry to send the email.
            if (isRetrySend) {
                this.emailData.emailsList[i] = createEmailService.resetEmail(email);
                i--;
                applicationService.applicationData.currentEmailIndex = i;
            }
        }
        applicationService.applicationData.currentEmailIndex = this.emailData.emailsList.length;
        await this.exit(Status.FINISH, Color.GREEN);
    }

    async sleep() {
        await globalUtils.sleep(countLimitService.countLimitData.millisecondsSendEmailDelayCount);
    }

    async send(email) {
        applicationService.applicationData.status = Status.SEND;
        await this.sleep();
        return await sendEmailService.runEmailProcess(email);
    }

    async pause() {
        applicationService.applicationData.status = Status.PAUSE;
        await this.sleep();
    }

    log(email) {
        if (applicationService.applicationData.isLogMode) {
            logUtils.log(logService.createEmailTemplate(email, false));
        }
    }

    // Let the user confirm all the IMPORTANT settings before the process start.
    async confirm() {
        if (!await confirmationService.confirm(settings)) {
            await this.exit(Status.ABORT_BY_THE_USER, Color.RED);
        }
    }

    async exit(status, color) {
        if (applicationService.applicationData) {
            applicationService.applicationData.status = status;
            await this.sleep();
            logService.close();
        }
        systemUtils.exit(status, color);
    }
}

module.exports = SendLogic;