'use strict';

var jmespath = require('jmespath');
var translate = require('./i18n').translate;
var ModeSwitcher = require('./ModeSwitcher');
var showSortModal = require('./showSortModal');
var showTransformModal = require('./showTransformModal');
var util = require('./util');

// create a mixin with the functions for text mode
var previewmode = {};

var DEFAULT_MODAL_ANCHOR = document.body; // TODO: this constant is defined multiple times
var MAX_PREVIEW_CHARACTERS = 100000; // should be enough to fill the editor window

/**
 * Create a JSON document preview, suitable for processing of large documents
 * @param {Element} container
 * @param {Object} [options]   Object with options. available options:
 *                             {String} mode             Available values: "preview".
 *                             {Number} indentation      Number of indentation
 *                                                       spaces. 2 by default.
 *                             {function} onChange       Callback method triggered on change.
 *                                                       Does not pass the changed contents.
 *                             {function} onChangeText   Callback method, triggered
 *                                                       in modes on change of contents,
 *                                                       passing the changed contents
 *                                                       as stringified JSON.
 *                             {function} onModeChange   Callback method
 *                                                       triggered after setMode
 *                             {boolean} escapeUnicode   If true, unicode
 *                                                       characters are escaped.
 *                                                       false by default.
 * @private
 */
previewmode.create = function (container, options) {
  // read options
  options = options || {};
  
  if (typeof options.statusBar === 'undefined') {
    options.statusBar = true;
  }

  // setting default for previewmode
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

  // determine mode
  this.mode = 'preview';

  var me = this;
  this.container = container;
  this.dom = {};

  this.json = undefined;
  this.text = '';

  // TODO: JSON Schema support

  // create a debounced validate function
  this._debouncedValidate = util.debounce(this.validate.bind(this), this.DEBOUNCE_INTERVAL);

  this.width = container.clientWidth;
  this.height = container.clientHeight;

  this.frame = document.createElement('div');
  this.frame.className = 'jsoneditor jsoneditor-mode-preview';
  this.frame.onclick = function (event) {
    // prevent default submit action when the editor is located inside a form
    event.preventDefault();
  };

  this.content = document.createElement('div');
  this.content.className = 'jsoneditor-outer';

  this.dom.previewContent = document.createElement('pre');
  this.dom.previewContent.className = 'jsoneditor-preview';
  this.dom.previewText = document.createTextNode('');
  this.dom.previewContent.appendChild(this.dom.previewText);
  this.content.appendChild(this.dom.previewContent);

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
  }

  this.frame.appendChild(this.content);
  this.container.appendChild(this.frame);

  if (options.statusBar) {
    util.addClassName(this.content, 'has-status-bar');

    var statusBar = document.createElement('div');
    this.dom.statusBar = statusBar;
    statusBar.className = 'jsoneditor-statusbar';
    this.frame.appendChild(statusBar);

    this.dom.sizeInfo = document.createElement('span');
    this.dom.sizeInfo.className = 'jsoneditor-size-info';
    this.dom.sizeInfo.innerText = '';

    statusBar.appendChild(this.dom.sizeInfo);
  }

  this.renderPreview();

  this.setSchema(this.options.schema, this.options.schemaRefs);  
};

previewmode.renderPreview = function () {
  var text = this.getText();

  this.dom.previewText.nodeValue = (text.length > MAX_PREVIEW_CHARACTERS)
    ? (text.slice(0, MAX_PREVIEW_CHARACTERS) + '...')
    : text;

  this.dom.sizeInfo.innerText = 'Size: ' + util.formatSize(text.length)
};

/**
 * Handle a change:
 * - Validate JSON schema
 * - Send a callback to the onChange listener if provided
 * @private
 */
