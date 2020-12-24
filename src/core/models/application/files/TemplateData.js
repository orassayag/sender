class TemplateData {

    constructor(settings) {
        const { EMAIL_SENDER_NAME, TEMPLATES_FILE_PATH, CV_FILE_PATH } = settings;
        this.emailSenderName = EMAIL_SENDER_NAME;
        this.templatesFilePath = TEMPLATES_FILE_PATH;
        this.cvFilePath = CV_FILE_PATH;
        this.subjectsList = [];
        this.textsList = [];
    }
}

module.exports = TemplateData;