import { EmailModel, EmailDataModel, SourceDataModel } from '../../core/models/application';
import { EmailAddressesSourceTypeEnum, EmailAddressStatusEnum, EmailAddressTypeEnum, MethodEnum } from '../../core/enums';
import {
    commonEmailAddressDomainsList, filterEmailAddresses, filterEmailAddressDomains,
    invalidDomains
} from '../../configurations';
import applicationService from './application.service';
import countLimitService from './countLimit.service';
import mongoDatabaseService from './mongoDatabase.service';
import sendEmailService from './sendEmail.service';
import { fileUtils, pathUtils, textUtils, timeUtils, validationUtils } from '../../utils';

const emailAddressesFromArray = ['test@gmail.com'];

class CreateEmailService {

    constructor() {
        this.sourceDataModel = null;
        this.lastEmailId = 0;
    }

    async basicInitiate(settings, isEmailAddressesOnly) {
        this.sourceDataModel = new SourceDataModel(settings);
        // Get the email addresses from the specific source,
        // and create the Email instances inside the EmailDataModel instance.
        // If isEmailAddressesOnly=true, will get only the email addresses
        // without any additional data.
        return await this.getEmailAddresses(isEmailAddressesOnly);
    }

    async initiate(settings) {
        let emailDataModel = await this.basicInitiate(settings, false);
        emailDataModel = await this.finalizeEmailData(emailDataModel);
        // Update counts.
        sendEmailService.sendEmailDataModel.updateCount(true, EmailAddressStatusEnum.PENDING, emailDataModel.emailsList.length);
        sendEmailService.sendEmailDataModel.updateCount(true, EmailAddressStatusEnum.TOTAL_PENDING, emailDataModel.emailsList.length);
        sendEmailService.sendEmailDataModel.updateCount(true, EmailAddressStatusEnum.DATABASE, await mongoDatabaseService.getEmailAddressesCount());
        return emailDataModel;
    }

    async finalizeEmailData(emailDataModel) {
        // Check for skip domains.
        if (applicationService.applicationDataModel.isSkipLogic) {
            emailDataModel = this.skipDomains(emailDataModel);
        }
        // Add monitor emails if needed.
        if (applicationService.applicationDataModel.isMonitorLogic) {
            emailDataModel = await this.addMonitorEmails(emailDataModel);
        }
        return emailDataModel;
    }

    async getEmailAddressesOnly(settings) {
        return await this.basicInitiate(settings, true);
    }

    async getEmailAddresses(isEmailAddressesOnly) {
        // Get the emails data from the relevant source.
        let emailDataModel = null;
        switch (this.sourceDataModel.emailAddressesSourceType) {
            case EmailAddressesSourceTypeEnum.DIRECTORY: {
                const { path, parameterName } = this.getPath();
                emailDataModel = await this.getEmailAddressesDirectory({
                    path: path,
                    parameterName: parameterName,
                    emailDataModel: emailDataModel,
                    isEmailAddressesOnly: isEmailAddressesOnly
                });
                break;
            }
            case EmailAddressesSourceTypeEnum.FILE: {
                const { path, parameterName } = this.getPath();
                emailDataModel = await this.getEmailAddressesFile({
                    path: path,
                    parameterName: parameterName,
                    emailDataModel: emailDataModel,
                    isEmailAddressesOnly: isEmailAddressesOnly
                });
                break;
            }
            case EmailAddressesSourceTypeEnum.ARRAY: {
                emailDataModel = this.getEmailAddressesArray({
                    emailDataModel: emailDataModel,
                    isEmailAddressesOnly: isEmailAddressesOnly
                });
                break;
            }
        }
        return emailDataModel;
    }

    async addMonitorEmails(emailDataModel) {
        emailDataModel = await this.getEmailAddressesFile({
            path: this.sourceDataModel.monitorFilePath,
            parameterName: pathUtils.getBasename(this.sourceDataModel.monitorFilePath),
            emailDataModel: emailDataModel
        });
        return emailDataModel;
    }

    getPath() {
        let path = null;
        let parameterName = null;
        if (applicationService.applicationDataModel.isProductionMode) {
            path = this.sourceDataModel.emailAddressesProductionSourcePath;
            parameterName = 'EMAIL_ADDRESSES_PRODUCTION_SOURCE_PATH';
        }
        else {
            path = this.sourceDataModel.emailAddressesDevelopmentSourcePath;
            parameterName = 'EMAIL_ADDRESSES_DEVELOPMENT_SOURCE_PATH';
        }
        return {
            path: path,
            parameterName: parameterName
        };
    }

    async fetchEmailAddresses(path) {
        const fileSize = fileUtils.getFileSize(path);
        if (fileSize > countLimitService.countLimitDataModel.maximumFileSizeMegabytes) {
            switch (this.sourceDataModel.emailAddressesSourceType) {
                case EmailAddressesSourceTypeEnum.DIRECTORY: {
                    return [];
                }
                case EmailAddressesSourceTypeEnum.FILE: {
                    throw new Error(`File exceeded the maximum size of ${countLimitService.countLimitDataModel.maximumFileSizeMegabytes}MB: ${fileSize}MB (1000011)`);
                }
            }
        }
        const content = await fileUtils.readFile(path);
        return textUtils.getEmailAddresses(content);
    }

