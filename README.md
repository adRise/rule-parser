# Rule parser

A simple rule parser to parse expressions like this:

```
x = "abc" and (y > 10 or date <= 01/31/2017) and not z <> ""
```



## Installation

```bash
$ npm install rule-parser --save
```

## Usage

```js
const rule = require('rule-parser');
const parser = new rule.Parser();
const expr = 'city = "cupertino" and date >= 01/01/2016 and date < 04/01/2016';
parser.parse(expr, { city: 'san francisco', date: new Date() }); // return false;
parser.parse(expr, { city: 'cupertino', date: new Date() }); // return true;
```

## License

MIT. See [LICENSE](./LICENSE).