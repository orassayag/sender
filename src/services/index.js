const accountService = require('./files/account.service');
const applicationService = require('./files/application.service');
const confirmationService = require('./files/confirmation.service');
const countLimitService = require('./files/countLimit.service');
const createEmailService = require('./files/createEmail.service');
const fileService = require('./files/file.service');
const logService = require('./files/log.service');
const mongoDatabaseService = require('./files/mongoDatabase.service');
const pathService = require('./files/path.service');
const sendEmailService = require('./files/sendEmail.service');
const sendgridService = require('./files/sendgrid.service');
const templateService = require('./files/template.service');
const validationService = require('./files/validation.service');

module.exports = {
    accountService, applicationService, confirmationService, countLimitService,
    createEmailService, fileService, logService, mongoDatabaseService, pathService,
    sendEmailService, sendgridService, templateService, validationService
};