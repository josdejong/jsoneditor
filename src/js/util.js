'use strict';

var jsonlint = require('./assets/jsonlint/jsonlint');
var jsonMap = require('json-source-map');

/**
 * Parse JSON using the parser built-in in the browser.
 * On exception, the jsonString is validated and a detailed error is thrown.
 * @param {String} jsonString
 * @return {JSON} json
 */
exports.parse = function parse(jsonString) {
  try {
    return JSON.parse(jsonString);
  }
  catch (err) {
    // try to throw a more detailed error message using validate
    exports.validate(jsonString);

    // rethrow the original error
    throw err;
  }
};

/**
 * Sanitize a JSON-like string containing. For example changes JavaScript
 * notation into JSON notation.
 * This function for example changes a string like "{a: 2, 'b': {c: 'd'}"
 * into '{"a": 2, "b": {"c": "d"}'
 * @param {string} jsString
 * @returns {string} json
 */
exports.sanitize = function (jsString) {
  // escape all single and double quotes inside strings
  var chars = [];
  var i = 0;

  //If JSON starts with a function (characters/digits/"_-"), remove this function.
  //This is useful for "stripping" JSONP objects to become JSON
  //For example: /* some comment */ function_12321321 ( [{"a":"b"}] ); => [{"a":"b"}]
  var match = jsString.match(/^\s*(\/\*(.|[\r\n])*?\*\/)?\s*[\da-zA-Z_$]+\s*\(([\s\S]*)\)\s*;?\s*$/);
  if (match) {
    jsString = match[3];
  }

  var controlChars = {
    '\b': '\\b',
    '\f': '\\f',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t'
  };

  var quote = '\'';
  var quoteDbl = '"';
  var quoteLeft = '\u2018';
  var quoteRight = '\u2019';
  var quoteDblLeft = '\u201C';
  var quoteDblRight = '\u201D';
  var graveAccent = '\u0060';
  var acuteAccent = '\u00B4';

  // helper functions to get the current/prev/next character
  function curr () { return jsString.charAt(i);     }
  function next()  { return jsString.charAt(i + 1); }
  function prev()  { return jsString.charAt(i - 1); }

  function isWhiteSpace(c) {
    return c === ' ' || c === '\n' || c === '\r' || c === '\t';
  }

  // get the last parsed non-whitespace character
  function lastNonWhitespace () {
    var p = chars.length - 1;

    while (p >= 0) {
      var pp = chars[p];
      if (!isWhiteSpace(pp)) {
        return pp;
      }
      p--;
    }

    return '';
  }

  // get at the first next non-white space character
  function nextNonWhiteSpace() {
    var iNext = i + 1;
    while (iNext < jsString.length && isWhiteSpace(jsString[iNext])) {
      iNext++;
    }

    return jsString[iNext];
  }

  // skip a block comment '/* ... */'
  function skipBlockComment () {
    i += 2;
    while (i < jsString.length && (curr() !== '*' || next() !== '/')) {
      i++;
    }
    i += 2;
  }

  // skip a comment '// ...'
  function skipComment () {
    i += 2;
    while (i < jsString.length && (curr() !== '\n')) {
      i++;
    }
  }

  // parse single or double quoted string
  function parseString(endQuote) {
    chars.push('"');
    i++;
    var c = curr();
    while (i < jsString.length && c !== endQuote) {
      if (c === '"' && prev() !== '\\') {
        // unescaped double quote, escape it
        chars.push('\\"');
      }
      else if (controlChars.hasOwnProperty(c)) {
        // replace unescaped control characters with escaped ones
        chars.push(controlChars[c])
      }
      else if (c === '\\') {
        // remove the escape character when followed by a single quote ', not needed
        i++;
        c = curr();
        if (c !== '\'') {
          chars.push('\\');
        }
        chars.push(c);
      }
      else {
        // regular character
        chars.push(c);
      }

      i++;
      c = curr();
    }
    if (c === endQuote) {
      chars.push('"');
      i++;
    }
  }

  // parse an unquoted key
  function parseKey() {
    var specialValues = ['null', 'true', 'false'];
    var key = '';
    var c = curr();

    var regexp = /[a-zA-Z_$\d]/; // letter, number, underscore, dollar character
    while (regexp.test(c)) {
      key += c;
      i++;
      c = curr();
    }

    if (specialValues.indexOf(key) === -1) {
      chars.push('"' + key + '"');
    }
    else {
      chars.push(key);
    }
  }

  while(i < jsString.length) {
    var c = curr();

    if (c === '/' && next() === '*') {
      skipBlockComment();
    }
    else if (c === '/' && next() === '/') {
      skipComment();
    }
    else if (c === '\u00A0' || (c >= '\u2000' && c <= '\u200A') || c === '\u202F' || c === '\u205F' || c === '\u3000') {
      // special white spaces (like non breaking space)
      chars.push(' ');
      i++
    }
    else if (c === quote) {
      parseString(quote);
    }
    else if (c === quoteDbl) {
      parseString(quoteDbl);
    }
    else if (c === graveAccent) {
      parseString(acuteAccent);
    }
    else if (c === quoteLeft) {
      parseString(quoteRight);
    }
    else if (c === quoteDblLeft) {
      parseString(quoteDblRight);
    }
    else if (c === ',' && [']', '}'].indexOf(nextNonWhiteSpace()) !== -1) {
      // skip trailing commas
      i++;
    }
    else if (/[a-zA-Z_$]/.test(c) && ['{', ','].indexOf(lastNonWhitespace()) !== -1) {
      // an unquoted object key (like a in '{a:2}')
      parseKey();
    }
    else {
      chars.push(c);
      i++;
    }
  }

  return chars.join('');
};

