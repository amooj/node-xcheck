'use strict';

const xcheck = require('../index');

const DEFAULT_REPEAT_COUNT = 10;

/**
 * Profile code block.
 * @param {function} block - code to run.
 * @param {Number} [repeat] - Number of repeated times
 * @returns {Number} Total running time in microseconds.
 */
function profileBlock(block, repeat){
  repeat = repeat || DEFAULT_REPEAT_COUNT;
  let start = process.hrtime();
  for (let i = 0; i < repeat; ++i){
    block();
  }
  let diff = process.hrtime(start);
  return Math.floor(diff[0] + diff[1] / 1e3);
}

function profileCase(data, template, manualCheck){
  let perf = profileBlock(function (){
    try {
      template.validate(data, {applyDefaults: true});
    }
    catch (err){
      return false;
    }
    return true;
  });

  let loop = profileBlock(function (){});

  let manual = -1;
  if (manualCheck){
    manual = profileBlock(function (){
      manualCheck(data);
    });
  }
  return {perf, loop, manual};
}

function main(){
  let testCases = [];

  testCases.push([
    {user: 'user', password: 'password', jump: 'http://example.com/secret/'},
    xcheck.createTemplate({
      'user required': ':string',
      'password required': ':string',
      'jump': 'http://example.com/'
    }),
    function (data){
      if (typeof data.user !== 'string'){
        return false;
      }
      if (typeof data.password !== 'string'){
        return false;
      }
      if (!data.jump){
        data.jump = 'http://example.com/';
      }
      return true;
    }
  ]);


  let ns = xcheck.createNamespace();
  ns.defineType('array<string>', [':string']);
  ns.defineType('filter', {'id required': ':number', 'operator required': ':string', 'value required': ':array<string>'});

  testCases.push([
    {
      "filters": [{
        "id": 48,
        "operator": "in",
        "value": ["10-19","20-29"]
      }],
      "idlist": [{
        "id": 48
      }],
      "key": "id"
    },

    ns.createTemplate({
      'filters': [':filter'],
      'idlist': [{'id required': ':number'}],
      'key required': ':string'
    }),

    function (data){
      if (!Array.isArray(data.filters)){
        return false;
      }
      for (let i = 0, n = data.filters.length; i < n; ++i){
        let filter = data.filters[i];
        if (typeof filter.id !== 'number'){
          return false;
        }
        if (typeof filter.operator !== 'string'){
          return false;
        }
        if (!Array.isArray(filter.value)){
          return false;
        }

        for (let j = 0, m = filter.value.length; j < m; ++j){
          if (typeof filter.value[j] !== 'string'){
            return false;
          }
        }
      }
      if (!Array.isArray(data.idlist)){
        return false;
      }
      if (typeof data.idlist[0] !== 'number'){
        return false;
      }
      return data.key && typeof data.key === 'string';
    }
  ]);

  testCases.forEach(function (k){
    let result = profileCase(k[0], k[1], k[2]);
    console.log('================');
    console.log('case: %j', k[0]);
    console.log('xcheck time: ' + result.perf + 'us');
    console.log('loop   time: ' + result.loop + 'us');
    console.log('manual time: ' + result.manual + 'us');
    console.log('================');
  });
}

main();
