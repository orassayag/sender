const textUtils = require('./text.utils');
const validationUtils = require('./validation.utils');

class TimeUtils {

    constructor() { }

    getFullTime(date) {
        return `${this.getHours(date)}:${this.getMinutes(date)}:${this.getSeconds(date)}`;
    }

    getDateNoSpaces() {
        const date = new Date();
        return [textUtils.addLeadingZero(date.getDate()), this.getMonth(date), this.getYear(date)].join('');
    }

    getFullDateNoSpaces() {
        const date = new Date();
        return `${[this.getDay(date), this.getMonth(date), this.getYear(date)].join('')}_${[this.getHours(date), this.getMinutes(date), this.getSeconds(date)].join('')}`;
    }

    getFullDateTime(date) {
        return `${[this.getDay(date), this.getMonth(date), this.getYear(date)].join('/')} ${this.getHours(date)}:${this.getMinutes(date)}:${this.getSeconds(date)}:${this.getMilliseconds(date)}`;
    }

    getMilliseconds(date) {
        return textUtils.addLeadingZero(date.getMilliseconds());
    }

    getSeconds(date) {
        return textUtils.addLeadingZero(date.getSeconds());
    }

    getMinutes(date) {
        return textUtils.addLeadingZero(date.getMinutes());
    }

    getHours(date) {
        return textUtils.addLeadingZero(date.getHours());
    }

    getDay(date) {
        return textUtils.addLeadingZero(date.getDate());
    }

    getMonth(date) {
        return textUtils.addLeadingZero(date.getMonth() + 1);
    }

    getYear(date) {
        return date.getFullYear();
    }

    getDifferenceTimeBetweenDates(data) {
        const { startDateTime, endDateTime } = data;
        if (!validationUtils.isValidDate(startDateTime) || !validationUtils.isValidDate(endDateTime)) {
            return null;
        }
        // Get the total time.
        const totalTime = textUtils.getPositiveNumber(endDateTime - startDateTime);
        // Get total seconds between the times.
        let delta = totalTime / 1000;
        // Calculate (and subtract) whole days.
        const days = textUtils.getFloorPositiveNumber(delta / 86400);
        delta -= days * 86400;
        // Calculate (and subtract) whole hours.
        const hours = textUtils.getFloorPositiveNumber((delta / 3600) % 24);
        delta -= hours * 3600;
        // Calculate (and subtract) whole minutes.
        const minutes = textUtils.getFloorPositiveNumber((delta / 60) % 60);
        delta -= minutes * 60;
        // What's left is seconds.
        // In theory the modulus is not required.
        const seconds = textUtils.getFloorPositiveNumber(delta % 60);
        return {
            time: `${days}.${hours}:${minutes}:${seconds}`,
            minutes: parseInt(totalTime / 60000)
        };
    }
}

module.exports = new TimeUtils();