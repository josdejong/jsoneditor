/**
 * @file jsoneditor.js
 * 
 * @brief 
 * JSONEditor is an editor to display and edit JSON data in a treeview. 
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
 * @date    2012-04-24
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

// define variable JSON, needed for correct error handling on IE7 and older
var JSON;

/**
 * JSONEditor
 * @param {HTML DOM} container    Container element
 * @param {Object or Array} json  JSON object
 */ 
JSONEditor = function (container, json) {
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

  this._createFrame();
  this._createTable();

  this.set(json || {});
}

// node currently being edited
JSONEditor.focusNode = undefined;

/**
 * Set JSON object in editor
 * @param {Object} json
 */ 
JSONEditor.prototype.set = function (json) {
  this.content.removeChild(this.table);  // Take the table offline
  
  // replace the root node
  var node = new JSONEditor.Node({
    'value': json
  });
  this._setRoot(node);

  // expand
  var recurse = false;
  this.node.expand(recurse);

  this.content.appendChild(this.table);  // Put the table online again
}

/**
 * Get JSON object from editor
 * @return {Object} json
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
    return {};
  }
}

/**
 * Remove the root node from the editor
 */ 
JSONEditor.prototype.clear = function () {
  if (this.node) {
    this.node.collapse();
    this.tbody.removeChild(this.node.getDom());
    delete this.node;
  }
}

/**
 * Set the root node for the json editor
 * @param {JSONEditor.Node} node
 */ 
JSONEditor.prototype._setRoot = function (node) {
  this.clear();
  
  this.node = node;
  this.tbody.appendChild(node.getDom());
}

/**
 * Expand all nodes
 */ 
JSONEditor.prototype.expandAll = function () {
  if (this.node) {
    this.content.removeChild(this.table);  // Take the table offline
    this.node.expand();
    this.content.appendChild(this.table);  // Put the table online again
  }
}

/**
 * Collapse all nodes
 */ 
JSONEditor.prototype.collapseAll = function () {
  if (this.node) {
    this.content.removeChild(this.table);  // Take the table offline
    this.node.collapse();
    this.content.appendChild(this.table);  // Put the table online again
  }
}

/**
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
}

JSONEditor.Node.prototype.setField = function(field, fieldEditable) {
  this.field = field;
  this.fieldEditable = (fieldEditable == true);
}

JSONEditor.Node.prototype.getField = function() {
  if (this.field === undefined) {
    this.field = this._getDomField();
  }

  return this.field;
}

JSONEditor.Node.prototype.setValue = function(value) {
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
      var child = new JSONEditor.Node({
        // 'field': i, // TODO: cleanup
        'value': value[i]
      });
      this.appendChild(child);
    }
    this.value = '';
  }
  else if (this.type == 'object') {
    // object
    this.childs = [];
    for (var childField in value) {
      if (value.hasOwnProperty(childField)) {
        var child = new JSONEditor.Node({
          'field': childField, 
          'value': value[childField]
        });
        this.appendChild(child);
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
}

JSONEditor.Node.prototype.getValue = function() {
  //this._getDomValue(); // TODO: cleanup
  
  if (this.type == 'array') {
    var arr = [];
    var childs = this.childs;
    for (var i = 0, iMax = childs.length; i < iMax; i++) {
      arr.push(childs[i].getValue());
    }
    return arr;
  }
  else if (this.type == 'object') {
    var obj = {};
    var childs = this.childs;
    for (var i = 0, iMax = childs.length; i < iMax; i++) {
      var child = childs[i];
      obj[child.getField()] = child.getValue();
    }
    return obj;
  }  
  else {
    if (this.value === undefined) {
      this.value = this._getDomValue();
    }
    
    return this.value;
  }
}

/**
 * Get the nesting level of this node
 */ 
