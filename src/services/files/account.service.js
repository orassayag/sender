const settings = require('../../settings/settings');
const { Account, AccountData } = require('../../core/models/application');
const countLimitService = require('./countLimit.service');
const fileService = require('./file.service');
const { textUtils, validationUtils } = require('../../utils');

class AccountService {

    constructor() {
        this.account = null;
        this.accountData = null;
        this.lastAccountId = 0;
        this.isAccountsLeft = true;
    }

    async initiate() {
        this.accountData = new AccountData(settings);
        const accounts = await fileService.getJSONFileData({
            path: this.accountData.accountsFilePath,
            parameterName: 'accountsFilePath',
            fileExtension: '.json'
        });
        if (!validationUtils.isExists(accounts)) {
            throw new Error('No accounts detected with the JSON file (1000053)');
        }
        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            if (!validationUtils.isPropertyExists(account, 'username') ||
                !validationUtils.isPropertyExists(account, 'password') ||
                !validationUtils.isPropertyExists(account, 'apiKey')) {
                continue;
            }
            const { username, password, apiKey } = account;
            const validationResult = this.validateAccount({
                username: username,
                password: password,
                apiKey: apiKey,
                i: i
            });
            if (this.accountData.accountsList.findIndex(a => a.emailAddress === validationResult.username) > -1) {
                throw new Error(`Duplicate accounts detected with the username: ${validationResult.username} (1000004)`);
            }
            this.lastAccountId++;
            this.accountData.accountsList.push(new Account({
                id: this.lastAccountId,
                username: validationResult.username,
                password: validationResult.password,
                asterixPassword: textUtils.getAsteriskCharactersString(validationResult.password.length),
                apiKey: validationResult.apiKey
            }));
            this.accountData.availableSendsCount += countLimitService.countLimitData.maximumSendGridDailyEmailsCount;
        }
        if (this.accountData.isRandomAccounts) {
            this.accountData.accountsList = textUtils.shuffleArray(this.accountData.accountsList);
        }
        this.checkAccount(false);
    }

    validateAccount(data) {
        let { username, password, apiKey, i } = data;
        if (!username) {
            throw new Error(`Missing username of account index: ${i} (1000005)`);
        }
        if (!validationUtils.isValidEmailAddress(textUtils.toLowerCase(username))) {
            throw new Error(`Invalid username of account index: ${i} (1000006)`);
        }
        if (!password) {
            throw new Error(`Missing password of account index: ${i} (1000007)`);
        }
        if (!apiKey) {
            throw new Error(`Missing api key of account index: ${i} (1000008)`);
        }
        if (!validationUtils.isValidSendGridApiKey(apiKey)) {
            throw new Error(`Invalid api key of account index: ${i} (1000009)`);
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
        // Update existing account data in the accountData list.
        const accountIndex = this.accountData.accountsList.findIndex(a => a.id === this.account.id);
        if (accountIndex <= -1) {
            throw new Error(`Account id ${this.account.id} not exists in the accountsList (1000010)`);
        }
        this.accountData.accountsList[accountIndex] = this.account;
        // Check if need to switch accounts due to the limit exceeded of send count per day.
        if (this.account.sentCount >= countLimitService.countLimitData.maximumSendGridDailyEmailsCount) {
            this.getAccount();
        }
        return this.isAccountsLeft;
    }

    // Force to switch accounts.
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