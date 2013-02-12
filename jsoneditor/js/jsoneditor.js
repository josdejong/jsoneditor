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

/**
 * jsoneditor.JSONEditor
 * @param {Element} container    Container element
 * @param {Object}  [options]    Object with options. available options:
 *                               {String} mode      Editor mode. Available values:
 *                                                  'editor' (default), 'viewer',
 *                                                  and 'form'.
 *                               {Boolean} search   Enable search box.
 *                                                  True by default
 *                               {Boolean} history  Enable history (undo/redo).
 *                                                  True by default
 *                               {function} change  Callback method, triggered
 *                                                  on change of contents
 *                               {String} name      Field name for the root node.
 * @param {Object | undefined} json JSON object
 */
jsoneditor.JSONEditor = function (container, options, json) {
    if (!(this instanceof jsoneditor.JSONEditor)) {
        throw new Error('JSONEditor constructor called without "new".');
    }

    // check availability of JSON parser (not available in IE7 and older)
    if (typeof(JSON) == 'undefined') {
        throw new Error ('Your browser does not support JSON. \n\n' +
            'Please install the newest version of your browser.\n' +
            '(all modern browsers support JSON).');
    }

    if (!container) {
        throw new Error('No container element provided.');
    }
    this.container = container;
    this.dom = {};
    this.highlighter = new jsoneditor.Highlighter();
    this.selection = undefined; // will hold the last input selection

    this._setOptions(options);

    if (this.options.history && !this.mode.viewer) {
        this.history = new jsoneditor.History(this);
    }

    this._createFrame();
    this._createTable();

    this.set(json || {});
};

/**
 * Initialize and set default options
 * @param {Object}  [options]    Object with options. available options:
 *                               {String} mode      Editor mode. Available values:
 *                                                  'editor' (default), 'viewer',
 *                                                  and 'form'.
 *                               {Boolean} search   Enable search box.
 *                                                  True by default.
 *                               {Boolean} history  Enable history (undo/redo).
 *                                                  True by default.
 *                               {function} change  Callback method, triggered
 *                                                  on change of contents.
 *                               {String} name      Field name for the root node.
 * @private
 */
jsoneditor.JSONEditor.prototype._setOptions = function (options) {
    this.options = {
        search: true,
        history: true,
        mode: 'editor',
        name: undefined   // field name of root node
    };

    // copy all options
    if (options) {
        for (var prop in options) {
            if (options.hasOwnProperty(prop)) {
                this.options[prop] = options[prop];
            }
        }

        // check for deprecated options
        if (options['enableSearch']) {
            // deprecated since version 1.6.0, 2012-11-03
            this.options.search = options['enableSearch'];
            console.log('WARNING: Option "enableSearch" is deprecated. Use "search" instead.');
        }
        if (options['enableHistory']) {
            // deprecated since version 1.6.0, 2012-11-03
            this.options.history = options['enableHistory'];
            console.log('WARNING: Option "enableHistory" is deprecated. Use "history" instead.');
        }
    }

    // interpret the mode options
    this.mode = {
        editor: (this.options.mode != 'viewer' && this.options.mode != 'form'),
        viewer: (this.options.mode == 'viewer'),
        form: (this.options.mode == 'form')
    };
};

// node currently being edited
jsoneditor.JSONEditor.focusNode = undefined;

/**
 * Set JSON object in editor
 * @param {Object | undefined} json      JSON data
 * @param {String}             [name]    Optional field name for the root node.
 *                                       Can also be set using setName(name).
 */
jsoneditor.JSONEditor.prototype.set = function (json, name) {
    // adjust field name for root node
    if (name) {
        this.options.name = name;
    }

    // verify if json is valid JSON, ignore when a function
    if (json instanceof Function || (json === undefined)) {
        this.clear();
    }
    else {
        this.content.removeChild(this.table);  // Take the table offline

        // replace the root node
        var params = {
            'field': this.options.name,
            'value': json
        };
        var node = new jsoneditor.Node(this, params);
        this._setRoot(node);

        // expand
        var recurse = false;
        this.node.expand(recurse);

        this.content.appendChild(this.table);  // Put the table online again
    }

    // TODO: maintain history, store last state and previous document
    if (this.history) {
        this.history.clear();
    }
};

