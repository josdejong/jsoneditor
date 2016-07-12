/**
 * escape a text, such that it can be displayed safely in an HTML element
 * @param {String} text
 * @param {boolean} [escapeUnicode=false]
 * @return {String} escapedText
 */
export default function escapeHTML (text, escapeUnicode = false) {
  if (typeof text !== 'string') {
    return String(text)
  }
  else {
    var htmlEscaped = String(text)
        .replace(/&/g, '&amp;')    // must be replaced first!
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/  /g, ' &nbsp;') // replace double space with an nbsp and space
        .replace(/^ /, '&nbsp;')   // space at start
        .replace(/ $/, '&nbsp;');  // space at end

    var json = JSON.stringify(htmlEscaped)
    var html = json.substring(1, json.length - 1)
    if (escapeUnicode === true) {
      html = escapeUnicodeChars(html)
    }
    return html
  }
}

/**
 * Escape unicode characters.
 * For example input '\u2661' (length 1) will output '\\u2661' (length 5).
 * @param {string} text
 * @return {string}
 */
function escapeUnicodeChars (text) {
  // see https://www.wikiwand.com/en/UTF-16
  // note: we leave surrogate pairs as two individual chars,
  // as JSON doesn't interpret them as a single unicode char.
  return text.replace(/[\u007F-\uFFFF]/g, function(c) {
    return '\\u'+('0000' + c.charCodeAt(0).toString(16)).slice(-4)
  })
}