const accountsService = require('./accounts.service');
const applicationService = require('./application.service');
const mongoDatabaseService = require('./mongoDatabase.service');
const templatesService = require('./templates.service');
const sendgridService = require('./sendgrid.service');
const { EmailAddressStatus, EmailAddressType, SendEmailStepName, Status } = require('../../core/enums');
const { EmailProcessResult, SendEmailsData } = require('../../core/models/application');
const { systemUtils } = require('../../utils');

class SendEmailService {

    constructor() {
        this.emailData = null;
        this.sendEmailsData = null;
        this.securityEmailsSentList = null;
    }

    initiate() {
        this.sendEmailsData = new SendEmailsData();
        this.securityEmailsSentList = [];
        this.emailAddressStatusKeys = Object.keys(EmailAddressStatus);
    }

    async runEmailProcess(emailData) {
        this.emailData = emailData;
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
        this.emailData.step = SendEmailStepName.INITIATE;
        const emailProcessResult = new EmailProcessResult();
        // Validate that the email's status still relevant to be send (if it's still in pending status).
        if (this.emailData.status !== EmailAddressStatus.PENDING) {
            emailProcessResult.isContinueProcess = this.breakProcess(null, SendEmailStepName.INITIATE, `The email in status of ${this.emailData.status}.`);
            return emailProcessResult;
        }
        // Validate that the email address not exists in the Mongo database.
        if (await mongoDatabaseService.isEmailAddressExists(this.emailData.toEmailAddress)) {
            emailProcessResult.isContinueProcess = this.breakProcess(EmailAddressStatus.EXISTS, SendEmailStepName.INITIATE, 'Email address exists in the Mongo database.');
            return emailProcessResult;
        }
        // Set the account that will send the email.
        accountsService.checkAccount(false);
        this.setAccount();
        return emailProcessResult;
    }

    runEmailValidateProcess() {
        this.emailData.step = SendEmailStepName.VALIDATE;
        const emailProcessResult = new EmailProcessResult();
        // Security error logic - Verify that somehow the email address not sent already in this session.
        if (this.securityEmailsSentList.indexOf(this.emailData.toEmailAddress) > -1) {
            emailProcessResult.isContinueProcess = this.breakProcess(EmailAddressStatus.SECURITY_ERROR, SendEmailStepName.VALIDATE, 'Email addresses already sent in this session.');
            return emailProcessResult;
        }
        // If valid, add random text and subject to the email address.
        templatesService.checkTemplate();
        this.setEmailTemplate();
        // Validate all fields ready for the email to be sent + Check if from and to identical.
        if (!this.validateEmailData()) {
            emailProcessResult.isContinueProcess = false;
            return emailProcessResult;
        }
        return emailProcessResult;
    }

    async runEmailSendProcess() {
        this.emailData.step = SendEmailStepName.SEND;
        let emailProcessResult = null;
        // Send the email (sendgridService) or simulate email send process (flag from settings.js) + Random SENT/ERROR status.
        const sendResult = await this.send();
        emailProcessResult = this.sendResultProcess(sendResult);
        if (!emailProcessResult.isContinueProcess) {
            return emailProcessResult;
        }
        // Save the email address in the Mongo database.
        const saveResult = await this.save();
        emailProcessResult = this.saveResultProcess(saveResult);
        if (!emailProcessResult.isContinueProcess) {
            return emailProcessResult;
        }
        return new EmailProcessResult();
    }

    runEmailFinalizeProcess() {
        this.emailData.step = SendEmailStepName.FINALIZE;
        // Check for gracefully switch account.
        const emailProcessResult = new EmailProcessResult();
        if (!accountsService.checkAccount(true)) {
            emailProcessResult.isContinueProcess = false;
            emailProcessResult.exitProgramStatus = Status.LIMIT_EXCEEDED;
        }
        return emailProcessResult;
    }

    async send() {
        return applicationService.applicationData.isSendEmails ?
            await sendgridService.send(this.emailData, templatesService.cvData) : await sendgridService.simulate();
    }

    async save() {
        return applicationService.applicationData.isSaveEmails ?
            await mongoDatabaseService.saveEmailAddress(this.emailData.toEmailAddress) : await mongoDatabaseService.simulate();
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
        let emailProcessResult = new EmailProcessResult();
        // Advance the send email counter of the account, regardless the result.
        if (!sendResult) {
            this.setProcessResults({
                status: EmailAddressStatus.ERROR,
                resultDetails: ['Error: the email was not sent. No sendResult object was found.'],
                code: null
            });
            emailProcessResult.isContinueProcess = false;
        }
        else {
            let status = null;
            const resultDetails = [];
            const { sendError, code, reason, description, isSent, isRetrySend, exitProgramStatus } = sendResult;
            if (isSent) {
                status = EmailAddressStatus.SENT;
                resultDetails.push(description);
                // Insert to securityEmailsSentList.
                this.securityEmailsSentList.push(this.emailData.toEmailAddress);
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
                status = EmailAddressStatus.ERROR;
                emailProcessResult = this.setEmailProcessResult(isRetrySend, exitProgramStatus);
            }
            this.setProcessResults({
                status: status,
                resultDetails: resultDetails,
                code: code
            });
        }
        return emailProcessResult;
    }

