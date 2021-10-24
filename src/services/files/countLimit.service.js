import { CountLimitDataModel } from '../../core/models/application';

class CountLimitService {

    constructor() {
        this.countLimitDataModel = null;
    }

    initiate(settings) {
        this.countLimitDataModel = new CountLimitDataModel(settings);
    }
}

export default new CountLimitService();