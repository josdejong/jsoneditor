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
  // read options
  options = options || {};
  this.options = options;
  if (options.indentation) {
    this.indentation = Number(options.indentation);
  }
  else {
    this.indentation = 2;       // number of spaces
  }
  this.mode = (options.mode == 'code') ? 'code' : 'text';
  if (this.mode == 'code') {
    // verify whether Ace editor is available and supported
    if (typeof ace === 'undefined') {
      this.mode = 'text';
      util.log('WARNING: Cannot load code editor, Ace library not loaded. ' +
          'Falling back to plain text editor');
    }
  }

  var me = this;
  this.container = container;
  this.dom = {};
  this.editor = undefined;    // ace code editor
  this.textarea = undefined;  // plain text editor (fallback when Ace is not available)

  this.width = container.clientWidth;
  this.height = container.clientHeight;

  this.frame = document.createElement('div');
  this.frame.className = 'jsoneditor';
  this.frame.onclick = function (event) {
    // prevent default submit action when TextEditor is located inside a form
    event.preventDefault();
  };

  // create menu
  this.menu = document.createElement('div');
  this.menu.className = 'menu';
  this.frame.appendChild(this.menu);

  // create format button
  var buttonFormat = document.createElement('button');
  buttonFormat.className = 'format';
  buttonFormat.title = 'Format JSON data, with proper indentation and line feeds';
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
  buttonCompact.className = 'compact';
  buttonCompact.title = 'Compact JSON data, remove all whitespaces';
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
    var modeBox = createModeBox(this, this.options.modes, this.options.mode);
    this.menu.appendChild(modeBox);
    this.dom.modeBox = modeBox;
  }

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
    textarea.className = 'text';
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
