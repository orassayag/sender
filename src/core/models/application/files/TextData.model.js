class TextDataModel {

    constructor(data) {
        const { id, text, textLine, textLineDisplay } = data;
        this.id = id;
        this.text = text;
        this.textLine = textLine;
        this.textLineDisplay = textLineDisplay;
    }
}

export default TextDataModel;