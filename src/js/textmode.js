'use strict';

var ace = require('./ace');
var jmespath = require('jmespath');
var translate = require('./i18n').translate;
var ModeSwitcher = require('./ModeSwitcher');
var ErrorTable = require('./ErrorTable');
var validateCustom = require('./validationUtils').validateCustom;
var showSortModal = require('./showSortModal');
var showTransformModal = require('./showTransformModal');
var util = require('./util');
var DEFAULT_MODAL_ANCHOR = require('./constants').DEFAULT_MODAL_ANCHOR;

// create a mixin with the functions for text mode
var textmode = {};

var DEFAULT_THEME = 'ace/theme/jsoneditor';

/**
 * Create a text editor
 * @param {Element} container
 * @param {Object} [options]   Object with options. See docs for details.
 * @private
 */
textmode.create = function (container, options) {
  // read options
  options = options || {};
  
  if (typeof options.statusBar === 'undefined') {
    options.statusBar = true;
  }

  // setting default for textmode
  options.mainMenuBar = options.mainMenuBar !== false;
  options.enableSort = options.enableSort !== false;
  options.enableTransform = options.enableTransform !== false;

  this.options = options;

  // indentation
  if (options.indentation) {
    this.indentation = Number(options.indentation);
  }
  else {
    this.indentation = 2; // number of spaces
  }

  // grab ace from options if provided
  var _ace = options.ace ? options.ace : ace;
  // TODO: make the option options.ace deprecated, it's not needed anymore (see #309)

  // determine mode
  this.mode = (options.mode == 'code') ? 'code' : 'text';
  if (this.mode == 'code') {
    // verify whether Ace editor is available and supported
    if (typeof _ace === 'undefined') {
      this.mode = 'text';
      console.warn('Failed to load Ace editor, falling back to plain text mode. Please use a JSONEditor bundle including Ace, or pass Ace as via the configuration option `ace`.');
    }
  }

  // determine theme
  this.theme = options.theme || DEFAULT_THEME;
  if (this.theme === DEFAULT_THEME && _ace) {
    try {
      require('./ace/theme-jsoneditor');
    }
    catch (err) {
      console.error(err);
    }
  }

  if (options.onTextSelectionChange) {
    this.onTextSelectionChange(options.onTextSelectionChange);
  }

  var me = this;
  this.container = container;
  this.dom = {};
  this.aceEditor = undefined;  // ace code editor
  this.textarea = undefined;  // plain text editor (fallback when Ace is not available)
  this.validateSchema = null;
  this.annotations = [];

  // create a debounced validate function
  this._debouncedValidate = util.debounce(this.validate.bind(this), this.DEBOUNCE_INTERVAL);

  this.width = container.clientWidth;
  this.height = container.clientHeight;

  this.frame = document.createElement('div');
  this.frame.className = 'jsoneditor jsoneditor-mode-' + this.options.mode;
  this.frame.onclick = function (event) {
    // prevent default submit action when the editor is located inside a form
    event.preventDefault();
  };
  this.frame.onkeydown = function (event) {
    me._onKeyDown(event);
  };

  this.content = document.createElement('div');
  this.content.className = 'jsoneditor-outer';

  if (this.options.mainMenuBar) {
    util.addClassName(this.content, 'has-main-menu-bar');

    // create menu
    this.menu = document.createElement('div');
    this.menu.className = 'jsoneditor-menu';
    this.frame.appendChild(this.menu);

    // create format button
    var buttonFormat = document.createElement('button');
    buttonFormat.type = 'button';
    buttonFormat.className = 'jsoneditor-format';
    buttonFormat.title = 'Format JSON data, with proper indentation and line feeds (Ctrl+\\)';
    this.menu.appendChild(buttonFormat);
    buttonFormat.onclick = function () {
      try {
        me.format();
        me._onChange();
      }
      catch (err) {
        me._onError(err);
      }
    };

    // create compact button
    var buttonCompact = document.createElement('button');
    buttonCompact.type = 'button';
    buttonCompact.className = 'jsoneditor-compact';
    buttonCompact.title = 'Compact JSON data, remove all whitespaces (Ctrl+Shift+\\)';
    this.menu.appendChild(buttonCompact);
    buttonCompact.onclick = function () {
      try {
        me.compact();
        me._onChange();
      }
      catch (err) {
        me._onError(err);
      }
    };

    // create sort button
    if (this.options.enableSort) {
      var sort = document.createElement('button');
      sort.type = 'button';
      sort.className = 'jsoneditor-sort';
      sort.title = translate('sortTitleShort');
      sort.onclick = function () {
        me._showSortModal();
      };
      this.menu.appendChild(sort);
    }

    // create transform button
    if (this.options.enableTransform) {
      var transform = document.createElement('button');
      transform.type = 'button';
      transform.title = translate('transformTitleShort');
      transform.className = 'jsoneditor-transform';
      transform.onclick = function () {
        me._showTransformModal();
      };
      this.menu.appendChild(transform);
    }

    // create repair button
    var buttonRepair = document.createElement('button');
    buttonRepair.type = 'button';
    buttonRepair.className = 'jsoneditor-repair';
    buttonRepair.title = 'Repair JSON: fix quotes and escape characters, remove comments and JSONP notation, turn JavaScript objects into JSON.';
    this.menu.appendChild(buttonRepair);
    buttonRepair.onclick = function () {
      try {
        me.repair();
        me._onChange();
      }
      catch (err) {
        me._onError(err);
      }
    };

    // create mode box
    if (this.options && this.options.modes && this.options.modes.length) {
      this.modeSwitcher = new ModeSwitcher(this.menu, this.options.modes, this.options.mode, function onSwitch(mode) {
        // switch mode and restore focus
        me.setMode(mode);
        me.modeSwitcher.focus();
      });
    }

    if (this.mode === 'code') {
      var poweredBy = document.createElement('a');
      poweredBy.appendChild(document.createTextNode('powered by ace'));
      poweredBy.href = 'http://ace.ajax.org';
      poweredBy.target = '_blank';
      poweredBy.className = 'jsoneditor-poweredBy';
      poweredBy.onclick = function () {
        // TODO: this anchor falls below the margin of the content,
        // therefore the normal a.href does not work. We use a click event
        // for now, but this should be fixed.
        window.open(poweredBy.href, poweredBy.target);
      };
      this.menu.appendChild(poweredBy);
    }
  }

  var emptyNode = {};
  var isReadOnly = (this.options.onEditable
  && typeof(this.options.onEditable === 'function')
  && !this.options.onEditable(emptyNode));

  this.frame.appendChild(this.content);
  this.container.appendChild(this.frame);

  if (this.mode === 'code') {
    this.editorDom = document.createElement('div');
    this.editorDom.style.height = '100%'; // TODO: move to css
    this.editorDom.style.width = '100%'; // TODO: move to css
    this.content.appendChild(this.editorDom);

    var aceEditor = _ace.edit(this.editorDom);
    var aceSession = aceEditor.getSession();
    aceEditor.$blockScrolling = Infinity;
    aceEditor.setTheme(this.theme);
    aceEditor.setOptions({ readOnly: isReadOnly });
    aceEditor.setShowPrintMargin(false);
    aceEditor.setFontSize(13);
    aceSession.setMode('ace/mode/json');
    aceSession.setTabSize(this.indentation);
    aceSession.setUseSoftTabs(true);
    aceSession.setUseWrapMode(true);
    
    // replace ace setAnnotations with custom function that also covers jsoneditor annotations
    var originalSetAnnotations = aceSession.setAnnotations;
    aceSession.setAnnotations = function (annotations) {
      originalSetAnnotations.call(this, annotations && annotations.length ? annotations : me.annotations);
    };
    
    aceEditor.commands.bindKey('Ctrl-L', null);    // disable Ctrl+L (is used by the browser to select the address bar)
    aceEditor.commands.bindKey('Command-L', null); // disable Ctrl+L (is used by the browser to select the address bar)
    this.aceEditor = aceEditor;

    // TODO: deprecated since v5.0.0. Cleanup backward compatibility some day
    if (!this.hasOwnProperty('editor')) {
      Object.defineProperty(this, 'editor', {
        get: function () {
          console.warn('Property "editor" has been renamed to "aceEditor".');
          return me.aceEditor;
        },
        set: function (aceEditor) {
          console.warn('Property "editor" has been renamed to "aceEditor".');
          me.aceEditor = aceEditor;
        }
      });
    }

    // register onchange event
    aceEditor.on('change', this._onChange.bind(this));
    aceEditor.on('changeSelection', this._onSelect.bind(this));
  }
  else {
    // load a plain text textarea
    var textarea = document.createElement('textarea');
    textarea.className = 'jsoneditor-text';
    textarea.spellcheck = false;
    this.content.appendChild(textarea);
    this.textarea = textarea;
    this.textarea.readOnly = isReadOnly;

    // register onchange event
    if (this.textarea.oninput === null) {
      this.textarea.oninput = this._onChange.bind(this);
    }
    else {
      // oninput is undefined. For IE8-
      this.textarea.onchange = this._onChange.bind(this);
    }

    textarea.onselect = this._onSelect.bind(this);
    textarea.onmousedown = this._onMouseDown.bind(this);
    textarea.onblur = this._onBlur.bind(this);
  }

  this.errorTable = new ErrorTable({
    errorTableVisible: this.mode === 'text',
    onToggleVisibility: function () {
      me.validate();
    },
    onFocusLine: function  (line) {
      me.isFocused = true;
      if (!isNaN(line)) {
        me.setTextSelection({row: line, column: 1}, {row: line, column: 1000});
      }
    },
    onChangeHeight: function (height) {
      // TODO: change CSS to using flex box, remove setting height using JavaScript
      var totalHeight = height + me.dom.statusBar.clientHeight + 1;
      me.content.style.marginBottom = (-totalHeight) + 'px';
      me.content.style.paddingBottom = totalHeight + 'px';
    }
  });
  this.frame.appendChild(this.errorTable.getErrorTable());

  if (options.statusBar) {
    util.addClassName(this.content, 'has-status-bar');

    this.curserInfoElements = {};
    var statusBar = document.createElement('div');
    this.dom.statusBar = statusBar;
    statusBar.className = 'jsoneditor-statusbar';
    this.frame.appendChild(statusBar);

    var lnLabel = document.createElement('span');
    lnLabel.className = 'jsoneditor-curserinfo-label';
    lnLabel.innerText = 'Ln:';

    var lnVal = document.createElement('span');
    lnVal.className = 'jsoneditor-curserinfo-val';
    lnVal.innerText = '1';

    statusBar.appendChild(lnLabel);
    statusBar.appendChild(lnVal);

    var colLabel = document.createElement('span');
    colLabel.className = 'jsoneditor-curserinfo-label';
    colLabel.innerText = 'Col:';

    var colVal = document.createElement('span');
    colVal.className = 'jsoneditor-curserinfo-val';
    colVal.innerText = '1';

    statusBar.appendChild(colLabel);
    statusBar.appendChild(colVal);

    this.curserInfoElements.colVal = colVal;
    this.curserInfoElements.lnVal = lnVal;

    var countLabel = document.createElement('span');
    countLabel.className = 'jsoneditor-curserinfo-label';
    countLabel.innerText = 'characters selected';
    countLabel.style.display = 'none';

    var countVal = document.createElement('span');
    countVal.className = 'jsoneditor-curserinfo-count';
    countVal.innerText = '0';
    countVal.style.display = 'none';

    this.curserInfoElements.countLabel = countLabel;
    this.curserInfoElements.countVal = countVal;

    statusBar.appendChild(countVal);
    statusBar.appendChild(countLabel);

    statusBar.appendChild(this.errorTable.getErrorCounter());
    statusBar.appendChild(this.errorTable.getWarningIcon());
    statusBar.appendChild(this.errorTable.getErrorIcon());
  }

  this.setSchema(this.options.schema, this.options.schemaRefs);  
};

