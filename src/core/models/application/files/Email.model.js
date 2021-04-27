const { EmailAddressStatusEnum } = require('../../../enums');

class EmailModel {

    constructor(data) {
        const { id, toEmailAddress, type, createDateTime } = data;
        this.id = id;
        this.createDateTime = createDateTime;
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
        this.status = EmailAddressStatusEnum.PENDING;
        this.step = null;
        this.type = type;
        this.resultDateTime = null;
        this.resultDetails = null;
        this.resultCode = '000';
        this.retriesCount = 0;
    }
}

module.exports = EmailModel;