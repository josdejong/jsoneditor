import { isObject } from  './typeUtils'
// TODO: unit test getIn

/**
 * Flat clone the properties of an object or array
 * @param {Object | Array} value
 * @return {Object | Array} Returns a flat clone of the object or Array
 */
export function clone (value) {
  if (Array.isArray(value)) {
    return value.slice(0)
  }
  else if (isObject(value)) {
    const cloned = {}

    Object.keys(value).forEach(key => {
      cloned[key] = value[key]
    })

    return cloned
  }
  else {
    // a primitive value
    return value
  }
}

/**
 * helper function to get a nested property in an object or array
 *
 * @param {Object | Array} object
 * @param {Array.<string | number>} path
 * @return {* | undefined} Returns the field when found, or undefined when the
 *                         path doesn't exist
 */
export function getIn (object, path) {
  let value = object
  let i = 0

  while(i < path.length) {
    if (Array.isArray(value) || isObject(value)) {
      value = value[path[i]]
    }
    else {
      value = undefined
    }

    i++
  }

  return value
}

// TODO: unit test setIn

/**
 * helper function to replace a nested property in an object with a new value
 * without mutating the object itself.
 *
 * @param {Object | Array} object
 * @param {Array.<string | number>} path
 * @param {*} value
 * @return {Object | Array} Returns a new, updated object or array
 */
export function setIn (object, path, value) {
  if (path.length === 0) {
    return value
  }

  // TODO: change array into object and vice versa when key is a number/string

  const key = path[0]
  const child = (Array.isArray(object[key]) || isObject(object[key]))
      ? object[key]
      : (typeof path[1] === 'number' ? [] : {})
  const updated = clone(object)

  updated[key] = setIn(child, path.slice(1), value)

  return updated
}

/**
 * Rename a field in an object without mutating the object itself.
 * The order of the fields in the object is maintained.
 * @param {Object} object
 * @param {string} oldField
 * @param {string} newField
 * @return {Object} Returns a clone of the object where property `oldField` is
 *                  renamed to `newField`
 */
export function renameField(object, oldField, newField) {
  const renamed = {}

  // important: maintain the order in which we add the properties to newValue,
  // else the field will "jump" to another place
  Object.keys(object).forEach(field => {
    if (field === oldField) {
      renamed[newField] = object[oldField]
    }
    else {
      renamed[field] = object[field]
    }
  })

  return renamed
}

