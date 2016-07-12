import parseJSON from './parseJSON'
/**
 * unescape a string.
 * @param {String} escapedText
 * @return {String} text
 */
export default function unescapeHTML (escapedText) {
  var json = '"' + escapeJSON(escapedText) + '"'
  var htmlEscaped = parseJSON(json)

  return htmlEscaped
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;|\u00A0/g, ' ')
      .replace(/&amp;/g, '&')   // must be replaced last
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