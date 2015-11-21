'use strict';

const templates = require('./lib/templates');
const TemplateNamespace = require('./lib/namespace');

/**
 * Creates a template from JSON string.
 * @param {String} data - template object in JSON.
 * @param {Object} [options]
 *   @property {TemplateNamespace} [namespace] - current namespace
 * @return {ValueTemplate}
 */
exports.createTemplateFromJSON = function (data, options){
  return exports.createTemplate(JSON.parse(data), options);
};

/**
 * Creates a template.
 * @param {*} template - a template object.
 * @param {Object} [options]
 *   @property {TemplateNamespace} [namespace] - current namespace
 * @return {ValueTemplate}
 */
exports.createTemplate = function (template, options){
  return templates.ValueTemplate.parse(template, options);
};

/**
 * Creates a template namespace, importing names from an existing namespace.
 * @param {TemplateNamespace} [namespace]
 * @param {Array<String>} [names] - names to import
 * @constructor
 */
exports.createNamespace = function (namespace, names){
  return new TemplateNamespace(namespace, names);
};

exports.ObjectTemplate = templates.ObjectTemplate;
exports.ArrayTemplate = templates.ArrayTemplate;
exports.ValueTemplate = templates.ValueTemplate;
exports.TemplateNamespace = TemplateNamespace;
