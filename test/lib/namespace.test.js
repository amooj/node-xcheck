'use strict';

const assert = require('../assert');
const TemplateNamespace = require('../../lib/namespace');

describe('lib/namespace.test.js', function (){
  describe('UserDefinedType', function (){
    let ns = new TemplateNamespace();
    ns.defineType('user', {
      email: '',
      nick: ''
    });

    let t = ns.createTemplate({
      user: ':user default {"email": "user@example.com", "nick": "user"}',
      date: '20151010'
    });

    it('applyDefaults = true', function(){
      let d = {};
      t.validate(d, {applyDefaults: true});
      assert.equal(d.user.email, 'user@example.com');
      assert.equal(d.user.nick, 'user');
      assert.equal(d.date, '20151010');
    });

    it('applyDefaults = false', function(){
      let d = {};
      t.validate(d, {applyDefaults: false});
      assert.equal(d.user, undefined);
      assert.equal(d.date, undefined);
    });

    it('validate incompatible object', function(){
      let d = {
        user: {
          email: 'user@abc.com',
          nick: 100
        }
      };
      assert.throws(function (){
        t.validate(d, {applyDefaults: true});
      }, 'TypeError', 'user.nick');
    });
  });

  it('alias Integer for int', function (){
    let ns = new TemplateNamespace();
    ns.defineAlias('Integer', 'int');
    assert.equal(ns.resolve('Integer'), ns.resolve('int'));
  });

  it('import *', function(){
    let ns = new TemplateNamespace();
    ns.defineAlias('Integer', 'int');
    ns.defineType('TypeName', {name: ''});

    let ns2 = new TemplateNamespace(ns);
    assert.equal(ns2.resolve('Integer'), ns.resolve('Integer'));
    assert.equal(ns2.resolve('TypeName'), ns.resolve('TypeName'));
  });

  it('import TypeName', function(){
    let ns = new TemplateNamespace();
    ns.defineAlias('Integer', 'int');
    ns.defineType('TypeName', {name: ''});

    let ns2 = new TemplateNamespace(ns, ['TypeName']);
    assert.equal(ns2.resolve('Integer'), undefined);
    assert.equal(ns2.resolve('TypeName'), ns.resolve('TypeName'));
  });

  it('remove', function (){
    let ns = new TemplateNamespace();
    ns.defineAlias('Integer', 'int');
    ns.defineType('TypeName', {name: ''});
    ns.remove('TypeName');

    assert.equal(ns.resolve('Integer'), ns.resolve('int'));
    assert.equal(ns.resolve('TypeName'), undefined);
  });

  describe('Reference Errors', function (){
    it('using undefined type should throw', function (){
      let ns = new TemplateNamespace();
      assert.throws(function (){
        ns.createTemplate({unk: ':UndefinedType'});
      }, 'ReferenceError', 'UndefinedType');
    });

    it('import undefined type should throw', function (){
      let ns = new TemplateNamespace();
      assert.throws(function (){
        let ns2 = new TemplateNamespace();
        ns2.importFrom(ns, ['UndefinedType']);
      }, 'ReferenceError', 'UndefinedType');
    });

    it('alias for undefined type should throw', function (){
      assert.throws(function (){
        let ns = new TemplateNamespace();
        ns.defineAlias('StringArray', 'array<string>');
      }, 'ReferenceError', 'array<string>');
    });
  })
});
