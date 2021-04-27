const sgMail = require('@sendgrid/mail');
const { SendGridResultModel } = require('../../core/models/application');
const { StatusEnum } = require('../../core/enums');
const applicationService = require('./application.service');
const countLimitService = require('./countLimit.service');
const globalUtils = require('../../utils/files/global.utils');
const { sendgridUtils, textUtils, validationUtils } = require('../../utils');

class SendGridService {

  constructor() {
    this.sendErrorInARowCount = 0;
  }

  async send(emailModel, templateDataModel, cvDataModel) {
    return await new Promise(async (resolve, reject) => {
      if (reject) { }
      // Limit the runtime of this function in case the email send process gets stuck.
      const abortTimeout = setTimeout(() => {
        resolve(this.setSendGridErrorResult(null, 'Send email process exceeded timeout limit.'));
        return;
      }, countLimitService.countLimitDataModel.millisecondsSendTimeout);
      const { accountApiKey, toEmailAddress, fromEmailAddress, subject, text } = emailModel;
      const { emailSenderName } = templateDataModel;
      const { fileName, attachmentBase64, type, disposition } = cvDataModel;
      // Set the api key.
      sgMail.setApiKey(accountApiKey);
      sgMail.setTimeout(countLimitService.countLimitDataModel.millisecondsSendTimeout);
      // Create the message object.
      const message = {
        to: toEmailAddress,
        from: {
          email: fromEmailAddress,
          name: emailSenderName
        },
        subject: subject,
        text: text,
        attachments: [
          {
            content: attachmentBase64,
            filename: fileName,
            type: type,
            disposition: disposition
          }
        ]
      };
      // Send the email.
      let sendgridResultModel = null;
      try {
        const sendResult = await sgMail.send(message);
        sendgridResultModel = this.setSendGridSendResult(sendResult);
      }
      catch (error) {
        sendgridResultModel = this.setSendGridErrorResult(error, null);
      }
      clearTimeout(abortTimeout);
      resolve(sendgridResultModel);
    }).catch();
  }

  setSendGridSendResult(sendResult) {
    if (!sendResult) {
      return this.setSendGridErrorResult(null, 'Result object was not found.');
    }
    const statusCode = sendResult[0].statusCode;
    const codeData = sendgridUtils.resultCodesList[statusCode];
    if (!codeData) {
      return this.setSendGridErrorResult(null, `CodeData object was not found in the list for status code ${statusCode}.`);
    }
    this.getErrorInARowResult(null, false);
    return new SendGridResultModel({
      sendError: null,
      code: statusCode,
      reason: codeData.reason,
      description: codeData.description,
      isSent: codeData.isSent,
      isRetrySend: false,
      exitProgramStatus: null
    });
  }

  setSendGridErrorResult(sendError, errorMessage) {
    let code, reason, description = null;
    let isAccountLimitExceeded = false;
    if (!sendError) {
      sendError = new Error(errorMessage);
    }
    if (sendError.code) {
      code = parseInt(sendError.code);
      reason = sendError.message;
      if (validationUtils.isExists(sendError.response.body.errors)) {
        description = sendError.response.body.errors[0].message;
      }
      sendError = null;
      isAccountLimitExceeded = code === sendgridUtils.limitExceededCode ||
        (description && description.indexOf('exceeded') > -1);
    }
    // Check error in a row.
    // Bad request code, as default for this function.
    const exitProgramStatus = this.getErrorInARowResult(code ? code : applicationService.applicationDataModel.defaultErrorCode, isAccountLimitExceeded);
    return new SendGridResultModel({
      sendError: sendError,
      code: code,
      reason: reason,
      description: description,
      isSent: false,
      isRetrySend: isAccountLimitExceeded,
      exitProgramStatus: exitProgramStatus
    });
  }

  async simulate() {
    // Simulate result.
    let sendgridResultModel = null;
    const isSent = textUtils.getRandomBooleanByPercentage(countLimitService.countLimitDataModel.simulateSendSuccessPercentage);
    if (isSent) {
      const code = textUtils.getRandomKeyFromArray(sendgridUtils.sentCodesList);
      sendgridResultModel = this.setSendGridSendResult([{ statusCode: code }]);
    }
    else {
      const code = textUtils.getRandomKeyFromArray(sendgridUtils.errorCodesList);
      const codeData = sendgridUtils.resultCodesList[code];
      const error = { code: code, message: codeData.reason, response: { body: { errors: [{ message: codeData.description }] } } };
      sendgridResultModel = this.setSendGridErrorResult(error, null);
    }
    // Simulate delay of send process / error.
    await globalUtils.sleep(countLimitService.countLimitDataModel.millisecondsSimulateDelaySendProcessCount);
    return sendgridResultModel;
  }

  getErrorInARowResult(code, isAccountLimitExceeded) {
    // Update the error in a row monitor counter.
    if (code) {
      if (!isAccountLimitExceeded) {
        this.sendErrorInARowCount++;
      }
    }
    else {
      this.sendErrorInARowCount = 0;
    }
    // Send result accordingly.
    return this.sendErrorInARowCount >= countLimitService.countLimitDataModel.maximumSendErrorInARowCount ? StatusEnum.SEND_ERROR_IN_A_ROW : null;
  }
}

module.exports = new SendGridService();