const mongoose = require('mongoose');
const { EmailAddressModel } = require('../../core/models/mongo');
const { MongoDatabaseDataModel, MongoDatabaseResultModel } = require('../../core/models/application');
const { EmailAddressStatusEnum, StatusEnum } = require('../../core/enums');
const countLimitService = require('./countLimit.service');
const globalUtils = require('../../utils/files/global.utils');
const { systemUtils, textUtils } = require('../../utils');

class MongoDatabaseService {

    constructor() {
        this.client = null;
        this.mongoDatabaseDataModel = null;
        this.mongoConnectionString = null;
        this.mongoConnectionOptions = null;
        this.saveErrorInARowCount = 0;
    }

    async initiate(settings, mode) {
        const mongoDatabaseModeName = this.getMongoDatabaseModeName(settings, mode);
        this.mongoDatabaseDataModel = new MongoDatabaseDataModel(settings, mongoDatabaseModeName);
        this.mongoConnectionString = `${this.mongoDatabaseDataModel.mongoDatabaseConnectionString}${this.mongoDatabaseDataModel.mongoDatabaseModeName}`;
        this.mongoConnectionOptions = {
            useUnifiedTopology: this.mongoDatabaseDataModel.isMongoDatabaseUseUnifiledTopology,
            useNewUrlParser: this.mongoDatabaseDataModel.isMongoDatabaseUseNewUrlParser,
            useCreateIndex: this.mongoDatabaseDataModel.isMongoDatabaseUseCreateIndex,
            poolSize: this.mongoDatabaseDataModel.mongoDatabasePoolSizeCount,
            socketTimeoutMS: this.mongoDatabaseDataModel.mongoDatabaseSocketTimeoutMillisecondsCount,
            keepAlive: this.mongoDatabaseDataModel.mongoDatabaseKeepAliveMillisecondsCount,
            ssl: this.mongoDatabaseDataModel.isMongoDatabaseSSL,
            sslValidate: this.mongoDatabaseDataModel.isMongoDatabaseSSLValidate
        };
        await this.validateProcess();
        await this.createConnection();
        await this.testMongoDatabase();
        if (this.mongoDatabaseDataModel.isDropCollection) {
            await this.dropCollection();
        }
    }

    async validateProcess() {
        if (!await systemUtils.isProcessRunning('mongod.exe')) {
            throw new Error('The process mongod.exe no running (1000032)');
        }
    }

    async closeConnection() {
        await mongoose.connection.close();
    }

    async createConnection() {
        // Connect to the Mongo database.
        this.client = await mongoose.connect(this.mongoConnectionString, this.mongoConnectionOptions)
            .catch(error => { throw new Error(`Failed to connect to MongoDB: ${error} (1000033)`); });
        if (!this.client) {
            throw new Error('Failed to connect to MongoDB: Client is null or empty (1000034)');
        }
    }

    // Test CRUD operations to check that the Mongo database is working OK.
    async testMongoDatabase() {
        // Delete.
        await this.testMongoDatabaseDelete();
        // Create.
        const result = await this.testMongoDatabaseCreate();
        // Read.
        await this.testMongoDatabaseRead();
        // Update.
        await this.testMongoDatabaseUpdate(result);
        // Delete.
        await this.testMongoDatabaseDelete();
    }

    async testMongoDatabaseCreate() {
        return await new EmailAddressModel({ emailAddress: 'XXX' }).save();
    }

    async testMongoDatabaseRead() {
        await EmailAddressModel.findOne({ 'emailAddress': 'XXX' });
    }

    async testMongoDatabaseUpdate(result) {
        await EmailAddressModel.updateOne({ id: result._id, 'emailAddress': 'XXX' }, new EmailAddressModel({ emailAddress: 'XXY' }));
    }

    async testMongoDatabaseDelete() {
        await EmailAddressModel.deleteOne({ 'emailAddress': 'XXX' });
        await EmailAddressModel.deleteOne({ 'emailAddress': 'XXY' });
    }

    async getAllEmailAddresses() {
        return await EmailAddressModel.find();
    }

