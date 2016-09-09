'use strict';

import { isObject, clone } from  './objectUtils'

/**
 * Immutability helpers
 *
 * inspiration:
 *
 * https://www.npmjs.com/package/seamless-immutable
 * https://www.npmjs.com/package/ih
 * https://www.npmjs.com/package/mutatis
 */


/**
 * helper function to get a nested property in an object or array
 *
 * @param {Object | Array} object
 * @param {Path} path
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

/**
 * helper function to replace a nested property in an object with a new value
 * without mutating the object itself.
 *
 * @param {Object | Array} object
 * @param {Path} path
 * @param {*} value
 * @return {Object | Array} Returns a new, updated object or array
 */
export function setIn (object, path, value) {
  if (path.length === 0) {
    return value
  }

  const key = path[0]
  const updated = cloneOrCreate(key, object)

  const updatedValue = setIn(updated[key], path.slice(1), value)
  if (updated[key] === updatedValue) {
    // return original object unchanged when the new value is identical to the old one
    return object
  }
  else {
    updated[key] = updatedValue
    return updated
  }
}
/**
 * helper function to replace a nested property in an object with a new value
 * without mutating the object itself.
 *
 * @param {Object | Array} object
 * @param {Path} path
 * @param {function} callback
 * @return {Object | Array} Returns a new, updated object or array
 */
export function updateIn (object, path, callback) {
  if (path.length === 0) {
    return callback(object)
  }

  const key = path[0]
  const updated = cloneOrCreate(key, object)

  const updatedValue = updateIn(object[key], path.slice(1), callback)
  if (updated[key] === updatedValue) {
    // return original object unchanged when the new value is identical to the old one
    return object
  }
  else {
    updated[key] = updatedValue
    return updated
  }
}

/**
 * helper function to delete a nested property in an object
 * without mutating the object itself.
 *
 * @param {Object | Array} object
 * @param {Path} path
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

/**
 * Helper function to clone an array or object, or to create a new object
 * when `object` is undefined. When object is anything else, the function will
 * throw an error
 * @param {string | number} key
 * @param {Object | Array | undefined} object
 * @return {Array | Object}
 */
function cloneOrCreate (key, object) {
  if (object === undefined) {
    return (typeof key === 'number') ? [] : {} // create new object or array
  }

  if (typeof object === 'object' || Array.isArray(object)) {
    return clone(object)
  }

  throw new Error('Cannot override existing property ' + JSON.stringify(object))
}
