'use strict';

var isFunction = require('lodash.isfunction');

/** @type {number} */
var cachedCores;

function estimateCores(force, callback) {
  if (isFunction(force)) {
    callback = force;
    force = false;
  }

  // Return cached count if present
  if (cachedCores && !force) {
    return callback(null, cachedCores);
  }

  if (typeof navigator !== 'undefined'
      && navigator.hardwareConcurrency
      && navigator.hardwareConcurrency > 0) {
    cachedCores = navigator.hardwareConcurrency;
    return callback(null, cachedCores);
  }

  // Without Web Workers, the only core is the main thread
  if (typeof Worker === 'undefined') {
    cachedCores = 1;
    return callback(null, cachedCores);
  }

  // Can't estimate without Blob. Just go with 2.
  if (typeof Blob === 'undefined') {
    cachedCores = 2;
    return callback(null, cachedCores);
  }

  var blobUrl = URL.createObjectURL(new Blob(['(',
    function() {
      self.addEventListener('message', function() {
        var st = Date.now();
        var et = st + 4;
        while (Date.now() < et) {}
        self.postMessage({st: st, et: et});
      });
    }.toString(),
  ')()'], {type: 'application/javascript'}));

  sample([], 5, 16);

  /**
   * @param {number[]} max
   * @param {number} samples
   * @param {number} numWorkers
   * @returns {void}
   */
  function sample(max, samples, numWorkers) {
    if (samples === 0) {
      var avg = Math.floor(max.reduce(function(avg, x) {
        return avg + x;
      }, 0) / max.length);
      cachedCores = Math.max(1, avg);
      URL.revokeObjectURL(blobUrl);
      return callback(null, cachedCores);
    }

    map(numWorkers, function(error, results) {
      max.push(reduce(numWorkers, results));
      sample(max, samples - 1, numWorkers);
    });
  }

  /**
   * @param {number} numWorkers
   * @param {(error: Error, results: { et: number; st: number; }[]) => unknown} callback
   * @returns {void}
   */
  function map(numWorkers, callback) {
    var workers = [];
    var results = [];
    for (var i = 0; i < numWorkers; ++i) {
      var worker = new Worker(blobUrl);
      worker.addEventListener('message', function(ev) {
        results.push(ev.data);
        if (results.length === numWorkers) {
          for (var i = 0; i < numWorkers; ++i) {
            workers[i].terminate();
          }
          callback(null, results);
        }
      });
      workers.push(worker);
    }
    for (var i = 0; i < numWorkers; ++i) {
      workers[i].postMessage(i);
    }
  }

  /**
   * @param {number} numWorkers
   * @param {readonly { et: number; st: number; }[]} results
   * @returns {number}
   */
  function reduce(numWorkers, results) {
    var overlaps = [];
    for (var n = 0; n < numWorkers; ++n) {
      var r1 = results[n];

      /** @type {number[]} */
      var overlap = overlaps[n] = [];
      for (var i = 0; i < numWorkers; ++i) {
        if (n === i) {
          continue;
        }
        var r2 = results[i];
        if ((r1.st > r2.st && r1.st < r2.et)
            || (r2.st > r1.st && r2.st < r1.et)) {
          overlap.push(i);
        }
      }
    }

    return overlaps.reduce(function(max, overlap) {
      return Math.max(max, overlap.length);
    }, 0);
  }
}

module.exports = estimateCores;
