const { LogData } = require('../../core/models/application');
const { Color, EmailAddressStatusLog, StatusIcon, Placeholder } = require('../../core/enums');
const accountService = require('./account.service');
const applicationService = require('./application.service');
const countLimitService = require('./countLimit.service');
const mongoDatabaseService = require('./mongoDatabase.service');
const pathService = require('./path.service');
const sendEmailService = require('./sendEmail.service');
const sendgridService = require('./sendgrid.service');
const templateService = require('./template.service');
const { fileUtils, pathUtils, logUtils, mongoDatabaseUtils,
	textUtils, timeUtils, validationUtils } = require('../../utils');

class LogService {

	constructor() {
		this.logData = null;
		this.logInterval = null;
		// ===PATH=== //
		this.baseSessionPath = null;
		this.sessionDirectoryPath = null;
		this.emailResultsPath = null;
		this.frames = ['-', '\\', '|', '/'];
		this.i = 0;
		this.emptyValue = '##';
		this.logSeparator = '==========';
	}

	initiate(settings) {
		this.logData = new LogData(settings);
		this.initiateDirectories();
	}

	initiateDirectories() {
		// ===PATH=== //
		if (!this.logData.isLogResults) {
			return;
		}
		this.createModeDirectory();
		this.createSessionDirectory();
		this.emailResultsPath = this.createFilePath(`email_results_${Placeholder.DATE}`);
	}

	startLogProgress() {
		// Start the process for the first interval round.
		this.logInterval = setInterval(() => {
			// Update the current time of the process.
			const { time, minutes } = timeUtils.getDifferenceTimeBetweenDates({
				startDateTime: applicationService.applicationData.startDateTime,
				endDateTime: new Date()
			});
			applicationService.applicationData.time = time;
			applicationService.applicationData.minutesCount = minutes;
			// Log the status console each interval round.
			this.logProgress();
		}, countLimitService.countLimitData.millisecondsIntervalCount);
	}

	getNextDirectoryIndex() {
		const directories = fileUtils.getAllDirectories(this.baseSessionPath);
		if (!validationUtils.isExists(directories)) {
			return 1;
		}
		return Math.max(...directories.map(name => textUtils.getSplitNumber(name))) + 1;
	}

	createModeDirectory() {
		this.baseSessionPath = pathUtils.getJoinPath({
			targetPath: pathService.pathData.distPath,
			targetName: textUtils.toLowerCase(applicationService.applicationData.mode)
		});
		fileUtils.createDirectory(this.baseSessionPath);
	}

	createSessionDirectory() {
		this.sessionDirectoryPath = pathUtils.getJoinPath({
			targetPath: this.baseSessionPath,
			targetName: `${this.getNextDirectoryIndex()}_${applicationService.applicationData.logDateTime}`
		});
		fileUtils.createDirectory(this.sessionDirectoryPath);
	}

	createFilePath(fileName) {
		return pathUtils.getJoinPath({
			targetPath: this.sessionDirectoryPath ? this.sessionDirectoryPath : pathService.pathData.distPath,
			targetName: `${fileName.replace(Placeholder.DATE, applicationService.applicationData.logDateTime)}.txt`
		});
	}

	getDisplayEmailAddress(emailAddress) {
		return textUtils.cutText({ text: emailAddress, count: countLimitService.countLimitData.maximumEmailAddressCharactersDisplayCount });
	}

