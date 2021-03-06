'use strict';

const util = require('util');
const TokenParser = require('./token_parser');
const traits = require('./traits');

/**
 * Creates a ValueTemplate.
 *
 * @param {string} type - type of the value.
 * @param {Object|undefined} defaultValue - default value.
 * @param {Object} [validator] - value validator(reserved, not used yet).
 * @constructor
 */
function ValueTemplate(type, defaultValue, validator){
  this.type = type;
  this.defaultValue = defaultValue;
  this.validator = validator;
}

/**
 * Parses a value template definition.
 * @param {*} value - value template definition to be parsed.
 * @param {Object} [options] - options controls the parsing
 *   @property {TemplateNamespace} [namespace] - current namespace.
 *   @property {Array<String>} [context] - template context.
 * @returns {*}
 */
ValueTemplate.parse = function (value, options){
  options = options || {};
  options.context = options.context || [];

  let context = options.context;
  let typeName = traits.typeOf(value);
  if (typeName === 'array'){
    return ArrayTemplate.parse(value, options);
  }
  if (typeName === 'object'){
    return ObjectTemplate.parse(value, options);
  }

  let buildFromString = false;
  if (typeName === 'string' && value.length > 0 && value[0] === ':'){
    // eat the first colon
    value = value.substr(1);
    if (!value){
      throw new SyntaxError(context.join('.') + ': empty type name or unescaped colon.');
    }

    // If a colon follows, then this is a constant string definition.
    buildFromString = value[0] !== ':';
  }

  if (!buildFromString){
    // direct constant, must be built-in type
    return new exports.builtin[typeName](value);
  }

  let tokens = new TokenParser(value);

  let templateType;
  typeName = tokens.next();
  if (options.namespace){
    templateType = options.namespace.resolve(typeName);
  }
  else {
    templateType = exports.builtin[typeName];
  }
  if (!templateType){
    throw new ReferenceError(context.join('.') + ': undefined type name \'' + typeName + '\'.')
  }

  let template = new templateType(undefined);

  if (tokens.next()){
    if (tokens.current !== 'default'){
      throw new SyntaxError(context.join('.') + ': unexpected token \'' + tokens.current + '\'.');
    }
    if (!tokens.remained){
      throw new SyntaxError(context.join('.') + ': missing default value.');
    }
    try {
      template.defaultValue = JSON.parse(tokens.remained);
    }
    catch (err){
      throw new SyntaxError(context.join('.') + ': invalid default value.');
    }
    try {
      template.validate(template.defaultValue);
    }
    catch (err){
      throw new SyntaxError(context.join('.') + ': default value conflicts with declared type ' + typeName);
    }
  }
  return template;
};

/**
 * Validates a value for template compliance.
 *
 * @param {*} value - value to be validated.
 * @param {object} [options] - validation options.
 *   @property {Array<string>} [context] - object context.
 *   @property {boolean} [applyDefaults] - apply default values for missing properties.
 */
ValueTemplate.prototype.validate = function (value, options){
  if (value === undefined && options && options.applyDefaults){
    return this.defaultValue;
  }
  if (!traits.typeTest(value, this.type)){
    let path = (options && options.context) ? options.context.join('.') : '';
    throw new TypeError(path + ': expects ' + this.type + ' but got ' + JSON.stringify(value));
  }
  return value;
};

/**
 * Creates an ArrayTemplate.
 *
 * @param {Array|undefined} defaultValue - default value.
 * @param {ValueTemplate} [itemTemplate] - template for each item in the array.
 * @constructor
 */
function ArrayTemplate(defaultValue, itemTemplate){
  ValueTemplate.call(this, 'array', defaultValue, null);
  this.itemTemplate = itemTemplate;
}

util.inherits(ArrayTemplate, ValueTemplate);

