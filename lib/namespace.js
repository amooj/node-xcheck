'use strict';

const templates = require('./templates');
const ValueTemplate = templates.ValueTemplate;

/**
 * Template namespace.
 * @param {TemplateNamespace} [namespace]
 * @param {Array<String>} [names] - names to import
 * @constructor
 */
function TemplateNamespace(namespace, names){
  this.names = {};
  if (namespace){
    this.importFrom(namespace, names);
  }
}

TemplateNamespace.prototype = {
  constructor: TemplateNamespace,

  /**
   * Import type names from another namespace.
   * @param {TemplateNamespace} namespace
   * @param {Array<String>} [names] - names to import
   * @returns {TemplateNamespace}
   */
  importFrom: function (namespace, names){
    if (names){
      for (let i = 0, n = names.length; i < n; ++i){
        let typeName = names[i];
        if (namespace.names.hasOwnProperty(typeName)){
          this.names[typeName] = namespace.names[typeName];
        }
        else {
          throw new ReferenceError('import error: undefined type \'' + typeName + '\'');
        }
      }
    }
    else {
      // import *
      for (let typeName in namespace.names){
        if (namespace.names.hasOwnProperty(typeName)){
          this.names[typeName] = namespace.names[typeName];
        }
      }
    }
    return this;
  },

  /**
   * Defines an typename alias.
   * @param {String} alias
   * @param {String} typeName - existing template type, may be a built-in type.
   */
  defineAlias: function(alias, typeName){
    let template = this.resolve(typeName);
    if (!template){
      throw new ReferenceError('bad alias \'' + alias + '\': type \'' + typeName + '\' is undefined');
    }
    this.names[alias] = template;
  },

  /**
   * Defines a template type.
   * @param {String} typeName - name of the new type.
   * @param {*|ValueTemplate} template - base template of the new type.
   */
  defineType: function(typeName, template){
    if (!(template instanceof ValueTemplate)){
      template = ValueTemplate.parse(template, {namespace:this});
    }
    class UserDefinedTemplate extends ValueTemplate{
      constructor(defaultValue, validator){
        super(typeName, defaultValue, validator);
        this.template = template;
      }

      validate(value, options){
        return this.template.validate(value, options);
      }
    }
    this.names[typeName] = UserDefinedTemplate;
    return this;
  },

  /**
   * Removes a type name from current namespace.
   * @param {String} typeName - name of the type to be removed.
   */
  remove: function (typeName){
    delete this.names[typeName];
  },

  resolve: function (typeName){
    // User defined names first to allow built-in types overriding.
    return this.names[typeName] || templates.builtin[typeName];
  },

  createTemplate: function (template, options){
    options = options || {};
    options.namespace = this;
    return ValueTemplate.parse(template, options)
  }
};

module.exports = TemplateNamespace;
