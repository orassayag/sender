class MongoDatabaseDataModel {

	constructor(settings, mongoDatabaseModeName) {
		// Set the parameters from the settings file.
		const { IS_DROP_COLLECTION, MONGO_DATABASE_CONNECTION_STRING, MONGO_DATABASE_NAME, MONGO_DATABASE_COLLECTION_NAME,
			MAXIMUM_DROP_COLLECTION_RETRIES_COUNT, MONGO_DATABASE_SOCKET_TIMEOUT_MILLISECONDS_COUNT,
			MONGO_DATABASE_KEEP_ALIVE, IS_MONGO_DATABASE_SSL, IS_MONGO_DATABASE_SSL_VALIDATE } = settings;
		this.isDropCollection = IS_DROP_COLLECTION;
		this.mongoDatabaseConnectionString = MONGO_DATABASE_CONNECTION_STRING;
		this.mongoDatabaseName = MONGO_DATABASE_NAME;
		this.mongoDatabaseCollectionName = MONGO_DATABASE_COLLECTION_NAME;
		this.mongoDatabaseModeName = mongoDatabaseModeName;
		this.maximumDropCollectionRetriesCount = MAXIMUM_DROP_COLLECTION_RETRIES_COUNT;
		this.mongoDatabaseSocketTimeoutMillisecondsCount = MONGO_DATABASE_SOCKET_TIMEOUT_MILLISECONDS_COUNT;
		this.mongoDatabaseKeepAlive = MONGO_DATABASE_KEEP_ALIVE;
		this.isMongoDatabaseSSL = IS_MONGO_DATABASE_SSL;
		this.isMongoDatabaseSSLValidate = IS_MONGO_DATABASE_SSL_VALIDATE;
	}
}

export default MongoDatabaseDataModel;