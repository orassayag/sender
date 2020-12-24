
const settings = require('../../settings/settings');
const { CVData, SubjectData, Template, TemplateData, TextData } = require('../../core/models/application');
const { fileUtils, pathUtils, textUtils, validationUtils } = require('../../utils');
const countLimitService = require('./countLimit.service');
const fileService = require('./file.service');

class TemplateService {

    constructor() {
        this.template = null;
        this.templateData = null;
        this.cvData = null;
        this.lastSubjectId = null;
        this.lastTextId = 0;
    }

    async initiate() {
        // Intiate the templates data and the CV file.
        await this.initiateTemplates();
        await this.initiateCVFile();
    }

    async initiateTemplates() {
        this.templateData = new TemplateData(settings);
        const templates = await fileService.getFileData({
            path: this.templateData.templatesFilePath,
            parameterName: 'templatesFilePath',
            fileExtension: '.json'
        });
        for (let i = 0; i < templates.length; i++) {
            const { subject, text } = templates[i];
            if (subject) {
                this.lastSubjectId++;
                this.templateData.subjectsList.push(new SubjectData({
                    id: this.lastSubjectId,
                    subject: subject,
                    subjectLine: subject,
                    subjectLineDisplay: this.getDisplayTemplate(subject)
                }));
            }
            if (text) {
                const line = text[0];
                this.lastTextId++;
                this.templateData.textsList.push(new TextData({
                    id: this.lastTextId,
                    text: text.join('\n'),
                    textLine: line,
                    textLineDisplay: this.getDisplayTemplate(line)
                }));
            }
        }
        if (this.templateData.subjectsList.length <= 0) {
            throw new Error('No subjects found in the templates.json file. (1000034)');
        }
        if (this.templateData.textsList.length <= 0) {
            throw new Error('No texts found in the templates.json file. (1000035)');
        }
    }

    async initiateCVFile() {
        if (!await fileUtils.isPathExists(this.templateData.cvFilePath)) {
            throw new Error('CV file path not exists (1000036)');
        }
        const extension = pathUtils.getExtension(this.templateData.cvFilePath);
        if (extension !== '.doc') {
            throw new Error(`The CV file need to be a doc file. Found a ${extension} file (1000037)`);
        }
        this.cvData = new CVData({
            fileName: pathUtils.getBasename(this.templateData.cvFilePath),
            filePath: this.templateData.cvFilePath,
            attachmentBase64: await fileUtils.createBase64Path(this.templateData.cvFilePath),
            type: 'application/doc',
            disposition: 'attachment'
        });
    }

    getRandomSubject() {
        let randomSubjectId = -1;
        if (!this.template?.subjectId) {
            randomSubjectId = textUtils.getRandomNumber(1, this.templateData.subjectsList.length);
        }
        else {
            for (let i = 0; i < 20; i++) {
                randomSubjectId = textUtils.getRandomNumber(1, this.templateData.subjectsList.length);
                if (this.template.subjectId != randomSubjectId) {
                    break;
                }
            }
        }
        return this.templateData.subjectsList.find(t => t.id === randomSubjectId);
    }

    getRandomText() {
        let randomTextId = -1;
        if (!this.template?.textId) {
            randomTextId = textUtils.getRandomNumber(1, this.templateData.textsList.length);
        }
        else {
            for (let i = 0; i < 20; i++) {
                randomTextId = textUtils.getRandomNumber(1, this.templateData.textsList.length);
                if (this.template.textId != randomTextId) {
                    break;
                }
            }
        }
        return this.templateData.textsList.find(t => t.id === randomTextId);
    }

    getTemplate() {
        let subject, text = null;
        if (this.templateData.subjectsList.length === 1) {
            subject = this.templateData.subjectsList[0];
        }
        else {
            subject = this.getRandomSubject();
        }
        if (this.templateData.textsList.length === 1) {
            text = this.templateData.textsList[0];
        }
        else {
            text = this.getRandomText();
        }
        this.template = new Template({
            subject: subject,
            text: text
        });
    }

    getDisplayTemplate(text) {
        let displayTemplate = '';
        const englishKeys = [];
        const hebrewKeys = [];
        text.split(' ').map(key => {
            if (textUtils.isEnglishKey(key)) {
                englishKeys.push(key);
            } else {
                hebrewKeys.push(textUtils.reverseText(key));
            }
        });
        displayTemplate = `${validationUtils.isExists(englishKeys) ? `${englishKeys.join(' ')}` : ''} ${hebrewKeys.reverse().join(' ')}`.trim();
        if (displayTemplate.length > countLimitService.countLimitData.maximumDisplayTemplateCharactersCount) {
            displayTemplate = displayTemplate.substring(0, countLimitService.countLimitData.maximumDisplayTemplateCharactersCount);
        }
        return displayTemplate;
    }

    checkTemplate() {
        this.getTemplate();
    }
}

module.exports = new TemplateService();