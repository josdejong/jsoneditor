/*!
 * jsoneditor.js
 *
 * @brief
 * JSONEditor is a web-based tool to view, edit, and format JSON.
 * It shows data a clear, editable treeview.
 *
 * Supported browsers: Chrome, Firefox, Safari, Opera, Internet Explorer 8+
 *
 * @license
 * This json editor is open sourced with the intention to use the editor as
 * a component in your own application. Not to just copy and monetize the editor
 * as it is.
 *
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
 * @version 2.3.0-SNAPSHOT
 * @date    2013-05-28
 */
(function () {

/**
 * @constructor JSONEditor
 * @param {Element} container    Container element
 * @param {Object}  [options]    Object with options. available options:
 *                               {String} mode      Editor mode. Available values:
 *                                                  'tree' (default), 'view',
 *                                                  'form', 'text', and 'code'.
 *                               {function} change  Callback method, triggered
 *                                                  on change of contents
 *                               {Boolean} search   Enable search box.
 *                                                  True by default
 *                                                  Only applicable for modes
 *                                                  'tree', 'view', and 'form'
 *                               {Boolean} history  Enable history (undo/redo).
 *                                                  True by default
 *                                                  Only applicable for modes
 *                                                  'tree', 'view', and 'form'
 *                               {String} name      Field name for the root node.
 *                                                  Only applicable for modes
 *                                                  'tree', 'view', and 'form'
 *                               {Number} indentation   Number of indentation
 *                                                      spaces. 4 by default.
 *                                                      Only applicable for
 *                                                      modes 'text' and 'code'
 * @param {Object | undefined} json JSON object
 */
function JSONEditor (container, options, json) {
    if (!(this instanceof JSONEditor)) {
        throw new Error('JSONEditor constructor called without "new".');
    }

    if (arguments.length) {
        this._create(container, options, json);
    }
}

/**
 * Configuration for all registered modes. Example:
 * {
 *     tree: {
 *         editor: TreeEditor,
 *         data: 'json'
 *     },
 *     text: {
 *         editor: TextEditor,
 *         data: 'text'
 *     }
 * }
 *
 * @type { Object.<String, {editor: Object, data: String} > }
 */
JSONEditor.modes = {};

/**
 * Create the JSONEditor
 * @param {Element} container    Container element
 * @param {Object}  [options]    See description in constructor
 * @param {Object | undefined} json JSON object
 * @private
 */
JSONEditor.prototype._create = function (container, options, json) {
    this.container = container;
    this.options = options || {};
    this.json = json || {};

    var mode = this.options.mode || 'tree';
    this.setMode(mode);
};

/**
 * Detach the editor from the DOM
 * @private
 */
JSONEditor.prototype._delete = function () {};

/**
 * Set JSON object in editor
 * @param {Object | undefined} json      JSON data
 */
JSONEditor.prototype.set = function (json) {
    this.json = json;
};

/**
 * Get JSON from the editor
 * @returns {Object} json
 */
JSONEditor.prototype.get = function () {
    return this.json;
};

/**
 * Set string containing JSON for the editor
 * @param {String | undefined} jsonText
 */
JSONEditor.prototype.setText = function (jsonText) {
    this.json = util.parse(jsonText);
};

/**
 * Get stringified JSON contents from the editor
 * @returns {String} jsonText
 */
JSONEditor.prototype.getText = function () {
    return JSON.stringify(this.json);
};

/**
 * Set a field name for the root node.
 * @param {String | undefined} name
 */
JSONEditor.prototype.setName = function (name) {
    if (!this.options) {
        this.options = {};
    }
    this.options.name = name;
};

/**
 * Get the field name for the root node.
 * @return {String | undefined} name
 */
JSONEditor.prototype.getName = function () {
    return this.options && this.options.name;
};

/**
 * Change the mode of the editor.
 * JSONEditor will be extended with all methods needed for the chosen mode.
 * @param {String} mode     Available modes: 'tree' (default), 'view', 'form',
 *                          'text', and 'code'.
 */
JSONEditor.prototype.setMode = function (mode) {
    var container = this.container,
        options = util.extend({}, this.options),
        data,
        name;

    options.mode = mode;
    var config = JSONEditor.modes[mode];
    if (config) {
        try {
            if (config.data == 'text') {
                // text
                name = this.getName();
                data = this.getText();

                this._delete();
                util.clear(this);
                util.extend(this, config.editor.prototype);
                this._create(container, options);

                this.setName(name);
                this.setText(data);
            }
            else {
                // json
                name = this.getName();
                data = this.get();

                this._delete();
                util.clear(this);
                util.extend(this, config.editor.prototype);
                this._create(container, options);

                this.setName(name);
                this.set(data);
            }

            if (typeof config.load === 'function') {
                try {
                    config.load.call(this);
                }
                catch (err) {}
            }
        }
        catch (err) {
            this._onError(err);
        }
    }
    else {
        throw new Error('Unknown mode "' + options.mode + '"');
    }
};

/**
 * Throw an error. If an error callback is configured in options.error, this
 * callback will be invoked. Else, a regular error is thrown.
 * @param {Error} err
 * @private
 */
JSONEditor.prototype._onError = function(err) {
    // TODO: onError is deprecated since version 2.2.0. cleanup some day
    if (typeof this.onError === 'function') {
        util.log('WARNING: JSONEditor.onError is deprecated. ' +
            'Use options.error instead.');
        this.onError(err);
    }

    if (this.options && typeof this.options.error === 'function') {
        this.options.error(err);
    }
    else {
        throw err;
    }
};

/**
 * @constructor TreeEditor
 * @param {Element} container    Container element
 * @param {Object}  [options]    Object with options. available options:
 *                               {String} mode      Editor mode. Available values:
 *                                                  'tree' (default), 'view',
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
function TreeEditor(container, options, json) {
    if (!(this instanceof TreeEditor)) {
        throw new Error('TreeEditor constructor called without "new".');
    }

    this._create(container, options, json);
}

/**
 * Create the TreeEditor
 * @param {Element} container    Container element
 * @param {Object}  [options]    See description in constructor
 * @param {Object | undefined} json JSON object
 * @private
 */
TreeEditor.prototype._create = function (container, options, json) {
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
    this.highlighter = new Highlighter();
    this.selection = undefined; // will hold the last input selection

    this._setOptions(options);

    if (this.options.history && !this.mode.view) {
        this.history = new History(this);
    }

    this._createFrame();
    this._createTable();

    this.set(json || {});
};

/**
 * Detach the editor from the DOM
 * @private
 */
TreeEditor.prototype._delete = function () {
    if (this.frame && this.container && this.frame.parentNode == this.container) {
        this.container.removeChild(this.frame);
    }
};

/**
 * Initialize and set default options
 * @param {Object}  [options]    See description in constructor
 * @private
 */
TreeEditor.prototype._setOptions = function (options) {
    this.options = {
        search: true,
        history: true,
        mode: 'tree',
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
            util.log('WARNING: Option "enableSearch" is deprecated. Use "search" instead.');
        }
        if (options['enableHistory']) {
            // deprecated since version 1.6.0, 2012-11-03
            this.options.history = options['enableHistory'];
            util.log('WARNING: Option "enableHistory" is deprecated. Use "history" instead.');
        }
        if (options['mode'] == 'editor') {
            // deprecated since version 2.2.0, 2013-04-30
            this.options.mode = 'tree';
            util.log('WARNING: Mode "editor" is deprecated. Use "tree" instead.');
        }
        if (options['mode'] == 'viewer') {
            // deprecated since version 2.2.0, 2013-04-30
            this.options.mode = 'view';
            util.log('WARNING: Mode "viewer" is deprecated. Use "view" instead.');
        }
    }

    // interpret the mode options
    this.mode = {
        edit: (this.options.mode != 'view' && this.options.mode != 'form'),
        view: (this.options.mode == 'view'),
        form: (this.options.mode == 'form')
    };
};

// node currently being edited
TreeEditor.focusNode = undefined;

/**
 * Set JSON object in editor
 * @param {Object | undefined} json      JSON data
 * @param {String}             [name]    Optional field name for the root node.
 *                                       Can also be set using setName(name).
 */
TreeEditor.prototype.set = function (json, name) {
    // adjust field name for root node
    if (name) {
        // TODO: deprecated since version 2.2.0. Cleanup some day.
        util.log('Warning: second parameter "name" is deprecated. ' +
            'Use setName(name) instead.');
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
        var node = new Node(this, params);
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
TreeEditor.prototype.get = function () {
    // remove focus from currently edited node
    if (TreeEditor.focusNode) {
        TreeEditor.focusNode.blur();
    }

    if (this.node) {
        return this.node.getValue();
    }
    else {
        return undefined;
    }
};

/**
 * Get the text contents of the TreeEditor
 * @return {String} jsonText
 */
TreeEditor.prototype.getText = function() {
    return JSON.stringify(this.get());
};

/**
 * Set the text contents of the TreeEditor
 * @param {String} jsonText
 */
TreeEditor.prototype.setText = function(jsonText) {
    this.set(util.parse(jsonText));
};

/**
 * Set a field name for the root node.
 * @param {String | undefined} name
 */
TreeEditor.prototype.setName = function (name) {
    this.options.name = name;
    if (this.node) {
        this.node.updateField(this.options.name);
    }
};

/**
 * Get the field name for the root node.
 * @return {String | undefined} name
 */
TreeEditor.prototype.getName = function () {
    return this.options.name;
};

/**
 * Remove the root node from the editor
 */
TreeEditor.prototype.clear = function () {
    if (this.node) {
        this.node.collapse();
        this.tbody.removeChild(this.node.getDom());
        delete this.node;
    }
};

/**
 * Set the root node for the json editor
 * @param {Node} node
 * @private
 */
TreeEditor.prototype._setRoot = function (node) {
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
 *                             - {Node} node,
 *                             - {String} elem  the dom element name where
 *                                              the result is found ('field' or
 *                                              'value')
 */
TreeEditor.prototype.search = function (text) {
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
TreeEditor.prototype.expandAll = function () {
    if (this.node) {
        this.content.removeChild(this.table);  // Take the table offline
        this.node.expand();
        this.content.appendChild(this.table);  // Put the table online again
    }
};

/**
 * Collapse all nodes
 */
TreeEditor.prototype.collapseAll = function () {
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
TreeEditor.prototype._onAction = function (action, params) {
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
            util.log('Error in change callback: ', err);
        }
    }
};

/**
 * Start autoscrolling when given mouse position is above the top of the
 * editor contents, or below the bottom.
 * @param {Number} mouseY  Absolute mouse position in pixels
 */
TreeEditor.prototype.startAutoScroll = function (mouseY) {
    var me = this;
    var content = this.content;
    var top = util.getAbsoluteTop(content);
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
TreeEditor.prototype.stopAutoScroll = function () {
    if (this.autoScrollTimer) {
        clearTimeout(this.autoScrollTimer);
        delete this.autoScrollTimer;
    }
    if (this.autoScrollStep) {
        delete this.autoScrollStep;
    }
};


/**
 * Set the focus to an element in the TreeEditor, set text selection, and
 * set scroll position.
 * @param {Object} selection  An object containing fields:
 *                            {Element | undefined} dom     The dom element
 *                                                          which has focus
 *                            {Range | TextRange} range     A text selection
 *                            {Number} scrollTop            Scroll position
 */
TreeEditor.prototype.setSelection = function (selection) {
    if (!selection) {
        return;
    }

    if ('scrollTop' in selection && this.content) {
        // TODO: animated scroll
        this.content.scrollTop = selection.scrollTop;
    }
    if (selection.range) {
        util.setSelectionOffset(selection.range);
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
TreeEditor.prototype.getSelection = function () {
    return {
        dom: TreeEditor.domFocus,
        scrollTop: this.content ? this.content.scrollTop : 0,
        range: util.getSelectionOffset()
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
TreeEditor.prototype.scrollTo = function (top, callback) {
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
TreeEditor.prototype._createFrame = function () {
    // create the frame
    this.frame = document.createElement('div');
    this.frame.className = 'jsoneditor';
    this.container.appendChild(this.frame);

    // create one global event listener to handle all events from all nodes
    var editor = this;
    var onEvent = function (event) {
        editor._onEvent(event);
    };
    this.frame.onclick = function (event) {
        event = event || window.event;
        var target = event.target || event.srcElement;

        onEvent(event);

        // prevent default submit action of buttons when TreeEditor is located
        // inside a form
        if (target.nodeName == 'BUTTON') {
            util.preventDefault(event);
        }
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
    util.addEventListener(this.frame, 'focus', onEvent, true);
    util.addEventListener(this.frame, 'blur', onEvent, true);
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
        this.searchBox = new SearchBox(this, this.menu);
    }
};

/**
 * Perform an undo action
 * @private
 */
TreeEditor.prototype._onUndo = function () {
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
TreeEditor.prototype._onRedo = function () {
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
TreeEditor.prototype._onEvent = function (event) {
    event = event || window.event;
    var target = event.target || event.srcElement;

    if (event.type == 'keydown') {
        this._onKeyDown(event);
    }

    if (event.type == 'focus') {
        TreeEditor.domFocus = target;
    }

    var node = Node.getNodeFromTarget(target);
    if (node) {
        node.onEvent(event);
    }
};

/**
 * Event handler for keydown. Handles shortcut keys
 * @param {Event} event
 * @private
 */
TreeEditor.prototype._onKeyDown = function (event) {
    var keynum = event.which || event.keyCode;
    var ctrlKey = event.ctrlKey;
    var shiftKey = event.shiftKey;
    var handled = false;

    if (keynum == 9) { // Tab or Shift+Tab
        // FIXME: selecting all text on tab key does not work on IE8 (-> put selectContentEditable() in keyup too?)
        //Node.select(TreeEditor.domFocus);
        setTimeout(function () {
            // select all text when moving focus to an editable div
            util.selectContentEditable(TreeEditor.domFocus);
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
        util.preventDefault(event);
        util.stopPropagation(event);
    }
};

/**
 * Create main table
 * @private
 */
TreeEditor.prototype._createTable = function () {
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
    var ieVersion = util.getInternetExplorerVersion();
    if (ieVersion == 8) {
        this.content.style.overflow = 'scroll';
    }

    // create colgroup where the first two columns don't have a fixed
    // width, and the edit columns do have a fixed width
    var col;
    this.colgroupContent = document.createElement('colgroup');
    if (this.mode.edit) {
        col = document.createElement('col');
        col.width = "24px";
        this.colgroupContent.appendChild(col);
    }
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

// register modes at the JSONEditor
JSONEditor.modes.tree = {
    editor: TreeEditor,
    data: 'json'
};
JSONEditor.modes.view = {
    editor: TreeEditor,
    data: 'json'
};
JSONEditor.modes.form = {
    editor: TreeEditor,
    data: 'json'
};
// Deprecated modes (deprecated since version 2.2.0)
JSONEditor.modes.editor = {
    editor: TreeEditor,
    data: 'json'
};
JSONEditor.modes.viewer = {
    editor: TreeEditor,
    data: 'json'
};

/**
 * Create a TextEditor and attach it to given container
 * @constructor TextEditor
 * @param {Element} container
 * @param {Object} [options]         Object with options. available options:
 *                                   {String} mode         Available values:
 *                                                         "text" (default)
 *                                                         or "code".
 *                                   {Number} indentation  Number of indentation
 *                                                         spaces. 4 by default.
 *                                   {function} change     Callback method
 *                                                         triggered on change
 * @param {JSON | String} [json]     initial contents of the formatter
 */
function TextEditor(container, options, json) {
    if (!(this instanceof TextEditor)) {
        throw new Error('TextEditor constructor called without "new".');
    }

    this._create(container, options, json);
}

/**
 * Create a TextEditor and attach it to given container
 * @constructor TextEditor
 * @param {Element} container
 * @param {Object} [options]         See description in constructor
 * @param {JSON | String} [json]     initial contents of the formatter
 * @private
 */
TextEditor.prototype._create = function (container, options, json) {
    // check availability of JSON parser (not available in IE7 and older)
    if (typeof(JSON) == 'undefined') {
        throw new Error('Your browser does not support JSON. \n\n' +
            'Please install the newest version of your browser.\n' +
            '(all modern browsers support JSON).');
    }

    // read options
    options = options || {};
    this.options = options;
    if (options.indentation) {
        this.indentation = Number(options.indentation);
    }
    this.mode = (options.mode == 'code') ? 'code' : 'text';
    if (this.mode == 'code') {
        // verify whether Ace editor is available and supported
        if (typeof ace === 'undefined') {
            this.mode = 'text';
            util.log('WARNING: Cannot load code editor, Ace library not loaded. ' +
                'Falling back to plain text editor');
        }
        if (util.getInternetExplorerVersion() == 8) {
            this.mode = 'text';
            util.log('WARNING: Cannot load code editor, Ace is not supported on IE8. ' +
                'Falling back to plain text editor');
        }
    }

    var me = this;
    this.container = container;
    this.editor = undefined;    // ace code editor
    this.textarea = undefined;  // plain text editor (fallback when Ace is not available)
    this.indentation = 4;       // number of spaces

    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.frame = document.createElement('div');
    this.frame.className = 'jsoneditor';
    this.frame.onclick = function (event) {
        // prevent default submit action when TextEditor is located inside a form
        util.preventDefault(event);
    };

    // create menu
    this.menu = document.createElement('div');
    this.menu.className = 'menu';
    this.frame.appendChild(this.menu);

    // create format button
    var buttonFormat = document.createElement('button');
    //buttonFormat.innerHTML = 'Format';
    buttonFormat.className = 'format';
    buttonFormat.title = 'Format JSON data, with proper indentation and line feeds';
    //buttonFormat.className = 'jsoneditor-button';
    this.menu.appendChild(buttonFormat);
    buttonFormat.onclick = function () {
        try {
            me.format();
        }
        catch (err) {
            me._onError(err);
        }
    };

    // create compact button
    var buttonCompact = document.createElement('button');
    //buttonCompact.innerHTML = 'Compact';
    buttonCompact.className = 'compact';
    buttonCompact.title = 'Compact JSON data, remove all whitespaces';
    //buttonCompact.className = 'jsoneditor-button';
    this.menu.appendChild(buttonCompact);
    buttonCompact.onclick = function () {
        try {
            me.compact();
        }
        catch (err) {
            me._onError(err);
        }
    };

    this.content = document.createElement('div');
    this.content.className = 'outer';
    this.frame.appendChild(this.content);

    this.container.appendChild(this.frame);

    if (this.mode == 'code') {
        this.editorDom = document.createElement('div');
        this.editorDom.style.height = '100%'; // TODO: move to css
        this.editorDom.style.width = '100%'; // TODO: move to css
        this.content.appendChild(this.editorDom);

        var editor = ace.edit(this.editorDom);
        editor.setTheme('ace/theme/jsoneditor');
        editor.setShowPrintMargin(false);
        editor.setFontSize(13);
        editor.getSession().setMode('ace/mode/json');
        editor.getSession().setUseSoftTabs(true);
        editor.getSession().setUseWrapMode(true);
        this.editor = editor;

        var poweredBy = document.createElement('a');
        poweredBy.appendChild(document.createTextNode('powered by ace'));
        poweredBy.href = 'http://ace.ajax.org';
        poweredBy.target = '_blank';
        poweredBy.className = 'poweredBy';
        poweredBy.onclick = function () {
            // TODO: this anchor falls below the margin of the content,
            // therefore the normal a.href does not work. We use a click event
            // for now, but this should be fixed.
            window.open(poweredBy.href, poweredBy.target);
        };
        this.menu.appendChild(poweredBy);

        if (options.change) {
            // register onchange event
            editor.on('change', function () {
                options.change();
            });
        }
    }
    else {
        // load a plain text textarea
        var textarea = document.createElement('textarea');
        textarea.className = 'content';
        textarea.spellcheck = false;
        this.content.appendChild(textarea);
        this.textarea = textarea;

        if (options.change) {
            // register onchange event
            if (this.textarea.oninput === null) {
                this.textarea.oninput = function () {
                    options.change();
                }
            }
            else {
                // oninput is undefined. For IE8-
                this.textarea.onchange = function () {
                    options.change();
                }
            }
        }
    }

    // load initial json object or string
    if (typeof(json) == 'string') {
        this.setText(json);
    }
    else {
        this.set(json);
    }
};

/**
 * Detach the editor from the DOM
 * @private
 */
TextEditor.prototype._delete = function () {
    if (this.frame && this.container && this.frame.parentNode == this.container) {
        this.container.removeChild(this.frame);
    }
};

/**
 * Throw an error. If an error callback is configured in options.error, this
 * callback will be invoked. Else, a regular error is thrown.
 * @param {Error} err
 * @private
 */
TextEditor.prototype._onError = function(err) {
    // TODO: onError is deprecated since version 2.2.0. cleanup some day
    if (typeof this.onError === 'function') {
        util.log('WARNING: JSONEditor.onError is deprecated. ' +
            'Use options.error instead.');
        this.onError(err);
    }

    if (this.options && typeof this.options.error === 'function') {
        this.options.error(err);
    }
    else {
        throw err;
    }
};

/**
 * Compact the code in the formatter
 */
TextEditor.prototype.compact = function () {
    var json = util.parse(this.getText());
    this.setText(JSON.stringify(json));
};

/**
 * Format the code in the formatter
 */
TextEditor.prototype.format = function () {
    var json = util.parse(this.getText());
    this.setText(JSON.stringify(json, null, this.indentation));
};

/**
 * Set focus to the formatter
 */
TextEditor.prototype.focus = function () {
    if (this.textarea) {
        this.textarea.focus();
    }
    if (this.editor) {
        this.editor.focus();
    }
};

/**
 * Resize the formatter
 */
TextEditor.prototype.resize = function () {
    if (this.editor) {
        var force = false;
        this.editor.resize(force);
    }
};

/**
 * Set json data in the formatter
 * @param {Object} json
 */
TextEditor.prototype.set = function(json) {
    this.setText(JSON.stringify(json, null, this.indentation));
};

/**
 * Get json data from the formatter
 * @return {Object} json
 */
TextEditor.prototype.get = function() {
    return util.parse(this.getText());
};

/**
 * Get the text contents of the TextEditor
 * @return {String} jsonText
 */
TextEditor.prototype.getText = function() {
    if (this.textarea) {
        return this.textarea.value;
    }
    if (this.editor) {
        return this.editor.getValue();
    }
    return '';
};

/**
 * Set the text contents of the TextEditor
 * @param {String} jsonText
 */
TextEditor.prototype.setText = function(jsonText) {
    if (this.textarea) {
        this.textarea.value = jsonText;
    }
    if (this.editor) {
        this.editor.setValue(jsonText, -1);
    }
};

// register modes at the JSONEditor
JSONEditor.modes.text = {
    editor: TextEditor,
    data: 'text',
    load: TextEditor.prototype.format
};
JSONEditor.modes.code = {
    editor: TextEditor,
    data: 'text',
    load: TextEditor.prototype.format
};

/**
 * @constructor Node
 * Create a new Node
 * @param {TreeEditor} editor
 * @param {Object} [params] Can contain parameters:
 *                          {string}  field
 *                          {boolean} fieldEditable
 *                          {*}       value
 *                          {String}  type  Can have values 'auto', 'array',
 *                                          'object', or 'string'.
 */
function Node (editor, params) {
    /** @type {TreeEditor} */
    this.editor = editor;
    this.dom = {};
    this.expanded = false;

    if(params && (params instanceof Object)) {
        this.setField(params.field, params.fieldEditable);
        this.setValue(params.value, params.type);
    }
    else {
        this.setField('');
        this.setValue(null);
    }
};

/**
 * Set parent node
 * @param {Node} parent
 */
Node.prototype.setParent = function(parent) {
    this.parent = parent;
};

/**
 * Set field
 * @param {String}  field
 * @param {boolean} [fieldEditable]
 */
Node.prototype.setField = function(field, fieldEditable) {
    this.field = field;
    this.fieldEditable = (fieldEditable == true);
};

/**
 * Get field
 * @return {String}
 */
Node.prototype.getField = function() {
    if (this.field === undefined) {
        this._getDomField();
    }

    return this.field;
};

/**
 * Set value. Value is a JSON structure or an element String, Boolean, etc.
 * @param {*} value
 * @param {String} [type]  Specify the type of the value. Can be 'auto',
 *                         'array', 'object', or 'string'
 */
Node.prototype.setValue = function(value, type) {
    var childValue, child;

    // first clear all current childs (if any)
    var childs = this.childs;
    if (childs) {
        while (childs.length) {
            this.removeChild(childs[0]);
        }
    }

    // TODO: remove the DOM of this Node

    this.type = this._getType(value);

    // check if type corresponds with the provided type
    if (type && type != this.type) {
        if (type == 'string' && this.type == 'auto') {
            this.type = type;
        }
        else {
            throw new Error('Type mismatch: ' +
                'cannot cast value of type "' + this.type +
                ' to the specified type "' + type + '"');
        }
    }

    if (this.type == 'array') {
        // array
        this.childs = [];
        for (var i = 0, iMax = value.length; i < iMax; i++) {
            childValue = value[i];
            if (childValue !== undefined && !(childValue instanceof Function)) {
                // ignore undefined and functions
                child = new Node(this.editor, {
                    'value': childValue
                });
                this.appendChild(child);
            }
        }
        this.value = '';
    }
    else if (this.type == 'object') {
        // object
        this.childs = [];
        for (var childField in value) {
            if (value.hasOwnProperty(childField)) {
                childValue = value[childField];
                if (childValue !== undefined && !(childValue instanceof Function)) {
                    // ignore undefined and functions
                    child = new Node(this.editor, {
                        'field': childField,
                        'value': childValue
                    });
                    this.appendChild(child);
                }
            }
        }
        this.value = '';
    }
    else {
        // value
        this.childs = undefined;
        this.value = value;
        /* TODO
         if (typeof(value) == 'string') {
         var escValue = JSON.stringify(value);
         this.value = escValue.substring(1, escValue.length - 1);
         util.log('check', value, this.value);
         }
         else {
         this.value = value;
         }
         */
    }
};

/**
 * Get value. Value is a JSON structure
 * @return {*} value
 */
Node.prototype.getValue = function() {
    //var childs, i, iMax;

    if (this.type == 'array') {
        var arr = [];
        this.childs.forEach (function (child) {
            arr.push(child.getValue());
        });
        return arr;
    }
    else if (this.type == 'object') {
        var obj = {};
        this.childs.forEach (function (child) {
            obj[child.getField()] = child.getValue();
        });
        return obj;
    }
    else {
        if (this.value === undefined) {
            this._getDomValue();
        }

        return this.value;
    }
};

/**
 * Get the nesting level of this node
 * @return {Number} level
 */
Node.prototype.getLevel = function() {
    return (this.parent ? this.parent.getLevel() + 1 : 0);
};

/**
 * Create a clone of a node
 * The complete state of a clone is copied, including whether it is expanded or
 * not. The DOM elements are not cloned.
 * @return {Node} clone
 */
Node.prototype.clone = function() {
    var clone = new Node(this.editor);
    clone.type = this.type;
    clone.field = this.field;
    clone.fieldInnerText = this.fieldInnerText;
    clone.fieldEditable = this.fieldEditable;
    clone.value = this.value;
    clone.valueInnerText = this.valueInnerText;
    clone.expanded = this.expanded;

    if (this.childs) {
        // an object or array
        var cloneChilds = [];
        this.childs.forEach(function (child) {
            var childClone = child.clone();
            childClone.setParent(clone);
            cloneChilds.push(childClone);
        });
        clone.childs = cloneChilds;
    }
    else {
        // a value
        clone.childs = undefined;
    }

    return clone;
};

/**
 * Expand this node and optionally its childs.
 * @param {boolean} [recurse] Optional recursion, true by default. When
 *                            true, all childs will be expanded recursively
 */
Node.prototype.expand = function(recurse) {
    if (!this.childs) {
        return;
    }

    // set this node expanded
    this.expanded = true;
    if (this.dom.expand) {
        this.dom.expand.className = 'expanded';
    }

    this.showChilds();

    if (recurse != false) {
        this.childs.forEach(function (child) {
            child.expand(recurse);
        });
    }
};

/**
 * Collapse this node and optionally its childs.
 * @param {boolean} [recurse] Optional recursion, true by default. When
 *                            true, all childs will be collapsed recursively
 */
Node.prototype.collapse = function(recurse) {
    if (!this.childs) {
        return;
    }

    this.hideChilds();

    // collapse childs in case of recurse
    if (recurse != false) {
        this.childs.forEach(function (child) {
            child.collapse(recurse);
        });

    }

    // make this node collapsed
    if (this.dom.expand) {
        this.dom.expand.className = 'collapsed';
    }
    this.expanded = false;
};

/**
 * Recursively show all childs when they are expanded
 */
Node.prototype.showChilds = function() {
    var childs = this.childs;
    if (!childs) {
        return;
    }
    if (!this.expanded) {
        return;
    }

    var tr = this.dom.tr;
    var table = tr ? tr.parentNode : undefined;
    if (table) {
        // show row with append button
        var append = this.getAppend();
        var nextTr = tr.nextSibling;
        if (nextTr) {
            table.insertBefore(append, nextTr);
        }
        else {
            table.appendChild(append);
        }

        // show childs
        this.childs.forEach(function (child) {
            table.insertBefore(child.getDom(), append);
            child.showChilds();
        });
    }
};

/**
 * Hide the node with all its childs
 */
Node.prototype.hide = function() {
    var tr = this.dom.tr;
    var table = tr ? tr.parentNode : undefined;
    if (table) {
        table.removeChild(tr);
    }
    this.hideChilds();
};


/**
 * Recursively hide all childs
 */
Node.prototype.hideChilds = function() {
    var childs = this.childs;
    if (!childs) {
        return;
    }
    if (!this.expanded) {
        return;
    }

    // hide append row
    var append = this.getAppend();
    if (append.parentNode) {
        append.parentNode.removeChild(append);
    }

    // hide childs
    this.childs.forEach(function (child) {
        child.hide();
    });
};


/**
 * Add a new child to the node.
 * Only applicable when Node value is of type array or object
 * @param {Node} node
 */
Node.prototype.appendChild = function(node) {
    if (this._hasChilds()) {
        // adjust the link to the parent
        node.setParent(this);
        node.fieldEditable = (this.type == 'object');
        if (this.type == 'array') {
            node.index = this.childs.length;
        }
        this.childs.push(node);

        if (this.expanded) {
            // insert into the DOM, before the appendRow
            var newTr = node.getDom();
            var appendTr = this.getAppend();
            var table = appendTr ? appendTr.parentNode : undefined;
            if (appendTr && table) {
                table.insertBefore(newTr, appendTr);
            }

            node.showChilds();
        }

        this.updateDom({'updateIndexes': true});
        node.updateDom({'recurse': true});
    }
};


/**
 * Move a node from its current parent to this node
 * Only applicable when Node value is of type array or object
 * @param {Node} node
 * @param {Node} beforeNode
 */
Node.prototype.moveBefore = function(node, beforeNode) {
    if (this._hasChilds()) {
        // create a temporary row, to prevent the scroll position from jumping
        // when removing the node
        var tbody = (this.dom.tr) ? this.dom.tr.parentNode : undefined;
        if (tbody) {
            var trTemp = document.createElement('tr');
            trTemp.style.height = tbody.clientHeight + 'px';
            tbody.appendChild(trTemp);
        }

        if (node.parent) {
            node.parent.removeChild(node);
        }

        if (beforeNode instanceof AppendNode) {
            this.appendChild(node);
        }
        else {
            this.insertBefore(node, beforeNode);
        }

        if (tbody) {
            tbody.removeChild(trTemp);
        }
    }
};

/**
 * Move a node from its current parent to this node
 * Only applicable when Node value is of type array or object.
 * If index is out of range, the node will be appended to the end
 * @param {Node} node
 * @param {Number} index
 */
Node.prototype.moveTo = function (node, index) {
    if (node.parent == this) {
        // same parent
        var currentIndex = this.childs.indexOf(node);
        if (currentIndex < index) {
            // compensate the index for removal of the node itself
            index++;
        }
    }

    var beforeNode = this.childs[index] || this.append;
    this.moveBefore(node, beforeNode);
};

/**
 * Insert a new child before a given node
 * Only applicable when Node value is of type array or object
 * @param {Node} node
 * @param {Node} beforeNode
 */
Node.prototype.insertBefore = function(node, beforeNode) {
    if (this._hasChilds()) {
        if (beforeNode == this.append) {
            // append to the child nodes

            // adjust the link to the parent
            node.setParent(this);
            node.fieldEditable = (this.type == 'object');
            this.childs.push(node);
        }
        else {
            // insert before a child node
            var index = this.childs.indexOf(beforeNode);
            if (index == -1) {
                throw new Error('Node not found');
            }

            // adjust the link to the parent
            node.setParent(this);
            node.fieldEditable = (this.type == 'object');
            this.childs.splice(index, 0, node);
        }

        if (this.expanded) {
            // insert into the DOM
            var newTr = node.getDom();
            var nextTr = beforeNode.getDom();
            var table = nextTr ? nextTr.parentNode : undefined;
            if (nextTr && table) {
                table.insertBefore(newTr, nextTr);
            }

            node.showChilds();
        }

        this.updateDom({'updateIndexes': true});
        node.updateDom({'recurse': true});
    }
};

/**
 * Insert a new child before a given node
 * Only applicable when Node value is of type array or object
 * @param {Node} node
 * @param {Node} afterNode
 */
Node.prototype.insertAfter = function(node, afterNode) {
    if (this._hasChilds()) {
        var index = this.childs.indexOf(afterNode);
        var beforeNode = this.childs[index + 1];
        if (beforeNode) {
            this.insertBefore(node, beforeNode);
        }
        else {
            this.appendChild(node);
        }
    }
};

/**
 * Search in this node
 * The node will be expanded when the text is found one of its childs, else
 * it will be collapsed. Searches are case insensitive.
 * @param {String} text
 * @return {Node[]} results  Array with nodes containing the search text
 */
Node.prototype.search = function(text) {
    var results = [];
    var index;
    var search = text ? text.toLowerCase() : undefined;

    // delete old search data
    delete this.searchField;
    delete this.searchValue;

    // search in field
    if (this.field != undefined) {
        var field = String(this.field).toLowerCase();
        index = field.indexOf(search);
        if (index != -1) {
            this.searchField = true;
            results.push({
                'node': this,
                'elem': 'field'
            });
        }

        // update dom
        this._updateDomField();
    }

    // search in value
    if (this._hasChilds()) {
        // array, object

        // search the nodes childs
        if (this.childs) {
            var childResults = [];
            this.childs.forEach(function (child) {
                childResults = childResults.concat(child.search(text));
            });
            results = results.concat(childResults);
        }

        // update dom
        if (search != undefined) {
            var recurse = false;
            if (childResults.length == 0) {
                this.collapse(recurse);
            }
            else {
                this.expand(recurse);
            }
        }
    }
    else {
        // string, auto
        if (this.value != undefined ) {
            var value = String(this.value).toLowerCase();
            index = value.indexOf(search);
            if (index != -1) {
                this.searchValue = true;
                results.push({
                    'node': this,
                    'elem': 'value'
                });
            }
        }

        // update dom
        this._updateDomValue();
    }

    return results;
};

/**
 * Move the scroll position such that this node is in the visible area.
 * The node will not get the focus
 * @param {function(boolean)} [callback]
 */
Node.prototype.scrollTo = function(callback) {
    if (!this.dom.tr || !this.dom.tr.parentNode) {
        // if the node is not visible, expand its parents
        var parent = this.parent;
        var recurse = false;
        while (parent) {
            parent.expand(recurse);
            parent = parent.parent;
        }
    }

    if (this.dom.tr && this.dom.tr.parentNode) {
        this.editor.scrollTo(this.dom.tr.offsetTop, callback);
    }
};


// stores the element name currently having the focus
Node.focusElement = undefined;

/**
 * Set focus to this node
 * @param {String} [elementName]  The field name of the element to get the
 *                                focus available values: 'drag', 'menu',
 *                                'expand', 'field', 'value' (default)
 */
Node.prototype.focus = function(elementName) {
    Node.focusElement = elementName;

    if (this.dom.tr && this.dom.tr.parentNode) {
        var dom = this.dom;

        switch (elementName) {
            case 'drag':
                if (dom.drag) {
                    dom.drag.focus();
                }
                else {
                    dom.menu.focus();
                }
                break;

            case 'menu':
                dom.menu.focus();
                break;

            case 'expand':
                if (this._hasChilds()) {
                    dom.expand.focus();
                }
                else if (dom.field && this.fieldEditable) {
                    dom.field.focus();
                    util.selectContentEditable(dom.field);
                }
                else if (dom.value && !this._hasChilds()) {
                    dom.value.focus();
                    util.selectContentEditable(dom.value);
                }
                else {
                    dom.menu.focus();
                }
                break;

            case 'field':
                if (dom.field && this.fieldEditable) {
                    dom.field.focus();
                    util.selectContentEditable(dom.field);
                }
                else if (dom.value && !this._hasChilds()) {
                    dom.value.focus();
                    util.selectContentEditable(dom.value);
                }
                else if (this._hasChilds()) {
                    dom.expand.focus();
                }
                else {
                    dom.menu.focus();
                }
                break;

            case 'value':
            default:
                if (dom.value && !this._hasChilds()) {
                    dom.value.focus();
                    util.selectContentEditable(dom.value);
                }
                else if (dom.field && this.fieldEditable) {
                    dom.field.focus();
                    util.selectContentEditable(dom.field);
                }
                else if (this._hasChilds()) {
                    dom.expand.focus();
                }
                else {
                    dom.menu.focus();
                }
                break;
        }
    }
};

/**
 * Select all text in an editable div after a delay of 0 ms
 * @param {Element} editableDiv
 */
Node.select = function(editableDiv) {
    setTimeout(function () {
        util.selectContentEditable(editableDiv);
    }, 0);
};

/**
 * Update the values from the DOM field and value of this node
 */
Node.prototype.blur = function() {
    // retrieve the actual field and value from the DOM.
    this._getDomValue(false);
    this._getDomField(false);
};

/**
 * Duplicate given child node
 * new structure will be added right before the cloned node
 * @param {Node} node           the childNode to be duplicated
 * @return {Node} clone         the clone of the node
 * @private
 */
Node.prototype._duplicate = function(node) {
    var clone = node.clone();

    /* TODO: adjust the field name (to prevent equal field names)
     if (this.type == 'object') {
     }
     */

    this.insertAfter(clone, node);

    return clone;
};

/**
 * Check if given node is a child. The method will check recursively to find
 * this node.
 * @param {Node} node
 * @return {boolean} containsNode
 */
Node.prototype.containsNode = function(node) {
    if (this == node) {
        return true;
    }

    var childs = this.childs;
    if (childs) {
        // TODO: use the js5 Array.some() here?
        for (var i = 0, iMax = childs.length; i < iMax; i++) {
            if (childs[i].containsNode(node)) {
                return true;
            }
        }
    }

    return false;
};

/**
 * Move given node into this node
 * @param {Node} node           the childNode to be moved
 * @param {Node} beforeNode     node will be inserted before given
 *                                         node. If no beforeNode is given,
 *                                         the node is appended at the end
 * @private
 */
Node.prototype._move = function(node, beforeNode) {
    if (node == beforeNode) {
        // nothing to do...
        return;
    }

    // check if this node is not a child of the node to be moved here
    if (node.containsNode(this)) {
        throw new Error('Cannot move a field into a child of itself');
    }

    // remove the original node
    if (node.parent) {
        node.parent.removeChild(node);
    }

    // create a clone of the node
    var clone = node.clone();
    node.clearDom();

    // insert or append the node
    if (beforeNode) {
        this.insertBefore(clone, beforeNode);
    }
    else {
        this.appendChild(clone);
    }

    /* TODO: adjust the field name (to prevent equal field names)
     if (this.type == 'object') {
     }
     */
};

/**
 * Remove a child from the node.
 * Only applicable when Node value is of type array or object
 * @param {Node} node   The child node to be removed;
 * @return {Node | undefined} node  The removed node on success,
 *                                             else undefined
 */
Node.prototype.removeChild = function(node) {
    if (this.childs) {
        var index = this.childs.indexOf(node);

        if (index != -1) {
            node.hide();

            // delete old search results
            delete node.searchField;
            delete node.searchValue;

            var removedNode = this.childs.splice(index, 1)[0];

            this.updateDom({'updateIndexes': true});

            return removedNode;
        }
    }

    return undefined;
};

/**
 * Remove a child node node from this node
 * This method is equal to Node.removeChild, except that _remove firex an
 * onChange event.
 * @param {Node} node
 * @private
 */
Node.prototype._remove = function (node) {
    this.removeChild(node);
};

/**
 * Change the type of the value of this Node
 * @param {String} newType
 */
Node.prototype.changeType = function (newType) {
    var oldType = this.type;

    if (oldType == newType) {
        // type is not changed
        return;
    }

    if ((newType == 'string' || newType == 'auto') &&
        (oldType == 'string' || oldType == 'auto')) {
        // this is an easy change
        this.type = newType;
    }
    else {
        // change from array to object, or from string/auto to object/array
        var table = this.dom.tr ? this.dom.tr.parentNode : undefined;
        var lastTr;
        if (this.expanded) {
            lastTr = this.getAppend();
        }
        else {
            lastTr = this.getDom();
        }
        var nextTr = (lastTr && lastTr.parentNode) ? lastTr.nextSibling : undefined;

        // hide current field and all its childs
        this.hide();
        this.clearDom();

        // adjust the field and the value
        this.type = newType;

        // adjust childs
        if (newType == 'object') {
            if (!this.childs) {
                this.childs = [];
            }

            this.childs.forEach(function (child, index) {
                child.clearDom();
                delete child.index;
                child.fieldEditable = true;
                if (child.field == undefined) {
                    child.field = '';
                }
            });

            if (oldType == 'string' || oldType == 'auto') {
                this.expanded = true;
            }
        }
        else if (newType == 'array') {
            if (!this.childs) {
                this.childs = [];
            }

            this.childs.forEach(function (child, index) {
                child.clearDom();
                child.fieldEditable = false;
                child.index = index;
            });

            if (oldType == 'string' || oldType == 'auto') {
                this.expanded = true;
            }
        }
        else {
            this.expanded = false;
        }

        // create new DOM
        if (table) {
            if (nextTr) {
                table.insertBefore(this.getDom(), nextTr);
            }
            else {
                table.appendChild(this.getDom());
            }
        }
        this.showChilds();
    }

    if (newType == 'auto' || newType == 'string') {
        // cast value to the correct type
        if (newType == 'string') {
            this.value = String(this.value);
        }
        else {
            this.value = this._stringCast(String(this.value));
        }

        this.focus();
    }

    this.updateDom({'updateIndexes': true});
};

/**
 * Retrieve value from DOM
 * @param {boolean} [silent]  If true (default), no errors will be thrown in
 *                            case of invalid data
 * @private
 */
Node.prototype._getDomValue = function(silent) {
    if (this.dom.value && this.type != 'array' && this.type != 'object') {
        this.valueInnerText = util.getInnerText(this.dom.value);
    }

    if (this.valueInnerText != undefined) {
        try {
            // retrieve the value
            var value;
            if (this.type == 'string') {
                value = this._unescapeHTML(this.valueInnerText);
            }
            else {
                var str = this._unescapeHTML(this.valueInnerText);
                value = this._stringCast(str);
            }
            if (value !== this.value) {
                var oldValue = this.value;
                this.value = value;
                this.editor._onAction('editValue', {
                    'node': this,
                    'oldValue': oldValue,
                    'newValue': value,
                    'oldSelection': this.editor.selection,
                    'newSelection': this.editor.getSelection()
                });
            }
        }
        catch (err) {
            this.value = undefined;
            // TODO: sent an action with the new, invalid value?
            if (silent != true) {
                throw err;
            }
        }
    }
};

/**
 * Update dom value:
 * - the text color of the value, depending on the type of the value
 * - the height of the field, depending on the width
 * - background color in case it is empty
 * @private
 */
Node.prototype._updateDomValue = function () {
    var domValue = this.dom.value;
    if (domValue) {
        // set text color depending on value type
        // TODO: put colors in css
        var v = this.value;
        var t = (this.type == 'auto') ? typeof(v) : this.type;
        var isUrl = (t == 'string' && util.isUrl(v));
        var color = '';
        if (isUrl && !this.editor.mode.edit) {
            color = '';
        }
        else if (t == 'string') {
            color = 'green';
        }
        else if (t == 'number') {
            color = 'red';
        }
        else if (t == 'boolean') {
            color = 'orange';
        }
        else if (this._hasChilds()) {
            // note: typeof(null)=="object", therefore check this.type instead of t
            color = '';
        }
        else if (v === null) {
            color = '#004ED0';  // blue
        }
        else {
            // invalid value
            color = 'black';
        }
        domValue.style.color = color;

        // make backgound color lightgray when empty
        var isEmpty = (String(this.value) == '' && this.type != 'array' && this.type != 'object');
        if (isEmpty) {
            util.addClassName(domValue, 'empty');
        }
        else {
            util.removeClassName(domValue, 'empty');
        }

        // underline url
        if (isUrl) {
            util.addClassName(domValue, 'url');
        }
        else {
            util.removeClassName(domValue, 'url');
        }

        // update title
        if (t == 'array' || t == 'object') {
            var count = this.childs ? this.childs.length : 0;
            domValue.title = this.type + ' containing ' + count + ' items';
        }
        else if (t == 'string' && util.isUrl(v)) {
            if (this.editor.mode.edit) {
                domValue.title = 'Ctrl+Click or Ctrl+Enter to open url in new window';
            }
        }
        else {
            domValue.title = '';
        }

        // highlight when there is a search result
        if (this.searchValueActive) {
            util.addClassName(domValue, 'highlight-active');
        }
        else {
            util.removeClassName(domValue, 'highlight-active');
        }
        if (this.searchValue) {
            util.addClassName(domValue, 'highlight');
        }
        else {
            util.removeClassName(domValue, 'highlight');
        }

        // strip formatting from the contents of the editable div
        util.stripFormatting(domValue);
    }
};

/**
 * Update dom field:
 * - the text color of the field, depending on the text
 * - the height of the field, depending on the width
 * - background color in case it is empty
 * @private
 */
Node.prototype._updateDomField = function () {
    var domField = this.dom.field;
    if (domField) {
        // make backgound color lightgray when empty
        var isEmpty = (String(this.field) == '' && this.parent.type != 'array');
        if (isEmpty) {
            util.addClassName(domField, 'empty');
        }
        else {
            util.removeClassName(domField, 'empty');
        }

        // highlight when there is a search result
        if (this.searchFieldActive) {
            util.addClassName(domField, 'highlight-active');
        }
        else {
            util.removeClassName(domField, 'highlight-active');
        }
        if (this.searchField) {
            util.addClassName(domField, 'highlight');
        }
        else {
            util.removeClassName(domField, 'highlight');
        }

        // strip formatting from the contents of the editable div
        util.stripFormatting(domField);
    }
};

/**
 * Retrieve field from DOM
 * @param {boolean} [silent]  If true (default), no errors will be thrown in
 *                            case of invalid data
 * @private
 */
Node.prototype._getDomField = function(silent) {
    if (this.dom.field && this.fieldEditable) {
        this.fieldInnerText = util.getInnerText(this.dom.field);
    }

    if (this.fieldInnerText != undefined) {
        try {
            var field = this._unescapeHTML(this.fieldInnerText);

            if (field !== this.field) {
                var oldField = this.field;
                this.field = field;
                this.editor._onAction('editField', {
                    'node': this,
                    'oldValue': oldField,
                    'newValue': field,
                    'oldSelection': this.editor.selection,
                    'newSelection': this.editor.getSelection()
                });
            }
        }
        catch (err) {
            this.field = undefined;
            // TODO: sent an action here, with the new, invalid value?
            if (silent != true) {
                throw err;
            }
        }
    }
};

/**
 * Clear the dom of the node
 */
Node.prototype.clearDom = function() {
    // TODO: hide the node first?
    //this.hide();
    // TODO: recursively clear dom?

    this.dom = {};
};

/**
 * Get the HTML DOM TR element of the node.
 * The dom will be generated when not yet created
 * @return {Element} tr    HTML DOM TR Element
 */
Node.prototype.getDom = function() {
    var dom = this.dom;
    if (dom.tr) {
        return dom.tr;
    }

    // create row
    dom.tr = document.createElement('tr');
    dom.tr.node = this;

    if (this.editor.mode.edit) {
        // create draggable area
        var tdDrag = document.createElement('td');
        if (this.parent) {
            var domDrag = document.createElement('button');
            dom.drag = domDrag;
            domDrag.className = 'dragarea';
            domDrag.title = 'Drag to move this field (Alt+Shift+Arrows)';
            tdDrag.appendChild(domDrag);
        }
        dom.tr.appendChild(tdDrag);

        // create context menu
        var tdMenu = document.createElement('td');
        var menu = document.createElement('button');
        dom.menu = menu;
        menu.className = 'contextmenu';
        menu.title = 'Click to open the actions menu (Ctrl+M)';
        tdMenu.appendChild(dom.menu);
        dom.tr.appendChild(tdMenu);
    }

    // create tree and field
    var tdField = document.createElement('td');
    dom.tr.appendChild(tdField);
    dom.tree = this._createDomTree();
    tdField.appendChild(dom.tree);

    this.updateDom({'updateIndexes': true});

    return dom.tr;
};

/**
 * DragStart event, fired on mousedown on the dragarea at the left side of a Node
 * @param {Event} event
 * @private
 */
Node.prototype._onDragStart = function (event) {
    event = event || window.event;

    var node = this;
    if (!this.mousemove) {
        this.mousemove = util.addEventListener(document, 'mousemove',
            function (event) {
                node._onDrag(event);
            });
    }

    if (!this.mouseup) {
        this.mouseup = util.addEventListener(document, 'mouseup',
            function (event ) {
                node._onDragEnd(event);
            });
    }

    this.editor.highlighter.lock();
    this.drag = {
        'oldCursor': document.body.style.cursor,
        'startParent': this.parent,
        'startIndex': this.parent.childs.indexOf(this),
        'mouseX': util.getMouseX(event),
        'level': this.getLevel()
    };
    document.body.style.cursor = 'move';

    util.preventDefault(event);
};

/**
 * Drag event, fired when moving the mouse while dragging a Node
 * @param {Event} event
 * @private
 */
Node.prototype._onDrag = function (event) {
    // TODO: this method has grown too large. Split it in a number of methods
    event = event || window.event;
    var mouseY = util.getMouseY(event);
    var mouseX = util.getMouseX(event);

    var trThis, trPrev, trNext, trFirst, trLast, trRoot;
    var nodePrev, nodeNext;
    var topThis, topPrev, topFirst, heightThis, bottomNext, heightNext;
    var moved = false;

    // TODO: add an ESC option, which resets to the original position

    // move up/down
    trThis = this.dom.tr;
    topThis = util.getAbsoluteTop(trThis);
    heightThis = trThis.offsetHeight;
    if (mouseY < topThis) {
        // move up
        trPrev = trThis;
        do {
            trPrev = trPrev.previousSibling;
            nodePrev = Node.getNodeFromTarget(trPrev);
            topPrev = trPrev ? util.getAbsoluteTop(trPrev) : 0;
        }
        while (trPrev && mouseY < topPrev);

        if (nodePrev && !nodePrev.parent) {
            nodePrev = undefined;
        }

        if (!nodePrev) {
            // move to the first node
            trRoot = trThis.parentNode.firstChild;
            trPrev = trRoot ? trRoot.nextSibling : undefined;
            nodePrev = Node.getNodeFromTarget(trPrev);
            if (nodePrev == this) {
                nodePrev = undefined;
            }
        }

        if (nodePrev) {
            // check if mouseY is really inside the found node
            trPrev = nodePrev.dom.tr;
            topPrev = trPrev ? util.getAbsoluteTop(trPrev) : 0;
            if (mouseY > topPrev + heightThis) {
                nodePrev = undefined;
            }
        }

        if (nodePrev) {
            nodePrev.parent.moveBefore(this, nodePrev);
            moved = true;
        }
    }
    else {
        // move down
        trLast = (this.expanded && this.append) ? this.append.getDom() : this.dom.tr;
        trFirst = trLast ? trLast.nextSibling : undefined;
        if (trFirst) {
            topFirst = util.getAbsoluteTop(trFirst);
            trNext = trFirst;
            do {
                nodeNext = Node.getNodeFromTarget(trNext);
                if (trNext) {
                    bottomNext = trNext.nextSibling ?
                        util.getAbsoluteTop(trNext.nextSibling) : 0;
                    heightNext = trNext ? (bottomNext - topFirst) : 0;

                    if (nodeNext.parent.childs.length == 1 && nodeNext.parent.childs[0] == this) {
                        // We are about to remove the last child of this parent,
                        // which will make the parents appendNode visible.
                        topThis += 24 - 1;
                        // TODO: dangerous to suppose the height of the appendNode a constant of 24-1 px.
                    }
                }

                trNext = trNext.nextSibling;
            }
            while (trNext && mouseY > topThis + heightNext);

            if (nodeNext && nodeNext.parent) {
                // calculate the desired level
                var diffX = (mouseX - this.drag.mouseX);
                var diffLevel = Math.round(diffX / 24 / 2);
                var level = this.drag.level + diffLevel; // desired level
                var levelNext = nodeNext.getLevel();     // level to be

                // find the best fitting level (move upwards over the append nodes)
                trPrev = nodeNext.dom.tr.previousSibling;
                while (levelNext < level && trPrev) {
                    nodePrev = Node.getNodeFromTarget(trPrev);
                    if (nodePrev == this || nodePrev._isChildOf(this)) {
                        // neglect itself and its childs
                    }
                    else if (nodePrev instanceof AppendNode) {
                        var childs = nodePrev.parent.childs;
                        if (childs.length > 1 ||
                            (childs.length == 1 && childs[0] != this)) {
                            // non-visible append node of a list of childs
                            // consisting of not only this node (else the
                            // append node will change into a visible "empty"
                            // text when removing this node).
                            nodeNext = Node.getNodeFromTarget(trPrev);
                            levelNext = nodeNext.getLevel();
                        }
                        else {
                            break;
                        }
                    }
                    else {
                        break;
                    }

                    trPrev = trPrev.previousSibling;
                }

                // move the node when its position is changed
                if (trLast.nextSibling != nodeNext.dom.tr) {
                    nodeNext.parent.moveBefore(this, nodeNext);
                    moved = true;
                }
            }
        }
    }

    if (moved) {
        // update the dragging parameters when moved
        this.drag.mouseX = mouseX;
        this.drag.level = this.getLevel();
    }

    // auto scroll when hovering around the top of the editor
    this.editor.startAutoScroll(mouseY);

    util.preventDefault(event);
};

/**
 * Drag event, fired on mouseup after having dragged a node
 * @param {Event} event
 * @private
 */
Node.prototype._onDragEnd = function (event) {
    event = event || window.event;

    var params = {
        'node': this,
        'startParent': this.drag.startParent,
        'startIndex': this.drag.startIndex,
        'endParent': this.parent,
        'endIndex': this.parent.childs.indexOf(this)
    };
    if ((params.startParent != params.endParent) ||
        (params.startIndex != params.endIndex)) {
        // only register this action if the node is actually moved to another place
        this.editor._onAction('moveNode', params);
    }

    document.body.style.cursor = this.drag.oldCursor;
    this.editor.highlighter.unlock();
    delete this.drag;

    if (this.mousemove) {
        util.removeEventListener(document, 'mousemove', this.mousemove);
        delete this.mousemove;}
    if (this.mouseup) {
        util.removeEventListener(document, 'mouseup', this.mouseup);
        delete this.mouseup;
    }

    // Stop any running auto scroll
    this.editor.stopAutoScroll();

    util.preventDefault(event);
};

/**
 * Test if this node is a child of an other node
 * @param {Node} node
 * @return {boolean} isChild
 * @private
 */
Node.prototype._isChildOf = function (node) {
    var n = this.parent;
    while (n) {
        if (n == node) {
            return true;
        }
        n = n.parent;
    }

    return false;
};

/**
 * Create an editable field
 * @return {Element} domField
 * @private
 */
Node.prototype._createDomField = function () {
    return document.createElement('div');
};

/**
 * Set highlighting for this node and all its childs.
 * Only applied to the currently visible (expanded childs)
 * @param {boolean} highlight
 */
Node.prototype.setHighlight = function (highlight) {
    if (this.dom.tr) {
        this.dom.tr.className = (highlight ? 'highlight' : '');

        if (this.append) {
            this.append.setHighlight(highlight);
        }

        if (this.childs) {
            this.childs.forEach(function (child) {
                child.setHighlight(highlight);
            });
        }
    }
};

/**
 * Update the value of the node. Only primitive types are allowed, no Object
 * or Array is allowed.
 * @param {String | Number | Boolean | null} value
 */
Node.prototype.updateValue = function (value) {
    this.value = value;
    this.updateDom();
};

/**
 * Update the field of the node.
 * @param {String} field
 */
Node.prototype.updateField = function (field) {
    this.field = field;
    this.updateDom();
};

/**
 * Update the HTML DOM, optionally recursing through the childs
 * @param {Object} [options] Available parameters:
 *                          {boolean} [recurse]         If true, the
 *                          DOM of the childs will be updated recursively.
 *                          False by default.
 *                          {boolean} [updateIndexes]   If true, the childs
 *                          indexes of the node will be updated too. False by
 *                          default.
 */
Node.prototype.updateDom = function (options) {
    // update level indentation
    var domTree = this.dom.tree;
    if (domTree) {
        domTree.style.marginLeft = this.getLevel() * 24 + 'px';
    }

    // update field
    var domField = this.dom.field;
    if (domField) {
        if (this.fieldEditable == true) {
            // parent is an object
            domField.contentEditable = this.editor.mode.edit;
            domField.spellcheck = false;
            domField.className = 'field';
        }
        else {
            // parent is an array this is the root node
            domField.className = 'readonly';
        }

        var field;
        if (this.index != undefined) {
            field = this.index;
        }
        else if (this.field != undefined) {
            field = this.field;
        }
        else if (this._hasChilds()) {
            field = this.type;
        }
        else {
            field = '';
        }
        domField.innerHTML = this._escapeHTML(field);
    }

    // update value
    var domValue = this.dom.value;
    if (domValue) {
        var count = this.childs ? this.childs.length : 0;
        if (this.type == 'array') {
            domValue.innerHTML = '[' + count + ']';
        }
        else if (this.type == 'object') {
            domValue.innerHTML = '{' + count + '}';
        }
        else {
            domValue.innerHTML = this._escapeHTML(this.value);
        }
    }

    // update field and value
    this._updateDomField();
    this._updateDomValue();

    // update childs indexes
    if (options && options.updateIndexes == true) {
        // updateIndexes is true or undefined
        this._updateDomIndexes();
    }

    if (options && options.recurse == true) {
        // recurse is true or undefined. update childs recursively
        if (this.childs) {
            this.childs.forEach(function (child) {
                child.updateDom(options);
            });
        }
    }

    // update row with append button
    if (this.append) {
        this.append.updateDom();
    }
};

/**
 * Update the DOM of the childs of a node: update indexes and undefined field
 * names.
 * Only applicable when structure is an array or object
 * @private
 */
Node.prototype._updateDomIndexes = function () {
    var domValue = this.dom.value;
    var childs = this.childs;
    if (domValue && childs) {
        if (this.type == 'array') {
            childs.forEach(function (child, index) {
                child.index = index;
                var childField = child.dom.field;
                if (childField) {
                    childField.innerHTML = index;
                }
            });
        }
        else if (this.type == 'object') {
            childs.forEach(function (child) {
                if (child.index != undefined) {
                    delete child.index;

                    if (child.field == undefined) {
                        child.field = '';
                    }
                }
            });
        }
    }
};

/**
 * Create an editable value
 * @private
 */
Node.prototype._createDomValue = function () {
    var domValue;

    if (this.type == 'array') {
        domValue = document.createElement('div');
        domValue.className = 'readonly';
        domValue.innerHTML = '[...]';
    }
    else if (this.type == 'object') {
        domValue = document.createElement('div');
        domValue.className = 'readonly';
        domValue.innerHTML = '{...}';
    }
    else {
        if (!this.editor.mode.edit && util.isUrl(this.value)) {
            // create a link in case of read-only editor and value containing an url
            domValue = document.createElement('a');
            domValue.className = 'value';
            domValue.href = this.value;
            domValue.target = '_blank';
            domValue.innerHTML = this._escapeHTML(this.value);
        }
        else {
            // create and editable or read-only div
            domValue = document.createElement('div');
            domValue.contentEditable = !this.editor.mode.view;
            domValue.spellcheck = false;
            domValue.className = 'value';
            domValue.innerHTML = this._escapeHTML(this.value);
        }
    }

    return domValue;
};

/**
 * Create an expand/collapse button
 * @return {Element} expand
 * @private
 */
Node.prototype._createDomExpandButton = function () {
    // create expand button
    var expand = document.createElement('button');
    if (this._hasChilds()) {
        expand.className = this.expanded ? 'expanded' : 'collapsed';
        expand.title =
            'Click to expand/collapse this field (Ctrl+E). \n' +
                'Ctrl+Click to expand/collapse including all childs.';
    }
    else {
        expand.className = 'invisible';
        expand.title = '';
    }

    return expand;
};


/**
 * Create a DOM tree element, containing the expand/collapse button
 * @return {Element} domTree
 * @private
 */
Node.prototype._createDomTree = function () {
    var dom = this.dom;
    var domTree = document.createElement('table');
    var tbody = document.createElement('tbody');
    domTree.style.borderCollapse = 'collapse'; // TODO: put in css
    domTree.appendChild(tbody);
    var tr = document.createElement('tr');
    tbody.appendChild(tr);

    // create expand button
    var tdExpand = document.createElement('td');
    tdExpand.className = 'tree';
    tr.appendChild(tdExpand);
    dom.expand = this._createDomExpandButton();
    tdExpand.appendChild(dom.expand);
    dom.tdExpand = tdExpand;

    // create the field
    var tdField = document.createElement('td');
    tdField.className = 'tree';
    tr.appendChild(tdField);
    dom.field = this._createDomField();
    tdField.appendChild(dom.field);
    dom.tdField = tdField;

    // create a separator
    var tdSeparator = document.createElement('td');
    tdSeparator.className = 'tree';
    tr.appendChild(tdSeparator);
    if (this.type != 'object' && this.type != 'array') {
        tdSeparator.appendChild(document.createTextNode(':'));
        tdSeparator.className = 'separator';
    }
    dom.tdSeparator = tdSeparator;

    // create the value
    var tdValue = document.createElement('td');
    tdValue.className = 'tree';
    tr.appendChild(tdValue);
    dom.value = this._createDomValue();
    tdValue.appendChild(dom.value);
    dom.tdValue = tdValue;

    return domTree;
};

/**
 * Handle an event. The event is catched centrally by the editor
 * @param {Event} event
 */
Node.prototype.onEvent = function (event) {
    var type = event.type,
        target = event.target || event.srcElement,
        dom = this.dom,
        node = this,
        focusNode,
        expandable = this._hasChilds();

    // check if mouse is on menu or on dragarea.
    // If so, highlight current row and its childs
    if (target == dom.drag || target == dom.menu) {
        if (type == 'mouseover') {
            this.editor.highlighter.highlight(this);
        }
        else if (type == 'mouseout') {
            this.editor.highlighter.unhighlight();
        }
    }

    // drag events
    if (type == 'mousedown' && target == dom.drag) {
        this._onDragStart(event);
    }

    // context menu events
    if (type == 'click' && target == dom.menu) {
        var highlighter = node.editor.highlighter;
        highlighter.highlight(node);
        highlighter.lock();
        util.addClassName(dom.menu, 'selected');
        this.showContextMenu(dom.menu, function () {
            util.removeClassName(dom.menu, 'selected');
            highlighter.unlock();
            highlighter.unhighlight();
        });
    }

    // expand events
    if (type == 'click' && target == dom.expand) {
        if (expandable) {
            var recurse = event.ctrlKey; // with ctrl-key, expand/collapse all
            this._onExpand(recurse);
        }
    }

    // value events
    var domValue = dom.value;
    if (target == domValue) {
        //noinspection FallthroughInSwitchStatementJS
        switch (type) {
            case 'focus':
                focusNode = this;
                break;

            case 'blur':
            case 'change':
                this._getDomValue(true);
                this._updateDomValue();
                if (this.value) {
                    domValue.innerHTML = this._escapeHTML(this.value);
                }
                break;

            case 'input':
                this._getDomValue(true);
                this._updateDomValue();
                break;

            case 'keydown':
            case 'mousedown':
                this.editor.selection = this.editor.getSelection();
                break;

            case 'click':
                if (event.ctrlKey && this.editor.mode.edit) {
                    if (util.isUrl(this.value)) {
                        window.open(this.value, '_blank');
                    }
                }
                break;

            case 'keyup':
                this._getDomValue(true);
                this._updateDomValue();
                break;

            case 'cut':
            case 'paste':
                setTimeout(function () {
                    node._getDomValue(true);
                    node._updateDomValue();
                }, 1);
                break;
        }
    }

    // field events
    var domField = dom.field;
    if (target == domField) {
        switch (type) {
            case 'focus':
                focusNode = this;
                break;

            case 'blur':
            case 'change':
                this._getDomField(true);
                this._updateDomField();
                if (this.field) {
                    domField.innerHTML = this._escapeHTML(this.field);
                }
                break;

            case 'input':
                this._getDomField(true);
                this._updateDomField();
                break;

            case 'keydown':
            case 'mousedown':
                this.editor.selection = this.editor.getSelection();
                break;

            case 'keyup':
                this._getDomField(true);
                this._updateDomField();
                break;

            case 'cut':
            case 'paste':
                setTimeout(function () {
                    node._getDomField(true);
                    node._updateDomField();
                }, 1);
                break;
        }
    }

    // focus
    // when clicked in whitespace left or right from the field or value, set focus
    var domTree = dom.tree;
    if (target == domTree.parentNode) {
        switch (type) {
            case 'click':
                var left = (event.offsetX != undefined) ?
                    (event.offsetX < (this.getLevel() + 1) * 24) :
                    (util.getMouseX(event) < util.getAbsoluteLeft(dom.tdSeparator));// for FF
                if (left || expandable) {
                    // node is expandable when it is an object or array
                    if (domField) {
                        util.setEndOfContentEditable(domField);
                        domField.focus();
                    }
                }
                else {
                    if (domValue) {
                        util.setEndOfContentEditable(domValue);
                        domValue.focus();
                    }
                }
                break;
        }
    }
    if ((target == dom.tdExpand && !expandable) || target == dom.tdField ||
        target == dom.tdSeparator) {
        switch (type) {
            case 'click':
                if (domField) {
                    util.setEndOfContentEditable(domField);
                    domField.focus();
                }
                break;
        }
    }

    if (type == 'keydown') {
        this.onKeyDown(event);
    }
};

/**
 * Key down event handler
 * @param {Event} event
 */
Node.prototype.onKeyDown = function (event) {
    var keynum = event.which || event.keyCode;
    var target = event.target || event.srcElement;
    var ctrlKey = event.ctrlKey;
    var shiftKey = event.shiftKey;
    var altKey = event.altKey;
    var handled = false;
    var prevNode, nextNode, nextDom, nextDom2;

    // util.log(ctrlKey, keynum, event.charCode); // TODO: cleanup
    if (keynum == 13) { // Enter
        if (target == this.dom.value) {
            if (!this.editor.mode.edit || event.ctrlKey) {
                if (util.isUrl(this.value)) {
                    window.open(this.value, '_blank');
                    handled = true;
                }
            }
        }
        else if (target == this.dom.expand) {
            var expandable = this._hasChilds();
            if (expandable) {
                var recurse = event.ctrlKey; // with ctrl-key, expand/collapse all
                this._onExpand(recurse);
                target.focus();
                handled = true;
            }
        }
    }
    else if (keynum == 68) {  // D
        if (ctrlKey) {   // Ctrl+D
            this._onDuplicate();
            handled = true;
        }
    }
    else if (keynum == 69) { // E
        if (ctrlKey) {       // Ctrl+E and Ctrl+Shift+E
            this._onExpand(shiftKey);  // recurse = shiftKey
            target.focus(); // TODO: should restore focus in case of recursing expand (which takes DOM offline)
            handled = true;
        }
    }
    else if (keynum == 77) { // M
        if (ctrlKey) { // Ctrl+M
            this.showContextMenu(target);
            handled = true;
        }
    }
    else if (keynum == 46) { // Del
        if (ctrlKey) {       // Ctrl+Del
            this._onRemove();
            handled = true;
        }
    }
    else if (keynum == 45) { // Ins
        if (ctrlKey && !shiftKey) {       // Ctrl+Ins
            this._onInsertBefore();
            handled = true;
        }
        else if (ctrlKey && shiftKey) {   // Ctrl+Shift+Ins
            this._onInsertAfter();
            handled = true;
        }
    }
    else if (keynum == 35) { // End
        if (altKey) { // Alt+End
            // find the last node
            var lastNode = this._lastNode();
            if (lastNode) {
                lastNode.focus(Node.focusElement || this._getElementName(target));
            }
            handled = true;
        }
    }
    else if (keynum == 36) { // Home
        if (altKey) { // Alt+Home
            // find the first node
            var firstNode = this._firstNode();
            if (firstNode) {
                firstNode.focus(Node.focusElement || this._getElementName(target));
            }
            handled = true;
        }
    }
    else if (keynum == 37) {        // Arrow Left
        if (altKey && !shiftKey) {  // Alt + Arrow Left
            // move to left element
            var prevElement = this._previousElement(target);
            if (prevElement) {
                this.focus(this._getElementName(prevElement));
            }
            handled = true;
        }
        else if (altKey && shiftKey) { // Alt + Shift Arrow left
            if (this.expanded) {
                var appendDom = this.getAppend();
                nextDom = appendDom ? appendDom.nextSibling : undefined;
            }
            else {
                var dom = this.getDom();
                nextDom = dom.nextSibling;
            }
            if (nextDom) {
                nextNode = Node.getNodeFromTarget(nextDom);
                nextDom2 = nextDom.nextSibling;
                nextNode2 = Node.getNodeFromTarget(nextDom2);
                if (nextNode && nextNode instanceof AppendNode &&
                        !(this.parent.childs.length == 1) &&
                        nextNode2 && nextNode2.parent) {
                    nextNode2.parent.moveBefore(this, nextNode2);
                    this.focus(Node.focusElement || this._getElementName(target));
                }
            }
        }
    }
    else if (keynum == 38) {        // Arrow Up
        if (altKey && !shiftKey) {  // Alt + Arrow Up
            // find the previous node
            prevNode = this._previousNode();
            if (prevNode) {
                prevNode.focus(Node.focusElement || this._getElementName(target));
            }
            handled = true;
        }
        else if (altKey && shiftKey) { // Alt + Shift + Arrow Up
            // find the previous node
            prevNode = this._previousNode();
            if (prevNode && prevNode.parent) {
                prevNode.parent.moveBefore(this, prevNode);
                this.focus(Node.focusElement || this._getElementName(target));
            }
            handled = true;
        }
    }
    else if (keynum == 39) {        // Arrow Right
        if (altKey && !shiftKey) {  // Alt + Arrow Right
            // move to right element
            var nextElement = this._nextElement(target);
            if (nextElement) {
                this.focus(this._getElementName(nextElement));
            }
            handled = true;
        }
        else if (altKey && shiftKey) { // Alt + Shift Arrow Right
            dom = this.getDom();
            var prevDom = dom.previousSibling;
            if (prevDom) {
                prevNode = Node.getNodeFromTarget(prevDom);
                if (prevNode && prevNode.parent &&
                        (prevNode instanceof AppendNode)
                        && !prevNode.isVisible()) {
                    prevNode.parent.moveBefore(this, prevNode);
                    this.focus(Node.focusElement || this._getElementName(target));
                }
            }
        }
    }
    else if (keynum == 40) {        // Arrow Down
        if (altKey && !shiftKey) {  // Alt + Arrow Down
            // find the next node
            nextNode = this._nextNode();
            if (nextNode) {
                nextNode.focus(Node.focusElement || this._getElementName(target));
            }
            handled = true;
        }
        else if (altKey && shiftKey) { // Alt + Shift + Arrow Down
            // find the 2nd next node and move before that one
            if (this.expanded) {
                nextNode = this.append ? this.append._nextNode() : undefined;
            }
            else {
                nextNode = this._nextNode();
            }
            nextDom = nextNode ? nextNode.getDom() : undefined;
            if (this.parent.childs.length == 1) {
                nextDom2 = nextDom;
            }
            else {
                nextDom2 = nextDom ? nextDom.nextSibling : undefined;
            }
            var nextNode2 = Node.getNodeFromTarget(nextDom2);
            if (nextNode2 && nextNode2.parent) {
                nextNode2.parent.moveBefore(this, nextNode2);
                this.focus(Node.focusElement || this._getElementName(target));
            }
            handled = true;
        }
    }

    if (handled) {
        util.preventDefault(event);
        util.stopPropagation(event);
    }
};

/**
 * Handle the expand event, when clicked on the expand button
 * @param {boolean} recurse   If true, child nodes will be expanded too
 * @private
 */
Node.prototype._onExpand = function (recurse) {
    if (recurse) {
        // Take the table offline
        var table = this.dom.tr.parentNode; // TODO: not nice to access the main table like this
        var frame = table.parentNode;
        var scrollTop = frame.scrollTop;
        frame.removeChild(table);
    }

    if (this.expanded) {
        this.collapse(recurse);
    }
    else {
        this.expand(recurse);
    }

    if (recurse) {
        // Put the table online again
        frame.appendChild(table);
        frame.scrollTop = scrollTop;
    }
};

/**
 * Remove this node
 * @private
 */
Node.prototype._onRemove = function() {
    this.editor.highlighter.unhighlight();
    var childs = this.parent.childs;
    var index = childs.indexOf(this);

    // adjust the focus
    var oldSelection = this.editor.getSelection();
    if (childs[index + 1]) {
        childs[index + 1].focus();
    }
    else if (childs[index - 1]) {
        childs[index - 1].focus();
    }
    else {
        this.parent.focus();
    }
    var newSelection = this.editor.getSelection();

    // remove the node
    this.parent._remove(this);

    // store history action
    this.editor._onAction('removeNode', {
        'node': this,
        'parent': this.parent,
        'index': index,
        'oldSelection': oldSelection,
        'newSelection': newSelection
    });
};

/**
 * Duplicate this node
 * @private
 */
Node.prototype._onDuplicate = function() {
    var oldSelection = this.editor.getSelection();
    var clone = this.parent._duplicate(this);
    clone.focus();
    var newSelection = this.editor.getSelection();

    this.editor._onAction('duplicateNode', {
        'node': this,
        'clone': clone,
        'parent': this.parent,
        'oldSelection': oldSelection,
        'newSelection': newSelection
    });
};

/**
 * Handle insert before event
 * @param {String} [field]
 * @param {*} [value]
 * @param {String} [type]   Can be 'auto', 'array', 'object', or 'string'
 * @private
 */
Node.prototype._onInsertBefore = function (field, value, type) {
    var oldSelection = this.editor.getSelection();

    var newNode = new Node(this.editor, {
        'field': (field != undefined) ? field : '',
        'value': (value != undefined) ? value : '',
        'type': type
    });
    newNode.expand(true);
    this.parent.insertBefore(newNode, this);
    this.editor.highlighter.unhighlight();
    newNode.focus('field');
    var newSelection = this.editor.getSelection();

    this.editor._onAction('insertBeforeNode', {
        'node': newNode,
        'beforeNode': this,
        'parent': this.parent,
        'oldSelection': oldSelection,
        'newSelection': newSelection
    });
};

/**
 * Handle insert after event
 * @param {String} [field]
 * @param {*} [value]
 * @param {String} [type]   Can be 'auto', 'array', 'object', or 'string'
 * @private
 */
Node.prototype._onInsertAfter = function (field, value, type) {
    var oldSelection = this.editor.getSelection();

    var newNode = new Node(this.editor, {
        'field': (field != undefined) ? field : '',
        'value': (value != undefined) ? value : '',
        'type': type
    });
    newNode.expand(true);
    this.parent.insertAfter(newNode, this);
    this.editor.highlighter.unhighlight();
    newNode.focus('field');
    var newSelection = this.editor.getSelection();

    this.editor._onAction('insertAfterNode', {
        'node': newNode,
        'afterNode': this,
        'parent': this.parent,
        'oldSelection': oldSelection,
        'newSelection': newSelection
    });
};

/**
 * Handle append event
 * @param {String} [field]
 * @param {*} [value]
 * @param {String} [type]   Can be 'auto', 'array', 'object', or 'string'
 * @private
 */
Node.prototype._onAppend = function (field, value, type) {
    var oldSelection = this.editor.getSelection();

    var newNode = new Node(this.editor, {
        'field': (field != undefined) ? field : '',
        'value': (value != undefined) ? value : '',
        'type': type
    });
    newNode.expand(true);
    this.parent.appendChild(newNode);
    this.editor.highlighter.unhighlight();
    newNode.focus('field');
    var newSelection = this.editor.getSelection();

    this.editor._onAction('appendNode', {
        'node': newNode,
        'parent': this.parent,
        'oldSelection': oldSelection,
        'newSelection': newSelection
    });
};

/**
 * Change the type of the node's value
 * @param {String} newType
 * @private
 */
Node.prototype._onChangeType = function (newType) {
    var oldType = this.type;
    if (newType != oldType) {
        var oldSelection = this.editor.getSelection();
        this.changeType(newType);
        var newSelection = this.editor.getSelection();

        this.editor._onAction('changeType', {
            'node': this,
            'oldType': oldType,
            'newType': newType,
            'oldSelection': oldSelection,
            'newSelection': newSelection
        });
    }
};

/**
 * Sort the childs of the node. Only applicable when the node has type 'object'
 * or 'array'.
 * @param {String} direction   Sorting direction. Available values: "asc", "desc"
 * @private
 */
Node.prototype._onSort = function (direction) {
    if (this._hasChilds()) {
        var order = (direction == 'desc') ? -1 : 1;
        var prop = (this.type == 'array') ? 'value': 'field';
        this.hideChilds();

        var oldChilds = this.childs;
        var oldSort = this.sort;

        // copy the array (the old one will be kept for an undo action
        this.childs = this.childs.concat();

        // sort the arrays
        this.childs.sort(function (a, b) {
            if (a[prop] > b[prop]) return order;
            if (a[prop] < b[prop]) return -order;
            return 0;
        });
        this.sort = (order == 1) ? 'asc' : 'desc';

        this.editor._onAction('sort', {
            'node': this,
            'oldChilds': oldChilds,
            'oldSort': oldSort,
            'newChilds': this.childs,
            'newSort': this.sort
        });

        this.showChilds();
    }
};

/**
 * Create a table row with an append button.
 * @return {HTMLElement | undefined} buttonAppend or undefined when inapplicable
 */
Node.prototype.getAppend = function () {
    if (!this.append) {
        this.append = new AppendNode(this.editor);
        this.append.setParent(this);
    }
    return this.append.getDom();
};

/**
 * Find the node from an event target
 * @param {Node} target
 * @return {Node | undefined} node  or undefined when not found
 * @static
 */
Node.getNodeFromTarget = function (target) {
    while (target) {
        if (target.node) {
            return target.node;
        }
        target = target.parentNode;
    }

    return undefined;
};

/**
 * Get the previously rendered node
 * @return {Node | null} previousNode
 * @private
 */
Node.prototype._previousNode = function () {
    var prevNode = null;
    var dom = this.getDom();
    if (dom && dom.parentNode) {
        // find the previous field
        var prevDom = dom;
        do {
            prevDom = prevDom.previousSibling;
            prevNode = Node.getNodeFromTarget(prevDom);
        }
        while (prevDom && (prevNode instanceof AppendNode && !prevNode.isVisible()));
    }
    return prevNode;
};

/**
 * Get the next rendered node
 * @return {Node | null} nextNode
 * @private
 */
Node.prototype._nextNode = function () {
    var nextNode = null;
    var dom = this.getDom();
    if (dom && dom.parentNode) {
        // find the previous field
        var nextDom = dom;
        do {
            nextDom = nextDom.nextSibling;
            nextNode = Node.getNodeFromTarget(nextDom);
        }
        while (nextDom && (nextNode instanceof AppendNode && !nextNode.isVisible()));
    }

    return nextNode;
};

/**
 * Get the first rendered node
 * @return {Node | null} firstNode
 * @private
 */
Node.prototype._firstNode = function () {
    var firstNode = null;
    var dom = this.getDom();
    if (dom && dom.parentNode) {
        var firstDom = dom.parentNode.firstChild;
        firstNode = Node.getNodeFromTarget(firstDom);
    }

    return firstNode;
};

/**
 * Get the last rendered node
 * @return {Node | null} lastNode
 * @private
 */
Node.prototype._lastNode = function () {
    var lastNode = null;
    var dom = this.getDom();
    if (dom && dom.parentNode) {
        var lastDom = dom.parentNode.lastChild;
        lastNode =  Node.getNodeFromTarget(lastDom);
        while (lastDom && (lastNode instanceof AppendNode && !lastNode.isVisible())) {
            lastDom = lastDom.previousSibling;
            lastNode =  Node.getNodeFromTarget(lastDom);
        }
    }
    return lastNode;
};

/**
 * Get the next element which can have focus.
 * @param {Element} elem
 * @return {Element | null} nextElem
 * @private
 */
Node.prototype._previousElement = function (elem) {
    var dom = this.dom;
    // noinspection FallthroughInSwitchStatementJS
    switch (elem) {
        case dom.value:
            if (this.fieldEditable) {
                return dom.field;
            }
        // intentional fall through
        case dom.field:
            if (this._hasChilds()) {
                return dom.expand;
            }
        // intentional fall through
        case dom.expand:
            return dom.menu;
        case dom.menu:
            if (dom.drag) {
                return dom.drag;
            }
        // intentional fall through
        default:
            return null;
    }
};

/**
 * Get the next element which can have focus.
 * @param {Element} elem
 * @return {Element | null} nextElem
 * @private
 */
Node.prototype._nextElement = function (elem) {
    var dom = this.dom;
    // noinspection FallthroughInSwitchStatementJS
    switch (elem) {
        case dom.drag:
            return dom.menu;
        case dom.menu:
            if (this._hasChilds()) {
                return dom.expand;
            }
        // intentional fall through
        case dom.expand:
            if (this.fieldEditable) {
                return dom.field;
            }
        // intentional fall through
        case dom.field:
            if (!this._hasChilds()) {
                return dom.value;
            }
        default:
            return null;
    }
};

/**
 * Get the dom name of given element. returns null if not found.
 * For example when element == dom.field, "field" is returned.
 * @param {Element} element
 * @return {String | null} elementName  Available elements with name: 'drag',
 *                                      'menu', 'expand', 'field', 'value'
 * @private
 */
Node.prototype._getElementName = function (element) {
    var dom = this.dom;
    for (var name in dom) {
        if (dom.hasOwnProperty(name)) {
            if (dom[name] == element) {
                return name;
            }
        }
    }
    return null;
};

/**
 * Test if this node has childs. This is the case when the node is an object
 * or array.
 * @return {boolean} hasChilds
 * @private
 */
Node.prototype._hasChilds = function () {
    return this.type == 'array' || this.type == 'object';
};

// titles with explanation for the different types
Node.TYPE_TITLES = {
    'auto': 'Field type "auto". ' +
        'The field type is automatically determined from the value ' +
        'and can be a string, number, boolean, or null.',
    'object': 'Field type "object". ' +
        'An object contains an unordered set of key/value pairs.',
    'array': 'Field type "array". ' +
        'An array contains an ordered collection of values.',
    'string': 'Field type "string". ' +
        'Field type is not determined from the value, ' +
        'but always returned as string.'
};

/**
 * Show a contextmenu for this node
 * @param {HTMLElement} anchor   Anchor element to attache the context menu to.
 * @param {function} [onClose]   Callback method called when the context menu
 *                               is being closed.
 */
Node.prototype.showContextMenu = function (anchor, onClose) {
    var node = this;
    var titles = Node.TYPE_TITLES;
    var items = [];

    items.push({
        'text': 'Type',
        'title': 'Change the type of this field',
        'className': 'type-' + this.type,
        'submenu': [
            {
                'text': 'Auto',
                'className': 'type-auto' +
                    (this.type == 'auto' ? ' selected' : ''),
                'title': titles.auto,
                'click': function () {
                    node._onChangeType('auto');
                }
            },
            {
                'text': 'Array',
                'className': 'type-array' +
                    (this.type == 'array' ? ' selected' : ''),
                'title': titles.array,
                'click': function () {
                    node._onChangeType('array');
                }
            },
            {
                'text': 'Object',
                'className': 'type-object' +
                    (this.type == 'object' ? ' selected' : ''),
                'title': titles.object,
                'click': function () {
                    node._onChangeType('object');
                }
            },
            {
                'text': 'String',
                'className': 'type-string' +
                    (this.type == 'string' ? ' selected' : ''),
                'title': titles.string,
                'click': function () {
                    node._onChangeType('string');
                }
            }
        ]
    });

    if (this._hasChilds()) {
        var direction = ((this.sort == 'asc') ? 'desc': 'asc');
        items.push({
            'text': 'Sort',
            'title': 'Sort the childs of this ' + this.type,
            'className': 'sort-' + direction,
            'click': function () {
                node._onSort(direction);
            },
            'submenu': [
                {
                    'text': 'Ascending',
                    'className': 'sort-asc',
                    'title': 'Sort the childs of this ' + this.type + ' in ascending order',
                    'click': function () {
                        node._onSort('asc');
                    }
                },
                {
                    'text': 'Descending',
                    'className': 'sort-desc',
                    'title': 'Sort the childs of this ' + this.type +' in descending order',
                    'click': function () {
                        node._onSort('desc');
                    }
                }
            ]
        });
    }

    if (this.parent && this.parent._hasChilds()) {
        // create a separator
        items.push({
            'type': 'separator'
        });

        // create append button (for last child node only)
        var childs = node.parent.childs;
        if (node == childs[childs.length - 1]) {
            items.push({
                'text': 'Append',
                'title': 'Append a new field with type \'auto\' after this field (Ctrl+Shift+Ins)',
                'submenuTitle': 'Select the type of the field to be appended',
                'className': 'append',
                'click': function () {
                    node._onAppend('', '', 'auto');
                },
                'submenu': [
                    {
                        'text': 'Auto',
                        'className': 'type-auto',
                        'title': titles.auto,
                        'click': function () {
                            node._onAppend('', '', 'auto');
                        }
                    },
                    {
                        'text': 'Array',
                        'className': 'type-array',
                        'title': titles.array,
                        'click': function () {
                            node._onAppend('', []);
                        }
                    },
                    {
                        'text': 'Object',
                        'className': 'type-object',
                        'title': titles.object,
                        'click': function () {
                            node._onAppend('', {});
                        }
                    },
                    {
                        'text': 'String',
                        'className': 'type-string',
                        'title': titles.string,
                        'click': function () {
                            node._onAppend('', '', 'string');
                        }
                    }
                ]
            });
        }

        // create insert button
        items.push({
            'text': 'Insert',
            'title': 'Insert a new field with type \'auto\' before this field (Ctrl+Ins)',
            'submenuTitle': 'Select the type of the field to be inserted',
            'className': 'insert',
            'click': function () {
                node._onInsertBefore('', '', 'auto');
            },
            'submenu': [
                {
                    'text': 'Auto',
                    'className': 'type-auto',
                    'title': titles.auto,
                    'click': function () {
                        node._onInsertBefore('', '', 'auto');
                    }
                },
                {
                    'text': 'Array',
                    'className': 'type-array',
                    'title': titles.array,
                    'click': function () {
                        node._onInsertBefore('', []);
                    }
                },
                {
                    'text': 'Object',
                    'className': 'type-object',
                    'title': titles.object,
                    'click': function () {
                        node._onInsertBefore('', {});
                    }
                },
                {
                    'text': 'String',
                    'className': 'type-string',
                    'title': titles.string,
                    'click': function () {
                        node._onInsertBefore('', '', 'string');
                    }
                }
            ]
        });

        // create duplicate button
        items.push({
            'text': 'Duplicate',
            'title': 'Duplicate this field (Ctrl+D)',
            'className': 'duplicate',
            'click': function () {
                node._onDuplicate();
            }
        });

        // create remove button
        items.push({
            'text': 'Remove',
            'title': 'Remove this field (Ctrl+Del)',
            'className': 'remove',
            'click': function () {
                node._onRemove();
            }
        });
    }

    var menu = new ContextMenu(items, {close: onClose});
    menu.show(anchor);
};

/**
 * get the type of a value
 * @param {*} value
 * @return {String} type   Can be 'object', 'array', 'string', 'auto'
 * @private
 */
Node.prototype._getType = function(value) {
    if (value instanceof Array) {
        return 'array';
    }
    if (value instanceof Object) {
        return 'object';
    }
    if (typeof(value) == 'string' && typeof(this._stringCast(value)) != 'string') {
        return 'string';
    }

    return 'auto';
};

/**
 * cast contents of a string to the correct type. This can be a string,
 * a number, a boolean, etc
 * @param {String} str
 * @return {*} castedStr
 * @private
 */
Node.prototype._stringCast = function(str) {
    var lower = str.toLowerCase(),
        num = Number(str),          // will nicely fail with '123ab'
        numFloat = parseFloat(str); // will nicely fail with '  '

    if (str == '') {
        return '';
    }
    else if (lower == 'null') {
        return null;
    }
    else if (lower == 'true') {
        return true;
    }
    else if (lower == 'false') {
        return false;
    }
    else if (!isNaN(num) && !isNaN(numFloat)) {
        return num;
    }
    else {
        return str;
    }
};

/**
 * escape a text, such that it can be displayed safely in an HTML element
 * @param {String} text
 * @return {String} escapedText
 * @private
 */
Node.prototype._escapeHTML = function (text) {
    var htmlEscaped = String(text)
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/  /g, ' &nbsp;') // replace double space with an nbsp and space
        .replace(/^ /, '&nbsp;')   // space at start
        .replace(/ $/, '&nbsp;');  // space at end

    var json = JSON.stringify(htmlEscaped);
    return json.substring(1, json.length - 1);
};

/**
 * unescape a string.
 * @param {String} escapedText
 * @return {String} text
 * @private
 */
Node.prototype._unescapeHTML = function (escapedText) {
    var json = '"' + this._escapeJSON(escapedText) + '"';
    var htmlEscaped = util.parse(json);
    return htmlEscaped
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ');
};

/**
 * escape a text to make it a valid JSON string. The method will:
 *   - replace unescaped double quotes with '\"'
 *   - replace unescaped backslash with '\\'
 *   - replace returns with '\n'
 * @param {String} text
 * @return {String} escapedText
 * @private
 */
Node.prototype._escapeJSON = function (text) {
    // TODO: replace with some smart regex (only when a new solution is faster!)
    var escaped = '';
    var i = 0, iMax = text.length;
    while (i < iMax) {
        var c = text.charAt(i);
        if (c == '\n') {
            escaped += '\\n';
        }
        else if (c == '\\') {
            escaped += c;
            i++;

            c = text.charAt(i);
            if ('"\\/bfnrtu'.indexOf(c) == -1) {
                escaped += '\\';  // no valid escape character
            }
            escaped += c;
        }
        else if (c == '"') {
            escaped += '\\"';
        }
        else {
            escaped += c;
        }
        i++;
    }

    return escaped;
};

/**
 * @constructor AppendNode
 * @extends Node
 * @param {TreeEditor} editor
 * Create a new AppendNode. This is a special node which is created at the
 * end of the list with childs for an object or array
 */
function AppendNode (editor) {
    /** @type {TreeEditor} */
    this.editor = editor;
    this.dom = {};
}

AppendNode.prototype = new Node();

/**
 * Return a table row with an append button.
 * @return {Element} dom   TR element
 */
AppendNode.prototype.getDom = function () {
    // TODO: implement a new solution for the append node
    var dom = this.dom;

    if (dom.tr) {
        return dom.tr;
    }

    // a row for the append button
    var trAppend = document.createElement('tr');
    trAppend.node = this;
    dom.tr = trAppend;

    // TODO: consistent naming

    if (this.editor.mode.edit) {
        // a cell for the dragarea column
        dom.tdDrag = document.createElement('td');

        // create context menu
        var tdMenu = document.createElement('td');
        dom.tdMenu = tdMenu;
        var menu = document.createElement('button');
        menu.className = 'contextmenu';
        menu.title = 'Click to open the actions menu (Ctrl+M)';
        dom.menu = menu;
        tdMenu.appendChild(dom.menu);
    }

    // a cell for the contents (showing text 'empty')
    var tdAppend = document.createElement('td');
    var domText = document.createElement('div');
    domText.innerHTML = '(empty)';
    domText.className = 'readonly';
    tdAppend.appendChild(domText);
    dom.td = tdAppend;
    dom.text = domText;

    this.updateDom();

    return trAppend;
};

/**
 * Update the HTML dom of the Node
 */
AppendNode.prototype.updateDom = function () {
    var dom = this.dom;
    var tdAppend = dom.td;
    if (tdAppend) {
        tdAppend.style.paddingLeft = (this.getLevel() * 24 + 26) + 'px';
        // TODO: not so nice hard coded offset
    }

    var domText = dom.text;
    if (domText) {
        domText.innerHTML = '(empty ' + this.parent.type + ')';
    }

    // attach or detach the contents of the append node:
    // hide when the parent has childs, show when the parent has no childs
    var trAppend = dom.tr;
    if (!this.isVisible()) {
        if (dom.tr.firstChild) {
            if (dom.tdDrag) {
                trAppend.removeChild(dom.tdDrag);
            }
            if (dom.tdMenu) {
                trAppend.removeChild(dom.tdMenu);
            }
            trAppend.removeChild(tdAppend);
        }
    }
    else {
        if (!dom.tr.firstChild) {
            if (dom.tdDrag) {
                trAppend.appendChild(dom.tdDrag);
            }
            if (dom.tdMenu) {
                trAppend.appendChild(dom.tdMenu);
            }
            trAppend.appendChild(tdAppend);
        }
    }
};

/**
 * Check whether the AppendNode is currently visible.
 * the AppendNode is visible when its parent has no childs (i.e. is empty).
 * @return {boolean} isVisible
 */
AppendNode.prototype.isVisible = function () {
    return (this.parent.childs.length == 0);
};

/**
 * Show a contextmenu for this node
 * @param {HTMLElement} anchor   The element to attach the menu to.
 * @param {function} [onClose]   Callback method called when the context menu
 *                               is being closed.
 */
AppendNode.prototype.showContextMenu = function (anchor, onClose) {
    var node = this;
    var titles = Node.TYPE_TITLES;
    var items = [
        // create append button
        {
            'text': 'Append',
            'title': 'Append a new field with type \'auto\' (Ctrl+Shift+Ins)',
            'submenuTitle': 'Select the type of the field to be appended',
            'className': 'insert',
            'click': function () {
                node._onAppend('', '', 'auto');
            },
            'submenu': [
                {
                    'text': 'Auto',
                    'className': 'type-auto',
                    'title': titles.auto,
                    'click': function () {
                        node._onAppend('', '', 'auto');
                    }
                },
                {
                    'text': 'Array',
                    'className': 'type-array',
                    'title': titles.array,
                    'click': function () {
                        node._onAppend('', []);
                    }
                },
                {
                    'text': 'Object',
                    'className': 'type-object',
                    'title': titles.object,
                    'click': function () {
                        node._onAppend('', {});
                    }
                },
                {
                    'text': 'String',
                    'className': 'type-string',
                    'title': titles.string,
                    'click': function () {
                        node._onAppend('', '', 'string');
                    }
                }
            ]
        }
    ];

    var menu = new ContextMenu(items, {close: onClose});
    menu.show(anchor);
};

/**
 * Handle an event. The event is catched centrally by the editor
 * @param {Event} event
 */
AppendNode.prototype.onEvent = function (event) {
    var type = event.type;
    var target = event.target || event.srcElement;
    var dom = this.dom;

    // highlight the append nodes parent
    var menu = dom.menu;
    if (target == menu) {
        if (type == 'mouseover') {
            this.editor.highlighter.highlight(this.parent);
        }
        else if (type == 'mouseout') {
            this.editor.highlighter.unhighlight();
        }
    }

    // context menu events
    if (type == 'click' && target == dom.menu) {
        var highlighter = this.editor.highlighter;
        highlighter.highlight(this.parent);
        highlighter.lock();
        util.addClassName(dom.menu, 'selected');
        this.showContextMenu(dom.menu, function () {
            util.removeClassName(dom.menu, 'selected');
            highlighter.unlock();
            highlighter.unhighlight();
        });
    }

    if (type == 'keydown') {
        this.onKeyDown(event);
    }
};

/**
 * A context menu
 * @param {Object[]} items    Array containing the menu structure
 *                            TODO: describe structure
 * @param {Object} [options]  Object with options. Available options:
 *                            {function} close    Callback called when the
 *                                                context menu is being closed.
 * @constructor
 */
function ContextMenu (items, options) {
    this.dom = {};

    var me = this;
    var dom = this.dom;
    this.anchor = undefined;
    this.items = items;
    this.eventListeners = {};
    this.selection = undefined; // holds the selection before the menu was opened
    this.visibleSubmenu = undefined;
    this.onClose = options ? options.close : undefined;

    // create a container element
    var menu = document.createElement('div');
    menu.className = 'jsoneditor-contextmenu';
    dom.menu = menu;

    // create a list to hold the menu items
    var list = document.createElement('ul');
    list.className = 'menu';
    menu.appendChild(list);
    dom.list = list;
    dom.items = []; // list with all buttons

    // create a (non-visible) button to set the focus to the menu
    var focusButton = document.createElement('button');
    dom.focusButton = focusButton;
    var li = document.createElement('li');
    li.style.overflow = 'hidden';
    li.style.height = '0';
    li.appendChild(focusButton);
    list.appendChild(li);

    function createMenuItems (list, domItems, items) {
        items.forEach(function (item) {
            if (item.type == 'separator') {
                // create a separator
                var separator = document.createElement('div');
                separator.className = 'separator';
                li = document.createElement('li');
                li.appendChild(separator);
                list.appendChild(li);
            }
            else {
                var domItem = {};

                // create a menu item
                var li = document.createElement('li');
                list.appendChild(li);

                // create a button in the menu item
                var button = document.createElement('button');
                button.className = item.className;
                domItem.button = button;
                if (item.title) {
                    button.title = item.title;
                }
                if (item.click) {
                    button.onclick = function () {
                        me.hide();
                        item.click();
                    };
                }
                li.appendChild(button);

                // create the contents of the button
                if (item.submenu) {
                    // add the icon to the button
                    var divIcon = document.createElement('div');
                    divIcon.className = 'icon';
                    button.appendChild(divIcon);
                    button.appendChild(document.createTextNode(item.text));

                    var buttonSubmenu;
                    if (item.click) {
                        // submenu and a button with a click handler
                        button.className += ' default';

                        var buttonExpand = document.createElement('button');
                        domItem.buttonExpand = buttonExpand;
                        buttonExpand.className = 'expand';
                        buttonExpand.innerHTML = '<div class="expand"></div>';
                        li.appendChild(buttonExpand);
                        if (item.submenuTitle) {
                            buttonExpand.title = item.submenuTitle;
                        }

                        buttonSubmenu = buttonExpand;
                    }
                    else {
                        // submenu and a button without a click handler
                        var divExpand = document.createElement('div');
                        divExpand.className = 'expand';
                        button.appendChild(divExpand);

                        buttonSubmenu = button;
                    }

                    // attach a handler to expand/collapse the submenu
                    buttonSubmenu.onclick = function () {
                        me._onExpandItem(domItem);
                        buttonSubmenu.focus();
                    };

                    // create the submenu
                    var domSubItems = [];
                    domItem.subItems = domSubItems;
                    var ul = document.createElement('ul');
                    domItem.ul = ul;
                    ul.className = 'menu';
                    ul.style.height = '0';
                    li.appendChild(ul);
                    createMenuItems(ul, domSubItems, item.submenu);
                }
                else {
                    // no submenu, just a button with clickhandler
                    button.innerHTML = '<div class="icon"></div>' + item.text;
                }

                domItems.push(domItem);
            }
        });
    }
    createMenuItems(list, this.dom.items, items);

    // TODO: when the editor is small, show the submenu on the right instead of inline?

    // calculate the max height of the menu with one submenu expanded
    this.maxHeight = 0; // height in pixels
    items.forEach(function (item) {
        var height = (items.length + (item.submenu ? item.submenu.length : 0)) * 24;
        me.maxHeight = Math.max(me.maxHeight, height);
    });
}

/**
 * Get the currently visible buttons
 * @return {Array.<HTMLElement>} buttons
 * @private
 */
ContextMenu.prototype._getVisibleButtons = function () {
    var buttons = [];
    var me = this;
    this.dom.items.forEach(function (item) {
        buttons.push(item.button);
        if (item.buttonExpand) {
            buttons.push(item.buttonExpand);
        }
        if (item.subItems && item == me.expandedItem) {
            item.subItems.forEach(function (subItem) {
                buttons.push(subItem.button);
                if (subItem.buttonExpand) {
                    buttons.push(subItem.buttonExpand);
                }
                // TODO: change to fully recursive method
            });
        }
    });

    return buttons;
};

// currently displayed context menu, a singleton. We may only have one visible context menu
ContextMenu.visibleMenu = undefined;

/**
 * Attach the menu to an anchor
 * @param {HTMLElement} anchor
 */
ContextMenu.prototype.show = function (anchor) {
    this.hide();

    // calculate whether the menu fits below the anchor
    var windowHeight = util.getWindowHeight();
    var anchorHeight = anchor.offsetHeight;
    var menuHeight = this.maxHeight;

    // position the menu
    var left = util.getAbsoluteLeft(anchor);
    var top = util.getAbsoluteTop(anchor);
    if (top + anchorHeight + menuHeight < windowHeight) {
        // display the menu below the anchor
        this.dom.menu.style.left = left + 'px';
        this.dom.menu.style.top = (top + anchorHeight) + 'px';
        this.dom.menu.style.bottom = '';
    }
    else {
        // display the menu above the anchor
        this.dom.menu.style.left = left + 'px';
        this.dom.menu.style.top = '';
        this.dom.menu.style.bottom = (windowHeight - top) + 'px';
    }

    // attach the menu to the document
    document.body.appendChild(this.dom.menu);

    // create and attach event listeners
    var me = this;
    var list = this.dom.list;
    this.eventListeners.mousedown = util.addEventListener(
        document, 'mousedown', function (event) {
            // hide menu on click outside of the menu
            event = event || window.event;
            var target = event.target || event.srcElement;
            if ((target != list) && !me._isChildOf(target, list)) {
                me.hide();
                util.stopPropagation(event);
                util.preventDefault(event);
            }
        });
    this.eventListeners.mousewheel = util.addEventListener(
        document, 'mousewheel', function () {
            // hide the menu on mouse scroll
            util.stopPropagation(event);
            util.preventDefault(event);
        });
    this.eventListeners.keydown = util.addEventListener(
        document, 'keydown', function (event) {
            me._onKeyDown(event);
        });

    // move focus to the first button in the context menu
    this.selection = util.getSelection();
    this.anchor = anchor;
    setTimeout(function () {
        me.dom.focusButton.focus();
    }, 0);

    if (ContextMenu.visibleMenu) {
        ContextMenu.visibleMenu.hide();
    }
    ContextMenu.visibleMenu = this;
};

/**
 * Hide the context menu if visible
 */
ContextMenu.prototype.hide = function () {
    // remove the menu from the DOM
    if (this.dom.menu.parentNode) {
        this.dom.menu.parentNode.removeChild(this.dom.menu);
        if (this.onClose) {
            this.onClose();
        }
    }

    // remove all event listeners
    // all event listeners are supposed to be attached to document.
    for (var name in this.eventListeners) {
        if (this.eventListeners.hasOwnProperty(name)) {
            var fn = this.eventListeners[name];
            if (fn) {
                util.removeEventListener(document, name, fn);
            }
            delete this.eventListeners[name];
        }
    }

    if (ContextMenu.visibleMenu == this) {
        ContextMenu.visibleMenu = undefined;
    }
};

/**
 * Expand a submenu
 * Any currently expanded submenu will be hided.
 * @param {Object} domItem
 * @private
 */
ContextMenu.prototype._onExpandItem = function (domItem) {
    var me = this;
    var alreadyVisible = (domItem == this.expandedItem);

    // hide the currently visible submenu
    var expandedItem = this.expandedItem;
    if (expandedItem) {
        //var ul = expandedItem.ul;
        expandedItem.ul.style.height = '0';
        expandedItem.ul.style.padding = '';
        setTimeout(function () {
            if (me.expandedItem != expandedItem) {
                expandedItem.ul.style.display = '';
                util.removeClassName(expandedItem.ul.parentNode, 'selected');
            }
        }, 300); // timeout duration must match the css transition duration
        this.expandedItem = undefined;
    }

    if (!alreadyVisible) {
        var ul = domItem.ul;
        ul.style.display = 'block';
        var height = ul.clientHeight; // force a reflow in Firefox
        setTimeout(function () {
            if (me.expandedItem == domItem) {
                ul.style.height = (ul.childNodes.length * 24) + 'px';
                ul.style.padding = '5px 10px';
            }
        }, 0);
        util.addClassName(ul.parentNode, 'selected');
        this.expandedItem = domItem;
    }
};

/**
 * Handle onkeydown event
 * @param {Event} event
 * @private
 */
ContextMenu.prototype._onKeyDown = function (event) {
    event = event || window.event;
    var target = event.target || event.srcElement;
    var keynum = event.which || event.keyCode;
    var handled = false;
    var buttons, targetIndex, prevButton, nextButton;

    if (keynum == 27) { // ESC
        // hide the menu on ESC key

        // restore previous selection and focus
        if (this.selection) {
            util.setSelection(this.selection);
        }
        if (this.anchor) {
            this.anchor.focus();
        }

        this.hide();

        handled = true;
    }
    else if (keynum == 9) { // Tab
        if (!event.shiftKey) { // Tab
            buttons = this._getVisibleButtons();
            targetIndex = buttons.indexOf(target);
            if (targetIndex == buttons.length - 1) {
                // move to first button
                buttons[0].focus();
                handled = true;
            }
        }
        else { // Shift+Tab
            buttons = this._getVisibleButtons();
            targetIndex = buttons.indexOf(target);
            if (targetIndex == 0) {
                // move to last button
                buttons[buttons.length - 1].focus();
                handled = true;
            }
        }
    }
    else if (keynum == 37) { // Arrow Left
        if (target.className == 'expand') {
            buttons = this._getVisibleButtons();
            targetIndex = buttons.indexOf(target);
            prevButton = buttons[targetIndex - 1];
            if (prevButton) {
                prevButton.focus();
            }
        }
        handled = true;
    }
    else if (keynum == 38) { // Arrow Up
        buttons = this._getVisibleButtons();
        targetIndex = buttons.indexOf(target);
        prevButton = buttons[targetIndex - 1];
        if (prevButton && prevButton.className == 'expand') {
            // skip expand button
            prevButton = buttons[targetIndex - 2];
        }
        if (!prevButton) {
            // move to last button
            prevButton = buttons[buttons.length - 1];
        }
        if (prevButton) {
            prevButton.focus();
        }
        handled = true;
    }
    else if (keynum == 39) { // Arrow Right
        buttons = this._getVisibleButtons();
        targetIndex = buttons.indexOf(target);
        nextButton = buttons[targetIndex + 1];
        if (nextButton && nextButton.className == 'expand') {
            nextButton.focus();
        }
        handled = true;
    }
    else if (keynum == 40) { // Arrow Down
        buttons = this._getVisibleButtons();
        targetIndex = buttons.indexOf(target);
        nextButton = buttons[targetIndex + 1];
        if (nextButton && nextButton.className == 'expand') {
            // skip expand button
            nextButton = buttons[targetIndex + 2];
        }
        if (!nextButton) {
            // move to first button
            nextButton = buttons[0];
        }
        if (nextButton) {
            nextButton.focus();
            handled = true;
        }
        handled = true;
    }
    // TODO: arrow left and right

    if (handled) {
        util.stopPropagation(event);
        util.preventDefault(event);
    }
};

/**
 * Test if an element is a child of a parent element.
 * @param {Element} child
 * @param {Element} parent
 * @return {boolean} isChild
 */
ContextMenu.prototype._isChildOf = function (child, parent) {
    var e = child.parentNode;
    while (e) {
        if (e == parent) {
            return true;
        }
        e = e.parentNode;
    }

    return false;
};


/**
 * @constructor History
 * Store action history, enables undo and redo
 * @param {JSONEditor} editor
 */
function History (editor) {
    this.editor = editor;
    this.clear();

    // map with all supported actions
    this.actions = {
        'editField': {
            'undo': function (params) {
                params.node.updateField(params.oldValue);
            },
            'redo': function (params) {
                params.node.updateField(params.newValue);
            }
        },
        'editValue': {
            'undo': function (params) {
                params.node.updateValue(params.oldValue);
            },
            'redo': function (params) {
                params.node.updateValue(params.newValue);
            }
        },
        'appendNode': {
            'undo': function (params) {
                params.parent.removeChild(params.node);
            },
            'redo': function (params) {
                params.parent.appendChild(params.node);
            }
        },
        'insertBeforeNode': {
            'undo': function (params) {
                params.parent.removeChild(params.node);
            },
            'redo': function (params) {
                params.parent.insertBefore(params.node, params.beforeNode);
            }
        },
        'insertAfterNode': {
            'undo': function (params) {
                params.parent.removeChild(params.node);
            },
            'redo': function (params) {
                params.parent.insertAfter(params.node, params.afterNode);
            }
        },
        'removeNode': {
            'undo': function (params) {
                var parent = params.parent;
                var beforeNode = parent.childs[params.index] || parent.append;
                parent.insertBefore(params.node, beforeNode);
            },
            'redo': function (params) {
                params.parent.removeChild(params.node);
            }
        },
        'duplicateNode': {
            'undo': function (params) {
                params.parent.removeChild(params.clone);
            },
            'redo': function (params) {
                params.parent.insertAfter(params.clone, params.node);
            }
        },
        'changeType': {
            'undo': function (params) {
                params.node.changeType(params.oldType);
            },
            'redo': function (params) {
                params.node.changeType(params.newType);
            }
        },
        'moveNode': {
            'undo': function (params) {
                params.startParent.moveTo(params.node, params.startIndex);
            },
            'redo': function (params) {
                params.endParent.moveTo(params.node, params.endIndex);
            }
        },
        'sort': {
            'undo': function (params) {
                var node = params.node;
                node.hideChilds();
                node.sort = params.oldSort;
                node.childs = params.oldChilds;
                node.showChilds();
            },
            'redo': function (params) {
                var node = params.node;
                node.hideChilds();
                node.sort = params.newSort;
                node.childs = params.newChilds;
                node.showChilds();
            }
        }

        // TODO: restore the original caret position and selection with each undo
        // TODO: implement history for actions "expand", "collapse", "scroll", "setDocument"
    };
}

/**
 * The method onChange is executed when the History is changed, and can
 * be overloaded.
 */
History.prototype.onChange = function () {};

/**
 * Add a new action to the history
 * @param {String} action  The executed action. Available actions: "editField",
 *                         "editValue", "changeType", "appendNode",
 *                         "removeNode", "duplicateNode", "moveNode"
 * @param {Object} params  Object containing parameters describing the change.
 *                         The parameters in params depend on the action (for
 *                         example for "editValue" the Node, old value, and new
 *                         value are provided). params contains all information
 *                         needed to undo or redo the action.
 */
History.prototype.add = function (action, params) {
    this.index++;
    this.history[this.index] = {
        'action': action,
        'params': params,
        'timestamp': new Date()
    };

    // remove redo actions which are invalid now
    if (this.index < this.history.length - 1) {
        this.history.splice(this.index + 1, this.history.length - this.index - 1);
    }

    // fire onchange event
    this.onChange();
};

/**
 * Clear history
 */
History.prototype.clear = function () {
    this.history = [];
    this.index = -1;

    // fire onchange event
    this.onChange();
};

/**
 * Check if there is an action available for undo
 * @return {Boolean} canUndo
 */
History.prototype.canUndo = function () {
    return (this.index >= 0);
};

/**
 * Check if there is an action available for redo
 * @return {Boolean} canRedo
 */
History.prototype.canRedo = function () {
    return (this.index < this.history.length - 1);
};

/**
 * Undo the last action
 */
History.prototype.undo = function () {
    if (this.canUndo()) {
        var obj = this.history[this.index];
        if (obj) {
            var action = this.actions[obj.action];
            if (action && action.undo) {
                action.undo(obj.params);
                if (obj.params.oldSelection) {
                    this.editor.setSelection(obj.params.oldSelection);
                }
            }
            else {
                util.log('Error: unknown action "' + obj.action + '"');
            }
        }
        this.index--;

        // fire onchange event
        this.onChange();
    }
};

/**
 * Redo the last action
 */
History.prototype.redo = function () {
    if (this.canRedo()) {
        this.index++;

        var obj = this.history[this.index];
        if (obj) {
            var action = this.actions[obj.action];
            if (action && action.redo) {
                action.redo(obj.params);
                if (obj.params.newSelection) {
                    this.editor.setSelection(obj.params.newSelection);
                }
            }
            else {
                util.log('Error: unknown action "' + obj.action + '"');
            }
        }

        // fire onchange event
        this.onChange();
    }
};

/**
 * @constructor SearchBox
 * Create a search box in given HTML container
 * @param {JSONEditor} editor    The JSON Editor to attach to
 * @param {Element} container               HTML container element of where to
 *                                          create the search box
 */
function SearchBox (editor, container) {
    var searchBox = this;

    this.editor = editor;
    this.timeout = undefined;
    this.delay = 200; // ms
    this.lastText = undefined;

    this.dom = {};
    this.dom.container = container;

    var table = document.createElement('table');
    this.dom.table = table;
    table.className = 'search';
    container.appendChild(table);
    var tbody = document.createElement('tbody');
    this.dom.tbody = tbody;
    table.appendChild(tbody);
    var tr = document.createElement('tr');
    tbody.appendChild(tr);

    var td = document.createElement('td');
    tr.appendChild(td);
    var results = document.createElement('div');
    this.dom.results = results;
    results.className = 'results';
    td.appendChild(results);

    td = document.createElement('td');
    tr.appendChild(td);
    var divInput = document.createElement('div');
    this.dom.input = divInput;
    divInput.className = 'frame';
    divInput.title = 'Search fields and values';
    td.appendChild(divInput);

    // table to contain the text input and search button
    var tableInput = document.createElement('table');
    divInput.appendChild(tableInput);
    var tbodySearch = document.createElement('tbody');
    tableInput.appendChild(tbodySearch);
    tr = document.createElement('tr');
    tbodySearch.appendChild(tr);

    var refreshSearch = document.createElement('button');
    refreshSearch.className = 'refresh';
    td = document.createElement('td');
    td.appendChild(refreshSearch);
    tr.appendChild(td);

    var search = document.createElement('input');
    this.dom.search = search;
    search.oninput = function (event) {
        searchBox._onDelayedSearch(event);
    };
    search.onchange = function (event) { // For IE 8
        searchBox._onSearch(event);
    };
    search.onkeydown = function (event) {
        searchBox._onKeyDown(event);
    };
    search.onkeyup = function (event) {
        searchBox._onKeyUp(event);
    };
    refreshSearch.onclick = function (event) {
        search.select();
    };

    // TODO: ESC in FF restores the last input, is a FF bug, https://bugzilla.mozilla.org/show_bug.cgi?id=598819
    td = document.createElement('td');
    td.appendChild(search);
    tr.appendChild(td);

    var searchNext = document.createElement('button');
    searchNext.title = 'Next result (Enter)';
    searchNext.className = 'next';
    searchNext.onclick = function () {
        searchBox.next();
    };
    td = document.createElement('td');
    td.appendChild(searchNext);
    tr.appendChild(td);

    var searchPrevious = document.createElement('button');
    searchPrevious.title = 'Previous result (Shift+Enter)';
    searchPrevious.className = 'previous';
    searchPrevious.onclick = function () {
        searchBox.previous();
    };
    td = document.createElement('td');
    td.appendChild(searchPrevious);
    tr.appendChild(td);
}

/**
 * Go to the next search result
 * @param {boolean} [focus]   If true, focus will be set to the next result
 *                            focus is false by default.
 */
SearchBox.prototype.next = function(focus) {
    if (this.results != undefined) {
        var index = (this.resultIndex != undefined) ? this.resultIndex + 1 : 0;
        if (index > this.results.length - 1) {
            index = 0;
        }
        this._setActiveResult(index, focus);
    }
};

/**
 * Go to the prevous search result
 * @param {boolean} [focus]   If true, focus will be set to the next result
 *                            focus is false by default.
 */
SearchBox.prototype.previous = function(focus) {
    if (this.results != undefined) {
        var max = this.results.length - 1;
        var index = (this.resultIndex != undefined) ? this.resultIndex - 1 : max;
        if (index < 0) {
            index = max;
        }
        this._setActiveResult(index, focus);
    }
};

/**
 * Set new value for the current active result
 * @param {Number} index
 * @param {boolean} [focus]   If true, focus will be set to the next result.
 *                            focus is false by default.
 * @private
 */
SearchBox.prototype._setActiveResult = function(index, focus) {
    // de-activate current active result
    if (this.activeResult) {
        var prevNode = this.activeResult.node;
        var prevElem = this.activeResult.elem;
        if (prevElem == 'field') {
            delete prevNode.searchFieldActive;
        }
        else {
            delete prevNode.searchValueActive;
        }
        prevNode.updateDom();
    }

    if (!this.results || !this.results[index]) {
        // out of range, set to undefined
        this.resultIndex = undefined;
        this.activeResult = undefined;
        return;
    }

    this.resultIndex = index;

    // set new node active
    var node = this.results[this.resultIndex].node;
    var elem = this.results[this.resultIndex].elem;
    if (elem == 'field') {
        node.searchFieldActive = true;
    }
    else {
        node.searchValueActive = true;
    }
    this.activeResult = this.results[this.resultIndex];
    node.updateDom();

    // TODO: not so nice that the focus is only set after the animation is finished
    node.scrollTo(function () {
        if (focus) {
            node.focus(elem);
        }
    });
};

/**
 * Cancel any running onDelayedSearch.
 * @private
 */
SearchBox.prototype._clearDelay = function() {
    if (this.timeout != undefined) {
        clearTimeout(this.timeout);
        delete this.timeout;
    }
};

/**
 * Start a timer to execute a search after a short delay.
 * Used for reducing the number of searches while typing.
 * @param {Event} event
 * @private
 */
SearchBox.prototype._onDelayedSearch = function (event) {
    // execute the search after a short delay (reduces the number of
    // search actions while typing in the search text box)
    this._clearDelay();
    var searchBox = this;
    this.timeout = setTimeout(function (event) {
            searchBox._onSearch(event);
        },
        this.delay);
};

/**
 * Handle onSearch event
 * @param {Event} event
 * @param {boolean} [forceSearch]  If true, search will be executed again even
 *                                 when the search text is not changed.
 *                                 Default is false.
 * @private
 */
SearchBox.prototype._onSearch = function (event, forceSearch) {
    this._clearDelay();

    var value = this.dom.search.value;
    var text = (value.length > 0) ? value : undefined;
    if (text != this.lastText || forceSearch) {
        // only search again when changed
        this.lastText = text;
        this.results = this.editor.search(text);
        this._setActiveResult(undefined);

        // display search results
        if (text != undefined) {
            var resultCount = this.results.length;
            switch (resultCount) {
                case 0: this.dom.results.innerHTML = 'no&nbsp;results'; break;
                case 1: this.dom.results.innerHTML = '1&nbsp;result'; break;
                default: this.dom.results.innerHTML = resultCount + '&nbsp;results'; break;
            }
        }
        else {
            this.dom.results.innerHTML = '';
        }
    }
};

/**
 * Handle onKeyDown event in the input box
 * @param {Event} event
 * @private
 */
SearchBox.prototype._onKeyDown = function (event) {
    event = event || window.event;
    var keynum = event.which || event.keyCode;
    if (keynum == 27) { // ESC
        this.dom.search.value = '';  // clear search
        this._onSearch(event);
        util.preventDefault(event);
        util.stopPropagation(event);
    }
    else if (keynum == 13) { // Enter
        if (event.ctrlKey) {
            // force to search again
            this._onSearch(event, true);
        }
        else if (event.shiftKey) {
            // move to the previous search result
            this.previous();
        }
        else {
            // move to the next search result
            this.next();
        }
        util.preventDefault(event);
        util.stopPropagation(event);
    }
};

/**
 * Handle onKeyUp event in the input box
 * @param {Event} event
 * @private
 */
SearchBox.prototype._onKeyUp = function (event) {
    event = event || window.event;
    var keynum = event.which || event.keyCode;
    if (keynum != 27 && keynum != 13) { // !show and !Enter
        this._onDelayedSearch(event);   // For IE 8
    }
};

/**
 * The highlighter can highlight/unhighlight a node, and
 * animate the visibility of a context menu.
 * @constructor Highlighter
 */
function Highlighter () {
    this.locked = false;
}

/**
 * Hightlight given node and its childs
 * @param {Node} node
 */
Highlighter.prototype.highlight = function (node) {
    if (this.locked) {
        return;
    }

    if (this.node != node) {
        // unhighlight current node
        if (this.node) {
            this.node.setHighlight(false);
        }

        // highlight new node
        this.node = node;
        this.node.setHighlight(true);
    }

    // cancel any current timeout
    this._cancelUnhighlight();
};

/**
 * Unhighlight currently highlighted node.
 * Will be done after a delay
 */
Highlighter.prototype.unhighlight = function () {
    if (this.locked) {
        return;
    }

    var me = this;
    if (this.node) {
        this._cancelUnhighlight();

        // do the unhighlighting after a small delay, to prevent re-highlighting
        // the same node when moving from the drag-icon to the contextmenu-icon
        // or vice versa.
        this.unhighlightTimer = setTimeout(function () {
            me.node.setHighlight(false);
            me.node = undefined;
            me.unhighlightTimer = undefined;
        }, 0);
    }
};

/**
 * Cancel an unhighlight action (if before the timeout of the unhighlight action)
 * @private
 */
Highlighter.prototype._cancelUnhighlight = function () {
    if (this.unhighlightTimer) {
        clearTimeout(this.unhighlightTimer);
        this.unhighlightTimer = undefined;
    }
};

/**
 * Lock highlighting or unhighlighting nodes.
 * methods highlight and unhighlight do not work while locked.
 */
Highlighter.prototype.lock = function () {
    this.locked = true;
};

/**
 * Unlock highlighting or unhighlighting nodes
 */
Highlighter.prototype.unlock = function () {
    this.locked = false;
};

// create namespace
util = {};

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

/**
 * Parse JSON using the parser built-in in the browser.
 * On exception, the jsonString is validated and a detailed error is thrown.
 * @param {String} jsonString
 */
util.parse = function (jsonString) {
    try {
        return JSON.parse(jsonString);
    }
    catch (err) {
        // try to throw a more detailed error message using validate
        util.validate(jsonString);
        throw err;
    }
};

/**
 * Validate a string containing a JSON object
 * This method uses JSONLint to validate the String. If JSONLint is not
 * available, the built-in JSON parser of the browser is used.
 * @param {String} jsonString   String with an (invalid) JSON object
 * @throws Error
 */
util.validate = function (jsonString) {
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
util.extend = function (a, b) {
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
util.clear = function (a) {
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
util.log = function(args) {
    if (console && typeof console.log === 'function') {
        console.log.apply(console, arguments);
    }
};

/**
 * Test whether a text contains a url (matches when a string starts
 * with 'http://*' or 'https://*' and has no whitespace characters)
 * @param {String} text
 */
var isUrlRegex = /^https?:\/\/\S+$/;
util.isUrl = function (text) {
    return (typeof text == 'string' || text instanceof String) &&
        isUrlRegex.test(text);
};

/**
 * Retrieve the absolute left value of a DOM element
 * @param {Element} elem    A dom element, for example a div
 * @return {Number} left    The absolute left position of this element
 *                          in the browser page.
 */
util.getAbsoluteLeft = function (elem) {
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
util.getAbsoluteTop = function (elem) {
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
util.getMouseY = function (event) {
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
util.getMouseX = function (event) {
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
util.getWindowHeight = function () {
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
util.addClassName = function(elem, className) {
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
util.removeClassName = function(elem, className) {
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
util.stripFormatting = function (divElement) {
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
util.setEndOfContentEditable = function (contentEditableElement) {
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
util.selectContentEditable = function (contentEditableElement) {
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
util.getSelection = function () {
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
util.setSelection = function (range) {
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
util.getSelectionOffset = function () {
    var range = util.getSelection();

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
util.setSelectionOffset = function (params) {
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
util.getInnerText = function (element, buffer) {
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
util.getInternetExplorerVersion = function() {
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
util.addEventListener = function (element, action, listener, useCapture) {
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
util.removeEventListener = function(element, action, listener, useCapture) {
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
util.stopPropagation = function (event) {
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
util.preventDefault = function (event) {
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


// module exports
var jsoneditor = {
    'JSONEditor': JSONEditor,
    'JSONFormatter': function () {
        throw new Error('JSONFormatter is deprecated. ' +
            'Use JSONEditor with mode "text" or "code" instead');
    },
    'util': util
};

/**
 * load jsoneditor.css
 */
var loadCss = function () {
    // get the script location, and built the css file name from the js file name
    // http://stackoverflow.com/a/2161748/1262753
    var scripts = document.getElementsByTagName('script');
    var jsFile = scripts[scripts.length-1].src.split('?')[0];
    var cssFile = jsFile.substring(0, jsFile.length - 2) + 'css';

    // load css
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = cssFile;
    document.getElementsByTagName('head')[0].appendChild(link);
};

/**
 * CommonJS module exports
 */
if (typeof(module) != 'undefined' && typeof(exports) != 'undefined') {
    loadCss();
    module.exports = exports = jsoneditor;
}

/**
 * AMD module exports
 */
if (typeof(require) != 'undefined' && typeof(define) != 'undefined') {
    define(function () {
        loadCss();
        return jsoneditor;
    });
}
else {
    // attach the module to the window, load as a regular javascript file
    window['jsoneditor'] = jsoneditor;
}


})();
