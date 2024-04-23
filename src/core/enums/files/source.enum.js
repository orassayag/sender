import enumUtils from '../enum.utils.js';

const EmailAddressesSourceTypeEnum = enumUtils.createEnum([
  ['DIRECTORY', 'directory'],
  ['FILE', 'file'],
  ['ARRAY', 'array'],
]);

export { EmailAddressesSourceTypeEnum };
