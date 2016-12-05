import _ from 'lodash';

import Log from './Log';
import Form from './Form';
import Storage from './Storage';
import EventEmitter from 'eventemitter3';


const globalConfig = {
  debounceTime: 300,
  unchangedValueSaving: false,
  focusedFieldSaving: false,
  silent: false,
};

export default {
  configure: function (config) {
    _.extend(globalConfig, config);
  },
  newForm: function(config) {
    const newConfig = _.defaults(_.clone(config), globalConfig);
    const events = new EventEmitter();

    // TODO: не хранить silent - использовать глобальную опцию
    const log = new Log({silent: newConfig.silent});
    const storage = new Storage();

    return new Form(storage, events, log);
  },
}
