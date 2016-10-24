import _ from 'lodash';

import Field from './Field';

export default class FieldsManager {
  constructor(name) {
    this.state = {
      name: name,
      value: null,
      valid: null,
      dirty: null,
      touched: null,
      disabled: null,
      checked: null,
      errorMsg: null,
      placeholder: null,
      //focused: null,
      //validateRule: null,
    }
  }

  setState(newState) {
    // TODO: тут нужнен deep extend
    _.extend(this.state, newState);
  }

}