JSONEditor.Node.prototype.getLevel = function() {
  return (this.parent ? this.parent.getLevel() + 1 : 0);
}

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
  clone.fieldHTML = this.fieldHTML;
  clone.fieldEditable = this.fieldEditable;
  clone.value = this.value;
  clone.valueHTML = this.valueHTML;
  clone.expanded = this.expanded;
  
  if (this.childs) {
    // an object or array
    var childs = this.childs;
    var cloneChilds = [];
    for (var i = 0, iMax = childs.length; i < iMax; i++) {
      var childClone = childs[i].clone();
      childClone.parent = clone;
      cloneChilds.push(childClone);
    }
    clone.childs = cloneChilds;
  }
  else {
    // a value
    clone.childs = undefined;
  }
  
  return clone;
}

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
  
  var childs = this.childs;
  if (recurse != false) {
    for (var i = 0, iMax = childs.length; i < iMax; i++) {
      childs[i].expand(recurse);
    }
  }
}


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
  var childs = this.childs;
  if (recurse != false) {
    for (var i = 0, iMax = childs.length; i < iMax; i++) {
      childs[i].collapse(recurse);
    }
  }

  // make this node collapsed
  if (this.dom.expand) {
    this.dom.expand.className = 'jsoneditor-collapsed';
  }
  this.expanded = false;
}

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
  var table = tr.parentNode;
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
    for (var i = 0, iMax = childs.length; i < iMax; i++) {
      var child = childs[i];
      table.insertBefore(child.getDom(), append);
      child.showChilds();
    }
  }
}

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
}
  
  
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
  for (var i = 0, iMax = childs.length; i < iMax; i++) {
    childs[i].hide();
  }
}


/**
 * Add a new child to the node. 
 * Only applicable when Node value is of type array or object
 * @param {JSONEditor.Node} node
 */ 
JSONEditor.Node.prototype.appendChild = function(node) {
  if (this.type == 'array' || this.type == 'object') {
    // adjust the link to the parent 
    node.parent = this;
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

      this._updateStatus(node.index);

      node.showChilds();
    }
    
    node.updateDom();
  }
}


/**
 * Move an existing child from its current parent to this node
 * Only applicable when Node value is of type array or object
 * @param {JSONEditor.Node} node
 * @param {JSONEditor.Node} beforeNode
 */ 
JSONEditor.Node.prototype.moveBefore = function(node, beforeNode) {
  if (this.type == 'array' || this.type == 'object') {
    // create a temporary row, to prevent the scroll position from jumping when
    // removing the node
    var tbody = (this.dom.tr) ? this.dom.tr.parentNode : undefined;
    if (tbody) {
      var trTemp = document.createElement('tr');
      trTemp.style.height = tbody.clientHeight + 'px'
      tbody.appendChild(trTemp);
    }
    
    var parent = node.parent;
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
}


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
      node.parent = this;
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
      node.parent = this;
      node.fieldEditable = (this.type == 'object');
      //node.index = index;   // TODO: redundant?
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

    node.updateDom();
    this._updateStatus(index);
  }
}

/**
 * Set focus to the value of this node
 */ 