/**
 * Handle a change:
 * - Validate JSON schema
 * - Send a callback to the onChange listener if provided
 * @private
 */
textmode._onChange = function () {
  if (this.onChangeDisabled) {
    return;
  }

  // validate JSON schema (if configured)
  this._debouncedValidate();

  // trigger the onChange callback
  if (this.options.onChange) {
    try {
      this.options.onChange();
    }
    catch (err) {
      console.error('Error in onChange callback: ', err);
    }
  }

  // trigger the onChangeText callback
  if (this.options.onChangeText) {
    try {
      this.options.onChangeText(this.getText());
    }
    catch (err) {
      console.error('Error in onChangeText callback: ', err);
    }
  }
};

/**
 * Open a sort modal
 * @private
 */
textmode._showSortModal = function () {
  var me = this;
  var container = this.options.modalAnchor || DEFAULT_MODAL_ANCHOR;
  var json = this.get();

  function onSort (sortedBy) {
    if (Array.isArray(json)) {
      var sortedJson = util.sort(json, sortedBy.path, sortedBy.direction);

      me.sortedBy = sortedBy
      me.set(sortedJson);
    }

    if (util.isObject(json)) {
      var sortedJson = util.sortObjectKeys(json, sortedBy.direction);

      me.sortedBy = sortedBy;
      me.set(sortedJson);
    }
  }

  showSortModal(container, json, onSort, me.sortedBy)
}

