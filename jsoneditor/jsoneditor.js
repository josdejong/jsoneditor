/**
 * @file jsoneditor.js
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
 * Copyright (c) 2011-2012 Jos de Jong, http://jsoneditoronline.org
 *
 * @author  Jos de Jong, <wjosdejong@gmail.com>
 * @date    2012-10-02
 */


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

// define variable JSON, needed for correct error handling on IE7 and older
var JSON;

/**
 * JSONEditor
 * @param {Element} container    Container element
 * @param {Object}  [options]    Object with options. available options:
 *                                   {Boolean} enableSearch   true by default
 *                                   {Boolean} enableHistory  true by default
 * @param {Object | undefined} json JSON object
 */
JSONEditor = function (container, options, json) {
    // check availability of JSON parser (not available in IE7 and older)
    if (!JSON) {
        throw new Error ('Your browser does not support JSON. \n\n' +
            'Please install the newest version of your browser.\n' +
            '(all modern browsers support JSON).');
    }

    if (!container) {
        throw new Error('No container element provided.');
    }
    this.container = container;
    this.dom = {};

    this._setOptions(options);

    if (this.options.enableHistory) {
        this.history = new JSONEditor.History(this);
    }

    this._createFrame();
    this._createTable();

    this.set(json || {});
};

/**
 * Initialize and set default options
 * @param {Object}  [options]      Object with options. available options:
 *                                   {Boolean} enableSearch   true by default
 *                                   {Boolean} enableHistory  true by default
 * @private
 */
JSONEditor.prototype._setOptions = function (options) {
    this.options = {
        'enableSearch': true,
        'enableHistory': true
    };

    // copy all options
    if (options) {
        for (var prop in options) {
            if (options.hasOwnProperty(prop)) {
                this.options[prop] = options[prop];
            }
        }
    }
};

// node currently being edited
JSONEditor.focusNode = undefined;

/**
 * Set JSON object in editor
 * @param {Object | undefined} json
 */
