'use strict';

import clone from 'lodash/clone'
import { isObjectOrArray, isObject } from  './typeUtils'

/**
 * Immutability helpers
 *
 * inspiration:
 *
 * https://www.npmjs.com/package/seamless-immutable
 * https://www.npmjs.com/package/ih
 * https://www.npmjs.com/package/mutatis
 * https://github.com/mariocasciaro/object-path-immutable
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
    if (isObjectOrArray(value)) {
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

  if (!isObjectOrArray(object)) {
    throw new Error('Path does not exist')
  }

  const key = path[0]
  const updatedValue = setIn(object[key], path.slice(1), value)
  if (object[key] === updatedValue) {
    // return original object unchanged when the new value is identical to the old one
    return object
  }
  else {
    const updatedObject = clone(object)
    updatedObject[key] = updatedValue
    return updatedObject
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

  if (!isObjectOrArray(object)) {
    throw new Error('Path doesn\'t exist')
  }

  const key = path[0]
  const updatedValue = updateIn(object[key], path.slice(1), callback)
  if (object[key] === updatedValue) {
    // return original object unchanged when the new value is identical to the old one
    return object
  }
  else {
    const updatedObject = clone(object)
    updatedObject[key] = updatedValue
    return updatedObject
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

  if (!isObjectOrArray(object)) {
    return object
  }

  if (path.length === 1) {
    const key = path[0]
    if (!(key in object)) {
      // key doesn't exist. return object unchanged
      return object
    }
    else {
      const updatedObject = clone(object)

      if (Array.isArray(updatedObject)) {
        updatedObject.splice(key, 1)
      }
      else {
        delete updatedObject[key]
      }

      return updatedObject
    }
  }

  const key = path[0]
  const updatedValue = deleteIn(object[key], path.slice(1))
  if (object[key] === updatedValue) {
    // object is unchanged
    return object
  }
  else {
    const updatedObject = clone(object)
    updatedObject[key] = updatedValue
    return updatedObject
  }
}

/**
 * Insert a new item in an array at a specific index.
 * Example usage:
 *
 *     insertAt({arr: [1,2,3]}, ['arr', '2'], 'inserted')  // [1,2,'inserted',3]
 *
 * @param {Object | Array} object
 * @param {Path} path
 * @param {*} value
 * @return {Array}
 */
export function insertAt (object, path, value) {
  const parentPath = path.slice(0, path.length - 1)
  const index = path[path.length - 1]

  return updateIn(object, parentPath, (items) => {
    if (!Array.isArray(items)) {
      throw new TypeError('Array expected at path ' + JSON.stringify(parentPath))
    }

    const updatedItems = items.slice(0)

    updatedItems.splice(index, 0, value)

    return updatedItems
  })
}
