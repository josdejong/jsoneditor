var ace;
try {
  ace = require('./ace');
}
catch (err) {
  // failed to load ace, no problem, we will fall back to plain text
}

var modeswitcher = require('./modeswitcher');
var util = require('./util');

// create a mixin with the functions for text mode
var textmode = {};

/**
 * Create a text editor
 * @param {Element} container
 * @param {Object} [options]   Object with options. available options:
 *                             {String} mode             Available values:
 *                                                       "text" (default)
 *                                                       or "code".
 *                             {Number} indentation      Number of indentation
 *                                                       spaces. 2 by default.
 *                             {function} onChange       Callback method
 *                                                       triggered on change
 *                             {function} onModeChange   Callback method
 *                                                       triggered after setMode
 *                             {Object} ace              A custom instance of
 *                                                       Ace editor.
 *                             {boolean} escapeUnicode   If true, unicode
 *                                                       characters are escaped.
 *                                                       false by default.
 * @private
 */
textmode.create = function (container, options) {
  // read options
  options = options || {};
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

  // determine mode
  this.mode = (options.mode == 'code') ? 'code' : 'text';
  if (this.mode == 'code') {
    // verify whether Ace editor is available and supported
    if (typeof _ace === 'undefined') {
      this.mode = 'text';
      util.log('WARNING: Cannot load code editor, Ace library not loaded. ' +
          'Falling back to plain text editor');
    }
  }

  // determine theme
  this.theme = options.theme || 'ace/theme/jsoneditor';

  var me = this;
  this.container = container;
  this.dom = {};
  this.aceEditor = undefined;  // ace code editor
  this.textarea = undefined;  // plain text editor (fallback when Ace is not available)

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

  // create menu
  this.menu = document.createElement('div');
  this.menu.className = 'jsoneditor-menu';
  this.frame.appendChild(this.menu);

  // create format button
  var buttonFormat = document.createElement('button');
  buttonFormat.className = 'jsoneditor-format';
  buttonFormat.title = 'Format JSON data, with proper indentation and line feeds (Ctrl+\\)';
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
  buttonCompact.className = 'jsoneditor-compact';
  buttonCompact.title = 'Compact JSON data, remove all whitespaces (Ctrl+Shift+\\)';
  this.menu.appendChild(buttonCompact);
  buttonCompact.onclick = function () {
    try {
      me.compact();
    }
    catch (err) {
      me._onError(err);
    }
  };

  // create mode box
  if (this.options && this.options.modes && this.options.modes.length) {
    var modeBox = modeswitcher.create(this, this.options.modes, this.options.mode);
    this.menu.appendChild(modeBox);
    this.dom.modeBox = modeBox;
  }

  this.content = document.createElement('div');
  this.content.className = 'jsoneditor-outer';
  this.frame.appendChild(this.content);

  this.container.appendChild(this.frame);

  if (this.mode == 'code') {
    this.editorDom = document.createElement('div');
    this.editorDom.style.height = '100%'; // TODO: move to css
    this.editorDom.style.width = '100%'; // TODO: move to css
    this.content.appendChild(this.editorDom);

    var aceEditor = _ace.edit(this.editorDom);
    aceEditor.$blockScrolling = Infinity;
    aceEditor.setTheme(this.theme);
    aceEditor.setShowPrintMargin(false);
    aceEditor.setFontSize(13);
    aceEditor.getSession().setMode('ace/mode/json');
    aceEditor.getSession().setTabSize(this.indentation);
    aceEditor.getSession().setUseSoftTabs(true);
    aceEditor.getSession().setUseWrapMode(true);
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

    if (options.onChange) {
      // register onchange event
      aceEditor.on('change', options.onChange);
    }
  }
  else {
    // load a plain text textarea
    var textarea = document.createElement('textarea');
    textarea.className = 'jsoneditor-text';
    textarea.spellcheck = false;
    this.content.appendChild(textarea);
    this.textarea = textarea;

    if (options.onChange) {
      // register onchange event
      if (this.textarea.oninput === null) {
        this.textarea.oninput = options.onChange();
      }
      else {
        // oninput is undefined. For IE8-
        this.textarea.onchange = options.onChange();
      }
    }
  }
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
    }
    else { // Ctrl+\
      this.format();
    }
    handled = true;
  }

  if (handled) {
    event.preventDefault();
    event.stopPropagation();
  }
};

/**
 * Detach the editor from the DOM
 * @private
 */
textmode._delete = function () {
  // remove old ace editor
  if (this.aceEditor) {
    this.aceEditor.destroy();
  }

  if (this.frame && this.container && this.frame.parentNode == this.container) {
    this.container.removeChild(this.frame);
  }
};

/**
 * Compact the code in the formatter
 */
textmode.compact = function () {
  var json = this.get();
  var text = JSON.stringify(json);
  this.setText(text);
};

/**
 * Format the code in the formatter
 */
textmode.format = function () {
  var json = this.get();
  var text = JSON.stringify(json, null, this.indentation);
  this.setText(text);
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
 * @param {Object} json
 */
textmode.set = function(json) {
  this.setText(JSON.stringify(json, null, this.indentation));
};

/**
 * Get json data from the formatter
 * @return {Object} json
 */
textmode.get = function() {
  var text = this.getText();
  var json;

  try {
    json = util.parse(text); // this can throw an error
  }
  catch (err) {
    // try to sanitize json, replace JavaScript notation with JSON notation
    text = util.sanitize(text);

    // try to parse again
    json = util.parse(text); // this can throw an error
  }

  return json;
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
 * Set the text contents of the editor
 * @param {String} jsonText
 */
textmode.setText = function(jsonText) {
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
    this.aceEditor.setValue(text, -1);
  }
};

// define modes
module.exports = [
  {
    mode: 'text',
    mixin: textmode,
    data: 'text',
    load: textmode.format
  },
  {
    mode: 'code',
    mixin: textmode,
    data: 'text',
    load: textmode.format
  }
];
