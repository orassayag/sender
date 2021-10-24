import regexUtils from './regex.utils';

class ValidationUtils {

    constructor() { }

    // This method checks if a given value is a valid number and returns the result.
    isValidNumber(number) {
        number = Number(number);
        return !isNaN(number) && typeof number == 'number';
    }

    isValidArray(variable) {
        return Object.prototype.toString.call(variable) === '[object Array]';
    }

    isPositiveNumber(number) {
        if (!this.isValidNumber(number)) {
            return false;
        }
        return Number(number) > 0;
    }

    // This method checks if a given variable is a valid boolean and returns the result.
    isValidBoolean(boolean) {
        return typeof boolean == typeof true;
    }

    isValidDate(dateTime) {
        return dateTime instanceof Date;
    }

    isValidLink(link) {
        return regexUtils.validateLinkRegex.test(link);
    }

    isValidMongoConnectionString(mongoConnectionString) {
        return regexUtils.mongoConnectionStringRegex.test(mongoConnectionString);
    }

    isExists(list) {
        return list && list.length > 0;
    }

    isValidEmailAddress(emailAddress) {
        return regexUtils.validateEmailAddressRegex.test(emailAddress);
    }

    isValidSendGridApiKey(apiKey) {
        return apiKey.indexOf('SG.') === 0;
    }

    // This method validates that a given string exists in an array list of specific types.
    isValidEnum(data) {
        // Validate the existence and validity of the data parameters. If not exists, return false.
        if (!data || !data.enum || !data.value) {
            return false;
        }
        // Check if the value exists within a given array. Return false if not.
        return Object.values(data.enum).indexOf(data.value) > -1;
    }

    isPropertyExists(obj, fieldName) {
        return Object.prototype.hasOwnProperty.call(obj, fieldName);
    }
}

export default new ValidationUtils();