const enumUtils = require('../enum.utils');

const EmailAddressesSourceTypeEnum = enumUtils.createEnum([
    ['DIRECTORY', 'directory'],
    ['FILE', 'file'],
    ['ARRAY', 'array']
]);

module.exports = { EmailAddressesSourceTypeEnum };