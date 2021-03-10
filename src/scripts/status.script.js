const errorScript = require('./error.script');
require('../services/files/initiate.service').initiate('status');
const StatusLogic = require('../logics/status.logic');

(async () => {
    await new StatusLogic().run();
})().catch(e => errorScript.handleScriptError(e, 1));