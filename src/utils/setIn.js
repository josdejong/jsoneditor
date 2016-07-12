import isObject from './isObject'
import clone from './clone'

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
export default function setIn (object, path, value) {
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


window.setIn = setIn // TODO: cleanup
