'use strict';

const util = require('util');

/**
 * Supported type names.
 * @type {string[]}
 */
const TYPE_NAMES = [
  'int', 'number', 'string', 'boolean', 'char', 'null', 'array', 'object'
];

/**
 * Tests whether a number is integer.
 * @param {number} val - the number to be tested.
 * @returns {boolean}
 */
function isInteger(val){
  let num = val.toString();
  let i = 0;
  if (num[0] === '+' || num[0] === '-'){
    i = 1;
  }
  for (let n = num.length; i < n; ++i){
    if (num[i] > '9' || num[i] < '0'){
      return false;
    }
  }
  return true;
}

function valueTypeOf(val){
  if (val === null){
    return 'null';
  }
  if (Array.isArray(val)){
    return 'array';
  }
  return typeof val; // 'number', 'string', 'boolean', 'object'
}

function testValueType(val, type){
  let valType = valueTypeOf(val);
  if (valType === type){
    return true;
  }
  if (valType === 'number' && type === 'int'){
    return isInteger(val);
  }
  if (valType === 'string' && type === 'char'){
    return val.length === 1;
  }
  return false;
}

/**
 * Creates a TokenParser.
 * @param {string} stream - stream to be parsed.
 * @constructor
 */
function TokenParser(stream){
  this.remained = stream.trimLeft();
  this.current = null;
}

TokenParser.prototype = {
  constructor: TokenParser,

  /**
   * Move to next token in the stream.
   * @returns {string|undefined}
   */
  next: function () {
    if (!this.remained) {
      return undefined;
    }

    let p = this.remained.indexOf(' ');
    if (p < 0) {
      this.current = this.remained;
      this.remained = null;
    }
    else {
      this.current = this.remained.substr(0, p);
      this.remained = this.remained.substr(p + 1).trimLeft();
    }
    return this.current;
  }
};

/**
 * Creates a ValueTemplate.
 *
 * @param {string} type - type of the value.
 * @param {Object|undefined} defaultValue - default value.
 * @param {Object} [validator] - value validator(reserved, unused now).
 * @constructor
 */
function ValueTemplate(type, defaultValue, validator){
  this.type = type;
  this.defaultValue = defaultValue;
  this.validator = validator;
}

ValueTemplate.parse = function (value, context){
  context = context || [];
  let valueType = valueTypeOf(value);
  switch (valueType){
    case 'number':  // number constant
      return new ValueTemplate('number', value, null);
    case 'boolean': // boolean constant
      return new ValueTemplate('boolean', value, null);
    case 'null':    // null constant
      return new ValueTemplate('null', value, null);
    case 'string':
      if (value.length === 0 || value[0] !== ':'){
        return new ValueTemplate('string', value, null);
      }
      value = value.substr(1);
      if (value[0] === ':'){
        return new ValueTemplate('string', value, null);
      }
      if (!value){
        throw new SyntaxError(context.join('.') + ': bad value template.');
      }
      break;
    case 'array':
      return ArrayTemplate.parse(value);
    case 'object':
      return ObjectTemplate.parse(value);
  }

  let tokens = new TokenParser(value);
  let type = tokens.next(), defaultValue = undefined;
  if (TYPE_NAMES.indexOf(type) < 0){
    throw new SyntaxError(context.join('.') + ': unknown type name \'' + type + '\'.');
  }

  if (tokens.next()){
    if (tokens.current !== 'default'){
      throw new SyntaxError(context.join('.') + ': unexpected token \'' + tokens.current + '\'.');
    }
    if (!tokens.remained){
      throw new SyntaxError(context.join('.') + ': missing default value.');
    }
    try {
      defaultValue = JSON.parse(tokens.remained);
    }
    catch (err){
      throw new SyntaxError(context.join('.') + ': invalid default value.');
    }
    if (!testValueType(defaultValue, type)){
      throw new SyntaxError(context.join('.') + ': default value conflicts with declared type ' + type);
    }
  }

  if (type === 'array'){
    return new ArrayTemplate(defaultValue, null);
  }
  else if (type === 'object'){
    return new ObjectTemplate(defaultValue, null);
  }
  return new ValueTemplate(type, defaultValue, null);
};

