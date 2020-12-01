const { CountsLimitsData } = require('../../core/models/application');

class CountsLimitsService {

    constructor() {
        this.countsLimitsData = null;
    }

    initiate(settings) {
        this.countsLimitsData = new CountsLimitsData(settings);
    }
}

module.exports = new CountsLimitsService();