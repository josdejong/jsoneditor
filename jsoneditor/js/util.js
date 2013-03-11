/**
 * @license
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy
 * of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Copyright (c) 2011-2013 Jos de Jong, http://jsoneditoronline.org
 *
 * @author  Jos de Jong, <wjosdejong@gmail.com>
 */

// create namespace
var jsoneditor = jsoneditor || {};
jsoneditor.util = {};

// Internet Explorer 8 and older does not support Array.indexOf,
// so we define it here in that case
// http://soledadpenades.com/2007/05/17/arrayindexof-in-internet-explorer/
if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj){
        for(var i = 0; i < this.length; i++){
            if(this[i] == obj){
                return i;
            }
        }
        return -1;
    }
}

// Internet Explorer 8 and older does not support Array.forEach,
// so we define it here in that case
// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/forEach
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fn, scope) {
        for(var i = 0, len = this.length; i < len; ++i) {
            fn.call(scope || this, this[i], i, this);
        }
    }
}

// Old browsers do not have a console, so create a fake one in that case.
if (typeof console === 'undefined') {
    console = {
        log: function () {}
    };
}

/**
 * Parse JSON using the parser built-in in the browser.
 * On exception, the jsonString is validated and a detailed error is thrown.
 * @param {String} jsonString
 */
jsoneditor.util.parse = function (jsonString) {
    try {
        return JSON.parse(jsonString);
    }
    catch (err) {
        // get a detailed error message using validate
        var message = jsoneditor.util.validate(jsonString) || err;
        throw new Error(message);
    }
};

/**
 * Validate a string containing a JSON object
 * This method uses JSONLint to validate the String. If JSONLint is not
 * available, the built-in JSON parser of the browser is used.
 * @param {String} jsonString   String with an (invalid) JSON object
 * @return {String | undefined} Returns undefined when the string is valid JSON,
 *                              returns a string with an error message when
 *                              the data is invalid. This message is HTML
 *                              formatted.
 */
jsoneditor.util.validate = function (jsonString) {
    var message = undefined;

    try {
        if (typeof(jsonlint) != 'undefined') {
            jsonlint.parse(jsonString);
        }
        else {
            JSON.parse(jsonString);
        }
    }
    catch (err) {
        message = '<pre class="error">' + err.toString() + '</pre>';
        if (typeof(jsonlint) != 'undefined') {
            message +=
                '<a class="error" href="http://zaach.github.com/jsonlint/" target="_blank">' +
                    'validated by jsonlint' +
                    '</a>';
        }
    }

    return message;
};

/**
 * Retrieve the absolute left value of a DOM element
 * @param {Element} elem    A dom element, for example a div
 * @return {Number} left    The absolute left position of this element
 *                          in the browser page.
 */
jsoneditor.util.getAbsoluteLeft = function (elem) {
    var left = elem.offsetLeft;
    var body = document.body;
    var e = elem.offsetParent;
    while (e != null && elem != body) {
        left += e.offsetLeft;
        left -= e.scrollLeft;
        e = e.offsetParent;
    }
    return left;
};

/**
 * Retrieve the absolute top value of a DOM element
 * @param {Element} elem    A dom element, for example a div
 * @return {Number} top    The absolute top position of this element
 *                          in the browser page.
 */
jsoneditor.util.getAbsoluteTop = function (elem) {
    var top = elem.offsetTop;
    var body = document.body;
    var e = elem.offsetParent;
    while (e != null && e != body) {
        top += e.offsetTop;
        top -= e.scrollTop;
        e = e.offsetParent;
    }
    return top;
};

/**
 * Get the absolute, vertical mouse position from an event.
 * @param {Event} event
 * @return {Number} mouseY
 */
jsoneditor.util.getMouseY = function (event) {
    var mouseY;
    if ('pageY' in event) {
        mouseY = event.pageY;
    }
    else {
        // for IE8 and older
        mouseY = (event.clientY + document.documentElement.scrollTop);
    }

    return mouseY;
};

/**
 * Get the absolute, horizontal mouse position from an event.
 * @param {Event} event
 * @return {Number} mouseX
 */
jsoneditor.util.getMouseX = function (event) {
    var mouseX;
    if ('pageX' in event) {
        mouseX = event.pageX;
    }
    else {
        // for IE8 and older
        mouseX = (event.clientX + document.documentElement.scrollLeft);
    }

    return mouseX;
};

/**
 * Get the window height
 * @return {Number} windowHeight
 */
jsoneditor.util.getWindowHeight = function () {
    if ('innerHeight' in window) {
        return window.innerHeight;
    }
    else {
        // for IE8 and older
        return Math.max(document.body.clientHeight,
            document.documentElement.clientHeight);
    }
};

/**
 * add a className to the given elements style
 * @param {Element} elem
 * @param {String} className
 */