/**
 * Get JSON object from editor
 * @return {Object | undefined} json
 */
jsoneditor.JSONEditor.prototype.get = function () {
    // remove focus from currently edited node
    if (jsoneditor.JSONEditor.focusNode) {
        jsoneditor.JSONEditor.focusNode.blur();
    }

    if (this.node) {
        return this.node.getValue();
    }
    else {
        return undefined;
    }
};

/**
 * Set a field name for the root node.
 * @param {String | undefined} name
 */
jsoneditor.JSONEditor.prototype.setName = function (name) {
    this.options.name = name;
    if (this.node) {
        this.node.updateField(this.options.name);
    }
};

/**
 * Get the field name for the root node.
 * @return {String | undefined} name
 */
jsoneditor.JSONEditor.prototype.getName = function () {
    return this.options.name;
};

/**
 * Remove the root node from the editor
 */
jsoneditor.JSONEditor.prototype.clear = function () {
    if (this.node) {
        this.node.collapse();
        this.tbody.removeChild(this.node.getDom());
        delete this.node;
    }
};

/**
 * Set the root node for the json editor
 * @param {jsoneditor.Node} node
 * @private
 */
jsoneditor.JSONEditor.prototype._setRoot = function (node) {
    this.clear();

    this.node = node;

    // append to the dom
    this.tbody.appendChild(node.getDom());
};

/**
 * Search text in all nodes
 * The nodes will be expanded when the text is found one of its childs,
 * else it will be collapsed. Searches are case insensitive.
 * @param {String} text
 * @return {Object[]} results  Array with nodes containing the search results
 *                             The result objects contains fields:
 *                             - {jsoneditor.Node} node,
 *                             - {String} elem  the dom element name where
 *                                              the result is found ('field' or
 *                                              'value')
 */
jsoneditor.JSONEditor.prototype.search = function (text) {
    var results;
    if (this.node) {
        this.content.removeChild(this.table);  // Take the table offline
        results = this.node.search(text);
        this.content.appendChild(this.table);  // Put the table online again
    }
    else {
        results = [];
    }

    return results;
};

/**
 * Expand all nodes
 */
jsoneditor.JSONEditor.prototype.expandAll = function () {
    if (this.node) {
        this.content.removeChild(this.table);  // Take the table offline
        this.node.expand();
        this.content.appendChild(this.table);  // Put the table online again
    }
};

/**
 * Collapse all nodes
 */
jsoneditor.JSONEditor.prototype.collapseAll = function () {
    if (this.node) {
        this.content.removeChild(this.table);  // Take the table offline
        this.node.collapse();
        this.content.appendChild(this.table);  // Put the table online again
    }
};

/**
 * The method onChange is called whenever a field or value is changed, created,
 * deleted, duplicated, etc.
 * @param {String} action  Change action. Available values: "editField",
 *                         "editValue", "changeType", "appendNode",
 *                         "removeNode", "duplicateNode", "moveNode", "expand",
 *                         "collapse".
 * @param {Object} params  Object containing parameters describing the change.
 *                         The parameters in params depend on the action (for
 *                         example for "editValue" the Node, old value, and new
 *                         value are provided). params contains all information
 *                         needed to undo or redo the action.
 * @private
 */
jsoneditor.JSONEditor.prototype._onAction = function (action, params) {
    // add an action to the history
    if (this.history) {
        this.history.add(action, params);
    }

    // trigger the onChange callback
    if (this.options.change) {
        try {
            this.options.change();
        }
        catch (err) {
            console.log('Error in change callback: ', err);
        }
    }
};

