'use strict';

/**
 * Convert part of a JSON object to a JSON string.
 * Use case is to stringify a small part of a large JSON object so you can see
 * a preview.
 *
 * @param {*} value
 * The value to convert to a JSON string.
 *
 * @param {number | string | null} [space]
 * A String or Number object that's used to insert white space into the output
 * JSON string for readability purposes. If this is a Number, it indicates the
 * number of space characters to use as white space; this number is capped at 10
 * if it's larger than that. Values less than 1 indicate that no space should be
 * used. If this is a String, the string (or the first 10 characters of the string,
 * if it's longer than that) is used as white space. If this parameter is not
 * provided (or is null), no white space is used.
 *
 * @param {number} [limit] Maximum size of the string output.
 *
 * @returns {string | undefined} Returns the string representation of the JSON object.
 */
function stringifyPartial(value, space, limit) {
  var _space; // undefined by default
  if (typeof space === 'number') {
    if (space > 10) {
      _space = repeat(' ', 10);
    }
    else if (space >= 1) {
      _space = repeat(' ', space);
    }
    // else ignore
  }
  else if (typeof space === 'string' && space !== '') {
    _space = space;
  }

  var output = stringifyValue(value, _space, '', limit);

  return output.length > limit
      ? (slice(output, limit) + '...')
      : output;
}

/**
 * Stringify a value
 * @param {*} value
 * @param {string} space
 * @param {string} indent
 * @param {number} limit
 * @return {string | undefined}
 */
function stringifyValue(value, space, indent, limit) {
  // boolean, null, number, string, or date
  if (typeof value === 'boolean' || value instanceof Boolean ||
      value === null ||
      typeof value === 'number' || value instanceof Number ||
      typeof value === 'string' || value instanceof String ||
      value instanceof Date) {
    return JSON.stringify(value);
  }

  // array
  if (Array.isArray(value)) {
    return stringifyArray(value, space, indent, limit);
  }

  // object (test lastly!)
  if (value && typeof value === 'object') {
    return stringifyObject(value, space, indent, limit);
  }

  return undefined;
}

/**
 * Stringify an array
 * @param {Array} array
 * @param {string} space
 * @param {string} indent
 * @param {number} limit
 * @return {string}
 */
function stringifyArray(array, space, indent, limit) {
  var childIndent = space ? (indent + space) : undefined;
  var str = space ? '[\n' : '[';

  for (var i = 0; i < array.length; i++) {
    var item = array[i];

    if (space) {
      str += childIndent;
    }

    if (typeof item !== 'undefined' && typeof item !== 'function') {
      str += stringifyValue(item, space, childIndent, limit);
    }
    else {
      str += 'null'
    }

    if (i < array.length - 1) {
      str += space ? ',\n' : ',';
    }

    // stop as soon as we're exceeding the limit
    if (str.length > limit) {
      return str + '...';
    }
  }

  str += space ? ('\n' + indent + ']') : ']';
  return str;
}

/**
 * Stringify an object
 * @param {Object} object
 * @param {string} space
 * @param {string} indent
 * @param {number} limit
 * @return {string}
 */
function stringifyObject(object, space, indent, limit) {
  var childIndent = space ? (indent + space) : undefined;
  var first = true;
  var str = space ? '{\n' : '{';

  if (typeof object.toJSON === 'function') {
    return stringifyValue(object.toJSON(), space, indent, limit);
  }

  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      var value = object[key];

      if (first) {
        first = false;
      }
      else {
        str += space ? ',\n' : ',';
      }

      str += space
          ? (childIndent + '"' + key + '": ')
          : ('"' + key + '":');

      str += stringifyValue(value, space, childIndent, limit);

      // stop as soon as we're exceeding the limit
      if (str.length > limit) {
        return str + '...';
      }
    }
  }

  str += space ? ('\n' + indent + '}') : '}';
  return str;
}

/**
 * Repeat a string a number of times.
 * Simple linear solution, we only need up to 10 iterations in practice
 * @param {string} text
 * @param {number} times
 * @return {string}
 */
function repeat (text, times) {
  var res = '';
  while (times-- > 0) {
    res += text;
  }
  return res;
}

/**
 * Limit the length of text
 * @param {string} text
 * @param {number} [limit]
 * @return {string}
 */
function slice(text, limit) {
  return typeof limit === 'number'
      ? text.slice(0, limit)
      : text;
}

/**
 * Test whether some text contains a JSON array, i.e. the first
 * non-white space character is a [
 * @param {string} jsonText
 * @return {boolean}
 */
function containsArray (jsonText) {
  return /^\s*\[/.test(jsonText)
}

exports.stringifyPartial = stringifyPartial;
exports.containsArray = containsArray;
