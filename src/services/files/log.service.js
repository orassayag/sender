import { LogDataModel } from '../../core/models/application/index.js';
import {
  ColorEnum,
  EmailAddressStatusLogEnum,
  StatusIconEnum,
  PlaceholderEnum,
} from '../../core/enums/index.js';
import accountService from './account.service.js';
import applicationService from './application.service.js';
import countLimitService from './countLimit.service.js';
import mongoDatabaseService from './mongoDatabase.service.js';
import pathService from './path.service.js';
import sendEmailService from './sendEmail.service.js';
import sendgridService from './sendgrid.service.js';
import templateService from './template.service.js';
import {
  fileUtils,
  pathUtils,
  logUtils,
  textUtils,
  timeUtils,
  validationUtils,
} from '../../utils/index.js';

class LogService {
  constructor() {
    this.logDataModel = null;
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
    this.logDataModel = new LogDataModel(settings);
    this.initiateDirectories();
  }

  initiateDirectories() {
    // ===PATH=== //
    if (!this.logDataModel.isLogResults) {
      return;
    }
    this.createModeDirectory();
    this.createSessionDirectory();
    this.emailResultsPath = this.createFilePath(
      `email_results_${PlaceholderEnum.DATE}`
    );
  }

  startLogProgress() {
    // Start the process for the first interval round.
    this.logInterval = setInterval(() => {
      // Update the current time of the process.
      const { time, minutes } = timeUtils.getDifferenceTimeBetweenDates({
        startDateTime: applicationService.applicationDataModel.startDateTime,
        endDateTime: timeUtils.getCurrentDate(),
      });
      applicationService.applicationDataModel.time = time;
      applicationService.applicationDataModel.minutesCount = minutes;
      // Log the status console each interval round.
      this.logProgress();
    }, countLimitService.countLimitDataModel.millisecondsIntervalCount);
  }

  getNextDirectoryIndex() {
    const directories = fileUtils.getAllDirectories(this.baseSessionPath);
    if (!validationUtils.isExists(directories)) {
      return 1;
    }
    return (
      Math.max(...directories.map((name) => textUtils.getSplitNumber(name))) + 1
    );
  }

  createModeDirectory() {
    this.baseSessionPath = pathUtils.getJoinPath({
      targetPath: pathService.pathDataModel.distPath,
      targetName: textUtils.toLowerCase(
        applicationService.applicationDataModel.mode
      ),
    });
    fileUtils.createDirectory(this.baseSessionPath);
  }

  createSessionDirectory() {
    this.sessionDirectoryPath = pathUtils.getJoinPath({
      targetPath: this.baseSessionPath,
      targetName: `${this.getNextDirectoryIndex()}_${
        applicationService.applicationDataModel.logDateTime
      }`,
    });
    fileUtils.createDirectory(this.sessionDirectoryPath);
  }

  createFilePath(fileName) {
    return pathUtils.getJoinPath({
      targetPath: this.sessionDirectoryPath
        ? this.sessionDirectoryPath
        : pathService.pathDataModel.distPath,
      targetName: `${fileName.replace(
        PlaceholderEnum.DATE,
        applicationService.applicationDataModel.logDateTime
      )}.txt`,
    });
  }

  getDisplayEmailAddress(emailAddress) {
    return textUtils.cutText({
      text: emailAddress,
      count:
        countLimitService.countLimitDataModel
          .maximumEmailAddressCharactersDisplayCount,
    });
  }