previewmode._onChange = function () {
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
previewmode._showSortModal = function () {
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
previewmode._showTransformModal = function () {
  var me = this;
  var anchor = this.options.modalAnchor || DEFAULT_MODAL_ANCHOR;
  var json = this.get();
  showTransformModal(anchor, json, function (query) {
    var updatedJson = jmespath.search(json, query);
    me.set(updatedJson);
  })
}

/**
 * Destroy the editor. Clean up DOM, event listeners, and web workers.
 */
previewmode.destroy = function () {
  if (this.frame && this.container && this.frame.parentNode == this.container) {
    this.container.removeChild(this.frame);
  }

  if (this.modeSwitcher) {
    this.modeSwitcher.destroy();
    this.modeSwitcher = null;
  }

  this._debouncedValidate = null;
};

/**
 * Compact the code in the text editor
 */
previewmode.compact = function () {
  var json = this.get();
  var text = JSON.stringify(json);
  this.setText(text);

  // we know that in this case the json is still the same
  this.json = json;
};

/**
 * Format the code in the text editor
 */
previewmode.format = function () {
  var json = this.get();
  var text = JSON.stringify(json, null, this.indentation);
  this.setText(text);

  // we know that in this case the json is still the same
  this.json = json;
};

/**
 * Repair the code in the text editor
 */
previewmode.repair = function () {
  var text = this.getText();
  var sanitizedText = util.sanitize(text);
  this.setText(sanitizedText);
};

/**
 * Set focus to the formatter
 */
previewmode.focus = function () {
  // TODO: implement method focus
};

/**
 * Set json data in the formatter
 * @param {*} json
 */
previewmode.set = function(json) {
  this.text = undefined;
  this.json = json;

  this.renderPreview();
};

/**
 * Update data. Same as calling `set` in text/code mode.
 * @param {*} json
 */
previewmode.update = function(json) {
  this.set(json);
};

/**
 * Get json data from the formatter
 * @return {*} json
 */
previewmode.get = function() {
  if (this.json === undefined) {
    var text = this.getText();

    try {
      console.time('parse') // TODO: cleanup
      this.json = util.parse(text); // this can throw an error
      console.timeEnd('parse') // TODO: cleanup
    }
    catch (err) {
      // try to sanitize json, replace JavaScript notation with JSON notation
      text = util.sanitize(text);

      // try to parse again
      this.json = util.parse(text); // this can throw an error
    }
  }

  return this.json;
};

/**
 * Get the text contents of the editor
 * @return {String} jsonText
 */
previewmode.getText = function() {
  if (this.text === undefined) {
    console.time('stringify') // TODO: cleanup
    this.text = JSON.stringify(this.json, null, this.indentation);
    console.timeEnd('stringify') // TODO: cleanup

    if (this.options.escapeUnicode === true) {
      console.time('escape') // TODO: cleanup
      this.text = util.escapeUnicodeChars(this.text);
      console.timeEnd('escape') // TODO: cleanup
    }
  }

  return this.text;
};

/**
 * Set the text contents of the editor
 * @param {String} jsonText
 */
previewmode.setText = function(jsonText) {
  if (this.options.escapeUnicode === true) {
    console.time('escape') // TODO: cleanup
    this.text = util.escapeUnicodeChars(jsonText);
    console.timeEnd('escape') // TODO: cleanup
  }
  else {
    this.text = jsonText;
  }
  this.json = undefined;

  this.renderPreview();

  // validate JSON schema
  this._debouncedValidate();
};

/**
 * Update the text contents
 * @param {string} jsonText
 */
previewmode.updateText = function(jsonText) {
  // don't update if there are no changes
  if (this.getText() === jsonText) {
    return;
  }

  this.onChangeDisabled = true; // don't fire an onChange event
  this.setText(jsonText);
  this.onChangeDisabled = false;
};

/**
 * Validate current JSON object against the configured JSON schema
 * Throws an exception when no JSON schema is configured
 */
previewmode.validate = function () {
  // FIXME: implement validate (also support custom validation)
};

// define modes
module.exports = [
  {
    mode: 'preview',
    mixin: previewmode,
    data: 'json'
  }
];