/**
 * Open a transform modal
 * @private
 */
textmode._showTransformModal = function () {
  var me = this;
  var anchor = this.options.modalAnchor || DEFAULT_MODAL_ANCHOR;
  var json = this.get();
  showTransformModal(anchor, json, function (query) {
    var updatedJson = jmespath.search(json, query);
    me.set(updatedJson);
  })
}

/**
 * Handle text selection
 * Calculates the cursor position and selection range and updates menu
 * @private
 */
textmode._onSelect = function () {
  this._updateCursorInfo();
  this._emitSelectionChange();
};

/**
 * Event handler for keydown. Handles shortcut keys
 * @param {Event} event
 * @private
 */
textmode._onKeyDown = function (event) {
  var keynum = event.which || event.keyCode;
  var handled = false;

  if (keynum == 220 && event.ctrlKey) {
    if (event.shiftKey) { // Ctrl+Shift+\
      this.compact();
      this._onChange();
    }
    else { // Ctrl+\
      this.format();
      this._onChange();
    }
    handled = true;
  }

  if (handled) {
    event.preventDefault();
    event.stopPropagation();
  }

  this._updateCursorInfo();
  this._emitSelectionChange();
};

/**
 * Event handler for mousedown.
 * @private
 */
textmode._onMouseDown = function () {
  this._updateCursorInfo();
  this._emitSelectionChange();
};

