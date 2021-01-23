const sgMail = require('@sendgrid/mail');
const { Status } = require('../../core/enums');
const { SendGridResult } = require('../../core/models/application');
const applicationService = require('./application.service');
const countLimitService = require('./countLimit.service');
const globalUtils = require('../../utils/files/global.utils');
const { sendgridUtils, textUtils } = require('../../utils');

class SendGridService {

  constructor() {
    this.sendErrorInARowCount = 0;
  }

  async send(email, templateData, cvData) {
    return await new Promise(async (resolve, reject) => {
      if (reject) { }
      // Limit the runtime of this function in case of email send process get stuck.
      const abortTimeout = setTimeout(() => {
        resolve(this.setSendGridErrorResult(null, 'Send email process exceeded timeout limit.'));
        return;
      }, countLimitService.countLimitData.millisecondsSendTimeout);
      const { accountApiKey, toEmailAddress, fromEmailAddress, subject, text } = email;
      const { emailSenderName } = templateData;
      const { fileName, attachmentBase64, type, disposition } = cvData;
      // Set the api key.
      sgMail.setApiKey(accountApiKey);
      sgMail.setTimeout(countLimitService.countLimitData.millisecondsSendTimeout);
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
      let sendgridResult = null;
      try {
        const sendResult = await sgMail.send(message);
        sendgridResult = this.setSendGridSendResult(sendResult);
      }
      catch (error) {
        sendgridResult = this.setSendGridErrorResult(error, null);
      }
      clearTimeout(abortTimeout);
      resolve(sendgridResult);
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
    return new SendGridResult({
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
      if (sendError.response.body.errors.length > 0) {
        description = sendError.response.body.errors[0].message;
      }
      sendError = null;
      isAccountLimitExceeded = code === sendgridUtils.limitExceededCode;
    }
    // Check error in a row.
    // Bad request code, as default for this function.
    const exitProgramStatus = this.getErrorInARowResult(code ? code : applicationService.applicationData.defaultErrorCode, isAccountLimitExceeded);
    return new SendGridResult({
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
    let sendgridResult = null;
    const isSent = textUtils.getRandomBooleanByPercentage(countLimitService.countLimitData.simulateSendSuccessPercentage);
    if (isSent) {
      const code = textUtils.getRandomKeyFromArray(sendgridUtils.sentCodesList);
      sendgridResult = this.setSendGridSendResult([{ statusCode: code }]);
    }
    else {
      const code = textUtils.getRandomKeyFromArray(sendgridUtils.errorCodesList);
      const codeData = sendgridUtils.resultCodesList[code];
      const error = { code: code, message: codeData.reason, response: { body: { errors: [{ message: codeData.description }] } } };
      sendgridResult = this.setSendGridErrorResult(error, null);
    }
    // Simulate delay of send process / error.
    await globalUtils.sleep(countLimitService.countLimitData.millisecondsSimulateDelaySendProcessCount);
    return sendgridResult;
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
    return this.sendErrorInARowCount >= countLimitService.countLimitData.maximumSendErrorInARowCount ? Status.SEND_ERROR_IN_A_ROW : null;
  }
}

module.exports = new SendGridService();