/**
 * Validates a value for template compliance.
 *
 * @param {Array} value - value to be validated.
 * @param {object} [options] - validation options.
 *   @member {Array<string>} context - object context.
 *   @member {boolean} applyDefaults - apply default values for missing properties.
 */
ValueTemplate.prototype.validate = function (value, options){
  if (value === undefined && options && options.applyDefaults){
    return this.defaultValue;
  }
  if (!testValueType(value, this.type)){
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
 * @param {Array<ValueTemplate>} array - template definition.
 * @param {Array} [context] - template context.
 * @returns {ArrayTemplate}
 */
ArrayTemplate.parse = function (array, context){
  context = context || [];
  let itemTemplate = undefined;
  if (array.length){
    if (array.length !== 1){
      throw new SyntaxError(context.join('.') + ': array should not have multiple item templates.');
    }
    itemTemplate = ValueTemplate.parse(array[0], context);
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
 *   @member {Array<string>} context - object context.
 *   @member {boolean} applyDefaults - apply default values for missing properties.
 */
ArrayTemplate.prototype.validate = function (array, options){
  let applyDefaults = options && options.applyDefaults;
  if (array === undefined && applyDefaults){
    return this.defaultValue;
  }

  ValueTemplate.prototype.validate.call(this, array, options);
  if (this.itemTemplate){
    if (applyDefaults){
      for (let i = 0, n = array.length; i < n; ++i){
        array[i] = this.itemTemplate.validate(array[i], options);
      }
    }
    else {
      for (let i = 0, n = array.length; i < n; ++i){
        this.itemTemplate.validate(array[i], options);
      }
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
 * @param {Array} [context] - template context.
 * @returns {ObjectTemplate}
 */
ObjectTemplate.parse = function (object, context){
  context = context || [];
  let properties = [];
  for (let name in object){
    if (!object.hasOwnProperty(name)){
      continue;
    }
    context.push(name);
    let value = object[name];
    properties.push(PropertyTemplate.parse(name, value, context));
    context.pop();
  }
  return new ObjectTemplate(undefined, properties);
};

/**
 * Validates an object for template compliance.
 *
 * @param {object} object - object to be validated.
 * @param {object} [options] - validation options.
 *   @member {Array<string>} context - object context.
 *   @member {boolean} applyDefaults - apply default values for missing properties.
 */
ObjectTemplate.prototype.validate = function (object, options){
  let context = (options && options.context) || [];
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

PropertyTemplate.parse = function (nameSpec, valueSpec, context){
  let tokens = new TokenParser(nameSpec);
  let name = tokens.next(), required = false, nullable = true, defaultValue = undefined;
  if (!name){
    throw new SyntaxError(context.join('.') + ': empty property name.');
  }
  tokens.next();

  if (tokens.current === 'required'){
    required = true;
    tokens.next();
  }
  if (tokens.current === 'not'){
    if (tokens.next() !== 'null'){
      throw new SyntaxError(context.join('.') + ': unexpected constraint.');
    }
    nullable = false;
    required = true;
    tokens.next();
  }
  if (tokens.current === 'default'){
    if (!tokens.remained){
      throw new SyntaxError(context.join('.') + ': missing default value.');
    }
    defaultValue = JSON.parse(tokens.remained);
  }
  let template = ValueTemplate.parse(valueSpec);

  if (defaultValue !== undefined){
    if (required || !nullable){
      throw new SyntaxError(context.join('.') + ': default value assigned to a required property.');
    }
    if (template.defaultValue !== undefined){
      throw new SyntaxError(context.join('.') + ': multiple default values.');
    }
    if (!testValueType(defaultValue, template.type)){
      throw new SyntaxError(context.join('.') + ': default value conflicts with declared type ' + template.type);
    }
    template.defaultValue = defaultValue;
  }

  if (template.type === 'null' && !nullable){
    throw new SyntaxError(context.join('.') + ': null type must be nullable.');
  }
  return new PropertyTemplate(name, required, nullable, template);
};

PropertyTemplate.prototype.validate = function (value, options) {
  let applyDefaults = options && options.applyDefaults;
  let context = options && options.context;
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

exports.ObjectTemplate = ObjectTemplate;
exports.ArrayTemplate = ArrayTemplate;
exports.ValueTemplate = ValueTemplate;