/**
 * Event handler for blur.
 * @private
 */
textmode._onBlur = function () {
  var me = this;
  // this allows to avoid blur when clicking inner elements (like the errors panel)
  // just make sure to set the isFocused to true on the inner element onclick callback
  setTimeout(function(){
    if (!me.isFocused) {
      me._updateCursorInfo();
      me._emitSelectionChange();
    }
    me.isFocused = false;
  });
};

/**
 * Update the cursor info and the status bar, if presented
 */
textmode._updateCursorInfo = function () {
  var me = this;
  var line, col, count;

  if (this.textarea) {
    setTimeout(function() { //this to verify we get the most updated textarea cursor selection
      var selectionRange = util.getInputSelection(me.textarea);
      
      if (selectionRange.startIndex !== selectionRange.endIndex) {
        count = selectionRange.endIndex - selectionRange.startIndex;
      }
      
      if (count && me.cursorInfo && me.cursorInfo.line === selectionRange.end.row && me.cursorInfo.column === selectionRange.end.column) {
        line = selectionRange.start.row;
        col = selectionRange.start.column;
      } else {
        line = selectionRange.end.row;
        col = selectionRange.end.column;
      }
      
      me.cursorInfo = {
        line: line,
        column: col,
        count: count
      };

      if(me.options.statusBar) {
        updateDisplay();
      }
    },0);
    
  } else if (this.aceEditor && this.curserInfoElements) {
    var curserPos = this.aceEditor.getCursorPosition();
    var selectedText = this.aceEditor.getSelectedText();

    line = curserPos.row + 1;
    col = curserPos.column + 1;
    count = selectedText.length;

    me.cursorInfo = {
      line: line,
      column: col,
      count: count
    };

    if(this.options.statusBar) {
      updateDisplay();
    }
  }

  function updateDisplay() {

    if (me.curserInfoElements.countVal.innerText !== count) {
      me.curserInfoElements.countVal.innerText = count;
      me.curserInfoElements.countVal.style.display = count ? 'inline' : 'none';
      me.curserInfoElements.countLabel.style.display = count ? 'inline' : 'none';
    }
    me.curserInfoElements.lnVal.innerText = line;
    me.curserInfoElements.colVal.innerText = col;
  }
};

