const applicationUtils = require('./files/application.utils');
const colorUtils = require('./files/color.utils');
const fileUtils = require('./files/file.utils');
const logUtils = require('./files/log.utils');
const mongoDatabaseUtils = require('./files/mongoDatabase.utils');
const pathUtils = require('./files/path.utils');
const regexUtils = require('./files/regex.utils');
const sendgridUtils = require('./files/sendgrid.utils');
const systemUtils = require('./files/system.utils');
const textUtils = require('./files/text.utils');
const timeUtils = require('./files/time.utils');
const validationUtils = require('./files/validation.utils');

module.exports = {
    applicationUtils, colorUtils, fileUtils, logUtils, mongoDatabaseUtils, pathUtils,
    regexUtils, sendgridUtils, systemUtils, textUtils, timeUtils, validationUtils
};