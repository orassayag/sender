class AccountData {

    constructor(settings) {
        // Set the parameters from the settings file.
        const { ACCOUNTS_FILE_PATH } = settings;
        this.accountsFilePath = ACCOUNTS_FILE_PATH;
        this.accountsList = [];
        this.availableSendsCount = 0;
        this.currentAccountIndex = 0;
    }
}

module.exports = AccountData;