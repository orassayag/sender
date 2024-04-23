import settings from '../settings/settings.js';
import { ColorEnum, StatusEnum } from '../core/enums/index.js';
import {
  accountService,
  applicationService,
  confirmationService,
  countLimitService,
  createEmailService,
  logService,
  mongoDatabaseService,
  pathService,
  sendEmailService,
  templateService,
  validationService,
} from '../services/index.js';
import globalUtils from '../utils/files/global.utils.js';
import { logUtils, systemUtils, timeUtils } from '../utils/index.js';

class SendLogic {
  constructor() {
    this.emailDataModel = null;
  }

  async run() {
    const mode = applicationService.getApplicationMode(
      settings.IS_PRODUCTION_MODE
    );
    // Validate all settings are fit to the user needs.
    await this.confirm(mode);
    // Initiate all the settings, configurations, services, etc...
    await this.initiate(mode);
    // Validate general settings.
    await this.validateGeneralSettings();
    // Start the sending emails processes.
    await this.startSession();
  }

  async initiate(mode) {
    this.updateStatus('INITIATE THE SERVICES', StatusEnum.INITIATE);
    applicationService.initiate(
      settings,
      StatusEnum.INITIATE,
      timeUtils.getFullDateNoSpaces()
    );
    sendEmailService.initiate();
    countLimitService.initiate(settings);
    await mongoDatabaseService.initiate(settings, mode);
    pathService.initiate(settings);
    logService.initiate(settings);
    await accountService.initiate();
    templateService.initiate();
    this.emailDataModel = await createEmailService.initiate(settings);
  }

  async validateGeneralSettings() {
    this.updateStatus('VALIDATE GENERAL SETTINGS', StatusEnum.VALIDATE);
    if (!applicationService.applicationDataModel.isProductionMode) {
      return;
    }
    // Validate that the internet connection works.
    await validationService.validateInternetConnection();
    // Validate that the mode is PRODUCTION and both send and save emails flags marked as true.
    if (
      !applicationService.applicationDataModel.isSendEmails ||
      !applicationService.applicationDataModel.isSaveEmails
    ) {
      throw new Error(
        'Production mode but isSendEmails or isSaveEmails flags are false (1000003)'
      );
    }
  }

  async startSession() {
    // Initiate.
    applicationService.applicationDataModel.startDateTime =
      timeUtils.getCurrentDate();
    if (!applicationService.applicationDataModel.isLogMode) {
      logService.startLogProgress();
    }
    await this.pause();
    // Loop the emails and process them.
    for (let i = 0; i < this.emailDataModel.emailsList.length; i++) {
      // Start the process of sending email.
      applicationService.applicationDataModel.currentEmailIndex = i;
      const emailModel = this.emailDataModel.emailsList[i];
      const { isRetrySend, exitProgramStatus } = await this.send(emailModel);
      // Log results.
      this.log(emailModel);
      await logService.logResult(emailModel);
      // Pause between each email here.
      await this.pause();
      // Exit the program if needed.
      if (exitProgramStatus) {
        await this.exit(exitProgramStatus, ColorEnum.RED);
        break;
      }
      // Check there is a need to retry to send the email.
      if (isRetrySend) {
        this.emailDataModel.emailsList[i] =
          createEmailService.resetEmail(emailModel);
        i--;
        applicationService.applicationDataModel.currentEmailIndex = i;
      }
    }
    applicationService.applicationDataModel.currentEmailIndex =
      this.emailDataModel.emailsList.length;
    await this.exit(StatusEnum.FINISH, ColorEnum.GREEN);
  }

  async sleep() {
    await globalUtils.sleep(
      countLimitService.countLimitDataModel.millisecondsSendEmailDelayCount
    );
  }

  async send(emailModel) {
    applicationService.applicationDataModel.status = StatusEnum.SEND;
    await this.sleep();
    return await sendEmailService.runEmailProcess(emailModel);
  }

  async pause() {
    applicationService.applicationDataModel.status = StatusEnum.PAUSE;
    await this.sleep();
  }

  log(emailModel) {
    if (applicationService.applicationDataModel.isLogMode) {
      logUtils.log(logService.createEmailTemplate(emailModel, false));
    }
  }

  // Let the user confirm all the IMPORTANT settings before the process starts.
  async confirm(mode) {
    if (!(await confirmationService.confirm(settings, mode))) {
      await this.exit(StatusEnum.ABORT_BY_THE_USER, ColorEnum.RED);
    }
  }

  updateStatus(text, status) {
    logUtils.logMagentaStatus(text);
    if (applicationService.applicationDataModel) {
      applicationService.applicationDataModel.status = status;
    }
  }

  async exit(status, color) {
    if (applicationService.applicationDataModel) {
      applicationService.applicationDataModel.status = status;
      await this.sleep();
      await mongoDatabaseService.closeConnection();
      logService.close();
    }
    systemUtils.exit(status, color);
  }
}

export default SendLogic;
