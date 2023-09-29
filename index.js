'use strict';

const isFunction = require('lodash.isfunction');

/** @type {number} */
let cachedCores;

/**
 * @returns {void}
 */
function estimateCores(force, callback) {
  if (isFunction(force)) {
    callback = force;
    force = false;
  }

  // Return cached count if present
  if (cachedCores && !force) {
    callback(null, cachedCores);
    return;
  }

  if (typeof navigator !== 'undefined'
      && navigator.hardwareConcurrency
      && navigator.hardwareConcurrency > 0) {
    cachedCores = navigator.hardwareConcurrency;
    callback(null, cachedCores);
    return;
  }

  // Without Web Workers, the only core is the main thread
  if (typeof Worker === 'undefined') {
    cachedCores = 1;
    callback(null, cachedCores);
    return;
  }

  // Can't estimate without Blob. Just go with 2.
  if (typeof Blob === 'undefined') {
    cachedCores = 2;
    callback(null, cachedCores);
    return;
  }

  const blobUrl = URL.createObjectURL(new Blob(['(',
    function() {
      self.addEventListener('message', function() {
        const st = Date.now();
        const et = st + 4;
        while (Date.now() < et) { /* empty */ }
        self.postMessage({ st, et });
      });
    }.toString(),
    ')()'], { type: 'application/javascript' }));

  sample([], 5, 16);

  /**
   * @param {readonly number[]} max
   * @param {number} samples
   * @param {number} numWorkers
   * @returns {void}
   */
  function sample(max, samples, numWorkers) {
    if (samples === 0) {
      const avg = Math.floor(max.reduce((avg, x) => avg + x, 0) / max.length);
      cachedCores = Math.max(1, avg);
      URL.revokeObjectURL(blobUrl);
      callback(null, cachedCores);
      return;
    }

    map(numWorkers, (_, results) => {
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
    const workers = [];
    const results = [];
    for (let i = 0; i < numWorkers; ++i) {
      const worker = new Worker(blobUrl);
      worker.addEventListener('message', function(ev) {
        results.push(ev.data);
        if (results.length === numWorkers) {
          for (let i = 0; i < numWorkers; ++i) {
            workers[i].terminate();
          }
          callback(null, results);
        }
      });
      workers.push(worker);
    }
    for (let i = 0; i < numWorkers; ++i) {
      workers[i].postMessage(i);
    }
  }

  /**
   * @param {number} numWorkers
   * @param {readonly { et: number; st: number; }[]} results
   * @returns {number}
   */
  function reduce(numWorkers, results) {
    const overlaps = [];
    for (let n = 0; n < numWorkers; ++n) {
      const r1 = results[n];

      /** @type {number[]} */
      const overlap = overlaps[n] = [];
      for (let i = 0; i < numWorkers; ++i) {
        if (n === i) {
          continue;
        }
        const r2 = results[i];
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
