const { pathUtils, fileUtils } = require('../../utils');

class FileService {

    constructor() { }

    async getFileData(data) {
        const { path, parameterName, fileExtension } = data;
        if (!await fileUtils.isPathExists(path)) {
            throw new Error(`Invalid or no ${parameterName} parameter was found: Excpected a number but received: ${path} (1000019)`);
        }
        if (!fileUtils.isFilePath(path)) {
            throw new Error(`The parameter path ${parameterName} marked as file but it's a path of a directory: ${path} (1000020)`);
        }
        const extension = pathUtils.getExtension(path);
        if (extension !== fileExtension) {
            throw new Error(`The parameter path ${parameterName} must be a ${fileExtension} file but it's: ${extension} file (1000021)`);
        }
        const fileData = await fileUtils.read(path);
        const jsonData = JSON.parse(fileData);
        if (jsonData.length <= 0) {
            throw new Error('No data found in the file (1000022)');
        }
        return jsonData;
    }
}

module.exports = new FileService();