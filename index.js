'use strict';

const templates = require('./lib/templates');

/**
 * Creates a template from JSON string.
 * @param {String} data - template object in JSON.
 * @return {ValueTemplate}
 */
exports.createTemplateFromJSON = function (data){
  return exports.createTemplate(JSON.parse(data));
};

/**
 * Creates a template.
 * @param {*} template - a template object.
 * @return {ValueTemplate}
 */
exports.createTemplate = function (template){
  return templates.ValueTemplate.parse(template);
};

exports.ObjectTemplate = templates.ObjectTemplate;
exports.ArrayTemplate = templates.ArrayTemplate;
exports.ValueTemplate = templates.ValueTemplate;
