import { EmailAddressStatusEnum } from '../../../enums/index.js';

class SendEmailDataModel {
  constructor() {
    const keysList = Object.values(EmailAddressStatusEnum);
    for (let i = 0; i < keysList.length; i++) {
      this[`${keysList[i]}Count`] = 0;
    }
  }

  updateCount(isAdd, counterName, count) {
    const fieldName = `${counterName}Count`;
    if (Object.prototype.hasOwnProperty.call(this, fieldName)) {
      if (isAdd) {
        this[fieldName] += count;
      } else {
        this[fieldName] -= count;
        if (this[fieldName] <= 1) {
          return 0;
        }
      }
    }
  }
}

export default SendEmailDataModel;
