import settings from '../../settings/settings.js';
import {
  AccountModel,
  AccountDataModel,
} from '../../core/models/application/index.js';
import countLimitService from './countLimit.service.js';
import fileService from './file.service.js';
import { textUtils, validationUtils } from '../../utils/index.js';

class AccountService {
  constructor() {
    this.account = null;
    this.accountDataModel = null;
    this.lastAccountId = 0;
    this.isAccountsLeft = true;
  }

  async initiate() {
    this.accountDataModel = new AccountDataModel(settings);
    const accounts = await fileService.getJSONFileData({
      path: this.accountDataModel.accountsFilePath,
      parameterName: 'accountsFilePath',
      fileExtension: '.json',
    });
    if (!validationUtils.isExists(accounts)) {
      throw new Error('No accounts detected with the JSON file (1000053)');
    }
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      if (
        !validationUtils.isPropertyExists(account, 'username') ||
        !validationUtils.isPropertyExists(account, 'password') ||
        !validationUtils.isPropertyExists(account, 'apiKey')
      ) {
        continue;
      }
      const { username, password, apiKey } = account;
      const validationResult = this.validateAccount({
        username: username,
        password: password,
        apiKey: apiKey,
        i: i,
      });
      if (
        this.accountDataModel.accountsList.findIndex(
          (a) => a.emailAddress === validationResult.username
        ) > -1
      ) {
        throw new Error(
          `Duplicate accounts detected with the username: ${validationResult.username} (1000004)`
        );
      }
      this.lastAccountId++;
      this.accountDataModel.accountsList.push(
        new AccountModel({
          id: this.lastAccountId,
          username: validationResult.username,
          password: validationResult.password,
          asterixPassword: textUtils.getAsteriskCharactersString(
            validationResult.password.length
          ),
          apiKey: validationResult.apiKey,
        })
      );
      this.accountDataModel.availableSendsCount +=
        countLimitService.countLimitDataModel.maximumSendGridDailyEmailsCount;
    }
    if (this.accountDataModel.isRandomAccounts) {
      this.accountDataModel.accountsList = textUtils.shuffleArray(
        this.accountDataModel.accountsList
      );
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
      apiKey: apiKey,
    };
  }

  getAccount() {
    const account = this.accountDataModel.accountsList.find(
      (a) =>
        a.sentCount <
        countLimitService.countLimitDataModel.maximumSendGridDailyEmailsCount
    );
    this.isAccountsLeft = account !== null && account !== undefined;
    if (account) {
      this.account = account;
      this.accountDataModel.currentAccountIndex++;
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
    this.accountDataModel.availableSendsCount--;
    if (this.accountDataModel.availableSendsCount < 0) {
      this.accountDataModel.availableSendsCount = 0;
    }
    // Update existing account data in the accountData list.
    const accountIndex = this.accountDataModel.accountsList.findIndex(
      (a) => a.id === this.account.id
    );
    if (accountIndex <= -1) {
      throw new Error(
        `Account id ${this.account.id} not exists in the accountsList (1000010)`
      );
    }
    this.accountDataModel.accountsList[accountIndex] = this.account;
    // Check if need to switch accounts due to the limit exceeded of send count per day.
    if (
      this.account.sentCount >=
      countLimitService.countLimitDataModel.maximumSendGridDailyEmailsCount
    ) {
      this.getAccount();
    }
    return this.isAccountsLeft;
  }

  // Force to switch accounts.
  switchAccount() {
    this.accountDataModel.availableSendsCount -=
      countLimitService.countLimitDataModel.maximumSendGridDailyEmailsCount;
    if (this.accountDataModel.availableSendsCount < 0) {
      this.accountDataModel.availableSendsCount = 0;
    }
    this.account.sentCount =
      countLimitService.countLimitDataModel.maximumSendGridDailyEmailsCount;
    this.getAccount();
    return this.isAccountsLeft;
  }
}

export default new AccountService();
