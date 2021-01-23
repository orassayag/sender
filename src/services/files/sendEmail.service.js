const { EmailProcessResult, SendEmailData } = require('../../core/models/application');
const { EmailAddressStatus, EmailAddressType, SendEmailStepName, Status } = require('../../core/enums');
const accountService = require('./account.service');
const applicationService = require('./application.service');
const mongoDatabaseService = require('./mongoDatabase.service');
const sendgridService = require('./sendgrid.service');
const templateService = require('./template.service');
const { systemUtils } = require('../../utils');

class SendEmailService {

    constructor() {
        this.email = null;
        this.sendEmailData = null;
        this.securityEmailsSentList = null;
    }

    initiate() {
        this.sendEmailData = new SendEmailData();
        this.securityEmailsSentList = [];
        this.emailAddressStatusKeys = Object.keys(EmailAddressStatus);
    }

    async runEmailProcess(email) {
        this.email = email;
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
        this.email.step = SendEmailStepName.INITIATE;
        const emailProcessResult = new EmailProcessResult();
        // Validate that the email's status still relevant to be send (if it's still in pending status).
        if (this.email.status !== EmailAddressStatus.PENDING) {
            emailProcessResult.isContinueProcess = this.breakProcess(null, SendEmailStepName.INITIATE, `The email in status of ${this.email.status}.`);
            return emailProcessResult;
        }
        // Validate that the email address not exists in the Mongo database.
        if (await mongoDatabaseService.isEmailAddressExists(this.email.toEmailAddress)) {
            emailProcessResult.isContinueProcess = this.breakProcess(EmailAddressStatus.EXISTS, SendEmailStepName.INITIATE, 'Email address exists in the Mongo database.');
            return emailProcessResult;
        }
        // Set the account that will send the email.
        accountService.checkAccount(false);
        this.setAccount();
        return emailProcessResult;
    }

    runEmailValidateProcess() {
        this.email.step = SendEmailStepName.VALIDATE;
        const emailProcessResult = new EmailProcessResult();
        // Security error logic - Verify that somehow the email address not sent already in this session.
        if (this.securityEmailsSentList.indexOf(this.email.toEmailAddress) > -1) {
            emailProcessResult.isContinueProcess = this.breakProcess(EmailAddressStatus.SECURITY_ERROR, SendEmailStepName.VALIDATE, 'Email addresses already sent in this session.');
            return emailProcessResult;
        }
        // If valid, add random text and subject to the email address.
        templateService.checkTemplate();
        this.setEmailTemplate();
        // Validate all fields ready for the email to be sent + Check if from and to identical.
        if (!this.validateEmail()) {
            emailProcessResult.isContinueProcess = false;
            return emailProcessResult;
        }
        return emailProcessResult;
    }

    async runEmailSendProcess() {
        this.email.step = SendEmailStepName.SEND;
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
        this.email.step = SendEmailStepName.FINALIZE;
        // Check for gracefully switch account.
        const emailProcessResult = new EmailProcessResult();
        if (!accountService.checkAccount(true)) {
            emailProcessResult.isContinueProcess = false;
            emailProcessResult.exitProgramStatus = Status.LIMIT_EXCEEDED;
        }
        return emailProcessResult;
    }

    async send() {
        return applicationService.applicationData.isSendEmails ?
            await sendgridService.send(this.email, templateService.templateData, templateService.cvData) :
            await sendgridService.simulate();
    }

    async save() {
        return applicationService.applicationData.isSaveEmails ?
            await mongoDatabaseService.saveEmailAddress(this.email.toEmailAddress) : await mongoDatabaseService.simulate();
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
                this.securityEmailsSentList.push(this.email.toEmailAddress);
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
            if (!accountService.switchAccount()) {
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
        let { status, resultDetails, code } = data;
        if (status) {
            // Compare here the statuses and log of some how the statuses.
            if (this.email.status === status) {
                this.email.status = EmailAddressStatus.IDENTICAL_STATUS;
                resultDetails.push(`Identical statuses of ${status}.`);
            }
            else {
                this.email.status = status;
            }
        }
        this.updateSendEmailData();
        let isOverrideResults = false;
        switch (status) {
            // In case of change from status SENT to status SAVE,
            // we will restore the original status and details for the log.
            case EmailAddressStatus.SAVE:
                this.email.status = EmailAddressStatus.SENT;
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
            this.subtractPendingSendEmailData();
        }
        if (this.email.resultDateTime && !isOverrideResults) {
            return;
        }
        this.email.resultDateTime = new Date();
        this.email.resultDetails = resultDetails;
        this.email.resultCode = code;
    }

    updateSendEmailData() {
        this.sendEmailData.updateCount(true, this.email.status, 1);
        // Count if the email is monitor.
        if (this.email.status === EmailAddressStatus.SENT && this.email.type === EmailAddressType.MONITOR) {
            this.sendEmailData.updateCount(true, EmailAddressStatus.MONITOR_SENT, 1);
        }
    }

    subtractPendingSendEmailData() {
        this.sendEmailData.updateCount(false, EmailAddressStatus.PENDING, 1);
    }

    setAccount() {
        this.email.accountId = accountService.account.id;
        this.email.accountApiKey = accountService.account.apiKey;
        this.email.fromEmailAddress = accountService.account.username;
    }

    setEmailTemplate() {
        this.email.subjectId = templateService.template.subjectId;
        this.email.subject = templateService.template.subject;
        this.email.subjectLine = templateService.template.subjectLine;
        this.email.subjectLineDisplay = templateService.template.subjectLineDisplay;
        this.email.textId = templateService.template.textId;
        this.email.text = templateService.template.text;
        this.email.textLine = templateService.template.textLine;
        this.email.textLineDisplay = templateService.template.textLineDisplay;
    }

    scanFields(data) {
        const { keysList, isExpectedFilled } = data;
        let isContinueProcess = true;
        for (let i = 0; i < keysList.length; i++) {
            const key = keysList[i];
            const value = this.email[key];
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
        // Validate that the email toEmailAddress and fromEmailAddress not identical.
        if (this.email.toEmailAddress.trim() === this.email.fromEmailAddress.trim()) {
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
        if (this.email.status !== EmailAddressStatus.PENDING) {
            return this.breakProcess(EmailAddressStatus.INVALID_STATUS, SendEmailStepName.VALIDATE, `Invalid status ${this.email.status} in this step.`);
        }
        return isContinueProcess;
    }
}

module.exports = new SendEmailService();