class TemplateData {

    constructor(data) {
        const { subject, text } = data;
        this.subjectId = subject.id,
            this.subject = subject.subject;
        this.subjectLine = subject.subjectLine;
        this.subjectLineDisplay = subject.subjectLineDisplay;
        this.textId = text.id,
            this.text = text.text;
        this.textLine = text.textLine;
        this.textLineDisplay = text.textLineDisplay;
    }
}

module.exports = TemplateData;