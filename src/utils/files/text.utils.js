import colorUtils from './color.utils.js';
import regexUtils from './regex.utils.js';
import validationUtils from './validation.utils.js';

class TextUtils {
  constructor() {
    this.b = '===';
  }

  setLogStatus(status) {
    if (!status) {
      return '';
    }
    return `${this.b}${status}${this.b}`;
  }

  setLogStatusColored(status, color) {
    if (!status || !color) {
      return '';
    }
    const delimiter = colorUtils.createColorMessage({
      message: this.b,
      color: color,
    });
    return `${delimiter}${status}${delimiter}`;
  }

  // This method converts a given number to display comma number.
  getNumberWithCommas(number) {
    if (number <= -1 || !validationUtils.isValidNumber(number)) {
      return '';
    }
    return number.toString().replace(regexUtils.numberCommasRegex, ',');
  }

  removeLastCharacters(data) {
    const { value, charactersCount } = data;
    if (!value || !validationUtils.isValidNumber(charactersCount)) {
      return '';
    }
    return value.substring(0, value.length - charactersCount);
  }

  addBackslash(text) {
    if (!text) {
      return '';
    }
    return `${text}/`;
  }

  getBackupName(data) {
    const { applicationName, date, title, index } = data;
    return `${applicationName}_${date}-${index + 1}${title ? `-${title}` : ''}`;
  }

  // This method adds leading 0 if needed.
  addLeadingZero(number) {
    if (!validationUtils.isValidNumber(number)) {
      return '';
    }
    return number < 10 ? `0${number}` : number;
  }

  toLowerCase(text) {
    if (!text) {
      return '';
    }
    return text.toLowerCase();
  }

  getSplitNumber(text) {
    if (!text) {
      return -1;
    }
    return Number(text.split('_')[0]);
  }

  getEmailAddresses(data) {
    if (!validationUtils.isExists(data)) {
      return [];
    }
    return data.toString().match(regexUtils.findEmailAddressesRegex);
  }

  addStartDot(text) {
    return `.${text}`;
  }

  getPositiveNumber(number) {
    if (!validationUtils.isValidNumber(number)) {
      return -1;
    }
    return Math.abs(number);
  }

  getFloorPositiveNumber(number) {
    return this.addLeadingZero(this.getFloorNumber(number));
  }

  getFloorNumber(number) {
    if (!validationUtils.isValidNumber(number)) {
      return -1;
    }
    return Math.floor(number);
  }

  toLowerCaseTrim(text) {
    if (!text) {
      return '';
    }
    return text.toLowerCase().trim();
  }

  getRandomNumber(min, max) {
    return min + Math.floor((max - min) * Math.random());
  }

  getEmailAddressParts(emailAddress) {
    if (!emailAddress) {
      return '';
    }
    return emailAddress.split('@');
  }

  reverseText(text) {
    return text.split('').reverse().join('');
  }

  isEnglishKey(key) {
    return regexUtils.englishCharactersRegex.test(key);
  }

  getRandomBoolean() {
    return Math.random() >= 0.5;
  }

  // X% (first) this will be true, Y% false (second).
  getRandomBooleanByPercentage(percentage) {
    return Math.random() < percentage;
  }

  getRandomKeyFromArray(list) {
    if (!validationUtils.isExists(list)) {
      return '';
    }
    return list[Math.floor(Math.random() * list.length)];
  }

  calculatePercentageDisplay(data) {
    const { partialValue, totalValue } = data;
    if (
      !validationUtils.isValidNumber(partialValue) ||
      !validationUtils.isValidNumber(totalValue)
    ) {
      return '';
    }
    return `${this.addLeadingZero(
      ((100 * partialValue) / totalValue).toFixed(2)
    )}%`;
  }

  getNumberOfNumber(data) {
    const { number1, number2 } = data;
    if (
      !validationUtils.isValidNumber(number1) ||
      !validationUtils.isValidNumber(number2)
    ) {
      return '';
    }
    return `${this.getNumberWithCommas(number1)}/${this.getNumberWithCommas(
      number2
    )}`;
  }

  cutText(data) {
    const { text, count } = data;
    if (!text) {
      return '';
    }
    if (text.length > count) {
      return text.substring(0, count);
    }
    return text;
  }

  addBreakLine(text) {
    return `${text}\r\n`;
  }

  removeAllCharacters(text, target) {
    if (!text) {
      return '';
    }
    return text.split(target).join('');
  }

  getAsteriskCharactersString(charactersCount) {
    if (!validationUtils.isValidNumber(charactersCount)) {
      return '';
    }
    return Array(charactersCount).join('*');
  }

  shuffleArray(list) {
    if (!validationUtils.isExists(list) && list.length > 1) {
      return list;
    }
    for (let i = list.length - 1; i > 0; i--) {
      const y = Math.floor(Math.random() * (i + 1));
      [list[i], list[y]] = [list[y], list[i]];
    }
    return list;
  }
}

export default new TextUtils();
