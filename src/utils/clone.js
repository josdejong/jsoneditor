import isObject from './isObject'

// TODO: unit test clone

/**
 * Flat clone the properties of an object or array
 * @param {Object | Array} value
 * @return {Object | Array} Returns a flat clone of the object or Array
 */
export default function clone (value) {
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
