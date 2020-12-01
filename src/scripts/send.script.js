require('../services/files/initiate.service').initiate();
const SendLogic = require('../logics/send.logic');

(async () => {
    await new SendLogic().run();
})();