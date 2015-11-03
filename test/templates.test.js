/**
 * unit tests for templates.js
 */
'use strict';

const assert = require('assert');
const templates = require('../lib/templates');

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
  assert(testEqual(actual, expected));
}

describe('templates.test.js', function (){
  describe('ValueTemplate', function (){
    it('[:int default 5]', function(){
      let templ = ValueTemplate.parse(':int default 5');
      templ.validate(1);
      assert.equal(templ.validate(undefined, {applyDefaults: true}), 5);
      assert.throws(function (){ templ.validate(null); });
      assert.throws(function (){ templ.validate(0.5); });
      assert.throws(function (){ templ.validate({}); });
      assert.throws(function (){ templ.validate([1]); });
      assert.throws(function (){ templ.validate(false); });
      assert.throws(function (){ templ.validate("1"); });
    });

    it('[:boolean default true]', function(){
      let templ = ValueTemplate.parse(':boolean default true');
      templ.validate(false);
      assert.equal(templ.validate(undefined, {applyDefaults: true}), true);
      assert.throws(function (){ templ.validate(null); });
      assert.throws(function (){ templ.validate(0.5); });
      assert.throws(function (){ templ.validate({}); });
      assert.throws(function (){ templ.validate([1]); });
      assert.throws(function (){ templ.validate("1"); });
    });

    it('[:string default "abc"]', function(){
      let templ = ValueTemplate.parse(':string default "abc"');
      templ.validate("def");
      assert.equal(templ.validate(undefined, {applyDefaults: true}), "abc");
      assert.throws(function (){ templ.validate(null); });
      assert.throws(function (){ templ.validate(0.5); });
      assert.throws(function (){ templ.validate({}); });
      assert.throws(function (){ templ.validate([1]); });
      assert.throws(function (){ templ.validate(0); });
    });

    it('[:array default [1]]', function(){
      let templ = ValueTemplate.parse(':array default [1]');
      templ.validate([2,3]);
      assertEqual(templ.validate(undefined, {applyDefaults: true}), [1]);
      assert.throws(function (){ templ.validate(null); });
      assert.throws(function (){ templ.validate(0.5); });
      assert.throws(function (){ templ.validate({}); });
      assert.throws(function (){ templ.validate(0); });
      assert.throws(function (){ templ.validate("1"); });
    });

    it('[:object default {"name": "anna"}]', function(){
      let templ = ValueTemplate.parse(':object default {"name": "anna"}');
      templ.validate({});
      assertEqual(templ.validate(undefined, {applyDefaults: true}), {"name": "anna"});
      assert.throws(function (){ templ.validate(null); });
      assert.throws(function (){ templ.validate(0.5); });
      assert.throws(function (){ templ.validate([1]); });
      assert.throws(function (){ templ.validate(0); });
      assert.throws(function (){ templ.validate("1"); });
    });

    it('[:object default 5] - should throw SyntaxError', function(){
      let except = null;
      try {
        ValueTemplate.parse(':object default 5');
      }
      catch (err){
        except = err.toString();
      }
      assert(except);
      assert(except.indexOf('SyntaxError') >= 0);
    });

    it('[:object xxx default {}] - should throw SyntaxError', function(){
      let except = null;
      try {
        ValueTemplate.parse(':object default 5');
      }
      catch (err){
        except = err.toString();
      }
      assert(except);
      assert(except.indexOf('SyntaxError') >= 0);
    });
  });
  describe('ArrayTemplate', function (){
    it('[[\':string\']]', function (){
      let templ = ArrayTemplate.parse([':string']);
      templ.validate(['abc']);
      assert.throws(function (){ templ.validate([1, 2])});
      assert.throws(function (){ templ.validate({})});
      assert.throws(function (){ templ.validate("abc")});
    });

    it('[[\':string default "abc"\']] - should throw SyntaxError', function (){
      let except = null;
      try {
        ArrayTemplate.parse([':string default "abc"']);
      }
      catch (err){
        except = err.toString();
      }
      assert(except);
      assert(except.indexOf('SyntaxError') >= 0);
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
      assert.throws(function(){
        tmpl.validate({name: 'jack', id: null, fid: [1, 3]});
      });
      assert.throws(function(){
        tmpl.validate({name: 'jack', fid: [1, 3]});
      });
      assert.throws(function(){
        tmpl.validate({name: 'jack', id: 5, fid: 1});
      });
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

      assert(d);
      assert(d.o1.o2.o3.a31.length, 3);
      assert(d.o1.o2.o3.a32.length, 3);
      assertEqual(d.o1.o2.o3.a32[0], {n: 1, s: '1'});
      assertEqual(d.o1.o2.o3.a32[1], {n: 2, s: '1'});
      assertEqual(d.o1.o2.o3.a32[2], {n: 3, s: '3'});
    });
  });
});
