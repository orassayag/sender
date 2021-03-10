const settings = require('../../settings/settings');
const { EmailAddressesSourceType, ScriptType } = require('../../core/enums');
const globalUtils = require('../../utils/files/global.utils');
const { fileUtils, pathUtils, validationUtils } = require('../../utils');

class InitiateService {

	constructor() {
		this.scriptType = null;
	}

	initiate(scriptType) {
		// First, setup handles errors and promises.
		this.setup();
		// Validate the script type.
		this.scriptType = scriptType;
		this.validateScriptType();
		// The second important thing to do is to validate all the parameters of the settings.js file.
		this.validateSettings();
		// The next thing is to calculate paths and inject back to the settings.js file.
		this.calculateSettings();
		// Make sure that the dist directory exists. If not, create it.
		this.validateDirectories();
		// Validate that certain directories exist, and if not, create them.
		this.createDirectories();
	}

	setup() {
		// Handle any uncaughtException error.
		process.on('uncaughtException', (error) => {
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			console.log(error);
			process.exit(0);
		});
		// Handle any unhandledRejection promise error.
		process.on('unhandledRejection', (reason, promise) => {
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			console.log(reason);
			console.log(promise);
			process.exit(0);
		});
	}

	validateScriptType() {
		if (!this.scriptType || !validationUtils.isValidEnum({
			enum: ScriptType,
			value: this.scriptType
		})) {
			throw new Error('Invalid or no ScriptType parameter was found (1000022)');
		}
	}

	validateSettings() {
		// Validate the settings object existence.
		if (!settings) {
			throw new Error('Invalid or no settings object was found (1000023)');
		}
		this.validatePositiveNumbers();
		this.validateStrings();
		this.validateBooleans();
		this.validateArrays();
		this.validateEnums();
		this.validateSpecial();
	}

	calculateSettings() {
		const { OUTER_APPLICATION_PATH, INNER_APPLICATION_PATH, APPLICATION_PATH, BACKUPS_PATH, DIST_PATH,
			NODE_MODULES_PATH, PACKAGE_JSON_PATH, PACKAGE_LOCK_JSON_PATH } = settings;
		// ===DYNAMIC PATH=== //
		settings.APPLICATION_PATH = pathUtils.getJoinPath({ targetPath: OUTER_APPLICATION_PATH, targetName: APPLICATION_PATH });
		if (this.scriptType === ScriptType.BACKUP) {
			settings.BACKUPS_PATH = pathUtils.getJoinPath({ targetPath: OUTER_APPLICATION_PATH, targetName: BACKUPS_PATH });
		}
		settings.DIST_PATH = pathUtils.getJoinPath({ targetPath: INNER_APPLICATION_PATH, targetName: DIST_PATH });
		settings.NODE_MODULES_PATH = pathUtils.getJoinPath({ targetPath: INNER_APPLICATION_PATH, targetName: NODE_MODULES_PATH });
		settings.PACKAGE_JSON_PATH = pathUtils.getJoinPath({ targetPath: INNER_APPLICATION_PATH, targetName: PACKAGE_JSON_PATH });
		settings.PACKAGE_LOCK_JSON_PATH = pathUtils.getJoinPath({ targetPath: INNER_APPLICATION_PATH, targetName: PACKAGE_LOCK_JSON_PATH });
	}

	validatePositiveNumbers() {
		[
			// ===COUNT & LIMIT=== //
			'MAXIMUM_SEND_EMAILS', 'MILLISECONDS_SEND_EMAIL_DELAY_COUNT', 'MILLISECONDS_SEND_TIMEOUT',
			'MILLISECONDS_INTERVAL_COUNT', 'MAXIMUM_SAVE_EMAIL_ADDRESS_RETRIES_COUNT', 'MAXIMUM_UNIQUE_DOMAIN_COUNT',
			'MONITOR_EMAILS_SEND_COUNT', 'MAXIMUM_MONITOR_EMAIL_ADDRESSES', 'MAXIMUM_DISPLAY_TEMPLATE_CHARACTERS_COUNT',
			'SIMULATE_SEND_SUCCESS_PERCENTAGE', 'SIMULATE_SAVE_SUCCESS_PERCENTAGE', 'MILLISECONDS_SIMULATE_DELAY_SEND_PROCESS_COUNT',
			'MILLISECONDS_SIMULATE_DELAY_SAVE_PROCESS_COUNT', 'MAXIMUM_SEND_ERROR_IN_A_ROW_COUNT', 'MAXIMUM_SAVE_ERROR_IN_A_ROW_COUNT',
			'MAXIMUM_EMAIL_ADDRESS_CHARACTERS_DISPLAY_COUNT', 'MAXIMUM_RESULT_CHARACTERS_DISPLAY_COUNT', 'MAXIMUM_FILE_SIZE_MEGABYTES',
			'MAXIMUM_URL_VALIDATION_COUNT', 'MILLISECONDS_TIMEOUT_URL_VALIDATION',
			// ===BACKUP=== //
			'MILLISECONDS_DELAY_VERIFY_BACKUP_COUNT', 'BACKUP_MAXIMUM_DIRECTORY_VERSIONS_COUNT',
			// ===MONGO DATABASE=== //
			'MAXIMUM_DROP_COLLECTION_RETRIES_COUNT', 'MONGO_DATABASE_POOL_SIZE_COUNT', 'MONGO_DATABASE_SOCKET_TIMEOUT_MILLISECONDS_COUNT',
			'MONGO_DATABASE_KEEP_ALIVE_MILLISECONDS_COUNT',
			// ===VALIDATION=== //
			'DEFAULT_ERROR_CODE',
			// ===UNCHANGED SETTING=== //
			'MAXIMUM_SENDGRID_DAILY_EMAILS_COUNT'
		].map(key => {
			const value = settings[key];
			if (!validationUtils.isPositiveNumber(value)) {
				throw new Error(`Invalid or no ${key} parameter was found: Expected a number but received: ${value} (1000024)`);
			}
		});
	}

