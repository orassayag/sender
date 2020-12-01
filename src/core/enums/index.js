const { EmailAddressStatus, EmailAddressType, SendEmailStepName, SendGridReason } = require('./files/emailAddress.enum');
const { Placeholder } = require('./files/placeholder.enum');
const { EmailAddressesSourceType } = require('./files/sources.enum');
const { Mode, Status, Method } = require('./files/system.enum');
const { StatusIcon, Color, ColorCode } = require('./files/text.enum');

module.exports = {
    Color, ColorCode, EmailAddressStatus, EmailAddressType, EmailAddressesSourceType, Method,
    Mode, Placeholder, SendEmailStepName, SendGridReason, Status, StatusIcon
};