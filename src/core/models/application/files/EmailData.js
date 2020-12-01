const { EmailAddressStatus } = require('../../../enums');

class EmailData {

    constructor(data) {
        const { id, toEmailAddress, type } = data;
        this.id = id;
        this.createDateTime = new Date();
        this.accountId = null;
        this.accountApiKey = null;
        this.fromEmailAddress = null;
        this.toEmailAddress = toEmailAddress;
        this.subjectId = null;
        this.subject = null;
        this.subjectLine = null;
        this.subjectLineDisplay = null;
        this.textId = null;
        this.text = null;
        this.textLine = null;
        this.textLineDisplay = null;
        this.status = EmailAddressStatus.PENDING;
        this.step = null;
        this.type = type;
        this.resultDateTime = null;
        this.resultDetails = null;
        this.resultCode = '000';
        this.retriesCount = 0;
    }
}

module.exports = EmailData;