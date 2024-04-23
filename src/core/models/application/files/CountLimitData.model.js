class CountLimitDataModel {
  constructor(settings) {
    // Set the parameters from the settings file.
    const {
      MAXIMUM_SEND_EMAILS,
      MILLISECONDS_SEND_EMAIL_DELAY_COUNT,
      MILLISECONDS_SEND_TIMEOUT,
      MILLISECONDS_INTERVAL_COUNT,
      MAXIMUM_SAVE_EMAIL_ADDRESS_RETRIES_COUNT,
      MAXIMUM_UNIQUE_DOMAIN_COUNT,
      MONITOR_EMAILS_SEND_COUNT,
      MAXIMUM_MONITOR_EMAIL_ADDRESSES,
      MAXIMUM_DISPLAY_TEMPLATE_CHARACTERS_COUNT,
      SIMULATE_SEND_SUCCESS_PERCENTAGE,
      SIMULATE_SAVE_SUCCESS_PERCENTAGE,
      MILLISECONDS_SIMULATE_DELAY_SEND_PROCESS_COUNT,
      MILLISECONDS_SIMULATE_DELAY_SAVE_PROCESS_COUNT,
      MAXIMUM_SEND_ERROR_IN_A_ROW_COUNT,
      MAXIMUM_SAVE_ERROR_IN_A_ROW_COUNT,
      MAXIMUM_EMAIL_ADDRESS_CHARACTERS_DISPLAY_COUNT,
      MAXIMUM_RESULT_CHARACTERS_DISPLAY_COUNT,
      MAXIMUM_FILE_SIZE_MEGABYTES,
      MAXIMUM_SENDGRID_DAILY_EMAILS_COUNT,
      MAXIMUM_URL_VALIDATION_COUNT,
      MILLISECONDS_TIMEOUT_URL_VALIDATION,
    } = settings;
    this.maximumSendEmails = MAXIMUM_SEND_EMAILS;
    this.millisecondsSendEmailDelayCount = MILLISECONDS_SEND_EMAIL_DELAY_COUNT;
    this.millisecondsSendTimeout = MILLISECONDS_SEND_TIMEOUT;
    this.millisecondsIntervalCount = MILLISECONDS_INTERVAL_COUNT;
    this.maximumSaveEmailAddressesRetriesCount =
      MAXIMUM_SAVE_EMAIL_ADDRESS_RETRIES_COUNT;
    this.maximumUniqueDomainCount = MAXIMUM_UNIQUE_DOMAIN_COUNT;
    this.monitorEmailsSendCount = MONITOR_EMAILS_SEND_COUNT;
    this.maximumMonitorEmailAddresses = MAXIMUM_MONITOR_EMAIL_ADDRESSES;
    this.maximumDisplayTemplateCharactersCount =
      MAXIMUM_DISPLAY_TEMPLATE_CHARACTERS_COUNT;
    this.simulateSendSuccessPercentage = SIMULATE_SEND_SUCCESS_PERCENTAGE;
    this.simulateSaveSuccessPercentage = SIMULATE_SAVE_SUCCESS_PERCENTAGE;
    this.millisecondsSimulateDelaySendProcessCount =
      MILLISECONDS_SIMULATE_DELAY_SEND_PROCESS_COUNT;
    this.millisecondsSimulateDelaySaveProcessCount =
      MILLISECONDS_SIMULATE_DELAY_SAVE_PROCESS_COUNT;
    this.maximumSendErrorInARowCount = MAXIMUM_SEND_ERROR_IN_A_ROW_COUNT;
    this.maximumSaveErrorInARowCount = MAXIMUM_SAVE_ERROR_IN_A_ROW_COUNT;
    this.maximumEmailAddressCharactersDisplayCount =
      MAXIMUM_EMAIL_ADDRESS_CHARACTERS_DISPLAY_COUNT;
    this.maximumResultCharactersDisplayCount =
      MAXIMUM_RESULT_CHARACTERS_DISPLAY_COUNT;
    this.maximumFileSizeMegabytes = MAXIMUM_FILE_SIZE_MEGABYTES;
    this.maximumSendGridDailyEmailsCount = MAXIMUM_SENDGRID_DAILY_EMAILS_COUNT;
    this.maximumURLValidationCount = MAXIMUM_URL_VALIDATION_COUNT;
    this.millisecondsTimeoutURLValidation = MILLISECONDS_TIMEOUT_URL_VALIDATION;
  }
}

export default CountLimitDataModel;
