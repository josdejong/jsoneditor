import { parseJSON } from './jsonUtils'

/**
 * escape a text, such that it can be displayed safely in an HTML element
 * @param {String} text
 * @param {boolean} [escapeUnicode=false]
 * @return {String} escapedText
 */
export function escapeHTML (text, escapeUnicode = false) {
  if (typeof text !== 'string') {
    return String(text)
  }
  else {
    let htmlEscaped = String(text)
    if (escapeUnicode === true) {
      // FIXME: should not unescape the just created non-breaking spaces \u00A0 ?
      htmlEscaped = escapeUnicodeChars(htmlEscaped)
    }

    htmlEscaped = htmlEscaped
        .replace(/  /g, ' \u00A0') // replace double space with an nbsp and space
        .replace(/^ /, '\u00A0')   // space at start
        .replace(/ $/, '\u00A0')   // space at end

    const json = JSON.stringify(htmlEscaped)
    return json.substring(1, json.length - 1) // remove enclosing double quotes
  }
}

/**
 * Escape unicode characters.
 * For example input '\u2661' (length 1) will output '\\u2661' (length 5).
 * @param {string} text
 * @return {string}
 */
export function escapeUnicodeChars (text) {
  // see https://www.wikiwand.com/en/UTF-16
  // note: we leave surrogate pairs as two individual chars,
  // as JSON doesn't interpret them as a single unicode char.
  return text.replace(/[\u007F-\uFFFF]/g, function(c) {
    return '\\u'+('0000' + c.charCodeAt(0).toString(16)).slice(-4)
  })
}

/**
 * unescape a string.
 * @param {String} escapedText
 * @return {String} text
 */
export function unescapeHTML (escapedText) {
  var json = '"' + escapeJSON(escapedText) + '"'
  var htmlEscaped = parseJSON(json)

  return htmlEscaped.replace(/\u00A0/g, ' ')  // nbsp character
}

/**
 * escape a text to make it a valid JSON string. The method will:
 *   - replace unescaped double quotes with '\"'
 *   - replace unescaped backslash with '\\'
 *   - replace returns with '\n'
 * @param {String} text
 * @return {String} escapedText
 * @private
 */
export function escapeJSON (text) {
  // TODO: replace with some smart regex (only when a new solution is faster!)
  var escaped = ''
  var i = 0
  while (i < text.length) {
    var c = text.charAt(i)
    if (c == '\n') {
      escaped += '\\n'
    }
    else if (c == '\\') {
      escaped += c
      i++

      c = text.charAt(i)
      if (c === '' || '"\\/bfnrtu'.indexOf(c) == -1) {
        escaped += '\\'  // no valid escape character
      }
      escaped += c
    }
    else if (c == '"') {
      escaped += '\\"'
    }
    else {
      escaped += c
    }
    i++
  }

  return escaped
}

/**
 * Find a unique name. Suffix the name with ' (copy)', '(copy 2)', etc
 * until a unique name is found
 * @param {string} name
 * @param {Array.<string>} invalidNames
 */
export function findUniqueName (name, invalidNames) {
  let validName = name
  let i = 1

  while (invalidNames.includes(validName)) {
    const copy = 'copy' + (i > 1 ? (' ' + i) : '')
    validName = `${name} (${copy})`
    i++
  }

  return validName
}

/**
 * Transform a text into lower case with the first character upper case
 * @param {string} text
 * @return {string}
 */
export function toCapital(text) {
  return text[0].toUpperCase() + text.substr(1).toLowerCase()
}
