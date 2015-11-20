'use strict';

const assert = require('assert');
const traits = require('../../lib/traits');

describe('lib/traits.test.js', function (){
  it('typeOf', function (){
    assert.equal(traits.typeOf(1), 'number');
    assert.equal(traits.typeOf(false), 'boolean');
    assert.equal(traits.typeOf([]), 'array');
    assert.equal(traits.typeOf({}), 'object');
    assert.equal(traits.typeOf('abc'), 'string');
    assert.equal(traits.typeOf(null), 'null');
  });

  it('typeTest int', function (){
    assert.equal(traits.typeTest(1, 'int'), true);
    assert.equal(traits.typeTest(1.1, 'int'), false);
  });

  it('typeTest char', function (){
    assert.equal(traits.typeTest('a', 'char'), true);
    assert.equal(traits.typeTest('', 'char'), false);
    assert.equal(traits.typeTest('10', 'char'), false);
  });
});