/**
 * Escape unicode characters.
 * For example input '\u2661' (length 1) will output '\\u2661' (length 5).
 * @param {string} text
 * @return {string}
 */
exports.escapeUnicodeChars = function (text) {
  // see https://www.wikiwand.com/en/UTF-16
  // note: we leave surrogate pairs as two individual chars,
  // as JSON doesn't interpret them as a single unicode char.
  return text.replace(/[\u007F-\uFFFF]/g, function(c) {
    return '\\u'+('0000' + c.charCodeAt(0).toString(16)).slice(-4);
  })
};

/**
 * Validate a string containing a JSON object
 * This method uses JSONLint to validate the String. If JSONLint is not
 * available, the built-in JSON parser of the browser is used.
 * @param {String} jsonString   String with an (invalid) JSON object
 * @throws Error
 */
exports.validate = function validate(jsonString) {
  if (typeof(jsonlint) != 'undefined') {
    jsonlint.parse(jsonString);
  }
  else {
    JSON.parse(jsonString);
  }
};

/**
 * Extend object a with the properties of object b
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 */
exports.extend = function extend(a, b) {
  for (var prop in b) {
    if (b.hasOwnProperty(prop)) {
      a[prop] = b[prop];
    }
  }
  return a;
};

/**
 * Remove all properties from object a
 * @param {Object} a
 * @return {Object} a
 */
exports.clear = function clear (a) {
  for (var prop in a) {
    if (a.hasOwnProperty(prop)) {
      delete a[prop];
    }
  }
  return a;
};

/**
 * Get the type of an object
 * @param {*} object
 * @return {String} type
 */
exports.type = function type (object) {
  if (object === null) {
    return 'null';
  }
  if (object === undefined) {
    return 'undefined';
  }
  if ((object instanceof Number) || (typeof object === 'number')) {
    return 'number';
  }
  if ((object instanceof String) || (typeof object === 'string')) {
    return 'string';
  }
  if ((object instanceof Boolean) || (typeof object === 'boolean')) {
    return 'boolean';
  }
  if ((object instanceof RegExp) || (typeof object === 'regexp')) {
    return 'regexp';
  }
  if (exports.isArray(object)) {
    return 'array';
  }

  return 'object';
};

/**
 * Test whether a text contains a url (matches when a string starts
 * with 'http://*' or 'https://*' and has no whitespace characters)
 * @param {String} text
 */
var isUrlRegex = /^https?:\/\/\S+$/;
exports.isUrl = function isUrl (text) {
  return (typeof text == 'string' || text instanceof String) &&
      isUrlRegex.test(text);
};

/**
 * Tes whether given object is an Array
 * @param {*} obj
 * @returns {boolean} returns true when obj is an array
 */
