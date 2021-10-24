import { EmailProcessResultModel, SendEmailDataModel } from '../../core/models/application';
import { EmailAddressStatusEnum, EmailAddressTypeEnum, SendEmailStepNameEnum, StatusEnum } from '../../core/enums';
import accountService from './account.service';
import applicationService from './application.service';
import mongoDatabaseService from './mongoDatabase.service';
import sendgridService from './sendgrid.service';
import templateService from './template.service';
import { systemUtils, timeUtils } from '../../utils';

class SendEmailService {

    constructor() {
        this.emailModel = null;
        this.sendEmailDataModel = null;
        this.securityEmailsSentList = null;
    }

    initiate() {
        this.sendEmailDataModel = new SendEmailDataModel();
        this.securityEmailsSentList = [];
        this.emailAddressStatusKeys = Object.keys(EmailAddressStatusEnum);
    }

    async runEmailProcess(emailModel) {
        this.emailModel = emailModel;
        // Step 1 - Check status, check if exists in the Mongo database, and check account status.
        const initiateStepResult = await this.runEmailInitiateProcess();
        if (!initiateStepResult.isContinueProcess) {
            return initiateStepResult;
        }
        // Step 2 - Security check, add text and subject, and validate all the fields.
        const validationStepResult = this.runEmailValidateProcess();
        if (!validationStepResult.isContinueProcess) {
            return validationStepResult;
        }
        // Step 3 - Send the email, save it to the Mongo database, and log the result.
        const sendStepResult = await this.runEmailSendProcess();
        if (!sendStepResult.isContinueProcess) {
            return sendStepResult;
        }
        // Step 4 - Validate gracefully switch accounts, to continue the process.
        const finalizeStepResult = this.runEmailFinalizeProcess();
        if (!finalizeStepResult.isContinueProcess) {
            return finalizeStepResult;
        }
        return finalizeStepResult;
    }

    async runEmailInitiateProcess() {
        this.emailModel.step = SendEmailStepNameEnum.INITIATE;
        const emailProcessResultModel = new EmailProcessResultModel();
        // Validate that the email's status is still relevant to be sent (if it's still in pending status).
        if (this.emailModel.status !== EmailAddressStatusEnum.PENDING) {
            emailProcessResultModel.isContinueProcess = this.breakProcess(null, SendEmailStepNameEnum.INITIATE, `The email in status of ${this.emailModel.status}.`);
            return emailProcessResultModel;
        }
        // Validate that the email address does not exist in the Mongo database.
        if (await mongoDatabaseService.isEmailAddressExists(this.emailModel.toEmailAddress)) {
            emailProcessResultModel.isContinueProcess = this.breakProcess(EmailAddressStatusEnum.EXISTS, SendEmailStepNameEnum.INITIATE, 'Email address exists in the Mongo database.');
            return emailProcessResultModel;
        }
        // Set the account that will send the email.
        accountService.checkAccount(false);
        this.setAccount();
        return emailProcessResultModel;
    }

    runEmailValidateProcess() {
        this.emailModel.step = SendEmailStepNameEnum.VALIDATE;
        const emailProcessResultModel = new EmailProcessResultModel();
        // Security error logic - Verify that somehow the email address was not sent already in this session.
        if (this.securityEmailsSentList.indexOf(this.emailModel.toEmailAddress) > -1) {
            emailProcessResultModel.isContinueProcess = this.breakProcess(EmailAddressStatusEnum.SECURITY_ERROR, SendEmailStepNameEnum.VALIDATE, 'Email addresses already sent in this session.');
            return emailProcessResultModel;
        }
        // If valid, add random text and subject to the email address.
        templateService.checkTemplate();
        this.setEmailTemplate();
        // Validate all fields ready for the email to be sent + Check if from and to identical.
        if (!this.validateEmail()) {
            emailProcessResultModel.isContinueProcess = false;
            return emailProcessResultModel;
        }
        return emailProcessResultModel;
    }

    async runEmailSendProcess() {
        this.emailModel.step = SendEmailStepNameEnum.SEND;
        let emailProcessResultModel = null;
        // Send the email (sendgridService) or simulate the email sending process (flag from settings) + Random SENT/ERROR status.
        const sendResult = await this.send();
        emailProcessResultModel = this.sendResultProcess(sendResult);
        if (!emailProcessResultModel.isContinueProcess) {
            return emailProcessResultModel;
        }
        // Save the email address in the Mongo database.
        const saveResult = await this.save();
        emailProcessResultModel = this.saveResultProcess(saveResult);
        if (!emailProcessResultModel.isContinueProcess) {
            return emailProcessResultModel;
        }
        return new EmailProcessResultModel();
    }