    async getEmailAddressesDirectory(data) {
        const { path, parameterName, emailDataModel, isEmailAddressesOnly } = data;
        if (!await fileUtils.isPathExists(path)) {
            throw new Error(`Path not exists: ${path} (1000012)`);
        }
        if (fileUtils.isFilePath(path)) {
            throw new Error(`The parameter path ${parameterName} marked as directory but it's a path of a file: ${path} (1000013)`);
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
            throw new Error(`No TXT files exists in ${path} (1000014)`);
        }
        // Filter relevant files and scan them.
        let emailAddressesList = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = pathUtils.getBasename(file);
            // Scan only files that start with a specific file name.
            if (fileName.indexOf(this.sourceDataModel.emailAddressesIncludeFileName) === 0) {
                // Fetch the email addresses.
                const tempEmailAddressesList = await this.fetchEmailAddresses(file);
                emailAddressesList = [...emailAddressesList, ...tempEmailAddressesList];
            }
        }
        return isEmailAddressesOnly ? emailAddressesList : this.createEmailData({
            emailAddressesList: emailAddressesList,
            emailDataModel: emailDataModel
        });
    }

    async getEmailAddressesFile(data) {
        const { path, parameterName, emailDataModel, isEmailAddressesOnly } = data;
        if (!await fileUtils.isPathExists(path)) {
            throw new Error(`Path not exists: ${path} (1000015)`);
        }
        if (fileUtils.isDirectoryPath(path)) {
            throw new Error(`The parameter path ${parameterName} marked as file but it's a path of a directory: ${path} (1000016)`);
        }
        // Fetch the email addresses.
        const emailAddressesList = await this.fetchEmailAddresses(path);
        return isEmailAddressesOnly ? emailAddressesList : this.createEmailData({
            emailAddressesList: emailAddressesList,
            emailDataModel: emailDataModel
        });
    }

    getEmailAddressesArray(data) {
        const { emailDataModel, isEmailAddressesOnly } = data;
        return isEmailAddressesOnly ? emailAddressesFromArray : this.createEmailData({
            emailAddressesList: emailAddressesFromArray,
            emailDataModel: emailDataModel
        });
    }

    validateEmailAddressesCount(emailAddressesList) {
        if (!validationUtils.isExists(emailAddressesList)) {
            throw new Error('No email addresses found in the source (1000017)');
        }
    }

    // Validate if exceeded from the configured number,
    // take random email addresses from the list.
    validateRandomExceeded(emailAddressesList) {
        if (emailAddressesList.length <= countLimitService.countLimitDataModel.maximumSendEmails) {
            if (!sendEmailService.sendEmailDataModel.totalCount) {
                sendEmailService.sendEmailDataModel.updateCount(true, EmailAddressStatusEnum.TOTAL, emailAddressesList.length);
                applicationService.applicationDataModel.method = MethodEnum.STANDARD;
            }
            return emailAddressesList;
        }
        const total = emailAddressesList.length;
        emailAddressesList = this.getRandomUniqueKeysFromArray({
            list: emailAddressesList,
            itemsCount: countLimitService.countLimitDataModel.maximumSendEmails,
            isSkipLogic: false
        });
        const pending = emailAddressesList.length;
        if (!sendEmailService.sendEmailDataModel.totalCount) {
            sendEmailService.sendEmailDataModel.updateCount(true, EmailAddressStatusEnum.TOTAL, total);
            applicationService.applicationDataModel.method = total !== pending ? MethodEnum.RANDOM_EXCEEDED : MethodEnum.STANDARD;
        }
        return emailAddressesList;
    }

    createEmailData(data) {
        let { emailAddressesList, emailDataModel } = data;
        // Validate the existence of at least 1 email address.
        this.validateEmailAddressesCount(emailAddressesList);
        let isMonitorList = false;
        if (emailDataModel) {
            isMonitorList = true;
        }
        else {
            emailDataModel = new EmailDataModel();
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
            let emailModel = new EmailModel({
                id: this.lastEmailId,
                toEmailAddress: emailAddress.trim(),
                type: isMonitorList ? EmailAddressTypeEnum.MONITOR : EmailAddressTypeEnum.STANDARD,
                createDateTime: timeUtils.getCurrentDate()
            });
            // Validate the email.
            emailModel = this.basicValidateEmail(emailModel);
            // Validate if duplicate.
            emailModel = this.duplicateValidateEmail({
                emailModel: emailModel,
                lowerEmailAddress: lowerEmailAddress,
                existsEmailAddressesList: existsEmailAddressesList
            });
            if (isMonitorList) {
                if (monitorEmailsCount >= countLimitService.countLimitDataModel.monitorEmailsSendCount) {
                    break;
                }
                // Pick a remaining element.
                const randomIndex = textUtils.getRandomNumber(0, emailDataModel.emailsList.length);
                // And swap it with the current element.
                const temporaryValue = emailDataModel.emailsList[randomIndex];
                emailDataModel.emailsList[randomIndex] = emailModel;
                emailDataModel.emailsList.push(temporaryValue);
                monitorEmailsCount++;
            }
            else {
                emailDataModel.emailsList.push(emailModel);
            }
            existsEmailAddressesList.push(lowerEmailAddress);
        }
        return emailDataModel;
    }

    basicValidateEmail(emailModel) {
        // Validate the email address.
        emailModel = this.validateEmailAddress(emailModel);
        // Filter the email address.
        emailModel = this.filterEmailAddress(emailModel);
        return emailModel;
    }

    duplicateValidateEmail(data) {
        const { emailModel, lowerEmailAddress, existsEmailAddressesList } = data;
        if (!emailModel.status) {
            return emailModel;
        }
        if (existsEmailAddressesList.indexOf(lowerEmailAddress) > -1) {
            emailModel.status = EmailAddressStatusEnum.DUPLICATE;
        }
        return emailModel;
    }

    validateEmailAddress(emailModel) {
        if (!validationUtils.isValidEmailAddress(emailModel.toEmailAddress)) {
            emailModel.status = EmailAddressStatusEnum.INVALID;
        }
        return emailModel;
    }

    filterEmailAddress(emailModel) {
        if (!emailModel.status) {
            return emailModel;
        }
        const domainPart = textUtils.getEmailAddressParts(emailModel.toEmailAddress)[1];
        if (filterEmailAddressDomains.includes(domainPart)) {
            emailModel.status = EmailAddressStatusEnum.FILTER;
            return emailModel;
        }
        const emailAddressIndex = filterEmailAddresses.findIndex(emailAddressItem =>
            textUtils.toLowerCaseTrim(emailAddressItem) === textUtils.toLowerCaseTrim(emailModel.toEmailAddress));
        if (emailAddressIndex > -1) {
            emailModel.status = EmailAddressStatusEnum.FILTER;
            return emailModel;
        }
        for (let i = 0; i < invalidDomains.length; i++) {
            if (domainPart.indexOf(invalidDomains[i]) > -1) {
                emailModel.status = EmailAddressStatusEnum.FILTER;
                return emailModel;
            }
        }
        return emailModel;
    }

    skipDomains(emailDataModel) {
        const maximumUniqueDomainCount = countLimitService.countLimitDataModel.maximumUniqueDomainCount;
        if (!maximumUniqueDomainCount || emailDataModel.emailsList.length <= maximumUniqueDomainCount) {
            return emailDataModel;
        }
        const emailDataGroupsList = [];
        const updatedEmailDataList = [];
        for (let i = 0; i < emailDataModel.emailsList.length; i++) {
            const emailModel = emailDataModel.emailsList[i];
            const splitResult = textUtils.getEmailAddressParts(emailModel.toEmailAddress);
            if (!splitResult || splitResult.length < 2) {
                continue;
            }
            const domainPart = textUtils.toLowerCaseTrim(splitResult[1]);
            if (!domainPart) {
                continue;
            }
            // Check if the domain is a common domain. Not relevant is true.
            if (commonEmailAddressDomainsList.findIndex(domain => domain === domainPart) > -1) {
                updatedEmailDataList.push(emailModel);
                continue;
            }
            const groupIndex = emailDataGroupsList.findIndex(d => d.domainPart === domainPart);
            // Insert / update the list.
            if (groupIndex > -1) {
                emailDataGroupsList[groupIndex].emailsList.push(emailModel);
            }
            else {
                emailDataGroupsList.push({
                    domainPart: domainPart,
                    emailsList: [emailModel]
                });
            }
        }
        for (let i = 0; i < emailDataGroupsList.length; i++) {
            const group = emailDataGroupsList[i];
            const emailDataGroup = group.emailsList;
            if (emailDataGroup.length >= maximumUniqueDomainCount) {
                for (let y = 0; y < emailDataGroup.length; y++) {
                    emailDataGroup[y].status = EmailAddressStatusEnum.SKIP;
                }
                emailDataGroupsList[i].emailsList = this.getRandomUniqueKeysFromArray({
                    list: emailDataGroup,
                    itemsCount: maximumUniqueDomainCount,
                    isSkipLogic: true
                });
            }
            updatedEmailDataList.push(...emailDataGroupsList[i].emailsList);
        }
        emailDataModel.emailsList = updatedEmailDataList;
        return emailDataModel;
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
                    list[selectedIndex].status = EmailAddressStatusEnum.PENDING;
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
    resetEmail(emailModel) {
        const { id, toEmailAddress, type, retriesCount } = emailModel;
        emailModel = new EmailModel({
            id: id,
            toEmailAddress: toEmailAddress,
            type: type,
            createDateTime: timeUtils.getCurrentDate()
        });
        emailModel.retriesCount = retriesCount + 1;
        return emailModel;
    }
}

export default new CreateEmailService();