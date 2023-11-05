//import * as _ from 'lodash';
const defaultsDeep = require('lodash/defaultsDeep')
const extend = require('lodash/extend')

import {Form} from './Form.js'
import {configDefaults} from './configDefaults.js'
import type {Config} from './types/Config.js'
import type {Plugin} from './types/Plugin.js'

const globalConfig = configDefaults;
const plugins: Plugin[] = [];

export {Form} from './Form.js'
export {Field} from './Field.js'


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
