class AccountData {

    constructor(settings) {
        const { ACCOUNTS_FILE_PATH } = settings;
        this.accountsFilePath = ACCOUNTS_FILE_PATH;
        this.accountsList = [];
        this.availableSendsCount = 0;
        this.currentAccountIndex = 0;
    }
}

module.exports = AccountData;