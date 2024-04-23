import { fileUtils, pathUtils, validationUtils } from '../../utils/index.js';

class FileService {
  constructor() {}

  async getJSONFileData(data) {
    const { path, parameterName, fileExtension } = data;
    if (!(await fileUtils.isPathExists(path))) {
      throw new Error(`Path not exists: ${path} (1000018)`);
    }
    if (!fileUtils.isFilePath(path)) {
      throw new Error(
        `The parameter path ${parameterName} marked as file but it's a path of a directory: ${path} (1000019)`
      );
    }
    const extension = pathUtils.getExtension(path);
    if (extension !== fileExtension) {
      throw new Error(
        `The parameter path ${parameterName} must be a ${fileExtension} file but it's: ${extension} file (1000020)`
      );
    }
    const fileData = await fileUtils.read(path);
    const jsonData = JSON.parse(fileData);
    if (!validationUtils.isExists(jsonData)) {
      throw new Error('No data found in the file (1000021)');
    }
    return jsonData;
  }
}

export default new FileService();
