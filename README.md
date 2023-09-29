# estimate-cores

Estimate the number of processes that can be executed concurrently. Useful if
you want to figure out how many Web Workers you can spin up. Just remember to
save a core for the main thread.

## Example

``` javascript
const estimateCores = require('estimate-cores');

estimateCores((error, coreCount) => {
  if (error) {
    // handle error
    return;
  }

  console.log(coreCount);
  // => 4
});
```

## Installation

``` bash
$ npm install estimate-cores
```

## API

``` javascript
const estimateCores = require('estimate-cores');
```

### `estimateCores([force=false], callback)`

Estimates the number of possible concurrent processes. The core count is cached
for future calls. To force a recount, pass `true` for `force`.
