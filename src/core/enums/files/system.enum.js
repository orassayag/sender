const enumUtils = require('../enum.utils');

const Method = enumUtils.createEnum([
    ['STANDARD', 'STANDARD'],
    ['RANDOM_EXCEEDED', 'RANDOM EXCEEDED']
]);

const Mode = enumUtils.createEnum([
    ['PRODUCTION', 'PRODUCTION'],
    ['DEVELOPMENT', 'DEVELOPMENT']
]);

const ScriptType = enumUtils.createEnum([
    ['BACKUP', 'backup'],
    ['SEND', 'send']
]);

const Status = enumUtils.createEnum([
    ['INITIATE', 'INITIATE'],
    ['SEND', 'SEND'],
    ['PAUSE', 'PAUSE'],
    ['LIMIT_EXCEEDED', 'LIMIT EXCEEDED'],
    ['SEND_ERROR_IN_A_ROW', 'SEND ERROR IN A ROW'],
    ['SAVE_ERROR_IN_A_ROW', 'SAVE ERROR IN A ROW'],
    ['ABORT_BY_THE_USER', 'ABORT BY THE USER'],
    ['FINISH', 'FINISH']
]);

module.exports = { Method, Mode, ScriptType, Status };