JSONEditor.prototype.set = function (json) {
    // verify if json is valid JSON, ignore when a function
    if (json instanceof Function || (json === undefined)) {
        this.clear();
    }
    else {
        this.content.removeChild(this.table);  // Take the table offline

        // replace the root node
        var params = {
            'value': json
        };
        var node = new JSONEditor.Node(params);
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
JSONEditor.prototype.get = function () {
    // remove focus from currently edited node
    if (JSONEditor.focusNode) {
        JSONEditor.focusNode.blur();
    }

    if (this.node) {
        return this.node.getValue();
    }
    else {
        return undefined;
    }
};

/**
 * Remove the root node from the editor
 */
JSONEditor.prototype.clear = function () {
    if (this.node) {
        this.node.collapse();
        this.tbody.removeChild(this.node.getDom());
        delete this.node;
    }
};

/**
 * Set the root node for the json editor
 * @param {JSONEditor.Node} node
 * @private
 */
JSONEditor.prototype._setRoot = function (node) {
    this.clear();

    this.node = node;

    // override the getEditor method
    var editor = this;
    node.getEditor = function () {
        return editor;
    };

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
 *                             - {JSONEditor.Node} node,
 *                             - {String} elem  the dom element name where
 *                                              the result is found ('field' or
 *                                              'value')
 */
JSONEditor.prototype.search = function (text) {
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
JSONEditor.prototype.expandAll = function () {
    if (this.node) {
        this.content.removeChild(this.table);  // Take the table offline
        this.node.expand();
        this.content.appendChild(this.table);  // Put the table online again
    }
};

/**
 * Collapse all nodes
 */
JSONEditor.prototype.collapseAll = function () {
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
 */
JSONEditor.prototype.onAction = function (action, params) {
    if (this.history) {
        this.history.add(action, params);
    }
};

/**
 * Set the focus to the JSONEditor. A hidden input field will be created
 * which captures key events
 */
// TODO: use the focus method?
JSONEditor.prototype.focus = function () {
    /*
    if (!this.dom.focus) {
        this.dom.focus = document.createElement('input');
        this.dom.focus.className = 'jsoneditor-hidden-focus';

        var editor = this;
        this.dom.focus.onblur = function () {
            // remove itself
            if (editor.dom.focus) {
                var focus = editor.dom.focus;
                delete editor.dom.focus;
                editor.frame.removeChild(focus);
            }
        };

        // attach the hidden input box to the DOM
        if (this.frame.firstChild) {
            this.frame.insertBefore(this.dom.focus, this.frame.firstChild);
        }
        else {
            this.frame.appendChild(this.dom.focus);
        }
    }
    this.dom.focus.focus();
    */
};

/**
 * Adjust the scroll position such that given top position is shown at 1/4
 * of the window height.
 * @param {Number} top
 */
JSONEditor.prototype.scrollTo = function (top) {
    var content = this.content;
    if (content) {
        // cancel any running animation
        var editor = this;
        if (editor.animateTimeout) {
            clearTimeout(editor.animateTimeout);
            delete editor.animateTimeout;
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
                editor.animateTimeout = setTimeout(animate, 50);
            }
        };
        animate();
    }
};


/**
 * @constructor JSONEditor.History
 * Store action history, enables undo and redo
 * @param {JSONEditor} editor
 */
JSONEditor.History = function (editor) {
    this.editor = editor;
    this.clear();

    // map with all supported actions
    this.actions = {
        'editField': {
            'undo': function (obj) {
                obj.params.node.updateField(obj.params.oldValue);
            },
            'redo': function (obj) {
                obj.params.node.updateField(obj.params.newValue);
            }
        },
        'editValue': {
            'undo': function (obj) {
                obj.params.node.updateValue(obj.params.oldValue);
            },
            'redo': function (obj) {
                obj.params.node.updateValue(obj.params.newValue);
            }
        },
        'appendNode': {
            'undo': function (obj) {
                obj.params.parent.removeChild(obj.params.node);
            },
            'redo': function (obj) {
                obj.params.parent.appendChild(obj.params.node);
            }
        },
        'removeNode': {
            'undo': function (obj) {
                var parent = obj.params.parent;
                var beforeNode = parent.childs[obj.params.index] || parent.append;
                parent.insertBefore(obj.params.node, beforeNode);
            },
            'redo': function (obj) {
                obj.params.parent.removeChild(obj.params.node);
            }
        },
        'duplicateNode': {
            'undo': function (obj) {
                obj.params.parent.removeChild(obj.params.clone);
            },
            'redo': function (obj) {
                // TODO: insert after instead of insert before
                obj.params.parent.insertBefore(obj.params.clone, obj.params.node);
            }
        },
        'changeType': {
            'undo': function (obj) {
                obj.params.node.changeType(obj.params.oldType);
            },
            'redo': function (obj) {
                obj.params.node.changeType(obj.params.newType);
            }
        },
        'moveNode': {
            'undo': function (obj) {
                obj.params.startParent.moveTo(obj.params.node, obj.params.startIndex);
            },
            'redo': function (obj) {
                obj.params.endParent.moveTo(obj.params.node, obj.params.endIndex);
            }
        }

        // TODO: restore the original caret position and selection with each undo
        // TODO: implement history for actions "expand", "collapse", "scroll", "setDocument"
    };
};

/**
 * The method onChange is executed when the History is changed, and can
 * be overloaded.
 */
JSONEditor.History.prototype.onChange = function () {};

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
JSONEditor.History.prototype.add = function (action, params) {
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
JSONEditor.History.prototype.clear = function () {
    this.history = [];
    this.index = -1;

    // fire onchange event
    this.onChange();
};

/**
 * Check if there is an action available for undo
 * @return {Boolean} canUndo
 */
JSONEditor.History.prototype.canUndo = function () {
    return (this.index >= 0);
};

/**
 * Check if there is an action available for redo
 * @return {Boolean} canRedo
 */
JSONEditor.History.prototype.canRedo = function () {
    return (this.index < this.history.length - 1);
};

/**
 * Undo the last action
 */
JSONEditor.History.prototype.undo = function () {
    if (this.canUndo()) {
        var obj = this.history[this.index];
        if (obj) {
            var action = this.actions[obj.action];
            if (action && action.undo) {
                action.undo(obj);
            }
            else {
                console.log('Error: unknown action "' + obj.action + '"');
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
JSONEditor.History.prototype.redo = function () {
    if (this.canRedo()) {
        this.index++;

        var obj = this.history[this.index];
        if (obj) {
            if (obj) {
                var action = this.actions[obj.action];
                if (action && action.redo) {
                    action.redo(obj);
                }
                else {
                    console.log('Error: unknown action "' + obj.action + '"');
                }
            }
        }

        // fire onchange event
        this.onChange();
    }
};


/**
 * @constructor JSONEditor.Node
 * Create a new Node
 * @param {Object} params   Can contain parameters: field, fieldEditable, value.
 */
JSONEditor.Node = function (params) {
    this.dom = {};
    this.expanded = false;

    if(params && (params instanceof Object)) {
        this.setField(params.field, params.fieldEditable);
        this.setValue(params.value);
    }
    else {
        this.setField();
        this.setValue();
    }
};

/**
 * Set parent node
 * @param {JSONEditor.Node} parent
 */
JSONEditor.Node.prototype.setParent = function(parent) {
    this.parent = parent;
};

/**
 * Get parent node. Returns undefined when no parent node is set.
 * @return {JSONEditor.Node} parent
 */
JSONEditor.Node.prototype.getParent = function () {
    return this.parent;
};

/**
 * Get the JSONEditor
 * @return {JSONEditor} editor
 */
JSONEditor.Node.prototype.getEditor = function () {
    return this.parent ? this.parent.getEditor() : undefined;
};

/**
 * Set field
 * @param {String} field
 * @param {boolean} fieldEditable
 */
JSONEditor.Node.prototype.setField = function(field, fieldEditable) {
    this.field = field;
    this.fieldEditable = (fieldEditable == true);
};

/**
 * Get field
 * @return {String}
 */
JSONEditor.Node.prototype.getField = function() {
    if (this.field === undefined) {
        this._getDomField();
    }

    return this.field;
};

/**
 * Set value. Value is a JSON structure or an element String, Boolean, etc.
 * @param {*} value
 */
JSONEditor.Node.prototype.setValue = function(value) {
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
    if (this.type == 'array') {
        // array
        this.childs = [];
        for (var i = 0, iMax = value.length; i < iMax; i++) {
            childValue = value[i];
            if (childValue !== undefined && !(childValue instanceof Function)) {
                // ignore undefined and functions
                child = new JSONEditor.Node({
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
                    child = new JSONEditor.Node({
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
         console.log('check', value, this.value);
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
JSONEditor.Node.prototype.getValue = function() {
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
JSONEditor.Node.prototype.getLevel = function() {
    return (this.parent ? this.parent.getLevel() + 1 : 0);
};

/**
 * Create a clone of a node
 * The complete state of a clone is copied, including whether it is expanded or
 * not. The DOM elements are not cloned.
 * @return {JSONEditor.Node} clone
 */
JSONEditor.Node.prototype.clone = function() {
    var clone = new JSONEditor.Node();
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
 * @param {boolean} recurse   Optional recursion, true by default. When
 *                            true, all childs will be expanded recursively
 */
JSONEditor.Node.prototype.expand = function(recurse) {
    if (!this.childs) {
        return;
    }

    // set this node expanded
    this.expanded = true;
    if (this.dom.expand) {
        this.dom.expand.className = 'jsoneditor-expanded';
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
 * @param {Number} recurse   Optional recursion, true by default. When
 *                            true, all childs will be collapsed recursively
 */
JSONEditor.Node.prototype.collapse = function(recurse) {
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
        this.dom.expand.className = 'jsoneditor-collapsed';
    }
    this.expanded = false;
};

/**
 * Recursively show all childs when they are expanded
 */
JSONEditor.Node.prototype.showChilds = function() {
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
JSONEditor.Node.prototype.hide = function() {
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
JSONEditor.Node.prototype.hideChilds = function() {
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
 * @param {JSONEditor.Node} node
 */
JSONEditor.Node.prototype.appendChild = function(node) {
    if (this.type == 'array' || this.type == 'object') {
        // adjust the link to the parent
        node.setParent(this);
        node.fieldEditable = (this.type == 'object');
        if (this.type == 'array') {
            node.index = this.childs.length;
        }
        this.childs.push(node);

        if (this.expanded) {
            // insert into the DOM, before the appendRow
            var newtr = node.getDom();
            var appendTr = this.getAppend();
            var table = appendTr ? appendTr.parentNode : undefined;
            if (appendTr && table) {
                table.insertBefore(newtr, appendTr);
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
 * @param {JSONEditor.Node} node
 * @param {JSONEditor.Node} beforeNode
 */
JSONEditor.Node.prototype.moveBefore = function(node, beforeNode) {
    if (this.type == 'array' || this.type == 'object') {
        // create a temporary row, to prevent the scroll position from jumping
        // when removing the node
        var tbody = (this.dom.tr) ? this.dom.tr.parentNode : undefined;
        if (tbody) {
            var trTemp = document.createElement('tr');
            trTemp.style.height = tbody.clientHeight + 'px';
            tbody.appendChild(trTemp);
        }

        var parent = node.getParent();
        if (parent) {
            parent.removeChild(node);
        }
        if (beforeNode instanceof JSONEditor.AppendNode) {
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
 * @param {JSONEditor.Node} node
 * @param {Number} index
 */
JSONEditor.Node.prototype.moveTo = function (node, index) {
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
 * @param {JSONEditor.Node} node
 * @param {JSONEditor.Node} beforeNode
 */
JSONEditor.Node.prototype.insertBefore = function(node, beforeNode) {
    if (this.type == 'array' || this.type == 'object') {
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
 * Search in this node
 * The node will be expanded when the text is found one of its childs, else
 * it will be collapsed. Searches are case insensitive.
 * @param {String} text
 * @return {JSONEditor.Node[]} results  Array with nodes containing the search text
 */
JSONEditor.Node.prototype.search = function(text) {
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
    if (this.type == 'array' || this.type == 'object') {
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
 */
JSONEditor.Node.prototype.scrollTo = function() {
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
        var editor = this.getEditor();
        if (editor) {
            editor.scrollTo(this.dom.tr.offsetTop);
        }
    }
};

/**
 * Set focus to the value of this node
 * @param {String} [field]  The field name of the element to get the focus
 *                          available values: 'field', 'value'
 */
JSONEditor.Node.prototype.focus = function(field) {
    if (this.dom.tr && this.dom.tr.parentNode) {
        if (field != 'value' && this.fieldEditable) {
            var domField = this.dom.field;
            if (domField) {
                domField.focus();
            }
        }
        else {
            var domValue = this.dom.value;
            if (domValue) {
                domValue.focus();
            }
        }
    }
};

/**
 * Remove focus from the value or field of this node
 */
JSONEditor.Node.prototype.blur = function() {
    if (this.dom.tr && this.dom.tr.parentNode) {
        var domValue = this.dom.value;
        if (domValue) {
            domValue.blur();
        }
        var domField = this.dom.field;
        if (domField) {
            domField.blur();
        }
    }

    // retrieve the field and value from the DOM. A little redundant but
    // it cannot do harm.
    this._getDomValue(true);
    this._getDomField(true);
};

/**
 * Duplicate given child node
 * new structure will be added right before the cloned node
 * @param {JSONEditor.Node} node           the childNode to be duplicated
 * @return {JSONEditor.Node} clone         the clone of the node
 * @private
 */
JSONEditor.Node.prototype._duplicate = function(node) {
    var clone = node.clone();

    /* TODO: adjust the field name (to prevent equal field names)
     if (this.type == 'object') {
     }
     */

    // TODO: insert after instead of insert before
    this.insertBefore(clone, node);

    return clone;
};

/**
 * Check if given node is a child. The method will check recursively to find
 * this node.
 * @param {JSONEditor.Node} node
 * @return {boolean} containsNode
 */
JSONEditor.Node.prototype.containsNode = function(node) {
    if (this == node) {
        return true;
    }

    var childs = this.childs;
    if (childs) {
        // TOOD: use the js5 Array.some() here?
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
 * @param {JSONEditor.Node} node           the childNode to be moved
 * @param {JSONEditor.Node} beforeNode     node will be inserted before given
 *                                         node. If no beforeNode is given,
 *                                         the node is appended at the end
 * @private
 */
JSONEditor.Node.prototype._move = function(node, beforeNode) {
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
 * @param {JSONEditor.Node} node   The child node to be removed;
 * @return {JSONEditor.Node | undefined} node  The removed node on success,
 *                                             else undefined
 */
JSONEditor.Node.prototype.removeChild = function(node) {
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
 * @param {JSONEditor.Node} node
 * @private
 */
JSONEditor.Node.prototype._remove = function (node) {
    this.removeChild(node);
};

/**
 * Change the type of the value of this Node
 * @param {String} newType
 */
JSONEditor.Node.prototype.changeType = function (newType) {
    var oldType = this.type;

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
                    child.field = index;
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
 * @param {boolean} silent.   If true (default), no errors will be thrown in
 *                            case of invalid data
 * @private
 */
JSONEditor.Node.prototype._getDomValue = function(silent) {
    if (this.dom.value && this.type != 'array' && this.type != 'object') {
        this.valueInnerText = JSONEditor.getInnerText(this.dom.value);
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
                this.getEditor().onAction('editValue', {
                    'node': this,
                    'oldValue': this.value,
                    'newValue': value
                });
            }
            this.value = value;
        }
        catch (err) {
            this.value = undefined;
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
JSONEditor.Node.prototype._updateDomValue = function () {
    var domValue = this.dom.value;
    if (domValue) {
        // set text color depending on value type
        var v = this.value;
        var t = (this.type == 'auto') ? typeof(v) : this.type;
        var color = '';
        if (t == 'string') {
            color = 'green';
        }
        else if (t == 'number') {
            color = 'red';
        }
        else if (t == 'boolean') {
            color = 'blue';
        }
        else if (this.type == 'object' || this.type == 'array') {
            // note: typeof(null)=="object", therefore check this.type instead of t
            color = '';
        }
        else if (v === null) {
            color = 'purple';
        }
        else if (v === undefined) {
            // invalid value
            color = 'green';
        }
        domValue.style.color = color;

        // make backgound color lightgray when empty
        var isEmpty = (String(this.value) == '' && this.type != 'array' && this.type != 'object');
        if (isEmpty) {
            JSONEditor.addClassName(domValue, 'jsoneditor-empty');
        }
        else {
            JSONEditor.removeClassName(domValue, 'jsoneditor-empty');
        }

        // highlight when there is a search result
        if (this.searchValueActive) {
            JSONEditor.addClassName(domValue, 'jsoneditor-search-highlight-active');
        }
        else {
            JSONEditor.removeClassName(domValue, 'jsoneditor-search-highlight-active');
        }
        if (this.searchValue) {
            JSONEditor.addClassName(domValue, 'jsoneditor-search-highlight');
        }
        else {
            JSONEditor.removeClassName(domValue, 'jsoneditor-search-highlight');
        }

        // strip formatting from the contents of the editable div
        JSONEditor.stripFormatting(domValue);
    }
};

/**
 * Update dom field:
 * - the text color of the field, depending on the text
 * - the height of the field, depending on the width
 * - background color in case it is empty
 * @private
 */
JSONEditor.Node.prototype._updateDomField = function () {
    var domField = this.dom.field;
    if (domField) {
        // make backgound color lightgray when empty
        var isEmpty = (String(this.field) == '');
        if (isEmpty) {
            JSONEditor.addClassName(domField, 'jsoneditor-empty');
        }
        else {
            JSONEditor.removeClassName(domField, 'jsoneditor-empty');
        }

        // highlight when there is a search result
        if (this.searchFieldActive) {
            JSONEditor.addClassName(domField, 'jsoneditor-search-highlight-active');
        }
        else {
            JSONEditor.removeClassName(domField, 'jsoneditor-search-highlight-active');
        }
        if (this.searchField) {
            JSONEditor.addClassName(domField, 'jsoneditor-search-highlight');
        }
        else {
            JSONEditor.removeClassName(domField, 'jsoneditor-search-highlight');
        }

        // strip formatting from the contents of the editable div
        JSONEditor.stripFormatting(domField);
    }
};

/**
 * Retrieve field from DOM
 * @param {boolean} silent.   If true (default), no errors will be thrown in
 *                            case of invalid data
 * @private
 */
JSONEditor.Node.prototype._getDomField = function(silent) {
    if (this.dom.field && this.fieldEditable) {
        this.fieldInnerText = JSONEditor.getInnerText(this.dom.field);
    }

    if (this.fieldInnerText != undefined) {
        try {
            var field = this._unescapeHTML(this.fieldInnerText);

            if (field !== this.field) {
                this.getEditor().onAction('editField', {
                    'node': this,
                    'oldValue': this.field,
                    'newValue': field
                });
            }
            this.field = field;
        }
        catch (err) {
            this.field = undefined;
            if (silent != true) {
                throw err;
            }
        }
    }
};

/**
 * Clear the dom of the node
 */
JSONEditor.Node.prototype.clearDom = function() {
    // TODO: hide the node first?
    //this.hide();
    // TOOD: recursively clear dom?

    this.dom = {};
};

/**
 * Get the HTML DOM TR element of the node.
 * The dom will be generated when not yet created
 * @return {Element} tr    HTML DOM TR Element
 */
JSONEditor.Node.prototype.getDom = function() {
    var dom = this.dom;
    if (dom.tr) {
        return dom.tr;
    }

    // create row
    dom.tr = document.createElement('tr');
    dom.tr.className = 'jsoneditor-tr';
    dom.tr.node = this;

    // create draggable area
    var tdDrag = document.createElement('td');
    tdDrag.className = 'jsoneditor-td';
    dom.drag = this._createDomDragArea();
    if (dom.drag) {
        tdDrag.appendChild(dom.drag);
    }
    dom.tr.appendChild(tdDrag);

    // create tree and field
    var tdField = document.createElement('td');
    tdField.className = 'jsoneditor-td';
    dom.tr.appendChild(tdField);
    dom.expand = this._createDomExpandButton();
    dom.field = this._createDomField();
    dom.value = this._createDomValue();
    dom.tree = this._createDomTree(dom.expand, dom.field, dom.value);
    tdField.appendChild(dom.tree);

    // create type select box
    var tdType = document.createElement('td');
    tdType.className = 'jsoneditor-td jsoneditor-td-edit';
    dom.tr.appendChild(tdType);
    dom.type = this._createDomTypeButton();
    tdType.appendChild(dom.type);

    // create duplicate button
    var tdDuplicate = document.createElement('td');
    tdDuplicate.className = 'jsoneditor-td jsoneditor-td-edit';
    dom.tr.appendChild(tdDuplicate);
    dom.duplicate = this._createDomDuplicateButton();
    if (dom.duplicate) {
        tdDuplicate.appendChild(dom.duplicate);
    }

    // create remove button
    var tdRemove = document.createElement('td');
    tdRemove.className = 'jsoneditor-td jsoneditor-td-edit';
    dom.tr.appendChild(tdRemove);
    dom.remove = this._createDomRemoveButton();
    if (dom.remove) {
        tdRemove.appendChild(dom.remove);
    }

    this.updateDom(); // TODO: recurse here?

    return dom.tr;
};

/**
 * DragStart event, fired on mousedown on the dragarea at the left side of a Node
 * @param {Event} event
 * @private
 */
JSONEditor.Node.prototype._onDragStart = function (event) {
    event = event || window.event;

    // remove focus from currently edited node
    if (JSONEditor.focusNode) {
        JSONEditor.focusNode.blur();
    }

    var node = this;
    if (!this.mousemove) {
        this.mousemove = JSONEditor.Events.addEventListener(document, 'mousemove',
            function (event) {
                node._onDrag(event);
            });
    }

    if (!this.mouseup) {
        this.mouseup = JSONEditor.Events.addEventListener(document, 'mouseup',
            function (event ) {
                node._onDragEnd(event);
            });
    }

    /* TODO: correct highlighting when the TypeDropDown is visible (And has highlighting locked)
     if (JSONEditor.freezeHighlight) {
     console.log('heee');
     JSONEditor.freezeHighlight = false;
     this.setHighlight(true);
     }
     */
    JSONEditor.freezeHighlight = true;
    this.drag = {
        'oldCursor': document.body.style.cursor,
        'startParent': this.parent,
        'startIndex': this.parent.childs.indexOf(this)
    };
    document.body.style.cursor = 'move';

    JSONEditor.Events.preventDefault(event);
};

/**
 * Drag event, fired when moving the mouse while dragging a Node
 * @param {Event} event
 * @private
 */
JSONEditor.Node.prototype._onDrag = function (event) {
    event = event || window.event;
    var trThis = this.dom.tr;

    // TODO: add an ESC option, which resets to the original position

    var topThis = JSONEditor.getAbsoluteTop(trThis);
    var heightThis = trThis.offsetHeight;
    var mouseY = event.pageY || (event.clientY + document.body.scrollTop);
    if (mouseY < topThis) {
        // move up
        var trPrev = trThis.previousSibling;
        var topPrev = JSONEditor.getAbsoluteTop(trPrev);
        var nodePrev = JSONEditor.getNodeFromTarget(trPrev);
        while (trPrev && mouseY < topPrev) {
            nodePrev = JSONEditor.getNodeFromTarget(trPrev);
            trPrev = trPrev.previousSibling;
            topPrev = JSONEditor.getAbsoluteTop(trPrev);
        }

        if (nodePrev) {
            trPrev = nodePrev.dom.tr;
            topPrev = JSONEditor.getAbsoluteTop(trPrev);
            if (mouseY > topPrev + heightThis) {
                nodePrev = undefined;
            }
        }

        if (nodePrev && nodePrev.parent) {
            nodePrev.parent.moveBefore(this, nodePrev);
        }
    }
    else {
        // move down
        var trLast = (this.expanded && this.append) ? this.append.getDom() : this.dom.tr;
        var trFirst = trLast ? trLast.nextSibling : undefined;
        if (trFirst) {
            var topFirst = JSONEditor.getAbsoluteTop(trFirst);

            var nodeNext = undefined;
            var trNext = trFirst.nextSibling;
            var topNext = JSONEditor.getAbsoluteTop(trNext);
            var heightNext = trNext ? (topNext - topFirst) : 0;
            while (trNext && mouseY > topThis + heightNext) {
                nodeNext = JSONEditor.getNodeFromTarget(trNext);
                trNext = trNext.nextSibling;
                topNext = JSONEditor.getAbsoluteTop(trNext);
                heightNext = trNext ? (topNext - topFirst) : 0;
            }

            if (nodeNext && nodeNext.parent) {
                nodeNext.parent.moveBefore(this, nodeNext);
            }
        }
    }
    JSONEditor.Events.preventDefault(event);
};

/**
 * Drag event, fired on mouseup after having dragged a node
 * @param {Event} event
 * @private
 */
JSONEditor.Node.prototype._onDragEnd = function (event) {
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
        // only register this action if the node is actually moved to anothe place
        this.getEditor().onAction('moveNode', params);
    }

    document.body.style.cursor = this.drag.oldCursor;
    delete JSONEditor.freezeHighlight;
    delete this.drag;
    this.setHighlight(false);

    if (this.mousemove) {
        JSONEditor.Events.removeEventListener(document, 'mousemove', this.mousemove);
        delete this.mousemove;
    }
    if (this.mouseup) {
        JSONEditor.Events.removeEventListener(document, 'mouseup', this.mouseup);
        delete this.mouseup;
    }

    JSONEditor.Events.preventDefault(event);
};

/**
 * Create a drag area, displayed at the left side of the node
 * @return {Element | undefined} domDrag
 * @private
 */
JSONEditor.Node.prototype._createDomDragArea = function () {
    if (!this.parent) {
        return undefined;
    }

    var domDrag = document.createElement('button');
    domDrag.className = 'jsoneditor-dragarea';
    domDrag.title = 'Move field (drag and drop)';

    return domDrag;
};

/**
 * Create an editable field
 * @return {Element} domField
 * @private
 */
JSONEditor.Node.prototype._createDomField = function () {
    return document.createElement('div');
};

/**
 * Set highlighting for this node and all its childs.
 * Only applied to the currently visible (expanded childs)
 * @param {boolean} highlight
 */
JSONEditor.Node.prototype.setHighlight = function (highlight) {
    if (JSONEditor.freezeHighlight) {
        return;
    }

    if (this.dom.tr) {
        this.dom.tr.className = 'jsoneditor-tr' + (highlight ? ' jsoneditor-tr-highlight' : '');

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
JSONEditor.Node.prototype.updateValue = function (value) {
    this.value = value;
    this.updateDom();
};

/**
 * Update the field of the node.
 * @param {String} field
 */
JSONEditor.Node.prototype.updateField = function (field) {
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
JSONEditor.Node.prototype.updateDom = function (options) {
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
            domField.contentEditable = 'true';
            domField.spellcheck = false;
            domField.className = 'jsoneditor-field';
        }
        else {
            // parent is an array this is the root node
            domField.className = 'jsoneditor-readonly';
        }

        var field;
        if (this.index != undefined) {
            field = this.index;
        }
        else if (this.field != undefined) {
            field = this.field;
        }
        else if (this.type == 'array' || this.type == 'object') {
            field = this.type;
        }
        else {
            field = 'field';
        }
        domField.innerHTML = this._escapeHTML(field);
    }

    // update value
    var domValue = this.dom.value;
    if (domValue) {
        var count = this.childs ? this.childs.length : 0;
        if (this.type == 'array') {
            domValue.innerHTML = '[' + count + ']';
            domValue.title = this.type + ' containing ' + count + ' items';
        }
        else if (this.type == 'object') {
            domValue.innerHTML = '{' + count + '}';
            domValue.title = this.type + ' containing ' + count + ' items';
        }
        else {
            domValue.innerHTML = this._escapeHTML(this.value);
            delete domValue.title;
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

        // update row with append button
        if (this.append) {
            this.append.updateDom();
        }
    }
};

/**
 * Update the DOM of the childs of a node: update indexes and undefined field
 * names.
 * Only applicable when structure is an array or object
 * @private
 */
JSONEditor.Node.prototype._updateDomIndexes = function () {
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
                        child.field = 'field';
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
JSONEditor.Node.prototype._createDomValue = function () {
    var domValue;

    if (this.type == 'array') {
        domValue = document.createElement('div');
        domValue.className = 'jsoneditor-readonly';
        domValue.innerHTML = '[...]';
    }
    else if (this.type == 'object') {
        domValue = document.createElement('div');
        domValue.className = 'jsoneditor-readonly';
        domValue.innerHTML = '{...}';
    }
    else if (this.type == 'string') {
        domValue = document.createElement('div');
        domValue.contentEditable = 'true';
        domValue.spellcheck = false;
        domValue.className = 'jsoneditor-value';
        domValue.innerHTML = this._escapeHTML(this.value);
    }
    else {
        domValue = document.createElement('div');
        domValue.contentEditable = 'true';
        domValue.spellcheck = false;
        domValue.className = 'jsoneditor-value';
        domValue.innerHTML = this._escapeHTML(this.value);
    }

    // TODO: in FF spel/check of editable divs is done via the body. quite ugly
    // document.body.spellcheck = false;

    return domValue;
};

/**
 * Create an expand/collapse button
 * @return {Element} expand
 * @private
 */
JSONEditor.Node.prototype._createDomExpandButton = function () {
    // create expand button
    var expand = document.createElement('button');
    var expandable = (this.type == 'array' || this.type == 'object');
    if (expandable) {
        expand.className = this.expanded ? 'jsoneditor-expanded' : 'jsoneditor-collapsed';
        expand.title =
            'Click to expand/collapse this field. \n' +
                'Ctrl+Click to expand/collapse including all childs.';
    }
    else {
        expand.className = 'jsoneditor-invisible';
        expand.title = '';
    }

    return expand;
};


/**
 * Create a DOM tree element, containing the expand/collapse button
 * @param {Element} domExpand
 * @param {Element} domField
 * @param {Element} domValue
 * @return {Element} domTree
 * @private
 */
JSONEditor.Node.prototype._createDomTree = function (domExpand, domField, domValue) {
    var dom = this.dom;
    var domTree = document.createElement('table');
    var tbody = document.createElement('tbody');
    domTree.style.borderCollapse = 'collapse'; // TODO: put in css
    domTree.appendChild(tbody);
    var tr = document.createElement('tr');
    tbody.appendChild(tr);

    // create expand button
    var tdExpand = document.createElement('td');
    tdExpand.className = 'jsoneditor-td-tree';
    tr.appendChild(tdExpand);
    tdExpand.appendChild(domExpand);
    dom.tdExpand = tdExpand;

    // add the field
    var tdField = document.createElement('td');
    tdField.className = 'jsoneditor-td-tree';
    tr.appendChild(tdField);
    tdField.appendChild(domField);
    dom.tdField = tdField;

    // add a separator
    var tdSeparator = document.createElement('td');
    tdSeparator.className = 'jsoneditor-td-tree';
    tr.appendChild(tdSeparator);
    if (this.type != 'object' && this.type != 'array') {
        tdSeparator.appendChild(document.createTextNode(':'));
        tdSeparator.className = 'jsoneditor-separator';
    }
    dom.tdSeparator = tdSeparator;

    // add the value
    var tdValue = document.createElement('td');
    tdValue.className = 'jsoneditor-td-tree';
    tr.appendChild(tdValue);
    tdValue.appendChild(domValue);
    dom.tdValue = tdValue;

    return domTree;
};

/**
 * Handle an event. The event is catched centrally by the editor
 * @param {Event} event
 */
JSONEditor.Node.prototype.onEvent = function (event) {
    var type = event.type;
    var target = event.target || event.srcElement;
    var dom = this.dom;
    var node = this;
    var expandable = (this.type == 'array' || this.type == 'object');

    // value events
    var domValue = dom.value;
    if (target == domValue) {
        switch (type) {
            case 'focus':
                JSONEditor.focusNode = this;
                break;

            case 'blur':
            case 'change':
                this._getDomValue(true);
                this._updateDomValue();
                if (this.value) {
                    domValue.innerHTML = this._escapeHTML(this.value);
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
                JSONEditor.focusNode = this;
                break;

            case 'change':
            case 'blur':
                this._getDomField(true);
                this._updateDomField();
                if (this.field) {
                    domField.innerHTML = this._escapeHTML(this.field);
                }
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

    // drag events
    var domDrag = dom.drag;
    if (target == domDrag) {
        switch (type) {
            case 'mousedown':
                this._onDragStart(event);
                break;
            case 'mouseover':
                this.setHighlight(true);
                break;
            case 'mouseout':
                this.setHighlight(false);
                break;
        }
    }

    // expand events
    var domExpand = dom.expand;
    if (target == domExpand) {
        if (type == 'click') {
            if (expandable) {
                this._onExpand(event);
            }
        }
    }

    // duplicate button
    var domDuplicate = dom.duplicate;
    if (target == domDuplicate) {
        switch (type) {
            case 'click':
                var clone = this.parent._duplicate(this);

                this.getEditor().onAction('duplicateNode', {
                    'node': this,
                    'clone': clone,
                    'parent': this.parent
                });
                break;
            case 'mouseover':
                this.setHighlight(true);
                break;
            case 'mouseout':
                this.setHighlight(false);
                break;
        }
    }

    // remove button
    var domRemove = dom.remove;
    if (target == domRemove) {
        switch (type) {
            case 'click':
                this._onRemove();
                break;
            case 'mouseover':
                this.setHighlight(true);
                break;
            case 'mouseout':
                this.setHighlight(false);
                break;
        }
    }

    // type button
    var domType = dom.type;
    if (target == domType) {
        switch (type) {
            case 'click':
                this._onChangeType(event);
                break;
            case 'mouseover':
                this.setHighlight(true);
                break;
            case 'mouseout':
                this.setHighlight(false);
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
                    (event.clientX < JSONEditor.getAbsoluteLeft(dom.tdSeparator));// for FF
                if (left || expandable) {
                    // node is expandable when it is an object or array
                    if (domField) {
                        JSONEditor.setEndOfContentEditable(domField);
                        domField.focus();
                    }
                }
                else {
                    if (domValue) {
                        JSONEditor.setEndOfContentEditable(domValue);
                        domValue.focus();
                    }
                }
                break;
        }
    }

    if ((target == dom.tdExpand && !expandable) || target == dom.tdField || target == dom.tdSeparator) {
        switch (type) {
            case 'click':
                if (domField) {
                    JSONEditor.setEndOfContentEditable(domField);
                    domField.focus();
                }
                break;
        }
    }
};

/**
 * Handle the expand event, when clicked on the expand button
 * @param {Event} event
 * @private
 */
JSONEditor.Node.prototype._onExpand = function (event) {
    event = event || window.event;
    var recurse = event.ctrlKey; // with ctrl-key, expand/collapse all

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

JSONEditor.Node.types = [
    {
        'value': 'array',
        'className': 'jsoneditor-option-array',
        'title': 'Field type "array". ' +
            'An array contains an ordered collection of values.'
    },
    {
        'value': 'auto',
        'className': 'jsoneditor-option-auto',
        'title': 'Field type "auto". ' +
            'The field type is automatically determined from the value ' +
            'and can be a string, number, boolean, or null.'
    },
    {
        'value': 'object',
        'className': 'jsoneditor-option-object',
        'title': 'Field type "object". ' +
            'An object contains an unordered set of key/value pairs.'
    },
    {
        'value': 'string',
        'className': 'jsoneditor-option-string',
        'title': 'Field type "string". ' +
            'Field type is not determined from the value, ' +
            'but always returned as string.'
    }
];

/**
 * Create a DOM select box containing the node type
 * @return {Element} domType
 * @private
 */
JSONEditor.Node.prototype._createDomTypeButton = function () {
    var node = this;
    var domType = document.createElement('button');
    domType.className = 'jsoneditor-type-' + node.type;
    domType.title = 'Change field type';

    return domType;
};

/**
 * Remove this node
 * @private
 */
JSONEditor.Node.prototype._onRemove = function() {
    this.setHighlight(false);
    var index = this.parent.childs.indexOf(this);

    this.parent._remove(this);

    this.getEditor().onAction('removeNode', {
        'node': this,
        'parent': this.parent,
        'index': index
    });
}

/**
 * Handle a click on the Type-button
 * @param {Event} event
 * @private
 */
JSONEditor.Node.prototype._onChangeType = function (event) {
    JSONEditor.Events.stopPropagation(event);

    var domType = this.dom.type;

    var node = this;
    var x = JSONEditor.getAbsoluteLeft(domType);
    var y = JSONEditor.getAbsoluteTop(domType) + domType.clientHeight;
    var callback = function (newType) {
        var oldType = node.type;
        node.changeType(newType);
        node.getEditor().onAction('changeType', {
            'node': node,
            'oldType': oldType,
            'newType': newType
        });
        domType.className = 'jsoneditor-type-' + node.type;
    };
    JSONEditor.showDropDownList({
        'x': x,
        'y': y,
        'node': node,
        'value': node.type,
        'values': JSONEditor.Node.types,
        'className': 'jsoneditor-select',
        'optionSelectedClassName': 'jsoneditor-option-selected',
        'optionClassName': 'jsoneditor-option',
        'callback': callback
    });
};

/**
 * Show a dropdown list
 * @param {Object} params    Available parameters:
 *                           {Number} x  The absolute horizontal position
 *                           {Number} y  The absolute vertical position
 *                           {JSONEditor.Node} node node used for highlighting
 *                           {String} value current selected value
 *                           {Object[]} values the available values. Each object
 *                                             contains a value, title, and
 *                                             className
 *                           {String} optionSelectedClassName
 *                           {String} optionClassName
 *                           {function} callback   Callback method, called when
 *                                                 the selected value changed.
 */
JSONEditor.showDropDownList = function (params) {
    var select = document.createElement('div');
    select.className = params.className || '';
    select.style.position = 'absolute';
    select.style.left = (params.x || 0) + 'px';
    select.style.top = (params.y || 0) + 'px';

    params.values.forEach(function (v) {
        var text = v.value || String(v);
        var className = 'jsoneditor-option';
        var selected = (text == params.value);
        if (selected)  {
            className += ' ' + params.optionSelectedClassName;
        }
        var option = document.createElement('div');
        option.className = className;
        if (v.title) {
            option.title = v.title;
        }

        var divIcon = document.createElement('div');
        divIcon.className = (v.className || '');
        option.appendChild(divIcon);

        var divText = document.createElement('div');
        divText.className = 'jsoneditor-option-text';
        divText.innerHTML = '<div>' + text + '</div>';
        option.appendChild(divText);

        option.onmousedown = (function (value) {
            return function () {
                params.callback(value);
            };
        })(v.value);
        select.appendChild(option);
    });

    document.body.appendChild(select);
    params.node.setHighlight(true);
    JSONEditor.freezeHighlight = true;

    // TODO: change to onclick? -> but be sure to remove existing dropdown first
    var onmousedown = JSONEditor.Events.addEventListener(document, 'mousedown', function () {
        JSONEditor.freezeHighlight = false;
        params.node.setHighlight(false);
        if (select && select.parentNode) {
            select.parentNode.removeChild(select);
        }
        JSONEditor.Events.removeEventListener(document, 'mousedown', onmousedown);
    });
    var onmousewheel = JSONEditor.Events.addEventListener(document, 'mousewheel', function () {
        JSONEditor.freezeHighlight = false;
        params.node.setHighlight(false);
        if (select && select.parentNode) {
            select.parentNode.removeChild(select);
        }
        JSONEditor.Events.removeEventListener(document, 'mousewheel', onmousewheel);
    });
};

/**
 * Create a table row with an append button.
 * @return {Element | undefined} buttonAppend or undefined when inapplicable
 */
JSONEditor.Node.prototype.getAppend = function () {
    if (!this.append) {
        this.append = new JSONEditor.AppendNode();
        this.append.setParent(this);
    }
    return this.append.getDom();
};

/**
 * Create a remove button. Returns undefined when the structure cannot
 * be removed
 * @return {Element | undefined} removeButton, or undefined when inapplicable
 * @private
 */
JSONEditor.Node.prototype._createDomRemoveButton = function () {
    if (this.parent && (this.parent.type == 'array' || this.parent.type == 'object')) {
        var buttonRemove = document.createElement('button');
        buttonRemove.className = 'jsoneditor-remove';
        buttonRemove.title = 'Remove field (including all its childs)';

        return buttonRemove;
    }
    else {
        return undefined;
    }
};

/**
 * Create a duplicate button.
 * If the Node is the root node, no duplicate button is available and undefined
 * will be returned
 * @return {Element | undefined} buttonDuplicate
 * @private
 */
JSONEditor.Node.prototype._createDomDuplicateButton = function () {
    if (this.parent && (this.parent.type == 'array' || this.parent.type == 'object')) {
        var buttonDupliate = document.createElement('button');
        buttonDupliate.className = 'jsoneditor-duplicate';
        buttonDupliate.title = 'Duplicate field (including all childs)';

        return buttonDupliate;
    }
    else {
        return undefined;
    }
};

/**
 * get the type of a value
 * @param {*} value
 * @return {String} type   Can be 'object', 'array', 'string', 'auto'
 * @private
 */
JSONEditor.Node.prototype._getType = function(value) {
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
JSONEditor.Node.prototype._stringCast = function(str) {
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
JSONEditor.Node.prototype._escapeHTML = function (text) {
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
JSONEditor.Node.prototype._unescapeHTML = function (escapedText) {
    var json = '"' + this._escapeJSON(escapedText) + '"';
    var htmlEscaped = JSON.parse(json);
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
JSONEditor.Node.prototype._escapeJSON = function (text) {
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
 * @constructor JSONEditor.AppendNode
 * @extends JSONEditor.Node
 * Create a new AppendNode. This is a special node which is created at the
 * end of the list with childs for an object or array
 */
JSONEditor.AppendNode = function () {
    this.dom = {};
};

JSONEditor.AppendNode.prototype = new JSONEditor.Node();

/**
 * Return a table row with an append button.
 * @return {Element} dom   TR element
 */
JSONEditor.AppendNode.prototype.getDom = function () {
    if (this.dom.tr) {
        return this.dom.tr;
    }

    /**
     * Create a TD element, and give it the provided class name (if any)
     * @param {String} [className]
     * @return {Element} td
     */
    function newTd(className) {
        var td = document.createElement('td');
        td.className = className || '';
        return td;
    }

    // a row for the append button
    var trAppend = document.createElement('tr');
    trAppend.appendChild(newTd('jsoneditor-td'));
    trAppend.node = this;

    var tdAppend = document.createElement('td');
    trAppend.appendChild(tdAppend);
    tdAppend.className = 'jsoneditor-td';

    var buttonAppend = document.createElement('button');
    buttonAppend.className = 'jsoneditor-append';
    buttonAppend.title = 'Append a field';
    this.dom.append = buttonAppend;

    tdAppend.appendChild(buttonAppend);

    trAppend.appendChild(newTd('jsoneditor-td jsoneditor-td-edit'));
    trAppend.appendChild(newTd('jsoneditor-td jsoneditor-td-edit'));
    trAppend.appendChild(newTd('jsoneditor-td jsoneditor-td-edit'));

    this.dom.tr = trAppend;
    this.dom.td = tdAppend;

    this.updateDom();

    return trAppend;
};

/**
 * Update the HTML dom of the Node
 */
JSONEditor.AppendNode.prototype.updateDom = function () {
    var tdAppend = this.dom.td;
    if (tdAppend) {
        tdAppend.style.paddingLeft = (this.getLevel() * 24 + 26) + 'px';
        // TODO: not so nice hard coded offset
    }
};

/**
 * Handle an event. The event is catched centrally by the editor
 * @param {Event} event
 */
JSONEditor.AppendNode.prototype.onEvent = function (event) {
    var type = event.type;
    var target = event.target || event.srcElement;
    var dom = this.dom;

    var domAppend = dom.append;
    if (target == domAppend) {
        switch (type) {
            case 'click':
                this._onAppend();
                break;

            case 'mouseover':
                this.parent.setHighlight(true);
                break;

            case 'mouseout':
                this.parent.setHighlight(false);
        }
    }
};

/**
 * Handle append event
 * @private
 */
JSONEditor.AppendNode.prototype._onAppend = function () {
    var newNode = new JSONEditor.Node({
        'field': 'field',
        'value': 'value'
    });
    this.parent.appendChild(newNode);
    this.parent.setHighlight(false);
    newNode.focus();

    this.getEditor().onAction('appendNode', {
        'node': newNode,
        'parent': this.parent
    });
};

/**
 * Create main frame
 * @private
 */
JSONEditor.prototype._createFrame = function () {
    // create the frame
    this.container.innerHTML = '';
    this.frame = document.createElement('div');
    this.frame.className = 'jsoneditor-frame';
    this.container.appendChild(this.frame);

    // create one global event listener to handle all events from all nodes
    var editor = this;
    // TODO: move this onEvent to JSONEditor.prototype.onEvent
    var onEvent = function (event) {
        event = event || window.event;
        var target = event.target || event.srcElement;

        /* TODO: Enable quickkeys Ctrl+F and F3.
        //       Requires knowing whether the JSONEditor has focus or not
        //       (use a global event listener for that?)
        // Check for search quickkeys, Ctrl+F and F3
        if (editor.options.enableSearch) {
            if (event.type == 'keydown') {
                var keynum = event.which || event.keyCode;
                if (keynum == 70 && event.ctrlKey) { // Ctrl+F
                    if (editor.searchBox) {
                        editor.searchBox.dom.search.focus();
                        editor.searchBox.dom.search.select();
                        JSONEditor.Events.preventDefault(event);
                        JSONEditor.Events.stopPropagation(event);
                    }
                }
                else if (keynum == 114) { // F3
                    if (!event.shiftKey) {
                        // select next search result
                        editor.searchBox.next();
                    }
                    else {
                        // select previous search result
                        editor.searchBox.previous();
                    }
                    editor.searchBox.focusActiveResult();

                    // set selection to the current
                    JSONEditor.Events.preventDefault(event);
                    JSONEditor.Events.stopPropagation(event);
                }
            }
        }
        */

        var node = JSONEditor.getNodeFromTarget(target);
        if (node) {
            node.onEvent(event);
        }
    };
    this.frame.onclick = function (event) {
        onEvent(event);

        // prevent default submit action when JSONEditor is located inside a form
        JSONEditor.Events.preventDefault(event);
    };
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
    JSONEditor.Events.addEventListener(this.frame, 'focus', onEvent, true);
    JSONEditor.Events.addEventListener(this.frame, 'blur', onEvent, true);
    this.frame.onfocusin = onEvent;  // for IE
    this.frame.onfocusout = onEvent; // for IE

    // create menu
    this.menu = document.createElement('div');
    this.menu.className = 'jsoneditor-menu';
    this.frame.appendChild(this.menu);

    // create expand all button
    var expandAll = document.createElement('button');
    expandAll.className = 'jsoneditor-menu jsoneditor-expand-all';
    expandAll.title = 'Expand all fields';
    expandAll.onclick = function () {
        editor.expandAll();
    };
    this.menu.appendChild(expandAll);

    // create expand all button
    var collapseAll = document.createElement('button');
    collapseAll.title = 'Collapse all fields';
    collapseAll.className = 'jsoneditor-menu jsoneditor-collapse-all';
    collapseAll.onclick = function () {
        editor.collapseAll();
    };
    this.menu.appendChild(collapseAll);

    // create expand/collapse buttons
    if (this.options.enableHistory) {
        // create separator
        var separator = document.createElement('span');
        //separator.style.width = '5px';
        //separator.style.display = 'inline';
        separator.innerHTML = '&nbsp;';
        this.menu.appendChild(separator);

        // create undo button
        var undo = document.createElement('button');
        undo.className = 'jsoneditor-menu jsoneditor-undo';
        undo.title = 'Undo last action';
        undo.onclick = function () {
            editor.history.undo();
        };
        this.menu.appendChild(undo);
        this.dom.undo = undo;

        // create redo button
        var redo = document.createElement('button');
        redo.className = 'jsoneditor-menu jsoneditor-redo';
        redo.title = 'Redo';
        redo.onclick = function () {
            editor.history.redo();
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
    if (this.options.enableSearch) {
        this.searchBox = new JSONEditor.SearchBox(this, this.menu);
    }
};


/**
 * Create main table
 * @private
 */
JSONEditor.prototype._createTable = function () {
    var contentOuter = document.createElement('div');
    contentOuter.className = 'jsoneditor-content-outer';
    this.contentOuter = contentOuter;

    this.content = document.createElement('div');
    this.content.className = 'jsoneditor-content';
    contentOuter.appendChild(this.content);

    this.table = document.createElement('table');
    this.table.className = 'jsoneditor-table';
    this.content.appendChild(this.table);

    // IE8 does not handle overflow='auto' correctly.
    // Therefore, set overflow to 'scroll'
    var ieVersion = JSONEditor.getInternetExplorerVersion();
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
    this.colgroupContent.appendChild(col);
    col = document.createElement('col');
    col.width = "24px";
    this.colgroupContent.appendChild(col);
    col = document.createElement('col');
    col.width = "24px";
    this.colgroupContent.appendChild(col);
    col = document.createElement('col');
    col.width = "24px";
    this.colgroupContent.appendChild(col);
    this.table.appendChild(this.colgroupContent);

    this.tbody = document.createElement('tbody');
    this.table.appendChild(this.tbody);

    this.frame.appendChild(contentOuter);
};

/**
 * Find the node from an event target
 * @param {Element} target
 * @return {JSONEditor.Node | undefined} node  or undefined when not found
 */
JSONEditor.getNodeFromTarget = function (target) {
    while (target) {
        if (target.node) {
            return target.node;
        }
        target = target.parentNode;
    }

    return undefined;
};

/**
 * Create a JSONFormatter and attach it to given container
 * @constructor JSONFormatter
 * @param {Element} container
 */
JSONFormatter = function (container) {
    // check availability of JSON parser (not available in IE7 and older)
    if (!JSON) {
        throw new Error('Your browser does not support JSON. \n\n' +
            'Please install the newest version of your browser.\n' +
            '(all modern browsers support JSON).');
    }

    this.container = container;

    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.frame = document.createElement('div');
    this.frame.className = "jsoneditor-frame";
    this.frame.onclick = function (event) {
        // prevent default submit action when JSONFormatter is located inside a form
        JSONEditor.Events.preventDefault(event);
    };

    // create menu
    this.menu = document.createElement('div');
    this.menu.className = 'jsoneditor-menu';
    this.frame.appendChild(this.menu);

    // create format button
    var buttonFormat = document.createElement('button');
    //buttonFormat.innerHTML = 'Format';
    buttonFormat.className = 'jsoneditor-menu jsoneditor-format';
    buttonFormat.title = 'Format JSON data, with proper indentation and line feeds';
    //buttonFormat.className = 'jsoneditor-button';
    this.menu.appendChild(buttonFormat);

    // create compact button
    var buttonCompact = document.createElement('button');
    //buttonCompact.innerHTML = 'Compact';
    buttonCompact.className = 'jsoneditor-menu jsoneditor-compact';
    buttonCompact.title = 'Compact JSON data, remove all whitespaces';
    //buttonCompact.className = 'jsoneditor-button';
    this.menu.appendChild(buttonCompact);

    this.content = document.createElement('div');
    this.content.className = 'jsonformatter-content';
    this.frame.appendChild(this.content);

    this.textarea = document.createElement('textarea');
    this.textarea.className = "jsonformatter-textarea";
    this.textarea.spellcheck = false;
    this.content.appendChild(this.textarea);

    var textarea = this.textarea;
    /* TODO: register onchange
    var formatter = this;
    var onChange = function () {
        formatter._checkChange();
    };
    this.textarea.onchange = onChange;
    this.textarea.onkeyup = onChange;
    this.textarea.oncut = onChange;
    this.textarea.oncopy = onChange;
    this.textarea.onpaste = onChange;
    this.textarea.onchange = function () {
        console.log('onchange');
    }
    this.textarea.ondomcharacterdatamodified = function () {
        console.log('DOMCharacterDataModified');
    }
    this.textarea.ondomattrmodified = function () {
        console.log('DOMAttrModified');
    }
    addEventListener(this.textarea, 'DOMAttrModified', function (event) {
        console.log('DOMAttrModified', event);
    });
    addEventListener(this.textarea, 'DOMCharacterDataModified', function (event) {
        console.log('DOMCharacterDataModified', event);
    });
    */

    var me = this;
    buttonFormat.onclick = function () {
        try {
            textarea.value = JSON.stringify(JSON.parse(textarea.value), null, '  ');
        }
        catch (err) {
            me.onError(err);
        }
    };
    buttonCompact.onclick = function () {
        try {
            textarea.value = JSON.stringify(JSON.parse(textarea.value));
        }
        catch (err) {
            me.onError(err);
        }
    };

    this.container.appendChild(this.frame);
};

/**
 * This method is executed on error.
 * It can be overwritten for each instance of the JSONFormatter
 * @param {String} err
 */
JSONFormatter.prototype.onError = function(err) {
    // action should be implemented for the instance
};

/**
 * Check if the contents are changed
 * @private
 */
JSONFormatter.prototype._checkChange = function() {
    var content = this.textarea.value;

    if (content != this.lastContent) {
        this.lastContent = content;
        // TODO: implement onChangeCallback
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    }
};

/**
 * Set json data in the formatter
 * @param {Object} json
 */
JSONFormatter.prototype.set = function(json) {
    this.textarea.value = JSON.stringify(json, null, '  ');
};

/**
 * Get json data from the formatter
 * @return {Object} json
 */
JSONFormatter.prototype.get = function() {
    return JSON.parse(this.textarea.value);
};

/**
 * Set a callback method for the onchange event
 * @return {function} callback
 */
/* TODO: setOnChangeCallback
 JSONFormatter.prototype.setOnChangeCallback = function(callback) {
 this.onChangeCallback = callback;
 console.log(this.onChangeCallback, callback)
 }
 */


/**
 * @constructor JSONEditor.SearchBox
 * Create a search box in given HTML container
 * @param {Element} container   HTML container element of where to create the
 *                              search box
 */
JSONEditor.SearchBox = function(editor, container) {
    var searchBox = this;

    this.editor = editor;
    this.timeout = undefined;
    this.delay = 200; // ms
    this.lastText = undefined;

    this.dom = {};
    this.dom.container = container;

    var table = document.createElement('table');
    this.dom.table = table;
    table.className = 'jsoneditor-search';
    container.appendChild(table);
    var tbody = document.createElement('tbody');
    this.dom.tbody = tbody;
    table.appendChild(tbody);
    var tr = document.createElement('tr');
    tbody.appendChild(tr);

    var td = document.createElement('td');
    td.className = 'jsoneditor-search';
    tr.appendChild(td);
    var results = document.createElement('div');
    this.dom.results = results;
    results.className = 'jsoneditor-search-results';
    td.appendChild(results);

    td = document.createElement('td');
    td.className = 'jsoneditor-search';
    tr.appendChild(td);
    var divInput = document.createElement('div');
    this.dom.input = divInput;
    divInput.className = 'jsoneditor-search';
    divInput.title = 'Search fields and values';
    td.appendChild(divInput);

    // table to contain the text input and search button
    var tableInput = document.createElement('table');
    tableInput.className = 'jsoneditor-search-input';
    divInput.appendChild(tableInput);
    var tbodySearch = document.createElement('tbody');
    tableInput.appendChild(tbodySearch);
    tr = document.createElement('tr');
    tbodySearch.appendChild(tr);

    var refreshSearch = document.createElement('button');
    refreshSearch.className = 'jsoneditor-search-refresh';
    td = document.createElement('td');
    td.appendChild(refreshSearch);
    tr.appendChild(td);

    var search = document.createElement('input');
    this.dom.search = search;
    search.className = 'jsoneditor-search';
    search.oninput = function (event) {
        searchBox.onDelayedSearch(event);
    };
    search.onchange = function (event) { // For IE 8
        searchBox.onSearch(event);
    };
    search.onkeydown = function (event) {
        searchBox.onKeyDown(event);
    };
    search.onkeyup = function (event) {
        searchBox.onKeyUp(event);
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
    searchNext.className = 'jsoneditor-search-next';
    searchNext.onclick = function () {
        searchBox.next();
    };
    td = document.createElement('td');
    td.appendChild(searchNext);
    tr.appendChild(td);

    var searchPrevious = document.createElement('button');
    searchPrevious.title = 'Previous result (Shift+Enter)';
    searchPrevious.className = 'jsoneditor-search-previous';
    searchPrevious.onclick = function () {
        searchBox.previous();
    };
    td = document.createElement('td');
    td.appendChild(searchPrevious);
    tr.appendChild(td);

};

/**
 * Go to the next search result
 */
JSONEditor.SearchBox.prototype.next = function() {
    if (this.results != undefined) {
        var index = (this.resultIndex != undefined) ? this.resultIndex + 1 : 0;
        if (index > this.results.length - 1) {
            index = 0;
        }
        this.setActiveResult(index);
    }
};

/**
 * Go to the prevous search result
 */
JSONEditor.SearchBox.prototype.previous = function() {
    if (this.results != undefined) {
        var max = this.results.length - 1;
        var index = (this.resultIndex != undefined) ? this.resultIndex - 1 : max;
        if (index < 0) {
            index = max;
        }
        this.setActiveResult(index);
    }
};

/**
 * Set new value for the current active result
 * @param {Number} index
 */
JSONEditor.SearchBox.prototype.setActiveResult = function(index) {
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

    node.scrollTo();
};

/**
 * Set the focus to the currently active result. If there is no currently
 * active result, the next search result will get focus
 */
JSONEditor.SearchBox.prototype.focusActiveResult = function() {
    if (!this.activeResult) {
        this.next();
    }

    if (this.activeResult) {
        this.activeResult.node.focus(this.activeResult.elem);
    }
};

/**
 * Cancel any running onDelayedSearch.
 */
JSONEditor.SearchBox.prototype.clearDelay = function() {
    if (this.timeout != undefined) {
        clearTimeout(this.timeout);
        delete this.timeout;
    }
};

/**
 * Start a timer to execute a search after a short delay.
 * Used for reducing the number of searches while typing.
 * @param {Event} event
 */
JSONEditor.SearchBox.prototype.onDelayedSearch = function (event) {
    // execute the search after a short delay (reduces the number of
    // search actions while typing in the search text box)
    this.clearDelay();
    var searchBox = this;
    this.timeout = setTimeout(function (event) {
            searchBox.onSearch(event);
        },
        this.delay);
};

/**
 * Handle onSearch event
 * @param {Event} event
 * @param {boolean} [forceSearch]  If true, search will be executed again even
 *                                 when the search text is not changed.
 *                                 Default is false.
 */
JSONEditor.SearchBox.prototype.onSearch = function (event, forceSearch) {
    this.clearDelay();

    var value = this.dom.search.value;
    var text = (value.length > 0) ? value : undefined;
    if (text != this.lastText || forceSearch) {
        // only search again when changed
        this.lastText = text;
        this.results = editor.search(text);
        this.setActiveResult(undefined);

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
 */
JSONEditor.SearchBox.prototype.onKeyDown = function (event) {
    event = event || window.event;
    var keynum = event.which || event.keyCode;
    if (keynum == 27) { // ESC
        this.dom.search.value = '';  // clear search
        this.onSearch(event);
        JSONEditor.Events.preventDefault(event);
        JSONEditor.Events.stopPropagation(event);
    }
    else if (keynum == 13) { // Enter
        if (event.ctrlKey) {
            // force to search again
            this.onSearch(event, true);
        }
        else if (event.shiftKey) {
            // move to the previous search result
            this.previous();
        }
        else {
            // move to the next search result
            this.next();
        }
        JSONEditor.Events.preventDefault(event);
        JSONEditor.Events.stopPropagation(event);
    }
};

/**
 * Handle onKeyUp event in the input box
 * @param {Event} event
 */
JSONEditor.SearchBox.prototype.onKeyUp = function (event) {
    event = event || window.event;
    var keynum = event.which || event.keyCode;
    if (keynum != 27 && keynum != 13) { // !ESC and !Enter
        this.onDelayedSearch(event);   // For IE 8
    }
};

// create namespace for event methods
JSONEditor.Events = {};

/**
 * Add and event listener. Works for all browsers
 * @param {Element}     element    An html element
 * @param {string}      action     The action, for example "click",
 *                                 without the prefix "on"
 * @param {function}    listener   The callback function to be executed
 * @param {boolean}     useCapture
 * @return {function}   the created event listener
 */
JSONEditor.Events.addEventListener = function (element, action, listener, useCapture) {
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
 * @param {boolean}  useCapture
 */
JSONEditor.Events.removeEventListener = function(element, action, listener, useCapture) {
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
JSONEditor.Events.stopPropagation = function (event) {
    if (!event)
        event = window.event;

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
JSONEditor.Events.preventDefault = function (event) {
    if (!event)
        event = window.event;

    if (event.preventDefault) {
        event.preventDefault();  // non-IE browsers
    }
    else {
        event.returnValue = false;  // IE browsers
    }
};



/**
 * Retrieve the absolute left value of a DOM element
 * @param {Element} elem    A dom element, for example a div
 * @return {Number} left    The absolute left position of this element
 *                          in the browser page.
 */
JSONEditor.getAbsoluteLeft = function (elem) {
    var left = 0;
    var body = document.body;
    while (elem != null && elem != body) {
        left += elem.offsetLeft;
        left -= elem.scrollLeft;
        elem = elem.offsetParent;
    }
    return left;
};

/**
 * Retrieve the absolute top value of a DOM element
 * @param {Element} elem    A dom element, for example a div
 * @return {Number} top    The absolute top position of this element
 *                          in the browser page.
 */
JSONEditor.getAbsoluteTop = function (elem) {
    var top = 0;
    var body = document.body;
    while (elem != null && elem != body) {
        top += elem.offsetTop;
        top -= elem.scrollTop;
        elem = elem.offsetParent;
    }
    return top;
};

/**
 * add a className to the given elements style
 * @param {Element} elem
 * @param {String} className
 */
JSONEditor.addClassName = function(elem, className) {
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
JSONEditor.removeClassName = function(elem, className) {
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
JSONEditor.stripFormatting = function (divElement) {
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
        JSONEditor.stripFormatting(child);
    }
};

/**
 * Set focus to the end of an editable div
 * code from Nico Burns
 * http://stackoverflow.com/users/140293/nico-burns
 * http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
 * @param {Element} contentEditableElement
 */
JSONEditor.setEndOfContentEditable = function (contentEditableElement) {
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
 * Get the inner text of an HTML element (for example a div element)
 * @param {Element} element
 * @param {Object} [buffer]
 * @return {String} innerText
 */
JSONEditor.getInnerText = function (element, buffer) {
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
                innerText += JSONEditor.getInnerText(child, buffer);
                buffer.set('\n');
            }
            else if (child.nodeName == 'BR') {
                innerText += buffer.flush();
                buffer.set('\n');
            }
            else {
                innerText += JSONEditor.getInnerText(child, buffer);
            }
        }

        return innerText;
    }
    else {
        if (element.nodeName == 'P' && JSONEditor.getInternetExplorerVersion() != -1) {
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
JSONEditor._ieVersion = undefined;
JSONEditor.getInternetExplorerVersion = function() {
    if (JSONEditor._ieVersion == undefined) {
        var rv = -1; // Return value assumes failure.
        if (navigator.appName == 'Microsoft Internet Explorer')
        {
            var ua = navigator.userAgent;
            var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null) {
                rv = parseFloat( RegExp.$1 );
            }
        }

        JSONEditor._ieVersion = rv;
    }

    return JSONEditor._ieVersion;
};

JSONEditor.ieVersion = JSONEditor.getInternetExplorerVersion();
