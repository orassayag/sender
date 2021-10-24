import { SendGridCodeModel } from '../../core/models/application';
import { SendGridReasonEnum } from '../../core/enums';

class SendGridUtils {

    constructor() {
        this.resultCodesList = {
            200: new SendGridCodeModel({
                code: 200,
                reason: SendGridReasonEnum.OK,
                description: 'Your message is valid, but it is not queued to be delivered.',
                isSent: true
            }),
            202: new SendGridCodeModel({
                code: 202,
                reason: SendGridReasonEnum.ACCEPTED,
                description: 'Your message is both valid, and queued to be delivered.',
                isSent: true
            }),
            400: new SendGridCodeModel({
                code: 400,
                reason: SendGridReasonEnum.BAD_REQUEST,
                description: 'There was a problem with your request.',
                isSent: false
            }),
            401: new SendGridCodeModel({
                code: 401,
                reason: SendGridReasonEnum.UNAUTHORIZED,
                description: 'You do not have authorization to make the request.',
                isSent: false
            }),
            403: new SendGridCodeModel({
                code: 403,
                reason: SendGridReasonEnum.FORBIDDEN,
                description: 'There was a forbidden problem with your request.',
                isSent: false
            }),
            404: new SendGridCodeModel({
                code: 404,
                reason: SendGridReasonEnum.NOT_FOUND,
                description: 'The resource you tried to locate could not be found or does not exist.',
                isSent: false
            }),
            405: new SendGridCodeModel({
                code: 405,
                reason: SendGridReasonEnum.METHOD_NOT_ALLOWED,
                description: 'There was a method not allowed problem with your request.',
                isSent: false
            }),
            413: new SendGridCodeModel({
                code: 413,
                reason: SendGridReasonEnum.PAYLOAD_TOO_LARGE,
                description: 'The JSON payload you have included in your request is too large.',
                isSent: false
            }),
            415: new SendGridCodeModel({
                code: 415,
                reason: SendGridReasonEnum.UNSUPPORTED_MEDIA_TYPE,
                description: 'There was a method not unsupported media type problem with your request.',
                isSent: false
            }),
            429: new SendGridCodeModel({
                code: 429,
                reason: SendGridReasonEnum.TOO_MANY_REQUESTS,
                description: 'The number of requests you have made exceeds SendGrid’s rate limitations.',
                isSent: false
            }),
            500: new SendGridCodeModel({
                code: 500,
                reason: SendGridReasonEnum.SERVER_UNAVAILABLE,
                description: 'An error occurred on a SendGrid server.',
                isSent: false
            }),
            503: new SendGridCodeModel({
                code: 503,
                reason: SendGridReasonEnum.SERVICE_NOT_AVAILABLE,
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
            if (!this.limitExceededCode && this.resultCodesList[code].reason === SendGridReasonEnum.TOO_MANY_REQUESTS) {
                this.limitExceededCode = code;
            }
        }
    }
}

export default new SendGridUtils();