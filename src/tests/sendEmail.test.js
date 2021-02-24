/* cSpell:disable */
require('../services/files/initiate.service').initiate('test');
const settings = require('../settings/settings');
const { CVData, Email } = require('../core/models/application');
const { EmailAddressStatus, EmailAddressType } = require('../core/enums');
const { countLimitService, sendgridService } = require('../services');
const { fileUtils, pathUtils, logUtils } = require('../utils');

(async () => {
    countLimitService.initiate(settings);
    // Email fields.
    const id = 1;
    const createDateTime = new Date();
    const accountId = null;
    const accountApiKey = '';
    const fromEmailAddress = '';
    const toEmailAddress = '';
    const subjectId = null;
    const subject = 'בדיקה';
    const subjectLine = null;
    const subjectLineDisplay = null;
    const textId = null;
    const text = 'בדיקה';
    const textLine = null;
    const textLineDisplay = null;
    const status = EmailAddressStatus.PENDING;
    const step = null;
    const type = EmailAddressType.STANDARD;
    const resultDateTime = null;
    const resultDetails = null;
    const resultCode = '000';
    const retriesCount = 0;
    // CV data fields.
    const fileName = 'CV Billy Ravid.doc';
    const filePath = pathUtils.getJoinPath({
        targetPath: __dirname,
        targetName: `../../misc/data/cv/${fileName}`
    });
    const attachmentBase64 = await fileUtils.createBase64Path(filePath);
    const fileType = 'application/doc';
    const disposition = 'attachment';
    const cvData = new CVData({
        fileName: fileName,
        filePath: filePath,
        attachmentBase64: attachmentBase64,
        type: fileType,
        disposition: disposition
    });
    const email = new Email({
        id: id,
        toEmailAddress: toEmailAddress,
        type: type
    });
    email.createDateTime = createDateTime;
    email.accountId = accountId;
    email.accountApiKey = accountApiKey;
    email.fromEmailAddress = fromEmailAddress;
    email.subjectId = subjectId;
    email.subject = subject;
    email.subjectLine = subjectLine;
    email.subjectLineDisplay = subjectLineDisplay;
    email.textId = textId;
    email.text = text;
    email.textLine = textLine;
    email.textLineDisplay = textLineDisplay;
    email.status = status;
    email.step = step;
    email.resultDateTime = resultDateTime;
    email.resultDetails = resultDetails;
    email.resultCode = resultCode;
    email.retriesCount = retriesCount;
    if (!accountApiKey || !toEmailAddress || !fromEmailAddress || !subject || !text) {
        throw new Error('One of the required fields are missing (1000040)');
    }
    const sendResult = await sendgridService.send(email, cvData);
    logUtils.log(sendResult);
})();