/**
 * Parses an array template definition.
 *
 * @param {Array} array - template definition.
 * @param {Object} [options] - options controls the parsing
 *   @property {TemplateNamespace} [namespace] - current namespace.
 *   @property {Array<String>} [context] - template context.
 * @returns {ArrayTemplate}
 */
ArrayTemplate.parse = function (array, options){
  options = options || {};
  options.context = options.context || [];

  let context = options.context;
  let itemTemplate = undefined;
  if (array.length){
    if (array.length !== 1){
      throw new SyntaxError(context.join('.') + ': array should not have multiple item templates.');
    }
    itemTemplate = ValueTemplate.parse(array[0], options);
    if (itemTemplate.defaultValue !== undefined){
      throw new SyntaxError(context.join('.') + ': array item should not have default value.');
    }
  }
  return new ArrayTemplate(undefined, itemTemplate);
};

/**
 * Validates an array for template compliance.
 *
 * @param {Array} array - array object to be validated.
 * @param {object} [options] - validation options.
 *   @property {Array<string>} [context] - object context.
 *   @property {boolean} [applyDefaults] - apply default values for missing properties.
 */
ArrayTemplate.prototype.validate = function (array, options){
  let applyDefaults = options && options.applyDefaults;
  if (array === undefined && applyDefaults){
    return this.defaultValue;
  }

  ValueTemplate.prototype.validate.call(this, array, options);
  if (this.itemTemplate){
    for (let i = 0, n = array.length; i < n; ++i){
      this.itemTemplate.validate(array[i], options);
    }
  }
  return array;
};


/**
 * Creates an ObjectTemplate.
 *
 * @param {object} defaultValue - default value.
 * @param {Array<PropertyTemplate>|null} properties - templates of object properties
 * @constructor
 */
function ObjectTemplate(defaultValue, properties){
  ValueTemplate.call(this, 'object', defaultValue, null);
  this.properties = properties || [];
}

util.inherits(ObjectTemplate, ValueTemplate);

/**
 * Parses an object template definition.
 *
 *   ObjectTemplate :=  \{PropertyTemplate's\}
 * PropertyTemplate := name [required] [not null] [default value] : ValueTemplate
 *    ValueTemplate := type-constraint | ArrayTemplate | ObjectTemplate
 *    ArrayTemplate := \[ValueTemplate\]
 *  type-constraint := int|number|string|boolean|char|null [default value]
 *
 * @param {object} object - template definition.
 * @param {Object} [options] - options controls the parsing
 *   @property {TemplateNamespace} [namespace] - current namespace.
 *   @property {Array<String>} [context] - template context.
 * @returns {ObjectTemplate}
 */
ObjectTemplate.parse = function (object, options){
  options = options || {};
  options.context = options.context || [];

  let context = options.context;
  let properties = [];
  for (let name in object){
    if (!object.hasOwnProperty(name)){
      continue;
    }
    context.push(TokenParser.first(name));
    let value = object[name];
    properties.push(PropertyTemplate.parse(name, value, options));
    context.pop();
  }
  return new ObjectTemplate(undefined, properties);
};

/**
 * Validates an object for template compliance.
 *
 * @param {object} object - object to be validated.
 * @param {object} [options] - validation options.
 *   @property {Array<string>} [context] - object context.
 *   @property {boolean} [applyDefaults] - apply default values for missing properties.
 */
ObjectTemplate.prototype.validate = function (object, options){
  options = options || {};
  options.context = options.context || [];

  let context = options.context;
  let applyDefaults = options && options.applyDefaults;
  options = {context, applyDefaults};
  if (object === undefined && applyDefaults){
    return this.defaultValue;
  }

  ValueTemplate.prototype.validate.call(this, object, options);

  if (applyDefaults){
    this.properties.forEach(function (prop) {
      context.push(prop.name);
      object[prop.name] = prop.validate(object[prop.name], options);
      context.pop();
    });
  }
  else {
    this.properties.forEach(function (prop) {
      context.push(prop.name);
      prop.validate(object[prop.name], options);
      context.pop();
    });
  }
  return object;
};

