const { PathDataModel } = require('../../core/models/application');

class PathService {

    constructor() {
        this.pathDataModel = null;
    }

    initiate(settings) {
        this.pathDataModel = new PathDataModel(settings);
    }
}

module.exports = new PathService();