const mongoose = require('mongoose');
const countLimitService = require('./countLimit.service');
const { globalUtils, systemUtils, textUtils } = require('../../utils');
const { EmailAddressStatus, Status } = require('../../core/enums');
const EmailAddressModel = require('../../core/models/mongo/EmailAddressModel');
const { MongoDatabaseData, MongoDatabaseResult } = require('../../core/models/application');

class MongoDatabaseService {

    constructor() {
        this.client = null;
        this.mongoDatabaseData = null;
        this.mongoConnectionString = null;
        this.mongoConnectionOptions = null;
        this.saveErrorInARowCount = 0;
    }

    async initiate(settings) {
        this.mongoDatabaseData = new MongoDatabaseData(settings);
        this.mongoConnectionString = `${this.mongoDatabaseData.mongoDatabaseConnectionString}${this.mongoDatabaseData.mongoDatabaseModeName}`;
        this.mongoConnectionOptions = {
            useUnifiedTopology: this.mongoDatabaseData.isMongoDatabaseUseUnifiledTopology,
            useNewUrlParser: this.mongoDatabaseData.isMongoDatabaseUseNewUrlParser,
            useCreateIndex: this.mongoDatabaseData.isMongoDatabaseUseCreateIndex,
            poolSize: this.mongoDatabaseData.mongoDatabasePoolSizeCount,
            socketTimeoutMS: this.mongoDatabaseData.mongoDatabaseSocketTimeoutMillisecondsCount,
            keepAlive: this.mongoDatabaseData.mongoDatabaseKeepAliveMillisecondsCount,
            ssl: this.mongoDatabaseData.isMongoDatabaseSSL,
            sslValidate: this.mongoDatabaseData.isMongoDatabaseSSLValidate
        };
        await this.createConnection();
        await this.testMongoDatabase();
        if (this.mongoDatabaseData.isDropCollection) {
            await this.dropCollection();
        }
    }

    async closeConnection() {
        await mongoose.connection.close();
    }

    async createConnection() {
        // Connect to the Mongo database.
        this.client = await mongoose.connect(this.mongoConnectionString, this.mongoConnectionOptions)
            .catch(error => { throw new Error(`Failed to connect to MongoDB: ${error} (1000032)`); });
        if (!this.client) {
            throw new Error('Failed to connect to MongoDB: Client is null or empty (1000033)');
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
        for (let i = 0; i < this.mongoDatabaseData.maximumDropCollectionRetriesCount; i++) {
            try {
                await this.client.connection.collection(this.mongoDatabaseData.mongoDatabaseCollectionName).drop();
                break;
            }
            catch (error) { }
        }
    }

    async getEmailAddressesCount() {
        return await mongoose.connection.collection(this.mongoDatabaseData.mongoDatabaseCollectionName).countDocuments();
    }

    async isEmailAddressExists(emailAddress) {
        emailAddress = emailAddress.trim();
        // Check if the email address already exists in the Mongo database.
        const emailAddressModel = await EmailAddressModel.findOne({ 'emailAddress': emailAddress });
        return emailAddressModel ? true : false;
    }

    async saveEmailAddress(emailAddress) {
        emailAddress = emailAddress.trim();
        // Validate for the second time that the email address not already exists in the Mongo database.
        if (await this.isEmailAddressExists(emailAddress)) {
            return this.setMongoDatabaseErrorResult({
                saveError: null,
                status: EmailAddressStatus.SECURITY_EXISTS,
                description: 'Email address not saved. Validation of security existence in the Mongo database.'
            });
        }
        let saveResult = null;
        for (let i = 0; i < countLimitService.countLimitData.maximumSaveEmailAddressesRetriesCount; i++) {
            try {
                // Save the email address to the Mongo database.
                await new EmailAddressModel({ emailAddress: emailAddress }).save();
                saveResult = this.setMongoDatabaseSaveResult({
                    status: EmailAddressStatus.SAVE,
                    description: 'Email address saved successfully.'
                });
                break;
            }
            catch (error) {
                saveResult = this.setMongoDatabaseErrorResult({
                    saveError: error,
                    status: EmailAddressStatus.UNSAVE,
                    description: `Email address not saved. ${systemUtils.getErrorDetails(error)}`
                });
            }
        }
        return saveResult;
    }

    setMongoDatabaseErrorResult(data) {
        const { saveError, status, description } = data;
        const exitProgramStatus = this.getErrorInARowResult(false, saveError);
        return new MongoDatabaseResult({
            status: status,
            description: description,
            isSave: false,
            exitProgramStatus: exitProgramStatus
        });
    }

    setMongoDatabaseSaveResult(data) {
        const { status, description } = data;
        this.getErrorInARowResult(true, null);
        return new MongoDatabaseResult({
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
        return this.saveErrorInARowCount >= countLimitService.countLimitData.maximumSaveErrorInARowCount ? Status.SAVE_ERROR_IN_A_ROW : null;
    }

    async simulate() {
        // Simulate result.
        let saveResult = null;
        const isSave = textUtils.getRandomByPercentage(countLimitService.countLimitData.simulateSaveSuccessPercentage);
        if (isSave) {
            saveResult = this.setMongoDatabaseSaveResult({
                status: EmailAddressStatus.SAVE,
                description: 'Email address saved successfully.'
            });
        }
        else {
            const error = new Error('Simulate save error of the Mongo database. ');
            saveResult = this.setMongoDatabaseErrorResult({
                saveError: error,
                status: EmailAddressStatus.UNSAVE,
                description: `Email address not saved. ${systemUtils.getErrorDetails(error)}`
            });
        }
        // Simulate delay of save process / error.
        await globalUtils.sleep(countLimitService.countLimitData.millisecondsSimulateDelaySaveProcessCount);
        return saveResult;
    }
}

module.exports = new MongoDatabaseService();