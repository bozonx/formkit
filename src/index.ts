import * as _ from 'lodash';
import Form from './Form';
import configDefaults from './configDefaults';
import Config from './interfaces/Config';
import Plugin from './interfaces/Plugin';

const globalConfig = configDefaults;
const plugins: Array<Plugin> = [];


export function setDefaultConfig(config: Config) {

  // TODO: review

  _.extend(globalConfig, config);
}

export function use(plugin: Plugin) {
  plugins.push(plugin);
}

export function newForm(config: Config) {
  const newConfig: Config = _.defaultsDeep(_.clone(config), globalConfig);
  const newForm = new Form(newConfig);

  // init plugins which has a "afterNewFormCreated" method
  _.each(plugins, (plugin) => plugin.afterNewFormCreated && plugin.afterNewFormCreated(newForm));

  return newForm;
}