exports.isArray = function (obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

/**
 * Retrieve the absolute left value of a DOM element
 * @param {Element} elem    A dom element, for example a div
 * @return {Number} left    The absolute left position of this element
 *                          in the browser page.
 */
exports.getAbsoluteLeft = function getAbsoluteLeft(elem) {
  var rect = elem.getBoundingClientRect();
  return rect.left + window.pageXOffset || document.scrollLeft || 0;
};

/**
 * Retrieve the absolute top value of a DOM element
 * @param {Element} elem    A dom element, for example a div
 * @return {Number} top     The absolute top position of this element
 *                          in the browser page.
 */
exports.getAbsoluteTop = function getAbsoluteTop(elem) {
  var rect = elem.getBoundingClientRect();
  return rect.top + window.pageYOffset || document.scrollTop || 0;
};

/**
 * add a className to the given elements style
 * @param {Element} elem
 * @param {String} className
 */
exports.addClassName = function addClassName(elem, className) {
  var classes = elem.className.split(' ');
  if (classes.indexOf(className) == -1) {
    classes.push(className); // add the class to the array
    elem.className = classes.join(' ');
  }
};

/**
 * remove all classes from the given elements style
 * @param {Element} elem 
 */
exports.removeAllClassNames = function removeAllClassNames(elem) {
    elem.className = "";
};

/**
 * add a className to the given elements style
 * @param {Element} elem
 * @param {String} className
 */
exports.removeClassName = function removeClassName(elem, className) {
  var classes = elem.className.split(' ');
  var index = classes.indexOf(className);
  if (index != -1) {
    classes.splice(index, 1); // remove the class from the array
    elem.className = classes.join(' ');
  }
};

/**
 * Strip the formatting from the contents of a div
 * the formatting from the div itself is not stripped, only from its childs.
 * @param {Element} divElement
 */
exports.stripFormatting = function stripFormatting(divElement) {
  var childs = divElement.childNodes;
  for (var i = 0, iMax = childs.length; i < iMax; i++) {
    var child = childs[i];

    // remove the style
    if (child.style) {
      // TODO: test if child.attributes does contain style
      child.removeAttribute('style');
    }

    // remove all attributes
    var attributes = child.attributes;
    if (attributes) {
      for (var j = attributes.length - 1; j >= 0; j--) {
        var attribute = attributes[j];
        if (attribute.specified === true) {
          child.removeAttribute(attribute.name);
        }
      }
    }

    // recursively strip childs
    exports.stripFormatting(child);
  }
};

/**
 * Set focus to the end of an editable div
 * code from Nico Burns
 * http://stackoverflow.com/users/140293/nico-burns
 * http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
 * @param {Element} contentEditableElement   A content editable div
 */
exports.setEndOfContentEditable = function setEndOfContentEditable(contentEditableElement) {
  var range, selection;
  if(document.createRange) {
    range = document.createRange();//Create a range (a range is a like the selection but invisible)
    range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
    selection = window.getSelection();//get the selection object (allows you to change selection)
    selection.removeAllRanges();//remove any selections already made
    selection.addRange(range);//make the range you have just created the visible selection
  }
};

/**
 * Select all text of a content editable div.
 * http://stackoverflow.com/a/3806004/1262753
 * @param {Element} contentEditableElement   A content editable div
 */
exports.selectContentEditable = function selectContentEditable(contentEditableElement) {
  if (!contentEditableElement || contentEditableElement.nodeName != 'DIV') {
    return;
  }

  var sel, range;
  if (window.getSelection && document.createRange) {
    range = document.createRange();
    range.selectNodeContents(contentEditableElement);
    sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
};

/**
 * Get text selection
 * http://stackoverflow.com/questions/4687808/contenteditable-selected-text-save-and-restore
 * @return {Range | TextRange | null} range
 */
exports.getSelection = function getSelection() {
  if (window.getSelection) {
    var sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      return sel.getRangeAt(0);
    }
  }
  return null;
};

/**
 * Set text selection
 * http://stackoverflow.com/questions/4687808/contenteditable-selected-text-save-and-restore
 * @param {Range | TextRange | null} range
 */
exports.setSelection = function setSelection(range) {
  if (range) {
    if (window.getSelection) {
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
};

/**
 * Get selected text range
 * @return {Object} params  object containing parameters:
 *                              {Number}  startOffset
 *                              {Number}  endOffset
 *                              {Element} container  HTML element holding the
 *                                                   selected text element
 *                          Returns null if no text selection is found
 */
exports.getSelectionOffset = function getSelectionOffset() {
  var range = exports.getSelection();

  if (range && 'startOffset' in range && 'endOffset' in range &&
      range.startContainer && (range.startContainer == range.endContainer)) {
    return {
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      container: range.startContainer.parentNode
    };
  }

  return null;
};

/**
 * Set selected text range in given element
 * @param {Object} params   An object containing:
 *                              {Element} container
 *                              {Number} startOffset
 *                              {Number} endOffset
 */
exports.setSelectionOffset = function setSelectionOffset(params) {
  if (document.createRange && window.getSelection) {
    var selection = window.getSelection();
    if(selection) {
      var range = document.createRange();

      if (!params.container.firstChild) {
        params.container.appendChild(document.createTextNode(''));
      }

      // TODO: do not suppose that the first child of the container is a textnode,
      //       but recursively find the textnodes
      range.setStart(params.container.firstChild, params.startOffset);
      range.setEnd(params.container.firstChild, params.endOffset);

      exports.setSelection(range);
    }
  }
};

/**
 * Get the inner text of an HTML element (for example a div element)
 * @param {Element} element
 * @param {Object} [buffer]
 * @return {String} innerText
 */
exports.getInnerText = function getInnerText(element, buffer) {
  var first = (buffer == undefined);
  if (first) {
    buffer = {
      'text': '',
      'flush': function () {
        var text = this.text;
        this.text = '';
        return text;
      },
      'set': function (text) {
        this.text = text;
      }
    };
  }

  // text node
  if (element.nodeValue) {
    return buffer.flush() + element.nodeValue;
  }

  // divs or other HTML elements
  if (element.hasChildNodes()) {
    var childNodes = element.childNodes;
    var innerText = '';

    for (var i = 0, iMax = childNodes.length; i < iMax; i++) {
      var child = childNodes[i];

      if (child.nodeName == 'DIV' || child.nodeName == 'P') {
        var prevChild = childNodes[i - 1];
        var prevName = prevChild ? prevChild.nodeName : undefined;
        if (prevName && prevName != 'DIV' && prevName != 'P' && prevName != 'BR') {
          innerText += '\n';
          buffer.flush();
        }
        innerText += exports.getInnerText(child, buffer);
        buffer.set('\n');
      }
      else if (child.nodeName == 'BR') {
        innerText += buffer.flush();
        buffer.set('\n');
      }
      else {
        innerText += exports.getInnerText(child, buffer);
      }
    }

    return innerText;
  }
  else {
    if (element.nodeName == 'P' && exports.getInternetExplorerVersion() != -1) {
      // On Internet Explorer, a <p> with hasChildNodes()==false is
      // rendered with a new line. Note that a <p> with
      // hasChildNodes()==true is rendered without a new line
      // Other browsers always ensure there is a <br> inside the <p>,
      // and if not, the <p> does not render a new line
      return buffer.flush();
    }
  }

  // br or unknown
  return '';
};

/**
 * Test whether an element has the provided parent node somewhere up the node tree.
 * @param {Element} elem
 * @param {Element} parent
 * @return {boolean}
 */
exports.hasParentNode = function (elem, parent) {
  var e = elem ? elem.parentNode : undefined;

  while (e) {
    if (e === parent) {
      return true;
    }
    e = e.parentNode;
  }

  return false;
}

/**
 * Returns the version of Internet Explorer or a -1
 * (indicating the use of another browser).
 * Source: http://msdn.microsoft.com/en-us/library/ms537509(v=vs.85).aspx
 * @return {Number} Internet Explorer version, or -1 in case of an other browser
 */
exports.getInternetExplorerVersion = function getInternetExplorerVersion() {
  if (_ieVersion == -1) {
    var rv = -1; // Return value assumes failure.
    if (typeof navigator !== 'undefined' && navigator.appName == 'Microsoft Internet Explorer') {
      var ua = navigator.userAgent;
      var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
      if (re.exec(ua) != null) {
        rv = parseFloat( RegExp.$1 );
      }
    }

    _ieVersion = rv;
  }

  return _ieVersion;
};

/**
 * Test whether the current browser is Firefox
 * @returns {boolean} isFirefox
 */
exports.isFirefox = function isFirefox () {
  return (typeof navigator !== 'undefined' && navigator.userAgent.indexOf("Firefox") !== -1);
};

/**
 * cached internet explorer version
 * @type {Number}
 * @private
 */
var _ieVersion = -1;

/**
 * Add and event listener. Works for all browsers
 * @param {Element}     element    An html element
 * @param {string}      action     The action, for example "click",
 *                                 without the prefix "on"
 * @param {function}    listener   The callback function to be executed
 * @param {boolean}     [useCapture] false by default
 * @return {function}   the created event listener
 */
exports.addEventListener = function addEventListener(element, action, listener, useCapture) {
  if (element.addEventListener) {
    if (useCapture === undefined)
      useCapture = false;

    if (action === "mousewheel" && exports.isFirefox()) {
      action = "DOMMouseScroll";  // For Firefox
    }

    element.addEventListener(action, listener, useCapture);
    return listener;
  } else if (element.attachEvent) {
    // Old IE browsers
    var f = function () {
      return listener.call(element, window.event);
    };
    element.attachEvent("on" + action, f);
    return f;
  }
};

/**
 * Remove an event listener from an element
 * @param {Element}  element   An html dom element
 * @param {string}   action    The name of the event, for example "mousedown"
 * @param {function} listener  The listener function
 * @param {boolean}  [useCapture]   false by default
 */
exports.removeEventListener = function removeEventListener(element, action, listener, useCapture) {
  if (element.removeEventListener) {
    if (useCapture === undefined)
      useCapture = false;

    if (action === "mousewheel" && exports.isFirefox()) {
      action = "DOMMouseScroll";  // For Firefox
    }

    element.removeEventListener(action, listener, useCapture);
  } else if (element.detachEvent) {
    // Old IE browsers
    element.detachEvent("on" + action, listener);
  }
};

/**
 * Test if an element is a child of a parent element.
 * @param {Element} elem
 * @param {Element} parent
 * @return {boolean} returns true if elem is a child of the parent
 */
exports.isChildOf = function (elem, parent) {
  var e = elem.parentNode;
  while (e) {
    if (e === parent) {
      return true;
    }
    e = e.parentNode;
  }

  return false;
};

/**
 * Parse a JSON path like '.items[3].name' into an array
 * @param {string} jsonPath
 * @return {Array}
 */
exports.parsePath = function parsePath(jsonPath) {
  var prop, remainder;

  if (jsonPath.length === 0) {
    return [];
  }

  // find a match like '.prop'
  var match = jsonPath.match(/^\.([\w$]+)/);
  if (match) {
    prop = match[1];
    remainder = jsonPath.substr(prop.length + 1);
  }
  else if (jsonPath[0] === '[') {
    // find a match like
    var end = jsonPath.indexOf(']');
    if (end === -1) {
      throw new SyntaxError('Character ] expected in path');
    }
    if (end === 1) {
      throw new SyntaxError('Index expected after [');
    }

    var value = jsonPath.substring(1, end);
    if (value[0] === '\'') {
      // ajv produces string prop names with single quotes, so we need
      // to reformat them into valid double-quoted JSON strings
      value = '\"' + value.substring(1, value.length - 1) + '\"';
    }

    prop = value === '*' ? value : JSON.parse(value); // parse string and number
    remainder = jsonPath.substr(end + 1);
  }
  else {
    throw new SyntaxError('Failed to parse path');
  }

  return [prop].concat(parsePath(remainder))
};

/**
 * Stringify an array with a path in a JSON path like '.items[3].name'
 * @param {Array.<string | number>} path
 * @returns {string}
 */
exports.stringifyPath = function stringifyPath(path) {
  return path
      .map(function (p) {
        return typeof p === 'number' ? ('[' + p + ']') : ('.' + p);
      })
      .join('');
};

/**
 * Improve the error message of a JSON schema error
 * @param {Object} error
 * @return {Object} The error
 */
exports.improveSchemaError = function (error) {
  if (error.keyword === 'enum' && Array.isArray(error.schema)) {
    var enums = error.schema;
    if (enums) {
      enums = enums.map(function (value) {
        return JSON.stringify(value);
      });

      if (enums.length > 5) {
        var more = ['(' + (enums.length - 5) + ' more...)'];
        enums = enums.slice(0, 5);
        enums.push(more);
      }
      error.message = 'should be equal to one of: ' + enums.join(', ');
    }
  }

  if (error.keyword === 'additionalProperties') {
    error.message = 'should NOT have additional property: ' + error.params.additionalProperty;
  }

  return error;
};

/**
 * Test whether something is a Promise
 * @param {*} object
 * @returns {boolean} Returns true when object is a promise, false otherwise
 */
exports.isPromise = function (object) {
  return object && typeof object.then === 'function' && typeof object.catch === 'function';
};

/**
 * Test whether a custom validation error has the correct structure
 * @param {*} validationError The error to be checked.
 * @returns {boolean} Returns true if the structure is ok, false otherwise
 */
exports.isValidValidationError = function (validationError) {
  return typeof validationError === 'object' &&
      Array.isArray(validationError.path) &&
      typeof validationError.message === 'string';
};

/**
 * Test whether the child rect fits completely inside the parent rect.
 * @param {ClientRect} parent
 * @param {ClientRect} child
 * @param {number} margin
 */
exports.insideRect = function (parent, child, margin) {
  var _margin = margin !== undefined ? margin : 0;
  return child.left   - _margin >= parent.left
      && child.right  + _margin <= parent.right
      && child.top    - _margin >= parent.top
      && child.bottom + _margin <= parent.bottom;
};

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds.
 *
 * Source: https://davidwalsh.name/javascript-debounce-function
 *
 * @param {function} func
 * @param {number} wait                 Number in milliseconds
 * @param {boolean} [immediate=false]   If `immediate` is passed, trigger the
 *                                      function on the leading edge, instead
 *                                      of the trailing.
 * @return {function} Return the debounced function
 */
exports.debounce = function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

/**
 * Determines the difference between two texts.
 * Can only detect one removed or inserted block of characters.
 * @param {string} oldText
 * @param {string} newText
 * @return {{start: number, end: number}} Returns the start and end
 *                                        of the changed part in newText.
 */
exports.textDiff = function textDiff(oldText, newText) {
  var len = newText.length;
  var start = 0;
  var oldEnd = oldText.length;
  var newEnd = newText.length;

  while (newText.charAt(start) === oldText.charAt(start)
  && start < len) {
    start++;
  }

  while (newText.charAt(newEnd - 1) === oldText.charAt(oldEnd - 1)
  && newEnd > start && oldEnd > 0) {
    newEnd--;
    oldEnd--;
  }

  return {start: start, end: newEnd};
};


/**
 * Return an object with the selection range or cursor position (if both have the same value)
 * Support also old browsers (IE8-)
 * Source: http://ourcodeworld.com/articles/read/282/how-to-get-the-current-cursor-position-and-selection-within-a-text-input-or-textarea-in-javascript
 * @param {DOMElement} el A dom element of a textarea or input text.
 * @return {Object} reference Object with 2 properties (start and end) with the identifier of the location of the cursor and selected text.
 **/
exports.getInputSelection = function(el) {
  var startIndex = 0, endIndex = 0, normalizedValue, range, textInputRange, len, endRange;

  if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
      startIndex = el.selectionStart;
      endIndex = el.selectionEnd;
  } else {
      range = document.selection.createRange();

      if (range && range.parentElement() == el) {
          len = el.value.length;
          normalizedValue = el.value.replace(/\r\n/g, "\n");

          // Create a working TextRange that lives only in the input
          textInputRange = el.createTextRange();
          textInputRange.moveToBookmark(range.getBookmark());

          // Check if the startIndex and endIndex of the selection are at the very end
          // of the input, since moveStart/moveEnd doesn't return what we want
          // in those cases
          endRange = el.createTextRange();
          endRange.collapse(false);

          if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
              startIndex = endIndex = len;
          } else {
              startIndex = -textInputRange.moveStart("character", -len);
              startIndex += normalizedValue.slice(0, startIndex).split("\n").length - 1;

              if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                  endIndex = len;
              } else {
                  endIndex = -textInputRange.moveEnd("character", -len);
                  endIndex += normalizedValue.slice(0, endIndex).split("\n").length - 1;
              }
          }
      }
  }

  return {
      startIndex: startIndex,
      endIndex: endIndex,
      start: _positionForIndex(startIndex),
      end: _positionForIndex(endIndex)
  };

  /**
   * Returns textarea row and column position for certain index
   * @param {Number} index text index
   * @returns {{row: Number, col: Number}}
   */
  function _positionForIndex(index) {
    var textTillIndex = el.value.substring(0,index);
    var row = (textTillIndex.match(/\n/g) || []).length + 1;
    var col = textTillIndex.length - textTillIndex.lastIndexOf("\n");

    return {
      row: row,
      column: col
    }
  }
}

