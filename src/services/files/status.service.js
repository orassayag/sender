import { StatusResultModel } from '../../core/models/application/index.js';
import createEmailService from './createEmail.service.js';
import logService from './log.service.js';
import mongoDatabaseService from './mongoDatabase.service.js';
import { logUtils } from '../../utils/index.js';

class StatusService {
  constructor() {}

  async displayStatusData(settings) {
    // Get all the email addresses from Mongo database.
    const mongoDatabaseEmailAddressesList =
      await mongoDatabaseService.getAllEmailAddresses();
    // Get all the source email addresses.
    let sourceEmailAddressesList =
      await createEmailService.getEmailAddressesOnly(settings);
    sourceEmailAddressesList = sourceEmailAddressesList.map(
      (emailAddress) => emailAddress && emailAddress.trim()
    );
    const statusResultModel = this.getStatusResult({
      mongoDatabaseEmailAddressesList: mongoDatabaseEmailAddressesList,
      sourceEmailAddressesList: sourceEmailAddressesList,
    });
    const logMessage = logService.createStatusTemplate(statusResultModel);
    logUtils.log(logMessage);
  }

  getStatusResult(data) {
    const statusResultModel = new StatusResultModel();
    const { mongoDatabaseEmailAddressesList, sourceEmailAddressesList } = data;
    statusResultModel.mongoDatabaseEmailAddressesCount =
      mongoDatabaseEmailAddressesList.length;
    statusResultModel.sourceEmailAddressesCount =
      sourceEmailAddressesList.length;
    for (let i = 0; i < mongoDatabaseEmailAddressesList.length; i++) {
      if (
        sourceEmailAddressesList.findIndex(
          (emailAddress) =>
            emailAddress === mongoDatabaseEmailAddressesList[i].emailAddress
        ) > -1
      ) {
        statusResultModel.mongoDatabaseEmailAddressesExistsCount++;
      }
    }
    statusResultModel.sourceEmailAddressesToSendCount =
      sourceEmailAddressesList.length -
      statusResultModel.mongoDatabaseEmailAddressesExistsCount;
    return statusResultModel;
  }
}

export default new StatusService();
