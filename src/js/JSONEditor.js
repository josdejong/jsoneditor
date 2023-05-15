'use strict'

const ace = require('./ace') // may be undefined in case of minimalist bundle
const VanillaPicker = require('./vanilla-picker') // may be undefined in case of minimalist bundle
const { treeModeMixins } = require('./treemode')
const { textModeMixins } = require('./textmode')
const { previewModeMixins } = require('./previewmode')
const { clear, extend, getInnerText, getInternetExplorerVersion, parse } = require('./util')
const { tryRequireAjv } = require('./tryRequireAjv')
const { showTransformModal } = require('./showTransformModal')
const { showSortModal } = require('./showSortModal')

const Ajv = tryRequireAjv()

if (typeof Promise === 'undefined') {
  console.error('Promise undefined. Please load a Promise polyfill in the browser in order to use JSONEditor')
}

/**
 * @constructor JSONEditor
 * @param {Element} container    Container element
 * @param {Object}  [options]    Object with options. available options:
 *                               {String} mode        Editor mode. Available values:
 *                                                    'tree' (default), 'view',
 *                                                    'form', 'text', and 'code'.
 *                               {function} onChange  Callback method, triggered
 *                                                    on change of contents.
 *                                                    Does not pass the contents itself.
 *                                                    See also `onChangeJSON` and
 *                                                    `onChangeText`.
 *                               {function} onChangeJSON  Callback method, triggered
 *                                                        in modes on change of contents,
 *                                                        passing the changed contents
 *                                                        as JSON.
 *                                                        Only applicable for modes
 *                                                        'tree', 'view', and 'form'.
 *                               {function} onChangeText  Callback method, triggered
 *                                                        in modes on change of contents,
 *                                                        passing the changed contents
 *                                                        as stringified JSON.
 *                               {function} onError   Callback method, triggered
 *                                                    when an error occurs
 *                               {Boolean} search     Enable search box.
 *                                                    True by default
 *                                                    Only applicable for modes
 *                                                    'tree', 'view', and 'form'
 *                               {Boolean} history    Enable history (undo/redo).
 *                                                    True by default
 *                                                    Only applicable for modes
 *                                                    'tree', 'view', and 'form'
 *                               {String} name        Field name for the root node.
 *                                                    Only applicable for modes
 *                                                    'tree', 'view', and 'form'
 *                               {Number} indentation     Number of indentation
 *                                                        spaces. 4 by default.
 *                                                        Only applicable for
 *                                                        modes 'text' and 'code'
 *                               {boolean} escapeUnicode  If true, unicode
 *                                                        characters are escaped.
 *                                                        false by default.
 *                               {boolean} sortObjectKeys If true, object keys are
 *                                                        sorted before display.
 *                                                        false by default.
 *                               {function} onSelectionChange Callback method,
 *                                                            triggered on node selection change
 *                                                            Only applicable for modes
 *                                                            'tree', 'view', and 'form'
 *                               {function} onTextSelectionChange Callback method,
 *                                                                triggered on text selection change
 *                                                                Only applicable for modes
 *                               {HTMLElement} modalAnchor        The anchor element to apply an
 *                                                                overlay and display the modals in a
 *                                                                centered location.
 *                                                                Defaults to document.body
 *                                                                'text' and 'code'
 *                               {function} onEvent Callback method, triggered
 *                                                  when an event occurs in
 *                                                  a JSON field or value.
 *                                                  Only applicable for
 *                                                  modes 'form', 'tree' and
 *                                                  'view'
 *                               {function} onFocus  Callback method, triggered
 *                                                   when the editor comes into focus,
 *                                                   passing an object {type, target},
 *                                                   Applicable for all modes
 *                               {function} onBlur   Callback method, triggered
 *                                                   when the editor goes out of focus,
 *                                                   passing an object {type, target},
 *                                                   Applicable for all modes
 *                               {function} onClassName Callback method, triggered
 *                                                  when a Node DOM is rendered. Function returns
 *                                                  a css class name to be set on a node.
 *                                                  Only applicable for
 *                                                  modes 'form', 'tree' and
 *                                                  'view'
 *                               {Number} maxVisibleChilds Number of children allowed for a node
 *                                                         in 'tree', 'view', or 'form' mode before
 *                                                         the "show more/show all" buttons appear.
 *                                                         100 by default.
 *
 * @param {Object | undefined} json JSON object
 */