JSONEditor.Node.prototype.focus = function() {
  if (this.dom.tr && this.dom.tr.parentNode) {
    if (this.fieldEditable) {
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
}

/**
 * Remove focus from the value or field of this node
 */ 
JSONEditor.Node.prototype.blur = function() {
  this._getDomValue(true);
  this._getDomField(true);
}

  
/**
 * Duplicate given child node
 * new structure will be added right before the cloned node
 * @param {JSONEditor.Node} node           the childNode to be duplicated
 */ 
JSONEditor.Node.prototype._duplicate = function(node) {
  var clone = node.clone();
  
  /* TODO: adjust the field name (to prevent equal field names)
  if (this.type == 'object') {
  }
  */
  
  // TODO: insert after instead of insert before
  this.insertBefore(clone, node);
}

/**
 * Check if given node is a child. The method will check recursively to find
 * this node.
 * @param {JSONEditor.Node} node
 */ 
JSONEditor.Node.prototype.containsNode = function(node) {
  if (this == node) {
    return true;
  }

  var childs = this.childs;
  if (childs) {
    for (var i = 0, iMax = childs.length; i < iMax; i++) {
      if (childs[i].containsNode(node)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Move given node into this node
 * @param {JSONEditor.Node} node           the childNode to be moved
 * @param {JSONEditor.Node} beforeNode     node will be inserted before given
 *                                         node. If no beforeNode is given,
 *                                         the node is appended at the end
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
}

/**
 * Remove a child from the node. 
 * Only applicable when Node value is of type array or object
 * @param {JSONEditor.Node} node   The child node to be removed;
 * @return {JSONEditor.Node} node  The removed node on success, else undefined
 */ 
JSONEditor.Node.prototype.removeChild = function(node) {
  if (this.childs) {
    var index = this.childs.indexOf(node);
  
    if (index != -1) {
      node.hide();

      var node = this.childs.splice(index, 1)[0];
      
      this._updateStatus(index);
      
      return node;
    }
  }
  
  return undefined;
}


/**
 * change the type of the value of this Node
 * @param {String} newType
 */ 
JSONEditor.Node.prototype._changeType = function ( newType) {
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

      var childs = this.childs;
      var fieldEditable = true;
      for (var i = 0, iMax = childs.length; i < iMax; i++) {
        var child = childs[i];
        child.clearDom();
        delete child.index;
        child.fieldEditable = true;
        if (child.field == undefined) {
          child.field = i;
        }
      }

      if (oldType == 'string' || oldType == 'auto') {
        this.expanded = true;
      }
    }
    else if (newType == 'array') {
      if (!this.childs) {
        this.childs = [];
      }
      
      var childs = this.childs;
      var fieldEditable = false;
      for (var i = 0, iMax = childs.length; i < iMax; i++) {
        var child = childs[i];
        child.clearDom();
        child.fieldEditable = false;
        child.index = i;
      }
      this._updateStatus();      

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
  
  // TODO: test if things are updated twice...
  this.updateDom();
}

/**
 * Retrieve value from DOM
 * @param {boolean} silent.   If true (default), no errors will be thrown in 
 *                            case of invalid data
 */ 
JSONEditor.Node.prototype._getDomValue = function(silent) {
  if (this.dom.value && this.type != 'array' && this.type != 'object') {
    this.valueHTML = this.dom.value.innerHTML;
  }

  if (this.valueHTML != undefined) {
    try {
      // retrieve the value
      if (this.type == 'string') {
        this.value = this._unescape(this._stripHTML(this.valueHTML));
      }
      else {
        var value = this._unescape(this._stripHTML(this.valueHTML));
        this.value = this._stringCast(value);
      }
    }
    catch (err) {
      this.value = undefined;
      if (silent != true) {
        throw err;
      }
    }
  }
}

/**
 * Update:
 * - the text color of the value, depending on the type of the value
 * - the height of the field, depending on the width
 * - background color in case it is empty
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
    
    // strip formatting from the contents of the editable div
    JSONEditor.stripFormatting(domValue);
  }  
}

/**
 * Update:
 * - the text color of the field, depending on the text
 * - the height of the field, depending on the width
 * - background color in case it is empty
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
    
    // strip formatting from the contents of the editable div
    JSONEditor.stripFormatting(domField);
  }
}

/**
 * Retrieve field from DOM
 * @param {boolean} silent.   If true (default), no errors will be thrown in 
 *                            case of invalid data
 */ 
JSONEditor.Node.prototype._getDomField = function(silent) {
  if (this.dom.field && this.fieldEditable) {
    this.fieldHTML = this.dom.field.innerHTML;
  }

  if (this.fieldHTML != undefined) {
    try {
      this.field = this._unescape(this._stripHTML(this.fieldHTML));
    }
    catch (err) {
      this.field = undefined;
      if (silent != true) {
        throw err;
      }
    }
  }
}

/**
 * Clear the dom of the node
 */ 
JSONEditor.Node.prototype.clearDom = function() {
  // TODO: hide the node first? 
  //this.hide(); 
  // TOOD: recursively clear dom?
  
  this.dom = {};  
}

/**
 * Get the HTML DOM TR element of the node.
 * The dom will be generated when not yet created
 * @return {HTML DOM TR} tr
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
  
  // create dragable area
  var tdDrag = document.createElement('td');
  tdDrag.className = 'jsoneditor-td'; 
  tdDrag.title = 'Move field (drag and drop)';
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

  this._updateStatus();
  this.updateDom();
  
  return dom.tr;
}

/**
 * DragStart event, fired on mousedown on the dragarea at the left side of a Node
 */ 
JSONEditor.Node.prototype._onDragStart = function (event) {
  var event = event || window.event;

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
  this.oldCursor = document.body.style.cursor;
  document.body.style.cursor = 'move';

  JSONEditor.Events.preventDefault(event);
}

/**
 * Drag event, fired when moving the mouse while dragging a Node
 */ 
JSONEditor.Node.prototype._onDrag = function (event) {
  var event = event || window.event;
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
}

/**
 * Drag event, fired on mouseup after having dragged a node
 */ 
JSONEditor.Node.prototype._onDragEnd = function (event) {
  var event = event || window.event;

  document.body.style.cursor = this.oldCursor;
  delete JSONEditor.freezeHighlight;
  delete this.oldCursor;
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
}

/**
 * Create a drag area, displayed at the left side of the node
 */ 
JSONEditor.Node.prototype._createDomDragArea = function () {
  if (!this.parent) {
    return undefined;
  }

  var node = this;
  var domDrag = document.createElement('button'); 
  domDrag.className = 'jsoneditor-dragarea';

  return domDrag;
}

/**
 * Create an editable field
 * @param {Object} structure
 */ 
JSONEditor.Node.prototype._createDomField = function () {
  var domField = document.createElement('div');

  return domField;
}

/**
 * Set highlighting for this node and all its childs. 
 * Only applied to the currently visible (expanded childs)
 * @param {Boolean} highlight 
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
    
    var childs = this.childs;
    if (childs) {
      for (var i = 0, iMax = childs.length; i < iMax; i++) {
        childs[i].setHighlight(highlight);
      }
    }
  }
}

/**
 * Update the HTML DOM
 */ 
// TODO: merge updateDom and _updateStatus
JSONEditor.Node.prototype.updateDom = function () {
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
    domField.innerHTML = this._escape(field);
  }

  // update field and value
  this._updateDomField();
  this._updateDomValue();
  
  // update childs recursively
  if (this.childs) {
    var childs = this.childs;
    for (var i = 0, iMax = childs.length; i < iMax; i++) {
      childs[i].updateDom();
    }
  }
  
  // update row with append button
  if (this.append) {
    this.append.updateDom();
  }
}

/**
 * Update the title of the given structure. 
 * Only applicable when structure is an array or object
 * @param {Number} startIndex  Optional. Index of the first child to be updated
 *                             Only applicable in case of array
 */ 
JSONEditor.Node.prototype._updateStatus = function (startIndex) {
  var domValue = this.dom.value;
  var childs = this.childs;
  if (domValue && childs) {
    var count = childs.length;
    if (this.type == 'array') {
      domValue.innerHTML = '[' + count + ']';
      
      // update the field indexes of the childs
      for (var i = (startIndex > 0 ? startIndex : 0), iMax = childs.length; i < iMax; i++) {
        var child = childs[i];
        child.index = i;
        var childField = child.dom.field;
        if (childField) {
          childField.innerHTML = i;
        }
      }
    }
    else if (this.type == 'object') {
      domValue.innerHTML = '{' + count + '}';
      
      for (var i = (startIndex > 0 ? startIndex : 0), iMax = childs.length; i < iMax; i++) {
        var child = childs[i];
        if (child.index != undefined) {
          delete child.index; // TODO: this should be done when changing type only?
          
          if (child.field == undefined) {
            child.field = 'field';  
          }
          child.updateDom();
        }
      }
    } 
    
    domValue.title = this.type + ' containing ' + count + ' items';
  }
}

/**
 * Create an editable value
 * @param {JSON} value
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
    domValue.innerHTML = this._escape(this.value);
  }
  else {
    domValue = document.createElement('div');
    domValue.contentEditable = 'true';
    domValue.spellcheck = false;
    domValue.className = 'jsoneditor-value'; 
    domValue.innerHTML = this._escape(this.value);
  }

  // TODO: in FF spellcheck of editable divs is done via the body. quite ugly
  // document.body.spellcheck = false;

  return domValue;
}

/**
 * Create an expand/collapse button
 */ 
JSONEditor.Node.prototype._createDomExpandButton = function () {
  var node = this;
  
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
}


/**
 * Create a DOM tree element, containing the expand/collapse button
 * @param {HTML Element} domExpand   
 * @param {HTML Element} domField   
 * @param {HTML Element} domValue
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
  // TODO: format correctly. Hide in case of array/object
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
}

/**
 * Handle an event. The event is catched centrally by the editor
 * @param {HTML Event} event
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

      case 'change':
      case 'blur':
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
        this.parent._duplicate(this);
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
        this.parent.removeChild(this);
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
        this._onTypeButton(event);
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
            JSONEditor.setEndOfContenteditable(domField);
            domField.focus();
          }
        }
        else {
          if (domValue) {
            JSONEditor.setEndOfContenteditable(domValue);
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
          JSONEditor.setEndOfContenteditable(domField);
          domField.focus();
        }
        break;
    }    
  }

}

/**
 * Handle the expand event, when clicked on the expand button
 */ 
JSONEditor.Node.prototype._onExpand = function (event) {
  var event = event || window.event;
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
}

JSONEditor.Node.types = [
  {'value': 'array', 'className': 'jsoneditor-option-array', 'title': 'Field type "array". An array contains an ordered collection of values.'},
  {'value': 'auto', 'className': 'jsoneditor-option-auto', 'title': 'Field type "auto". The field type is automatically determined from the value and can be a string, number, boolean, or null.'}, 
  {'value': 'object', 'className': 'jsoneditor-option-object', 'title': 'Field type "object". An object contains an unordered set of key/value pairs.'}, 
  {'value': 'string', 'className': 'jsoneditor-option-string', 'title': 'Field type "string". Field type is not determined from the value, but always returned as string.'}
];

/**
 * Create a DOM select box containing the node type
 * @return {HTML DOM} domType
 */ 
JSONEditor.Node.prototype._createDomTypeButton = function () {
  var node = this;
  var domType = document.createElement('button');
  domType.className = 'jsoneditor-type-' + node.type;
  domType.title = 'Change field type';

  return domType;
}


JSONEditor.Node.prototype._onTypeButton = function (event) {
  JSONEditor.Events.stopPropagation(event);
  
  var domType = this.dom.type;  
  
  var node = this;
  var x = JSONEditor.getAbsoluteLeft(domType);
  var y = JSONEditor.getAbsoluteTop(domType) + domType.clientHeight;
  var callback = function (value) {
    node._changeType(value);
    domType.className = 'jsoneditor-type-' + node.type; 
  }
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
}

JSONEditor.showDropDownList = function (params) {
  /*
  console.log(params); // TODO
  var value = prompt('select a value', params.value);
  if (value) {
    callback(value);
  }*/
  
  var select = document.createElement('div');
  select.className = params.className || '';
  select.style.position = 'absolute';
  select.style.left = (params.x || 0) + 'px';
  select.style.top = (params.y || 0) + 'px';
  for (var i = 0; i < params.values.length; i++) {
    var v = params.values[i];
    var text = v.value || String(v);
    var className = 'jsoneditor-option ' + (v.className || '');
    var selected = (text == params.value);
    if (selected)  {
      className += ' ' + params.optionSelectedClassName;
    }
    var option = document.createElement('div');
    option.className = className;
    if (v.title) {
      option.title = v.title;
    }
    option.innerHTML = text;
    option.onmousedown = function (value) {
      return function (event) {
        params.callback(value);
      };
    }(v.value);
    select.appendChild(option);
  }
  
  document.body.appendChild(select);
  params.node.setHighlight(true);
  JSONEditor.freezeHighlight = true;

  // TODO: change to onclick? -> but be sure to remove existing dropdown first
  var onmousedown = JSONEditor.Events.addEventListener(document, 'mousedown', function (event) {
    JSONEditor.freezeHighlight = false;
    params.node.setHighlight(false);
    document.body.removeChild(select);
    JSONEditor.Events.removeEventListener(document, 'mousedown', onmousedown);
  });
}

/**
 * Create a table row with an append button. 
 * @return {HTML DOM} buttonAppend or undefined when unapplicable
 */ 
JSONEditor.Node.prototype.getAppend = function () {
  if (!this.append) {
    this.append = new JSONEditor.AppendNode();
    this.append.parent = this;
  }
  return this.append.getDom();
}

/**
 * Create a remove button. Returns undefined when the structure cannot
 * be removed
 * @return {HTML DOM} removeButton, or undefined when unapplicable
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
}

/**
 * Create a duplicate button. 
 * If the Node is the root node, no duplicate button is available and undefined
 * will be returned
 * @return {HTML DOM} buttonDuplicate
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
}

/**
 * get the type of a value
 * @param {any type} value
 * @return {String} type   Can be 'object', 'array', 'string', 'auto'
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
}

/**
 * cast contents of a string to the correct type. This can be a string, 
 * a number, a boolean, etc
 * @param {String} str
 * @return {String} castedStr
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
}

/**
 * escape a text
 * @param {HTML DOM} text
 * @return {String} escapedText
 */
JSONEditor.Node.prototype._escape = function (text) {
  var htmlEscaped = String(text).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/  /g, ' &nbsp;');
  var json = JSON.stringify(htmlEscaped);
  var escapedText = json.substring(1, json.length - 1);
  return escapedText;
}

/**
 * unescape a string.
 * @param {String} escapedText
 * @return {String} text
 */
JSONEditor.Node.prototype._unescape = function (escapedText) {
  var json = '"' + escapedText + '"';
  var htmlEscaped = JSON.parse(json);
  var text = htmlEscaped.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
  return text;
}

/**
 * Strip html tags from a string
 * @param {String} html 
 * @return {String} text
 */ 
JSONEditor.Node.prototype._stripHTML = function (html) {
  // remove HTML tags
  // code from nickf, http://stackoverflow.com/a/822464/1262753
  return html.replace(/<(?:.|\n)*?>/gm, '');
}

/**
 * Create a new AppendNode. This is a special node which is created at the 
 * end of the list with childs for an object or array
 */ 
JSONEditor.AppendNode = function () {
  this.dom = {};
}

JSONEditor.AppendNode.prototype = new JSONEditor.Node();

/**
 * Helper  
 */
function newTd(className) {
  var td = document.createElement('td');
  td.className = className || '';
  return td;
}

/**
 * Return a table row with an append button. 
 * @return {HTML DOM} dom   TR element
 */ 
JSONEditor.AppendNode.prototype.getDom = function () {
  if (this.dom.tr) {
    return this.dom.tr;
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
}

/**
 * Update the HTML dom of the Node
 */ 
JSONEditor.AppendNode.prototype.updateDom = function () {
  var tdAppend = this.dom.td;
  if (tdAppend) {
    tdAppend.style.paddingLeft = (this.getLevel() * 24 + 26) + 'px';
    // TODO: not so nice hard coded offset
  }
}

/**
 * Handle an event. The event is catched centrally by the editor
 * @param {HTML Event} event
 */ 
JSONEditor.AppendNode.prototype.onEvent = function (event) {
  var type = event.type;
  var target = event.target || event.srcElement;
  var dom = this.dom;
  var node = this;

  var domAppend = dom.append;
  if (target == domAppend) {
    switch (type) {
      case 'click':
        var newNode = new JSONEditor.Node({
          'field': 'field',
          'value': 'value'
        });
        this.parent.appendChild(newNode);
        this.parent.setHighlight(false);
        newNode.focus();
        break;
    
      case 'mouseover':
        this.parent.setHighlight(true);
        break;

      case 'mouseout':
        this.parent.setHighlight(false);
    }
  }
}  

/**
 * Create main frame
 */ 
JSONEditor.prototype._createFrame = function () {
  // create the frame
  this.container.innerHTML = '';  
  this.frame = document.createElement('div');
  this.frame.className = 'jsoneditor-frame';
  this.container.appendChild(this.frame);

  // create one global event listener to handle all events from all nodes
  var editor = this;
  var onEvent = function (event) {
    var event = event || window.event;
    var target = event.target || event.srcElement;
    var node = JSONEditor.getNodeFromTarget(target);
    if (node) {
      node.onEvent(event);
    }
  }
  this.frame.onclick = onEvent;
  this.frame.onchange = onEvent;
  this.frame.onfocus = onEvent;
  this.frame.onblur = onEvent;
  this.frame.onkeyup = onEvent;
  this.frame.oncut = onEvent;
  this.frame.onpaste = onEvent;
  this.frame.onmousedown = onEvent;
  this.frame.onmouseup = onEvent;
  this.frame.onmouseover = onEvent;
  this.frame.onmouseout = onEvent;
  
  // create menu table
  this.head = document.createElement('table');
  this.head.className = 'jsoneditor-menu';
  var tbody = document.createElement('tbody');
  this.head.appendChild(tbody);
  var tr = document.createElement('tr');
  tbody.appendChild(tr);
  var td = document.createElement('td');
  td.className = 'jsoneditor-menu';
  tr.appendChild(td);

  // create expand all button
  var editor = this;
  var expandAll = document.createElement('button');
  expandAll.innerHTML = 'Expand All';
  expandAll.onclick = function () {
    editor.expandAll();
  }
  td.appendChild(expandAll);

  // create expand all button
  var collapseAll = document.createElement('button');
  collapseAll.innerHTML = 'Collapse All';
  collapseAll.onclick = function () {
    editor.collapseAll();
  }
  td.appendChild(collapseAll);

  this.frame.appendChild(this.head);
}


/**
 * Create main table
 */ 
JSONEditor.prototype._createTable = function () {
  var contentOuter = document.createElement('div');
  contentOuter.className = 'jsoneditor-content-outer';
  
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

  /* TODO: remove
  // TODO: replace header with a fixed bar (like the formatter has) 
  // create header column
  var tr, th;  
  tr = document.createElement('tr');
  th = document.createElement('th');
  th.className = 'jsoneditor-th'; 
  var editor = this;
  var expandAll = document.createElement('button');
  expandAll.innerHTML = 'Expand All';
  expandAll.onclick = function () {
    editor.expandAll();
  }
  th.appendChild(expandAll);
  var collapseAll = document.createElement('button');
  collapseAll.innerHTML = 'Collapse All';
  collapseAll.onclick = function () {
    editor.collapseAll();
  }
  th.appendChild(collapseAll);
  th.colSpan = 5;
  tr.appendChild(th);
  this.tbody.appendChild(tr);
  */

  this.frame.appendChild(contentOuter);
}

/**
 * Find the node from an event target
 * @param {HTML DOM} event target
 * @return {JSONEditor.Node} node  or undefined when not found 
 */ 
JSONEditor.getNodeFromTarget = function (target) {
  while (target) {
    if (target.node) {
      return target.node;
    }
    target = target.parentNode;
  }
  
  return undefined;
}


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

  // create menu table
  this.head = document.createElement('table');
  this.head.className = 'jsoneditor-menu';
  var tbody = document.createElement('tbody');
  this.head.appendChild(tbody);
  var tr = document.createElement('tr');
  tbody.appendChild(tr);
  var td = document.createElement('td');
  td.className = 'jsoneditor-menu';
  tr.appendChild(td);
  
  // create format button
  var buttonFormat = document.createElement('button');
  buttonFormat.innerHTML = 'Format';
  buttonFormat.title = 'Format JSON data, with proper indentation and line feeds';
  buttonFormat.className = 'jsoneditor-button';
  td.appendChild(buttonFormat);
  
  // create compact button
  var buttonCompact = document.createElement('button');
  buttonCompact.innerHTML = 'Compact';
  buttonCompact.title = 'Compact JSON data, remove all whitespaces';
  buttonCompact.className = 'jsoneditor-button';
  td.appendChild(buttonCompact);
  this.frame.appendChild(this.head);

  this.content = document.createElement('div');
  this.content.className = 'jsonformatter-content';
  this.frame.appendChild(this.content);

  this.textarea = document.createElement('textarea');
  this.textarea.className = "jsonformatter-textarea";
  this.textarea.spellcheck = false;
  this.content.appendChild(this.textarea);

  var formatter = this;
  var textarea = this.textarea;
  var onChange = function () {
    formatter._checkChange();
  };
  /* TODO: register onchange
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
}

/**
 * This method is executed on error. 
 * It can be overwritten for each instance of the JSONFormatter
 * @param {String} err
 */ 
JSONFormatter.prototype.onError = function(err) {
  // action should be implemented for the instance
}

/**
 * Check if the contents are changed
 */ 
JSONFormatter.prototype._checkChange = function() {
  var content = this.textarea.value;
  
  if (content != this.lastContent) {
    this.lastContent = content;
    if (formatter.onChangeCallback) {
        formatter.onChangeCallback();
    }
  }
}

/**
 * Set json data in the formatter
 * @param {JSON} json
 */ 
JSONFormatter.prototype.set = function(json) {
  this.textarea.value = JSON.stringify(json, null, '  ');
}

/**
 * Get json data from the formatter
 * @return {JSON} json
 */ 
JSONFormatter.prototype.get = function() {
  return JSON.parse(this.textarea.value);
}

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


// create namespace for event methods
JSONEditor.Events = {};

/**
 * Add and event listener. Works for all browsers
 * @param {DOM Element} element    An html element
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
 * @param {DOM element}  element   An html dom element
 * @param {string}       action    The name of the event, for example "mousedown"
 * @param {function}     listener  The listener function
 * @param {boolean}      useCapture
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
 */ 
JSONEditor.Events.stopPropagation = function (event) {
  if (!event) 
    var event = window.event;
  
  if (event.stopPropagation) {
    event.stopPropagation();  // non-IE browsers
  }
  else {
    event.cancelBubble = true;  // IE browsers
  }
}


/**
 * Cancels the event if it is cancelable, without stopping further propagation of the event.
 */ 
JSONEditor.Events.preventDefault = function (event) {
  if (!event) 
    var event = window.event;
  
  if (event.preventDefault) {
    event.preventDefault();  // non-IE browsers
  }
  else {    
    event.returnValue = false;  // IE browsers
  }
}



/**
 * Retrieve the absolute left value of a DOM element
 * @param {DOM element} elem    A dom element, for example a div
 * @return {number} left        The absolute left position of this element
 *                              in the browser page.
 */ 
JSONEditor.getAbsoluteLeft = function (elem) {
  var left = 0;
  while( elem != null ) {
    left += elem.offsetLeft;
    left -= elem.scrollLeft;
    elem = elem.offsetParent;
  }
  if (!document.body.scrollLeft && window.pageXOffset) {
      // FF
      left -= window.pageXOffset;
  }
  return left;
};

/**
 * Retrieve the absolute top value of a DOM element
 * @param {DOM element} elem    A dom element, for example a div
 * @return {number} top        The absolute top position of this element
 *                              in the browser page.
 */ 
JSONEditor.getAbsoluteTop = function (elem) {
  var top = 0;
  while( elem != null ) {
    top += elem.offsetTop;
    top -= elem.scrollTop;
    elem = elem.offsetParent;
  }
  if (!document.body.scrollTop && window.pageYOffset) {
      // FF
      top -= window.pageYOffset;
  }
  return top;
};

/**
 * add a className to the given elements style
 */ 
JSONEditor.addClassName = function(elem, className) {
  var c = elem.className;
  if (c.indexOf(className) == -1) {
    c += ' ' + className;
    elem.className = c;
  }
}

/**
 * add a className to the given elements style
 */ 
JSONEditor.removeClassName = function(elem, className) {
  var c = elem.className;
  if (c.indexOf(className) != -1) {
    c = c.replace(className, ''); // remove classname
    c = c.replace(/  /g, '');     // remove double spaces
    elem.className = c;
  }
}

/**
 * Strip the formatting from the contents of a div
 * the formatting from the div itself is not stripped, only from its childs.
 * @param {HTML Div Element} divElement
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
      for (var j = 0, jMax = attributes.length; j < jMax; j++) {
        var attribute = attributes[j];
        if (attribute.specified == true) {
          child.removeAttribute(attribute.name);
        }
      }
    }
    
    // recursively strip childs
    JSONEditor.stripFormatting(child);
  }
}

/**
 * Set focus to the end of an editable div
 * code from Nico Burns 
 * http://stackoverflow.com/users/140293/nico-burns
 * http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
 */ 
JSONEditor.setEndOfContenteditable = function (contentEditableElement) {
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
}

/**
 * Returns the version of Internet Explorer or a -1
 * (indicating the use of another browser).
 * Source: http://msdn.microsoft.com/en-us/library/ms537509(v=vs.85).aspx
 * @return {Number} Internet Explorer version, or -1 in case of an other browser
 */
JSONEditor.getInternetExplorerVersion = function() {
  var rv = -1; // Return value assumes failure.
  if (navigator.appName == 'Microsoft Internet Explorer')
  {
    var ua = navigator.userAgent;
    var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  return rv;
}

JSONEditor.ieVersion = JSONEditor.getInternetExplorerVersion();
