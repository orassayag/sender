class AccountDataModel {

    constructor(settings) {
        // Set the parameters from the settings file.
        const { ACCOUNTS_FILE_PATH, IS_RANDOM_ACCOUNTS } = settings;
        this.accountsFilePath = ACCOUNTS_FILE_PATH;
        this.accountsList = [];
        this.availableSendsCount = 0;
        this.currentAccountIndex = 0;
        this.isRandomAccounts = IS_RANDOM_ACCOUNTS;
    }
}

module.exports = AccountDataModel;