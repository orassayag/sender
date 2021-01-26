const errorScript = require('./error.script');
require('../services/files/initiate.service').initiate('send');
const SendLogic = require('../logics/send.logic');

(async () => {
    await new SendLogic().run();
})().catch(e => errorScript.handleScriptError(e, 1));