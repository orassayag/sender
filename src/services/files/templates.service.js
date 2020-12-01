const templates = require('../../../misc/data/templates/templates');
const countsLimitsService = require('./countsLimits.service');
const { CVData, SubjectData, TemplateData, TemplatesData, TextData } = require('../../core/models/application');
const { fileUtils, pathUtils, textUtils, validationUtils } = require('../../utils');

class TemplatesService {

    constructor() {
        this.templateData = null;
        this.templatesData = null;
        this.cvData = null;
        this.lastSubjectId = null;
        this.lastTextId = 0;
    }

    async initiate() {
        // Intiate CV file and the templates data.
        this.initiateTemplates();
        await this.initiateCVFile();
    }

    async initiateCVFile() {
        const fileName = 'CV Billy Ravid.doc';
        const cvFilePath = pathUtils.getJoinPath({
            targetPath: __dirname,
            targetName: `../../../misc/data/cv/${fileName}`
        });
        if (!await fileUtils.isPathExists(cvFilePath)) {
            throw new Error('CV file path not exists (1000029)');
        }
        const extension = pathUtils.getExtension(cvFilePath);
        if (extension !== '.doc') {
            throw new Error(`The CV file need to be a doc file. Found a ${extension} file (1000030)`);
        }
        this.cvData = new CVData({
            fileName: fileName,
            filePath: cvFilePath,
            attachmentBase64: await fileUtils.createBase64Path(cvFilePath),
            type: 'application/doc',
            disposition: 'attachment'
        });
    }

    initiateTemplates() {
        if (templates.length <= 0) {
            throw new Error('No templates found in the templates.json file. (1000031)');
        }
        this.templatesData = new TemplatesData();
        for (let i = 0; i < templates.length; i++) {
            const { subject, text } = templates[i];
            if (subject) {
                this.lastSubjectId++;
                this.templatesData.subjectsList.push(new SubjectData({
                    id: this.lastSubjectId,
                    subject: subject,
                    subjectLine: subject,
                    subjectLineDisplay: this.getDisplayTemplate(subject)
                }));
            }
            if (text) {
                const line = text[0];
                this.lastTextId++;
                this.templatesData.textsList.push(new TextData({
                    id: this.lastTextId,
                    text: text.join('\n'),
                    textLine: line,
                    textLineDisplay: this.getDisplayTemplate(line)
                }));
            }
        }
        if (this.templatesData.subjectsList.length <= 0) {
            throw new Error('No subjects found in the templates.json file. (1000032)');
        }
        if (this.templatesData.textsList.length <= 0) {
            throw new Error('No texts found in the templates.json file. (1000033)');
        }
    }

    getRandomSubject() {
        let randomSubjectId = -1;
        if (!this.templateData?.subjectId) {
            randomSubjectId = textUtils.getRandomNumber(1, this.templatesData.subjectsList.length);
        }
        else {
            for (let i = 0; i < 20; i++) {
                randomSubjectId = textUtils.getRandomNumber(1, this.templatesData.subjectsList.length);
                if (this.templateData.subjectId != randomSubjectId) {
                    break;
                }
            }
        }
        return this.templatesData.subjectsList.find(t => t.id === randomSubjectId);
    }

    getRandomText() {
        let randomTextId = -1;
        if (!this.templateData?.textId) {
            randomTextId = textUtils.getRandomNumber(1, this.templatesData.textsList.length);
        }
        else {
            for (let i = 0; i < 20; i++) {
                randomTextId = textUtils.getRandomNumber(1, this.templatesData.textsList.length);
                if (this.templateData.textId != randomTextId) {
                    break;
                }
            }
        }
        return this.templatesData.textsList.find(t => t.id === randomTextId);
    }

    getTemplate() {
        let subject, text = null;
        if (this.templatesData.subjectsList.length === 1) {
            subject = this.templatesData.subjectsList[0];
        }
        else {
            subject = this.getRandomSubject();
        }
        if (this.templatesData.textsList.length === 1) {
            text = this.templatesData.textsList[0];
        }
        else {
            text = this.getRandomText();
        }
        this.templateData = new TemplateData({
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
        if (displayTemplate.length > countsLimitsService.countsLimitsData.maximumDisplayTemplateCharactersCount) {
            displayTemplate = displayTemplate.substring(0, countsLimitsService.countsLimitsData.maximumDisplayTemplateCharactersCount);
        }
        return displayTemplate;
    }

    checkTemplate() {
        this.getTemplate();
    }
}

module.exports = new TemplatesService();