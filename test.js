const rule = new require('./index');
const parser = new rule.Parser();

const test = require('ava').test;

test('simple expression should work', t => {
  const v1 = parser.parse('str = "world"', { str: 'world' });
  const v2 = parser.parse('num <> 1', { num: 2 });
  const v3 = parser.parse('date > 01/01/2016', { date: new Date() });
  const v4 = parser.parse('num > 10', { num: 10 });
  const v5 = parser.parse('date > 11/11/2016', { date: new Date() });
  t.true(v1);
  t.true(v2);
  t.true(v3);
  t.false(v4);
  t.false(v5);
});

test('and, or, not works', t => {
  const v1 = parser.parse('str = "world" and num <> 1', { str: 'world', num: 2 });
  const v2 = parser.parse('date > 01/01/2017 or num > 10', { date: new Date(), num: 20 });
  const v3 = parser.parse('not num > 10', { num: 10 });

  const v4 = parser.parse('(str = "world") and (num <> 1)', { str: 'world', num: 2 });
  const v5 = parser.parse('date > 01/01/2017 or (num > 10)', { date: new Date(), num: 20 });
  const v6 = parser.parse('not (num > 10)', { num: 10 });
  const v7 = parser.parse(
    'not (num > 10) and (date > 01/01/2017) or (num > 10)',
    { num: 10, date: new Date(), num: 20 }
  );

  t.true(v1);
  t.true(v2);
  t.true(v3);
  t.true(v4);
  t.true(v5);
  t.true(v6);
  t.true(v7);
});

test('boolean should work', t => {
  const v1 = parser.parse('str = true', { str: 'world' });
  const v2 = parser.parse('str = false', { str: 'new string' });
  const v3 = parser.parse('str = false and date < 01/01/2050', { str: 'new string', date: new Date()});
  const v4 = parser.parse('str = true and date < 01/01/2050', { str: 'new string', date: new Date()});
  t.true(v1);
  t.false(v2);
  t.false(v3);
  t.true(v4);
});

test('in works', t => {
  const expr = 'str in ["a", "b",     "c", "d", "e"]';
  const v1 = parser.parse(expr, {str: 'a'});
  const v2 = parser.parse(expr, {str: 'e'});
  const v3 = parser.parse(expr, {str: 'x'});
  const v4 = parser.parse(`not ${expr}`, {str: 'x'});
  const v5 = parser.parse('str not in ["a","b","c"]', {str: 'x'});
  const v6 = parser.parse('str not in ["a","b","c"]', {str: 'a'});

  t.true(v1);
  t.true(v2);
  t.false(v3);
  t.true(v4);
  t.true(v5);
  t.false(v6);
});

test('validator works', t => {

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
      try {
        var result = new Date(input);
        if (isNaN(result.getDate())) throw new Error('bad date format');
        return result;
      } catch (e){
        throw new Error(input + ' is not a valid date');
      }
    },
    in: function (data, array) {
      if (typeof array === 'string') {
        throw new Error(array + ' is not an array');
      }
      return array.indexOf(data) !== -1;
    },
    not_in: function (data, array) {
      if (typeof array === 'string'){
        throw new Error(array + ' is not an array');
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
    country: new Set(['AF', 'AX', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BQ', 'BA', 'BW', 'BV', 'BR', 'IO', 'BN', 'BG', 'BF', 'BI', 'KH', 'CM', 'CA', 'CV', 'KY', 'CF', 'TD', 'CL', 'CN', 'CX', 'CC', 'CO', 'KM', 'CG', 'CD', 'CK', 'CR', 'CI', 'HR', 'CU', 'CW', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'ET', 'FK', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'TF', 'GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW', 'GY', 'HT', 'HM', 'VA', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IM', 'IL', 'IT', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MO', 'MK', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE', 'NG', 'NU', 'NF', 'MP', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PN', 'PL', 'PT', 'PR', 'QA', 'RE', 'RO', 'RU', 'RW', 'BL', 'SH', 'KN', 'LC', 'MF', 'PM', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'GS', 'SS', 'ES', 'LK', 'SD', 'SR', 'SJ', 'SZ', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TK', 'TO', 'TT', 'TN', 'TR', 'TM', 'TC', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UM', 'UY', 'UZ', 'VU', 'VE', 'VN', 'VG', 'VI', 'WF', 'EH', 'YE', 'ZM', 'ZW']),
    platform: new Set(['ios', 'iphone', 'ipad', 'amazon', 'xboxone', 'xbox360', 'web', 'roku', 'samsung'])
  };

  const testFn1 = function () {
    try {
      parser.parse('country in ["AAAA","CA"] and date > 04/01/2016', {
        country: 'CA',
        date: new Date('04/02/2016')
      }, validator);
    } catch (e) {
      throw new Error(e);
    }
  };
  t.throws(testFn1, 'Error: AAAA is not a valid country');

  const testFn2 = function () {
    try {
      parser.parse('counttry in ["US","CA"] and date > 04/01/2016 or platform = "opera"', {
        country: 'CA',
        date: new Date('04/02/2016')
      }, validator);
    } catch (e) {
      throw new Error(e);
    }
  };
  t.throws(testFn2, 'Error: counttry is invalid');

  const testFn3 = function () {
    try {
      parser.parse('country in ["US","CA"] and date > 04/01/2016 or platform = "opera"', {
        country: 'CA',
        date: new Date('04/02/2016')
      }, validator);
    } catch (e) {
      throw new Error(e);
    }
  };
  t.throws(testFn3, 'Error: opera is not a valid platform');

  const testFn4 = function () {
    try {
      parser.parse('country in ["US","CA"] and date > 04/01/2016 or platfrom = "amazon"', {
        country: 'CA',
        date: new Date('04/02/2016')
      }, validator);
    } catch (e) {
      throw new Error(e);
    }
  };
  t.throws(testFn4, 'Error: platfrom is invalid');

  const testFn5 = function () {
    try {
      parser.parse('country in ["US","CA"] and date > 23/23/2016', {
        country: 'CA',
        date: new Date('04/02/2016')
      }, validator);
    } catch (e) {
      throw new Error(e);
    }
  };
  t.throws(testFn5);

  const testFn6 = function () {
    try {
      parser.parse('country not in "US" and date > 09/23/2016', {
        country: 'CA',
        date: new Date('04/02/2016')
      }, validator);
    } catch (e) {
      throw new Error(e);
    }
  };
  t.throws(testFn6, 'Error: US is not an array');

  const testFn7 = function () {
    try {
      parser.parse('country = ["CA"] and date > 09/23/2016', {
        country: 'CA',
        date: new Date('04/02/2016')
      }, validator);
    } catch (e) {
      throw new Error(e);
    }
  };
  t.throws(testFn7, 'Error: CA is an array, cannot be compared');
});
