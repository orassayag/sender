import errorScript from './error.script';
import initiateService from '../services/files/initiate.service';
initiateService.initiate('backup');
import BackupLogic from '../logics/backup.logic';

(async () => {
    await new BackupLogic().run();
})().catch(e => errorScript.handleScriptError(e, 1));