	logProgress() {
		const time = `${applicationService.applicationData.time} [${this.frames[this.i = ++this.i % this.frames.length]}]`;
		const currentPercentage = textUtils.calculatePercentageDisplay({ partialValue: applicationService.applicationData.currentEmailIndex, totalValue: sendEmailService.sendEmailData.totalPendingCount });
		const current = textUtils.getNumberOfNumber({ number1: applicationService.applicationData.currentEmailIndex, number2: sendEmailService.sendEmailData.totalPendingCount });
		const currentItem = `${current} (${currentPercentage})`;
		const sentCount = `${StatusIcon.V}  ${textUtils.getNumberWithCommas(sendEmailService.sendEmailData.sentCount)}`;
		const errorCount = `${StatusIcon.X}  ${textUtils.getNumberWithCommas(sendEmailService.sendEmailData.errorCount)}`;
		const accountSentPercentage = textUtils.calculatePercentageDisplay({
			partialValue: accountService.account.sentCount,
			totalValue: countLimitService.countLimitData.maximumSendGridDailyEmailsCount
		});
		const accountSent = textUtils.getNumberOfNumber({
			number1: accountService.account.sentCount,
			number2: countLimitService.countLimitData.maximumSendGridDailyEmailsCount
		});
		const accountSentItem = `${accountSent} (${accountSentPercentage})`;
		const accounts = textUtils.getNumberOfNumber({ number1: accountService.accountData.currentAccountIndex, number2: accountService.accountData.accountsList.length });
		let subjectId = this.emptyValue;
		let subjectLineDisplay = this.emptyValue;
		let textId = this.emptyValue;
		let textLineDisplay = this.emptyValue;
		let filePath = this.emptyValue;
		if (templateService.template) {
			subjectId = templateService.template.subjectId;
			subjectLineDisplay = templateService.template.subjectLineDisplay;
			textId = templateService.template.textId;
			textLineDisplay = templateService.template.textLineDisplay;
		}
		if (templateService.cvData) {
			filePath = templateService.cvData.filePath;
		}
		let resultCode = this.emptyValue;
		let status = this.emptyValue;
		let step = this.emptyValue;
		let fromEmailAddress = this.emptyValue;
		let toEmailAddress = this.emptyValue;
		let id = this.emptyValue;
		let type = this.emptyValue;
		let resultDetails = this.emptyValue;
		if (sendEmailService.email) {
			resultCode = sendEmailService.email.resultCode;
			status = EmailAddressStatusLog[sendEmailService.email.status];
			step = sendEmailService.email.step;
			fromEmailAddress = this.getDisplayEmailAddress(sendEmailService.email.fromEmailAddress || accountService.account.username);
			toEmailAddress = this.getDisplayEmailAddress(sendEmailService.email.toEmailAddress);
			id = sendEmailService.email.id;
			type = sendEmailService.email.type;
			if (sendEmailService.email.resultDetails) {
				resultDetails = textUtils.cutText({ text: sendEmailService.email.resultDetails.join(' '), count: countLimitService.countLimitData.maximumResultCharactersDisplayCount });
			}
		}
		logUtils.logProgress({
			titlesList: ['SETTINGS', 'GENERAL', 'PROCESS1', 'PROCESS2', 'PROCESS3', 'PROCESS4',
				'ACCOUNT', 'API KEY', 'TEMPLATE', 'ATTACHMENT', 'SEND', 'RESULT'],
			colorsTitlesList: [Color.BLUE, Color.BLUE, Color.BLUE, Color.BLUE, Color.BLUE, Color.BLUE,
			Color.BLUE, Color.BLUE, Color.BLUE, Color.BLUE, Color.BLUE, Color.BLUE],
			keysLists: [{
				'Mode': applicationService.applicationData.mode,
				'Method': applicationService.applicationData.method,
				'Database': mongoDatabaseService.mongoDatabaseData.mongoDatabaseModeName,
				'Drop': mongoDatabaseService.mongoDatabaseData.isDropCollection
			}, {
				'Time': time,
				'Current': currentItem,
				'Available': accountService.accountData.availableSendsCount,
				'Status': applicationService.applicationData.status
			}, {
				'Total': sendEmailService.sendEmailData.totalCount,
				'Pending': sendEmailService.sendEmailData.pendingCount,
				'Sent': sentCount,
				'Error': errorCount,
				'Exists': sendEmailService.sendEmailData.existsCount,
				'Database': sendEmailService.sendEmailData.databaseCount
			}, {
				'Save': sendEmailService.sendEmailData.saveCount,
				'Invalid': sendEmailService.sendEmailData.invalidCount,
				'Duplicate': sendEmailService.sendEmailData.duplicateCount,
				'Filter': sendEmailService.sendEmailData.filterCount,
				'Skip': sendEmailService.sendEmailData.skipCount,
				'Unsave': sendEmailService.sendEmailData.unsaveCount,
				'Identical Addresses': sendEmailService.sendEmailData.identicalAddressesCount
			}, {
				'Monitor Sent': sendEmailService.sendEmailData.monitorSentCount,
				'Security Error': sendEmailService.sendEmailData.securityErrorCount,
				'Security Exists': sendEmailService.sendEmailData.securityExistsCount,
				'Missing Field': sendEmailService.sendEmailData.missingFieldCount,
				'Invalid Status': sendEmailService.sendEmailData.invalidStatusCount
			}, {
				'Identical Status': sendEmailService.sendEmailData.identicalStatusCount,
				'Unexpected Field': sendEmailService.sendEmailData.unexpectedFieldCount,
				'Sent Error In A Row': sendgridService.sendErrorInARowCount,
				'Save Error In A Row': mongoDatabaseService.saveErrorInARowCount
			}, {
				'Id': accountService.account.id,
				'Username': accountService.account.username,
				'Password': accountService.account.asterixPassword,
				'Sent': accountSentItem,
				'Accounts': accounts
			}, {
				'#': accountService.account.apiKey
			}, {
				[`Subject (Id: ${subjectId})`]: subjectLineDisplay,
				[`Text (Id: ${textId})`]: textLineDisplay
			}, {
				'#': filePath
			}, {
				'Code': resultCode,
				'Status': status,
				'Step': step,
				'From': fromEmailAddress,
				'To': toEmailAddress,
				'Id': id,
				'Type': type
			}, {
				'#': resultDetails
			}],
			colorsLists: [
				[Color.YELLOW, Color.YELLOW, Color.YELLOW, Color.YELLOW],
				[Color.YELLOW, Color.YELLOW, Color.CYAN, Color.YELLOW],
				[Color.CYAN, Color.CYAN, Color.GREEN, Color.RED, Color.CYAN, Color.CYAN],
				[Color.GREEN, Color.RED, Color.CYAN, Color.CYAN, Color.CYAN, Color.RED, Color.CYAN],
				[Color.CYAN, Color.RED, Color.RED, Color.RED, Color.RED],
				[Color.RED, Color.RED, Color.RED, Color.RED, Color.RED],
				[Color.YELLOW, Color.YELLOW, Color.YELLOW, Color.YELLOW],
				[],
				[Color.YELLOW, Color.YELLOW],
				[],
				[Color.YELLOW, Color.YELLOW, Color.YELLOW, Color.YELLOW, Color.YELLOW, Color.YELLOW, Color.YELLOW],
				[]
			],
			nonNumericKeys: { 'Id': 'Id' },
			statusColor: Color.CYAN
		});
	}

