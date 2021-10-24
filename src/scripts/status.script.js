import errorScript from './error.script';
import initiateService from '../services/files/initiate.service';
initiateService.initiate('status');
import StatusLogic from '../logics/status.logic';

(async () => {
    await new StatusLogic().run();
})().catch(e => errorScript.handleScriptError(e, 1));