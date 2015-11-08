'use strict';

const assert = require('assert');

const mod = require('../index');
const ValueTemplate = mod.ValueTemplate;
const ArrayTemplate = mod.ArrayTemplate;
const ObjectTemplate = mod.ObjectTemplate;

describe('index.test.js', function(){
  it('createTemplate - value', function(){
    let template = mod.createTemplateFromJSON('"abc"');
    assert(template);
    assert(template instanceof ValueTemplate);
    assert.equal(template.type, 'string');
    assert.equal(template.defaultValue, 'abc');
  });
  it('createTemplate - array', function(){
    let template = mod.createTemplateFromJSON('[]');
    assert(template);
    assert(template instanceof ArrayTemplate);
    assert.equal(template.type, 'array');
    assert.equal(template.defaultValue, undefined);
  });
  it('createTemplate - object', function(){
    let template = mod.createTemplateFromJSON('{"id not null": ":int"}');
    assert(template);
    assert(template instanceof ObjectTemplate);
    assert.equal(template.type, 'object');
    assert.equal(template.defaultValue, undefined);
  });

});
