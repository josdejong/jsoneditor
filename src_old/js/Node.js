'use strict';

var naturalSort = require('javascript-natural-sort');
var ContextMenu = require('./ContextMenu');
var appendNodeFactory = require('./appendNodeFactory');
var util = require('./util');

/**
 * @constructor Node
 * Create a new Node
 * @param {./treemode} editor
 * @param {Object} [params] Can contain parameters:
 *                          {string}  field
 *                          {boolean} fieldEditable
 *                          {*}       value
 *                          {String}  type  Can have values 'auto', 'array',
 *                                          'object', or 'string'.
 */
function Node (editor, params) {
  /** @type {./treemode} */
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

  this._debouncedOnChangeValue = util.debounce(this._onChangeValue.bind(this), Node.prototype.DEBOUNCE_INTERVAL);
  this._debouncedOnChangeField = util.debounce(this._onChangeField.bind(this), Node.prototype.DEBOUNCE_INTERVAL);
}

// debounce interval for keyboard input in milliseconds
Node.prototype.DEBOUNCE_INTERVAL = 150;

/**
 * Determine whether the field and/or value of this node are editable
 * @private
 */
Node.prototype._updateEditability = function () {
  this.editable = {
    field: true,
    value: true
  };

  if (this.editor) {
    this.editable.field = this.editor.options.mode === 'tree';
    this.editable.value = this.editor.options.mode !== 'view';

    if ((this.editor.options.mode === 'tree' || this.editor.options.mode === 'form') &&
        (typeof this.editor.options.onEditable === 'function')) {
      var editable = this.editor.options.onEditable({
        field: this.field,
        value: this.value,
        path: this.getPath()
      });

      if (typeof editable === 'boolean') {
        this.editable.field = editable;
        this.editable.value = editable;
      }
      else {
        if (typeof editable.field === 'boolean') this.editable.field = editable.field;
        if (typeof editable.value === 'boolean') this.editable.value = editable.value;
      }
    }
  }
};

/**
 * Get the path of this node
 * @return {String[]} Array containing the path to this node
 */
Node.prototype.getPath = function () {
  var node = this;
  var path = [];
  while (node) {
    var field = !node.parent
        ? undefined  // do not add an (optional) field name of the root node
        :  (node.parent.type != 'array')
            ? node.field
            : node.index;

    if (field !== undefined) {
      path.unshift(field);
    }
    node = node.parent;
  }
  return path;
};

/**
 * Find a Node from a JSON path like '.items[3].name'
 * @param {string} jsonPath
 * @return {Node | null} Returns the Node when found, returns null if not found
 */
Node.prototype.findNode = function (jsonPath) {
  var path = util.parsePath(jsonPath);
  var node = this;
  while (node && path.length > 0) {
    var prop = path.shift();
    if (typeof prop === 'number') {
      if (node.type !== 'array') {
        throw new Error('Cannot get child node at index ' + prop + ': node is no array');
      }
      node = node.childs[prop];
    }
    else { // string
      if (node.type !== 'object') {
        throw new Error('Cannot get child node ' + prop + ': node is no object');
      }
      node = node.childs.filter(function (child) {
        return child.field === prop;
      })[0];
    }
  }

  return node;
};

/**
 * Find all parents of this node. The parents are ordered from root node towards
 * the original node.
 * @return {Array.<Node>}
 */
Node.prototype.findParents = function () {
  var parents = [];
  var parent = this.parent;
  while (parent) {
    parents.unshift(parent);
    parent = parent.parent;
  }
  return parents;
};

/**
 *
 * @param {{dataPath: string, keyword: string, message: string, params: Object, schemaPath: string} | null} error
 * @param {Node} [child]  When this is the error of a parent node, pointing
 *                        to an invalid child node, the child node itself
 *                        can be provided. If provided, clicking the error
 *                        icon will set focus to the invalid child node.
 */
Node.prototype.setError = function (error, child) {
  // ensure the dom exists
  this.getDom();

  this.error = error;
  var tdError = this.dom.tdError;
  if (error) {
    if (!tdError) {
      tdError = document.createElement('td');
      this.dom.tdError = tdError;
      this.dom.tdValue.parentNode.appendChild(tdError);
    }

    var popover = document.createElement('div');
    popover.className = 'jsoneditor-popover jsoneditor-right';
    popover.appendChild(document.createTextNode(error.message));

    var button = document.createElement('button');
    button.className = 'jsoneditor-schema-error';
    button.appendChild(popover);

    // update the direction of the popover
    button.onmouseover = button.onfocus = function updateDirection() {
      var directions = ['right', 'above', 'below', 'left'];
      for (var i = 0; i < directions.length; i++) {
        var direction = directions[i];
        popover.className = 'jsoneditor-popover jsoneditor-' + direction;

        var contentRect = this.editor.content.getBoundingClientRect();
        var popoverRect = popover.getBoundingClientRect();
        var margin = 20; // account for a scroll bar
        var fit = util.insideRect(contentRect, popoverRect, margin);

        if (fit) {
          break;
        }
      }
    }.bind(this);

    // when clicking the error icon, expand all nodes towards the invalid
    // child node, and set focus to the child node
    if (child) {
      button.onclick = function showInvalidNode() {
        child.findParents().forEach(function (parent) {
          parent.expand(false);
        });

        child.scrollTo(function () {
          child.focus();
        });
      };
    }

    // apply the error message to the node
    while (tdError.firstChild) {
      tdError.removeChild(tdError.firstChild);
    }
    tdError.appendChild(button);
  }
  else {
    if (tdError) {
      this.dom.tdError.parentNode.removeChild(this.dom.tdError);
      delete this.dom.tdError;
    }
  }
};

/**
 * Get the index of this node: the index in the list of childs where this
 * node is part of
 * @return {number} Returns the index, or -1 if this is the root node
 */
Node.prototype.getIndex = function () {
  return this.parent ? this.parent.childs.indexOf(this) : -1;
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
  this.previousField = field;
  this.fieldEditable = (fieldEditable === true);
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
          value: childValue
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
            field: childField,
            value: childValue
          });
          this.appendChild(child);
        }
      }
    }
    this.value = '';

    // sort object keys
    if (this.editor.options.sortObjectKeys === true) {
      this.sort('asc');
    }
  }
  else {
    // value
    this.childs = undefined;
    this.value = value;
  }

  this.previousValue = this.value;
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
 * Get path of the root node till the current node
 * @return {Node[]} Returns an array with nodes
 */
