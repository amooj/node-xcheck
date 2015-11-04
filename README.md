# node-xcheck
Template based data validation for Node.js.

## Quick Start
```js
const xcheck = require('xcheck');

// build a template from JSON
let template = xcheck.loadTemplate(
  '{"name": "anonymous", "secret": "", "port": 21, "secured": true}'
);

// validate data using the template
let data = {name: 'tom', secret: '******'};
data = template.validate(data, {applyDefaults: true});

assert(output.name === 'anonymous');
assert(output.secret === '******');
assert(output.port === 21);
assert(output.secured === true);
```
