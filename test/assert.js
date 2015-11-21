'use strict';

const assert = require('assert');

function testEqual(actual, expected){
  if (actual === expected){
    return true;
  }
  let type = typeof expected;
  if (typeof actual !== type){
    return false;
  }
  if (['number', 'string', 'boolean'].indexOf(type) >= 0){
    // for these types, operator === is enough.
    return false;
  }
  if (expected === null || expected === undefined){
    // for null or undefined, operator === is enough.
    return false;
  }
  if (Array.isArray(actual)){
    return testArrayEqual(actual, expected);
  }
  for (let key in expected){
    if (expected.hasOwnProperty(key)){
      if (!actual.hasOwnProperty(key)){
        console.log('** missing key \'' + key + '\'');
        return false;
      }
      if (!testEqual(actual[key], expected[key])){
        return false;
      }
    }
  }
  for (let key in actual){
    if (actual.hasOwnProperty(key)){
      if (!expected.hasOwnProperty(key)){
        console.log('** unexpected key \'' + key + '\'');
        return false;
      }
      if (!testEqual(actual[key], expected[key])){
        return false;
      }
    }
  }
  return true;
}

function testArrayEqual(actual, expected){
  if (actual.length !== expected.length){
    console.log('** array length mismatch');
    return false;
  }
  actual.forEach(function (val, i){
    if (!testEqual(val, expected[i])){
      return false;
    }
  });
  return true;
}

function assertEqual(actual, expected){
  if (!testEqual(actual, expected)){
    throw new assert.AssertionError({
      actual,
      expected,
      message: 'assertion failed.'
    });
  }
}

function assertThrows(block){
  let except;
  try {
    block();
  }
  catch (err){
    except = err.toString();
  }
  if (!except){
    throw new assert.AssertionError({
      actual: '[no exception is thrown]',
      expected: '[function throws exception]',
      message: 'expected exception is not thrown'
    });
  }
  for (let i = 1, n = arguments.length; i < n; ++i){
    if (except.indexOf(arguments[i]) < 0){
      throw new assert.AssertionError({
        actual: except,
        expected: arguments[i],
        message: 'exception does not contain expected keyword \'' + arguments[i] + '\''
      });
    }
  }
}

function TestAssert(val, message){
  assert(val, message);
}

TestAssert.equal = assertEqual;
TestAssert.throws = assertThrows;

module.exports = TestAssert;
