'use strict';

const templates = require('./lib/templates');

/**
 * Load a template from JSON string.
 * @param {String} data - template object in JSON.
 * @return {ValueTemplate}
 */
exports.loadTemplateFromJSON = function (data){
  return exports.loadTemplate(JSON.parse(data));
};

/**
 * Load a template.
 * @param {*} template - a template object.
 * @return {ValueTemplate}
 */
exports.loadTemplate = function (template){
  return templates.ValueTemplate.parse(template);
};

exports.ObjectTemplate = templates.ObjectTemplate;
exports.ArrayTemplate = templates.ArrayTemplate;
exports.ValueTemplate = templates.ValueTemplate;
