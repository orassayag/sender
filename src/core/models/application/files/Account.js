

class Account {

    constructor(data) {
        const { id, username, password, asterixsPassword, apiKey } = data;
        this.id = id;
        this.username = username;
        this.password = password;
        this.asterixsPassword = asterixsPassword;
        this.apiKey = apiKey;
        this.sentCount = 0;
    }
}

module.exports = Account;