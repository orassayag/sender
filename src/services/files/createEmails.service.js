const applicationService = require('./application.service');
const countsLimitsService = require('./countsLimits.service');
const mongoDatabaseService = require('./mongoDatabase.service');
const sendEmailService = require('./sendEmail.service');
const { EmailAddressesSourceType, EmailAddressStatus, EmailAddressType, Method } = require('../../core/enums');
const { EmailData, EmailsData, SourcesData } = require('../../core/models/application');
const { fileUtils, pathUtils, textUtils, validationUtils } = require('../../utils');
const { invalidDomains, filterEmailAddressDomains, filterEmailAddresses,
    commonEmailAddressDomainsList } = require('../../configurations/emailAddress.configuration');

const emailAddressesFromArray = [];

class CreateEmailsService {

    constructor() {
        this.sourcesData = null;
        this.lastEmailDataId = 0;
    }

    async initiate(settings) {
        this.sourcesData = new SourcesData(settings);
        // Get the email addresses from the specific source,
        // and create the EmailData instances inside EmailsData instance.
        let emailsData = await this.getEmailAddresses();
        // Add extra logic the emails.
        emailsData = await this.finalizeEmailsData(emailsData);
        // Update counts.
        sendEmailService.sendEmailsData.updateCount(true, EmailAddressStatus.PENDING, emailsData.emailsList.length);
        sendEmailService.sendEmailsData.updateCount(true, EmailAddressStatus.TOTAL_PENDING, emailsData.emailsList.length);
        sendEmailService.sendEmailsData.updateCount(true, EmailAddressStatus.DATABASE, await mongoDatabaseService.getEmailAddressesCount());
        return emailsData;
    }

    async finalizeEmailsData(emailsData) {
        // Check for skip domains.
        if (applicationService.applicationData.isSkipLogic) {
            emailsData = this.skipDomains(emailsData);
        }
        // Add monitor emails if needed.
        if (applicationService.applicationData.isMonitorLogic) {
            emailsData = await this.addMonitorEmails(emailsData);
        }
        return emailsData;
    }

    async getEmailAddresses() {
        // Get the emails data from the relevant source.
        let emailsData = null;
        switch (this.sourcesData.emailAddressesSourceType) {
            case EmailAddressesSourceType.DIRECTORY: {
                const { path, parameterName } = this.getPath();
                emailsData = await this.getEmailAddressesDirectory({
                    path: path,
                    parameterName: parameterName,
                    emailsData: emailsData
                });
                break;
            }
            case EmailAddressesSourceType.FILE: {
                const { path, parameterName } = this.getPath();
                emailsData = await this.getEmailAddressesFile({
                    path: path,
                    parameterName: parameterName,
                    emailsData: emailsData
                });
                break;
            }
            case EmailAddressesSourceType.ARRAY: {
                emailsData = this.getEmailAddressesArray(emailsData);
                break;
            }
        }
        return emailsData;
    }

    async addMonitorEmails(emailsData) {
        const fileName = 'monitor.txt';
        const path = pathUtils.getJoinPath({
            targetPath: __dirname,
            targetName: `../../../misc/data/monitor/${fileName}`
        });
        emailsData = await this.getEmailAddressesFile({
            path: path,
            parameterName: fileName,
            emailsData: emailsData
        });
        return emailsData;
    }

    getPath() {
        let path = null;
        let parameterName = null;
        if (applicationService.applicationData.isProductionMode) {
            path = this.sourcesData.emailAddressesProductionSourcePath;
            parameterName = 'EMAIL_ADDRESSES_PRODUCTION_SOURCE_PATH';
        }
        else {
            path = this.sourcesData.emailAddressesDevelopmentSourcePath;
            parameterName = 'EMAIL_ADDRESSES_DEVELOPMENT_SOURCE_PATH';
        }
        return {
            path: path,
            parameterName: parameterName
        };
    }

    async fetchEmailAddresses(path) {
        const fileSize = fileUtils.getFileSize(path);
        if (fileSize > countsLimitsService.countsLimitsData.maximumFileSizeMegabytes) {
            switch (this.sourcesData.emailAddressesSourceType) {
                case EmailAddressesSourceType.DIRECTORY:
                    return [];
                case EmailAddressesSourceType.FILE:
                    throw new Error(`File exceeded the maximum size of ${countsLimitsService.countsLimitsData.maximumFileSizeMegabytes}MB: ${fileSize}MB (1000012)`);
            }
        }
        const content = await fileUtils.readFile(path);
        return textUtils.getEmailAddresses(content);
    }

