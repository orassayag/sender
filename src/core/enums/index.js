const { EmailAddressStatus, EmailAddressStatusLog, EmailAddressType, SendEmailStepName, SendGridReason } = require('./files/emailAddress.enum');
const { Placeholder } = require('./files/placeholder.enum');
const { EmailAddressesSourceType } = require('./files/source.enum');
const { Method, Mode, ScriptType, Status } = require('./files/system.enum');
const { Color, ColorCode, StatusIcon } = require('./files/text.enum');

module.exports = {
    Color, ColorCode, EmailAddressStatus, EmailAddressStatusLog, EmailAddressType,
    EmailAddressesSourceType, Method, Mode, Placeholder, ScriptType, SendEmailStepName,
    SendGridReason, Status, StatusIcon
};