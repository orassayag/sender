class AccountData {

    constructor(data) {
        const { id, username, apiKey } = data;
        this.id = id;
        this.username = username;
        this.apiKey = apiKey;
        this.sentCount = 0;
    }
}

module.exports = AccountData;