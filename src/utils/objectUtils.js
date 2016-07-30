import { isObject } from  './typeUtils'


// inspiration:
//
// https://www.npmjs.com/package/seamless-immutable
// https://www.npmjs.com/package/ih
// https://www.npmjs.com/package/mutatis

// TODO: unit test clone

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

// TODO: test cloneDeep

/**
 * Deep clone the properties of an object or array
 * @param {Object | Array} value
 * @return {Object | Array} Returns a deep clone of the object or Array
 */
export function cloneDeep (value) {
  if (Array.isArray(value)) {
    return value.map(cloneDeep)
  }
  else if (isObject(value)) {
    const cloned = {}

    Object.keys(value).forEach(key => {
      cloned[key] = cloneDeep(value[key])
    })

    return cloned
  }
  else {
    // a primitive value
    return value
  }
}

// TODO: unit test getIn

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

  const key = path[0]
  let updated
  if (typeof key === 'string' && !isObject(object)) {
    updated = {}  // change into an object
  }
  else if (typeof key === 'number' && !Array.isArray(object)) {
    updated = []  // change into an array
  }
  else {
    updated = clone(object)
  }

  updated[key] = setIn(updated[key], path.slice(1), value)

  return updated
}

// TODO: unit test updateIn

/**
 * helper function to replace a nested property in an object with a new value
 * without mutating the object itself.
 *
 * @param {Object | Array} object
 * @param {Array.<string | number>} path
 * @param {function} callback
 * @return {Object | Array} Returns a new, updated object or array
 */
export function updateIn (object, path, callback) {
  if (path.length === 0) {
    return callback(object)
  }

  const key = path[0]
  let updated
  if (typeof key === 'string' && !isObject(object)) {
    updated = {}  // change into an object
  }
  else if (typeof key === 'number' && !Array.isArray(object)) {
    updated = []  // change into an array
  }
  else {
    updated = clone(object)
  }

  updated[key] = updateIn(updated[key], path.slice(1), callback)

  return updated
}

// TODO: unit test deleteIn

/**
 * helper function to delete a nested property in an object
 * without mutating the object itself.
 *
 * @param {Object | Array} object
 * @param {Array.<string | number>} path
 * @return {Object | Array} Returns a new, updated object or array
 */
export function deleteIn (object, path) {
  if (path.length === 0) {
    return object
  }

  if (path.length === 1) {
    const key = path[0]
    const updated = clone(object)
    if (Array.isArray(updated)) {
      updated.splice(key, 1)
    }
    else {
      delete updated[key]
    }

    return updated
  }

  const key = path[0]
  const child = object[key]
  if (Array.isArray(child) || isObject(child)) {
    const updated = clone(object)
    updated[key] = deleteIn(child, path.slice(1))
    return updated
  }
  else {
    // child property doesn't exist. just do nothing
    return object
  }
}
