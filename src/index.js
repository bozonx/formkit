import _ from 'lodash';

import Main from './Main';

const globalConfig = {};

export default {
  configure: function (config) {
    _.extend(globalConfig, config);
  },
  newForm: function(config, schema) {
    const newConfig = _.defaults(_.clone(config), globalConfig);
    return new Main(newConfig, schema);
  },
}
