/* cSpell:disable */
require('../services/files/initiate.service').initiate();
const settings = require('../settings/settings');
const { countsLimitsService, sendgridService } = require('../services');
const { fileUtils, logUtils, pathUtils } = require('../utils');
const { EmailAddressStatus, EmailAddressType } = require('../core/enums');
const { CVData, EmailData } = require('../core/models/application');

(async () => {
    countsLimitsService.initiate(settings);
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
    const emailData = new EmailData({
        id: id,
        toEmailAddress: toEmailAddress,
        type: type
    });
    emailData.createDateTime = createDateTime;
    emailData.accountId = accountId;
    emailData.accountApiKey = accountApiKey;
    emailData.fromEmailAddress = fromEmailAddress;
    emailData.subjectId = subjectId;
    emailData.subject = subject;
    emailData.subjectLine = subjectLine;
    emailData.subjectLineDisplay = subjectLineDisplay;
    emailData.textId = textId;
    emailData.text = text;
    emailData.textLine = textLine;
    emailData.textLineDisplay = textLineDisplay;
    emailData.status = status;
    emailData.step = step;
    emailData.resultDateTime = resultDateTime;
    emailData.resultDetails = resultDetails;
    emailData.resultCode = resultCode;
    emailData.retriesCount = retriesCount;
    if (!accountApiKey || !toEmailAddress || !fromEmailAddress || !subject || !text) {
        throw new Error('One of the required fields are missing (1000035)');
    }
    const sendResult = await sendgridService.send(emailData, cvData);
    logUtils.log(sendResult);
})();