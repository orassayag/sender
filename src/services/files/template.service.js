import settings from '../../settings/settings';
import { CVDataModel, TemplateModel, TemplateDataModel, TextDataModel, SubjectDataModel } from '../../core/models/application';
import countLimitService from './countLimit.service';
import fileService from './file.service';
import { fileUtils, pathUtils, textUtils, validationUtils } from '../../utils';

class TemplateService {

    constructor() {
        this.templateModel = null;
        this.templateDataModel = null;
        this.cvDataModel = null;
        this.lastSubjectId = null;
        this.lastTextId = 0;
    }

    async initiate() {
        // Initiate the templates data and the CV file.
        await this.initiateTemplates();
        await this.initiateCVFile();
    }

    async initiateTemplates() {
        this.templateDataModel = new TemplateDataModel(settings);
        const templates = await fileService.getJSONFileData({
            path: this.templateDataModel.templatesFilePath,
            parameterName: 'templatesFilePath',
            fileExtension: '.json'
        });
        for (let i = 0; i < templates.length; i++) {
            const { subject, text } = templates[i];
            if (subject) {
                this.lastSubjectId++;
                this.templateDataModel.subjectsList.push(new SubjectDataModel({
                    id: this.lastSubjectId,
                    subject: subject,
                    subjectLine: subject,
                    subjectLineDisplay: this.getDisplayTemplate(subject)
                }));
            }
            if (text) {
                const line = text[0];
                this.lastTextId++;
                this.templateDataModel.textsList.push(new TextDataModel({
                    id: this.lastTextId,
                    text: text.join('\n'),
                    textLine: line,
                    textLineDisplay: this.getDisplayTemplate(line)
                }));
            }
        }
        if (!validationUtils.isExists(this.templateDataModel.subjectsList)) {
            throw new Error('No subjects found in the templates.json file (1000035)');
        }
        if (!validationUtils.isExists(this.templateDataModel.textsList)) {
            throw new Error('No texts found in the templates.json file (1000036)');
        }
    }

    async initiateCVFile() {
        if (!await fileUtils.isPathExists(this.templateDataModel.cvFilePath)) {
            throw new Error('CV file path not exists (1000037)');
        }
        const extension = pathUtils.getExtension(this.templateDataModel.cvFilePath);
        if (extension !== '.doc') {
            throw new Error(`The CV file needs to be a doc file. Found a ${extension} file (1000038)`);
        }
        this.cvDataModel = new CVDataModel({
            fileName: pathUtils.getBasename(this.templateDataModel.cvFilePath),
            filePath: this.templateDataModel.cvFilePath,
            attachmentBase64: await fileUtils.createBase64Path(this.templateDataModel.cvFilePath),
            type: 'application/doc',
            disposition: 'attachment'
        });
    }

    getRandomSubject() {
        let randomSubjectId = -1;
        if (!this.templateModel?.subjectId) {
            randomSubjectId = textUtils.getRandomNumber(1, this.templateDataModel.subjectsList.length);
        }
        else {
            for (let i = 0; i < 20; i++) {
                randomSubjectId = textUtils.getRandomNumber(1, this.templateDataModel.subjectsList.length);
                if (this.templateModel.subjectId != randomSubjectId) {
                    break;
                }
            }
        }
        return this.templateDataModel.subjectsList.find(t => t.id === randomSubjectId);
    }

    getRandomText() {
        let randomTextId = -1;
        if (!this.templateModel?.textId) {
            randomTextId = textUtils.getRandomNumber(1, this.templateDataModel.textsList.length);
        }
        else {
            for (let i = 0; i < 20; i++) {
                randomTextId = textUtils.getRandomNumber(1, this.templateDataModel.textsList.length);
                if (this.templateModel.textId != randomTextId) {
                    break;
                }
            }
        }
        return this.templateDataModel.textsList.find(t => t.id === randomTextId);
    }

    getTemplate() {
        let subject, text = null;
        if (this.templateDataModel.subjectsList.length === 1) {
            subject = this.templateDataModel.subjectsList[0];
        }
        else {
            subject = this.getRandomSubject();
        }
        if (this.templateDataModel.textsList.length === 1) {
            text = this.templateDataModel.textsList[0];
        }
        else {
            text = this.getRandomText();
        }
        this.templateModel = new TemplateModel({
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
        if (displayTemplate.length > countLimitService.countLimitDataModel.maximumDisplayTemplateCharactersCount) {
            displayTemplate = displayTemplate.substring(0, countLimitService.countLimitDataModel.maximumDisplayTemplateCharactersCount);
        }
        return displayTemplate;
    }

    checkTemplate() {
        this.getTemplate();
    }
}

export default new TemplateService();