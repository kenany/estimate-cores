'use strict';

const test = require('tape');
const isFunction = require('lodash.isfunction');
const isNull = require('lodash.isnull');

const estimateCores = require('../');

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
