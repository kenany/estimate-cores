var estimateCores = require('../');

estimateCores(function(error, coreCount) {
  if (error) {
    throw error;
  }

  console.log(coreCount);
  // => 4
});