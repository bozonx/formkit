const _ = require('lodash');
const Form = require('./Form');
const configDefaults = require('./configDefaults');

const globalConfig = configDefaults;
const plugins = [];


module.exports = {
  setDefaultConfig: (config) => {
    _.extend(globalConfig, config);
  },
  newForm: (config) => {
    const newConfig = _.defaultsDeep(_.clone(config), globalConfig);

    const newForm = new Form(newConfig);

    // init plugins which has a "afterNewFormCreated" method
    _.each(plugins, (plugin) => plugin.afterNewFormCreated && plugin.afterNewFormCreated(newForm));

    return newForm;
  },
  use: (plugin) => {
    plugins.push(plugin);
  },
};