/**
 * Creates a PropertyTemplate.
 *
 * @param {object} name - property name.
 * @param {boolean} required - whether this property is required.
 * @param {boolean} nullable - whether this property value can be null.
 * @param {object} template - property value template.
 * @constructor
 */
function PropertyTemplate(name, required, nullable, template){
  this.name = name;
  this.required = required;
  this.nullable = nullable;
  this.template = template;
}

PropertyTemplate.parse = function (nameSpec, valueSpec, options){
  let context = options.context;

  let tokens = new TokenParser(nameSpec);
  let name = tokens.next(),
      required = false,
      nullable = true,
      defaultValue = undefined;
  if (!name){
    throw new SyntaxError(context.join('.') + ': empty property name.');
  }
  tokens.next();

  if (tokens.current === 'required'){
    required = true;
    nullable = false;
    tokens.next();
  }

  if (tokens.current === 'nullable'){
    nullable = true;
    tokens.next();
  }

  if (tokens.current){
    if (tokens.current === 'default'){
      if (!tokens.remained){
        throw new SyntaxError(context.join('.') + ': missing default value.');
      }
      defaultValue = JSON.parse(tokens.remained);
      tokens.done();
    }
    else {
      throw new SyntaxError(context.join('.') + ': unexpected token \'' + tokens.current + '\'');
    }
  }

  let template = ValueTemplate.parse(valueSpec, options);

  if (defaultValue !== undefined){
    if (required){
      throw new SyntaxError(context.join('.') + ': default value is assigned to a required property.');
    }
    if (template.defaultValue !== undefined){
      throw new SyntaxError(context.join('.') + ': multiple default values.');
    }
    try {
      template.validate(defaultValue);
    }
    catch (err){
      throw new SyntaxError(context.join('.') + ': default value conflicts with declared type ' + template.type);
    }
    template.defaultValue = defaultValue;
  }

  return new PropertyTemplate(name, required, nullable, template);
};

PropertyTemplate.prototype.validate = function (value, options) {
  let applyDefaults = options.applyDefaults;
  let context = options.context;
  if (value === undefined){
    if (this.required || !this.nullable){
      throw new TypeError(context.join('.') + ': property is required but missing.');
    }
    return applyDefaults ? this.template.defaultValue : undefined;
  }

  if (value === null){
    if (!this.nullable){
      throw new TypeError(context.join('.') + ': property is not nullable.');
    }
    return null;
  }
  return this.template.validate(value, options);
};

class NumberTemplate extends ValueTemplate {
  constructor(defaultValue){
    super('number', defaultValue, null);
  }
}

class IntTemplate extends ValueTemplate {
  constructor(defaultValue){
    super('int', defaultValue, null);
  }
}

class StringTemplate extends ValueTemplate {
  constructor(defaultValue){
    super('string', defaultValue, null);
  }
}

class CharTemplate extends ValueTemplate {
  constructor(defaultValue){
    super('char', defaultValue, null);
  }
}

class BooleanTemplate extends ValueTemplate {
  constructor(defaultValue){
    super('boolean', defaultValue, null);
  }
}

class NullTemplate extends ValueTemplate {
  constructor(defaultValue){
    super('null', defaultValue, null);
  }
}

class AnyTemplate extends ValueTemplate {
  constructor(defaultValue){
    super('any', defaultValue, null);
  }
}

/**
 * Built-in types.
 */
exports.builtin = {
  'number': NumberTemplate,
  'int': IntTemplate,
  'string': StringTemplate,
  'char': CharTemplate,
  'boolean': BooleanTemplate,
  'null': NullTemplate,
  'array': ArrayTemplate,
  'object': ObjectTemplate,
  'any': AnyTemplate
};

exports.ObjectTemplate = ObjectTemplate;
exports.ArrayTemplate = ArrayTemplate;
exports.ValueTemplate = ValueTemplate;
