class SourcesData {

    constructor(settings) {
        // Set the parameters from the settings file.
        const { EMAIL_ADDRESSES_SOURCE_TYPE, EMAIL_ADDRESSES_DEVELOPMENT_SOURCE_PATH,
            EMAIL_ADDRESSES_PRODUCTION_SOURCE_PATH, EMAIL_ADDRESSES_INCLUDE_FILE_NAME } = settings;
        this.emailAddressesSourceType = EMAIL_ADDRESSES_SOURCE_TYPE;
        this.emailAddressesDevelopmentSourcePath = EMAIL_ADDRESSES_DEVELOPMENT_SOURCE_PATH;
        this.emailAddressesProductionSourcePath = EMAIL_ADDRESSES_PRODUCTION_SOURCE_PATH;
        this.emailAddressesIncludeFileName = EMAIL_ADDRESSES_INCLUDE_FILE_NAME;
    }
}

module.exports = SourcesData;