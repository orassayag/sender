class SendGridResultModel {
  constructor(data) {
    const {
      sendError,
      code,
      reason,
      description,
      isSent,
      isRetrySend,
      exitProgramStatus,
    } = data;
    this.sendError = sendError;
    this.code = code;
    this.reason = reason;
    this.description = description;
    this.isSent = isSent;
    this.isRetrySend = isRetrySend;
    this.exitProgramStatus = exitProgramStatus;
  }
}

export default SendGridResultModel;
