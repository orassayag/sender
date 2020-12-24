const enumUtils = require('../enum.utils');

const EmailAddressesSourceType = enumUtils.createEnum([
    ['DIRECTORY', 'directory'],
    ['FILE', 'file'],
    ['ARRAY', 'array']
]);

module.exports = { EmailAddressesSourceType };