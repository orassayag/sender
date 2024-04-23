import { ApplicationDataModel } from '../../core/models/application/index.js';
import { ModeEnum } from '../../core/enums/index.js';

class ApplicationService {
  constructor() {
    this.applicationDataModel = null;
  }

  initiate(settings, status, logDateTime) {
    this.applicationDataModel = new ApplicationDataModel({
      settings: settings,
      status: status,
      mode: this.getApplicationMode(settings.IS_PRODUCTION_MODE),
      logDateTime: logDateTime,
    });
  }

  getApplicationMode(isProductionMode) {
    return isProductionMode ? ModeEnum.PRODUCTION : ModeEnum.DEVELOPMENT;
  }
}

export default new ApplicationService();
