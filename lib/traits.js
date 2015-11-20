'use strict';

/**
 * Tests whether a number is integer.
 * @param {number} val - the number to be tested.
 * @returns {boolean}
 */
exports.isInteger = function (val){
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
};

/**
 * Gets the type name.
 * @remarks This function doesn't checks value for int or char.
 * @param {*} value
 * @returns {String}
 */
exports.typeOf = function (value){
  if (value === null){
    return 'null';
  }
  if (Array.isArray(value)){
    return 'array';
  }
  return typeof value; // 'number', 'string', 'boolean', 'object'
};

/**
 * Extended type test.
 * @param {*} value - value to be tested.
 * @param {String} type - expected type.
 * @returns {boolean}
 */
exports.typeTest = function (value, type){
  let valType = exports.typeOf(value);
  if (valType === type){
    return true;
  }
  if (valType === 'number' && type === 'int'){
    return exports.isInteger(value);
  }
  if (valType === 'string' && type === 'char'){
    return value.length === 1;
  }
  return false;
};
