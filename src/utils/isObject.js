/**
 * Test whether a value is an object (and not an Array or Date or primitive value)
 *
 * @param {*} value
 * @return {boolean}
 */
export default function isObject (value) {
  return typeof value === 'object' &&
      value &&  // not null
      !Array.isArray(value) &&
      value.toString() === '[object Object]'
}