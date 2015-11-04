/**
 * unit tests for lib/templates.js
 */
'use strict';

const assert = require('assert');
const templates = require('../../lib/templates');

const ObjectTemplate = templates.ObjectTemplate;
const ValueTemplate = templates.ValueTemplate;
const ArrayTemplate = templates.ArrayTemplate;

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

describe('lib/templates.test.js', function (){
  describe('ValueTemplate', function (){
    it('[:int default 5]', function(){
      let templ = ValueTemplate.parse(':int default 5');
      templ.validate(10);
      templ.validate(-10);
      assertEqual(templ.validate(undefined, {applyDefaults: true}), 5);
      assertThrows(function (){ templ.validate(null); }, 'TypeError');
      assertThrows(function (){ templ.validate(1.5); }, 'TypeError');
      assertThrows(function (){ templ.validate(-1.5); }, 'TypeError');
      assertThrows(function (){ templ.validate({}); }, 'TypeError');
      assertThrows(function (){ templ.validate([1]); }, 'TypeError');
      assertThrows(function (){ templ.validate(false); }, 'TypeError');
      assertThrows(function (){ templ.validate("1"); }, 'TypeError');
    });

    it('[:boolean default true]', function(){
      let templ = ValueTemplate.parse(':boolean default true');
      templ.validate(false);
      assertEqual(templ.validate(undefined, {applyDefaults: true}), true);
      assertThrows(function (){ templ.validate(null); }, 'TypeError');
      assertThrows(function (){ templ.validate(0.5); }, 'TypeError');
      assertThrows(function (){ templ.validate({}); }, 'TypeError');
      assertThrows(function (){ templ.validate([1]); }, 'TypeError');
      assertThrows(function (){ templ.validate("1"); }, 'TypeError');
    });

    it('[:string default "abc"]', function(){
      let templ = ValueTemplate.parse(':string default "abc"');
      templ.validate("def");
      assertEqual(templ.validate(undefined, {applyDefaults: true}), "abc");
      assertThrows(function (){ templ.validate(null); }, 'TypeError');
      assertThrows(function (){ templ.validate(0.5); }, 'TypeError');
      assertThrows(function (){ templ.validate({}); }, 'TypeError');
      assertThrows(function (){ templ.validate([1]); }, 'TypeError');
      assertThrows(function (){ templ.validate(0); }, 'TypeError');
    });

    it('[:char default "N"]', function(){
      let templ = ValueTemplate.parse(':char default "N"');
      templ.validate("Y");
      assertEqual(templ.validate(undefined, {applyDefaults: true}), "N");
      assertThrows(function (){ templ.validate(null); }, 'TypeError');
      assertThrows(function (){ templ.validate(0.5); }, 'TypeError');
      assertThrows(function (){ templ.validate({}); }, 'TypeError');
      assertThrows(function (){ templ.validate([1]); }, 'TypeError');
      assertThrows(function (){ templ.validate(0); }, 'TypeError');
      assertThrows(function (){ templ.validate('ABC'); }, 'TypeError');
    });

    it('[:array default [1]]', function(){
      let templ = ValueTemplate.parse(':array default [1]');
      templ.validate([2,3]);
      assertEqual(templ.validate(undefined, {applyDefaults: true}), [1]);
      assertThrows(function (){ templ.validate(null); }, 'TypeError');
      assertThrows(function (){ templ.validate(0.5); }, 'TypeError');
      assertThrows(function (){ templ.validate({}); }, 'TypeError');
      assertThrows(function (){ templ.validate(0); }, 'TypeError');
      assertThrows(function (){ templ.validate("1"); }, 'TypeError');
    });

    it('[:object default {"name": "anna"}]', function(){
      let templ = ValueTemplate.parse(':object default {"name": "anna"}');
      templ.validate({});
      assertEqual(templ.validate(undefined, {applyDefaults: true}), {"name": "anna"});
      assertThrows(function (){ templ.validate(null); }, 'TypeError');
      assertThrows(function (){ templ.validate(0.5); }, 'TypeError');
      assertThrows(function (){ templ.validate([1]); }, 'TypeError');
      assertThrows(function (){ templ.validate(0); }, 'TypeError');
      assertThrows(function (){ templ.validate("1"); }, 'TypeError');
    });

    it('[:object default 5] - should throw SyntaxError', function(){
      assertThrows(
        function(){
          ValueTemplate.parse(':object default 5');
        },
        'SyntaxError'
      );
    });

    it('[:object xxx default {}] - should throw SyntaxError', function(){
      assertThrows(
        function(){
          ValueTemplate.parse(':object xxx default {}');
        },
        'SyntaxError'
      );
    });

    it('[::int xxx] - should return a string template', function(){
      let templ = ValueTemplate.parse('::int xxx');
      templ.validate('abc');
      assertEqual(templ.type, 'string');
      assertEqual(templ.defaultValue, ':int xxx');
      assertThrows(function (){ templ.validate(5); }, 'TypeError');
    });

    it('[:] - should throw SyntaxError', function(){
      assertThrows(
        function (){
          ValueTemplate.parse(':')
        },
        'SyntaxError'
      );
    });

    it('CONSTANTS', function(){
      let types = ['boolean', 'boolean', 'number', 'string', 'null'];
      [true, false, 1, 'str', null].forEach(function(c, i){
        let t = ValueTemplate.parse(c);
        assertEqual(t.type, types[i]);
        assertEqual(t.defaultValue, c);
      })
    });
  });

  describe('ArrayTemplate', function (){
    it('[[\':string\']]', function (){
      let templ = ArrayTemplate.parse([':string']);
      templ.validate(['abc']);
      assertThrows(function (){ templ.validate([1, 2])}, 'TypeError');
      assertThrows(function (){ templ.validate({})}, 'TypeError');
      assertThrows(function (){ templ.validate("abc")}, 'TypeError');
    });

    it('[[\':string default "abc"\']] - should throw SyntaxError', function (){
      assertThrows(
        function() {
          ArrayTemplate.parse([':string default "abc"']);
        },
        'SyntaxError'
      );
    });
  });
  describe('ObjectTemplate', function (){
    it('[{"name": "anna", "id not null": ":int", "fid not null": [":int"]}]', function (){
      let tmpl = ObjectTemplate.parse({
        "name": "anna",
        "id not null": ":int",
        "fid not null": [":int"]
      });

      tmpl.validate({name: 'jack', id: 5, fid: [1, 3]});
      assertThrows(
        function(){
          tmpl.validate({name: 'jack', id: null, fid: [1, 3]});
        },
        'TypeError'
      );
      assertThrows(
        function(){
          tmpl.validate({name: 'jack', fid: [1, 3]});
        },
        'TypeError'
      );
      assertThrows(
        function(){
          tmpl.validate({name: 'jack', id: 5, fid: 1});
        },
        'TypeError'
      );
    });

    it('object with default value', function(){
      let t = ObjectTemplate.parse({
        'list default [1,2,3]': [':int'],
        'obj default {"a": 1}': {a: ':int'}
      });
      assertEqual(t.validate({}, {applyDefaults: true}), {list: [1,2,3], obj: {a: 1}});
      assertEqual(t.validate({}, {applyDefaults: false}), {});
    });

    it('nested array-objects', function (){
      let templ = ObjectTemplate.parse({
        o1: {
          o2: {
            o3: {
              a31: [':int'],
              a32: [{n: 1, s: '1'}]
            }
          }
        }
      });

      let d = templ.validate({
        o1: {
          o2: {
            o3: {
              a31: [1, 2, 3],
              a32: [
                {},
                {n: 2},
                {n: 3, s: '3'}
              ]
            }
          }
        }
      }, {
        applyDefaults: true
      });

      assertEqual(d, {
        o1: {
          o2: {
            o3: {
              a31: [1, 2, 3],
              a32: [
                {n: 1, s: '1'},
                {n: 2, s: '1'},
                {n: 3, s: '3'}
              ]
            }
          }
        }
      });
    });
  });

  describe('miscellaneous syntax errors', function (){
    it('missing default value(1)', function(){
      assertThrows(function(){
        ValueTemplate.parse(':string default');
      }, 'SyntaxError', 'default');
    });
    it('missing default value(2)', function(){
      assertThrows(function(){
        ValueTemplate.parse({'name default': ':string'});
      }, 'SyntaxError', 'default');
    });
    it('redundant words after default', function(){
      assertThrows(function(){
        ValueTemplate.parse(':string default "abc" xxxx');
      }, 'SyntaxError');
    });
    it('unexpected word after type name', function(){
      assertThrows(function(){
        ValueTemplate.parse(':string -default "abc"');
      }, 'SyntaxError');
    });
    it('default value conflict with declared type(1)', function(){
      assertThrows(function(){
        ValueTemplate.parse(':int default 1.99');
      }, 'SyntaxError');
    });
    it('default value conflict with declared type(2)', function(){
      assertThrows(function(){
        ValueTemplate.parse({'name default 0.9': ':int'});
      }, 'SyntaxError');
    });
    it('multiple default values', function(){
      assertThrows(function(){
        ValueTemplate.parse({'name default 1': ':int default 2'});
      }, 'SyntaxError', 'multiple');
    });
    it('multiple item template definition', function(){
      assertThrows(function(){
        ValueTemplate.parse([{a: 0}, {b: 1}]);
      }, 'SyntaxError');
    });
    it('missing property name', function(){
      assertThrows(function(){
        ValueTemplate.parse({'': ':int'});
      }, 'SyntaxError');
    });
    it('required conflicts with default', function(){
      assertThrows(function(){
        ValueTemplate.parse({'name required default 1': ':int'});
      }, 'SyntaxError');
    });
    it('null type should be nullable', function(){
      assertThrows(function(){
        ValueTemplate.parse({'nil not null': null});
      }, 'SyntaxError', 'nullable');
    });
  });
});