    async getEmailAddressesDirectory(data) {
        const { path, parameterName, emailsData } = data;
        if (!fileUtils.isPathExists(path)) {
            throw new Error(`Invalid or no ${parameterName} parameter was found: Excpected a number but received: ${path} (1000013)`);
        }
        if (fileUtils.isFilePath(path)) {
            throw new Error(`The parameter path ${parameterName} marked as file but it's a path of a directory: ${path} (1000014)`);
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
            if (fileName.indexOf(this.sourcesData.emailAddressesIncludeFileName) === 0) {
                // Fetch the email addresses.
                const tempEmailAddressesList = await this.fetchEmailAddresses(file);
                emailAddressesList = [...emailAddressesList, ...tempEmailAddressesList];
            }
        }
        return this.createEmailsData({
            emailAddressesList: emailAddressesList,
            emailsData: emailsData
        });
    }

    async getEmailAddressesFile(data) {
        const { path, parameterName, emailsData } = data;
        if (!fileUtils.isPathExists(path)) {
            throw new Error(`Invalid or no ${parameterName} parameter was found: Excpected a number but received: ${path} (1000016)`);
        }
        if (fileUtils.isDirectoryPath(path)) {
            throw new Error(`The parameter path ${parameterName} marked as directory but it's a path of a file: ${path} (1000017)`);
        }
        // Fetch the email addresses.
        const emailAddressesList = await this.fetchEmailAddresses(path);
        return this.createEmailsData({
            emailAddressesList: emailAddressesList,
            emailsData: emailsData
        });
    }