	validateStrings() {
		const keys = this.scriptType === ScriptType.BACKUP ? ['BACKUPS_PATH'] : [];
		[
			...keys,
			// ===SENDGRID=== //
			'EMAIL_SENDER_NAME', 'ACCOUNTS_FILE_PATH', 'TEMPLATES_FILE_PATH', 'MONITOR_FILE_PATH',
			'CV_FILE_PATH',
			// ===ROOT PATH=== //
			'APPLICATION_NAME', 'OUTER_APPLICATION_PATH', 'INNER_APPLICATION_PATH',
			// ===DYNAMIC PATH=== //
			'APPLICATION_PATH', 'DIST_PATH', 'NODE_MODULES_PATH', 'PACKAGE_JSON_PATH',
			'PACKAGE_LOCK_JSON_PATH',
			// ===MONGO DATABASE=== //
			'MONGO_DATABASE_CONNECTION_STRING', 'MONGO_DATABASE_NAME', 'MONGO_DATABASE_COLLECTION_NAME',
			// ===VALIDATION=== //
			'VALIDATION_CONNECTION_LINK'
		].map(key => {
			const value = settings[key];
			if (!validationUtils.isExists(value)) {
				throw new Error(`Invalid or no ${key} parameter was found: Expected a string but received: ${value} (1000025)`);
			}
		});
	}

	validateBooleans() {
		[
			// ===FLAG=== //
			'IS_PRODUCTION_MODE', 'IS_SEND_EMAILS', 'IS_SAVE_EMAILS', 'IS_DROP_COLLECTION', 'IS_SKIP_LOGIC', 'IS_MONITOR_LOGIC',
			'IS_LOG_MODE',
			// ===LOG=== //
			'IS_LOG_RESULTS',
			// ===MONGO DATABASE=== //
			'IS_MONGO_DATABASE_USE_UNIFILED_TOPOLOGY', 'IS_MONGO_DATABASE_USE_NEW_URL_PARSER', 'IS_MONGO_DATABASE_USE_CREATE_INDEX',
			'IS_MONGO_DATABASE_SSL', 'IS_MONGO_DATABASE_SSL_VALIDATE'
		].map(key => {
			const value = settings[key];
			if (!validationUtils.isValidBoolean(value)) {
				throw new Error(`Invalid or no ${key} parameter was found: Expected a boolean but received: ${value} (1000026)`);
			}
		});
	}

	validateArrays() {
		[
			// ===BACKUP=== //
			'IGNORE_DIRECTORIES', 'IGNORE_FILES', 'INCLUDE_FILES'
		].map(key => {
			const value = settings[key];
			if (!validationUtils.isValidArray(value)) {
				throw new Error(`Invalid or no ${key} parameter was found: Expected an array but received: ${value} (1000027)`);
			}
		});
	}

	validateEnums() {
		const { EMAIL_ADDRESSES_SOURCE_TYPE } = settings;
		// ===SOURCE=== //
		if (!validationUtils.isValidEnum({
			enum: EmailAddressesSourceType,
			value: EMAIL_ADDRESSES_SOURCE_TYPE
		})) {
			throw new Error('Invalid or no EMAIL_ADDRESSES_SOURCE_TYPE parameter was found (1000028)');
		}
	}

	validateSpecial() {
		const { MONGO_DATABASE_CONNECTION_STRING, VALIDATION_CONNECTION_LINK } = settings;
		// ===MONGO DATABASE=== //
		if (!validationUtils.isValidMongoConnectionString(MONGO_DATABASE_CONNECTION_STRING)) {
			throw new Error('Invalid or no MONGO_DATABASE_CONNECTION_STRING parameter was found (1000029)');
		}
		// ===VALIDATION=== //
		if (!validationUtils.isValidLink(VALIDATION_CONNECTION_LINK)) {
			throw new Error('No VALIDATION_CONNECTION_LINK parameter was found (1000030)');
		}
	}

	validateDirectories() {
		const keys = this.scriptType === ScriptType.BACKUP ? ['BACKUPS_PATH'] : [];
		[
			...keys,
			// ===ROOT PATH=== //
			'OUTER_APPLICATION_PATH', 'INNER_APPLICATION_PATH',
			// ===DYNAMIC PATH=== //
			'APPLICATION_PATH', 'PACKAGE_JSON_PATH'
		].map(key => {
			const value = settings[key];
			// Verify that the dist and the sources paths exists.
			globalUtils.isPathExistsError(value);
			// Verify that the dist and the source paths are accessible.
			globalUtils.isPathAccessible(value);
		});
		[
			...keys,
			// ===ROOT PATH=== //
			'OUTER_APPLICATION_PATH', 'INNER_APPLICATION_PATH'
		].map(key => {
			const value = settings[key];
			// Verify that the paths are of directory and not a file.
			if (!fileUtils.isDirectoryPath(value)) {
				throw new Error(`The parameter path ${key} marked as directory but it's a path of a file: ${value} (1000031)`);
			}
		});
	}

	createDirectories() {
		[
			// ===DYNAMIC PATH=== //
			'DIST_PATH', 'NODE_MODULES_PATH'
		].map(async (key) => {
			const value = settings[key];
			// Make sure that the dist directory exists, if not, create it.
			await fileUtils.createDirectory(value);
		});
	}
}

module.exports = new InitiateService();