/**
 * Returns the index for certaion position in text element
 * @param {DOMElement} el A dom element of a textarea or input text.
 * @param {Number} row row value, > 0, if exceeds rows number - last row will be returned
 * @param {Number} column column value, > 0, if exceeds column length - end of column will be returned
 * @returns {Number} index of position in text, -1 if not found
 */
exports.getIndexForPosition = function(el, row, column) {
  var text = el.value || '';
  if (row > 0 && column > 0) {
    var rows = text.split('\n', row);
    row = Math.min(rows.length, row);
    column = Math.min(rows[row - 1].length, column - 1);
    var columnCount = (row == 1 ? column : column + 1); // count new line on multiple rows
    return rows.slice(0, row - 1).join('\n').length + columnCount;
  }
  return -1;
}

/**
 * Returns location of json paths in certain json string
 * @param {String} text json string
 * @param {Array<String>} paths array of json paths
 * @returns {Array<{path: String, line: Number, row: Number}>}
 */
exports.getPositionForPath = function(text, paths) {
  var me = this;
  var result = [];
  var jsmap;
  if (!paths || !paths.length) {
    return result;
  }
  
  try {
    jsmap = jsonMap.parse(text);    
  } catch (err) {
    return result;
  }

  paths.forEach(function (path) {
    var pathArr = me.parsePath(path);
    var pointerName = pathArr.length ? "/" + pathArr.join("/") : "";
    var pointer = jsmap.pointers[pointerName];
    if (pointer) {
      result.push({
        path: path,
        line: pointer.key ? pointer.key.line : (pointer.value ? pointer.value.line : 0),
        column: pointer.key ? pointer.key.column : (pointer.value ? pointer.value.column : 0)
      });
    }
  });

  return result;
  
}