Node.prototype.getNodePath = function() {
  var path = this.parent ? this.parent.getNodePath() : [];
  path.push(this);
  return path;
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
    this.dom.expand.className = 'jsoneditor-expanded';
  }

  this.showChilds();

  if (recurse !== false) {
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
  if (recurse !== false) {
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
      removedNode.parent = null;

      this.updateDom({'updateIndexes': true});

      return removedNode;
    }
  }

  return undefined;
};

/**
 * Remove a child node node from this node
 * This method is equal to Node.removeChild, except that _remove fire an
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
        this.value = value;
        this._debouncedOnChangeValue();
      }
    }
    catch (err) {
      this.value = undefined;
      // TODO: sent an action with the new, invalid value?
      if (silent !== true) {
        throw err;
      }
    }
  }
};

/**
 * Handle a changed value
 * @private
 */
Node.prototype._onChangeValue = function () {
  // get current selection, then override the range such that we can select
  // the added/removed text on undo/redo
  var oldSelection = this.editor.getSelection();
  if (oldSelection.range) {
    var undoDiff = util.textDiff(String(this.value), String(this.previousValue));
    oldSelection.range.startOffset = undoDiff.start;
    oldSelection.range.endOffset = undoDiff.end;
  }
  var newSelection = this.editor.getSelection();
  if (newSelection.range) {
    var redoDiff = util.textDiff(String(this.previousValue), String(this.value));
    newSelection.range.startOffset = redoDiff.start;
    newSelection.range.endOffset = redoDiff.end;
  }

  this.editor._onAction('editValue', {
    node: this,
    oldValue: this.previousValue,
    newValue: this.value,
    oldSelection: oldSelection,
    newSelection: newSelection
  });

  this.previousValue = this.value;
};

/**
 * Handle a changed field
 * @private
 */
Node.prototype._onChangeField = function () {
  // get current selection, then override the range such that we can select
  // the added/removed text on undo/redo
  var oldSelection = this.editor.getSelection();
  if (oldSelection.range) {
    var undoDiff = util.textDiff(this.field, this.previousField);
    oldSelection.range.startOffset = undoDiff.start;
    oldSelection.range.endOffset = undoDiff.end;
  }
  var newSelection = this.editor.getSelection();
  if (newSelection.range) {
    var redoDiff = util.textDiff(this.previousField, this.field);
    newSelection.range.startOffset = redoDiff.start;
    newSelection.range.endOffset = redoDiff.end;
  }

  this.editor._onAction('editField', {
    node: this,
    oldValue: this.previousField,
    newValue: this.field,
    oldSelection: oldSelection,
    newSelection: newSelection
  });

  this.previousField = this.field;
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
    var classNames = ['jsoneditor-value'];


    // set text color depending on value type
    var value = this.value;
    var type = (this.type == 'auto') ? util.type(value) : this.type;
    var isUrl = type == 'string' && util.isUrl(value);
    classNames.push('jsoneditor-' + type);
    if (isUrl) {
      classNames.push('jsoneditor-url');
    }

    // visual styling when empty
    var isEmpty = (String(this.value) == '' && this.type != 'array' && this.type != 'object');
    if (isEmpty) {
      classNames.push('jsoneditor-empty');
    }

    // highlight when there is a search result
    if (this.searchValueActive) {
      classNames.push('jsoneditor-highlight-active');
    }
    if (this.searchValue) {
      classNames.push('jsoneditor-highlight');
    }

    domValue.className = classNames.join(' ');

    // update title
    if (type == 'array' || type == 'object') {
      var count = this.childs ? this.childs.length : 0;
      domValue.title = this.type + ' containing ' + count + ' items';
    }
    else if (isUrl && this.editable.value) {
      domValue.title = 'Ctrl+Click or Ctrl+Enter to open url in new window';
    }
    else {
      domValue.title = '';
    }

    // show checkbox when the value is a boolean
    if (type === 'boolean' && this.editable.value) {
      if (!this.dom.checkbox) {
        this.dom.checkbox = document.createElement('input');
        this.dom.checkbox.type = 'checkbox';
        this.dom.tdCheckbox = document.createElement('td');
        this.dom.tdCheckbox.className = 'jsoneditor-tree';
        this.dom.tdCheckbox.appendChild(this.dom.checkbox);

        this.dom.tdValue.parentNode.insertBefore(this.dom.tdCheckbox, this.dom.tdValue);
      }

      this.dom.checkbox.checked = this.value;
    }
    else {
      // cleanup checkbox when displayed
      if (this.dom.tdCheckbox) {
        this.dom.tdCheckbox.parentNode.removeChild(this.dom.tdCheckbox);
        delete this.dom.tdCheckbox;
        delete this.dom.checkbox;
      }
    }

    if (this.enum && this.editable.value) {
      // create select box when this node has an enum object
      if (!this.dom.select) {
        this.dom.select = document.createElement('select');
        this.id = this.field + "_" + new Date().getUTCMilliseconds();
        this.dom.select.id = this.id;
        this.dom.select.name = this.dom.select.id;

        //Create the default empty option
        this.dom.select.option = document.createElement('option');
        this.dom.select.option.value = '';
        this.dom.select.option.innerHTML = '--';
        this.dom.select.appendChild(this.dom.select.option);

        //Iterate all enum values and add them as options
        for(var i = 0; i < this.enum.length; i++) {
          this.dom.select.option = document.createElement('option');
          this.dom.select.option.value = this.enum[i];
          this.dom.select.option.innerHTML = this.enum[i];
          if(this.dom.select.option.value == this.value){
            this.dom.select.option.selected = true;
          }
          this.dom.select.appendChild(this.dom.select.option);
        }

        this.dom.tdSelect = document.createElement('td');
        this.dom.tdSelect.className = 'jsoneditor-tree';
        this.dom.tdSelect.appendChild(this.dom.select);
        this.dom.tdValue.parentNode.insertBefore(this.dom.tdSelect, this.dom.tdValue);
      }

      // If the enum is inside a composite type display
      // both the simple input and the dropdown field
      if(this.schema && (
          !this.schema.hasOwnProperty("oneOf") &&
          !this.schema.hasOwnProperty("anyOf") &&
          !this.schema.hasOwnProperty("allOf"))
      ) {
        this.valueFieldHTML = this.dom.tdValue.innerHTML;
        this.dom.tdValue.style.visibility = 'hidden';
        this.dom.tdValue.innerHTML = '';
      } else {
        delete this.valueFieldHTML;
      }
    }
    else {
      // cleanup select box when displayed
      if (this.dom.tdSelect) {
        this.dom.tdSelect.parentNode.removeChild(this.dom.tdSelect);
        delete this.dom.tdSelect;
        delete this.dom.select;
        this.dom.tdValue.innerHTML = this.valueFieldHTML;
        this.dom.tdValue.style.visibility = '';
        delete this.valueFieldHTML;
      }
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
      util.addClassName(domField, 'jsoneditor-empty');
    }
    else {
      util.removeClassName(domField, 'jsoneditor-empty');
    }

    // highlight when there is a search result
    if (this.searchFieldActive) {
      util.addClassName(domField, 'jsoneditor-highlight-active');
    }
    else {
      util.removeClassName(domField, 'jsoneditor-highlight-active');
    }
    if (this.searchField) {
      util.addClassName(domField, 'jsoneditor-highlight');
    }
    else {
      util.removeClassName(domField, 'jsoneditor-highlight');
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
        this.field = field;
        this._debouncedOnChangeField();
      }
    }
    catch (err) {
      this.field = undefined;
      // TODO: sent an action here, with the new, invalid value?
      if (silent !== true) {
        throw err;
      }
    }
  }
};