function JSONEditor (container, options, json) {
  if (!(this instanceof JSONEditor)) {
    throw new Error('JSONEditor constructor called without "new".')
  }

  // check for unsupported browser (IE8 and older)
  const ieVersion = getInternetExplorerVersion()
  if (ieVersion !== -1 && ieVersion < 9) {
    throw new Error('Unsupported browser, IE9 or newer required. ' +
        'Please install the newest version of your browser.')
  }

  if (options) {
    // check for deprecated options
    if (options.error) {
      console.warn('Option "error" has been renamed to "onError"')
      options.onError = options.error
      delete options.error
    }
    if (options.change) {
      console.warn('Option "change" has been renamed to "onChange"')
      options.onChange = options.change
      delete options.change
    }
    if (options.editable) {
      console.warn('Option "editable" has been renamed to "onEditable"')
      options.onEditable = options.editable
      delete options.editable
    }

    // warn if onChangeJSON is used when mode can be `text` or `code`
    if (options.onChangeJSON) {
      if (options.mode === 'text' || options.mode === 'code' ||
          (options.modes && (options.modes.indexOf('text') !== -1 || options.modes.indexOf('code') !== -1))) {
        console.warn('Option "onChangeJSON" is not applicable to modes "text" and "code". ' +
            'Use "onChangeText" or "onChange" instead.')
      }
    }

    // validate options
    if (options) {
      Object.keys(options).forEach(option => {
        if (JSONEditor.VALID_OPTIONS.indexOf(option) === -1) {
          console.warn('Unknown option "' + option + '". This option will be ignored')
        }
      })
    }
  }

  if (arguments.length) {
    this._create(container, options, json)
  }
}

/**
 * Configuration for all registered modes. Example:
 * {
 *     tree: {
 *         mixin: TreeEditor,
 *         data: 'json'
 *     },
 *     text: {
 *         mixin: TextEditor,
 *         data: 'text'
 *     }
 * }
 *
 * @type { Object.<String, {mixin: Object, data: String} > }
 */
JSONEditor.modes = {}

// debounce interval for JSON schema validation in milliseconds
JSONEditor.prototype.DEBOUNCE_INTERVAL = 150

JSONEditor.VALID_OPTIONS = [
  'ajv', 'schema', 'schemaRefs', 'templates',
  'ace', 'theme', 'autocomplete',
  'onChange', 'onChangeJSON', 'onChangeText', 'onExpand',
  'onEditable', 'onError', 'onEvent', 'onModeChange', 'onNodeName', 'onValidate', 'onCreateMenu',
  'onSelectionChange', 'onTextSelectionChange', 'onClassName',
  'onFocus', 'onBlur',
  'colorPicker', 'onColorPicker',
  'timestampTag', 'timestampFormat',
  'escapeUnicode', 'history', 'search', 'mode', 'modes', 'name', 'indentation',
  'sortObjectKeys', 'navigationBar', 'statusBar', 'mainMenuBar', 'languages', 'language', 'enableSort', 'enableTransform', 'limitDragging',
  'maxVisibleChilds', 'onValidationError',
  'modalAnchor', 'popupAnchor',
  'createQuery', 'executeQuery', 'queryDescription',
  'allowSchemaSuggestions', 'showErrorTable'
]

/**
 * Create the JSONEditor
 * @param {Element} container    Container element
 * @param {Object}  [options]    See description in constructor
 * @param {Object | undefined} json JSON object
 * @private
 */
JSONEditor.prototype._create = function (container, options, json) {
  this.container = container
  this.options = options || {}
  this.json = json || {}

  const mode = this.options.mode || (this.options.modes && this.options.modes[0]) || 'tree'
  this.setMode(mode)
}