/**
 * emits selection change callback, if given
 * @private
 */
textmode._emitSelectionChange = function () {
  if(this._selectionChangedHandler) {
    var currentSelection = this.getTextSelection();
    this._selectionChangedHandler(currentSelection.start, currentSelection.end, currentSelection.text);
  }
};

/**
 * refresh ERROR annotations state
 * error annotations are handled by the ace json mode (ace/mode/json)
 * validation annotations are handled by this mode
 * therefore in order to refresh we send only the annotations of error type in order to maintain its state 
 * @private
 */
textmode._refreshAnnotations = function () {  
  var session = this.aceEditor && this.aceEditor.getSession();
  if (session) {
    var errEnnotations = session.getAnnotations().filter(function(annotation) {return annotation.type === 'error' });
    session.setAnnotations(errEnnotations);
  }
};

/**
 * Destroy the editor. Clean up DOM, event listeners, and web workers.
 */
textmode.destroy = function () {
  // remove old ace editor
  if (this.aceEditor) {
    this.aceEditor.destroy();
    this.aceEditor = null;
  }

  if (this.frame && this.container && this.frame.parentNode === this.container) {
    this.container.removeChild(this.frame);
  }

  if (this.modeSwitcher) {
    this.modeSwitcher.destroy();
    this.modeSwitcher = null;
  }

  this.textarea = null;
  
  this._debouncedValidate = null;
};

/**
 * Compact the code in the text editor
 */
textmode.compact = function () {
  var json = this.get();
  var text = JSON.stringify(json);
  this._setText(text, false);
};

/**
 * Format the code in the text editor
 */
textmode.format = function () {
  var json = this.get();
  var text = JSON.stringify(json, null, this.indentation);
  this._setText(text, false);
};

/**
 * Repair the code in the text editor
 */
textmode.repair = function () {
  var text = this.getText();
  var repairedText = util.repair(text);
  this._setText(repairedText, false);
};

/**
 * Set focus to the formatter
 */
textmode.focus = function () {
  if (this.textarea) {
    this.textarea.focus();
  }
  if (this.aceEditor) {
    this.aceEditor.focus();
  }
};

/**
 * Resize the formatter
 */
textmode.resize = function () {
  if (this.aceEditor) {
    var force = false;
    this.aceEditor.resize(force);
  }
};

/**
 * Set json data in the formatter
 * @param {*} json
 */
textmode.set = function(json) {
  this.setText(JSON.stringify(json, null, this.indentation));
};

/**
 * Update data. Same as calling `set` in text/code mode.
 * @param {*} json
 */
textmode.update = function(json) {
  this.updateText(JSON.stringify(json, null, this.indentation));
};

/**
 * Get json data from the formatter
 * @return {*} json
 */
textmode.get = function() {
  var text = this.getText();

  return util.parse(text); // this can throw an error
};

/**
 * Get the text contents of the editor
 * @return {String} jsonText
 */
