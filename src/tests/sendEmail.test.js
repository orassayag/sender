/* cSpell:disable */
require('../services/files/initiate.service').initiate('test');
const settings = require('../settings/settings');
const { CVDataModel, EmailModel } = require('../core/models/application');
const { EmailAddressStatusEnum, EmailAddressTypeEnum } = require('../core/enums');
const { countLimitService, sendgridService } = require('../services');
const { fileUtils, pathUtils, logUtils, timeUtils } = require('../utils');

(async () => {
    countLimitService.initiate(settings);
    // Email fields.
    const id = 1;
    const createDateTime = timeUtils.getCurrentDate();
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
    const status = EmailAddressStatusEnum.PENDING;
    const step = null;
    const type = EmailAddressTypeEnum.STANDARD;
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
    const cvDataModel = new CVDataModel({
        fileName: fileName,
        filePath: filePath,
        attachmentBase64: attachmentBase64,
        type: fileType,
        disposition: disposition
    });
    const emailModel = new EmailModel({
        id: id,
        toEmailAddress: toEmailAddress,
        type: type,
        createDateTime: timeUtils.getCurrentDate()
    });
    emailModel.createDateTime = createDateTime;
    emailModel.accountId = accountId;
    emailModel.accountApiKey = accountApiKey;
    emailModel.fromEmailAddress = fromEmailAddress;
    emailModel.subjectId = subjectId;
    emailModel.subject = subject;
    emailModel.subjectLine = subjectLine;
    emailModel.subjectLineDisplay = subjectLineDisplay;
    emailModel.textId = textId;
    emailModel.text = text;
    emailModel.textLine = textLine;
    emailModel.textLineDisplay = textLineDisplay;
    emailModel.status = status;
    emailModel.step = step;
    emailModel.resultDateTime = resultDateTime;
    emailModel.resultDetails = resultDetails;
    emailModel.resultCode = resultCode;
    emailModel.retriesCount = retriesCount;
    if (!accountApiKey || !toEmailAddress || !fromEmailAddress || !subject || !text) {
        throw new Error('One of the required fields are missing (1000040)');
    }
    const sendResult = await sendgridService.send(emailModel, cvDataModel);
    logUtils.log(sendResult);
})();