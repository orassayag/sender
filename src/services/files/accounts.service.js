const settings = require('../../settings/settings');
const { AccountData, AccountsData } = require('../../core/models/application');
const { textUtils, validationUtils } = require('../../utils');
const countsLimitsService = require('./countsLimits.service');
const filesService = require('./files.service');

class AccountsService {

    constructor() {
        this.accountData = null;
        this.accountsData = null;
        this.lastAccountDataId = 0;
        this.isAccountsLeft = true;
    }

    async initiate() {
        this.accountsData = new AccountsData(settings);
        const accounts = await filesService.getFileData({
            path: this.accountsData.accountsFilePath,
            parameterName: 'accountsFilePath',
            fileExtension: '.json'
        });
        for (let i = 0; i < accounts.length; i++) {
            const { username, apiKey } = accounts[i];
            this.validateAccount({
                username: username,
                apiKey: apiKey,
                i: i
            });
            if (this.accountsData.accountsList.findIndex(a => a.emailAddress === username) > -1) {
                throw new Error(`Duplicate accounts detected with the username: ${username} (1000006)`);
            }
            this.lastAccountDataId++;
            this.accountsData.accountsList.push(new AccountData({
                id: this.lastAccountDataId,
                username: username,
                apiKey: apiKey
            }));
            this.accountsData.availableSendsCount += countsLimitsService.countsLimitsData.maximumSendGridDailyEmailsCount;
        }
        this.checkAccount(false);
    }

    validateAccount(data) {
        const { username, apiKey, i } = data;
        if (!username) {
            throw new Error(`Missing username of account index: ${i} (1000007)`);
        }
        if (!validationUtils.validateEmailAddress(textUtils.toLowerCase(username))) {
            throw new Error(`Invalid username of account index: ${i} (1000008)`);
        }
        if (!apiKey) {
            throw new Error(`Missing api key of account index: ${i} (1000009)`);
        }
        if (!validationUtils.isValidSendGridApiKey(apiKey)) {
            throw new Error(`Invalid api key of account index: ${i} (1000010)`);
        }
    }

    getAccount() {
        const accountData = this.accountsData.accountsList.find(a => a.sentCount < countsLimitsService.countsLimitsData.maximumSendGridDailyEmailsCount);
        this.isAccountsLeft = accountData !== null && accountData !== undefined;
        if (accountData) {
            this.accountData = accountData;
            this.accountsData.currentAccountIndex++;
        }
    }

    checkAccount(isIncrement) {
        if (!this.accountData) {
            this.getAccount();
            return;
        }
        if (!isIncrement) {
            return;
        }
        this.accountData.sentCount++;
        this.accountsData.availableSendsCount--;
        if (this.accountsData.availableSendsCount < 0) {
            this.accountsData.availableSendsCount = 0;
        }
        // Update exists account data in the accountsData list.
        const accountDataIndex = this.accountsData.accountsList.findIndex(a => a.id === this.accountData.id);
        if (accountDataIndex <= -1) {
            throw new Error(`Account id ${this.accountData.id} not exists in the accountsList (1000011)`);
        }
        this.accountsData.accountsList[accountDataIndex] = this.accountData;
        // Check if need to switch account due to the limit exceeded of send count per day.
        if (this.accountData.sentCount >= countsLimitsService.countsLimitsData.maximumSendGridDailyEmailsCount) {
            this.getAccount();
        }
        return this.isAccountsLeft;
    }

    // Force to switch account.
    switchAccount() {
        this.accountsData.availableSendsCount -= countsLimitsService.countsLimitsData.maximumSendGridDailyEmailsCount;
        if (this.accountsData.availableSendsCount < 0) {
            this.accountsData.availableSendsCount = 0;
        }
        this.accountData.sentCount = countsLimitsService.countsLimitsData.maximumSendGridDailyEmailsCount;
        this.getAccount();
        return this.isAccountsLeft;
    }
}

module.exports = new AccountsService();