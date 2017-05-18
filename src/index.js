import _ from 'lodash';

import Form from './Form';
import Storage from './Storage';
import EventEmitter from 'eventemitter3';


const globalConfig = {
  silent: false,
  debounceTime: 800,
  unchangedValueSaving: false,
  allowFocusedFieldUpdating: false,
  allowSubmitSubmittingForm: false,
  allowSubmitUnchangedForm: false,
  updateOuterValuesAfterSubmit: true,
};

const plugins = [];

export default {
  setDefaults: (config) => {
    _.extend(globalConfig, config);
  },
  newForm: (config) => {
    const newConfig = _.defaults(_.clone(config), globalConfig);
    const events = new EventEmitter();
    const storage = new Storage();

    const newForm = new Form(storage, newConfig, events);

    _.each(plugins, (plugin) => plugin.afterNewFormCreated && plugin.afterNewFormCreated(newForm));

    return newForm;
  },
  use: (plugin) => {
    plugins.push(plugin);
  },
};
