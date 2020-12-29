const applicationService = require('./application.service');
const countLimitService = require('./countLimit.service');
const mongoDatabaseService = require('./mongoDatabase.service');
const sendEmailService = require('./sendEmail.service');
const { EmailAddressesSourceType, EmailAddressStatus, EmailAddressType, Method } = require('../../core/enums');
const { Email, EmailData, SourceData } = require('../../core/models/application');
const { fileUtils, pathUtils, textUtils, validationUtils } = require('../../utils');
const { invalidDomains, filterEmailAddressDomains, filterEmailAddresses,
    commonEmailAddressDomainsList } = require('../../configurations/emailAddress.configuration');

const emailAddressesFromArray = ['test@gmail.com'];

class CreateEmailService {

    constructor() {
        this.sourceData = null;
        this.lastEmailId = 0;
    }

    async initiate(settings) {
        this.sourceData = new SourceData(settings);
        // Get the email addresses from the specific source,
        // and create the Email instances inside EmailData instance.
        let emailData = await this.getEmailAddresses();
        // Add extra logic the emails.
        emailData = await this.finalizeEmailData(emailData);
        // Update counts.
        sendEmailService.sendEmailData.updateCount(true, EmailAddressStatus.PENDING, emailData.emailsList.length);
        sendEmailService.sendEmailData.updateCount(true, EmailAddressStatus.TOTAL_PENDING, emailData.emailsList.length);
        sendEmailService.sendEmailData.updateCount(true, EmailAddressStatus.DATABASE, await mongoDatabaseService.getEmailAddressesCount());
        return emailData;
    }

    async finalizeEmailData(emailData) {
        // Check for skip domains.
        if (applicationService.applicationData.isSkipLogic) {
            emailData = this.skipDomains(emailData);
        }
        // Add monitor emails if needed.
        if (applicationService.applicationData.isMonitorLogic) {
            emailData = await this.addMonitorEmails(emailData);
        }
        return emailData;
    }

    async getEmailAddresses() {
        // Get the emails data from the relevant source.
        let emailData = null;
        switch (this.sourceData.emailAddressesSourceType) {
            case EmailAddressesSourceType.DIRECTORY: {
                const { path, parameterName } = this.getPath();
                emailData = await this.getEmailAddressesDirectory({
                    path: path,
                    parameterName: parameterName,
                    emailData: emailData
                });
                break;
            }
            case EmailAddressesSourceType.FILE: {
                const { path, parameterName } = this.getPath();
                emailData = await this.getEmailAddressesFile({
                    path: path,
                    parameterName: parameterName,
                    emailData: emailData
                });
                break;
            }
            case EmailAddressesSourceType.ARRAY: {
                emailData = this.getEmailAddressesArray(emailData);
                break;
            }
        }
        return emailData;
    }

    async addMonitorEmails(emailData) {
        emailData = await this.getEmailAddressesFile({
            path: this.sourceData.monitorFilePath,
            parameterName: pathUtils.getBasename(this.sourceData.monitorFilePath),
            emailData: emailData
        });
        return emailData;
    }

    getPath() {
        let path = null;
        let parameterName = null;
        if (applicationService.applicationData.isProductionMode) {
            path = this.sourceData.emailAddressesProductionSourcePath;
            parameterName = 'EMAIL_ADDRESSES_PRODUCTION_SOURCE_PATH';
        }
        else {
            path = this.sourceData.emailAddressesDevelopmentSourcePath;
            parameterName = 'EMAIL_ADDRESSES_DEVELOPMENT_SOURCE_PATH';
        }
        return {
            path: path,
            parameterName: parameterName
        };
    }

    async fetchEmailAddresses(path) {
        const fileSize = fileUtils.getFileSize(path);
        if (fileSize > countLimitService.countLimitData.maximumFileSizeMegabytes) {
            switch (this.sourceData.emailAddressesSourceType) {
                case EmailAddressesSourceType.DIRECTORY:
                    return [];
                case EmailAddressesSourceType.FILE:
                    throw new Error(`File exceeded the maximum size of ${countLimitService.countLimitData.maximumFileSizeMegabytes}MB: ${fileSize}MB (1000012)`);
            }
        }
        const content = await fileUtils.readFile(path);
        return textUtils.getEmailAddresses(content);
    }

