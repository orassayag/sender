import errorScript from './error.script';
import initiateService from '../services/files/initiate.service';
initiateService.initiate('send');
import SendLogic from '../logics/send.logic';

(async () => {
    await new SendLogic().run();
})().catch(e => errorScript.handleScriptError(e, 1));