import _ from 'lodash';
import EventEmitter from 'eventemitter3';

import Form from './Form';
import configDefaults from './configDefaults';

const globalConfig = configDefaults;
const plugins = [];


module.exports = {
  setDefaultConfig: (config) => {
    _.extend(globalConfig, config);
  },
  newForm: (config) => {
    const newConfig = _.defaults(_.clone(config), globalConfig);

    const eventEmitter = new EventEmitter();
    const newForm = new Form(newConfig, eventEmitter);

    // init plugins which has a "afterNewFormCreated" method
    _.each(plugins, (plugin) => plugin.afterNewFormCreated && plugin.afterNewFormCreated(newForm));

    return newForm;
  },
  use: (plugin) => {
    plugins.push(plugin);
  },
};
