const { CountLimitData } = require('../../core/models/application');

class CountLimitService {

    constructor() {
        this.countLimitData = null;
    }

    initiate(settings) {
        this.countLimitData = new CountLimitData(settings);
    }
}

module.exports = new CountLimitService();