const accountsService = require('./files/accounts.service');
const applicationService = require('./files/application.service');
const confirmationService = require('./files/confirmation.service');
const countsLimitsService = require('./files/countsLimits.service');
const createEmailsService = require('./files/createEmails.service');
const logsService = require('./files/logs.service');
const mongoDatabaseService = require('./files/mongoDatabase.service');
const pathsService = require('./files/paths.service');
const sendEmailService = require('./files/sendEmail.service');
const sendgridService = require('./files/sendgrid.service');
const templatesService = require('./files/templates.service');
const validationService = require('./files/validation.service');

module.exports = {
    accountsService, applicationService, confirmationService, countsLimitsService,
    createEmailsService, logsService, mongoDatabaseService, pathsService, sendEmailService,
    sendgridService, templatesService, validationService
};