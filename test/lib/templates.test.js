/**
 * unit tests for lib/templates.js
 */
'use strict';

const assert = require('../assert');
const templates = require('../../lib/templates');

const ObjectTemplate = templates.ObjectTemplate;
const ValueTemplate = templates.ValueTemplate;
const ArrayTemplate = templates.ArrayTemplate;

describe('lib/templates.test.js', function (){
  describe('ValueTemplate', function (){
    it('[:int default 5]', function(){
      let templ = ValueTemplate.parse(':int default 5');
      templ.validate(10);
      templ.validate(-10);
      assert.equal(templ.validate(undefined, {applyDefaults: true}), 5);
      assert.throws(function (){ templ.validate(null); }, 'TypeError');
      assert.throws(function (){ templ.validate(1.5); }, 'TypeError');
      assert.throws(function (){ templ.validate(-1.5); }, 'TypeError');
      assert.throws(function (){ templ.validate({}); }, 'TypeError');
      assert.throws(function (){ templ.validate([1]); }, 'TypeError');
      assert.throws(function (){ templ.validate(false); }, 'TypeError');
      assert.throws(function (){ templ.validate("1"); }, 'TypeError');
    });

    it('[:boolean default true]', function(){
      let templ = ValueTemplate.parse(':boolean default true');
      templ.validate(false);
      assert.equal(templ.validate(undefined, {applyDefaults: true}), true);
      assert.throws(function (){ templ.validate(null); }, 'TypeError');
      assert.throws(function (){ templ.validate(0.5); }, 'TypeError');
      assert.throws(function (){ templ.validate({}); }, 'TypeError');
      assert.throws(function (){ templ.validate([1]); }, 'TypeError');
      assert.throws(function (){ templ.validate("1"); }, 'TypeError');
    });

    it('[:string default "abc"]', function(){
      let templ = ValueTemplate.parse(':string default "abc"');
      templ.validate("def");
      assert.equal(templ.validate(undefined, {applyDefaults: true}), "abc");
      assert.throws(function (){ templ.validate(null); }, 'TypeError');
      assert.throws(function (){ templ.validate(0.5); }, 'TypeError');
      assert.throws(function (){ templ.validate({}); }, 'TypeError');
      assert.throws(function (){ templ.validate([1]); }, 'TypeError');
      assert.throws(function (){ templ.validate(0); }, 'TypeError');
    });

    it('[:char default "N"]', function(){
      let templ = ValueTemplate.parse(':char default "N"');
      templ.validate("Y");
      assert.equal(templ.validate(undefined, {applyDefaults: true}), "N");
      assert.throws(function (){ templ.validate(null); }, 'TypeError');
      assert.throws(function (){ templ.validate(0.5); }, 'TypeError');
      assert.throws(function (){ templ.validate({}); }, 'TypeError');
      assert.throws(function (){ templ.validate([1]); }, 'TypeError');
      assert.throws(function (){ templ.validate(0); }, 'TypeError');
      assert.throws(function (){ templ.validate('ABC'); }, 'TypeError');
    });

    it('[:array default [1]]', function(){
      let templ = ValueTemplate.parse(':array default [1]');
      templ.validate([2,3]);
      assert.equal(templ.validate(undefined, {applyDefaults: true}), [1]);
      assert.throws(function (){ templ.validate(null); }, 'TypeError');
      assert.throws(function (){ templ.validate(0.5); }, 'TypeError');
      assert.throws(function (){ templ.validate({}); }, 'TypeError');
      assert.throws(function (){ templ.validate(0); }, 'TypeError');
      assert.throws(function (){ templ.validate("1"); }, 'TypeError');
    });

    it('[:object default {"name": "anna"}]', function(){
      let templ = ValueTemplate.parse(':object default {"name": "anna"}');
      templ.validate({});
      assert.equal(templ.validate(undefined, {applyDefaults: true}), {"name": "anna"});
      assert.throws(function (){ templ.validate(null); }, 'TypeError');
      assert.throws(function (){ templ.validate(0.5); }, 'TypeError');
      assert.throws(function (){ templ.validate([1]); }, 'TypeError');
      assert.throws(function (){ templ.validate(0); }, 'TypeError');
      assert.throws(function (){ templ.validate("1"); }, 'TypeError');
    });

    it('[:object default 5] - should throw SyntaxError', function(){
      assert.throws(
        function(){
          ValueTemplate.parse(':object default 5');
        },
        'SyntaxError'
      );
    });

    it('[:object xxx default {}] - should throw SyntaxError', function(){
      assert.throws(
        function(){
          ValueTemplate.parse(':object xxx default {}');
        },
        'SyntaxError'
      );
    });

    it('[::int xxx] - should return a string template', function(){
      let templ = ValueTemplate.parse('::int xxx');
      templ.validate('abc');
      assert.equal(templ.type, 'string');
      assert.equal(templ.defaultValue, ':int xxx');
      assert.throws(function (){ templ.validate(5); }, 'TypeError');
    });

    it('[:] - should throw SyntaxError', function(){
      assert.throws(
        function (){
          ValueTemplate.parse(':')
        },
        'SyntaxError'
      );
    });

    it('any default to int', function (){
      let t = ValueTemplate.parse({any: ':any default 1'});
      let v = t.validate({}, {applyDefaults: true});
      assert.equal(v.any, 1);
      t.validate({});
      t.validate({any: 'abc'});
    });

    it('any default to object', function (){
      let t = ValueTemplate.parse({any: ':any default {"val": 1}'});
      let v = t.validate({}, {applyDefaults: true});
      assert.equal(v.any.val, 1);
      t.validate({any: 'abc'});
    });

    it('required keyword', function (){
      let t = ValueTemplate.parse({'id required': ':int'});
      assert.throws(function (){
        t.validate({});
      }, 'TypeError', 'id');

      assert.throws(function (){
        t.validate({id: null});
      }, 'TypeError', 'id');
    });

    it('nullable keyword', function (){
      let t = ValueTemplate.parse({'id required nullable': ':int'});
      assert.throws(function (){
        t.validate({});
      }, 'TypeError', 'id');

      t.validate({id: null});
    });

    it('CONSTANTS', function(){
      let types = ['boolean', 'boolean', 'number', 'string', 'null'];
      [true, false, 1, 'str', null].forEach(function(c, i){
        let t = ValueTemplate.parse(c);
        assert.equal(t.type, types[i]);
        assert.equal(t.defaultValue, c);
      })
    });
  });

  describe('ArrayTemplate', function (){
    it('[[\':string\']]', function (){
      let templ = ArrayTemplate.parse([':string']);
      templ.validate(['abc']);
      assert.throws(function (){ templ.validate([1, 2])}, 'TypeError');
      assert.throws(function (){ templ.validate({})}, 'TypeError');
      assert.throws(function (){ templ.validate("abc")}, 'TypeError');
    });

    it('[[\':string default "abc"\']] - should throw SyntaxError', function (){
      assert.throws(
        function() {
          ArrayTemplate.parse([':string default "abc"']);
        },
        'SyntaxError'
      );
    });
  });

  describe('ObjectTemplate', function (){
    it('required property', function (){
      let tmpl = ObjectTemplate.parse({
        "name": "anna",
        "id required": ":int",
        "fid required": [":int"]
      });

      tmpl.validate({name: 'jack', id: 5, fid: [1, 3]});

      assert.throws(
        function(){
          tmpl.validate({name: 'jack', id: null, fid: [1, 3]});
        },
        'TypeError', 'id'
      );
      assert.throws(
        function(){
          tmpl.validate({name: 'jack', fid: [1, 3]});
        },
        'TypeError', 'id'
      );
      assert.throws(
        function(){
          tmpl.validate({name: 'jack', id: 5, fid: 1});
        },
        'TypeError', 'fid'
      );
    });

    it('object with default value', function(){
      let t = ObjectTemplate.parse({
        'list default [1,2,3]': [':int'],
        'obj default {"a": 1}': {a: ':int'}
      });
      assert.equal(t.validate({}, {applyDefaults: true}), {list: [1,2,3], obj: {a: 1}});
      assert.equal(t.validate({}, {applyDefaults: false}), {});
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

      assert.equal(d, {
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

  describe('Syntax Errors', function (){
    it('missing default value(1)', function(){
      assert.throws(function(){
        ValueTemplate.parse(':string default');
      }, 'SyntaxError', 'default');
    });
    it('missing default value(2)', function(){
      assert.throws(function(){
        ValueTemplate.parse({'name default': ':string'});
      }, 'SyntaxError', 'default');
    });
    it('redundant words after default', function(){
      assert.throws(function(){
        ValueTemplate.parse(':string default "abc" xxxx');
      }, 'SyntaxError');
    });
    it('unexpected word after type name', function(){
      assert.throws(function(){
        ValueTemplate.parse(':string -default "abc"');
      }, 'SyntaxError');
    });
    it('default value conflict with declared type(1)', function(){
      assert.throws(function(){
        ValueTemplate.parse(':int default 1.99');
      }, 'SyntaxError');
    });
    it('default value conflict with declared type(2)', function(){
      assert.throws(function(){
        ValueTemplate.parse({'name default 0.9': ':int'});
      }, 'SyntaxError');
    });
    it('multiple default values', function(){
      assert.throws(function(){
        ValueTemplate.parse({'name default 1': ':int default 2'});
      }, 'SyntaxError', 'multiple');
    });
    it('multiple item template definition', function(){
      assert.throws(function(){
        ValueTemplate.parse([{a: 0}, {b: 1}]);
      }, 'SyntaxError');
    });
    it('missing property name', function(){
      assert.throws(function(){
        ValueTemplate.parse({'': ':int'});
      }, 'SyntaxError');
    });
    it('required conflicts with default', function(){
      assert.throws(function(){
        ValueTemplate.parse({'name required default 1': ':int'});
      }, 'SyntaxError');
    });
    it('unexpected token', function (){
      assert.throws(function(){
        ValueTemplate.parse({'name required xxx': ''});
      }, 'SyntaxError', 'unexpected');
    });
  });
});
