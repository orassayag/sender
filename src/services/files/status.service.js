const { StatusResult } = require('../../core/models/application');
const createEmailService = require('./createEmail.service');
const logService = require('./log.service');
const mongoDatabaseService = require('./mongoDatabase.service');
const { logUtils } = require('../../utils');

class StatusService {

    constructor() { }

    async displayStatusData(settings) {
        // Get all the email addresses from Mongo database.
        const mongoDatabaseEmailAddressesList = await mongoDatabaseService.getAllEmailAddresses();
        // Get all the source email addresses.
        let sourceEmailAddressesList = await createEmailService.getEmailAddressesOnly(settings);
        sourceEmailAddressesList = sourceEmailAddressesList.map(emailAddress => emailAddress && emailAddress.trim());
        const statusResult = this.getStatusResult({
            mongoDatabaseEmailAddressesList: mongoDatabaseEmailAddressesList,
            sourceEmailAddressesList: sourceEmailAddressesList
        });
        const logMessage = logService.createStatusTemplate(statusResult);
        logUtils.log(logMessage);
    }

    getStatusResult(data) {
        const statusResult = new StatusResult();
        const { mongoDatabaseEmailAddressesList, sourceEmailAddressesList } = data;
        statusResult.mongoDatabaseEmailAddressesCount = mongoDatabaseEmailAddressesList.length;
        statusResult.sourceEmailAddressesCount = sourceEmailAddressesList.length;
        for (let i = 0; i < mongoDatabaseEmailAddressesList.length; i++) {
            if (sourceEmailAddressesList.findIndex(emailAddress => emailAddress === mongoDatabaseEmailAddressesList[i].emailAddress) > -1) {
                statusResult.mongoDatabaseEmailAddressesExistsCount++;
            }
        }
        statusResult.sourceEmailAddressesToSendCount = sourceEmailAddressesList.length - statusResult.mongoDatabaseEmailAddressesExistsCount;
        return statusResult;
    }
}

module.exports = new StatusService();