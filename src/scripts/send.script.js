require('../services/files/initiate.service').initiate('send');
const SendLogic = require('../logics/send.logic');

(async () => {
    await new SendLogic().run();
})();