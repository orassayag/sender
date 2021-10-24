class SendGridCodeModel {

    constructor(data) {
        const { code, reason, description, isSent } = data;
        this.code = code;
        this.reason = reason;
        this.description = description;
        this.isSent = isSent;
    }
}

export default SendGridCodeModel;