/**
 * Validate this node and all it's childs
 * @return {Array.<{node: Node, error: {message: string}}>} Returns a list with duplicates
 */
Node.prototype.validate = function () {
  var errors = [];

  // find duplicate keys
  if (this.type === 'object') {
    var keys = {};
    var duplicateKeys = [];
    for (var i = 0; i < this.childs.length; i++) {
      var child = this.childs[i];
      if (keys[child.field]) {
        duplicateKeys.push(child.field);
      }
      keys[child.field] = true;
    }

    if (duplicateKeys.length > 0) {
      errors = this.childs
          .filter(function (node) {
            return duplicateKeys.indexOf(node.field) !== -1;
          })
          .map(function (node) {
            return {
              node: node,
              error: {
                message: 'duplicate key "' + node.field + '"'
              }
            }
          });
    }
  }

  // recurse over the childs
  if (this.childs) {
    for (var i = 0; i < this.childs.length; i++) {
      var e = this.childs[i].validate();
      if (e.length > 0) {
        errors = errors.concat(e);
      }
    }
  }

  return errors;
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

  this._updateEditability();

  // create row
  dom.tr = document.createElement('tr');
  dom.tr.node = this;

  if (this.editor.options.mode === 'tree') { // note: we take here the global setting
    var tdDrag = document.createElement('td');
    if (this.editable.field) {
      // create draggable area
      if (this.parent) {
        var domDrag = document.createElement('button');
        dom.drag = domDrag;
        domDrag.className = 'jsoneditor-dragarea';
        domDrag.title = 'Drag to move this field (Alt+Shift+Arrows)';
        tdDrag.appendChild(domDrag);
      }
    }
    dom.tr.appendChild(tdDrag);

    // create context menu
    var tdMenu = document.createElement('td');
    var menu = document.createElement('button');
    dom.menu = menu;
    menu.className = 'jsoneditor-contextmenu';
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
 * @param {Node[] | Node} nodes
 * @param {Event} event
 */
Node.onDragStart = function (nodes, event) {
  if (!Array.isArray(nodes)) {
    return Node.onDragStart([nodes], event);
  }
  if (nodes.length === 0) {
    return;
  }

  var firstNode = nodes[0];
  var lastNode = nodes[nodes.length - 1];
  var draggedNode = Node.getNodeFromTarget(event.target);
  var beforeNode = lastNode._nextSibling();
  var editor = firstNode.editor;

  // in case of multiple selected nodes, offsetY prevents the selection from
  // jumping when you start dragging one of the lower down nodes in the selection
  var offsetY = util.getAbsoluteTop(draggedNode.dom.tr) - util.getAbsoluteTop(firstNode.dom.tr);

  if (!editor.mousemove) {
    editor.mousemove = util.addEventListener(window, 'mousemove', function (event) {
      Node.onDrag(nodes, event);
    });
  }

  if (!editor.mouseup) {
    editor.mouseup = util.addEventListener(window, 'mouseup',function (event ) {
      Node.onDragEnd(nodes, event);
    });
  }

  editor.highlighter.lock();
  editor.drag = {
    oldCursor: document.body.style.cursor,
    oldSelection: editor.getSelection(),
    oldBeforeNode: beforeNode,
    mouseX: event.pageX,
    offsetY: offsetY,
    level: firstNode.getLevel()
  };
  document.body.style.cursor = 'move';

  event.preventDefault();
};

/**
 * Drag event, fired when moving the mouse while dragging a Node
 * @param {Node[] | Node} nodes
 * @param {Event} event
 */
Node.onDrag = function (nodes, event) {
  if (!Array.isArray(nodes)) {
    return Node.onDrag([nodes], event);
  }
  if (nodes.length === 0) {
    return;
  }

  // TODO: this method has grown too large. Split it in a number of methods
  var editor = nodes[0].editor;
  var mouseY = event.pageY - editor.drag.offsetY;
  var mouseX = event.pageX;
  var trThis, trPrev, trNext, trFirst, trLast, trRoot;
  var nodePrev, nodeNext;
  var topThis, topPrev, topFirst, heightThis, bottomNext, heightNext;
  var moved = false;

  // TODO: add an ESC option, which resets to the original position

  // move up/down
  var firstNode = nodes[0];
  trThis = firstNode.dom.tr;
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
      if (nodePrev == firstNode) {
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
      nodes.forEach(function (node) {
        nodePrev.parent.moveBefore(node, nodePrev);
      });
      moved = true;
    }
  }
  else {
    // move down
    var lastNode = nodes[nodes.length - 1];
    trLast = (lastNode.expanded && lastNode.append) ? lastNode.append.getDom() : lastNode.dom.tr;
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

          if (nodeNext.parent.childs.length == nodes.length &&
              nodeNext.parent.childs[nodes.length - 1] == lastNode) {
            // We are about to remove the last child of this parent,
            // which will make the parents appendNode visible.
            topThis += 27;
            // TODO: dangerous to suppose the height of the appendNode a constant of 27 px.
          }
        }

        trNext = trNext.nextSibling;
      }
      while (trNext && mouseY > topThis + heightNext);

      if (nodeNext && nodeNext.parent) {
        // calculate the desired level
        var diffX = (mouseX - editor.drag.mouseX);
        var diffLevel = Math.round(diffX / 24 / 2);
        var level = editor.drag.level + diffLevel; // desired level
        var levelNext = nodeNext.getLevel();     // level to be

        // find the best fitting level (move upwards over the append nodes)
        trPrev = nodeNext.dom.tr.previousSibling;
        while (levelNext < level && trPrev) {
          nodePrev = Node.getNodeFromTarget(trPrev);

          var isDraggedNode = nodes.some(function (node) {
            return node === nodePrev || nodePrev._isChildOf(node);
          });

          if (isDraggedNode) {
            // neglect the dragged nodes themselves and their childs
          }
          else if (nodePrev instanceof AppendNode) {
            var childs = nodePrev.parent.childs;
            if (childs.length != nodes.length || childs[nodes.length - 1] != lastNode) {
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
          nodes.forEach(function (node) {
            nodeNext.parent.moveBefore(node, nodeNext);
          });
          moved = true;
        }
      }
    }
  }

  if (moved) {
    // update the dragging parameters when moved
    editor.drag.mouseX = mouseX;
    editor.drag.level = firstNode.getLevel();
  }

  // auto scroll when hovering around the top of the editor
  editor.startAutoScroll(mouseY);

  event.preventDefault();
};