    getEmailAddressesArray(emailsData) {
        return this.createEmailsData({
            emailAddressesList: emailAddressesFromArray,
            emailsData: emailsData
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
        if (emailAddressesList.length <= countsLimitsService.countsLimitsData.maximumSendEmails) {
            if (!sendEmailService.sendEmailsData.totalCount) {
                sendEmailService.sendEmailsData.updateCount(true, EmailAddressStatus.TOTAL, emailAddressesList.length);
                applicationService.applicationData.method = Method.STANDARD;
            }
            return emailAddressesList;
        }
        const total = emailAddressesList.length;
        emailAddressesList = this.getRandomUniqueKeysFromArray({
            list: emailAddressesList,
            itemsCount: countsLimitsService.countsLimitsData.maximumSendEmails,
            isSkipLogic: false
        });
        const pending = emailAddressesList.length;
        if (!sendEmailService.sendEmailsData.totalCount) {
            sendEmailService.sendEmailsData.updateCount(true, EmailAddressStatus.TOTAL, total);
            applicationService.applicationData.method = total !== pending ? Method.RANDOM_EXCEEDED : Method.STANDARD;
        }
        return emailAddressesList;
    }

    createEmailsData(data) {
        let { emailAddressesList, emailsData } = data;
        // Validate the existence of at least 1 email address.
        this.validateEmailAddressesCount(emailAddressesList);
        let isMonitorList = false;
        if (emailsData) {
            isMonitorList = true;
        }
        else {
            emailsData = new EmailsData();
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
            this.lastEmailDataId++;
            const lowerEmailAddress = textUtils.toLowerCaseTrim(emailAddress);
            let emailData = new EmailData({
                id: this.lastEmailDataId,
                toEmailAddress: emailAddress.trim(),
                type: isMonitorList ? EmailAddressType.MONITOR : EmailAddressType.STANDARD
            });
            // Validate the email.
            emailData = this.basicValidateEmail(emailData);
            // Validate if duplicate.
            emailData = this.duplicateValidateEmail({
                emailData: emailData,
                lowerEmailAddress: lowerEmailAddress,
                existsEmailAddressesList: existsEmailAddressesList
            });
            if (isMonitorList) {
                if (monitorEmailsCount >= countsLimitsService.countsLimitsData.monitorEmailsSendCount) {
                    break;
                }
                // Pick a remaining element.
                const randomIndex = textUtils.getRandomNumber(0, emailsData.emailsList.length);
                // And swap it with the current element.
                const temporaryValue = emailsData.emailsList[randomIndex];
                emailsData.emailsList[randomIndex] = emailData;
                emailsData.emailsList.push(temporaryValue);
                monitorEmailsCount++;
            }
            else {
                emailsData.emailsList.push(emailData);
            }
            existsEmailAddressesList.push(lowerEmailAddress);
        }
        return emailsData;
    }

    basicValidateEmail(emailData) {
        // Validate the email address.
        emailData = this.validateEmailAddress(emailData);
        // Filter the email address.
        emailData = this.filterEmailAddress(emailData);
        return emailData;
    }

    duplicateValidateEmail(data) {
        const { emailData, lowerEmailAddress, existsEmailAddressesList } = data;
        if (!emailData.status) {
            return emailData;
        }
        if (existsEmailAddressesList.indexOf(lowerEmailAddress) > -1) {
            emailData.status = EmailAddressStatus.DUPLICATE;
        }
        return emailData;
    }

    validateEmailAddress(emailData) {
        if (!validationUtils.validateEmailAddress(emailData.toEmailAddress)) {
            emailData.status = EmailAddressStatus.INVALID;
        }
        return emailData;
    }

    filterEmailAddress(emailData) {
        if (!emailData.status) {
            return emailData;
        }
        const domainPart = textUtils.getEmailAddressParts(emailData.toEmailAddress)[1];
        if (filterEmailAddressDomains.includes(domainPart)) {
            emailData.status = EmailAddressStatus.FILTER;
            return emailData;
        }
        const emailAddressIndex = filterEmailAddresses.findIndex(emailAddressItem =>
            textUtils.toLowerCaseTrim(emailAddressItem) === textUtils.toLowerCaseTrim(emailData.toEmailAddress));
        if (emailAddressIndex > -1) {
            emailData.status = EmailAddressStatus.FILTER;
            return emailData;
        }
        for (let i = 0; i < invalidDomains.length; i++) {
            if (domainPart.indexOf(invalidDomains[i]) > -1) {
                emailData.status = EmailAddressStatus.FILTER;
                return emailData;
            }
        }
        return emailData;
    }

    skipDomains(emailsData) {
        const maximumUniqueDomainCount = countsLimitsService.countsLimitsData.maximumUniqueDomainCount;
        if (!maximumUniqueDomainCount || emailsData.emailsList.length <= maximumUniqueDomainCount) {
            return emailsData;
        }
        const emailsDataGroupsList = [];
        const updatedEmailsDataList = [];
        for (let i = 0; i < emailsData.emailsList.length; i++) {
            const emailData = emailsData.emailsList[i];
            const splitResult = textUtils.getEmailAddressParts(emailData.toEmailAddress);
            if (!splitResult || splitResult.length < 2) {
                continue;
            }
            const domainPart = textUtils.toLowerCaseTrim(splitResult[1]);
            if (!domainPart) {
                continue;
            }
            // Check if the domain is common domain. Not relevant is true.
            if (commonEmailAddressDomainsList.findIndex(domain => domain === domainPart) > -1) {
                updatedEmailsDataList.push(emailData);
                continue;
            }
            const groupIndex = emailsDataGroupsList.findIndex(d => d.domainPart === domainPart);
            // Insert / update the list.
            if (groupIndex > -1) {
                emailsDataGroupsList[groupIndex].emailsList.push(emailData);
            }
            else {
                emailsDataGroupsList.push({
                    domainPart: domainPart,
                    emailsList: [emailData]
                });
            }
        }
        for (let i = 0; i < emailsDataGroupsList.length; i++) {
            const group = emailsDataGroupsList[i];
            let emailsDataGroup = group.emailsList;
            if (emailsDataGroup.length >= maximumUniqueDomainCount) {
                for (let y = 0; y < emailsDataGroup.length; y++) {
                    emailsDataGroup[y].status = EmailAddressStatus.SKIP;
                }
                emailsDataGroupsList[i].emailsList = this.getRandomUniqueKeysFromArray({
                    list: emailsDataGroup,
                    itemsCount: maximumUniqueDomainCount,
                    isSkipLogic: true
                });
            }
            updatedEmailsDataList.push(...emailsDataGroupsList[i].emailsList);
        }
        emailsData.emailsList = updatedEmailsDataList;
        return emailsData;
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
    resetEmail(emailData) {
        const { id, toEmailAddress, type, retriesCount } = emailData;
        emailData = new EmailData({
            id: id,
            toEmailAddress: toEmailAddress,
            type: type
        });
        emailData.retriesCount = retriesCount + 1;
        return emailData;
    }
}

module.exports = new CreateEmailsService();