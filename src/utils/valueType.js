
/**
 * Get the type of a value
 * @param {*} value
 * @return {String} type
 */
export default function valueType(value) {
  if (value === null) {
    return 'null'
  }
  if (value === undefined) {
    return 'undefined'
  }
  if (typeof value === 'number') {
    return 'number'
  }
  if (typeof value === 'string') {
    return 'string'
  }
  if (typeof value === 'boolean') {
    return 'boolean'
  }
  if (value instanceof RegExp) {
    return 'regexp'
  }
  if (exports.isArray(value)) {
    return 'array'
  }

  return 'object'
}


/**
 * Test whether a text contains a url (matches when a string starts
 * with 'http://*' or 'https://*' and has no whitespace characters)
 * @param {String} text
 */
var isUrlRegex = /^https?:\/\/\S+$/
export function isUrl (text) {
  return (typeof text === 'string') && isUrlRegex.test(text)
}
