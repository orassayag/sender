const AccountModel = require('./files/Account.model');
const AccountDataModel = require('./files/AccountData.model');
const ApplicationDataModel = require('./files/ApplicationData.model');
const BackupDataModel = require('./files/BackupData.model');
const BackupDirectoryModel = require('./files/BackupDirectory.model');
const CountLimitDataModel = require('./files/CountLimitData.model');
const CVDataModel = require('./files/CVData.model');
const EmailModel = require('./files/Email.model');
const EmailProcessResultModel = require('./files/EmailProcessResult.model');
const EmailDataModel = require('./files/EmailData.model');
const LogDataModel = require('./files/LogData.model');
const MongoDatabaseDataModel = require('./files/MongoDatabaseData.model');
const MongoDatabaseResultModel = require('./files/MongoDatabaseResult.model');
const PathDataModel = require('./files/PathData.model');
const SendEmailDataModel = require('./files/SendEmailData.model');
const SendGridCodeModel = require('./files/SendGridCode.model');
const SendGridResultModel = require('./files/SendGridResult.model');
const SourceDataModel = require('./files/SourceData.model');
const StatusResultModel = require('./files/StatusResult.model');
const SubjectDataModel = require('./files/SubjectData.model');
const TemplateModel = require('./files/Template.model');
const TemplateDataModel = require('./files/TemplateData.model');
const TextDataModel = require('./files/TextData.model');

module.exports = {
    AccountModel, AccountDataModel, ApplicationDataModel, BackupDataModel, BackupDirectoryModel,
    CountLimitDataModel, CVDataModel, EmailModel, EmailProcessResultModel,
    EmailDataModel, LogDataModel, MongoDatabaseDataModel, MongoDatabaseResultModel,
    PathDataModel, SendEmailDataModel, SendGridCodeModel, SendGridResultModel,
    SourceDataModel, StatusResultModel, SubjectDataModel, TemplateModel, TemplateDataModel,
    TextDataModel
};