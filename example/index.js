'use strict';

const estimateCores = require('../');

estimateCores(function(error, coreCount) {
  if (error) {
    throw error;
  }

  // eslint-disable-next-line no-console
  console.log(coreCount);
  // => 4
});