/**
 * Drag event, fired on mouseup after having dragged a node
 * @param {Node[] | Node} nodes
 * @param {Event} event
 */
Node.onDragEnd = function (nodes, event) {
  if (!Array.isArray(nodes)) {
    return Node.onDrag([nodes], event);
  }
  if (nodes.length === 0) {
    return;
  }

  var firstNode = nodes[0];
  var editor = firstNode.editor;
  var parent = firstNode.parent;
  var firstIndex = parent.childs.indexOf(firstNode);
  var beforeNode = parent.childs[firstIndex + nodes.length] || parent.append;

  // set focus to the context menu button of the first node
  if (nodes[0]) {
    nodes[0].dom.menu.focus();
  }

  var params = {
    nodes: nodes,
    oldSelection: editor.drag.oldSelection,
    newSelection: editor.getSelection(),
    oldBeforeNode: editor.drag.oldBeforeNode,
    newBeforeNode: beforeNode
  };

  if (params.oldBeforeNode != params.newBeforeNode) {
    // only register this action if the node is actually moved to another place
    editor._onAction('moveNodes', params);
  }

  document.body.style.cursor = editor.drag.oldCursor;
  editor.highlighter.unlock();
  nodes.forEach(function (node) {
    if (event.target !== node.dom.drag && event.target !== node.dom.menu) {
      editor.highlighter.unhighlight();
    }
  });
  delete editor.drag;

  if (editor.mousemove) {
    util.removeEventListener(window, 'mousemove', editor.mousemove);
    delete editor.mousemove;
  }
  if (editor.mouseup) {
    util.removeEventListener(window, 'mouseup', editor.mouseup);
    delete editor.mouseup;
  }

  // Stop any running auto scroll
  editor.stopAutoScroll();

  event.preventDefault();
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
    if (highlight) {
      util.addClassName(this.dom.tr, 'jsoneditor-highlight');
    }
    else {
      util.removeClassName(this.dom.tr, 'jsoneditor-highlight');
    }

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
 * Select or deselect a node
 * @param {boolean} selected
 * @param {boolean} [isFirst]
 */
Node.prototype.setSelected = function (selected, isFirst) {
  this.selected = selected;

  if (this.dom.tr) {
    if (selected) {
      util.addClassName(this.dom.tr, 'jsoneditor-selected');
    }
    else {
      util.removeClassName(this.dom.tr, 'jsoneditor-selected');
    }

    if (isFirst) {
      util.addClassName(this.dom.tr, 'jsoneditor-first');
    }
    else {
      util.removeClassName(this.dom.tr, 'jsoneditor-first');
    }

    if (this.append) {
      this.append.setSelected(selected);
    }

    if (this.childs) {
      this.childs.forEach(function (child) {
        child.setSelected(selected);
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

  // apply field to DOM
  var domField = this.dom.field;
  if (domField) {
    if (this.fieldEditable) {
      // parent is an object
      domField.contentEditable = this.editable.field;
      domField.spellcheck = false;
      domField.className = 'jsoneditor-field';
    }
    else {
      // parent is an array this is the root node
      domField.className = 'jsoneditor-readonly';
    }

    var fieldText;
    if (this.index != undefined) {
      fieldText = this.index;
    }
    else if (this.field != undefined) {
      fieldText = this.field;
    }
    else if (this._hasChilds()) {
      fieldText = this.type;
    }
    else {
      fieldText = '';
    }
    domField.innerHTML = this._escapeHTML(fieldText);

    this._updateSchema();
  }

  // apply value to DOM
  var domValue = this.dom.value;
  if (domValue) {
    var count = this.childs ? this.childs.length : 0;
    if (this.type == 'array') {
      domValue.innerHTML = '[' + count + ']';
      util.addClassName(this.dom.tr, 'jsoneditor-expandable');
    }
    else if (this.type == 'object') {
      domValue.innerHTML = '{' + count + '}';
      util.addClassName(this.dom.tr, 'jsoneditor-expandable');
    }
    else {
      domValue.innerHTML = this._escapeHTML(this.value);
      util.removeClassName(this.dom.tr, 'jsoneditor-expandable');
    }
  }

  // update field and value
  this._updateDomField();
  this._updateDomValue();

  // update childs indexes
  if (options && options.updateIndexes === true) {
    // updateIndexes is true or undefined
    this._updateDomIndexes();
  }

  if (options && options.recurse === true) {
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
 * Locate the JSON schema of the node and check for any enum type
 * @private
 */
Node.prototype._updateSchema = function () {
  //Locating the schema of the node and checking for any enum type
  if(this.editor && this.editor.options) {
    // find the part of the json schema matching this nodes path
    this.schema = Node._findSchema(this.editor.options.schema, this.getPath());
    if (this.schema) {
      this.enum = Node._findEnum(this.schema);
    }
    else {
      delete this.enum;
    }
  }
};

/**
 * find an enum definition in a JSON schema, as property `enum` or inside
 * one of the schemas composites (`oneOf`, `anyOf`, `allOf`)
 * @param  {Object} schema
 * @return {Array | null} Returns the enum when found, null otherwise.
 * @private
 */
Node._findEnum = function (schema) {
  if (schema.enum) {
    return schema.enum;
  }

  var composite = schema.oneOf || schema.anyOf || schema.allOf;
  if (composite) {
    var match = composite.filter(function (entry) {return entry.enum});
    if (match.length > 0) {
      return match[0].enum;
    }
  }

  return null
};

/**
 * Return the part of a JSON schema matching given path.
 * @param {Object} schema
 * @param {Array.<string | number>} path
 * @return {Object | null}
 * @private
 */
Node._findSchema = function (schema, path) {
  var childSchema = schema;

  for (var i = 0; i < path.length && childSchema; i++) {
    var key = path[i];
    if (typeof key === 'string' && childSchema.properties) {
      childSchema = childSchema.properties[key] || null
    }
    else if (typeof key === 'number' && childSchema.items) {
      childSchema = childSchema.items
    }
  }

  return childSchema
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
    domValue.innerHTML = '[...]';
  }
  else if (this.type == 'object') {
    domValue = document.createElement('div');
    domValue.innerHTML = '{...}';
  }
  else {
    if (!this.editable.value && util.isUrl(this.value)) {
      // create a link in case of read-only editor and value containing an url
      domValue = document.createElement('a');
      domValue.href = this.value;
      domValue.target = '_blank';
      domValue.innerHTML = this._escapeHTML(this.value);
    }
    else {
      // create an editable or read-only div
      domValue = document.createElement('div');
      domValue.contentEditable = this.editable.value;
      domValue.spellcheck = false;
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
    expand.className = this.expanded ? 'jsoneditor-expanded' : 'jsoneditor-collapsed';
    expand.title =
        'Click to expand/collapse this field (Ctrl+E). \n' +
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
 * @return {Element} domTree
 * @private
 */
Node.prototype._createDomTree = function () {
  var dom = this.dom;
  var domTree = document.createElement('table');
  var tbody = document.createElement('tbody');
  domTree.style.borderCollapse = 'collapse'; // TODO: put in css
  domTree.className = 'jsoneditor-values';
  domTree.appendChild(tbody);
  var tr = document.createElement('tr');
  tbody.appendChild(tr);

  // create expand button
  var tdExpand = document.createElement('td');
  tdExpand.className = 'jsoneditor-tree';
  tr.appendChild(tdExpand);
  dom.expand = this._createDomExpandButton();
  tdExpand.appendChild(dom.expand);
  dom.tdExpand = tdExpand;

  // create the field
  var tdField = document.createElement('td');
  tdField.className = 'jsoneditor-tree';
  tr.appendChild(tdField);
  dom.field = this._createDomField();
  tdField.appendChild(dom.field);
  dom.tdField = tdField;

  // create a separator
  var tdSeparator = document.createElement('td');
  tdSeparator.className = 'jsoneditor-tree';
  tr.appendChild(tdSeparator);
  if (this.type != 'object' && this.type != 'array') {
    tdSeparator.appendChild(document.createTextNode(':'));
    tdSeparator.className = 'jsoneditor-separator';
  }
  dom.tdSeparator = tdSeparator;

  // create the value
  var tdValue = document.createElement('td');
  tdValue.className = 'jsoneditor-tree';
  tr.appendChild(tdValue);
  dom.value = this._createDomValue();
  tdValue.appendChild(dom.value);
  dom.tdValue = tdValue;

  return domTree;
};

/**
 * Handle an event. The event is caught centrally by the editor
 * @param {Event} event
 */
Node.prototype.onEvent = function (event) {
  var type = event.type,
      target = event.target || event.srcElement,
      dom = this.dom,
      node = this,
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

  // context menu events
  if (type == 'click' && target == dom.menu) {
    var highlighter = node.editor.highlighter;
    highlighter.highlight(node);
    highlighter.lock();
    util.addClassName(dom.menu, 'jsoneditor-selected');
    this.showContextMenu(dom.menu, function () {
      util.removeClassName(dom.menu, 'jsoneditor-selected');
      highlighter.unlock();
      highlighter.unhighlight();
    });
  }

  // expand events
  if (type == 'click') {
    if (target == dom.expand ||
        ((node.editor.options.mode === 'view' || node.editor.options.mode === 'form') && target.nodeName === 'DIV')) {
      if (expandable) {
        var recurse = event.ctrlKey; // with ctrl-key, expand/collapse all
        this._onExpand(recurse);
      }
    }
  }

  // swap the value of a boolean when the checkbox displayed left is clicked
  if (type == 'change' && target == dom.checkbox) {
    this.dom.value.innerHTML = !this.value;
    this._getDomValue();
  }

  // update the value of the node based on the selected option
  if (type == 'change' && target == dom.select) {
    this.dom.value.innerHTML = dom.select.value;
    this._getDomValue();
    this._updateDomValue();
  }

  // value events
  var domValue = dom.value;
  if (target == domValue) {
    //noinspection FallthroughInSwitchStatementJS
    switch (type) {
      case 'blur':
      case 'change':
        this._getDomValue(true);
        this._updateDomValue();
        if (this.value) {
          domValue.innerHTML = this._escapeHTML(this.value);
        }
        break;

      case 'input':
        //this._debouncedGetDomValue(true); // TODO
        this._getDomValue(true);
        this._updateDomValue();
        break;

      case 'keydown':
      case 'mousedown':
          // TODO: cleanup
        this.editor.selection = this.editor.getSelection();
        break;

      case 'click':
        if (event.ctrlKey || !this.editable.value) {
          if (util.isUrl(this.value)) {
            window.open(this.value, '_blank');
          }
        }
        break;

      case 'keyup':
        //this._debouncedGetDomValue(true); // TODO
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
        this._updateSchema();
        this._updateDomField();
        this._updateDomValue();
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
  if (target == domTree.parentNode && type == 'click' && !event.hasMoved) {
    var left = (event.offsetX != undefined) ?
        (event.offsetX < (this.getLevel() + 1) * 24) :
        (event.pageX < util.getAbsoluteLeft(dom.tdSeparator));// for FF
    if (left || expandable) {
      // node is expandable when it is an object or array
      if (domField) {
        util.setEndOfContentEditable(domField);
        domField.focus();
      }
    }
    else {
      if (domValue && !this.enum) {
        util.setEndOfContentEditable(domValue);
        domValue.focus();
      }
    }
  }
  if (((target == dom.tdExpand && !expandable) || target == dom.tdField || target == dom.tdSeparator) &&
      (type == 'click' && !event.hasMoved)) {
    if (domField) {
      util.setEndOfContentEditable(domField);
      domField.focus();
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
  var editable = this.editor.options.mode === 'tree';
  var oldSelection;
  var oldBeforeNode;
  var nodes;
  var multiselection;
  var selectedNodes = this.editor.multiselection.nodes.length > 0
      ? this.editor.multiselection.nodes
      : [this];
  var firstNode = selectedNodes[0];
  var lastNode = selectedNodes[selectedNodes.length - 1];

  // console.log(ctrlKey, keynum, event.charCode); // TODO: cleanup
  if (keynum == 13) { // Enter
    if (target == this.dom.value) {
      if (!this.editable.value || event.ctrlKey) {
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
    if (ctrlKey && editable) {   // Ctrl+D
      Node.onDuplicate(selectedNodes);
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
  else if (keynum == 77 && editable) { // M
    if (ctrlKey) { // Ctrl+M
      this.showContextMenu(target);
      handled = true;
    }
  }
  else if (keynum == 46 && editable) { // Del
    if (ctrlKey) {       // Ctrl+Del
      Node.onRemove(selectedNodes);
      handled = true;
    }
  }
  else if (keynum == 45 && editable) { // Ins
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
      var endNode = this._lastNode();
      if (endNode) {
        endNode.focus(Node.focusElement || this._getElementName(target));
      }
      handled = true;
    }
  }
  else if (keynum == 36) { // Home
    if (altKey) { // Alt+Home
      // find the first node
      var homeNode = this._firstNode();
      if (homeNode) {
        homeNode.focus(Node.focusElement || this._getElementName(target));
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
    else if (altKey && shiftKey && editable) { // Alt + Shift + Arrow left
      if (lastNode.expanded) {
        var appendDom = lastNode.getAppend();
        nextDom = appendDom ? appendDom.nextSibling : undefined;
      }
      else {
        var dom = lastNode.getDom();
        nextDom = dom.nextSibling;
      }
      if (nextDom) {
        nextNode = Node.getNodeFromTarget(nextDom);
        nextDom2 = nextDom.nextSibling;
        nextNode2 = Node.getNodeFromTarget(nextDom2);
        if (nextNode && nextNode instanceof AppendNode &&
            !(lastNode.parent.childs.length == 1) &&
            nextNode2 && nextNode2.parent) {
          oldSelection = this.editor.getSelection();
          oldBeforeNode = lastNode._nextSibling();

          selectedNodes.forEach(function (node) {
            nextNode2.parent.moveBefore(node, nextNode2);
          });
          this.focus(Node.focusElement || this._getElementName(target));

          this.editor._onAction('moveNodes', {
            nodes: selectedNodes,
            oldBeforeNode: oldBeforeNode,
            newBeforeNode: nextNode2,
            oldSelection: oldSelection,
            newSelection: this.editor.getSelection()
          });
        }
      }
    }
  }
  else if (keynum == 38) {        // Arrow Up
    if (altKey && !shiftKey) {  // Alt + Arrow Up
      // find the previous node
      prevNode = this._previousNode();
      if (prevNode) {
        this.editor.deselect(true);
        prevNode.focus(Node.focusElement || this._getElementName(target));
      }
      handled = true;
    }
    else if (!altKey && ctrlKey && shiftKey && editable) { // Ctrl + Shift + Arrow Up
      // select multiple nodes
      prevNode = this._previousNode();
      if (prevNode) {
        multiselection = this.editor.multiselection;
        multiselection.start = multiselection.start || this;
        multiselection.end = prevNode;
        nodes = this.editor._findTopLevelNodes(multiselection.start, multiselection.end);

        this.editor.select(nodes);
        prevNode.focus('field'); // select field as we know this always exists
      }
      handled = true;
    }
    else if (altKey && shiftKey && editable) { // Alt + Shift + Arrow Up
      // find the previous node
      prevNode = firstNode._previousNode();
      if (prevNode && prevNode.parent) {
        oldSelection = this.editor.getSelection();
        oldBeforeNode = lastNode._nextSibling();

        selectedNodes.forEach(function (node) {
          prevNode.parent.moveBefore(node, prevNode);
        });
        this.focus(Node.focusElement || this._getElementName(target));

        this.editor._onAction('moveNodes', {
          nodes: selectedNodes,
          oldBeforeNode: oldBeforeNode,
          newBeforeNode: prevNode,
          oldSelection: oldSelection,
          newSelection: this.editor.getSelection()
        });
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
    else if (altKey && shiftKey && editable) { // Alt + Shift + Arrow Right
      dom = firstNode.getDom();
      var prevDom = dom.previousSibling;
      if (prevDom) {
        prevNode = Node.getNodeFromTarget(prevDom);
        if (prevNode && prevNode.parent &&
            (prevNode instanceof AppendNode)
            && !prevNode.isVisible()) {
          oldSelection = this.editor.getSelection();
          oldBeforeNode = lastNode._nextSibling();

          selectedNodes.forEach(function (node) {
            prevNode.parent.moveBefore(node, prevNode);
          });
          this.focus(Node.focusElement || this._getElementName(target));

          this.editor._onAction('moveNodes', {
            nodes: selectedNodes,
            oldBeforeNode: oldBeforeNode,
            newBeforeNode: prevNode,
            oldSelection: oldSelection,
            newSelection: this.editor.getSelection()
          });
        }
      }
    }
  }
  else if (keynum == 40) {        // Arrow Down
    if (altKey && !shiftKey) {  // Alt + Arrow Down
      // find the next node
      nextNode = this._nextNode();
      if (nextNode) {
        this.editor.deselect(true);
        nextNode.focus(Node.focusElement || this._getElementName(target));
      }
      handled = true;
    }
    else if (!altKey && ctrlKey && shiftKey && editable) { // Ctrl + Shift + Arrow Down
      // select multiple nodes
      nextNode = this._nextNode();
      if (nextNode) {
        multiselection = this.editor.multiselection;
        multiselection.start = multiselection.start || this;
        multiselection.end = nextNode;
        nodes = this.editor._findTopLevelNodes(multiselection.start, multiselection.end);

        this.editor.select(nodes);
        nextNode.focus('field'); // select field as we know this always exists
      }
      handled = true;
    }
    else if (altKey && shiftKey && editable) { // Alt + Shift + Arrow Down
      // find the 2nd next node and move before that one
      if (lastNode.expanded) {
        nextNode = lastNode.append ? lastNode.append._nextNode() : undefined;
      }
      else {
        nextNode = lastNode._nextNode();
      }
      var nextNode2 = nextNode && (nextNode._nextNode() || nextNode.parent.append);
      if (nextNode2 && nextNode2.parent) {
        oldSelection = this.editor.getSelection();
        oldBeforeNode = lastNode._nextSibling();

        selectedNodes.forEach(function (node) {
          nextNode2.parent.moveBefore(node, nextNode2);
        });
        this.focus(Node.focusElement || this._getElementName(target));

        this.editor._onAction('moveNodes', {
          nodes: selectedNodes,
          oldBeforeNode: oldBeforeNode,
          newBeforeNode: nextNode2,
          oldSelection: oldSelection,
          newSelection: this.editor.getSelection()
        });
      }
      handled = true;
    }
  }

  if (handled) {
    event.preventDefault();
    event.stopPropagation();
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
 * Remove nodes
 * @param {Node[] | Node} nodes
 */
Node.onRemove = function(nodes) {
  if (!Array.isArray(nodes)) {
    return Node.onRemove([nodes]);
  }

  if (nodes && nodes.length > 0) {
    var firstNode = nodes[0];
    var parent = firstNode.parent;
    var editor = firstNode.editor;
    var firstIndex = firstNode.getIndex();
    editor.highlighter.unhighlight();

    // adjust the focus
    var oldSelection = editor.getSelection();
    Node.blurNodes(nodes);
    var newSelection = editor.getSelection();

    // remove the nodes
    nodes.forEach(function (node) {
      node.parent._remove(node);
    });

    // store history action
    editor._onAction('removeNodes', {
      nodes: nodes.slice(0), // store a copy of the array!
      parent: parent,
      index: firstIndex,
      oldSelection: oldSelection,
      newSelection: newSelection
    });
  }
};


/**
 * Duplicate nodes
 * duplicated nodes will be added right after the original nodes
 * @param {Node[] | Node} nodes
 */
Node.onDuplicate = function(nodes) {
  if (!Array.isArray(nodes)) {
    return Node.onDuplicate([nodes]);
  }

  if (nodes && nodes.length > 0) {
    var lastNode = nodes[nodes.length - 1];
    var parent = lastNode.parent;
    var editor = lastNode.editor;

    editor.deselect(editor.multiselection.nodes);

    // duplicate the nodes
    var oldSelection = editor.getSelection();
    var afterNode = lastNode;
    var clones = nodes.map(function (node) {
      var clone = node.clone();
      parent.insertAfter(clone, afterNode);
      afterNode = clone;
      return clone;
    });

    // set selection to the duplicated nodes
    if (nodes.length === 1) {
      clones[0].focus();
    }
    else {
      editor.select(clones);
    }
    var newSelection = editor.getSelection();

    editor._onAction('duplicateNodes', {
      afterNode: lastNode,
      nodes: clones,
      parent: parent,
      oldSelection: oldSelection,
      newSelection: newSelection
    });
  }
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
    field: (field != undefined) ? field : '',
    value: (value != undefined) ? value : '',
    type: type
  });
  newNode.expand(true);
  this.parent.insertBefore(newNode, this);
  this.editor.highlighter.unhighlight();
  newNode.focus('field');
  var newSelection = this.editor.getSelection();

  this.editor._onAction('insertBeforeNodes', {
    nodes: [newNode],
    beforeNode: this,
    parent: this.parent,
    oldSelection: oldSelection,
    newSelection: newSelection
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
    field: (field != undefined) ? field : '',
    value: (value != undefined) ? value : '',
    type: type
  });
  newNode.expand(true);
  this.parent.insertAfter(newNode, this);
  this.editor.highlighter.unhighlight();
  newNode.focus('field');
  var newSelection = this.editor.getSelection();

  this.editor._onAction('insertAfterNodes', {
    nodes: [newNode],
    afterNode: this,
    parent: this.parent,
    oldSelection: oldSelection,
    newSelection: newSelection
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
    field: (field != undefined) ? field : '',
    value: (value != undefined) ? value : '',
    type: type
  });
  newNode.expand(true);
  this.parent.appendChild(newNode);
  this.editor.highlighter.unhighlight();
  newNode.focus('field');
  var newSelection = this.editor.getSelection();

  this.editor._onAction('appendNodes', {
    nodes: [newNode],
    parent: this.parent,
    oldSelection: oldSelection,
    newSelection: newSelection
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
      node: this,
      oldType: oldType,
      newType: newType,
      oldSelection: oldSelection,
      newSelection: newSelection
    });
  }
};

/**
 * Sort the child's of the node. Only applicable when the node has type 'object'
 * or 'array'.
 * @param {String} direction   Sorting direction. Available values: "asc", "desc"
 * @private
 */
Node.prototype.sort = function (direction) {
  if (!this._hasChilds()) {
    return;
  }

  var order = (direction == 'desc') ? -1 : 1;
  var prop = (this.type == 'array') ? 'value': 'field';
  this.hideChilds();

  var oldChilds = this.childs;
  var oldSortOrder = this.sortOrder;

  // copy the array (the old one will be kept for an undo action
  this.childs = this.childs.concat();

  // sort the arrays
  this.childs.sort(function (a, b) {
    return order * naturalSort(a[prop], b[prop]);
  });
  this.sortOrder = (order == 1) ? 'asc' : 'desc';

  this.editor._onAction('sort', {
    node: this,
    oldChilds: oldChilds,
    oldSort: oldSortOrder,
    newChilds: this.childs,
    newSort: this.sortOrder
  });

  this.showChilds();
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
 * Remove the focus of given nodes, and move the focus to the (a) node before,
 * (b) the node after, or (c) the parent node.
 * @param {Array.<Node> | Node} nodes
 */
Node.blurNodes = function (nodes) {
  if (!Array.isArray(nodes)) {
    Node.blurNodes([nodes]);
    return;
  }

  var firstNode = nodes[0];
  var parent = firstNode.parent;
  var firstIndex = firstNode.getIndex();

  if (parent.childs[firstIndex + nodes.length]) {
    parent.childs[firstIndex + nodes.length].focus();
  }
  else if (parent.childs[firstIndex - 1]) {
    parent.childs[firstIndex - 1].focus();
  }
  else {
    parent.focus();
  }
};

/**
 * Get the next sibling of current node
 * @return {Node} nextSibling
 * @private
 */
Node.prototype._nextSibling = function () {
  var index = this.parent.childs.indexOf(this);
  return this.parent.childs[index + 1] || this.parent.append;
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
 * @param {HTMLElement} anchor   Anchor element to attach the context menu to
 *                               as sibling.
 * @param {function} [onClose]   Callback method called when the context menu
 *                               is being closed.
 */
Node.prototype.showContextMenu = function (anchor, onClose) {
  var node = this;
  var titles = Node.TYPE_TITLES;
  var items = [];

  if (this.editable.value) {
    items.push({
      text: 'Type',
      title: 'Change the type of this field',
      className: 'jsoneditor-type-' + this.type,
      submenu: [
        {
          text: 'Auto',
          className: 'jsoneditor-type-auto' +
              (this.type == 'auto' ? ' jsoneditor-selected' : ''),
          title: titles.auto,
          click: function () {
            node._onChangeType('auto');
          }
        },
        {
          text: 'Array',
          className: 'jsoneditor-type-array' +
              (this.type == 'array' ? ' jsoneditor-selected' : ''),
          title: titles.array,
          click: function () {
            node._onChangeType('array');
          }
        },
        {
          text: 'Object',
          className: 'jsoneditor-type-object' +
              (this.type == 'object' ? ' jsoneditor-selected' : ''),
          title: titles.object,
          click: function () {
            node._onChangeType('object');
          }
        },
        {
          text: 'String',
          className: 'jsoneditor-type-string' +
              (this.type == 'string' ? ' jsoneditor-selected' : ''),
          title: titles.string,
          click: function () {
            node._onChangeType('string');
          }
        }
      ]
    });
  }

  if (this._hasChilds()) {
    var direction = ((this.sortOrder == 'asc') ? 'desc': 'asc');
    items.push({
      text: 'Sort',
      title: 'Sort the childs of this ' + this.type,
      className: 'jsoneditor-sort-' + direction,
      click: function () {
        node.sort(direction);
      },
      submenu: [
        {
          text: 'Ascending',
          className: 'jsoneditor-sort-asc',
          title: 'Sort the childs of this ' + this.type + ' in ascending order',
          click: function () {
            node.sort('asc');
          }
        },
        {
          text: 'Descending',
          className: 'jsoneditor-sort-desc',
          title: 'Sort the childs of this ' + this.type +' in descending order',
          click: function () {
            node.sort('desc');
          }
        }
      ]
    });
  }

  if (this.parent && this.parent._hasChilds()) {
    if (items.length) {
      // create a separator
      items.push({
        'type': 'separator'
      });
    }

    // create append button (for last child node only)
    var childs = node.parent.childs;
    if (node == childs[childs.length - 1]) {
      items.push({
        text: 'Append',
        title: 'Append a new field with type \'auto\' after this field (Ctrl+Shift+Ins)',
        submenuTitle: 'Select the type of the field to be appended',
        className: 'jsoneditor-append',
        click: function () {
          node._onAppend('', '', 'auto');
        },
        submenu: [
          {
            text: 'Auto',
            className: 'jsoneditor-type-auto',
            title: titles.auto,
            click: function () {
              node._onAppend('', '', 'auto');
            }
          },
          {
            text: 'Array',
            className: 'jsoneditor-type-array',
            title: titles.array,
            click: function () {
              node._onAppend('', []);
            }
          },
          {
            text: 'Object',
            className: 'jsoneditor-type-object',
            title: titles.object,
            click: function () {
              node._onAppend('', {});
            }
          },
          {
            text: 'String',
            className: 'jsoneditor-type-string',
            title: titles.string,
            click: function () {
              node._onAppend('', '', 'string');
            }
          }
        ]
      });
    }

    // create insert button
    items.push({
      text: 'Insert',
      title: 'Insert a new field with type \'auto\' before this field (Ctrl+Ins)',
      submenuTitle: 'Select the type of the field to be inserted',
      className: 'jsoneditor-insert',
      click: function () {
        node._onInsertBefore('', '', 'auto');
      },
      submenu: [
        {
          text: 'Auto',
          className: 'jsoneditor-type-auto',
          title: titles.auto,
          click: function () {
            node._onInsertBefore('', '', 'auto');
          }
        },
        {
          text: 'Array',
          className: 'jsoneditor-type-array',
          title: titles.array,
          click: function () {
            node._onInsertBefore('', []);
          }
        },
        {
          text: 'Object',
          className: 'jsoneditor-type-object',
          title: titles.object,
          click: function () {
            node._onInsertBefore('', {});
          }
        },
        {
          text: 'String',
          className: 'jsoneditor-type-string',
          title: titles.string,
          click: function () {
            node._onInsertBefore('', '', 'string');
          }
        }
      ]
    });

    if (this.editable.field) {
      // create duplicate button
      items.push({
        text: 'Duplicate',
        title: 'Duplicate this field (Ctrl+D)',
        className: 'jsoneditor-duplicate',
        click: function () {
          Node.onDuplicate(node);
        }
      });

      // create remove button
      items.push({
        text: 'Remove',
        title: 'Remove this field (Ctrl+Del)',
        className: 'jsoneditor-remove',
        click: function () {
          Node.onRemove(node);
        }
      });
    }
  }

  var menu = new ContextMenu(items, {close: onClose});
  menu.show(anchor, this.editor.content);
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
  if (typeof text !== 'string') {
    return String(text);
  }
  else {
    var htmlEscaped = String(text)
        .replace(/&/g, '&amp;')    // must be replaced first!
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/  /g, ' &nbsp;') // replace double space with an nbsp and space
        .replace(/^ /, '&nbsp;')   // space at start
        .replace(/ $/, '&nbsp;');  // space at end

    var json = JSON.stringify(htmlEscaped);
    var html = json.substring(1, json.length - 1);
    if (this.editor.options.escapeUnicode === true) {
      html = util.escapeUnicodeChars(html);
    }
    return html;
  }
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
      .replace(/&nbsp;|\u00A0/g, ' ')
      .replace(/&amp;/g, '&');   // must be replaced last
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
  var i = 0;
  while (i < text.length) {
    var c = text.charAt(i);
    if (c == '\n') {
      escaped += '\\n';
    }
    else if (c == '\\') {
      escaped += c;
      i++;

      c = text.charAt(i);
      if (c === '' || '"\\/bfnrtu'.indexOf(c) == -1) {
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

// TODO: find a nicer solution to resolve this circular dependency between Node and AppendNode
var AppendNode = appendNodeFactory(Node);

module.exports = Node;