    runEmailFinalizeProcess() {
        this.emailModel.step = SendEmailStepNameEnum.FINALIZE;
        // Check for gracefully switch account.
        const emailProcessResultModel = new EmailProcessResultModel();
        if (!accountService.checkAccount(true)) {
            emailProcessResultModel.isContinueProcess = false;
            emailProcessResultModel.exitProgramStatus = StatusEnum.LIMIT_EXCEEDED;
        }
        return emailProcessResultModel;
    }

    async send() {
        return applicationService.applicationDataModel.isSendEmails ?
            await sendgridService.send(this.emailModel, templateService.templateDataModel, templateService.cvDataModel) :
            await sendgridService.simulate();
    }

    async save() {
        return applicationService.applicationDataModel.isSaveEmails ?
            await mongoDatabaseService.saveEmailAddress(this.emailModel.toEmailAddress) : await mongoDatabaseService.simulate();
    }

    breakProcess(status, stepName, extraDetails) {
        const resultDetails = [`Error: break process in the ${stepName} step.`];
        if (extraDetails) {
            resultDetails.push(extraDetails);
        }
        this.setProcessResults({
            status: status,
            resultDetails: resultDetails,
            code: null
        });
        return false;
    }

    sendResultProcess(sendResult) {
        let emailProcessResultModel = new EmailProcessResultModel();
        // Advance the send email counter of the account, regardless of the result.
        if (!sendResult) {
            this.setProcessResults({
                status: EmailAddressStatusEnum.ERROR,
                resultDetails: ['Error: the email was not sent. No sendResult object was found.'],
                code: null
            });
            emailProcessResultModel.isContinueProcess = false;
        }
        else {
            let status = null;
            const resultDetails = [];
            const { sendError, code, reason, description, isSent, isRetrySend, exitProgramStatus } = sendResult;
            if (isSent) {
                status = EmailAddressStatusEnum.SENT;
                resultDetails.push(description);
                // Insert to securityEmailsSentList.
                this.securityEmailsSentList.push(this.emailModel.toEmailAddress);
            }
            else {
                resultDetails.push('Error: the email was not sent.');
                if (sendError) {
                    resultDetails.push(`${systemUtils.getErrorDetails(sendError)}`);
                }
                else if (reason || description) {
                    if (reason) {
                        resultDetails.push(`Reason: ${reason}.`);
                    }
                    if (description) {
                        resultDetails.push(`Description: ${description}`);
                    }
                }
                else {
                    resultDetails.push('No sendError, reason or description were found.');
                }
                status = EmailAddressStatusEnum.ERROR;
                emailProcessResultModel = this.setEmailProcessResult(isRetrySend, exitProgramStatus);
            }
            this.setProcessResults({
                status: status,
                resultDetails: resultDetails,
                code: code
            });
        }
        return emailProcessResultModel;
    }

    setEmailProcessResult(isRetrySend, exitProgramStatus) {
        const emailProcessResultModel = new EmailProcessResultModel();
        emailProcessResultModel.isContinueProcess = false;
        // Switch account if needed.
        if (isRetrySend && !exitProgramStatus) {
            // If no available account is left - Exit the program.
            if (!accountService.switchAccount()) {
                isRetrySend = false;
                exitProgramStatus = StatusEnum.LIMIT_EXCEEDED;
            }
        }
        emailProcessResultModel.isRetrySend = isRetrySend;
        emailProcessResultModel.exitProgramStatus = exitProgramStatus;
        return emailProcessResultModel;
    }

    saveResultProcess(saveResult) {
        const { status, description, isSave, exitProgramStatus } = saveResult;
        const emailProcessResultModel = new EmailProcessResultModel();
        this.breakProcess(status, SendEmailStepNameEnum.SEND, description);
        emailProcessResultModel.isContinueProcess = isSave;
        emailProcessResultModel.exitProgramStatus = exitProgramStatus;
        return emailProcessResultModel;
    }

