const Account = require('./files/Account');
const AccountData = require('./files/AccountData');
const ApplicationData = require('./files/ApplicationData');
const BackupData = require('./files/BackupData');
const BackupDirectory = require('./files/BackupDirectory');
const CountLimitData = require('./files/CountLimitData');
const CVData = require('./files/CVData');
const Email = require('./files/Email');
const EmailProcessResult = require('./files/EmailProcessResult');
const EmailData = require('./files/EmailData');
const LogData = require('./files/LogData');
const MongoDatabaseData = require('./files/MongoDatabaseData');
const MongoDatabaseResult = require('./files/MongoDatabaseResult');
const PathData = require('./files/PathData');
const SendEmailData = require('./files/SendEmailData');
const SendGridCode = require('./files/SendGridCode');
const SendGridResult = require('./files/SendGridResult');
const SourceData = require('./files/SourceData');
const StatusResult = require('./files/StatusResult');
const SubjectData = require('./files/SubjectData');
const Template = require('./files/Template');
const TemplateData = require('./files/TemplateData');
const TextData = require('./files/TextData');

module.exports = {
    Account, AccountData, ApplicationData, BackupData, BackupDirectory, CountLimitData, CVData, Email, EmailProcessResult,
    EmailData, LogData, MongoDatabaseData, MongoDatabaseResult, PathData, SendEmailData, SendGridCode, SendGridResult,
    SourceData, StatusResult, SubjectData, Template, TemplateData, TextData
};