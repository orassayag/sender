const { ApplicationData } = require('../../core/models/application');

class ApplicationService {

    constructor() {
        this.applicationData = null;
    }

    initiate(settings, status) {
        this.applicationData = new ApplicationData({
            settings: settings,
            status: status
        });
    }
}

module.exports = new ApplicationService();