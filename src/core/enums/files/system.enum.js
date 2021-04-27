const enumUtils = require('../enum.utils');

const MethodEnum = enumUtils.createEnum([
    ['STANDARD', 'STANDARD'],
    ['RANDOM_EXCEEDED', 'RANDOM EXCEEDED']
]);

const ModeEnum = enumUtils.createEnum([
    ['PRODUCTION', 'PRODUCTION'],
    ['DEVELOPMENT', 'DEVELOPMENT']
]);

const ScriptTypeEnum = enumUtils.createEnum([
    ['INITIATE', 'initiate'],
    ['BACKUP', 'backup'],
    ['SEND', 'send'],
    ['STATUS', 'status'],
    ['TEST', 'test']
]);

const StatusEnum = enumUtils.createEnum([
    ['INITIATE', 'INITIATE'],
    ['ABORT_BY_THE_USER', 'ABORT BY THE USER'],
    ['VALIDATE', 'VALIDATE'],
    ['SEND', 'SEND'],
    ['PAUSE', 'PAUSE'],
    ['LIMIT_EXCEEDED', 'LIMIT EXCEEDED'],
    ['SEND_ERROR_IN_A_ROW', 'SEND ERROR IN A ROW'],
    ['SAVE_ERROR_IN_A_ROW', 'SAVE ERROR IN A ROW'],
    ['FINISH', 'FINISH']
]);

module.exports = { MethodEnum, ModeEnum, ScriptTypeEnum, StatusEnum };