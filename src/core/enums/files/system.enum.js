const enumUtils = require('../enum.utils');

const Mode = enumUtils.createEnum([
    ['PRODUCTION', 'PRODUCTION'],
    ['DEVELOPMENT', 'DEVELOPMENT']
]);

const Status = enumUtils.createEnum([
    ['INITIATE', 'INITIATE'],
    ['SEND', 'SEND'],
    ['PAUSE', 'PAUSE'],
    ['FINISH', 'FINISH'],
    ['LIMIT_EXCEEDED', 'LIMIT EXCEEDED'],
    ['SEND_ERROR_IN_A_ROW', 'SEND ERROR IN A ROW'],
    ['SAVE_ERROR_IN_A_ROW', 'SAVE ERROR IN A ROW']
]);

const Method = enumUtils.createEnum([
    ['STANDARD', 'STANDARD'],
    ['RANDOM_EXCEEDED', 'RANDOM EXCEEDED']
]);

module.exports = { Mode, Status, Method };