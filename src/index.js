import _ from 'lodash';

import Config from './Config';
import Log from './Log';
import Form from './Form';
import Storage from './Storage';

const globalConfig = {
  debounceTime: 300,
  unchangedValueSaving: false,
  focusedFieldSaving: false,
};

export default {
  configure: function (config) {
    _.extend(globalConfig, config);
  },
  newForm: function(config) {
    // const newConfig = _.defaults(_.clone(config), globalConfig);

    const configInstance = new Config({});
    const thisconfig = configInstance.get();
    // TODO: не подключать так
    const events = thisconfig.eventEmitter;
    // TODO: не хранить silent - использовать глобальную опцию
    const log = new Log({silent: thisconfig.silent});
    const storage = new Storage();

    return new Form(storage, events, log);
  },
}
