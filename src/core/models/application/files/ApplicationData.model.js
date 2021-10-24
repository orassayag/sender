class ApplicationDataModel {

	constructor(data) {
		// Set the parameters from the settings file.
		const { settings, status, mode, logDateTime } = data;
		const { IS_PRODUCTION_MODE, IS_SEND_EMAILS, IS_SAVE_EMAILS, IS_SKIP_LOGIC, IS_MONITOR_LOGIC,
			IS_LOG_MODE, VALIDATION_CONNECTION_LINK, DEFAULT_ERROR_CODE } = settings;
		this.isProductionMode = IS_PRODUCTION_MODE;
		this.isSendEmails = IS_SEND_EMAILS;
		this.isSaveEmails = IS_SAVE_EMAILS;
		this.isSkipLogic = IS_SKIP_LOGIC;
		this.isMonitorLogic = IS_MONITOR_LOGIC;
		this.isLogMode = IS_LOG_MODE;
		this.method = null;
		this.mode = mode;
		this.validationConnectionLink = VALIDATION_CONNECTION_LINK;
		this.status = status;
		this.startDateTime = null;
		this.time = null;
		this.logDateTime = logDateTime;
		this.defaultErrorCode = DEFAULT_ERROR_CODE;
		this.currentEmailIndex = 0;
	}
}

export default ApplicationDataModel;