    async getEmailAddressesDirectory(data) {
        const { path, parameterName, emailData } = data;
        if (!fileUtils.isPathExists(path)) {
            throw new Error(`Invalid or no ${parameterName} parameter was found: Excpected a number but received: ${path} (1000013)`);
        }
        if (fileUtils.isFilePath(path)) {
            throw new Error(`The parameter path ${parameterName} marked as directory but it's a path of a file: ${path} (1000014)`);
        }
        // Fetch the email addresses.
        let files = await fileUtils.getFilesRecursive(path);
        // Validate that there is at least 1 TXT file in the source directory.
        files = files.filter(f => {
            return pathUtils.isTypeFile({
                fileName: f,
                fileExtension: 'txt'
            });
        });
        if (!validationUtils.isExists(files)) {
            throw new Error(`No TXT files exists in ${path} (1000015)`);
        }
        // Filter relevant files and scan them.
        let emailAddressesList = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = pathUtils.getBasename(file);
            // Scan only files that starts with specific file name.
            if (fileName.indexOf(this.sourceData.emailAddressesIncludeFileName) === 0) {
                // Fetch the email addresses.
                const tempEmailAddressesList = await this.fetchEmailAddresses(file);
                emailAddressesList = [...emailAddressesList, ...tempEmailAddressesList];
            }
        }
        return this.createEmailData({
            emailAddressesList: emailAddressesList,
            emailData: emailData
        });
    }

    async getEmailAddressesFile(data) {
        const { path, parameterName, emailData } = data;
        if (!fileUtils.isPathExists(path)) {
            throw new Error(`Invalid or no ${parameterName} parameter was found: Excpected a number but received: ${path} (1000016)`);
        }
        if (fileUtils.isDirectoryPath(path)) {
            throw new Error(`The parameter path ${parameterName} marked as file but it's a path of a directory: ${path} (1000017)`);
        }
        // Fetch the email addresses.
        const emailAddressesList = await this.fetchEmailAddresses(path);
        return this.createEmailData({
            emailAddressesList: emailAddressesList,
            emailData: emailData
        });
    }

    getEmailAddressesArray(emailData) {
        return this.createEmailData({
            emailAddressesList: emailAddressesFromArray,
            emailData: emailData
        });
    }

    validateEmailAddressesCount(emailAddressesList) {
        if (!validationUtils.isExists(emailAddressesList)) {
            throw new Error('No email addresses found in the source (1000018)');
        }
    }

    // Validate if exceeded from the configured number,
    // take random email addresses from the list.
    validateRandomExceeded(emailAddressesList) {
        if (emailAddressesList.length <= countLimitService.countLimitData.maximumSendEmails) {
            if (!sendEmailService.sendEmailData.totalCount) {
                sendEmailService.sendEmailData.updateCount(true, EmailAddressStatus.TOTAL, emailAddressesList.length);
                applicationService.applicationData.method = Method.STANDARD;
            }
            return emailAddressesList;
        }
        const total = emailAddressesList.length;
        emailAddressesList = this.getRandomUniqueKeysFromArray({
            list: emailAddressesList,
            itemsCount: countLimitService.countLimitData.maximumSendEmails,
            isSkipLogic: false
        });
        const pending = emailAddressesList.length;
        if (!sendEmailService.sendEmailData.totalCount) {
            sendEmailService.sendEmailData.updateCount(true, EmailAddressStatus.TOTAL, total);
            applicationService.applicationData.method = total !== pending ? Method.RANDOM_EXCEEDED : Method.STANDARD;
        }
        return emailAddressesList;
    }

    createEmailData(data) {
        let { emailAddressesList, emailData } = data;
        // Validate the existence of at least 1 email address.
        this.validateEmailAddressesCount(emailAddressesList);
        let isMonitorList = false;
        if (emailData) {
            isMonitorList = true;
        }
        else {
            emailData = new EmailData();
        }
        // Validate random exceeded.
        emailAddressesList = this.validateRandomExceeded(emailAddressesList);
        let monitorEmailsCount = isMonitorList ? 0 : null;
        const existsEmailAddressesList = [];
        for (let i = 0; i < emailAddressesList.length; i++) {
            const emailAddress = emailAddressesList[i];
            if (!emailAddress) {
                continue;
            }
            this.lastEmailId++;
            const lowerEmailAddress = textUtils.toLowerCaseTrim(emailAddress);
            let email = new Email({
                id: this.lastEmailId,
                toEmailAddress: emailAddress.trim(),
                type: isMonitorList ? EmailAddressType.MONITOR : EmailAddressType.STANDARD
            });
            // Validate the email.
            email = this.basicValidateEmail(email);
            // Validate if duplicate.
            email = this.duplicateValidateEmail({
                email: email,
                lowerEmailAddress: lowerEmailAddress,
                existsEmailAddressesList: existsEmailAddressesList
            });
            if (isMonitorList) {
                if (monitorEmailsCount >= countLimitService.countLimitData.monitorEmailsSendCount) {
                    break;
                }
                // Pick a remaining element.
                const randomIndex = textUtils.getRandomNumber(0, emailData.emailsList.length);
                // And swap it with the current element.
                const temporaryValue = emailData.emailsList[randomIndex];
                emailData.emailsList[randomIndex] = email;
                emailData.emailsList.push(temporaryValue);
                monitorEmailsCount++;
            }
            else {
                emailData.emailsList.push(email);
            }
            existsEmailAddressesList.push(lowerEmailAddress);
        }
        return emailData;
    }

    basicValidateEmail(email) {
        // Validate the email address.
        email = this.validateEmailAddress(email);
        // Filter the email address.
        email = this.filterEmailAddress(email);
        return email;
    }

    duplicateValidateEmail(data) {
        const { email, lowerEmailAddress, existsEmailAddressesList } = data;
        if (!email.status) {
            return email;
        }
        if (existsEmailAddressesList.indexOf(lowerEmailAddress) > -1) {
            email.status = EmailAddressStatus.DUPLICATE;
        }
        return email;
    }

    validateEmailAddress(email) {
        if (!validationUtils.validateEmailAddress(email.toEmailAddress)) {
            email.status = EmailAddressStatus.INVALID;
        }
        return email;
    }

    filterEmailAddress(email) {
        if (!email.status) {
            return email;
        }
        const domainPart = textUtils.getEmailAddressParts(email.toEmailAddress)[1];
        if (filterEmailAddressDomains.includes(domainPart)) {
            email.status = EmailAddressStatus.FILTER;
            return email;
        }
        const emailAddressIndex = filterEmailAddresses.findIndex(emailAddressItem =>
            textUtils.toLowerCaseTrim(emailAddressItem) === textUtils.toLowerCaseTrim(email.toEmailAddress));
        if (emailAddressIndex > -1) {
            email.status = EmailAddressStatus.FILTER;
            return email;
        }
        for (let i = 0; i < invalidDomains.length; i++) {
            if (domainPart.indexOf(invalidDomains[i]) > -1) {
                email.status = EmailAddressStatus.FILTER;
                return email;
            }
        }
        return email;
    }

    skipDomains(emailData) {
        const maximumUniqueDomainCount = countLimitService.countLimitData.maximumUniqueDomainCount;
        if (!maximumUniqueDomainCount || emailData.emailsList.length <= maximumUniqueDomainCount) {
            return emailData;
        }
        const emailDataGroupsList = [];
        const updatedEmailDataList = [];
        for (let i = 0; i < emailData.emailsList.length; i++) {
            const email = emailData.emailsList[i];
            const splitResult = textUtils.getEmailAddressParts(email.toEmailAddress);
            if (!splitResult || splitResult.length < 2) {
                continue;
            }
            const domainPart = textUtils.toLowerCaseTrim(splitResult[1]);
            if (!domainPart) {
                continue;
            }
            // Check if the domain is common domain. Not relevant is true.
            if (commonEmailAddressDomainsList.findIndex(domain => domain === domainPart) > -1) {
                updatedEmailDataList.push(email);
                continue;
            }
            const groupIndex = emailDataGroupsList.findIndex(d => d.domainPart === domainPart);
            // Insert / update the list.
            if (groupIndex > -1) {
                emailDataGroupsList[groupIndex].emailsList.push(email);
            }
            else {
                emailDataGroupsList.push({
                    domainPart: domainPart,
                    emailsList: [email]
                });
            }
        }
        for (let i = 0; i < emailDataGroupsList.length; i++) {
            const group = emailDataGroupsList[i];
            let emailDataGroup = group.emailsList;
            if (emailDataGroup.length >= maximumUniqueDomainCount) {
                for (let y = 0; y < emailDataGroup.length; y++) {
                    emailDataGroup[y].status = EmailAddressStatus.SKIP;
                }
                emailDataGroupsList[i].emailsList = this.getRandomUniqueKeysFromArray({
                    list: emailDataGroup,
                    itemsCount: maximumUniqueDomainCount,
                    isSkipLogic: true
                });
            }
            updatedEmailDataList.push(...emailDataGroupsList[i].emailsList);
        }
        emailData.emailsList = updatedEmailDataList;
        return emailData;
    }

    getRandomUniqueKeysFromArray(data) {
        const { list, itemsCount, isSkipLogic } = data;
        if (list.length === itemsCount) {
            return list;
        }
        const numbersList = [];
        const returnList = isSkipLogic ? null : [];
        for (let i = 0; i < 2000; i++) {
            const selectedIndex = textUtils.getRandomNumber(0, list.length);
            if (numbersList.indexOf(selectedIndex) === -1) {
                numbersList.push(selectedIndex);
                if (isSkipLogic) {
                    list[selectedIndex].status = EmailAddressStatus.PENDING;
                }
                else {
                    returnList.push(list[selectedIndex]);
                }
                if (numbersList.length >= itemsCount) {
                    break;
                }
            }
        }
        return isSkipLogic ? list : returnList;
    }

    // When retry to send email, need to reset it's previous data.
    resetEmail(email) {
        const { id, toEmailAddress, type, retriesCount } = email;
        email = new Email({
            id: id,
            toEmailAddress: toEmailAddress,
            type: type
        });
        email.retriesCount = retriesCount + 1;
        return email;
    }
}

module.exports = new CreateEmailService();