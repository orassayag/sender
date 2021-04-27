const { EmailAddressStatusEnum, EmailAddressStatusLogEnum, EmailAddressTypeEnum,
    SendEmailStepNameEnum, SendGridReasonEnum } = require('./files/emailAddress.enum');
const { PlaceholderEnum } = require('./files/placeholder.enum');
const { EmailAddressesSourceTypeEnum } = require('./files/source.enum');
const { MethodEnum, ModeEnum, ScriptTypeEnum, StatusEnum } = require('./files/system.enum');
const { ColorEnum, ColorCodeEnum, StatusIconEnum } = require('./files/text.enum');

module.exports = {
    ColorEnum, ColorCodeEnum, EmailAddressStatusEnum, EmailAddressStatusLogEnum, EmailAddressTypeEnum,
    EmailAddressesSourceTypeEnum, MethodEnum, ModeEnum, PlaceholderEnum, ScriptTypeEnum,
    SendEmailStepNameEnum, SendGridReasonEnum, StatusEnum, StatusIconEnum
};