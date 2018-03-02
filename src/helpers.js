/* eslint func-style: off */

const _ = require('lodash');


module.exports = {
  extendDeep(willExtend, newValues) {
    _.each(newValues, (value, name) => {
      if (_.isPlainObject(value)) {
        // create container if it isn't exist
        if (!_.isPlainObject(willExtend[name])) {
          willExtend[name] = {};
        }
        // run recursively
        this.extendDeep(willExtend[name], value);
      }
      else {
        willExtend[name] = value;
      }
    });

    return willExtend;
  },

  findInFieldRecursively(rootObject, cb) {
    const recursive = (obj) => _.find(obj, (item) => {
      if (_.isPlainObject(item)) {
        // it's a container
        return recursive(item);
      }
      else if (_.isObject(item)) {
        // it's a field
        return cb(item);
      }
    });

    return recursive(rootObject);
  },

  /**
   * It works with structure like this:
   *     {
   *       parent: {
   *         // this will be pass to callback: cb({fieldProp: 'value'}, 'parent.field')
   *         field: {
   *           fieldProp: 'value'
   *         }
   *       }
   *     }
   * @param rootObject
   * @param cb
   */
  findFieldLikeStructureRecursively(rootObject, cb) {
    const isContainer = (item) => {
      let container = true;
      _.find(item, (field) => {
        if (!_.isPlainObject(field)) {
          container = false;

          return true;
        }
      });

      return container;
    };

    const recursive = (obj, rootPath) => _.find(obj, (item, name) => {
      const itemPath = _.trim(`${rootPath}.${name}`, '.');

      if (_.isPlainObject(item) && isContainer(item)) {
        return recursive(item, itemPath);
      }
      else {
        // it's field
        return cb(item, itemPath);
      }
    });

    return recursive(rootObject, '');
  },

  /**
   * It works with common structures like
   *     {
   *       parent: {
   *         prop: 'value'
   *       }
   *     }
   * @param rootObject
   * @param cb
   */
  findRecursively(rootObject, cb) {
    const recursive = (obj, rootPath) => _.find(obj, (item, name) => {
      const itemPath = _.trim(`${rootPath}.${name}`, '.');

      if (_.isPlainObject(item)) {
        return recursive(item, itemPath);
      }
      else {
        // it's field
        return cb(item, itemPath);
      }
    });

    return recursive(rootObject, '');
  },

  calculateDirty(value, savedValue) {
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
  },

  getFieldName(pathToField) {
    const split = pathToField.split('.');
    const onlyOneItem = 1;

    if (split.length <= onlyOneItem) return pathToField;

    return _.last(split);
  },

  parseValidateCbReturn(cbReturn) {
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
  },

  isPromise(unknown) {
    return _.isObject(unknown) && unknown.then;
  },

};