  logProgress() {
    const time = `${applicationService.applicationDataModel.time} [${
      this.frames[(this.i = ++this.i % this.frames.length)]
    }]`;
    const currentPercentage = textUtils.calculatePercentageDisplay({
      partialValue: applicationService.applicationDataModel.currentEmailIndex,
      totalValue: sendEmailService.sendEmailDataModel.totalPendingCount,
    });
    const current = textUtils.getNumberOfNumber({
      number1: applicationService.applicationDataModel.currentEmailIndex,
      number2: sendEmailService.sendEmailDataModel.totalPendingCount,
    });
    const currentItem = `${current} (${currentPercentage})`;
    const sentCount = `${StatusIconEnum.V}  ${textUtils.getNumberWithCommas(
      sendEmailService.sendEmailDataModel.sentCount
    )}`;
    const errorCount = `${StatusIconEnum.X}  ${textUtils.getNumberWithCommas(
      sendEmailService.sendEmailDataModel.errorCount
    )}`;
    const accountSentPercentage = textUtils.calculatePercentageDisplay({
      partialValue: accountService.account.sentCount,
      totalValue:
        countLimitService.countLimitDataModel.maximumSendGridDailyEmailsCount,
    });
    const accountSent = textUtils.getNumberOfNumber({
      number1: accountService.account.sentCount,
      number2:
        countLimitService.countLimitDataModel.maximumSendGridDailyEmailsCount,
    });
    const accountSentItem = `${accountSent} (${accountSentPercentage})`;
    const accounts = textUtils.getNumberOfNumber({
      number1: accountService.accountDataModel.currentAccountIndex,
      number2: accountService.accountDataModel.accountsList.length,
    });
    let subjectId = this.emptyValue;
    let subjectLineDisplay = this.emptyValue;
    let textId = this.emptyValue;
    let textLineDisplay = this.emptyValue;
    let filePath = this.emptyValue;
    if (templateService.templateModel) {
      subjectId = templateService.templateModel.subjectId;
      subjectLineDisplay = templateService.templateModel.subjectLineDisplay;
      textId = templateService.templateModel.textId;
      textLineDisplay = templateService.templateModel.textLineDisplay;
    }
    if (templateService.cvDataModel) {
      filePath = templateService.cvDataModel.filePath;
    }
    let resultCode = this.emptyValue;
    let status = this.emptyValue;
    let step = this.emptyValue;
    let fromEmailAddress = this.emptyValue;
    let toEmailAddress = this.emptyValue;
    let id = this.emptyValue;
    let type = this.emptyValue;
    let resultDetails = this.emptyValue;
    if (sendEmailService.emailModel) {
      resultCode = sendEmailService.emailModel.resultCode;
      status = EmailAddressStatusLogEnum[sendEmailService.emailModel.status];
      step = sendEmailService.emailModel.step;
      fromEmailAddress = this.getDisplayEmailAddress(
        sendEmailService.emailModel.fromEmailAddress ||
          accountService.account.username
      );
      toEmailAddress = this.getDisplayEmailAddress(
        sendEmailService.emailModel.toEmailAddress
      );
      id = sendEmailService.emailModel.id;
      type = sendEmailService.emailModel.type;
      if (sendEmailService.emailModel.resultDetails) {
        resultDetails = textUtils.cutText({
          text: sendEmailService.emailModel.resultDetails.join(' '),
          count:
            countLimitService.countLimitDataModel
              .maximumResultCharactersDisplayCount,
        });
      }
    }
    logUtils.logProgress({
      titlesList: [
        'SETTINGS',
        'GENERAL',
        'PROCESS1',
        'PROCESS2',
        'PROCESS3',
        'PROCESS4',
        'ACCOUNT',
        'API KEY',
        'TEMPLATE',
        'ATTACHMENT',
        'SEND',
        'RESULT',
      ],
      colorsTitlesList: [
        ColorEnum.BLUE,
        ColorEnum.BLUE,
        ColorEnum.BLUE,
        ColorEnum.BLUE,
        ColorEnum.BLUE,
        ColorEnum.BLUE,
        ColorEnum.BLUE,
        ColorEnum.BLUE,
        ColorEnum.BLUE,
        ColorEnum.BLUE,
        ColorEnum.BLUE,
        ColorEnum.BLUE,
      ],
      keysLists: [
        {
          Mode: applicationService.applicationDataModel.mode,
          Method: applicationService.applicationDataModel.method,
          Database:
            mongoDatabaseService.mongoDatabaseDataModel.mongoDatabaseModeName,
          Drop: mongoDatabaseService.mongoDatabaseDataModel.isDropCollection,
        },
        {
          Time: time,
          Current: currentItem,
          Available: accountService.accountDataModel.availableSendsCount,
          Status: applicationService.applicationDataModel.status,
        },
        {
          Total: sendEmailService.sendEmailDataModel.totalCount,
          Pending: sendEmailService.sendEmailDataModel.pendingCount,
          Sent: sentCount,
          Error: errorCount,
          Exists: sendEmailService.sendEmailDataModel.existsCount,
          Database: sendEmailService.sendEmailDataModel.databaseCount,
        },
        {
          Save: sendEmailService.sendEmailDataModel.saveCount,
          Invalid: sendEmailService.sendEmailDataModel.invalidCount,
          Duplicate: sendEmailService.sendEmailDataModel.duplicateCount,
          Filter: sendEmailService.sendEmailDataModel.filterCount,
          Skip: sendEmailService.sendEmailDataModel.skipCount,
          Unsave: sendEmailService.sendEmailDataModel.unsaveCount,
          'Identical Addresses':
            sendEmailService.sendEmailDataModel.identicalAddressesCount,
        },
        {
          'Monitor Sent': sendEmailService.sendEmailDataModel.monitorSentCount,
          'Security Error':
            sendEmailService.sendEmailDataModel.securityErrorCount,
          'Security Exists':
            sendEmailService.sendEmailDataModel.securityExistsCount,
          'Missing Field':
            sendEmailService.sendEmailDataModel.missingFieldCount,
          'Invalid Status':
            sendEmailService.sendEmailDataModel.invalidStatusCount,
        },
        {
          'Identical Status':
            sendEmailService.sendEmailDataModel.identicalStatusCount,
          'Unexpected Field':
            sendEmailService.sendEmailDataModel.unexpectedFieldCount,
          'Sent Error In A Row': sendgridService.sendErrorInARowCount,
          'Save Error In A Row': mongoDatabaseService.saveErrorInARowCount,
        },
        {
          Id: accountService.account.id,
          Username: accountService.account.username,
          Password: accountService.account.asterixPassword,
          Sent: accountSentItem,
          Accounts: accounts,
        },
        {
          '#': accountService.account.apiKey,
        },
        {
          [`Subject (Id: ${subjectId})`]: subjectLineDisplay,
          [`Text (Id: ${textId})`]: textLineDisplay,
        },
        {
          '#': filePath,
        },
        {
          Code: resultCode,
          Status: status,
          Step: step,
          From: fromEmailAddress,
          To: toEmailAddress,
          Id: id,
          Type: type,
        },
        {
          '#': resultDetails,
        },
      ],
      colorsLists: [
        [
          ColorEnum.YELLOW,
          ColorEnum.YELLOW,
          ColorEnum.YELLOW,
          ColorEnum.YELLOW,
        ],
        [ColorEnum.YELLOW, ColorEnum.YELLOW, ColorEnum.CYAN, ColorEnum.YELLOW],
        [
          ColorEnum.CYAN,
          ColorEnum.CYAN,
          ColorEnum.GREEN,
          ColorEnum.RED,
          ColorEnum.CYAN,
          ColorEnum.CYAN,
        ],
        [
          ColorEnum.GREEN,
          ColorEnum.RED,
          ColorEnum.CYAN,
          ColorEnum.CYAN,
          ColorEnum.CYAN,
          ColorEnum.RED,
          ColorEnum.CYAN,
        ],
        [
          ColorEnum.CYAN,
          ColorEnum.RED,
          ColorEnum.RED,
          ColorEnum.RED,
          ColorEnum.RED,
        ],
        [
          ColorEnum.RED,
          ColorEnum.RED,
          ColorEnum.RED,
          ColorEnum.RED,
          ColorEnum.RED,
        ],
        [
          ColorEnum.YELLOW,
          ColorEnum.YELLOW,
          ColorEnum.YELLOW,
          ColorEnum.YELLOW,
        ],
        [],
        [ColorEnum.YELLOW, ColorEnum.YELLOW],
        [],
        [
          ColorEnum.YELLOW,
          ColorEnum.YELLOW,
          ColorEnum.YELLOW,
          ColorEnum.YELLOW,
          ColorEnum.YELLOW,
          ColorEnum.YELLOW,
          ColorEnum.YELLOW,
        ],
        [],
      ],
      nonNumericKeys: { Id: 'Id' },
      statusColor: ColorEnum.CYAN,
    });
  }

