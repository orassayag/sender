import settings from '../settings/settings.js';
import { ColorEnum, StatusEnum } from '../core/enums/index.js';
import {
  applicationService,
  countLimitService,
  logService,
  mongoDatabaseService,
  pathService,
  statusService,
} from '../services/index.js';
import { logUtils, systemUtils, timeUtils } from '../utils/index.js';

class StatusLogic {
  constructor() {}

  async run() {
    // Initiate all the settings, configurations, services, etc...
    await this.initiate();
    // Start the status script.
    await this.startStatus();
  }

  async initiate() {
    this.updateStatus('INITIATE THE SERVICES', StatusEnum.INITIATE);
    applicationService.initiate(
      settings,
      StatusEnum.INITIATE,
      timeUtils.getFullDateNoSpaces()
    );
    countLimitService.initiate(settings);
    await mongoDatabaseService.initiate(
      settings,
      applicationService.getApplicationMode(settings.IS_PRODUCTION_MODE)
    );
    pathService.initiate(settings);
  }

  async startStatus() {
    await statusService.displayStatusData(settings);
    this.exit(StatusEnum.FINISH, ColorEnum.GREEN);
  }

  updateStatus(text, status) {
    logUtils.logMagentaStatus(text);
    if (applicationService.applicationDataModel) {
      applicationService.applicationDataModel.status = status;
    }
  }

  exit(status, color) {
    if (applicationService.applicationDataModel) {
      applicationService.applicationDataModel.status = status;
      logService.close();
    }
    systemUtils.exit(status, color);
  }
}

export default StatusLogic;
