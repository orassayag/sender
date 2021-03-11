class Account {

    constructor(data) {
        const { id, username, password, asterixPassword, apiKey } = data;
        this.id = id;
        this.username = username;
        this.password = password;
        this.asterixPassword = asterixPassword;
        this.apiKey = apiKey;
        this.sentCount = 0;
    }
}

module.exports = Account;