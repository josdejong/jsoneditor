var Highlighter = require('./Highlighter');
var History = require('./History');
var SearchBox = require('./SearchBox');
var Node = require('./Node');
var modeswitcher = require('./modeswitcher');
var util = require('./util');

// create a mixin with the functions for tree mode
var treemode = {};

/**
 * Create a tree editor
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
 * @private
 */
treemode.create = function (container, options) {
  if (!container) {
    throw new Error('No container element provided.');
  }
  this.container = container;
  this.dom = {};
  this.highlighter = new Highlighter();
  this.selection = undefined; // will hold the last input selection

  this._setOptions(options);

  if (this.options.history && this.options.mode !== 'view') {
    this.history = new History(this);
  }

  this._createFrame();
  this._createTable();
};

/**
 * Detach the editor from the DOM
 * @private
 */
treemode._delete = function () {
  if (this.frame && this.container && this.frame.parentNode == this.container) {
    this.container.removeChild(this.frame);
  }
};

/**
 * Initialize and set default options
 * @param {Object}  [options]    See description in constructor
 * @private
 */
treemode._setOptions = function (options) {
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
  }
};

// node currently being edited
var focusNode = undefined;

// dom having focus
var domFocus = null;

/**
 * Set JSON object in editor
 * @param {Object | undefined} json      JSON data
 * @param {String}             [name]    Optional field name for the root node.
 *                                       Can also be set using setName(name).
 */
treemode.set = function (json, name) {
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
treemode.get = function () {
  // remove focus from currently edited node
  if (focusNode) {
    focusNode.blur();
  }

  if (this.node) {
    return this.node.getValue();
  }
  else {
    return undefined;
  }
};

/**
 * Get the text contents of the editor
 * @return {String} jsonText
 */
treemode.getText = function() {
  return JSON.stringify(this.get());
};

/**
 * Set the text contents of the editor
 * @param {String} jsonText
 */
treemode.setText = function(jsonText) {
  this.set(util.parse(jsonText));
};

/**
 * Set a field name for the root node.
 * @param {String | undefined} name
 */
treemode.setName = function (name) {
  this.options.name = name;
  if (this.node) {
    this.node.updateField(this.options.name);
  }
};

/**
 * Get the field name for the root node.
 * @return {String | undefined} name
 */
treemode.getName = function () {
  return this.options.name;
};

/**
 * Set focus to the editor. Focus will be set to:
 * - the first editable field or value, or else
 * - to the expand button of the root node, or else
 * - to the context menu button of the root node, or else
 * - to the first button in the top menu
 */
treemode.focus = function () {
  var input = this.content.querySelector('[contenteditable=true]');
  if (input) {
    input.focus();
  }
  else if (this.node.dom.expand) {
    this.node.dom.expand.focus();
  }
  else if (this.node.dom.menu) {
    this.node.dom.menu.focus();
  }
  else {
    // focus to the first button in the menu
    input = this.frame.querySelector('button');
    if (input) {
      input.focus();
    }
  }
};

/**
 * Remove the root node from the editor
 */
treemode.clear = function () {
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
treemode._setRoot = function (node) {
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
treemode.search = function (text) {
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
treemode.expandAll = function () {
  if (this.node) {
    this.content.removeChild(this.table);  // Take the table offline
    this.node.expand();
    this.content.appendChild(this.table);  // Put the table online again
  }
};

/**
 * Collapse all nodes
 */
treemode.collapseAll = function () {
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
treemode._onAction = function (action, params) {
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
treemode.startAutoScroll = function (mouseY) {
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
treemode.stopAutoScroll = function () {
  if (this.autoScrollTimer) {
    clearTimeout(this.autoScrollTimer);
    delete this.autoScrollTimer;
  }
  if (this.autoScrollStep) {
    delete this.autoScrollStep;
  }
};


/**
 * Set the focus to an element in the editor, set text selection, and
 * set scroll position.
 * @param {Object} selection  An object containing fields:
 *                            {Element | undefined} dom     The dom element
 *                                                          which has focus
 *                            {Range | TextRange} range     A text selection
 *                            {Number} scrollTop            Scroll position
 */
treemode.setSelection = function (selection) {
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
treemode.getSelection = function () {
  return {
    dom: domFocus,
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
treemode.scrollTo = function (top, callback) {
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
treemode._createFrame = function () {
  // create the frame
  this.frame = document.createElement('div');
  this.frame.className = 'jsoneditor';
  this.container.appendChild(this.frame);

  // create one global event listener to handle all events from all nodes
  var editor = this;
  function onEvent(event) {
    editor._onEvent(event);
  }
  this.frame.onclick = function (event) {
    var target = event.target;// || event.srcElement;

    onEvent(event);

    // prevent default submit action of buttons when editor is located
    // inside a form
    if (target.nodeName == 'BUTTON') {
      event.preventDefault();
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
    // create undo button
    var undo = document.createElement('button');
    undo.className = 'undo separator';
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

  // create mode box
  if (this.options && this.options.modes && this.options.modes.length) {
    var modeBox = modeswitcher.create(this, this.options.modes, this.options.mode);
    this.menu.appendChild(modeBox);
    this.dom.modeBox = modeBox;
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
treemode._onUndo = function () {
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
treemode._onRedo = function () {
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
treemode._onEvent = function (event) {
  var target = event.target;

  if (event.type == 'keydown') {
    this._onKeyDown(event);
  }

  if (event.type == 'focus') {
    domFocus = target;
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
treemode._onKeyDown = function (event) {
  var keynum = event.which || event.keyCode;
  var ctrlKey = event.ctrlKey;
  var shiftKey = event.shiftKey;
  var handled = false;

  if (keynum == 9) { // Tab or Shift+Tab
    setTimeout(function () {
      // select all text when moving focus to an editable div
      util.selectContentEditable(domFocus);
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
    event.preventDefault();
    event.stopPropagation();
  }
};

/**
 * Create main table
 * @private
 */
treemode._createTable = function () {
  var contentOuter = document.createElement('div');
  contentOuter.className = 'outer';
  this.contentOuter = contentOuter;

  this.content = document.createElement('div');
  this.content.className = 'tree';
  contentOuter.appendChild(this.content);

  this.table = document.createElement('table');
  this.table.className = 'tree';
  this.content.appendChild(this.table);

  // create colgroup where the first two columns don't have a fixed
  // width, and the edit columns do have a fixed width
  var col;
  this.colgroupContent = document.createElement('colgroup');
  if (this.options.mode === 'tree') {
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

// define modes
module.exports = [
  {
    mode: 'tree',
    mixin: treemode,
    data: 'json'
  },
  {
    mode: 'view',
    mixin: treemode,
    data: 'json'
  },
  {
    mode: 'form',
    mixin: treemode,
    data: 'json'
  }
];