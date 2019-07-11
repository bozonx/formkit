//import * as _ from 'lodash';
const defaultsDeep = require('lodash/defaultsDeep');
const extend = require('lodash/extend');

import Form from './Form';
import configDefaults from './configDefaults';
import Config from './interfaces/Config';
import Plugin from './interfaces/Plugin';

const globalConfig = configDefaults;
const plugins: Plugin[] = [];

export { default as Form } from './Form';
export { default as Field } from './Field';


export function setDefaultConfig(config: Config) {

  // TODO: review

  extend(globalConfig, config);
}

export function use(plugin: Plugin) {
  plugins.push(plugin);
}

export function newForm(config: Config) {
  const newConfig: Config = defaultsDeep({}, config, globalConfig);
  const newForm = new Form(newConfig);

  // init plugins which has a "afterNewFormCreated" method
  for (let plugin of plugins) {
    plugin.afterNewFormCreated && plugin.afterNewFormCreated(newForm);
  }

  return newForm;
}