    setProcessResults(data) {
        let { status, resultDetails, code } = data;
        if (status) {
            // Compare here the statuses and log of somehow the statuses.
            if (this.emailModel.status === status) {
                this.emailModel.status = EmailAddressStatusEnum.IDENTICAL_STATUS;
                resultDetails.push(`Identical statuses of ${status}.`);
            }
            else {
                this.emailModel.status = status;
            }
        }
        this.updateSendEmailData();
        let isOverrideResults = false;
        switch (status) {
            // In case of change from status SENT to status SAVE,
            // we will restore the original status and details for the log.
            case EmailAddressStatusEnum.SAVE: {
                this.emailModel.status = EmailAddressStatusEnum.SENT;
                break;
            }
            // In case of any error after SENT, we want to
            // override the results in the log and notify about it.
            case EmailAddressStatusEnum.SECURITY_EXISTS:
            case EmailAddressStatusEnum.UNSAVE: {
                isOverrideResults = true;
                break;
            }
        }
        // Subtract 1 from the pending if any change in the current status.
        // If the status is SAVE, we already did this action in SENT status.
        if (status !== EmailAddressStatusEnum.SAVE) {
            this.subtractPendingSendEmailData();
        }
        if (this.emailModel.resultDateTime && !isOverrideResults) {
            return;
        }
        this.emailModel.resultDateTime = timeUtils.getCurrentDate();
        this.emailModel.resultDetails = resultDetails;
        this.emailModel.resultCode = code;
    }

    updateSendEmailData() {
        this.sendEmailDataModel.updateCount(true, this.emailModel.status, 1);
        // Count if the email is monitored.
        if (this.emailModel.status === EmailAddressStatusEnum.SENT && this.emailModel.type === EmailAddressTypeEnum.MONITOR) {
            this.sendEmailDataModel.updateCount(true, EmailAddressStatusEnum.MONITOR_SENT, 1);
        }
    }

    subtractPendingSendEmailData() {
        this.sendEmailDataModel.updateCount(false, EmailAddressStatusEnum.PENDING, 1);
    }

    setAccount() {
        this.emailModel.accountId = accountService.account.id;
        this.emailModel.accountApiKey = accountService.account.apiKey;
        this.emailModel.fromEmailAddress = accountService.account.username;
    }

    setEmailTemplate() {
        this.emailModel.subjectId = templateService.templateModel.subjectId;
        this.emailModel.subject = templateService.templateModel.subject;
        this.emailModel.subjectLine = templateService.templateModel.subjectLine;
        this.emailModel.subjectLineDisplay = templateService.templateModel.subjectLineDisplay;
        this.emailModel.textId = templateService.templateModel.textId;
        this.emailModel.text = templateService.templateModel.text;
        this.emailModel.textLine = templateService.templateModel.textLine;
        this.emailModel.textLineDisplay = templateService.templateModel.textLineDisplay;
    }

    scanFields(data) {
        const { keysList, isExpectedFilled } = data;
        let isContinueProcess = true;
        for (let i = 0; i < keysList.length; i++) {
            const key = keysList[i];
            const value = this.emailModel[key];
            if (isExpectedFilled) {
                if (!value) {
                    isContinueProcess = this.breakProcess(EmailAddressStatusEnum.MISSING_FIELD, SendEmailStepNameEnum.VALIDATE, `Missing field: ${key}.`);
                    break;
                }
            }
            else {
                if (value) {
                    isContinueProcess = this.breakProcess(EmailAddressStatusEnum.UNEXPECTED_FIELD, SendEmailStepNameEnum.VALIDATE, `Unexpected field: ${key}.`);
                    break;
                }
            }
        }
        return isContinueProcess;
    }

    validateEmail() {
        // Validate relevant fields filled.
        let isContinueProcess = this.scanFields({
            keysList: ['id', 'createDateTime', 'accountId', 'accountApiKey', 'toEmailAddress', 'fromEmailAddress',
                'subjectId', 'subject', 'subjectLine', 'subjectLineDisplay', 'textId', 'text', 'textLine',
                'textLineDisplay', 'status', 'type', 'resultCode'],
            isExpectedFilled: true
        });
        if (!isContinueProcess) {
            return false;
        }
        // Validate that the email toEmailAddress and fromEmailAddress are not identical.
        if (this.emailModel.toEmailAddress.trim() === this.emailModel.fromEmailAddress.trim()) {
            return this.breakProcess(EmailAddressStatusEnum.IDENTICAL_ADDRESSES, SendEmailStepNameEnum.VALIDATE, 'The from email and the to address identical.');
        }
        // Validate relevant fields not filled.
        isContinueProcess = this.scanFields({
            keysList: ['resultDateTime', 'resultDetails'],
            isExpectedFilled: false
        });
        if (!isContinueProcess) {
            return false;
        }
        // Validate that the email's status is still PENDING.
        if (this.emailModel.status !== EmailAddressStatusEnum.PENDING) {
            return this.breakProcess(EmailAddressStatusEnum.INVALID_STATUS, SendEmailStepNameEnum.VALIDATE, `Invalid status ${this.emailModel.status} in this step.`);
        }
        return isContinueProcess;
    }
}

export default new SendEmailService();