textmode.getText = function() {
  if (this.textarea) {
    return this.textarea.value;
  }
  if (this.aceEditor) {
    return this.aceEditor.getValue();
  }
  return '';
};

/**
 * Set the text contents of the editor and optionally clear the history
 * @param {String} jsonText
 * @param {boolean} clearHistory   Only applicable for mode 'code'
 * @private
 */
textmode._setText = function(jsonText, clearHistory) {
  var text;

  if (this.options.escapeUnicode === true) {
    text = util.escapeUnicodeChars(jsonText);
  }
  else {
    text = jsonText;
  }

  if (this.textarea) {
    this.textarea.value = text;
  }
  if (this.aceEditor) {
    // prevent emitting onChange events while setting new text
    this.onChangeDisabled = true;

    this.aceEditor.setValue(text, -1);

    if (clearHistory) {
      // prevent initial undo action clearing the initial contents
      var me = this;
      setTimeout(function () {
        me.aceEditor.session.getUndoManager().reset();
      }, 0);
    }

    this.onChangeDisabled = false;
  }
  // validate JSON schema
  this._debouncedValidate();
};

/**
 * Set the text contents of the editor
 * @param {String} jsonText
 */
textmode.setText = function(jsonText) {
  this._setText(jsonText, true)
};

/**
 * Update the text contents
 * @param {string} jsonText
 */
textmode.updateText = function(jsonText) {
  // don't update if there are no changes
  if (this.getText() === jsonText) {
    return;
  }

  this._setText(jsonText, false);
};

/**
 * Validate current JSON object against the configured JSON schema
 * Throws an exception when no JSON schema is configured
 */
textmode.validate = function () {
  var schemaErrors = [];
  var parseErrors = [];
  var json;
  try {
    json = this.get(); // this can fail when there is no valid json

    // execute JSON schema validation (ajv)
    if (this.validateSchema) {
      var valid = this.validateSchema(json);
      if (!valid) {
        schemaErrors = this.validateSchema.errors.map(function (error) {
          error.type = "validation";
          return util.improveSchemaError(error);
        });
      }
    }

    // execute custom validation and after than merge and render all errors
    // TODO: implement a better mechanism for only using the last validation action
    this.validationSequence = (this.validationSequence || 0) + 1;
    var me = this;
    var seq = this.validationSequence;
    validateCustom(json, this.options.onValidate)
        .then(function (customValidationErrors) {
          // only apply when there was no other validation started whilst resolving async results
          if (seq === me.validationSequence) {
            var errors = schemaErrors.concat(parseErrors).concat(customValidationErrors);
            me._renderErrors(errors);
          }
        })
        .catch(function (err) {
          console.error('Custom validation function did throw an error', err);
        });
  }
  catch (err) {
    if (this.getText()) {
      // try to extract the line number from the jsonlint error message
      var match = /\w*line\s*(\d+)\w*/g.exec(err.message);
      var line;
      if (match) {
        line = +match[1];
      }
      parseErrors = [{
        type: 'error',
        message: err.message.replace(/\n/g, '<br>'),
        line: line
      }];
    }

    this._renderErrors(parseErrors);
  }
};

textmode._renderErrors = function(errors) {
  var jsonText = this.getText();
  var errorPaths = [];
  errors.reduce(function(acc, curr) {
    if(acc.indexOf(curr.dataPath) === -1) {
      acc.push(curr.dataPath);
    }
    return acc;
  }, errorPaths);
  var errorLocations = util.getPositionForPath(jsonText, errorPaths);

  // render annotations in Ace Editor (if any)
  if (this.aceEditor) {
    this.annotations = errorLocations.map(function (errLoc) {
      var validationErrors = errors.filter(function(err){ return err.dataPath === errLoc.path; });
      var message = validationErrors.map(function(err) { return err.message }).join('\n');
      if (message) {
        return {
          row: errLoc.line,
          column: errLoc.column,
          text: 'Schema validation error' + (validationErrors.length !== 1 ? 's' : '') + ': \n' + message,
          type: 'warning',
          source: 'jsoneditor',
        }
      }

      return {};
    });
    this._refreshAnnotations();
  }

  // render errors in the errors table (if any)
  this.errorTable.setErrors(errors, errorLocations);

  // update the height of the ace editor
  if (this.aceEditor) {
    var force = false;
    this.aceEditor.resize(force);
  }
};

