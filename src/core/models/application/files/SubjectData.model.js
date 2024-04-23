class SubjectDataModel {
  constructor(data) {
    const { id, subject, subjectLine, subjectLineDisplay } = data;
    this.id = id;
    this.subject = subject;
    this.subjectLine = subjectLine;
    this.subjectLineDisplay = subjectLineDisplay;
  }
}

export default SubjectDataModel;