    async dropCollection() {
        for (let i = 0; i < this.mongoDatabaseDataModel.maximumDropCollectionRetriesCount; i++) {
            try {
                await this.client.connection.collection(this.mongoDatabaseDataModel.mongoDatabaseCollectionName).drop();
                break;
            }
            catch (error) { }
        }
    }

    async getEmailAddressesCount() {
        return await mongoose.connection.collection(this.mongoDatabaseDataModel.mongoDatabaseCollectionName).countDocuments();
    }

    async isEmailAddressExists(emailAddress) {
        emailAddress = emailAddress.trim();
        // Check if the email address already exists in the Mongo database.
        const emailAddressModel = await EmailAddressModel.findOne({ 'emailAddress': emailAddress });
        return emailAddressModel ? true : false;
    }

    async saveEmailAddress(emailAddress) {
        emailAddress = emailAddress.trim();
        // Validate for the second time that the email address does not already exist in the Mongo database.
        if (await this.isEmailAddressExists(emailAddress)) {
            return this.setMongoDatabaseErrorResult({
                saveError: null,
                status: EmailAddressStatusEnum.SECURITY_EXISTS,
                description: 'Email address not saved. Validation of security existence in the Mongo database.'
            });
        }
        let saveResult = null;
        for (let i = 0; i < countLimitService.countLimitDataModel.maximumSaveEmailAddressesRetriesCount; i++) {
            try {
                // Save the email address to the Mongo database.
                await new EmailAddressModel({ emailAddress: emailAddress }).save();
                saveResult = this.setMongoDatabaseSaveResult({
                    status: EmailAddressStatusEnum.SAVE,
                    description: 'Email address saved successfully.'
                });
                break;
            }
            catch (error) {
                saveResult = this.setMongoDatabaseErrorResult({
                    saveError: error,
                    status: EmailAddressStatusEnum.UNSAVE,
                    description: `Email address not saved. ${systemUtils.getErrorDetails(error)}`
                });
            }
        }
        return saveResult;
    }

    setMongoDatabaseErrorResult(data) {
        const { saveError, status, description } = data;
        const exitProgramStatus = this.getErrorInARowResult(false, saveError);
        return new MongoDatabaseResultModel({
            status: status,
            description: description,
            isSave: false,
            exitProgramStatus: exitProgramStatus
        });
    }

    setMongoDatabaseSaveResult(data) {
        const { status, description } = data;
        this.getErrorInARowResult(true, null);
        return new MongoDatabaseResultModel({
            status: status,
            description: description,
            isSave: true,
            exitProgramStatus: null
        });
    }

    getErrorInARowResult(isSave, saveError) {
        // Update the error in a row monitor counter.
        if (isSave) {
            this.saveErrorInARowCount = 0;
        }
        else if (saveError) {
            this.saveErrorInARowCount++;
        }
        // Send result accordingly.
        return this.saveErrorInARowCount >= countLimitService.countLimitDataModel.maximumSaveErrorInARowCount ? StatusEnum.SAVE_ERROR_IN_A_ROW : null;
    }

    async simulate() {
        // Simulate result.
        let saveResult = null;
        const isSave = textUtils.getRandomBooleanByPercentage(countLimitService.countLimitDataModel.simulateSaveSuccessPercentage);
        if (isSave) {
            saveResult = this.setMongoDatabaseSaveResult({
                status: EmailAddressStatusEnum.SAVE,
                description: 'Email address saved successfully.'
            });
        }
        else {
            const error = new Error('Simulate save error of the Mongo database. ');
            saveResult = this.setMongoDatabaseErrorResult({
                saveError: error,
                status: EmailAddressStatusEnum.UNSAVE,
                description: `Email address not saved. ${systemUtils.getErrorDetails(error)}`
            });
        }
        // Simulate delay of save process / error.
        await globalUtils.sleep(countLimitService.countLimitDataModel.millisecondsSimulateDelaySaveProcessCount);
        return saveResult;
    }

    getMongoDatabaseModeName(settings, mode) {
        return `${settings.MONGO_DATABASE_NAME}_${textUtils.toLowerCase(mode)}`;
    }
}

module.exports = new MongoDatabaseService();