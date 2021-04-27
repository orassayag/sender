const { EmailAddressesSourceTypeEnum } = require('../core/enums');
const { pathUtils } = require('../utils');

const settings = {
    // ===FLAG=== //
    // Determine if to load local sources (dummy email addresses) in development mode (=false) or to do real
    // email sent process within the production mode (=true).
    IS_PRODUCTION_MODE: true,
    // Determine if to really send emails via SendGrid service or to simulate sending email by random
    // result and timeout.
    IS_SEND_EMAILS: true,
    // Determine if to save email address in the Mongo database or to simulate saving email address by timeout.
    IS_SAVE_EMAILS: true,
    // Determine if to drop the collection before the process run begins. Good for test mode.
    IS_DROP_COLLECTION: false,
    // Determine if to activate the skip logic, that is detailed in above the
    // MAXIMUM_UNIQUE_DOMAIN_COUNT parameter.
    IS_SKIP_LOGIC: false,
    // Determine if to activate the monitor logic, to send emails to verify that the process works and get
    // a copy of the email the sender sent.
    IS_MONITOR_LOGIC: false,
    // Determine if to display the log console status (false) or to display the email results one by one (true).
    IS_LOG_MODE: false,
    // Determine whether to random the accounts from the JSON file or not.
    IS_RANDOM_ACCOUNTS: true,

    // ===SOURCE=== //
    // Determine the type of source to fetch the email addresses from in order to send them.
    // Can be DIRECTORY / FILE / ARRAY. Please note that the logic only supports scanning TXT
    // files with email addresses separated by comma.
    EMAIL_ADDRESSES_SOURCE_TYPE: EmailAddressesSourceTypeEnum.ARRAY,
    // Determine the path of the development source in case 'DIRECTORY' or 'FILE' options are selected.
    // In case of 'ARRAY', option selected, the array located in source.service file.
    EMAIL_ADDRESSES_DEVELOPMENT_SOURCE_PATH: pathUtils.getJoinPath({
        targetPath: __dirname,
        targetName: '../../misc/data/development_sources/production/'
    }),
    // Determine the path of the development source in case 'DIRECTORY' or 'FILE' options are selected.
    // In case of 'ARRAY', option selected, the array located in source.service file.
    EMAIL_ADDRESSES_PRODUCTION_SOURCE_PATH: pathUtils.getJoinPath({
        targetPath: __dirname,
        targetName: '../../sources/'
    }),
    // Determine the part of a name of a file to be scanned in case the 'DIRECTORY' option is selected.
    // Other files which do not include this part in the file name will not be scanned.
    // There is no option to scan all the TXT files.
    EMAIL_ADDRESSES_INCLUDE_FILE_NAME: 'email_addresses_',

    // ===LOG=== //
    // Determine if to log results for each email to a TXT file.
    IS_LOG_RESULTS: true,

    // ===SENDGRID=== //
    // Determine the name of the sender of the email.
    EMAIL_SENDER_NAME: 'Billy Ravid',
    // Determine the path of the JSON file from which all the SendGrid accounts will be fetched. Must be a JSON file.
    ACCOUNTS_FILE_PATH: pathUtils.getJoinPath({
        targetPath: __dirname,
        targetName: '../../../../../../Users/Or/Dropbox/accounts/sendgrid/accounts.json'
    }),
    // Determine the path of the JSON file from which all the templates will be fetched. Must be a JSON file.
    TEMPLATES_FILE_PATH: pathUtils.getJoinPath({
        targetPath: __dirname,
        targetName: '../../misc/data/templates/templates.json'
    }),
    // Determine the path of the TXT file from which all the monitor email addresses will be fetched. Must be a TXT file.
    MONITOR_FILE_PATH: pathUtils.getJoinPath({
        targetPath: __dirname,
        targetName: '../../misc/data/monitor/monitor.txt'
    }),
    // Determine the path of the CV DOC file. Must be a DOC file.
    CV_FILE_PATH: pathUtils.getJoinPath({
        targetPath: __dirname,
        targetName: '../../misc/data/cv/CV Billy Ravid.doc'
    }),

    // ===COUNT & LIMIT=== //
    // Determine the maximum number of emails to send during the process. If there are more email addresses fetched
    // than the maximum of this parameter, random email addresses will be selected.
    MAXIMUM_SEND_EMAILS: 10000,
    // Determine the delay time in milliseconds between each email send process.
    MILLISECONDS_SEND_EMAIL_DELAY_COUNT: 2000,
    // Determine the number of milliseconds until to manually timeout the SendGrid send email process
    // and to continue to the next email.
    MILLISECONDS_SEND_TIMEOUT: 60000,
    // Determine how much milliseconds interval to calculate the time of the
    // status line in the console.
    MILLISECONDS_INTERVAL_COUNT: 500,
    // Determine the maximum number of times to retry to save the email address to the Mongo database.
    MAXIMUM_SAVE_EMAIL_ADDRESS_RETRIES_COUNT: 2,
    // Determine the maximum unique domain count in a single page process per domain.
    // If exceeded, the rest of the email addresses with the domain are skipped
    // (This, of course, does not include common domains like gmail, hotmail, etc...).
    MAXIMUM_UNIQUE_DOMAIN_COUNT: 3,
    // Determine how many monitor emails to send during a single process of sending emails.
    // Will work only if the IS_MONITOR_LOGIC is true. It will be sent in a random place in the emails list.
    MONITOR_EMAILS_SEND_COUNT: 1,
    // Determine the maximum number of monitor email addresses to fetch from monitor.txt file.
    // If there are more than this number, it will take the first ones.
    MAXIMUM_MONITOR_EMAIL_ADDRESSES: 10,
    // Determine how many characters of the display subject and text (for each) to display on the console.
    MAXIMUM_DISPLAY_TEMPLATE_CHARACTERS_COUNT: 60,
    // Determine the percentage of true/false of success the simulate process of sending email,
    // in case IS_SEND_EMAILS = false. Example: 0.8 - true 80%/false 20%.
    SIMULATE_SEND_SUCCESS_PERCENTAGE: 0.8,
    // Determine the percentage of true/false of success the simulate process of saving email,
    // in case IS_SAVE_EMAILS = false. Example: 0.8 - true 80%/false 20%.
    SIMULATE_SAVE_SUCCESS_PERCENTAGE: 0.9,
    // Determine the delay time of simulating the sending email process in milliseconds.
    MILLISECONDS_SIMULATE_DELAY_SEND_PROCESS_COUNT: 1000,
    // Determine the delay time of simulating save email process in milliseconds.
    MILLISECONDS_SIMULATE_DELAY_SAVE_PROCESS_COUNT: 500,
    // Determine the number of send (sendgridService) errors in a row, which after exceeding this count the program will exit.
    MAXIMUM_SEND_ERROR_IN_A_ROW_COUNT: 5,
    // Determine the number of save (mongoDatabaseService) errors in a row, which after exceeding this count the program will exit.
    MAXIMUM_SAVE_ERROR_IN_A_ROW_COUNT: 5,
    // Determine the maximum number of characters count of the email address (to and from addresses) displayed in the console
    // status. If exceeded it will be cutted.
    MAXIMUM_EMAIL_ADDRESS_CHARACTERS_DISPLAY_COUNT: 50,
    // Determine the maximum number of characters count of the result displayed in the console status. If exceeded it will
    // be cutted.
    MAXIMUM_RESULT_CHARACTERS_DISPLAY_COUNT: 150,
    // Determine the maximum size of TXT file (in megabytes) to fetch email addresses. If in DIRECTORY mode will skip the file,
    // if in FILE mode will throw an error.
    MAXIMUM_FILE_SIZE_MEGABYTES: 5,
    // Determine the number of retries to validate the URLs.
    MAXIMUM_URL_VALIDATION_COUNT: 5,
    // Determine the milliseconds count timeout to wait between URL validation retry.
    MILLISECONDS_TIMEOUT_URL_VALIDATION: 1000,

    // ===ROOT PATH=== //
    // Determine the application name used for some of the calculated paths.
    APPLICATION_NAME: 'sender',
    // Determine the path for the outer application, where other directories located, such as backups, sources, etc...
    // (Working example: 'C:\\Or\\Web\\sender\\').
    OUTER_APPLICATION_PATH: pathUtils.getJoinPath({
        targetPath: __dirname,
        targetName: '../../../'
    }),
    // Determine the inner application path where all the source of the application is located.
    // (Working example: 'C:\\Or\\Web\\sender\\sender\\').
    INNER_APPLICATION_PATH: pathUtils.getJoinPath({
        targetPath: __dirname,
        targetName: '../../'
    }),

    // ===DYNAMIC PATH=== //
    // All these paths will be calculated during runtime in the initial service.
    // DON'T REMOVE THE KEYS, THEY WILL BE CALCULATED TO PATHS DURING RUNTIME.
    // Determine the application path where all the source of the application is located.
    // (Working example: 'C:\\Or\\Web\\sender\\sender').
    APPLICATION_PATH: 'sender',
    // Determine the backups directory which all the local backup will be created to.
    // (Working example: 'C:\\Or\\Web\\sender\\backups').
    BACKUPS_PATH: 'backups',
    // Determine the dist directory path which there, all the outcome of the logs will be created.
    // (Working example: 'C:\\Or\\Web\\sender\\sender\\dist').
    DIST_PATH: 'dist',
    // (Working example: 'C:\\Or\\Web\\sender\\sender\\node_modules').
    NODE_MODULES_PATH: 'node_modules',
    // (Working example: 'C:\\Or\\Web\\sender\\sender\\package.json').
    PACKAGE_JSON_PATH: 'package.json',
    // (Working example: 'C:\\Or\\Web\\sender\\sender\\package-lock.json').
    PACKAGE_LOCK_JSON_PATH: 'package-lock.json',

    // ===BACKUP=== //
    // Determine the directories to ignore when a backup copy is taking place.
    // For example: 'dist'.
    IGNORE_DIRECTORIES: ['.git', 'dist', 'node_modules', 'misc\\data', 'sources'],
    // Determine the files to ignore when the back copy is taking place.
    // For example: 'back_sources_tasks.txt'.
    IGNORE_FILES: [],
    // Determine the files to force include when the back copy is taking place.
    // For example: '.gitignore'.
    INCLUDE_FILES: ['.gitignore'],
    // Determine the period of time in milliseconds to
    // check that files were created / moved to the target path.
    MILLISECONDS_DELAY_VERIFY_BACKUP_COUNT: 1000,
    // Determine the number of times in loop to check for version of a backup.
    // For example, if a backup name 'test-test-test-1' exists, it will check for 'test-test-test-2',
    // and so on, until the current maximum number.
    BACKUP_MAXIMUM_DIRECTORY_VERSIONS_COUNT: 50,

    // ===MONGO DATABASE=== //
    // Determine the connection string path of the Mongo database.
    MONGO_DATABASE_CONNECTION_STRING: 'mongodb://localhost:27017/',
    // Determine the Mongo database name.
    MONGO_DATABASE_NAME: 'send',
    // Determine the Mongo database collection name.
    MONGO_DATABASE_COLLECTION_NAME: 'emailaddresses',
    // Determine the maximum number of times to retry to drop the collection.
    MAXIMUM_DROP_COLLECTION_RETRIES_COUNT: 5,
    // Determine if to use better connection topology.
    IS_MONGO_DATABASE_USE_UNIFILED_TOPOLOGY: true,
    // Determine if to use the new url parser to connect to the Mongo database.
    IS_MONGO_DATABASE_USE_NEW_URL_PARSER: true,
    // Determine if to use indexes automatically created by the Mongo database.
    IS_MONGO_DATABASE_USE_CREATE_INDEX: true,
    // Determine the maximum poolSize for each individual server or proxy connection.
    MONGO_DATABASE_POOL_SIZE_COUNT: 20,
    // Determine the TCP Socket timeout setting.
    MONGO_DATABASE_SOCKET_TIMEOUT_MILLISECONDS_COUNT: 480000,
    // Determine the number of milliseconds to wait before initiating keepAlive on the TCP socket.
    MONGO_DATABASE_KEEP_ALIVE_MILLISECONDS_COUNT: 300000,
    // Determine if to use SSL connection (needs to have a Mongo Database server with SSL support).
    IS_MONGO_DATABASE_SSL: false,
    // Determine if to validate Mongo Database server certificate against CA (needs to have a Mongo Database server with SSL support, 2.4 or higher).
    IS_MONGO_DATABASE_SSL_VALIDATE: false,

    // ===VALIDATION=== //
    // Determine the link address to test the internet connection.
    VALIDATION_CONNECTION_LINK: 'google.com',
    // Determine the default error code when a manually exception has been thrown.
    DEFAULT_ERROR_CODE: 500,

    // ===UNCHANGED SETTING=== //
    // ========================================
    // DON'T CHANGE THESE SETTINGS IN ANY CASE!
    // ========================================
    MAXIMUM_SENDGRID_DAILY_EMAILS_COUNT: 100
};

module.exports = settings;