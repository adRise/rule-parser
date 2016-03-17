const rule = new require('./index');
const parser = new rule.Parser();
const Rx = require('rx');

function benchmark(expr, data, rounds, concurrency) {
  Rx.Observable.range(0, concurrency).flatMap(idx => {
    return new Rx.Observable.create(observer => {
      const t1 = new Date();
      for (i=0; i< rounds - 1; i++) {
        parser.parse(expr, data);
      }
      const t2 = new Date();
      const diff = (t2 - t1) / 1000;
      observer.onNext({ idx, diff });
      observer.onCompleted();
    });
  }).subscribe(
    data => console.log('%d: Evaluate %s for %d rounds spent %d seconds', data.idx, expr, rounds, data.diff)
  );
}

const rounds = 20000;
const concurrency = 100;
benchmark('str = "world"', { str: 'world' }, rounds, concurrency);
benchmark('date > 01/01/2016 or num > 10 and str = "world"',
          {date: new Date(), num: 5, str: "tyr" }, rounds, concurrency);
benchmark('country in ["US","CA"] and date > 12/23/2016 and platform not in ["iphone", "ipad", "android"]',
          { platform: "roku", country: 'CA', date: new Date() }, rounds, concurrency);
