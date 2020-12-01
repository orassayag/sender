const SendGridCode = require('../../core/models/application/files/SendGridCode');
const { SendGridReason } = require('../../core/enums/files/emailAddress.enum');

class SendGridUtils {

    constructor() {
        this.resultCodesList = {
            200: new SendGridCode({
                code: 200,
                reason: SendGridReason.OK,
                description: 'Your message is valid, but it is not queued to be delivered.',
                isSent: true
            }),
            202: new SendGridCode({
                code: 202,
                reason: SendGridReason.ACCEPTED,
                description: 'Your message is both valid, and queued to be delivered.',
                isSent: true
            }),
            400: new SendGridCode({
                code: 400,
                reason: SendGridReason.BAD_REQUEST,
                description: 'There was a problem with your request.',
                isSent: false
            }),
            401: new SendGridCode({
                code: 401,
                reason: SendGridReason.UNAUTHORIZED,
                description: 'You do not have authorization to make the request.',
                isSent: false
            }),
            403: new SendGridCode({
                code: 403,
                reason: SendGridReason.FORBIDDEN,
                description: 'There was a forbidden problem with your request.',
                isSent: false
            }),
            404: new SendGridCode({
                code: 404,
                reason: SendGridReason.NOT_FOUND,
                description: 'The resource you tried to locate could not be found or does not exist.',
                isSent: false
            }),
            405: new SendGridCode({
                code: 405,
                reason: SendGridReason.METHOD_NOT_ALLOWED,
                description: 'There was a method not allowed problem with your request.',
                isSent: false
            }),
            413: new SendGridCode({
                code: 413,
                reason: SendGridReason.PAYLOAD_TOO_LARGE,
                description: 'The JSON payload you have included in your request is too large.',
                isSent: false
            }),
            415: new SendGridCode({
                code: 415,
                reason: SendGridReason.UNSUPPORTED_MEDIA_TYPE,
                description: 'There was a method not unsupported media type problem with your request.',
                isSent: false
            }),
            429: new SendGridCode({
                code: 429,
                reason: SendGridReason.TOO_MANY_REQUESTS,
                description: 'The number of requests you have made exceeds SendGrid’s rate limitations.',
                isSent: false
            }),
            500: new SendGridCode({
                code: 500,
                reason: SendGridReason.SERVER_UNAVAILABLE,
                description: 'An error occurred on a SendGrid server.',
                isSent: false
            }),
            503: new SendGridCode({
                code: 503,
                reason: SendGridReason.SERVICE_NOT_AVAILABLE,
                description: 'The SendGrid v3 Web API is not available.',
                isSent: false
            })
        };
        this.limitExceededCode = null;
        this.sentCodesList = null;
        this.errorCodesList = null;
        this.initiate();
    }

    initiate() {
        this.sentCodesList = [];
        this.errorCodesList = [];
        const keys = Object.keys(this.resultCodesList);
        for (let i = 0; i < keys.length; i++) {
            const code = parseInt(keys[i]);
            if (i < 2) {
                this.sentCodesList.push(code);
            }
            else {
                this.errorCodesList.push(code);
            }
            // Assign the limit exceeded code.
            if (!this.limitExceededCode && this.resultCodesList[code].reason === SendGridReason.TOO_MANY_REQUESTS) {
                this.limitExceededCode = code;
            }
        }
    }
}

module.exports = new SendGridUtils();