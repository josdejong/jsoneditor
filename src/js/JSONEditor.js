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

  // check for unsupported browser (IE8 and older)
  var ieVersion = util.getInternetExplorerVersion();
  if (ieVersion != -1 && ieVersion < 9) {
    throw new Error('Unsupported browser, IE9 or newer required. ' +
        'Please install the newest version of your browser.');
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
