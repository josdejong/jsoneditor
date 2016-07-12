import isObject from './isObject'

// TODO: unit test getIn

/**
 * helper function to get a nested property in an object or array
 *
 * @param {Object | Array} object
 * @param {Array.<string | number>} path
 * @return {* | undefined} Returns the field when found, or undefined when the
 *                         path doesn't exist
 */
export default function getIn (object, path) {
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


window.getIn = getIn // TODO: cleanup
