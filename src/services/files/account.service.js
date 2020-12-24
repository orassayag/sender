const settings = require('../../settings/settings');
const { Account, AccountData } = require('../../core/models/application');
const { textUtils, validationUtils } = require('../../utils');
const countLimitService = require('./countLimit.service');
const fileService = require('./file.service');

class AccountService {

    constructor() {
        this.account = null;
        this.accountData = null;
        this.lastAccountId = 0;
        this.isAccountsLeft = true;
    }

    async initiate() {
        this.accountData = new AccountData(settings);
        const accounts = await fileService.getFileData({
            path: this.accountData.accountsFilePath,
            parameterName: 'accountsFilePath',
            fileExtension: '.json'
        });
        for (let i = 0; i < accounts.length; i++) {
            const { username, password, apiKey } = accounts[i];
            const validationResult = this.validateAccount({
                username: username,
                password: password,
                apiKey: apiKey,
                i: i
            });
            if (this.accountData.accountsList.findIndex(a => a.emailAddress === validationResult.username) > -1) {
                throw new Error(`Duplicate accounts detected with the username: ${validationResult.username} (1000005)`);
            }
            this.lastAccountId++;
            this.accountData.accountsList.push(new Account({
                id: this.lastAccountId,
                username: validationResult.username,
                password: validationResult.password,
                asterixsPassword: textUtils.getAsteriskCharactersString(validationResult.password.length),
                apiKey: validationResult.apiKey
            }));
            this.accountData.availableSendsCount += countLimitService.countLimitData.maximumSendGridDailyEmailsCount;
        }
        this.checkAccount(false);
    }

    validateAccount(data) {
        let { username, password, apiKey, i } = data;
        if (!username) {
            throw new Error(`Missing username of account index: ${i} (1000006)`);
        }
        if (!validationUtils.validateEmailAddress(textUtils.toLowerCase(username))) {
            throw new Error(`Invalid username of account index: ${i} (1000007)`);
        }
        if (!password) {
            throw new Error(`Missing password of account index: ${i} (1000008)`);
        }
        if (!apiKey) {
            throw new Error(`Missing api key of account index: ${i} (1000009)`);
        }
        if (!validationUtils.isValidSendGridApiKey(apiKey)) {
            throw new Error(`Invalid api key of account index: ${i} (1000010)`);
        }
        username = username.trim();
        password = password.trim();
        apiKey = apiKey.trim();
        return {
            username: username,
            password: password,
            apiKey: apiKey
        };
    }

    getAccount() {
        const account = this.accountData.accountsList.find(a => a.sentCount < countLimitService.countLimitData.maximumSendGridDailyEmailsCount);
        this.isAccountsLeft = account !== null && account !== undefined;
        if (account) {
            this.account = account;
            this.accountData.currentAccountIndex++;
        }
    }

    checkAccount(isIncrement) {
        if (!this.account) {
            this.getAccount();
            return;
        }
        if (!isIncrement) {
            return;
        }
        this.account.sentCount++;
        this.accountData.availableSendsCount--;
        if (this.accountData.availableSendsCount < 0) {
            this.accountData.availableSendsCount = 0;
        }
        // Update exists account data in the accountData list.
        const accountIndex = this.accountData.accountsList.findIndex(a => a.id === this.account.id);
        if (accountIndex <= -1) {
            throw new Error(`Account id ${this.account.id} not exists in the accountsList (1000011)`);
        }
        this.accountData.accountsList[accountIndex] = this.account;
        // Check if need to switch account due to the limit exceeded of send count per day.
        if (this.account.sentCount >= countLimitService.countLimitData.maximumSendGridDailyEmailsCount) {
            this.getAccount();
        }
        return this.isAccountsLeft;
    }

    // Force to switch account.
    switchAccount() {
        this.accountData.availableSendsCount -= countLimitService.countLimitData.maximumSendGridDailyEmailsCount;
        if (this.accountData.availableSendsCount < 0) {
            this.accountData.availableSendsCount = 0;
        }
        this.account.sentCount = countLimitService.countLimitData.maximumSendGridDailyEmailsCount;
        this.getAccount();
        return this.isAccountsLeft;
    }
}

module.exports = new AccountService();