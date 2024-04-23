import errorScript from './error.script.js';
import initiateService from '../services/files/initiate.service.js';
initiateService.initiate('backup');
import BackupLogic from '../logics/backup.logic.js';

(async () => {
  await new BackupLogic().run();
})().catch((e) => errorScript.handleScriptError(e, 1));