/**
 * Get the selection details
 * @returns {{start:{row:Number, column:Number},end:{row:Number, column:Number},text:String}}
 */
textmode.getTextSelection = function () {
  var selection = {};
  if (this.textarea) {
    var selectionRange = util.getInputSelection(this.textarea);

    if (this.cursorInfo && this.cursorInfo.line === selectionRange.end.row && this.cursorInfo.column === selectionRange.end.column) {
      //selection direction is bottom => up
      selection.start = selectionRange.end;
      selection.end = selectionRange.start;
    } else {
      selection = selectionRange;
    }

    return {
      start: selection.start,
      end: selection.end,
      text: this.textarea.value.substring(selectionRange.startIndex, selectionRange.endIndex)
    }
  }

  if (this.aceEditor) {
    var aceSelection = this.aceEditor.getSelection();
    var selectedText = this.aceEditor.getSelectedText();
    var range = aceSelection.getRange();
    var lead = aceSelection.getSelectionLead();

    if (lead.row === range.end.row && lead.column === range.end.column) {
      selection = range;
    } else {
      //selection direction is bottom => up
      selection.start = range.end;
      selection.end = range.start;
    }
    
    return {
      start: {
        row: selection.start.row + 1,
        column: selection.start.column + 1
      },
      end: {
        row: selection.end.row + 1,
        column: selection.end.column + 1
      },
      text: selectedText
    };
  }
};

/**
 * Callback registration for selection change
 * @param {selectionCallback} callback
 * 
 * @callback selectionCallback
 */
textmode.onTextSelectionChange = function (callback) {
  if (typeof callback === 'function') {
    this._selectionChangedHandler = util.debounce(callback, this.DEBOUNCE_INTERVAL);
  }
};

/**
 * Set selection on editor's text
 * @param {{row:Number, column:Number}} startPos selection start position
 * @param {{row:Number, column:Number}} endPos selected end position
 */
textmode.setTextSelection = function (startPos, endPos) {

  if (!startPos || !endPos) return;

  if (this.textarea) {
    var startIndex = util.getIndexForPosition(this.textarea, startPos.row, startPos.column);
    var endIndex = util.getIndexForPosition(this.textarea, endPos.row, endPos.column);
    if (startIndex > -1 && endIndex  > -1) {
      if (this.textarea.setSelectionRange) {
        this.textarea.focus();
        this.textarea.setSelectionRange(startIndex, endIndex);
      } else if (this.textarea.createTextRange) { // IE < 9
        var range = this.textarea.createTextRange();
        range.collapse(true);
        range.moveEnd('character', endIndex);
        range.moveStart('character', startIndex);
        range.select();
      }
      var rows = (this.textarea.value.match(/\n/g) || []).length + 1;
      var lineHeight =  this.textarea.scrollHeight / rows;
      var selectionScrollPos = (startPos.row * lineHeight);
      this.textarea.scrollTop = selectionScrollPos > this.textarea.clientHeight ? (selectionScrollPos - (this.textarea.clientHeight / 2)) : 0;
    }
  } else if (this.aceEditor) {
    var range = {
      start:{
        row: startPos.row - 1,
        column: startPos.column - 1
      },
      end:{
        row: endPos.row - 1,
        column: endPos.column - 1
      }
    };
    this.aceEditor.selection.setRange(range);
    this.aceEditor.scrollToLine(startPos.row - 1, true);
  }
};

function load () {
  try {
    this.format()
  }
  catch (err) {
    // in case of an error, just move on, failing formatting is not a big deal
  }
}

// define modes
module.exports = [
  {
    mode: 'text',
    mixin: textmode,
    data: 'text',
    load: load
  },
  {
    mode: 'code',
    mixin: textmode,
    data: 'text',
    load: load
  }
];