	createEmailTemplate(email, isLog) {
		const { id, accountId, accountApiKey, fromEmailAddress, toEmailAddress, subjectId, subjectLine, subjectLineDisplay,
			textId, textLine, textLineDisplay, status, step, type, resultDateTime, resultDetails, resultCode } = email;
		const time = timeUtils.getFullTime(resultDateTime);
		const displayStatus = EmailAddressStatusLog[status];
		let displayFromEmailAddress, displayToEmailAddress, subject, text = null;
		if (isLog) {
			displayFromEmailAddress = fromEmailAddress;
			displayToEmailAddress = toEmailAddress;
			subject = subjectLine;
			text = textLine;
		}
		else {
			displayFromEmailAddress = this.getDisplayEmailAddress(fromEmailAddress);
			displayToEmailAddress = this.getDisplayEmailAddress(toEmailAddress);
			subject = subjectLineDisplay;
			text = textLineDisplay;
		}
		const displayResultDetails = resultDetails.join('\n');
		const lines = [];
		lines.push(`Time: ${time} | Code: ${resultCode} | Status: ${displayStatus} | Step: ${step} | Type: ${type}`);
		lines.push(`From: ${displayFromEmailAddress} | To: ${displayToEmailAddress} | Email Id: ${id} | Account Id: ${accountId}`);
		lines.push(`API Key: ${accountApiKey}`);
		lines.push(`Subject (Id: ${subjectId}): ${subject} | Text (Id: ${textId}): ${text}`);
		lines.push(`Result: ${displayResultDetails}`);
		lines.push(`${this.logSeparator}${isLog ? '\n' : ''}`);
		return lines.join('\n');
	}

	createStatusTemplate(data) {
		const { mongoDatabaseEmailAddressesCount, sourceEmailAddressesCount,
			sourceEmailAddressesToSendCount, mongoDatabaseEmailAddressesExistsCount } = data;
		const mongoDatabase = textUtils.getNumberWithCommas(mongoDatabaseEmailAddressesCount);
		const source = textUtils.getNumberWithCommas(sourceEmailAddressesCount);
		const toSend = textUtils.getNumberWithCommas(sourceEmailAddressesToSendCount);
		const mongoDatabaseExists = textUtils.getNumberWithCommas(mongoDatabaseEmailAddressesExistsCount);
		const percentage = textUtils.calculatePercentageDisplay({
			partialValue: mongoDatabaseEmailAddressesExistsCount,
			totalValue: sourceEmailAddressesCount
		});
		const sentOfTotal = textUtils.getNumberOfNumber({
			number1: mongoDatabaseEmailAddressesExistsCount,
			number2: sourceEmailAddressesCount
		});
		return `MONGO DATABASE: ${mongoDatabase} | SOURCE: ${source} | TO SEND: ${toSend} | MONGO DATABASE EXISTS: ${mongoDatabaseExists} | ${sentOfTotal} (${percentage})`;
	}

	async logResult(email) {
		if (!this.logData.isLogResults) {
			return;
		}
		const message = this.createEmailTemplate(email, true);
		await fileUtils.appendFile({
			targetPath: this.emailResultsPath,
			message: message
		});
	}

	createLineTemplate(title, value) {
		return textUtils.addBreakLine(`${logUtils.logColor(`${title}:`, Color.MAGENTA)} ${value}`);
	}

	createConfirmSettingsTemplate(settings) {
		const parameters = ['IS_PRODUCTION_MODE', 'IS_SEND_EMAILS', 'IS_SAVE_EMAILS', 'IS_DROP_COLLECTION',
			'IS_SKIP_LOGIC', 'IS_MONITOR_LOGIC', 'IS_LOG_RESULTS', 'IS_LOG_MODE', 'MONITOR_EMAILS_SEND_COUNT',
			'MAXIMUM_SENDGRID_DAILY_EMAILS_COUNT'];
		let settingsText = this.createLineTemplate('DATABASE', mongoDatabaseUtils.getMongoDatabaseModeName(settings));
		settingsText += Object.keys(settings).filter(s => parameters.indexOf(s) > -1)
			.map(k => this.createLineTemplate(k, settings[k])).join('');
		settingsText = textUtils.removeLastCharacter(settingsText);
		return `${textUtils.setLogStatus('IMPORTANT SETTINGS')}
${settingsText}
========================
OK to run? (y = yes)`;
	}

	close() {
		if (this.logInterval) {
			clearInterval(this.logInterval);
		}
	}
}

module.exports = new LogService();