/**
 * Destroy the editor. Clean up DOM, event listeners, and web workers.
 */
JSONEditor.prototype.destroy = () => {}

/**
 * Set JSON object in editor
 * @param {Object | undefined} json      JSON data
 */
JSONEditor.prototype.set = function (json) {
  this.json = json
}

/**
 * Get JSON from the editor
 * @returns {Object} json
 */
JSONEditor.prototype.get = function () {
  return this.json
}

/**
 * Set string containing JSON for the editor
 * @param {String | undefined} jsonText
 */
JSONEditor.prototype.setText = function (jsonText) {
  this.json = parse(jsonText)
}

/**
 * Get stringified JSON contents from the editor
 * @returns {String} jsonText
 */
JSONEditor.prototype.getText = function () {
  return JSON.stringify(this.json)
}

/**
 * Set a field name for the root node.
 * @param {String | undefined} name
 */
JSONEditor.prototype.setName = function (name) {
  if (!this.options) {
    this.options = {}
  }
  this.options.name = name
}

/**
 * Get the field name for the root node.
 * @return {String | undefined} name
 */
JSONEditor.prototype.getName = function () {
  return this.options && this.options.name
}

/**
 * Change the mode of the editor.
 * JSONEditor will be extended with all methods needed for the chosen mode.
 * @param {String} mode     Available modes: 'tree' (default), 'view', 'form',
 *                          'text', and 'code'.
 */
JSONEditor.prototype.setMode = function (mode) {
  // if the mode is the same as current mode (and it's not the first time), do nothing.
  if (mode === this.options.mode && this.create) {
    return
  }

  const container = this.container
  const options = extend({}, this.options)
  const oldMode = options.mode

  options.mode = mode
  const config = JSONEditor.modes[mode]
  if (!config) {
    throw new Error('Unknown mode "' + options.mode + '"')
  }

  const asText = (config.data === 'text')
  const name = this.getName()
  const data = this[asText ? 'getText' : 'get']() // get text or json

  this.destroy()
  clear(this)
  extend(this, config.mixin)
  this.create(container, options)

  this.setName(name)
  this[asText ? 'setText' : 'set'](data) // set text or json

  if (typeof config.load === 'function') {
    try {
      config.load.call(this)
    } catch (err) {
      console.error(err)
    }
  }

  if (typeof options.onModeChange === 'function' && mode !== oldMode) {
    try {
      options.onModeChange(mode, oldMode)
    } catch (err) {
      console.error(err)
    }
  }
}

/**
 * Get the current mode
 * @return {string}
 */
JSONEditor.prototype.getMode = function () {
  return this.options.mode
}

/**
 * Throw an error. If an error callback is configured in options.error, this
 * callback will be invoked. Else, a basic alert window with the error message
 * will be shown to the user.
 * @param {Error} err
 * @private
 */
JSONEditor.prototype._onError = function (err) {
  if (this.options && typeof this.options.onError === 'function') {
    this.options.onError(err)
  } else {
    window.alert(err.toString())
  }
}

/**
 * Set a JSON schema for validation of the JSON object.
 * To remove the schema, call JSONEditor.setSchema(null)
 * @param {Object | null} schema
 * @param {Object.<string, Object>=} schemaRefs Schemas that are referenced using the `$ref` property from the JSON schema that are set in the `schema` option,
 +  the object structure in the form of `{reference_key: schemaObject}`
 */
