import fs from 'fs-extra';
import pathUtils from './path.utils.js';
import globalUtils from '../../utils/files/global.utils.js';

class FileUtils {
  constructor() {}

  async read(targetPath) {
    return await fs.readFile(targetPath, 'utf-8');
  }

  async isPathExists(targetPath) {
    // Check if the path parameter was received.
    if (!targetPath) {
      throw new Error(`targetPath not received: ${targetPath} (1000041)`);
    }
    // Check if the path parameter exists.
    try {
      return await fs.stat(targetPath);
    } catch {
      return false;
    }
  }

  getAllDirectories(targetPath) {
    return fs
      .readdirSync(targetPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  }

  async readFile(targetPath) {
    // Verify that the path exists.
    globalUtils.isPathExistsError(targetPath);
    // Return the file content.
    return await this.read(targetPath);
  }

  createDirectory(targetPath) {
    if (!targetPath) {
      return;
    }
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
  }

  async appendFile(data) {
    const { targetPath, message } = data;
    if (!targetPath) {
      throw new Error(`targetPath not found: ${targetPath} (1000042)`);
    }
    if (!message) {
      throw new Error(`message not found: ${message} (1000043)`);
    }
    if (!(await this.isPathExists(targetPath))) {
      await fs.promises
        .mkdir(pathUtils.getDirName(targetPath), { recursive: true })
        .catch(console.error);
    }
    // Append the message to the file.
    await fs.appendFile(targetPath, message);
  }

  async getFilesRecursive(directory) {
    const dirents = await fs.readdir(directory, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map((dirent) => {
        const result = pathUtils.resolve(directory, dirent.name);
        return dirent.isDirectory() ? this.getFilesRecursive(result) : result;
      })
    );
    return Array.prototype.concat(...files);
  }

  async removeDirectoryIfExists(targetPath) {
    if (await this.isPathExists(targetPath)) {
      await fs.remove(targetPath);
    }
  }

  async createDirectoryIfNotExists(targetPath) {
    if (!(await this.isPathExists(targetPath))) {
      await fs.mkdir(targetPath);
    }
  }

  async copyDirectory(sourcePath, targetPath, filterFunction) {
    await fs.copy(sourcePath, targetPath, { filter: filterFunction });
  }

  isFilePath(path) {
    const stats = fs.statSync(path);
    return stats.isFile();
  }

  isDirectoryPath(path) {
    const stats = fs.statSync(path);
    return stats.isDirectory();
  }

  async createBase64Path(targetPath) {
    let resultBase64 = null;
    if (await this.isPathExists(targetPath)) {
      resultBase64 = fs.readFileSync(targetPath).toString('base64');
    }
    return resultBase64;
  }

  getFileSize(targetPath) {
    const stats = fs.statSync(targetPath);
    const fileSizeInBytes = stats.size;
    // Convert the file size to megabytes.
    return fileSizeInBytes / (1024 * 1024);
  }
}

export default new FileUtils();