/**
 * Get the applied color given a color name or code
 * Source: https://stackoverflow.com/questions/6386090/validating-css-color-names/33184805
 * @param {string} color
 * @returns {string | null} returns the color if the input is a valid
 *                   color, and returns null otherwise. Example output:
 *                   'rgba(255,0,0,0.7)' or 'rgb(255,0,0)'
 */
exports.getColorCSS = function (color) {
  var ele = document.createElement('div');
  ele.style.color = color;
  return ele.style.color.split(/\s+/).join('').toLowerCase() || null;
}

/**
 * Test if a string contains a valid color name or code.
 * @param {string} color
 * @returns {boolean} returns true if a valid color, false otherwise
 */
exports.isValidColor = function (color) {
  return !!exports.getColorCSS(color);
}

if (typeof Element !== 'undefined') {
  // Polyfill for array remove
  (function () {
    function polyfill (item) {
      if (item.hasOwnProperty('remove')) {
        return;
      }
      Object.defineProperty(item, 'remove', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function remove() {
          if (this.parentNode != null)
            this.parentNode.removeChild(this);
        }
      });
    }

    if (typeof Element !== 'undefined')       { polyfill(Element.prototype); }
    if (typeof CharacterData !== 'undefined') { polyfill(CharacterData.prototype); }
    if (typeof DocumentType !== 'undefined')  { polyfill(DocumentType.prototype); }
  })();
}


// Polyfill for startsWith
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

// Polyfill for Array.find
if (!Array.prototype.find) {
  Array.prototype.find = function(callback) {    
    for (var i = 0; i < this.length; i++) {
      var element = this[i];
      if ( callback.call(this, element, i, this) ) {
        return element;
      }
    }
  }
}