  createEmailTemplate(emailModel, isLog) {
    const {
      id,
      accountId,
      accountApiKey,
      fromEmailAddress,
      toEmailAddress,
      subjectId,
      subjectLine,
      subjectLineDisplay,
      textId,
      textLine,
      textLineDisplay,
      status,
      step,
      type,
      resultDateTime,
      resultDetails,
      resultCode,
    } = emailModel;
    const time = timeUtils.getFullTime(resultDateTime);
    const displayStatus = EmailAddressStatusLogEnum[status];
    let displayFromEmailAddress,
      displayToEmailAddress,
      subject,
      text = null;
    if (isLog) {
      displayFromEmailAddress = fromEmailAddress;
      displayToEmailAddress = toEmailAddress;
      subject = subjectLine;
      text = textLine;
    } else {
      displayFromEmailAddress = this.getDisplayEmailAddress(fromEmailAddress);
      displayToEmailAddress = this.getDisplayEmailAddress(toEmailAddress);
      subject = subjectLineDisplay;
      text = textLineDisplay;
    }
    const displayResultDetails = resultDetails.join('\n');
    const lines = [];
    lines.push(
      `Time: ${time} | Code: ${resultCode} | Status: ${displayStatus} | Step: ${step} | Type: ${type}`
    );
    lines.push(
      `From: ${displayFromEmailAddress} | To: ${displayToEmailAddress} | Email Id: ${id} | Account Id: ${accountId}`
    );
    lines.push(`API Key: ${accountApiKey}`);
    lines.push(
      `Subject (Id: ${subjectId}): ${subject} | Text (Id: ${textId}): ${text}`
    );
    lines.push(`Result: ${displayResultDetails}`);
    lines.push(`${this.logSeparator}${isLog ? '\n' : ''}`);
    return lines.join('\n');
  }

