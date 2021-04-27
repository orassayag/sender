const enumUtils = require('../enum.utils');
const textUtils = require('../text.utils');

const EmailAddressStatusEnum = enumUtils.createEnum([
    ['TOTAL', 'total'], // Not email address status de facto.
    ['TOTAL_PENDING', 'totalPending'], // Not email address status de facto.
    ['PENDING', 'pending'],
    ['SENT', 'sent'],
    ['ERROR', 'error'],
    ['EXISTS', 'exists'],
    ['DATABASE', 'database'],
    ['SAVE', 'save'],
    ['INVALID', 'invalid'],
    ['DUPLICATE', 'duplicate'],
    ['FILTER', 'filter'],
    ['SKIP', 'skip'],
    ['UNSAVE', 'unsave'],
    ['IDENTICAL_ADDRESSES', 'identicalAddresses'],
    ['MONITOR_SENT', 'monitorSent'], // Not email address status de facto.
    ['SECURITY_ERROR', 'securityError'],
    ['SECURITY_EXISTS', 'securityExists'],
    ['MISSING_FIELD', 'missingField'],
    ['INVALID_STATUS', 'invalidStatus'],
    ['IDENTICAL_STATUS', 'identicalStatus'],
    ['UNEXPECTED_FIELD', 'unexpectedField']
]);

const EmailAddressStatusLogEnum = enumUtils.createEnum(Object.keys(EmailAddressStatusEnum).map(k => {
    return [EmailAddressStatusEnum[k], textUtils.replaceCharacter(k, '_', ' ')];
}));

const EmailAddressTypeEnum = enumUtils.createEnum([
    ['STANDARD', 'STANDARD'],
    ['MONITOR', 'MONITOR']
]);

const SendEmailStepNameEnum = enumUtils.createEnum([
    ['INITIATE', 'INITIATE'],
    ['VALIDATE', 'VALIDATE'],
    ['SEND', 'SEND'],
    ['FINALIZE', 'FINALIZE']
]);

const SendGridReasonEnum = enumUtils.createEnum([
    ['OK', 'OK'],
    ['ACCEPTED', 'ACCEPTED'],
    ['BAD_REQUEST', 'BAD REQUEST'],
    ['UNAUTHORIZED', 'UNAUTHORIZED'],
    ['FORBIDDEN', 'FORBIDDEN'],
    ['NOT_FOUND', 'NOT FOUND'],
    ['METHOD_NOT_ALLOWED', 'METHOD NOT ALLOWED'],
    ['PAYLOAD_TOO_LARGE', 'PAYLOAD TOO LARGE'],
    ['UNSUPPORTED_MEDIA_TYPE', 'UNSUPPORTED MEDIA TYPE'],
    ['TOO_MANY_REQUESTS', 'TOO MANY REQUESTS'],
    ['SERVER_UNAVAILABLE', 'SERVER UNAVAILABLE'],
    ['SERVICE_NOT_AVAILABLE', 'SERVICE NOT AVAILABLE']
]);

module.exports = {
    EmailAddressStatusEnum, EmailAddressStatusLogEnum, EmailAddressTypeEnum, SendEmailStepNameEnum, SendGridReasonEnum
};