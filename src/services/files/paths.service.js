const { PathsData } = require('../../core/models/application');

class PathsService {

    constructor() {
        this.pathsData = null;
    }

    initiate(settings) {
        this.pathsData = new PathsData(settings);
    }
}

module.exports = new PathsService();