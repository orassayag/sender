class LogDataModel {
  constructor(settings) {
    // Set the parameters from the settings file.
    const { IS_LOG_RESULTS } = settings;
    this.isLogResults = IS_LOG_RESULTS;
  }
}

export default LogDataModel;
