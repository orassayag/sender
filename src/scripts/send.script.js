import errorScript from './error.script.js';
import initiateService from '../services/files/initiate.service.js';
initiateService.initiate('send');
import SendLogic from '../logics/send.logic.js';

(async () => {
  await new SendLogic().run();
})().catch((e) => errorScript.handleScriptError(e, 1));
