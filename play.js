const validator = {
  string: function (input) {
    if (this[this.preVar].has(input)) {
      return input;
    }
    throw new Error(input + ' is not a valid ' + this.preVar);
  },
  variable: function (inputVar, data) {
    if (!this[inputVar]) {
      throw new Error(inputVar + ' is invalid');
    }
    this.preVar = inputVar;
    return data[inputVar];
  },
  number: function (input) {
    if (this[this.preVar].has(input)) {
      return Number(input);
    }
    throw new Error(input + ' is not a valid ' + this.preVar);
  },
  array: function (input) {
    var self = this;
    return input.map(function (item) {
      return self.string(item);
    });
  },
  date: function (input) {
    try{
      var result = new Date(input);
      if (isNaN(result.getDate())) throw new Error('bad date format');
      return result;
    } catch (e){
      throw new Error(input + ' is not a valid date');
    }
  },
  in: function (data, array) {
    if (typeof array === 'string') {
      throw new Error(array + ' is not an array!');
    }
    return array.indexOf(data) !== -1;
  },
  not_in: function (data, array) {
    if (typeof array === 'string'){
      throw new Error(array + ' is not an array!');
    }
    return array.indexOf(data) === -1;
  },
  compare: function (left, operator, right) {
    if (typeof right === 'boolean') {
      return right;
    }
    if (Array.isArray(right)) {
      throw new Error(right + ' is an array, cannot be compared');
    }
    switch (operator) {
      case '=':
        return left === right;
      case '<>':
        return left !== right;
      case '<':
        return left < right;
      case '<=':
        return left <= right;
      case '>':
        return left > right;
      case '>=':
        return left >= right;
      default:
        return false;
    }
  },
  preVar: null,
  app: new Set(['tubitv']),
  country: new Set(['AF', 'AX', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BQ', 'BA', 'BW', 'BV', 'BR', 'IO', 'BN', 'BG', 'BF', 'BI', 'KH', 'CM', 'CA', 'CV', 'KY', 'CF', 'TD', 'CL', 'CN', 'CX', 'CC', 'CO', 'KM', 'CG', 'CD', 'CK', 'CR', 'CI', 'HR', 'CU', 'CW', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'ET', 'FK', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'TF', 'GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW', 'GY', 'HT', 'HM', 'VA', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IM', 'IL', 'IT', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MO', 'MK', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE', 'NG', 'NU', 'NF', 'MP', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PN', 'PL', 'PT', 'PR', 'QA', 'RE', 'RO', 'RU', 'RW', 'BL', 'SH', 'KN', 'LC', 'MF', 'PM', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'GS', 'SS', 'ES', 'LK', 'SD', 'SR', 'SJ', 'SZ', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TK', 'TO', 'TT', 'TN', 'TR', 'TM', 'TC', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UM', 'UY', 'UZ', 'VU', 'VE', 'VN', 'VG', 'VI', 'WF', 'EH', 'YE', 'ZM', 'ZW']),
  platform: new Set(['ios', 'iphone', 'ipad', 'amazon', 'xboxone', 'xbox360', 'web', 'roku', 'samsung'])
};

var fs = require("fs");
var jison = require("jison");

var bnf = fs.readFileSync("rule.jison", "utf8");
var parser = new jison.Parser(bnf);

var output = parser.parse('app in ["tubitv"] and country = "US"', { app: 'tubitv', country: "US" }, validator);

console.log(output);