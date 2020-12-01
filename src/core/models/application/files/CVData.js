class CVData {

    constructor(data) {
        const { fileName, filePath, attachmentBase64, type, disposition } = data;
        this.fileName = fileName;
        this.filePath = filePath;
        this.attachmentBase64 = attachmentBase64;
        this.type = type;
        this.disposition = disposition;
    }
}

module.exports = CVData;