jsoneditor.util.addClassName = function(elem, className) {
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
jsoneditor.util.removeClassName = function(elem, className) {
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
jsoneditor.util.stripFormatting = function (divElement) {
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
        jsoneditor.util.stripFormatting(child);
    }
};

/**
 * Set focus to the end of an editable div
 * code from Nico Burns
 * http://stackoverflow.com/users/140293/nico-burns
 * http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
 * @param {Element} contentEditableElement   A content editable div
 */
jsoneditor.util.setEndOfContentEditable = function (contentEditableElement) {
    var range, selection;
    if(document.createRange) {//Firefox, Chrome, Opera, Safari, IE 9+
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
    else if(document.selection) {//IE 8 and lower
        range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        range.select();//Select the range (make it the visible selection
    }
};

/**
 * Select all text of a content editable div.
 * http://stackoverflow.com/a/3806004/1262753
 * @param {Element} contentEditableElement   A content editable div
 */
jsoneditor.util.selectContentEditable = function (contentEditableElement) {
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
    } else if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(contentEditableElement);
        range.select();
    }
};

/**
 * Get text selection
 * http://stackoverflow.com/questions/4687808/contenteditable-selected-text-save-and-restore
 * @return {Range | TextRange | null} range
 */
jsoneditor.util.getSelection = function () {
    if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            return sel.getRangeAt(0);
        }
    } else if (document.selection && document.selection.createRange) {
        return document.selection.createRange();
    }
    return null;
};

/**
 * Set text selection
 * http://stackoverflow.com/questions/4687808/contenteditable-selected-text-save-and-restore
 * @param {Range | TextRange | null} range
 */
jsoneditor.util.setSelection = function (range) {
    if (range) {
        if (window.getSelection) {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (document.selection && range.select) {
            range.select();
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
jsoneditor.util.getSelectionOffset = function () {
    var range = jsoneditor.util.getSelection();

    if (range && 'startOffset' in range && 'endOffset' in range &&
            range.startContainer && (range.startContainer == range.endContainer)) {
        return {
            startOffset: range.startOffset,
            endOffset: range.endOffset,
            container: range.startContainer.parentNode
        };
    }
    else {
        // TODO: implement getSelectionOffset for IE8
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
jsoneditor.util.setSelectionOffset = function (params) {
    if (document.createRange && window.getSelection) {
        var selection = window.getSelection();
        if(selection) {
            var range = document.createRange();
            // TODO: do not suppose that the first child of the container is a textnode,
            //       but recursively find the textnodes
            range.setStart(params.container.firstChild, params.startOffset);
            range.setEnd(params.container.firstChild, params.endOffset);

            jsoneditor.util.setSelection(range);
        }
    }
    else {
        // TODO: implement setSelectionOffset for IE8
    }
};

/**
 * Get the inner text of an HTML element (for example a div element)
 * @param {Element} element
 * @param {Object} [buffer]
 * @return {String} innerText
 */
jsoneditor.util.getInnerText = function (element, buffer) {
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
                innerText += jsoneditor.util.getInnerText(child, buffer);
                buffer.set('\n');
            }
            else if (child.nodeName == 'BR') {
                innerText += buffer.flush();
                buffer.set('\n');
            }
            else {
                innerText += jsoneditor.util.getInnerText(child, buffer);
            }
        }

        return innerText;
    }
    else {
        if (element.nodeName == 'P' && jsoneditor.util.getInternetExplorerVersion() != -1) {
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
jsoneditor.util.getInternetExplorerVersion = function() {
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
jsoneditor.util.addEventListener = function (element, action, listener, useCapture) {
    if (element.addEventListener) {
        if (useCapture === undefined)
            useCapture = false;

        if (action === "mousewheel" && navigator.userAgent.indexOf("Firefox") >= 0) {
            action = "DOMMouseScroll";  // For Firefox
        }

        element.addEventListener(action, listener, useCapture);
        return listener;
    } else {
        // IE browsers
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
jsoneditor.util.removeEventListener = function(element, action, listener, useCapture) {
    if (element.removeEventListener) {
        // non-IE browsers
        if (useCapture === undefined)
            useCapture = false;

        if (action === "mousewheel" && navigator.userAgent.indexOf("Firefox") >= 0) {
            action = "DOMMouseScroll";  // For Firefox
        }

        element.removeEventListener(action, listener, useCapture);
    } else {
        // IE browsers
        element.detachEvent("on" + action, listener);
    }
};


/**
 * Stop event propagation
 * @param {Event} event
 */
jsoneditor.util.stopPropagation = function (event) {
    if (!event) {
        event = window.event;
    }

    if (event.stopPropagation) {
        event.stopPropagation();  // non-IE browsers
    }
    else {
        event.cancelBubble = true;  // IE browsers
    }
};


/**
 * Cancels the event if it is cancelable, without stopping further propagation of the event.
 * @param {Event} event
 */
jsoneditor.util.preventDefault = function (event) {
    if (!event) {
        event = window.event;
    }

    if (event.preventDefault) {
        event.preventDefault();  // non-IE browsers
    }
    else {
        event.returnValue = false;  // IE browsers
    }
};