  createStatusTemplate(data) {
    const {
      mongoDatabaseEmailAddressesCount,
      sourceEmailAddressesCount,
      sourceEmailAddressesToSendCount,
      mongoDatabaseEmailAddressesExistsCount,
    } = data;
    const mongoDatabase = textUtils.getNumberWithCommas(
      mongoDatabaseEmailAddressesCount
    );
    const source = textUtils.getNumberWithCommas(sourceEmailAddressesCount);
    const toSend = textUtils.getNumberWithCommas(
      sourceEmailAddressesToSendCount
    );
    const mongoDatabaseExists = textUtils.getNumberWithCommas(
      mongoDatabaseEmailAddressesExistsCount
    );
    const percentage = textUtils.calculatePercentageDisplay({
      partialValue: mongoDatabaseEmailAddressesExistsCount,
      totalValue: sourceEmailAddressesCount,
    });
    const sentOfTotal = textUtils.getNumberOfNumber({
      number1: mongoDatabaseEmailAddressesExistsCount,
      number2: sourceEmailAddressesCount,
    });
    return `MONGO DATABASE: ${mongoDatabase} | SOURCE: ${source} | TO SEND: ${toSend} | MONGO DATABASE EXISTS: ${mongoDatabaseExists} | ${sentOfTotal} (${percentage})`;
  }

  async logResult(emailModel) {
    if (!this.logDataModel.isLogResults) {
      return;
    }
    const message = this.createEmailTemplate(emailModel, true);
    await fileUtils.appendFile({
      targetPath: this.emailResultsPath,
      message: message,
    });
  }

  createLineTemplate(title, value) {
    return textUtils.addBreakLine(
      `${logUtils.logColor(`${title}:`, ColorEnum.MAGENTA)} ${value}`
    );
  }

  createConfirmSettingsTemplate(settings, mode) {
    const mongoDatabaseModeName = mongoDatabaseService.getMongoDatabaseModeName(
      settings,
      mode
    );
    const parameters = [
      'IS_PRODUCTION_MODE',
      'IS_SEND_EMAILS',
      'IS_SAVE_EMAILS',
      'IS_DROP_COLLECTION',
      'IS_SKIP_LOGIC',
      'IS_MONITOR_LOGIC',
      'IS_LOG_RESULTS',
      'IS_LOG_MODE',
      'MONITOR_EMAILS_SEND_COUNT',
      'MAXIMUM_SENDGRID_DAILY_EMAILS_COUNT',
    ];
    let settingsText = this.createLineTemplate(
      'DATABASE',
      mongoDatabaseModeName
    );
    settingsText += Object.keys(settings)
      .filter((s) => parameters.indexOf(s) > -1)
      .map((k) => this.createLineTemplate(k, settings[k]))
      .join('');
    settingsText = textUtils.removeLastCharacters({
      value: settingsText,
      charactersCount: 1,
    });
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

export default new LogService();