    setEmailProcessResult(isRetrySend, exitProgramStatus) {
        const emailProcessResult = new EmailProcessResult();
        emailProcessResult.isContinueProcess = false;
        // Switch account if needed.
        if (isRetrySend && !exitProgramStatus) {
            // If no available account left - Exit the program.
            if (!accountsService.switchAccount()) {
                isRetrySend = false;
                exitProgramStatus = Status.LIMIT_EXCEEDED;
            }
        }
        emailProcessResult.isRetrySend = isRetrySend;
        emailProcessResult.exitProgramStatus = exitProgramStatus;
        return emailProcessResult;
    }

    saveResultProcess(saveResult) {
        const { status, description, isSave, exitProgramStatus } = saveResult;
        const emailProcessResult = new EmailProcessResult();
        this.breakProcess(status, SendEmailStepName.SEND, description);
        emailProcessResult.isContinueProcess = isSave;
        emailProcessResult.exitProgramStatus = exitProgramStatus;
        return emailProcessResult;
    }

    setProcessResults(data) {
        let { resultDetails, code } = data;
        const { status } = data;
        if (status) {
            // Compare here the statuses and log of some how the statuses.
            if (this.emailData.status === status) {
                this.emailData.status = EmailAddressStatus.IDENTICAL_STATUS;
                resultDetails.push(`Identical statuses of ${status}.`);
            }
            else {
                this.emailData.status = status;
            }
        }
        this.updateSendEmailsData();
        let isOverrideResults = false;
        switch (status) {
            // In case of change from status SENT to status SAVE,
            // we will restore the original status and details for the log.
            case EmailAddressStatus.SAVE:
                this.emailData.status = EmailAddressStatus.SENT;
                break;
            // In case of any error after SENT, we want to
            // override the results in the log and notify about it.
            case EmailAddressStatus.SECURITY_EXISTS:
            case EmailAddressStatus.UNSAVE:
                isOverrideResults = true;
                break;
        }
        // Subtract 1 from the pending if any change in the current status.
        // If the status is SAVE, we already did this action in SENT status.
        if (status !== EmailAddressStatus.SAVE) {
            this.subtractPendingSendEmailsData();
        }
        if (this.emailData.resultDateTime && !isOverrideResults) {
            return;
        }
        this.emailData.resultDateTime = new Date();
        this.emailData.resultDetails = resultDetails;
        this.emailData.resultCode = code;
    }

    updateSendEmailsData() {
        this.sendEmailsData.updateCount(true, this.emailData.status, 1);
        // Count if the email is monitor.
        if (this.emailData.status === EmailAddressStatus.SENT && this.emailData.type === EmailAddressType.MONITOR) {
            this.sendEmailsData.updateCount(true, EmailAddressStatus.MONITOR_SENT, 1);
        }
    }

    subtractPendingSendEmailsData() {
        this.sendEmailsData.updateCount(false, EmailAddressStatus.PENDING, 1);
    }

    setAccount() {
        this.emailData.accountId = accountsService.accountData.id;
        this.emailData.accountApiKey = accountsService.accountData.apiKey;
        this.emailData.fromEmailAddress = accountsService.accountData.username;
    }

    setEmailTemplate() {
        this.emailData.subjectId = templatesService.templateData.subjectId;
        this.emailData.subject = templatesService.templateData.subject;
        this.emailData.subjectLine = templatesService.templateData.subjectLine;
        this.emailData.subjectLineDisplay = templatesService.templateData.subjectLineDisplay;
        this.emailData.textId = templatesService.templateData.textId;
        this.emailData.text = templatesService.templateData.text;
        this.emailData.textLine = templatesService.templateData.textLine;
        this.emailData.textLineDisplay = templatesService.templateData.textLineDisplay;
    }

    scanFields(data) {
        const { keysList, isExpectedFilled } = data;
        let isContinueProcess = true;
        for (let i = 0; i < keysList.length; i++) {
            const key = keysList[i];
            const value = this.emailData[key];
            if (isExpectedFilled) {
                if (!value) {
                    isContinueProcess = this.breakProcess(EmailAddressStatus.MISSING_FIELD, SendEmailStepName.VALIDATE, `Missing field: ${key}.`);
                    break;
                }
            }
            else {
                if (value) {
                    isContinueProcess = this.breakProcess(EmailAddressStatus.UNEXPECTED_FIELD, SendEmailStepName.VALIDATE, `Unexpected field: ${key}.`);
                    break;
                }
            }
        }
        return isContinueProcess;
    }

    validateEmailData() {
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
        // Validate that the email toEmailAddress and fromEmailAddress not identical.
        if (this.emailData.toEmailAddress.trim() === this.emailData.fromEmailAddress.trim()) {
            return this.breakProcess(EmailAddressStatus.IDENTICAL_ADDRESSES, SendEmailStepName.VALIDATE, 'The from email and the to address identical.');
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
        if (this.emailData.status !== EmailAddressStatus.PENDING) {
            return this.breakProcess(EmailAddressStatus.INVALID_STATUS, SendEmailStepName.VALIDATE, `Invalid status ${this.emailData.status} in this step.`);
        }
        return isContinueProcess;
    }
}

module.exports = new SendEmailService();