/**
 * Start autoscrolling when given mouse position is above the top of the
 * editor contents, or below the bottom.
 * @param {Number} mouseY  Absolute mouse position in pixels
 */
jsoneditor.JSONEditor.prototype.startAutoScroll = function (mouseY) {
    var me = this;
    var content = this.content;
    var top = jsoneditor.util.getAbsoluteTop(content);
    var height = content.clientHeight;
    var bottom = top + height;
    var margin = 24;
    var interval = 50; // ms

    if ((mouseY < top + margin) && content.scrollTop > 0) {
        this.autoScrollStep = ((top + margin) - mouseY) / 3;
    }
    else if (mouseY > bottom - margin &&
            height + content.scrollTop < content.scrollHeight) {
        this.autoScrollStep = ((bottom - margin) - mouseY) / 3;
    }
    else {
        this.autoScrollStep = undefined;
    }

    if (this.autoScrollStep) {
        if (!this.autoScrollTimer) {
            this.autoScrollTimer = setInterval(function () {
                if (me.autoScrollStep) {
                    content.scrollTop -= me.autoScrollStep;
                }
                else {
                    me.stopAutoScroll();
                }
            }, interval);
        }
    }
    else {
        this.stopAutoScroll();
    }
};

/**
 * Stop auto scrolling. Only applicable when scrolling
 */
jsoneditor.JSONEditor.prototype.stopAutoScroll = function () {
    if (this.autoScrollTimer) {
        clearTimeout(this.autoScrollTimer);
        delete this.autoScrollTimer;
    }
    if (this.autoScrollStep) {
        delete this.autoScrollStep;
    }
};


/**
 * Set the focus to an element in the JSONEditor, set text selection, and
 * set scroll position.
 * @param {Object} selection  An object containing fields:
 *                            {Element | undefined} dom     The dom element
 *                                                          which has focus
 *                            {Range | TextRange} range     A text selection
 *                            {Number} scrollTop            Scroll position
 */
jsoneditor.JSONEditor.prototype.setSelection = function (selection) {
    if (!selection) {
        return;
    }

    if ('scrollTop' in selection && this.content) {
        // TODO: animated scroll
        this.content.scrollTop = selection.scrollTop;
    }
    if (selection.range) {
        jsoneditor.util.setSelectionOffset(selection.range);
    }
    if (selection.dom) {
        selection.dom.focus();
    }
};

/**
 * Get the current focus
 * @return {Object} selection An object containing fields:
 *                            {Element | undefined} dom     The dom element
 *                                                          which has focus
 *                            {Range | TextRange} range     A text selection
 *                            {Number} scrollTop            Scroll position
 */
jsoneditor.JSONEditor.prototype.getSelection = function () {
    return {
        dom: jsoneditor.JSONEditor.domFocus,
        scrollTop: this.content ? this.content.scrollTop : 0,
        range: jsoneditor.util.getSelectionOffset()
    };
};

/**
 * Adjust the scroll position such that given top position is shown at 1/4
 * of the window height.
 * @param {Number} top
 * @param {function(boolean)} [callback]   Callback, executed when animation is
 *                                         finished. The callback returns true
 *                                         when animation is finished, or false
 *                                         when not.
 */
jsoneditor.JSONEditor.prototype.scrollTo = function (top, callback) {
    var content = this.content;
    if (content) {
        var editor = this;
        // cancel any running animation
        if (editor.animateTimeout) {
            clearTimeout(editor.animateTimeout);
            delete editor.animateTimeout;
        }
        if (editor.animateCallback) {
            editor.animateCallback(false);
            delete editor.animateCallback;
        }

        // calculate final scroll position
        var height = content.clientHeight;
        var bottom = content.scrollHeight - height;
        var finalScrollTop = Math.min(Math.max(top - height / 4, 0), bottom);

        // animate towards the new scroll position
        var animate = function () {
            var scrollTop = content.scrollTop;
            var diff = (finalScrollTop - scrollTop);
            if (Math.abs(diff) > 3) {
                content.scrollTop += diff / 3;
                editor.animateCallback = callback;
                editor.animateTimeout = setTimeout(animate, 50);
            }
            else {
                // finished
                if (callback) {
                    callback(true);
                }
                content.scrollTop = finalScrollTop;
                delete editor.animateTimeout;
                delete editor.animateCallback;
            }
        };
        animate();
    }
    else {
        if (callback) {
            callback(false);
        }
    }
};

