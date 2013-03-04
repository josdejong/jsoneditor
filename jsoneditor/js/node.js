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
 * @constructor jsoneditor.Node
 * Create a new Node
 * @param {JSONEditor} editor
 * @param {Object} [params] Can contain parameters:
 *                          {string}  field
 *                          {boolean} fieldEditable
 *                          {*}       value
 *                          {String}  type  Can have values 'auto', 'array',
 *                                          'object', or 'string'.
 */
jsoneditor.Node = function (editor, params) {
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
 * @param {jsoneditor.Node} parent
 */
jsoneditor.Node.prototype.setParent = function(parent) {
    this.parent = parent;
};

/**
 * Set field
 * @param {String}  field
 * @param {boolean} [fieldEditable]
 */
jsoneditor.Node.prototype.setField = function(field, fieldEditable) {
    this.field = field;
    this.fieldEditable = (fieldEditable == true);
};

/**
 * Get field
 * @return {String}
 */
jsoneditor.Node.prototype.getField = function() {
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
jsoneditor.Node.prototype.setValue = function(value, type) {
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
                child = new jsoneditor.Node(this.editor, {
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
                    child = new jsoneditor.Node(this.editor, {
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
jsoneditor.Node.prototype.getValue = function() {
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
jsoneditor.Node.prototype.getLevel = function() {
    return (this.parent ? this.parent.getLevel() + 1 : 0);
};

/**
 * Create a clone of a node
 * The complete state of a clone is copied, including whether it is expanded or
 * not. The DOM elements are not cloned.
 * @return {jsoneditor.Node} clone
 */
jsoneditor.Node.prototype.clone = function() {
    var clone = new jsoneditor.Node(this.editor);
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
jsoneditor.Node.prototype.expand = function(recurse) {
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
jsoneditor.Node.prototype.collapse = function(recurse) {
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
jsoneditor.Node.prototype.showChilds = function() {
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
jsoneditor.Node.prototype.hide = function() {
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
jsoneditor.Node.prototype.hideChilds = function() {
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
 * @param {jsoneditor.Node} node
 */
jsoneditor.Node.prototype.appendChild = function(node) {
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
 * @param {jsoneditor.Node} node
 * @param {jsoneditor.Node} beforeNode
 */
jsoneditor.Node.prototype.moveBefore = function(node, beforeNode) {
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

        if (beforeNode instanceof jsoneditor.AppendNode) {
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
 * @param {jsoneditor.Node} node
 * @param {Number} index
 */
jsoneditor.Node.prototype.moveTo = function (node, index) {
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
 * @param {jsoneditor.Node} node
 * @param {jsoneditor.Node} beforeNode
 */
jsoneditor.Node.prototype.insertBefore = function(node, beforeNode) {
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
 * @param {jsoneditor.Node} node
 * @param {jsoneditor.Node} afterNode
 */
jsoneditor.Node.prototype.insertAfter = function(node, afterNode) {
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
 * @return {jsoneditor.Node[]} results  Array with nodes containing the search text
 */
jsoneditor.Node.prototype.search = function(text) {
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
jsoneditor.Node.prototype.scrollTo = function(callback) {
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
jsoneditor.Node.focusElement = undefined;

/**
 * Set focus to this node
 * @param {String} [elementName]  The field name of the element to get the
 *                                focus available values: 'drag', 'menu',
 *                                'expand', 'field', 'value' (default)
 */
jsoneditor.Node.prototype.focus = function(elementName) {
    jsoneditor.Node.focusElement = elementName;

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
                    jsoneditor.util.selectContentEditable(dom.field);
                }
                else if (dom.value && !this._hasChilds()) {
                    dom.value.focus();
                    jsoneditor.util.selectContentEditable(dom.value);
                }
                else {
                    dom.menu.focus();
                }
                break;

            case 'field':
                if (dom.field && this.fieldEditable) {
                    dom.field.focus();
                    jsoneditor.util.selectContentEditable(dom.field);
                }
                else if (dom.value && !this._hasChilds()) {
                    dom.value.focus();
                    jsoneditor.util.selectContentEditable(dom.value);
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
                    jsoneditor.util.selectContentEditable(dom.value);
                }
                else if (dom.field && this.fieldEditable) {
                    dom.field.focus();
                    jsoneditor.util.selectContentEditable(dom.field);
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
jsoneditor.Node.select = function(editableDiv) {
    setTimeout(function () {
        jsoneditor.util.selectContentEditable(editableDiv);
    }, 0);
};

/**
 * Update the values from the DOM field and value of this node
 */
jsoneditor.Node.prototype.blur = function() {
    // retrieve the actual field and value from the DOM.
    this._getDomValue(false);
    this._getDomField(false);
};

/**
 * Duplicate given child node
 * new structure will be added right before the cloned node
 * @param {jsoneditor.Node} node           the childNode to be duplicated
 * @return {jsoneditor.Node} clone         the clone of the node
 * @private
 */
jsoneditor.Node.prototype._duplicate = function(node) {
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
 * @param {jsoneditor.Node} node
 * @return {boolean} containsNode
 */
jsoneditor.Node.prototype.containsNode = function(node) {
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
 * @param {jsoneditor.Node} node           the childNode to be moved
 * @param {jsoneditor.Node} beforeNode     node will be inserted before given
 *                                         node. If no beforeNode is given,
 *                                         the node is appended at the end
 * @private
 */
jsoneditor.Node.prototype._move = function(node, beforeNode) {
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
 * @param {jsoneditor.Node} node   The child node to be removed;
 * @return {jsoneditor.Node | undefined} node  The removed node on success,
 *                                             else undefined
 */
jsoneditor.Node.prototype.removeChild = function(node) {
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
 * @param {jsoneditor.Node} node
 * @private
 */
jsoneditor.Node.prototype._remove = function (node) {
    this.removeChild(node);
};

/**
 * Change the type of the value of this Node
 * @param {String} newType
 */
jsoneditor.Node.prototype.changeType = function (newType) {
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
jsoneditor.Node.prototype._getDomValue = function(silent) {
    if (this.dom.value && this.type != 'array' && this.type != 'object') {
        this.valueInnerText = jsoneditor.util.getInnerText(this.dom.value);
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
jsoneditor.Node.prototype._updateDomValue = function () {
    var domValue = this.dom.value;
    if (domValue) {
        // set text color depending on value type
        // TODO: put colors in css
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
            color = 'orange';
        }
        else if (this._hasChilds()) {
            // note: typeof(null)=="object", therefore check this.type instead of t
            color = '';
        }
        else if (v === null) {
            color = 'blue';
        }
        else {
            // invalid value
            color = 'black';
        }
        domValue.style.color = color;

        // make backgound color lightgray when empty
        var isEmpty = (String(this.value) == '' && this.type != 'array' && this.type != 'object');
        if (isEmpty) {
            jsoneditor.util.addClassName(domValue, 'empty');
        }
        else {
            jsoneditor.util.removeClassName(domValue, 'empty');
        }

        // highlight when there is a search result
        if (this.searchValueActive) {
            jsoneditor.util.addClassName(domValue, 'highlight-active');
        }
        else {
            jsoneditor.util.removeClassName(domValue, 'highlight-active');
        }
        if (this.searchValue) {
            jsoneditor.util.addClassName(domValue, 'highlight');
        }
        else {
            jsoneditor.util.removeClassName(domValue, 'highlight');
        }

        // strip formatting from the contents of the editable div
        jsoneditor.util.stripFormatting(domValue);
    }
};

/**
 * Update dom field:
 * - the text color of the field, depending on the text
 * - the height of the field, depending on the width
 * - background color in case it is empty
 * @private
 */
jsoneditor.Node.prototype._updateDomField = function () {
    var domField = this.dom.field;
    if (domField) {
        // make backgound color lightgray when empty
        var isEmpty = (String(this.field) == '' && this.parent.type != 'array');
        if (isEmpty) {
            jsoneditor.util.addClassName(domField, 'empty');
        }
        else {
            jsoneditor.util.removeClassName(domField, 'empty');
        }

        // highlight when there is a search result
        if (this.searchFieldActive) {
            jsoneditor.util.addClassName(domField, 'highlight-active');
        }
        else {
            jsoneditor.util.removeClassName(domField, 'highlight-active');
        }
        if (this.searchField) {
            jsoneditor.util.addClassName(domField, 'highlight');
        }
        else {
            jsoneditor.util.removeClassName(domField, 'highlight');
        }

        // strip formatting from the contents of the editable div
        jsoneditor.util.stripFormatting(domField);
    }
};

/**
 * Retrieve field from DOM
 * @param {boolean} [silent]  If true (default), no errors will be thrown in
 *                            case of invalid data
 * @private
 */
jsoneditor.Node.prototype._getDomField = function(silent) {
    if (this.dom.field && this.fieldEditable) {
        this.fieldInnerText = jsoneditor.util.getInnerText(this.dom.field);
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
jsoneditor.Node.prototype.clearDom = function() {
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
jsoneditor.Node.prototype.getDom = function() {
    var dom = this.dom;
    if (dom.tr) {
        return dom.tr;
    }

    // create row
    dom.tr = document.createElement('tr');
    dom.tr.node = this;

    if (this.editor.mode.editor) {
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
jsoneditor.Node.prototype._onDragStart = function (event) {
    event = event || window.event;

    var node = this;
    if (!this.mousemove) {
        this.mousemove = jsoneditor.util.addEventListener(document, 'mousemove',
            function (event) {
                node._onDrag(event);
            });
    }

    if (!this.mouseup) {
        this.mouseup = jsoneditor.util.addEventListener(document, 'mouseup',
            function (event ) {
                node._onDragEnd(event);
            });
    }

    this.editor.highlighter.lock();
    this.drag = {
        'oldCursor': document.body.style.cursor,
        'startParent': this.parent,
        'startIndex': this.parent.childs.indexOf(this),
        'mouseX': jsoneditor.util.getMouseX(event),
        'level': this.getLevel()
    };
    document.body.style.cursor = 'move';

    jsoneditor.util.preventDefault(event);
};

/**
 * Drag event, fired when moving the mouse while dragging a Node
 * @param {Event} event
 * @private
 */
jsoneditor.Node.prototype._onDrag = function (event) {
    // TODO: this method has grown to large. Split it in a number of methods
    event = event || window.event;
    // TODO: make a separate function to get the absolute mouseY and mouseX
    var mouseY = jsoneditor.util.getMouseY(event);
    var mouseX = jsoneditor.util.getMouseX(event);

    var trThis, trPrev, trNext, trFirst, trLast, trRoot;
    var nodePrev, nodeNext;
    var topThis, topPrev, topFirst, heightThis, bottomNext, heightNext;
    var moved = false;

    // TODO: add an ESC option, which resets to the original position

    // move up/down
    trThis = this.dom.tr;
    topThis = jsoneditor.util.getAbsoluteTop(trThis);
    heightThis = trThis.offsetHeight;
    if (mouseY < topThis) {
        // move up
        trPrev = trThis;
        do {
            trPrev = trPrev.previousSibling;
            nodePrev = jsoneditor.Node.getNodeFromTarget(trPrev);
            topPrev = trPrev ? jsoneditor.util.getAbsoluteTop(trPrev) : 0;
        }
        while (trPrev && mouseY < topPrev);

        if (nodePrev && !nodePrev.parent) {
            nodePrev = undefined;
        }

        if (!nodePrev) {
            // move to the first node
            trRoot = trThis.parentNode.firstChild;
            trPrev = trRoot ? trRoot.nextSibling : undefined;
            nodePrev = jsoneditor.Node.getNodeFromTarget(trPrev);
            if (nodePrev == this) {
                nodePrev = undefined;
            }
        }

        if (nodePrev) {
            // check if mouseY is really inside the found node
            trPrev = nodePrev.dom.tr;
            topPrev = trPrev ? jsoneditor.util.getAbsoluteTop(trPrev) : 0;
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
            topFirst = jsoneditor.util.getAbsoluteTop(trFirst);
            trNext = trFirst;
            do {
                nodeNext = jsoneditor.Node.getNodeFromTarget(trNext);
                if (trNext) {
                    bottomNext = trNext.nextSibling ?
                        jsoneditor.util.getAbsoluteTop(trNext.nextSibling) : 0;
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
                    nodePrev = jsoneditor.Node.getNodeFromTarget(trPrev);
                    if (nodePrev == this || nodePrev._isChildOf(this)) {
                        // neglect itself and its childs
                    }
                    else if (nodePrev instanceof jsoneditor.AppendNode) {
                        var childs = nodePrev.parent.childs;
                        if (childs.length > 1 ||
                            (childs.length == 1 && childs[0] != this)) {
                            // non-visible append node of a list of childs
                            // consisting of not only this node (else the
                            // append node will change into a visible "empty"
                            // text when removing this node).
                            nodeNext = jsoneditor.Node.getNodeFromTarget(trPrev);
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

    jsoneditor.util.preventDefault(event);
};

/**
 * Drag event, fired on mouseup after having dragged a node
 * @param {Event} event
 * @private
 */
jsoneditor.Node.prototype._onDragEnd = function (event) {
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
        jsoneditor.util.removeEventListener(document, 'mousemove', this.mousemove);
        delete this.mousemove;}
    if (this.mouseup) {
        jsoneditor.util.removeEventListener(document, 'mouseup', this.mouseup);
        delete this.mouseup;
    }

    // Stop any running auto scroll
    this.editor.stopAutoScroll();

    jsoneditor.util.preventDefault(event);
};

/**
 * Test if this node is a child of an other node
 * @param {jsoneditor.Node} node
 * @return {boolean} isChild
 * @private
 */
jsoneditor.Node.prototype._isChildOf = function (node) {
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
jsoneditor.Node.prototype._createDomField = function () {
    return document.createElement('div');
};

/**
 * Set highlighting for this node and all its childs.
 * Only applied to the currently visible (expanded childs)
 * @param {boolean} highlight
 */
jsoneditor.Node.prototype.setHighlight = function (highlight) {
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
jsoneditor.Node.prototype.updateValue = function (value) {
    this.value = value;
    this.updateDom();
};

/**
 * Update the field of the node.
 * @param {String} field
 */
jsoneditor.Node.prototype.updateField = function (field) {
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
jsoneditor.Node.prototype.updateDom = function (options) {
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
            domField.contentEditable = this.editor.mode.editor;
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
jsoneditor.Node.prototype._updateDomIndexes = function () {
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
jsoneditor.Node.prototype._createDomValue = function () {
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
    else if (this.type == 'string') {
        domValue = document.createElement('div');
        domValue.contentEditable = !this.editor.mode.viewer;
        domValue.spellcheck = false;
        domValue.className = 'value';
        domValue.innerHTML = this._escapeHTML(this.value);
    }
    else {
        domValue = document.createElement('div');
        domValue.contentEditable = !this.editor.mode.viewer;
        domValue.spellcheck = false;
        domValue.className = 'value';
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
jsoneditor.Node.prototype._createDomExpandButton = function () {
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
jsoneditor.Node.prototype._createDomTree = function () {
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
jsoneditor.Node.prototype.onEvent = function (event) {
    var type = event.type;
    var target = event.target || event.srcElement;
    var dom = this.dom;
    var node = this;
    var expandable = this._hasChilds();

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
        jsoneditor.util.addClassName(dom.menu, 'selected');
        this.showContextMenu(dom.menu, function () {
            jsoneditor.util.removeClassName(dom.menu, 'selected');
            highlighter.unlock();
            highlighter.unhighlight();
        });
    }

    // expand events
    var domExpand = dom.expand;
    if (type == 'click' && target == dom.expand) {
        if (expandable) {
            var recurse = event.ctrlKey; // with ctrl-key, expand/collapse all
            this._onExpand(recurse);
        }
    }

    // value events
    var domValue = dom.value;
    if (target == domValue) {
        switch (type) {
            case 'focus':
                jsoneditor.JSONEditor.focusNode = this;
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
                jsoneditor.JSONEditor.focusNode = this;
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
                    (jsoneditor.util.getMouseX(event) < jsoneditor.util.getAbsoluteLeft(dom.tdSeparator));// for FF
                if (left || expandable) {
                    // node is expandable when it is an object or array
                    if (domField) {
                        jsoneditor.util.setEndOfContentEditable(domField);
                        domField.focus();
                    }
                }
                else {
                    if (domValue) {
                        jsoneditor.util.setEndOfContentEditable(domValue);
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
                    jsoneditor.util.setEndOfContentEditable(domField);
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
jsoneditor.Node.prototype.onKeyDown = function (event) {
    var keynum = event.which || event.keyCode;
    var target = event.target || event.srcElement;
    var ctrlKey = event.ctrlKey;
    var shiftKey = event.shiftKey;
    var altKey = event.altKey;
    var handled = false;
    var prevNode, nextNode, nextDom, nextDom2;

    // console.log(ctrlKey, keynum, event.charCode); // TODO: cleanup
    if (keynum == 68) {  // D
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
                lastNode.focus(jsoneditor.Node.focusElement || this._getElementName(target));
            }
            handled = true;
        }
    }
    else if (keynum == 36) { // Home
        if (altKey) { // Alt+Home
            // find the first node
            var firstNode = this._firstNode();
            if (firstNode) {
                firstNode.focus(jsoneditor.Node.focusElement || this._getElementName(target));
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
                nextNode = jsoneditor.Node.getNodeFromTarget(nextDom);
                nextDom2 = nextDom.nextSibling;
                nextNode2 = jsoneditor.Node.getNodeFromTarget(nextDom2);
                if (nextNode && nextNode instanceof jsoneditor.AppendNode &&
                        !(this.parent.childs.length == 1) &&
                        nextNode2 && nextNode2.parent) {
                    nextNode2.parent.moveBefore(this, nextNode2);
                    this.focus(jsoneditor.Node.focusElement || this._getElementName(target));
                }
            }
        }
    }
    else if (keynum == 38) {        // Arrow Up
        if (altKey && !shiftKey) {  // Alt + Arrow Up
            // find the previous node
            prevNode = this._previousNode();
            if (prevNode) {
                prevNode.focus(jsoneditor.Node.focusElement || this._getElementName(target));
            }
            handled = true;
        }
        else if (altKey && shiftKey) { // Alt + Shift + Arrow Up
            // find the previous node
            prevNode = this._previousNode();
            if (prevNode && prevNode.parent) {
                prevNode.parent.moveBefore(this, prevNode);
                this.focus(jsoneditor.Node.focusElement || this._getElementName(target));
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
                prevNode = jsoneditor.Node.getNodeFromTarget(prevDom);
                if (prevNode && prevNode.parent &&
                        (prevNode instanceof jsoneditor.AppendNode)
                        && !prevNode.isVisible()) {
                    prevNode.parent.moveBefore(this, prevNode);
                    this.focus(jsoneditor.Node.focusElement || this._getElementName(target));
                }
            }
        }
    }
    else if (keynum == 40) {        // Arrow Down
        if (altKey && !shiftKey) {  // Alt + Arrow Down
            // find the next node
            nextNode = this._nextNode();
            if (nextNode) {
                nextNode.focus(jsoneditor.Node.focusElement || this._getElementName(target));
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
            var nextNode2 = jsoneditor.Node.getNodeFromTarget(nextDom2);
            if (nextNode2 && nextNode2.parent) {
                nextNode2.parent.moveBefore(this, nextNode2);
                this.focus(jsoneditor.Node.focusElement || this._getElementName(target));
            }
            handled = true;
        }
    }

    if (handled) {
        jsoneditor.util.preventDefault(event);
        jsoneditor.util.stopPropagation(event);
    }
};

/**
 * Handle the expand event, when clicked on the expand button
 * @param {boolean} recurse   If true, child nodes will be expanded too
 * @private
 */
jsoneditor.Node.prototype._onExpand = function (recurse) {
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
jsoneditor.Node.prototype._onRemove = function() {
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
jsoneditor.Node.prototype._onDuplicate = function() {
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
jsoneditor.Node.prototype._onInsertBefore = function (field, value, type) {
    var oldSelection = this.editor.getSelection();

    var newNode = new jsoneditor.Node(this.editor, {
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
jsoneditor.Node.prototype._onInsertAfter = function (field, value, type) {
    var oldSelection = this.editor.getSelection();

    var newNode = new jsoneditor.Node(this.editor, {
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
jsoneditor.Node.prototype._onAppend = function (field, value, type) {
    var oldSelection = this.editor.getSelection();

    var newNode = new jsoneditor.Node(this.editor, {
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
jsoneditor.Node.prototype._onChangeType = function (newType) {
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
jsoneditor.Node.prototype._onSort = function (direction) {
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
jsoneditor.Node.prototype.getAppend = function () {
    if (!this.append) {
        this.append = new jsoneditor.AppendNode(this.editor);
        this.append.setParent(this);
    }
    return this.append.getDom();
};

/**
 * Find the node from an event target
 * @param {Node} target
 * @return {jsoneditor.Node | undefined} node  or undefined when not found
 * @static
 */
jsoneditor.Node.getNodeFromTarget = function (target) {
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
 * @return {jsoneditor.Node | null} previousNode
 * @private
 */
jsoneditor.Node.prototype._previousNode = function () {
    var prevNode = null;
    var dom = this.getDom();
    if (dom && dom.parentNode) {
        // find the previous field
        var prevDom = dom;
        do {
            prevDom = prevDom.previousSibling;
            prevNode = jsoneditor.Node.getNodeFromTarget(prevDom);
        }
        while (prevDom && (prevNode instanceof jsoneditor.AppendNode && !prevNode.isVisible()));
    }
    return prevNode;
};

/**
 * Get the next rendered node
 * @return {jsoneditor.Node | null} nextNode
 * @private
 */
jsoneditor.Node.prototype._nextNode = function () {
    var nextNode = null;
    var dom = this.getDom();
    if (dom && dom.parentNode) {
        // find the previous field
        var nextDom = dom;
        do {
            nextDom = nextDom.nextSibling;
            nextNode = jsoneditor.Node.getNodeFromTarget(nextDom);
        }
        while (nextDom && (nextNode instanceof jsoneditor.AppendNode && !nextNode.isVisible()));
    }

    return nextNode;
};

/**
 * Get the first rendered node
 * @return {jsoneditor.Node | null} firstNode
 * @private
 */
jsoneditor.Node.prototype._firstNode = function () {
    var firstNode = null;
    var dom = this.getDom();
    if (dom && dom.parentNode) {
        var firstDom = dom.parentNode.firstChild;
        firstNode = jsoneditor.Node.getNodeFromTarget(firstDom);
    }

    return firstNode;
};

/**
 * Get the last rendered node
 * @return {jsoneditor.Node | null} lastNode
 * @private
 */
jsoneditor.Node.prototype._lastNode = function () {
    var lastNode = null;
    var dom = this.getDom();
    if (dom && dom.parentNode) {
        var lastDom = dom.parentNode.lastChild;
        lastNode =  jsoneditor.Node.getNodeFromTarget(lastDom);
        while (lastDom && (lastNode instanceof jsoneditor.AppendNode && !lastNode.isVisible())) {
            lastDom = lastDom.previousSibling;
            lastNode =  jsoneditor.Node.getNodeFromTarget(lastDom);
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
jsoneditor.Node.prototype._previousElement = function (elem) {
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
jsoneditor.Node.prototype._nextElement = function (elem) {
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
jsoneditor.Node.prototype._getElementName = function (element) {
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
jsoneditor.Node.prototype._hasChilds = function () {
    return this.type == 'array' || this.type == 'object';
};

// titles with explanation for the different types
jsoneditor.Node.TYPE_TITLES = {
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
jsoneditor.Node.prototype.showContextMenu = function (anchor, onClose) {
    var node = this;
    var titles = jsoneditor.Node.TYPE_TITLES;
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
                        // TODO: settings type string does not work, will become auto
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

    var menu = new jsoneditor.ContextMenu(items, {close: onClose});
    menu.show(anchor);
};

/**
 * get the type of a value
 * @param {*} value
 * @return {String} type   Can be 'object', 'array', 'string', 'auto'
 * @private
 */
jsoneditor.Node.prototype._getType = function(value) {
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
jsoneditor.Node.prototype._stringCast = function(str) {
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
jsoneditor.Node.prototype._escapeHTML = function (text) {
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
jsoneditor.Node.prototype._unescapeHTML = function (escapedText) {
    var json = '"' + this._escapeJSON(escapedText) + '"';
    var htmlEscaped = jsoneditor.util.parse(json);
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
jsoneditor.Node.prototype._escapeJSON = function (text) {
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
