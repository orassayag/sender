const isReachable = require('is-reachable');
const applicationService = require('./application.service');

class ValidationService {

    constructor() { }

    async validateInternetConnection() {
        let isConnected = true;
        try {
            isConnected = await isReachable(applicationService.applicationData.validationConnectionLink);
        } catch (error) { isConnected = false; }
        if (!isConnected) {
            throw new Error(`${applicationService.applicationData.validationConnectionLink} is not available (1000039)`);
        }
    }
}

module.exports = new ValidationService();