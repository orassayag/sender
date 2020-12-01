const { EmailAddressStatus } = require('../../../enums/files/emailAddress.enum');

class SendEmailsData {

	constructor() {
		const keysList = Object.values(EmailAddressStatus);
		for (let i = 0; i < keysList.length; i++) {
			this[`${keysList[i]}Count`] = 0;
		}
	}

	updateCount(isAdd, counterName, count) {
		const fieldName = `${counterName}Count`;
		if (Object.prototype.hasOwnProperty.call(this, fieldName)) {
			isAdd ? this[fieldName] += count : this[fieldName] -= count;
		}
	}
}

module.exports = SendEmailsData;