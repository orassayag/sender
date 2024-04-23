import errorScript from './error.script.js';
import initiateService from '../services/files/initiate.service.js';
initiateService.initiate('status');
import StatusLogic from '../logics/status.logic.js';

(async () => {
  await new StatusLogic().run();
})().catch((e) => errorScript.handleScriptError(e, 1));