/**
 * Create main frame
 * @private
 */
jsoneditor.JSONEditor.prototype._createFrame = function () {
    // create the frame
    this.container.innerHTML = '';
    this.frame = document.createElement('div');
    this.frame.className = 'jsoneditor';
    this.container.appendChild(this.frame);

    // create one global event listener to handle all events from all nodes
    var editor = this;
    var onEvent = function (event) {
        editor._onEvent(event);
    };
    this.frame.onclick = function (event) {
        onEvent(event);

        // prevent default submit action when JSONEditor is located inside a form
        jsoneditor.util.preventDefault(event);
    };
    this.frame.oninput = onEvent;
    this.frame.onchange = onEvent;
    this.frame.onkeydown = onEvent;
    this.frame.onkeyup = onEvent;
    this.frame.oncut = onEvent;
    this.frame.onpaste = onEvent;
    this.frame.onmousedown = onEvent;
    this.frame.onmouseup = onEvent;
    this.frame.onmouseover = onEvent;
    this.frame.onmouseout = onEvent;
    // Note: focus and blur events do not propagate, therefore they defined
    // using an eventListener with useCapture=true
    // see http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
    jsoneditor.util.addEventListener(this.frame, 'focus', onEvent, true);
    jsoneditor.util.addEventListener(this.frame, 'blur', onEvent, true);
    this.frame.onfocusin = onEvent;  // for IE
    this.frame.onfocusout = onEvent; // for IE

    // create menu
    this.menu = document.createElement('div');
    this.menu.className = 'menu';
    this.frame.appendChild(this.menu);

    // create expand all button
    var expandAll = document.createElement('button');
    expandAll.className = 'expand-all';
    expandAll.title = 'Expand all fields';
    expandAll.onclick = function () {
        editor.expandAll();
    };
    this.menu.appendChild(expandAll);

    // create expand all button
    var collapseAll = document.createElement('button');
    collapseAll.title = 'Collapse all fields';
    collapseAll.className = 'collapse-all';
    collapseAll.onclick = function () {
        editor.collapseAll();
    };
    this.menu.appendChild(collapseAll);

    // create undo/redo buttons
    if (this.history) {
        // create separator
        var separator = document.createElement('span');
        separator.innerHTML = '&nbsp;';
        this.menu.appendChild(separator);

        // create undo button
        var undo = document.createElement('button');
        undo.className = 'undo';
        undo.title = 'Undo last action (Ctrl+Z)';
        undo.onclick = function () {
            editor._onUndo();
        };
        this.menu.appendChild(undo);
        this.dom.undo = undo;

        // create redo button
        var redo = document.createElement('button');
        redo.className = 'redo';
        redo.title = 'Redo (Ctrl+Shift+Z)';
        redo.onclick = function () {
            editor._onRedo();
        };
        this.menu.appendChild(redo);
        this.dom.redo = redo;

        // register handler for onchange of history
        this.history.onChange = function () {
            undo.disabled = !editor.history.canUndo();
            redo.disabled = !editor.history.canRedo();
        };
        this.history.onChange();
    }

    // create search box
    if (this.options.search) {
        this.searchBox = new jsoneditor.SearchBox(this, this.menu);
    }
};

/**
 * Perform an undo action
 * @private
 */
jsoneditor.JSONEditor.prototype._onUndo = function () {
    if (this.history) {
        // undo last action
        this.history.undo();

        // trigger change callback
        if (this.options.change) {
            this.options.change();
        }
    }
};

/**
 * Perform a redo action
 * @private
 */
