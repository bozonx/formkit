/* eslint func-style: off */

import _ from 'lodash';

export function extendDeep(willExtend, newValues) {
  _.each(newValues, (value, name) => {
    if (_.isPlainObject(value)) {
      // create container if it isn't exist
      if (!_.isPlainObject(willExtend[name])) {
        willExtend[name] = {};
      }
      // run recursively
      extendDeep(willExtend[name], value);
    }
    else {
      willExtend[name] = value;
    }
  });

  return willExtend;
}

export function findInFieldRecursively(rootObject, cb) {
  const recursive = (obj) => _.find(obj, (item) => {
    if (_.isPlainObject(item)) {
      return recursive(item);
    }
    else if (_.isObject(item)) {
      // it's field
      return cb(item);
    }
  });

  return recursive(rootObject);
}

export function calculateDirty(value, savedValue) {
  let newDirtyValue;

  // null, undefined and '' - the same, means dirty = false. 0 compares as a common value.
  if ((value === '' || _.isNil(value))
    && (savedValue === '' || _.isNil(savedValue))) {
    newDirtyValue = false;
  }
  else {
    // just compare current value and saved value
    newDirtyValue = value !== savedValue;
  }

  return newDirtyValue;
}

export function getFieldName(pathToField) {
  const split = pathToField.split('.');
  const onlyOneItem = 1;

  if (split.length <= onlyOneItem) return pathToField;

  return _.last(split);
}

export function parseValidateCbReturn(cbReturn) {
  const invalidMsg = (_.isString(cbReturn) && cbReturn !== '') ? cbReturn : undefined;
  let result;
  if (cbReturn === true) {
    result = true;
  }
  else if (invalidMsg) {
    result = invalidMsg;
  }
  else {
    result = false;
  }

  return {
    valid: cbReturn === true,
    invalidMsg,
    result,
  };
}
