const { CountLimitDataModel } = require('../../core/models/application');

class CountLimitService {

    constructor() {
        this.countLimitDataModel = null;
    }

    initiate(settings) {
        this.countLimitDataModel = new CountLimitDataModel(settings);
    }
}

module.exports = new CountLimitService();