jsoneditor.JSONEditor.prototype._onRedo = function () {
    if (this.history) {
        // redo last action
        this.history.redo();

        // trigger change callback
        if (this.options.change) {
            this.options.change();
        }
    }
};

/**
 * Event handler
 * @param event
 * @private
 */
jsoneditor.JSONEditor.prototype._onEvent = function (event) {
    event = event || window.event;
    var target = event.target || event.srcElement;

    if (event.type == 'keydown') {
        this._onKeyDown(event);
    }

    if (event.type == 'focus') {
        jsoneditor.JSONEditor.domFocus = target;
    }

    var node = jsoneditor.Node.getNodeFromTarget(target);
    if (node) {
        node.onEvent(event);
    }
};

/**
 * Event handler for keydown. Handles shortcut keys
 * @param {Event} event
 * @private
 */
jsoneditor.JSONEditor.prototype._onKeyDown = function (event) {
    var keynum = event.which || event.keyCode;
    var ctrlKey = event.ctrlKey;
    var shiftKey = event.shiftKey;
    var handled = false;

    if (keynum == 9) { // Tab or Shift+Tab
        // FIXME: selecting all text on tab key does not work on IE8 (-> put selectContentEditable() in keyup too?)
        //jsoneditor.Node.select(jsoneditor.JSONEditor.domFocus);
        setTimeout(function () {
            // select all text when moving focus to an editable div
            jsoneditor.util.selectContentEditable(jsoneditor.JSONEditor.domFocus);
        }, 0);
    }

    if (this.searchBox) {
        if (ctrlKey && keynum == 70) { // Ctrl+F
            this.searchBox.dom.search.focus();
            this.searchBox.dom.search.select();
            handled = true;
        }
        else if (keynum == 114 || (ctrlKey && keynum == 71)) { // F3 or Ctrl+G
            var focus = true;
            if (!shiftKey) {
                // select next search result (F3 or Ctrl+G)
                this.searchBox.next(focus);
            }
            else {
                // select previous search result (Shift+F3 or Ctrl+Shift+G)
                this.searchBox.previous(focus);
            }

            handled = true;
        }
    }

    if (this.history) {
        if (ctrlKey && !shiftKey && keynum == 90) { // Ctrl+Z
            // undo
            this._onUndo();
            handled = true;
        }
        else if (ctrlKey && shiftKey && keynum == 90) { // Ctrl+Shift+Z
            // redo
            this._onRedo();
            handled = true;
        }
    }

    if (handled) {
        jsoneditor.util.preventDefault(event);
        jsoneditor.util.stopPropagation(event);
    }
};

/**
 * Create main table
 * @private
 */
jsoneditor.JSONEditor.prototype._createTable = function () {
    var contentOuter = document.createElement('div');
    contentOuter.className = 'outer';
    this.contentOuter = contentOuter;

    this.content = document.createElement('div');
    this.content.className = 'content';
    contentOuter.appendChild(this.content);

    this.table = document.createElement('table');
    this.table.className = 'content';
    this.content.appendChild(this.table);

    // IE8 does not handle overflow='auto' correctly.
    // Therefore, set overflow to 'scroll'
    var ieVersion = jsoneditor.util.getInternetExplorerVersion();
    if (ieVersion == 8) {
        this.content.style.overflow = 'scroll';
    }

    // create colgroup where the first two columns don't have a fixed
    // width, and the edit columns do have a fixed width
    var col;
    this.colgroupContent = document.createElement('colgroup');
    col = document.createElement('col');
    col.width = "24px";
    this.colgroupContent.appendChild(col);
    col = document.createElement('col');
    col.width = "24px";
    this.colgroupContent.appendChild(col);
    col = document.createElement('col');
    this.colgroupContent.appendChild(col);
    this.table.appendChild(this.colgroupContent);

    this.tbody = document.createElement('tbody');
    this.table.appendChild(this.tbody);

    this.frame.appendChild(contentOuter);
};
