var estimateCores = require('../');
var test = require('tape');
var isFunction = require('lodash.isfunction');
var isNull = require('lodash.isnull');

test('exports a function', function(t) {
  t.plan(1);
  t.ok(isFunction(estimateCores));
});

test('estimates cores', function(t) {
  t.plan(2);
  estimateCores(function(error, count) {
    t.ok(isNull(error));
    t.ok(count > 0);
  })
});