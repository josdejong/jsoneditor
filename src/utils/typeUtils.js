
/**
 * Get the type of a value
 * @param {*} value
 * @return {String} type
 */
export function valueType(value) {
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
  if (Array.isArray(value)) {
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

/**
 * Convert contents of a string to the correct JSON type. This can be a string,
 * a number, a boolean, etc
 * @param {String} str
 * @return {*} castedStr
 * @private
 */
export function stringConvert (str) {
  const num = Number(str)           // will nicely fail with '123ab'
  const numFloat = parseFloat(str)  // will nicely fail with '  '

  if (str == '') {
    return ''
  }
  else if (str == 'null') {
    return null
  }
  else if (str == 'true') {
    return true
  }
  else if (str == 'false') {
    return false
  }
  else if (!isNaN(num) && !isNaN(numFloat)) {
    return num
  }
  else {
    return str
  }
}
