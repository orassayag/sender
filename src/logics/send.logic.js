const settings = require('../settings/settings');
const { accountsService, applicationService, confirmationService, countsLimitsService,
    createEmailsService, logsService, mongoDatabaseService, pathsService, templatesService,
    sendEmailService, validationService } = require('../services');
const { Color, Status } = require('../core/enums');
const { globalUtils, logUtils, systemUtils } = require('../utils');

class SendLogic {

    constructor() {
        this.emailsData = null;
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
        countsLimitsService.initiate(settings);
        await mongoDatabaseService.initiate(settings);
        pathsService.initiate(settings);
        await logsService.initiate(settings);
        accountsService.initiate();
        templatesService.initiate();
        this.emailsData = await createEmailsService.initiate(settings);
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
            logsService.startLogProgress();
        }
        await this.pause();
        // Loop the emails and process them.
        for (let i = 0; i < this.emailsData.emailsList.length; i++) {
            // Start the process of sending email.
            applicationService.applicationData.currentEmailIndex = i;
            const emailData = this.emailsData.emailsList[i];
            const { isRetrySend, exitProgramStatus } = await this.send(emailData);
            // Log results.
            this.log(emailData);
            await logsService.logResult(emailData);
            // Pause between each emails here.
            await this.pause();
            // Exit the program if needed.
            if (exitProgramStatus) {
                await this.exit(exitProgramStatus, Color.RED);
                break;
            }
            // Check if need to retry to send the email.
            if (isRetrySend) {
                this.emailsData.emailsList[i] = createEmailsService.resetEmail(emailData);
                i--;
                applicationService.applicationData.currentEmailIndex = i;
            }
        }
        await this.exit(Status.FINISH, Color.GREEN);
    }

    async sleep() {
        await globalUtils.sleep(countsLimitsService.countsLimitsData.millisecondsSendEmailDelayCount);
    }

    async send(emailData) {
        applicationService.applicationData.status = Status.SEND;
        await this.sleep();
        return await sendEmailService.runEmailProcess(emailData);
    }

    async pause() {
        applicationService.applicationData.status = Status.PAUSE;
        await this.sleep();
    }

    log(emailData) {
        if (applicationService.applicationData.isLogMode) {
            logUtils.log(logsService.createEmailTemplate(emailData, false));
        }
    }

    // Let the user confirm all the IMPORTANT settings before the process start.
    async confirm() {
        if (!await confirmationService.confirm(settings)) {
            this.exit('EXIT: ABORTED BY THE USER', Color.RED);
        }
    }

    async exit(status, color) {
        if (applicationService.applicationData) {
            applicationService.applicationData.status = status;
            await this.sleep();
            logsService.close();
        }
        systemUtils.exit(status, color);
    }
}

module.exports = SendLogic;