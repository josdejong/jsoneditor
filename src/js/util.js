define(function () {

  // create namespace
  var util = {};

  /**
   * Parse JSON using the parser built-in in the browser.
   * On exception, the jsonString is validated and a detailed error is thrown.
   * @param {String} jsonString
   * @return {JSON} json
   */
  util.parse = function parse(jsonString) {
    try {
      return JSON.parse(jsonString);
    }
    catch (err) {
      // try to throw a more detailed error message using validate
      util.validate(jsonString);

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
  util.sanitize = function (jsString) {
    // escape all single and double quotes inside strings
    var chars = [];
    var inString = false;
    var i = 0;
    while(i < jsString.length) {
      var c = jsString.charAt(i);
      var isEscaped = jsString.charAt(i - 1) === '\\';

      if ((c === '"' || c === '\'') && !isEscaped) {
        if (c === inString) {
          // end of string
          inString = false;
        }
        else if (!inString) {
          // start of string
          inString = c;
        }
        else {
          // add escape character
          chars.push('\\');
        }
      }

      chars.push(c);
      i++;
    }
    var jsonString = chars.join('');

    // replace unescaped single quotes with double quotes,
    // and replace escaped single quotes with unescaped single quotes
    // TODO: we could do this step immediately in the previous step
    jsonString = jsonString.replace(/(.?)'/g, function ($0, $1) {
      return ($1 == '\\') ? '\'' : $1 + '"';
    });

    // enclose unquoted object keys with double quotes
    jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, function ($0, $1, $2, $3) {
      return $1 + '"' + $2 + '"' + $3;
    });

    return jsonString;
  };

  /**
   * Validate a string containing a JSON object
   * This method uses JSONLint to validate the String. If JSONLint is not
   * available, the built-in JSON parser of the browser is used.
   * @param {String} jsonString   String with an (invalid) JSON object
   * @throws Error
   */
  util.validate = function validate(jsonString) {
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
  util.extend = function extend(a, b) {
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
  util.clear = function clear (a) {
    for (var prop in a) {
      if (a.hasOwnProperty(prop)) {
        delete a[prop];
      }
    }
    return a;
  };

  /**
   * Output text to the console, if console is available
   * @param {...*} args
   */
  util.log = function log (args) {
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log.apply(console, arguments);
    }
  };

  /**
   * Get the type of an object
   * @param {*} object
   * @return {String} type
   */
  util.type = function type (object) {
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
    if (util.isArray(object)) {
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
  util.isUrl = function isUrl (text) {
    return (typeof text == 'string' || text instanceof String) &&
        isUrlRegex.test(text);
  };

  /**
   * Tes whether given object is an Array
   * @param {*} obj
   * @returns {boolean} returns true when obj is an array
   */
  util.isArray = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  /**
   * Retrieve the absolute left value of a DOM element
   * @param {Element} elem    A dom element, for example a div
   * @return {Number} left    The absolute left position of this element
   *                          in the browser page.
   */
  util.getAbsoluteLeft = function getAbsoluteLeft(elem) {
    var rect = elem.getBoundingClientRect();
    return rect.left + window.pageXOffset || document.scrollLeft || 0;
  };

  /**
   * Retrieve the absolute top value of a DOM element
   * @param {Element} elem    A dom element, for example a div
   * @return {Number} top     The absolute top position of this element
   *                          in the browser page.
   */
  util.getAbsoluteTop = function getAbsoluteTop(elem) {
    var rect = elem.getBoundingClientRect();
    return rect.top + window.pageYOffset || document.scrollTop || 0;
  };

  /**
   * add a className to the given elements style
   * @param {Element} elem
   * @param {String} className
   */
  util.addClassName = function addClassName(elem, className) {
    var classes = elem.className.split(' ');
    if (classes.indexOf(className) == -1) {
      classes.push(className); // add the class to the array
      elem.className = classes.join(' ');
    }
  };

  /**
   * add a className to the given elements style
   * @param {Element} elem
   * @param {String} className
   */
  util.removeClassName = function removeClassName(elem, className) {
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
  util.stripFormatting = function stripFormatting(divElement) {
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
          if (attribute.specified == true) {
            child.removeAttribute(attribute.name);
          }
        }
      }

      // recursively strip childs
      util.stripFormatting(child);
    }
  };

  /**
   * Set focus to the end of an editable div
   * code from Nico Burns
   * http://stackoverflow.com/users/140293/nico-burns
   * http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
   * @param {Element} contentEditableElement   A content editable div
   */
  util.setEndOfContentEditable = function setEndOfContentEditable(contentEditableElement) {
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
  util.selectContentEditable = function selectContentEditable(contentEditableElement) {
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
  util.getSelection = function getSelection() {
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
  util.setSelection = function setSelection(range) {
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
  util.getSelectionOffset = function getSelectionOffset() {
    var range = util.getSelection();

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
  util.setSelectionOffset = function setSelectionOffset(params) {
    if (document.createRange && window.getSelection) {
      var selection = window.getSelection();
      if(selection) {
        var range = document.createRange();
        // TODO: do not suppose that the first child of the container is a textnode,
        //       but recursively find the textnodes
        range.setStart(params.container.firstChild, params.startOffset);
        range.setEnd(params.container.firstChild, params.endOffset);

        util.setSelection(range);
      }
    }
  };

  /**
   * Get the inner text of an HTML element (for example a div element)
   * @param {Element} element
   * @param {Object} [buffer]
   * @return {String} innerText
   */
  util.getInnerText = function getInnerText(element, buffer) {
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
          innerText += util.getInnerText(child, buffer);
          buffer.set('\n');
        }
        else if (child.nodeName == 'BR') {
          innerText += buffer.flush();
          buffer.set('\n');
        }
        else {
          innerText += util.getInnerText(child, buffer);
        }
      }

      return innerText;
    }
    else {
      if (element.nodeName == 'P' && util.getInternetExplorerVersion() != -1) {
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
   * Returns the version of Internet Explorer or a -1
   * (indicating the use of another browser).
   * Source: http://msdn.microsoft.com/en-us/library/ms537509(v=vs.85).aspx
   * @return {Number} Internet Explorer version, or -1 in case of an other browser
   */
  util.getInternetExplorerVersion = function getInternetExplorerVersion() {
    if (_ieVersion == -1) {
      var rv = -1; // Return value assumes failure.
      if (navigator.appName == 'Microsoft Internet Explorer')
      {
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
  util.isFirefox = function isFirefox () {
    return (navigator.userAgent.indexOf("Firefox") != -1);
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
  util.addEventListener = function addEventListener(element, action, listener, useCapture) {
    if (element.addEventListener) {
      if (useCapture === undefined)
        useCapture = false;

      if (action === "mousewheel" && util.isFirefox()) {
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
  util.removeEventListener = function removeEventListener(element, action, listener, useCapture) {
    if (element.removeEventListener) {
      if (useCapture === undefined)
        useCapture = false;

      if (action === "mousewheel" && util.isFirefox()) {
        action = "DOMMouseScroll";  // For Firefox
      }

      element.removeEventListener(action, listener, useCapture);
    } else if (element.detachEvent) {
      // Old IE browsers
      element.detachEvent("on" + action, listener);
    }
  };

  return util;
});