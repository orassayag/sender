import enumUtils from '../enum.utils';

const EmailAddressesSourceTypeEnum = enumUtils.createEnum([
    ['DIRECTORY', 'directory'],
    ['FILE', 'file'],
    ['ARRAY', 'array']
]);

export { EmailAddressesSourceTypeEnum };