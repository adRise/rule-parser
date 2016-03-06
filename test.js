const rule = new require('./index');
const parser = new rule.Parser();

const test = require('ava').test;

test('simple expression should work', t => {
  const v1 = parser.parse('str = "world"', { str: 'world' });
  const v2 = parser.parse('num <> 1', { num: 2 });
  const v3 = parser.parse('date > 01/01/2016', { date: new Date() });
  const v4 = parser.parse('num > 10', { num: 10 });
  t.true(v1);
  t.true(v2);
  t.true(v3);
  t.false(v4);
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

test('in works', t => {
  const expr = 'str in "a, b, c, d, e, e,   a"';
  const v1 = parser.parse(expr, {str: 'a'});
  const v2 = parser.parse(expr, {str: 'e'});
  const v3 = parser.parse(expr, {str: 'x'});
  const v4 = parser.parse(`not ${expr}`, {str: 'x'});

  t.true(v1);
  t.true(v2);
  t.false(v3);
  t.true(v4);
})
