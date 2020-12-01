const dns = require('dns');
const applicationService = require('./application.service');

class ValidationService {

    constructor() { }

    isLinkExists(link) {
        return new Promise(resolve => {
            dns.lookup(link, (error) => {
                resolve(error ? false : true);
            });
        }).catch();
    }

    async validateInternetConnection() {
        let isConnected = true;
        try {
            isConnected = await this.isLinkExists(applicationService.applicationData.validationConnectionLink);
        } catch (error) { isConnected = false; }
        if (!isConnected) {
            throw new Error('Internet connection is not available (1000034)');
        }
    }
}

module.exports = new ValidationService();