
// TODO: unit test isObject

/**
 * Test whether a value is an object (and not an Array or Date or primitive value)
 *
 * @param {*} value
 * @return {boolean}
 */
export function isObject (value) {
  return typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      value.toString() === '[object Object]'
}

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
