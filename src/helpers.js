import _ from 'lodash';

export function extendDeep(willExtend, newValues) {
  _.each(newValues, (value, name) => {
    if (_.isPlainObject(value)) {
      // create container if it isn't exist
      if (!_.isPlainObject(willExtend[name])) {
        willExtend[name] = {};
      }
      // run recursively
      extendDeep(willExtend[name], value)
    }
    else {
      willExtend[name] = value;
    }
  });

  return willExtend;
}

export function findInFieldRecursively(rootObject, cb) {
  const recursive = (obj) => {
    return _.find(obj, (item) => {
      if (!_.isPlainObject(item)) return;
      if (item.name) {
        // it's field
        return cb(item);
      }
      else {
        return recursive(item);
      }
    });
  };

  return recursive(rootObject);
}
