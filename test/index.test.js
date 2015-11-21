'use strict';

const assert = require('./assert');
const xcheck = require('../index');

const ValueTemplate = xcheck.ValueTemplate;
const ArrayTemplate = xcheck.ArrayTemplate;
const ObjectTemplate = xcheck.ObjectTemplate;

describe('index.test.js', function(){
  it('createTemplate - value', function(){
    let template = xcheck.createTemplateFromJSON('"abc"');
    assert(template);
    assert(template instanceof ValueTemplate);
    assert.equal(template.type, 'string');
    assert.equal(template.defaultValue, 'abc');
  });

  it('createTemplate - array', function(){
    let template = xcheck.createTemplateFromJSON('[]');
    assert(template);
    assert(template instanceof ArrayTemplate);
    assert.equal(template.type, 'array');
    assert.equal(template.defaultValue, undefined);
  });

  it('createTemplate - object', function(){
    let template = xcheck.createTemplateFromJSON('{"id required": ":int"}');
    assert(template);
    assert(template instanceof ObjectTemplate);
    assert.equal(template.type, 'object');
    assert.equal(template.defaultValue, undefined);
  });

  it('createNamespace', function (){
    let ns = xcheck.createNamespace();
    ns.defineType('person', {firstName: '', lastName: '', age: ':int'});
    ns.defineType('arrayPerson', [':person']);
    let socials = ns.createTemplate({
      id: ':int',
      person: ':person',
      friends: ':arrayPerson default []'
    });

    let socialItem = {
      id: 1,
      person: {
        firstName: 'A',
        lastName: 'B'
      },
      friends: [{
        firstName: 'C',
        lastName: 'D'
      }]
    };

    socials.validate(socialItem);
  });
});