JSONEditor.prototype.setSchema = function (schema, schemaRefs) {
  // compile a JSON schema validator if a JSON schema is provided
  if (schema) {
    let ajv
    try {
      // grab ajv from options if provided, else create a new instance
      if (this.options.ajv) {
        ajv = this.options.ajv
      } else {
        ajv = Ajv({
          allErrors: true,
          verbose: true,
          schemaId: 'auto',
          $data: true
        })

        // support both draft-04 and draft-06 alongside the latest draft-07
        ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'))
        ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'))
      }
    } catch (err) {
      console.warn('Failed to create an instance of Ajv, JSON Schema validation is not available. Please use a JSONEditor bundle including Ajv, or pass an instance of Ajv as via the configuration option `ajv`.')
    }

    if (ajv) {
      if (schemaRefs) {
        for (const ref in schemaRefs) {
          ajv.removeSchema(ref) // When updating a schema - old refs has to be removed first
          if (schemaRefs[ref]) {
            ajv.addSchema(schemaRefs[ref], ref)
          }
        }
        this.options.schemaRefs = schemaRefs
      }
      this.validateSchema = ajv.compile(schema)

      // add schema to the options, so that when switching to an other mode,
      // the set schema is not lost
      this.options.schema = schema
      this.options.schemaRefs = schemaRefs

      // validate now
      this.validate()
    }

    this.refresh() // update DOM
  } else {
    // remove current schema
    this.validateSchema = null
    this.options.schema = null
    this.options.schemaRefs = null
    this.validate() // to clear current error messages
    this.refresh() // update DOM
  }

  if (typeof this._onSchemaChange === 'function') {
    this._onSchemaChange(schema, schemaRefs)
  }
}

/**
 * Validate current JSON object against the configured JSON schema
 * Throws an exception when no JSON schema is configured
 */
JSONEditor.prototype.validate = () => {
  // must be implemented by treemode and textmode
}

/**
 * Refresh the rendered contents
 */
JSONEditor.prototype.refresh = () => {
  // can be implemented by treemode and textmode
}

/**
 * Register a plugin with one ore multiple modes for the JSON Editor.
 *
 * A mode is described as an object with properties:
 *
 * - `mode: String`           The name of the mode.
 * - `mixin: Object`          An object containing the mixin functions which
 *                            will be added to the JSONEditor. Must contain functions
 *                            create, get, getText, set, and setText. May have
 *                            additional functions.
 *                            When the JSONEditor switches to a mixin, all mixin
 *                            functions are added to the JSONEditor, and then
 *                            the function `create(container, options)` is executed.
 * - `data: 'text' | 'json'`  The type of data that will be used to load the mixin.
 * - `[load: function]`       An optional function called after the mixin
 *                            has been loaded.
 *
 * @param {Object | Array} mode  A mode object or an array with multiple mode objects.
 */
JSONEditor.registerMode = mode => {
  let i, prop

  if (Array.isArray(mode)) {
    // multiple modes
    for (i = 0; i < mode.length; i++) {
      JSONEditor.registerMode(mode[i])
    }
  } else {
    // validate the new mode
    if (!('mode' in mode)) throw new Error('Property "mode" missing')
    if (!('mixin' in mode)) throw new Error('Property "mixin" missing')
    if (!('data' in mode)) throw new Error('Property "data" missing')
    const name = mode.mode
    if (name in JSONEditor.modes) {
      throw new Error('Mode "' + name + '" already registered')
    }

    // validate the mixin
    if (typeof mode.mixin.create !== 'function') {
      throw new Error('Required function "create" missing on mixin')
    }
    const reserved = ['setMode', 'registerMode', 'modes']
    for (i = 0; i < reserved.length; i++) {
      prop = reserved[i]
      if (prop in mode.mixin) {
        throw new Error('Reserved property "' + prop + '" not allowed in mixin')
      }
    }

    JSONEditor.modes[name] = mode
  }
}

// register tree, text, and preview modes
JSONEditor.registerMode(treeModeMixins)
JSONEditor.registerMode(textModeMixins)
JSONEditor.registerMode(previewModeMixins)

// expose some of the libraries that can be used customized
JSONEditor.ace = ace
JSONEditor.Ajv = Ajv
JSONEditor.VanillaPicker = VanillaPicker

// expose some utils (this is undocumented, unofficial)
JSONEditor.showTransformModal = showTransformModal
JSONEditor.showSortModal = showSortModal
JSONEditor.getInnerText = getInnerText

// default export for TypeScript ES6 projects
JSONEditor.default = JSONEditor

module.exports = JSONEditor
