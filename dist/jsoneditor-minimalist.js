/*!
 * jsoneditor.js
 *
 * @brief
 * JSONEditor is a web-based tool to view, edit, format, and validate JSON.
 * It has various modes such as a tree editor, a code editor, and a plain text
 * editor.
 *
 * Supported browsers: Chrome, Firefox, Safari, Opera, Internet Explorer 8+
 *
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
 * Copyright (c) 2011-2019 Jos de Jong, http://jsoneditoronline.org
 *
 * @author  Jos de Jong, <wjosdejong@gmail.com>
 * @version 5.28.2
 * @date    2019-01-23
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["JSONEditor"] = factory();
	else
		root["JSONEditor"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Ajv;
	try {
	  Ajv = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"ajv\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
	}
	catch (err) {
	  // no problem... when we need Ajv we will throw a neat exception
	}

	var ace = __webpack_require__(1); // may be undefined in case of minimalist bundle
	var VanillaPicker = __webpack_require__(5); // may be undefined in case of minimalist bundle

	var treemode = __webpack_require__(6);
	var textmode = __webpack_require__(28);
	var util = __webpack_require__(12);

	if (typeof Promise === 'undefined') {
	  console.error('Promise undefined. Please load a Promise polyfill in the browser in order to use JSONEditor');
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
	    throw new Error('JSONEditor constructor called without "new".');
	  }

	  // check for unsupported browser (IE8 and older)
	  var ieVersion = util.getInternetExplorerVersion();
	  if (ieVersion != -1 && ieVersion < 9) {
	    throw new Error('Unsupported browser, IE9 or newer required. ' +
	        'Please install the newest version of your browser.');
	  }

	  if (options) {
	    // check for deprecated options
	    if (options.error) {
	      console.warn('Option "error" has been renamed to "onError"');
	      options.onError = options.error;
	      delete options.error;
	    }
	    if (options.change) {
	      console.warn('Option "change" has been renamed to "onChange"');
	      options.onChange = options.change;
	      delete options.change;
	    }
	    if (options.editable) {
	      console.warn('Option "editable" has been renamed to "onEditable"');
	      options.onEditable = options.editable;
	      delete options.editable;
	    }

	    // warn if onChangeJSON is used when mode can be `text` or `code`
	    if (options.onChangeJSON) {
	      if (options.mode === 'text' || options.mode === 'code' ||
	          (options.modes && (options.modes.indexOf('text') !== -1 || options.modes.indexOf('code') !== -1))) {
	        console.warn('Option "onChangeJSON" is not applicable to modes "text" and "code". ' +
	            'Use "onChangeText" or "onChange" instead.');
	      }
	    }

	    // validate options
	    if (options) {
	      Object.keys(options).forEach(function (option) {
	        if (JSONEditor.VALID_OPTIONS.indexOf(option) === -1) {
	          console.warn('Unknown option "' + option + '". This option will be ignored');
	        }
	      });
	    }
	  }

	  if (arguments.length) {
	    this._create(container, options, json);
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
	JSONEditor.modes = {};

	// debounce interval for JSON schema vaidation in milliseconds
	JSONEditor.prototype.DEBOUNCE_INTERVAL = 150;

	JSONEditor.VALID_OPTIONS = [
	  'ajv', 'schema', 'schemaRefs','templates',
	  'ace', 'theme', 'autocomplete',
	  'onChange', 'onChangeJSON', 'onChangeText',
	  'onEditable', 'onError', 'onEvent', 'onModeChange', 'onNodeName', 'onValidate',
	  'onSelectionChange', 'onTextSelectionChange', 'onClassName',
	  'colorPicker', 'onColorPicker',
	  'timestampTag',
	  'escapeUnicode', 'history', 'search', 'mode', 'modes', 'name', 'indentation',
	  'sortObjectKeys', 'navigationBar', 'statusBar', 'mainMenuBar', 'languages', 'language', 'enableSort', 'enableTransform',
	  'maxVisibleChilds'
	];

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

	  var mode = this.options.mode || (this.options.modes && this.options.modes[0]) || 'tree';
	  this.setMode(mode);
	};

	/**
	 * Destroy the editor. Clean up DOM, event listeners, and web workers.
	 */
	JSONEditor.prototype.destroy = function () {};

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
	  // if the mode is the same as current mode (and it's not the first time), do nothing.
	  if (mode === this.options.mode && this.create) {
	    return;
	  }

	  var container = this.container;
	  var options = util.extend({}, this.options);
	  var oldMode = options.mode;
	  var data;
	  var name;

	  options.mode = mode;
	  var config = JSONEditor.modes[mode];
	  if (config) {
	    try {
	      var asText = (config.data == 'text');
	      name = this.getName();
	      data = this[asText ? 'getText' : 'get'](); // get text or json

	      this.destroy();
	      util.clear(this);
	      util.extend(this, config.mixin);
	      this.create(container, options);

	      this.setName(name);
	      this[asText ? 'setText' : 'set'](data); // set text or json

	      if (typeof config.load === 'function') {
	        try {
	          config.load.call(this);
	        }
	        catch (err) {
	          console.error(err);
	        }
	      }

	      if (typeof options.onModeChange === 'function' && mode !== oldMode) {
	        try {
	          options.onModeChange(mode, oldMode);
	        }
	        catch (err) {
	          console.error(err);
	        }
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
	 * Get the current mode
	 * @return {string}
	 */
	JSONEditor.prototype.getMode = function () {
	  return this.options.mode;
	};

	/**
	 * Throw an error. If an error callback is configured in options.error, this
	 * callback will be invoked. Else, a regular error is thrown.
	 * @param {Error} err
	 * @private
	 */
	JSONEditor.prototype._onError = function(err) {
	  if (this.options && typeof this.options.onError === 'function') {
	    this.options.onError(err);
	  }
	  else {
	    throw err;
	  }
	};

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
	    var ajv;
	    try {
	      // grab ajv from options if provided, else create a new instance
	      ajv = this.options.ajv || Ajv({ allErrors: true, verbose: true });

	    }
	    catch (err) {
	      console.warn('Failed to create an instance of Ajv, JSON Schema validation is not available. Please use a JSONEditor bundle including Ajv, or pass an instance of Ajv as via the configuration option `ajv`.');
	    }

	    if (ajv) {
	      if(schemaRefs) {
	        for (var ref in schemaRefs) {
	          ajv.removeSchema(ref);  // When updating a schema - old refs has to be removed first
	          if(schemaRefs[ref]) {
	            ajv.addSchema(schemaRefs[ref], ref);
	          }
	        }
	        this.options.schemaRefs = schemaRefs;
	      }
	      this.validateSchema = ajv.compile(schema);

	      // add schema to the options, so that when switching to an other mode,
	      // the set schema is not lost
	      this.options.schema = schema;

	      // validate now
	      this.validate();
	    }

	    this.refresh(); // update DOM
	  }
	  else {
	    // remove current schema
	    this.validateSchema = null;
	    this.options.schema = null;
	    this.options.schemaRefs = null;
	    this.validate(); // to clear current error messages
	    this.refresh();  // update DOM
	  }
	};

	/**
	 * Validate current JSON object against the configured JSON schema
	 * Throws an exception when no JSON schema is configured
	 */
	JSONEditor.prototype.validate = function () {
	  // must be implemented by treemode and textmode
	};

	/**
	 * Refresh the rendered contents
	 */
	JSONEditor.prototype.refresh = function () {
	  // can be implemented by treemode and textmode
	};

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
	JSONEditor.registerMode = function (mode) {
	  var i, prop;

	  if (util.isArray(mode)) {
	    // multiple modes
	    for (i = 0; i < mode.length; i++) {
	      JSONEditor.registerMode(mode[i]);
	    }
	  }
	  else {
	    // validate the new mode
	    if (!('mode' in mode)) throw new Error('Property "mode" missing');
	    if (!('mixin' in mode)) throw new Error('Property "mixin" missing');
	    if (!('data' in mode)) throw new Error('Property "data" missing');
	    var name = mode.mode;
	    if (name in JSONEditor.modes) {
	      throw new Error('Mode "' + name + '" already registered');
	    }

	    // validate the mixin
	    if (typeof mode.mixin.create !== 'function') {
	      throw new Error('Required function "create" missing on mixin');
	    }
	    var reserved = ['setMode', 'registerMode', 'modes'];
	    for (i = 0; i < reserved.length; i++) {
	      prop = reserved[i];
	      if (prop in mode.mixin) {
	        throw new Error('Reserved property "' + prop + '" not allowed in mixin');
	      }
	    }

	    JSONEditor.modes[name] = mode;
	  }
	};

	// register tree and text modes
	JSONEditor.registerMode(treemode);
	JSONEditor.registerMode(textmode);

	// expose some of the libraries that can be used customized
	JSONEditor.ace = ace;
	JSONEditor.Ajv = Ajv;
	JSONEditor.VanillaPicker = VanillaPicker;

	// default export for TypeScript ES6 projects
	JSONEditor.default = JSONEditor;

	module.exports = JSONEditor;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var ace
	if (window.ace) {
	  // use the already loaded instance of Ace
	  ace = window.ace
	}
	else {
	  try {
	    // load brace
	    ace = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"brace\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

	    // load required Ace plugins
	    __webpack_require__(2);
	    __webpack_require__(4);
	  }
	  catch (err) {
	    // failed to load brace (can be minimalist bundle).
	    // No worries, the editor will fall back to plain text if needed.
	  }
	}

	module.exports = ace;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	ace.define("ace/mode/json_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(acequire, exports, module) {
	"use strict";

	var oop = acequire("../lib/oop");
	var TextHighlightRules = acequire("./text_highlight_rules").TextHighlightRules;

	var JsonHighlightRules = function() {
	    this.$rules = {
	        "start" : [
	            {
	                token : "variable", // single line
	                regex : '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]\\s*(?=:)'
	            }, {
	                token : "string", // single line
	                regex : '"',
	                next  : "string"
	            }, {
	                token : "constant.numeric", // hex
	                regex : "0[xX][0-9a-fA-F]+\\b"
	            }, {
	                token : "constant.numeric", // float
	                regex : "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
	            }, {
	                token : "constant.language.boolean",
	                regex : "(?:true|false)\\b"
	            }, {
	                token : "text", // single quoted strings are not allowed
	                regex : "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
	            }, {
	                token : "comment", // comments are not allowed, but who cares?
	                regex : "\\/\\/.*$"
	            }, {
	                token : "comment.start", // comments are not allowed, but who cares?
	                regex : "\\/\\*",
	                next  : "comment"
	            }, {
	                token : "paren.lparen",
	                regex : "[[({]"
	            }, {
	                token : "paren.rparen",
	                regex : "[\\])}]"
	            }, {
	                token : "text",
	                regex : "\\s+"
	            }
	        ],
	        "string" : [
	            {
	                token : "constant.language.escape",
	                regex : /\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|["\\\/bfnrt])/
	            }, {
	                token : "string",
	                regex : '"|$',
	                next  : "start"
	            }, {
	                defaultToken : "string"
	            }
	        ],
	        "comment" : [
	            {
	                token : "comment.end", // comments are not allowed, but who cares?
	                regex : "\\*\\/",
	                next  : "start"
	            }, {
	                defaultToken: "comment"
	            }
	        ]
	    };
	    
	};

	oop.inherits(JsonHighlightRules, TextHighlightRules);

	exports.JsonHighlightRules = JsonHighlightRules;
	});

	ace.define("ace/mode/matching_brace_outdent",["require","exports","module","ace/range"], function(acequire, exports, module) {
	"use strict";

	var Range = acequire("../range").Range;

	var MatchingBraceOutdent = function() {};

	(function() {

	    this.checkOutdent = function(line, input) {
	        if (! /^\s+$/.test(line))
	            return false;

	        return /^\s*\}/.test(input);
	    };

	    this.autoOutdent = function(doc, row) {
	        var line = doc.getLine(row);
	        var match = line.match(/^(\s*\})/);

	        if (!match) return 0;

	        var column = match[1].length;
	        var openBracePos = doc.findMatchingBracket({row: row, column: column});

	        if (!openBracePos || openBracePos.row == row) return 0;

	        var indent = this.$getIndent(doc.getLine(openBracePos.row));
	        doc.replace(new Range(row, 0, row, column-1), indent);
	    };

	    this.$getIndent = function(line) {
	        return line.match(/^\s*/)[0];
	    };

	}).call(MatchingBraceOutdent.prototype);

	exports.MatchingBraceOutdent = MatchingBraceOutdent;
	});

	ace.define("ace/mode/folding/cstyle",["require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"], function(acequire, exports, module) {
	"use strict";

	var oop = acequire("../../lib/oop");
	var Range = acequire("../../range").Range;
	var BaseFoldMode = acequire("./fold_mode").FoldMode;

	var FoldMode = exports.FoldMode = function(commentRegex) {
	    if (commentRegex) {
	        this.foldingStartMarker = new RegExp(
	            this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.start)
	        );
	        this.foldingStopMarker = new RegExp(
	            this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.end)
	        );
	    }
	};
	oop.inherits(FoldMode, BaseFoldMode);

	(function() {
	    
	    this.foldingStartMarker = /([\{\[\(])[^\}\]\)]*$|^\s*(\/\*)/;
	    this.foldingStopMarker = /^[^\[\{\(]*([\}\]\)])|^[\s\*]*(\*\/)/;
	    this.singleLineBlockCommentRe= /^\s*(\/\*).*\*\/\s*$/;
	    this.tripleStarBlockCommentRe = /^\s*(\/\*\*\*).*\*\/\s*$/;
	    this.startRegionRe = /^\s*(\/\*|\/\/)#?region\b/;
	    this._getFoldWidgetBase = this.getFoldWidget;
	    this.getFoldWidget = function(session, foldStyle, row) {
	        var line = session.getLine(row);
	    
	        if (this.singleLineBlockCommentRe.test(line)) {
	            if (!this.startRegionRe.test(line) && !this.tripleStarBlockCommentRe.test(line))
	                return "";
	        }
	    
	        var fw = this._getFoldWidgetBase(session, foldStyle, row);
	    
	        if (!fw && this.startRegionRe.test(line))
	            return "start"; // lineCommentRegionStart
	    
	        return fw;
	    };

	    this.getFoldWidgetRange = function(session, foldStyle, row, forceMultiline) {
	        var line = session.getLine(row);
	        
	        if (this.startRegionRe.test(line))
	            return this.getCommentRegionBlock(session, line, row);
	        
	        var match = line.match(this.foldingStartMarker);
	        if (match) {
	            var i = match.index;

	            if (match[1])
	                return this.openingBracketBlock(session, match[1], row, i);
	                
	            var range = session.getCommentFoldRange(row, i + match[0].length, 1);
	            
	            if (range && !range.isMultiLine()) {
	                if (forceMultiline) {
	                    range = this.getSectionRange(session, row);
	                } else if (foldStyle != "all")
	                    range = null;
	            }
	            
	            return range;
	        }

	        if (foldStyle === "markbegin")
	            return;

	        var match = line.match(this.foldingStopMarker);
	        if (match) {
	            var i = match.index + match[0].length;

	            if (match[1])
	                return this.closingBracketBlock(session, match[1], row, i);

	            return session.getCommentFoldRange(row, i, -1);
	        }
	    };
	    
	    this.getSectionRange = function(session, row) {
	        var line = session.getLine(row);
	        var startIndent = line.search(/\S/);
	        var startRow = row;
	        var startColumn = line.length;
	        row = row + 1;
	        var endRow = row;
	        var maxRow = session.getLength();
	        while (++row < maxRow) {
	            line = session.getLine(row);
	            var indent = line.search(/\S/);
	            if (indent === -1)
	                continue;
	            if  (startIndent > indent)
	                break;
	            var subRange = this.getFoldWidgetRange(session, "all", row);
	            
	            if (subRange) {
	                if (subRange.start.row <= startRow) {
	                    break;
	                } else if (subRange.isMultiLine()) {
	                    row = subRange.end.row;
	                } else if (startIndent == indent) {
	                    break;
	                }
	            }
	            endRow = row;
	        }
	        
	        return new Range(startRow, startColumn, endRow, session.getLine(endRow).length);
	    };
	    this.getCommentRegionBlock = function(session, line, row) {
	        var startColumn = line.search(/\s*$/);
	        var maxRow = session.getLength();
	        var startRow = row;
	        
	        var re = /^\s*(?:\/\*|\/\/|--)#?(end)?region\b/;
	        var depth = 1;
	        while (++row < maxRow) {
	            line = session.getLine(row);
	            var m = re.exec(line);
	            if (!m) continue;
	            if (m[1]) depth--;
	            else depth++;

	            if (!depth) break;
	        }

	        var endRow = row;
	        if (endRow > startRow) {
	            return new Range(startRow, startColumn, endRow, line.length);
	        }
	    };

	}).call(FoldMode.prototype);

	});

	ace.define("ace/mode/json",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/json_highlight_rules","ace/mode/matching_brace_outdent","ace/mode/behaviour/cstyle","ace/mode/folding/cstyle","ace/worker/worker_client"], function(acequire, exports, module) {
	"use strict";

	var oop = acequire("../lib/oop");
	var TextMode = acequire("./text").Mode;
	var HighlightRules = acequire("./json_highlight_rules").JsonHighlightRules;
	var MatchingBraceOutdent = acequire("./matching_brace_outdent").MatchingBraceOutdent;
	var CstyleBehaviour = acequire("./behaviour/cstyle").CstyleBehaviour;
	var CStyleFoldMode = acequire("./folding/cstyle").FoldMode;
	var WorkerClient = acequire("../worker/worker_client").WorkerClient;

	var Mode = function() {
	    this.HighlightRules = HighlightRules;
	    this.$outdent = new MatchingBraceOutdent();
	    this.$behaviour = new CstyleBehaviour();
	    this.foldingRules = new CStyleFoldMode();
	};
	oop.inherits(Mode, TextMode);

	(function() {

	    this.getNextLineIndent = function(state, line, tab) {
	        var indent = this.$getIndent(line);

	        if (state == "start") {
	            var match = line.match(/^.*[\{\(\[]\s*$/);
	            if (match) {
	                indent += tab;
	            }
	        }

	        return indent;
	    };

	    this.checkOutdent = function(state, line, input) {
	        return this.$outdent.checkOutdent(line, input);
	    };

	    this.autoOutdent = function(state, doc, row) {
	        this.$outdent.autoOutdent(doc, row);
	    };

	    this.createWorker = function(session) {
	        var worker = new WorkerClient(["ace"], __webpack_require__(3), "JsonWorker");
	        worker.attachToDocument(session.getDocument());

	        worker.on("annotate", function(e) {
	            session.setAnnotations(e.data);
	        });

	        worker.on("terminate", function() {
	            session.clearAnnotations();
	        });

	        return worker;
	    };


	    this.$id = "ace/mode/json";
	}).call(Mode.prototype);

	exports.Mode = Mode;
	});


/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports.id = 'ace/mode/json_worker';
	module.exports.src = "\"no use strict\";!function(window){function resolveModuleId(id,paths){for(var testPath=id,tail=\"\";testPath;){var alias=paths[testPath];if(\"string\"==typeof alias)return alias+tail;if(alias)return alias.location.replace(/\\/*$/,\"/\")+(tail||alias.main||alias.name);if(alias===!1)return\"\";var i=testPath.lastIndexOf(\"/\");if(-1===i)break;tail=testPath.substr(i)+tail,testPath=testPath.slice(0,i)}return id}if(!(void 0!==window.window&&window.document||window.acequire&&window.define)){window.console||(window.console=function(){var msgs=Array.prototype.slice.call(arguments,0);postMessage({type:\"log\",data:msgs})},window.console.error=window.console.warn=window.console.log=window.console.trace=window.console),window.window=window,window.ace=window,window.onerror=function(message,file,line,col,err){postMessage({type:\"error\",data:{message:message,data:err.data,file:file,line:line,col:col,stack:err.stack}})},window.normalizeModule=function(parentId,moduleName){if(-1!==moduleName.indexOf(\"!\")){var chunks=moduleName.split(\"!\");return window.normalizeModule(parentId,chunks[0])+\"!\"+window.normalizeModule(parentId,chunks[1])}if(\".\"==moduleName.charAt(0)){var base=parentId.split(\"/\").slice(0,-1).join(\"/\");for(moduleName=(base?base+\"/\":\"\")+moduleName;-1!==moduleName.indexOf(\".\")&&previous!=moduleName;){var previous=moduleName;moduleName=moduleName.replace(/^\\.\\//,\"\").replace(/\\/\\.\\//,\"/\").replace(/[^\\/]+\\/\\.\\.\\//,\"\")}}return moduleName},window.acequire=function acequire(parentId,id){if(id||(id=parentId,parentId=null),!id.charAt)throw Error(\"worker.js acequire() accepts only (parentId, id) as arguments\");id=window.normalizeModule(parentId,id);var module=window.acequire.modules[id];if(module)return module.initialized||(module.initialized=!0,module.exports=module.factory().exports),module.exports;if(!window.acequire.tlns)return console.log(\"unable to load \"+id);var path=resolveModuleId(id,window.acequire.tlns);return\".js\"!=path.slice(-3)&&(path+=\".js\"),window.acequire.id=id,window.acequire.modules[id]={},importScripts(path),window.acequire(parentId,id)},window.acequire.modules={},window.acequire.tlns={},window.define=function(id,deps,factory){if(2==arguments.length?(factory=deps,\"string\"!=typeof id&&(deps=id,id=window.acequire.id)):1==arguments.length&&(factory=id,deps=[],id=window.acequire.id),\"function\"!=typeof factory)return window.acequire.modules[id]={exports:factory,initialized:!0},void 0;deps.length||(deps=[\"require\",\"exports\",\"module\"]);var req=function(childId){return window.acequire(id,childId)};window.acequire.modules[id]={exports:{},factory:function(){var module=this,returnExports=factory.apply(this,deps.map(function(dep){switch(dep){case\"require\":return req;case\"exports\":return module.exports;case\"module\":return module;default:return req(dep)}}));return returnExports&&(module.exports=returnExports),module}}},window.define.amd={},acequire.tlns={},window.initBaseUrls=function(topLevelNamespaces){for(var i in topLevelNamespaces)acequire.tlns[i]=topLevelNamespaces[i]},window.initSender=function(){var EventEmitter=window.acequire(\"ace/lib/event_emitter\").EventEmitter,oop=window.acequire(\"ace/lib/oop\"),Sender=function(){};return function(){oop.implement(this,EventEmitter),this.callback=function(data,callbackId){postMessage({type:\"call\",id:callbackId,data:data})},this.emit=function(name,data){postMessage({type:\"event\",name:name,data:data})}}.call(Sender.prototype),new Sender};var main=window.main=null,sender=window.sender=null;window.onmessage=function(e){var msg=e.data;if(msg.event&&sender)sender._signal(msg.event,msg.data);else if(msg.command)if(main[msg.command])main[msg.command].apply(main,msg.args);else{if(!window[msg.command])throw Error(\"Unknown command:\"+msg.command);window[msg.command].apply(window,msg.args)}else if(msg.init){window.initBaseUrls(msg.tlns),acequire(\"ace/lib/es5-shim\"),sender=window.sender=window.initSender();var clazz=acequire(msg.module)[msg.classname];main=window.main=new clazz(sender)}}}}(this),ace.define(\"ace/lib/oop\",[\"require\",\"exports\",\"module\"],function(acequire,exports){\"use strict\";exports.inherits=function(ctor,superCtor){ctor.super_=superCtor,ctor.prototype=Object.create(superCtor.prototype,{constructor:{value:ctor,enumerable:!1,writable:!0,configurable:!0}})},exports.mixin=function(obj,mixin){for(var key in mixin)obj[key]=mixin[key];return obj},exports.implement=function(proto,mixin){exports.mixin(proto,mixin)}}),ace.define(\"ace/range\",[\"require\",\"exports\",\"module\"],function(acequire,exports){\"use strict\";var comparePoints=function(p1,p2){return p1.row-p2.row||p1.column-p2.column},Range=function(startRow,startColumn,endRow,endColumn){this.start={row:startRow,column:startColumn},this.end={row:endRow,column:endColumn}};(function(){this.isEqual=function(range){return this.start.row===range.start.row&&this.end.row===range.end.row&&this.start.column===range.start.column&&this.end.column===range.end.column},this.toString=function(){return\"Range: [\"+this.start.row+\"/\"+this.start.column+\"] -> [\"+this.end.row+\"/\"+this.end.column+\"]\"},this.contains=function(row,column){return 0==this.compare(row,column)},this.compareRange=function(range){var cmp,end=range.end,start=range.start;return cmp=this.compare(end.row,end.column),1==cmp?(cmp=this.compare(start.row,start.column),1==cmp?2:0==cmp?1:0):-1==cmp?-2:(cmp=this.compare(start.row,start.column),-1==cmp?-1:1==cmp?42:0)},this.comparePoint=function(p){return this.compare(p.row,p.column)},this.containsRange=function(range){return 0==this.comparePoint(range.start)&&0==this.comparePoint(range.end)},this.intersects=function(range){var cmp=this.compareRange(range);return-1==cmp||0==cmp||1==cmp},this.isEnd=function(row,column){return this.end.row==row&&this.end.column==column},this.isStart=function(row,column){return this.start.row==row&&this.start.column==column},this.setStart=function(row,column){\"object\"==typeof row?(this.start.column=row.column,this.start.row=row.row):(this.start.row=row,this.start.column=column)},this.setEnd=function(row,column){\"object\"==typeof row?(this.end.column=row.column,this.end.row=row.row):(this.end.row=row,this.end.column=column)},this.inside=function(row,column){return 0==this.compare(row,column)?this.isEnd(row,column)||this.isStart(row,column)?!1:!0:!1},this.insideStart=function(row,column){return 0==this.compare(row,column)?this.isEnd(row,column)?!1:!0:!1},this.insideEnd=function(row,column){return 0==this.compare(row,column)?this.isStart(row,column)?!1:!0:!1},this.compare=function(row,column){return this.isMultiLine()||row!==this.start.row?this.start.row>row?-1:row>this.end.row?1:this.start.row===row?column>=this.start.column?0:-1:this.end.row===row?this.end.column>=column?0:1:0:this.start.column>column?-1:column>this.end.column?1:0},this.compareStart=function(row,column){return this.start.row==row&&this.start.column==column?-1:this.compare(row,column)},this.compareEnd=function(row,column){return this.end.row==row&&this.end.column==column?1:this.compare(row,column)},this.compareInside=function(row,column){return this.end.row==row&&this.end.column==column?1:this.start.row==row&&this.start.column==column?-1:this.compare(row,column)},this.clipRows=function(firstRow,lastRow){if(this.end.row>lastRow)var end={row:lastRow+1,column:0};else if(firstRow>this.end.row)var end={row:firstRow,column:0};if(this.start.row>lastRow)var start={row:lastRow+1,column:0};else if(firstRow>this.start.row)var start={row:firstRow,column:0};return Range.fromPoints(start||this.start,end||this.end)},this.extend=function(row,column){var cmp=this.compare(row,column);if(0==cmp)return this;if(-1==cmp)var start={row:row,column:column};else var end={row:row,column:column};return Range.fromPoints(start||this.start,end||this.end)},this.isEmpty=function(){return this.start.row===this.end.row&&this.start.column===this.end.column},this.isMultiLine=function(){return this.start.row!==this.end.row},this.clone=function(){return Range.fromPoints(this.start,this.end)},this.collapseRows=function(){return 0==this.end.column?new Range(this.start.row,0,Math.max(this.start.row,this.end.row-1),0):new Range(this.start.row,0,this.end.row,0)},this.toScreenRange=function(session){var screenPosStart=session.documentToScreenPosition(this.start),screenPosEnd=session.documentToScreenPosition(this.end);return new Range(screenPosStart.row,screenPosStart.column,screenPosEnd.row,screenPosEnd.column)},this.moveBy=function(row,column){this.start.row+=row,this.start.column+=column,this.end.row+=row,this.end.column+=column}}).call(Range.prototype),Range.fromPoints=function(start,end){return new Range(start.row,start.column,end.row,end.column)},Range.comparePoints=comparePoints,Range.comparePoints=function(p1,p2){return p1.row-p2.row||p1.column-p2.column},exports.Range=Range}),ace.define(\"ace/apply_delta\",[\"require\",\"exports\",\"module\"],function(acequire,exports){\"use strict\";exports.applyDelta=function(docLines,delta){var row=delta.start.row,startColumn=delta.start.column,line=docLines[row]||\"\";switch(delta.action){case\"insert\":var lines=delta.lines;if(1===lines.length)docLines[row]=line.substring(0,startColumn)+delta.lines[0]+line.substring(startColumn);else{var args=[row,1].concat(delta.lines);docLines.splice.apply(docLines,args),docLines[row]=line.substring(0,startColumn)+docLines[row],docLines[row+delta.lines.length-1]+=line.substring(startColumn)}break;case\"remove\":var endColumn=delta.end.column,endRow=delta.end.row;row===endRow?docLines[row]=line.substring(0,startColumn)+line.substring(endColumn):docLines.splice(row,endRow-row+1,line.substring(0,startColumn)+docLines[endRow].substring(endColumn))}}}),ace.define(\"ace/lib/event_emitter\",[\"require\",\"exports\",\"module\"],function(acequire,exports){\"use strict\";var EventEmitter={},stopPropagation=function(){this.propagationStopped=!0},preventDefault=function(){this.defaultPrevented=!0};EventEmitter._emit=EventEmitter._dispatchEvent=function(eventName,e){this._eventRegistry||(this._eventRegistry={}),this._defaultHandlers||(this._defaultHandlers={});var listeners=this._eventRegistry[eventName]||[],defaultHandler=this._defaultHandlers[eventName];if(listeners.length||defaultHandler){\"object\"==typeof e&&e||(e={}),e.type||(e.type=eventName),e.stopPropagation||(e.stopPropagation=stopPropagation),e.preventDefault||(e.preventDefault=preventDefault),listeners=listeners.slice();for(var i=0;listeners.length>i&&(listeners[i](e,this),!e.propagationStopped);i++);return defaultHandler&&!e.defaultPrevented?defaultHandler(e,this):void 0}},EventEmitter._signal=function(eventName,e){var listeners=(this._eventRegistry||{})[eventName];if(listeners){listeners=listeners.slice();for(var i=0;listeners.length>i;i++)listeners[i](e,this)}},EventEmitter.once=function(eventName,callback){var _self=this;callback&&this.addEventListener(eventName,function newCallback(){_self.removeEventListener(eventName,newCallback),callback.apply(null,arguments)})},EventEmitter.setDefaultHandler=function(eventName,callback){var handlers=this._defaultHandlers;if(handlers||(handlers=this._defaultHandlers={_disabled_:{}}),handlers[eventName]){var old=handlers[eventName],disabled=handlers._disabled_[eventName];disabled||(handlers._disabled_[eventName]=disabled=[]),disabled.push(old);var i=disabled.indexOf(callback);-1!=i&&disabled.splice(i,1)}handlers[eventName]=callback},EventEmitter.removeDefaultHandler=function(eventName,callback){var handlers=this._defaultHandlers;if(handlers){var disabled=handlers._disabled_[eventName];if(handlers[eventName]==callback)handlers[eventName],disabled&&this.setDefaultHandler(eventName,disabled.pop());else if(disabled){var i=disabled.indexOf(callback);-1!=i&&disabled.splice(i,1)}}},EventEmitter.on=EventEmitter.addEventListener=function(eventName,callback,capturing){this._eventRegistry=this._eventRegistry||{};var listeners=this._eventRegistry[eventName];return listeners||(listeners=this._eventRegistry[eventName]=[]),-1==listeners.indexOf(callback)&&listeners[capturing?\"unshift\":\"push\"](callback),callback},EventEmitter.off=EventEmitter.removeListener=EventEmitter.removeEventListener=function(eventName,callback){this._eventRegistry=this._eventRegistry||{};var listeners=this._eventRegistry[eventName];if(listeners){var index=listeners.indexOf(callback);-1!==index&&listeners.splice(index,1)}},EventEmitter.removeAllListeners=function(eventName){this._eventRegistry&&(this._eventRegistry[eventName]=[])},exports.EventEmitter=EventEmitter}),ace.define(\"ace/anchor\",[\"require\",\"exports\",\"module\",\"ace/lib/oop\",\"ace/lib/event_emitter\"],function(acequire,exports){\"use strict\";var oop=acequire(\"./lib/oop\"),EventEmitter=acequire(\"./lib/event_emitter\").EventEmitter,Anchor=exports.Anchor=function(doc,row,column){this.$onChange=this.onChange.bind(this),this.attach(doc),column===void 0?this.setPosition(row.row,row.column):this.setPosition(row,column)};(function(){function $pointsInOrder(point1,point2,equalPointsInOrder){var bColIsAfter=equalPointsInOrder?point1.column<=point2.column:point1.column<point2.column;return point1.row<point2.row||point1.row==point2.row&&bColIsAfter}function $getTransformedPoint(delta,point,moveIfEqual){var deltaIsInsert=\"insert\"==delta.action,deltaRowShift=(deltaIsInsert?1:-1)*(delta.end.row-delta.start.row),deltaColShift=(deltaIsInsert?1:-1)*(delta.end.column-delta.start.column),deltaStart=delta.start,deltaEnd=deltaIsInsert?deltaStart:delta.end;return $pointsInOrder(point,deltaStart,moveIfEqual)?{row:point.row,column:point.column}:$pointsInOrder(deltaEnd,point,!moveIfEqual)?{row:point.row+deltaRowShift,column:point.column+(point.row==deltaEnd.row?deltaColShift:0)}:{row:deltaStart.row,column:deltaStart.column}}oop.implement(this,EventEmitter),this.getPosition=function(){return this.$clipPositionToDocument(this.row,this.column)},this.getDocument=function(){return this.document},this.$insertRight=!1,this.onChange=function(delta){if(!(delta.start.row==delta.end.row&&delta.start.row!=this.row||delta.start.row>this.row)){var point=$getTransformedPoint(delta,{row:this.row,column:this.column},this.$insertRight);this.setPosition(point.row,point.column,!0)}},this.setPosition=function(row,column,noClip){var pos;if(pos=noClip?{row:row,column:column}:this.$clipPositionToDocument(row,column),this.row!=pos.row||this.column!=pos.column){var old={row:this.row,column:this.column};this.row=pos.row,this.column=pos.column,this._signal(\"change\",{old:old,value:pos})}},this.detach=function(){this.document.removeEventListener(\"change\",this.$onChange)},this.attach=function(doc){this.document=doc||this.document,this.document.on(\"change\",this.$onChange)},this.$clipPositionToDocument=function(row,column){var pos={};return row>=this.document.getLength()?(pos.row=Math.max(0,this.document.getLength()-1),pos.column=this.document.getLine(pos.row).length):0>row?(pos.row=0,pos.column=0):(pos.row=row,pos.column=Math.min(this.document.getLine(pos.row).length,Math.max(0,column))),0>column&&(pos.column=0),pos}}).call(Anchor.prototype)}),ace.define(\"ace/document\",[\"require\",\"exports\",\"module\",\"ace/lib/oop\",\"ace/apply_delta\",\"ace/lib/event_emitter\",\"ace/range\",\"ace/anchor\"],function(acequire,exports){\"use strict\";var oop=acequire(\"./lib/oop\"),applyDelta=acequire(\"./apply_delta\").applyDelta,EventEmitter=acequire(\"./lib/event_emitter\").EventEmitter,Range=acequire(\"./range\").Range,Anchor=acequire(\"./anchor\").Anchor,Document=function(textOrLines){this.$lines=[\"\"],0===textOrLines.length?this.$lines=[\"\"]:Array.isArray(textOrLines)?this.insertMergedLines({row:0,column:0},textOrLines):this.insert({row:0,column:0},textOrLines)};(function(){oop.implement(this,EventEmitter),this.setValue=function(text){var len=this.getLength()-1;this.remove(new Range(0,0,len,this.getLine(len).length)),this.insert({row:0,column:0},text)},this.getValue=function(){return this.getAllLines().join(this.getNewLineCharacter())},this.createAnchor=function(row,column){return new Anchor(this,row,column)},this.$split=0===\"aaa\".split(/a/).length?function(text){return text.replace(/\\r\\n|\\r/g,\"\\n\").split(\"\\n\")}:function(text){return text.split(/\\r\\n|\\r|\\n/)},this.$detectNewLine=function(text){var match=text.match(/^.*?(\\r\\n|\\r|\\n)/m);this.$autoNewLine=match?match[1]:\"\\n\",this._signal(\"changeNewLineMode\")},this.getNewLineCharacter=function(){switch(this.$newLineMode){case\"windows\":return\"\\r\\n\";case\"unix\":return\"\\n\";default:return this.$autoNewLine||\"\\n\"}},this.$autoNewLine=\"\",this.$newLineMode=\"auto\",this.setNewLineMode=function(newLineMode){this.$newLineMode!==newLineMode&&(this.$newLineMode=newLineMode,this._signal(\"changeNewLineMode\"))},this.getNewLineMode=function(){return this.$newLineMode},this.isNewLine=function(text){return\"\\r\\n\"==text||\"\\r\"==text||\"\\n\"==text},this.getLine=function(row){return this.$lines[row]||\"\"},this.getLines=function(firstRow,lastRow){return this.$lines.slice(firstRow,lastRow+1)},this.getAllLines=function(){return this.getLines(0,this.getLength())},this.getLength=function(){return this.$lines.length},this.getTextRange=function(range){return this.getLinesForRange(range).join(this.getNewLineCharacter())},this.getLinesForRange=function(range){var lines;if(range.start.row===range.end.row)lines=[this.getLine(range.start.row).substring(range.start.column,range.end.column)];else{lines=this.getLines(range.start.row,range.end.row),lines[0]=(lines[0]||\"\").substring(range.start.column);var l=lines.length-1;range.end.row-range.start.row==l&&(lines[l]=lines[l].substring(0,range.end.column))}return lines},this.insertLines=function(row,lines){return console.warn(\"Use of document.insertLines is deprecated. Use the insertFullLines method instead.\"),this.insertFullLines(row,lines)},this.removeLines=function(firstRow,lastRow){return console.warn(\"Use of document.removeLines is deprecated. Use the removeFullLines method instead.\"),this.removeFullLines(firstRow,lastRow)},this.insertNewLine=function(position){return console.warn(\"Use of document.insertNewLine is deprecated. Use insertMergedLines(position, ['', '']) instead.\"),this.insertMergedLines(position,[\"\",\"\"])},this.insert=function(position,text){return 1>=this.getLength()&&this.$detectNewLine(text),this.insertMergedLines(position,this.$split(text))},this.insertInLine=function(position,text){var start=this.clippedPos(position.row,position.column),end=this.pos(position.row,position.column+text.length);return this.applyDelta({start:start,end:end,action:\"insert\",lines:[text]},!0),this.clonePos(end)},this.clippedPos=function(row,column){var length=this.getLength();void 0===row?row=length:0>row?row=0:row>=length&&(row=length-1,column=void 0);var line=this.getLine(row);return void 0==column&&(column=line.length),column=Math.min(Math.max(column,0),line.length),{row:row,column:column}},this.clonePos=function(pos){return{row:pos.row,column:pos.column}},this.pos=function(row,column){return{row:row,column:column}},this.$clipPosition=function(position){var length=this.getLength();return position.row>=length?(position.row=Math.max(0,length-1),position.column=this.getLine(length-1).length):(position.row=Math.max(0,position.row),position.column=Math.min(Math.max(position.column,0),this.getLine(position.row).length)),position},this.insertFullLines=function(row,lines){row=Math.min(Math.max(row,0),this.getLength());var column=0;this.getLength()>row?(lines=lines.concat([\"\"]),column=0):(lines=[\"\"].concat(lines),row--,column=this.$lines[row].length),this.insertMergedLines({row:row,column:column},lines)},this.insertMergedLines=function(position,lines){var start=this.clippedPos(position.row,position.column),end={row:start.row+lines.length-1,column:(1==lines.length?start.column:0)+lines[lines.length-1].length};return this.applyDelta({start:start,end:end,action:\"insert\",lines:lines}),this.clonePos(end)},this.remove=function(range){var start=this.clippedPos(range.start.row,range.start.column),end=this.clippedPos(range.end.row,range.end.column);return this.applyDelta({start:start,end:end,action:\"remove\",lines:this.getLinesForRange({start:start,end:end})}),this.clonePos(start)},this.removeInLine=function(row,startColumn,endColumn){var start=this.clippedPos(row,startColumn),end=this.clippedPos(row,endColumn);return this.applyDelta({start:start,end:end,action:\"remove\",lines:this.getLinesForRange({start:start,end:end})},!0),this.clonePos(start)},this.removeFullLines=function(firstRow,lastRow){firstRow=Math.min(Math.max(0,firstRow),this.getLength()-1),lastRow=Math.min(Math.max(0,lastRow),this.getLength()-1);var deleteFirstNewLine=lastRow==this.getLength()-1&&firstRow>0,deleteLastNewLine=this.getLength()-1>lastRow,startRow=deleteFirstNewLine?firstRow-1:firstRow,startCol=deleteFirstNewLine?this.getLine(startRow).length:0,endRow=deleteLastNewLine?lastRow+1:lastRow,endCol=deleteLastNewLine?0:this.getLine(endRow).length,range=new Range(startRow,startCol,endRow,endCol),deletedLines=this.$lines.slice(firstRow,lastRow+1);return this.applyDelta({start:range.start,end:range.end,action:\"remove\",lines:this.getLinesForRange(range)}),deletedLines},this.removeNewLine=function(row){this.getLength()-1>row&&row>=0&&this.applyDelta({start:this.pos(row,this.getLine(row).length),end:this.pos(row+1,0),action:\"remove\",lines:[\"\",\"\"]})},this.replace=function(range,text){if(range instanceof Range||(range=Range.fromPoints(range.start,range.end)),0===text.length&&range.isEmpty())return range.start;if(text==this.getTextRange(range))return range.end;this.remove(range);var end;return end=text?this.insert(range.start,text):range.start},this.applyDeltas=function(deltas){for(var i=0;deltas.length>i;i++)this.applyDelta(deltas[i])},this.revertDeltas=function(deltas){for(var i=deltas.length-1;i>=0;i--)this.revertDelta(deltas[i])},this.applyDelta=function(delta,doNotValidate){var isInsert=\"insert\"==delta.action;(isInsert?1>=delta.lines.length&&!delta.lines[0]:!Range.comparePoints(delta.start,delta.end))||(isInsert&&delta.lines.length>2e4&&this.$splitAndapplyLargeDelta(delta,2e4),applyDelta(this.$lines,delta,doNotValidate),this._signal(\"change\",delta))},this.$splitAndapplyLargeDelta=function(delta,MAX){for(var lines=delta.lines,l=lines.length,row=delta.start.row,column=delta.start.column,from=0,to=0;;){from=to,to+=MAX-1;var chunk=lines.slice(from,to);if(to>l){delta.lines=chunk,delta.start.row=row+from,delta.start.column=column;break}chunk.push(\"\"),this.applyDelta({start:this.pos(row+from,column),end:this.pos(row+to,column=0),action:delta.action,lines:chunk},!0)}},this.revertDelta=function(delta){this.applyDelta({start:this.clonePos(delta.start),end:this.clonePos(delta.end),action:\"insert\"==delta.action?\"remove\":\"insert\",lines:delta.lines.slice()})},this.indexToPosition=function(index,startRow){for(var lines=this.$lines||this.getAllLines(),newlineLength=this.getNewLineCharacter().length,i=startRow||0,l=lines.length;l>i;i++)if(index-=lines[i].length+newlineLength,0>index)return{row:i,column:index+lines[i].length+newlineLength};return{row:l-1,column:lines[l-1].length}},this.positionToIndex=function(pos,startRow){for(var lines=this.$lines||this.getAllLines(),newlineLength=this.getNewLineCharacter().length,index=0,row=Math.min(pos.row,lines.length),i=startRow||0;row>i;++i)index+=lines[i].length+newlineLength;return index+pos.column}}).call(Document.prototype),exports.Document=Document}),ace.define(\"ace/lib/lang\",[\"require\",\"exports\",\"module\"],function(acequire,exports){\"use strict\";exports.last=function(a){return a[a.length-1]},exports.stringReverse=function(string){return string.split(\"\").reverse().join(\"\")},exports.stringRepeat=function(string,count){for(var result=\"\";count>0;)1&count&&(result+=string),(count>>=1)&&(string+=string);return result};var trimBeginRegexp=/^\\s\\s*/,trimEndRegexp=/\\s\\s*$/;exports.stringTrimLeft=function(string){return string.replace(trimBeginRegexp,\"\")},exports.stringTrimRight=function(string){return string.replace(trimEndRegexp,\"\")},exports.copyObject=function(obj){var copy={};for(var key in obj)copy[key]=obj[key];return copy},exports.copyArray=function(array){for(var copy=[],i=0,l=array.length;l>i;i++)copy[i]=array[i]&&\"object\"==typeof array[i]?this.copyObject(array[i]):array[i];return copy},exports.deepCopy=function deepCopy(obj){if(\"object\"!=typeof obj||!obj)return obj;var copy;if(Array.isArray(obj)){copy=[];for(var key=0;obj.length>key;key++)copy[key]=deepCopy(obj[key]);return copy}if(\"[object Object]\"!==Object.prototype.toString.call(obj))return obj;copy={};for(var key in obj)copy[key]=deepCopy(obj[key]);return copy},exports.arrayToMap=function(arr){for(var map={},i=0;arr.length>i;i++)map[arr[i]]=1;return map},exports.createMap=function(props){var map=Object.create(null);for(var i in props)map[i]=props[i];return map},exports.arrayRemove=function(array,value){for(var i=0;array.length>=i;i++)value===array[i]&&array.splice(i,1)},exports.escapeRegExp=function(str){return str.replace(/([.*+?^${}()|[\\]\\/\\\\])/g,\"\\\\$1\")},exports.escapeHTML=function(str){return str.replace(/&/g,\"&#38;\").replace(/\"/g,\"&#34;\").replace(/'/g,\"&#39;\").replace(/</g,\"&#60;\")},exports.getMatchOffsets=function(string,regExp){var matches=[];return string.replace(regExp,function(str){matches.push({offset:arguments[arguments.length-2],length:str.length})}),matches},exports.deferredCall=function(fcn){var timer=null,callback=function(){timer=null,fcn()},deferred=function(timeout){return deferred.cancel(),timer=setTimeout(callback,timeout||0),deferred};return deferred.schedule=deferred,deferred.call=function(){return this.cancel(),fcn(),deferred},deferred.cancel=function(){return clearTimeout(timer),timer=null,deferred},deferred.isPending=function(){return timer},deferred},exports.delayedCall=function(fcn,defaultTimeout){var timer=null,callback=function(){timer=null,fcn()},_self=function(timeout){null==timer&&(timer=setTimeout(callback,timeout||defaultTimeout))};return _self.delay=function(timeout){timer&&clearTimeout(timer),timer=setTimeout(callback,timeout||defaultTimeout)},_self.schedule=_self,_self.call=function(){this.cancel(),fcn()},_self.cancel=function(){timer&&clearTimeout(timer),timer=null},_self.isPending=function(){return timer},_self}}),ace.define(\"ace/worker/mirror\",[\"require\",\"exports\",\"module\",\"ace/range\",\"ace/document\",\"ace/lib/lang\"],function(acequire,exports){\"use strict\";acequire(\"../range\").Range;var Document=acequire(\"../document\").Document,lang=acequire(\"../lib/lang\"),Mirror=exports.Mirror=function(sender){this.sender=sender;var doc=this.doc=new Document(\"\"),deferredUpdate=this.deferredUpdate=lang.delayedCall(this.onUpdate.bind(this)),_self=this;sender.on(\"change\",function(e){var data=e.data;if(data[0].start)doc.applyDeltas(data);else for(var i=0;data.length>i;i+=2){if(Array.isArray(data[i+1]))var d={action:\"insert\",start:data[i],lines:data[i+1]};else var d={action:\"remove\",start:data[i],end:data[i+1]};doc.applyDelta(d,!0)}return _self.$timeout?deferredUpdate.schedule(_self.$timeout):(_self.onUpdate(),void 0)})};(function(){this.$timeout=500,this.setTimeout=function(timeout){this.$timeout=timeout},this.setValue=function(value){this.doc.setValue(value),this.deferredUpdate.schedule(this.$timeout)},this.getValue=function(callbackId){this.sender.callback(this.doc.getValue(),callbackId)},this.onUpdate=function(){},this.isPending=function(){return this.deferredUpdate.isPending()}}).call(Mirror.prototype)}),ace.define(\"ace/mode/json/json_parse\",[\"require\",\"exports\",\"module\"],function(){\"use strict\";var at,ch,text,value,escapee={'\"':'\"',\"\\\\\":\"\\\\\",\"/\":\"/\",b:\"\\b\",f:\"\\f\",n:\"\\n\",r:\"\\r\",t:\"\t\"},error=function(m){throw{name:\"SyntaxError\",message:m,at:at,text:text}},next=function(c){return c&&c!==ch&&error(\"Expected '\"+c+\"' instead of '\"+ch+\"'\"),ch=text.charAt(at),at+=1,ch},number=function(){var number,string=\"\";for(\"-\"===ch&&(string=\"-\",next(\"-\"));ch>=\"0\"&&\"9\">=ch;)string+=ch,next();if(\".\"===ch)for(string+=\".\";next()&&ch>=\"0\"&&\"9\">=ch;)string+=ch;if(\"e\"===ch||\"E\"===ch)for(string+=ch,next(),(\"-\"===ch||\"+\"===ch)&&(string+=ch,next());ch>=\"0\"&&\"9\">=ch;)string+=ch,next();return number=+string,isNaN(number)?(error(\"Bad number\"),void 0):number},string=function(){var hex,i,uffff,string=\"\";if('\"'===ch)for(;next();){if('\"'===ch)return next(),string;if(\"\\\\\"===ch)if(next(),\"u\"===ch){for(uffff=0,i=0;4>i&&(hex=parseInt(next(),16),isFinite(hex));i+=1)uffff=16*uffff+hex;string+=String.fromCharCode(uffff)}else{if(\"string\"!=typeof escapee[ch])break;string+=escapee[ch]}else string+=ch}error(\"Bad string\")},white=function(){for(;ch&&\" \">=ch;)next()},word=function(){switch(ch){case\"t\":return next(\"t\"),next(\"r\"),next(\"u\"),next(\"e\"),!0;case\"f\":return next(\"f\"),next(\"a\"),next(\"l\"),next(\"s\"),next(\"e\"),!1;case\"n\":return next(\"n\"),next(\"u\"),next(\"l\"),next(\"l\"),null}error(\"Unexpected '\"+ch+\"'\")},array=function(){var array=[];if(\"[\"===ch){if(next(\"[\"),white(),\"]\"===ch)return next(\"]\"),array;for(;ch;){if(array.push(value()),white(),\"]\"===ch)return next(\"]\"),array;next(\",\"),white()}}error(\"Bad array\")},object=function(){var key,object={};if(\"{\"===ch){if(next(\"{\"),white(),\"}\"===ch)return next(\"}\"),object;for(;ch;){if(key=string(),white(),next(\":\"),Object.hasOwnProperty.call(object,key)&&error('Duplicate key \"'+key+'\"'),object[key]=value(),white(),\"}\"===ch)return next(\"}\"),object;next(\",\"),white()}}error(\"Bad object\")};return value=function(){switch(white(),ch){case\"{\":return object();case\"[\":return array();case'\"':return string();case\"-\":return number();default:return ch>=\"0\"&&\"9\">=ch?number():word()}},function(source,reviver){var result;return text=source,at=0,ch=\" \",result=value(),white(),ch&&error(\"Syntax error\"),\"function\"==typeof reviver?function walk(holder,key){var k,v,value=holder[key];if(value&&\"object\"==typeof value)for(k in value)Object.hasOwnProperty.call(value,k)&&(v=walk(value,k),void 0!==v?value[k]=v:delete value[k]);return reviver.call(holder,key,value)}({\"\":result},\"\"):result}}),ace.define(\"ace/mode/json_worker\",[\"require\",\"exports\",\"module\",\"ace/lib/oop\",\"ace/worker/mirror\",\"ace/mode/json/json_parse\"],function(acequire,exports){\"use strict\";var oop=acequire(\"../lib/oop\"),Mirror=acequire(\"../worker/mirror\").Mirror,parse=acequire(\"./json/json_parse\"),JsonWorker=exports.JsonWorker=function(sender){Mirror.call(this,sender),this.setTimeout(200)};oop.inherits(JsonWorker,Mirror),function(){this.onUpdate=function(){var value=this.doc.getValue(),errors=[];try{value&&parse(value)}catch(e){var pos=this.doc.indexToPosition(e.at-1);errors.push({row:pos.row,column:pos.column,text:e.message,type:\"error\"})}this.sender.emit(\"annotate\",errors)}}.call(JsonWorker.prototype)}),ace.define(\"ace/lib/es5-shim\",[\"require\",\"exports\",\"module\"],function(){function Empty(){}function doesDefinePropertyWork(object){try{return Object.defineProperty(object,\"sentinel\",{}),\"sentinel\"in object}catch(exception){}}function toInteger(n){return n=+n,n!==n?n=0:0!==n&&n!==1/0&&n!==-(1/0)&&(n=(n>0||-1)*Math.floor(Math.abs(n))),n}Function.prototype.bind||(Function.prototype.bind=function(that){var target=this;if(\"function\"!=typeof target)throw new TypeError(\"Function.prototype.bind called on incompatible \"+target);var args=slice.call(arguments,1),bound=function(){if(this instanceof bound){var result=target.apply(this,args.concat(slice.call(arguments)));return Object(result)===result?result:this}return target.apply(that,args.concat(slice.call(arguments)))};return target.prototype&&(Empty.prototype=target.prototype,bound.prototype=new Empty,Empty.prototype=null),bound});var defineGetter,defineSetter,lookupGetter,lookupSetter,supportsAccessors,call=Function.prototype.call,prototypeOfArray=Array.prototype,prototypeOfObject=Object.prototype,slice=prototypeOfArray.slice,_toString=call.bind(prototypeOfObject.toString),owns=call.bind(prototypeOfObject.hasOwnProperty);if((supportsAccessors=owns(prototypeOfObject,\"__defineGetter__\"))&&(defineGetter=call.bind(prototypeOfObject.__defineGetter__),defineSetter=call.bind(prototypeOfObject.__defineSetter__),lookupGetter=call.bind(prototypeOfObject.__lookupGetter__),lookupSetter=call.bind(prototypeOfObject.__lookupSetter__)),2!=[1,2].splice(0).length)if(function(){function makeArray(l){var a=Array(l+2);return a[0]=a[1]=0,a}var lengthBefore,array=[];return array.splice.apply(array,makeArray(20)),array.splice.apply(array,makeArray(26)),lengthBefore=array.length,array.splice(5,0,\"XXX\"),lengthBefore+1==array.length,lengthBefore+1==array.length?!0:void 0\n}()){var array_splice=Array.prototype.splice;Array.prototype.splice=function(start,deleteCount){return arguments.length?array_splice.apply(this,[void 0===start?0:start,void 0===deleteCount?this.length-start:deleteCount].concat(slice.call(arguments,2))):[]}}else Array.prototype.splice=function(pos,removeCount){var length=this.length;pos>0?pos>length&&(pos=length):void 0==pos?pos=0:0>pos&&(pos=Math.max(length+pos,0)),length>pos+removeCount||(removeCount=length-pos);var removed=this.slice(pos,pos+removeCount),insert=slice.call(arguments,2),add=insert.length;if(pos===length)add&&this.push.apply(this,insert);else{var remove=Math.min(removeCount,length-pos),tailOldPos=pos+remove,tailNewPos=tailOldPos+add-remove,tailCount=length-tailOldPos,lengthAfterRemove=length-remove;if(tailOldPos>tailNewPos)for(var i=0;tailCount>i;++i)this[tailNewPos+i]=this[tailOldPos+i];else if(tailNewPos>tailOldPos)for(i=tailCount;i--;)this[tailNewPos+i]=this[tailOldPos+i];if(add&&pos===lengthAfterRemove)this.length=lengthAfterRemove,this.push.apply(this,insert);else for(this.length=lengthAfterRemove+add,i=0;add>i;++i)this[pos+i]=insert[i]}return removed};Array.isArray||(Array.isArray=function(obj){return\"[object Array]\"==_toString(obj)});var boxedString=Object(\"a\"),splitString=\"a\"!=boxedString[0]||!(0 in boxedString);if(Array.prototype.forEach||(Array.prototype.forEach=function(fun){var object=toObject(this),self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):object,thisp=arguments[1],i=-1,length=self.length>>>0;if(\"[object Function]\"!=_toString(fun))throw new TypeError;for(;length>++i;)i in self&&fun.call(thisp,self[i],i,object)}),Array.prototype.map||(Array.prototype.map=function(fun){var object=toObject(this),self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):object,length=self.length>>>0,result=Array(length),thisp=arguments[1];if(\"[object Function]\"!=_toString(fun))throw new TypeError(fun+\" is not a function\");for(var i=0;length>i;i++)i in self&&(result[i]=fun.call(thisp,self[i],i,object));return result}),Array.prototype.filter||(Array.prototype.filter=function(fun){var value,object=toObject(this),self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):object,length=self.length>>>0,result=[],thisp=arguments[1];if(\"[object Function]\"!=_toString(fun))throw new TypeError(fun+\" is not a function\");for(var i=0;length>i;i++)i in self&&(value=self[i],fun.call(thisp,value,i,object)&&result.push(value));return result}),Array.prototype.every||(Array.prototype.every=function(fun){var object=toObject(this),self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):object,length=self.length>>>0,thisp=arguments[1];if(\"[object Function]\"!=_toString(fun))throw new TypeError(fun+\" is not a function\");for(var i=0;length>i;i++)if(i in self&&!fun.call(thisp,self[i],i,object))return!1;return!0}),Array.prototype.some||(Array.prototype.some=function(fun){var object=toObject(this),self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):object,length=self.length>>>0,thisp=arguments[1];if(\"[object Function]\"!=_toString(fun))throw new TypeError(fun+\" is not a function\");for(var i=0;length>i;i++)if(i in self&&fun.call(thisp,self[i],i,object))return!0;return!1}),Array.prototype.reduce||(Array.prototype.reduce=function(fun){var object=toObject(this),self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):object,length=self.length>>>0;if(\"[object Function]\"!=_toString(fun))throw new TypeError(fun+\" is not a function\");if(!length&&1==arguments.length)throw new TypeError(\"reduce of empty array with no initial value\");var result,i=0;if(arguments.length>=2)result=arguments[1];else for(;;){if(i in self){result=self[i++];break}if(++i>=length)throw new TypeError(\"reduce of empty array with no initial value\")}for(;length>i;i++)i in self&&(result=fun.call(void 0,result,self[i],i,object));return result}),Array.prototype.reduceRight||(Array.prototype.reduceRight=function(fun){var object=toObject(this),self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):object,length=self.length>>>0;if(\"[object Function]\"!=_toString(fun))throw new TypeError(fun+\" is not a function\");if(!length&&1==arguments.length)throw new TypeError(\"reduceRight of empty array with no initial value\");var result,i=length-1;if(arguments.length>=2)result=arguments[1];else for(;;){if(i in self){result=self[i--];break}if(0>--i)throw new TypeError(\"reduceRight of empty array with no initial value\")}do i in this&&(result=fun.call(void 0,result,self[i],i,object));while(i--);return result}),Array.prototype.indexOf&&-1==[0,1].indexOf(1,2)||(Array.prototype.indexOf=function(sought){var self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):toObject(this),length=self.length>>>0;if(!length)return-1;var i=0;for(arguments.length>1&&(i=toInteger(arguments[1])),i=i>=0?i:Math.max(0,length+i);length>i;i++)if(i in self&&self[i]===sought)return i;return-1}),Array.prototype.lastIndexOf&&-1==[0,1].lastIndexOf(0,-3)||(Array.prototype.lastIndexOf=function(sought){var self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):toObject(this),length=self.length>>>0;if(!length)return-1;var i=length-1;for(arguments.length>1&&(i=Math.min(i,toInteger(arguments[1]))),i=i>=0?i:length-Math.abs(i);i>=0;i--)if(i in self&&sought===self[i])return i;return-1}),Object.getPrototypeOf||(Object.getPrototypeOf=function(object){return object.__proto__||(object.constructor?object.constructor.prototype:prototypeOfObject)}),!Object.getOwnPropertyDescriptor){var ERR_NON_OBJECT=\"Object.getOwnPropertyDescriptor called on a non-object: \";Object.getOwnPropertyDescriptor=function(object,property){if(\"object\"!=typeof object&&\"function\"!=typeof object||null===object)throw new TypeError(ERR_NON_OBJECT+object);if(owns(object,property)){var descriptor,getter,setter;if(descriptor={enumerable:!0,configurable:!0},supportsAccessors){var prototype=object.__proto__;object.__proto__=prototypeOfObject;var getter=lookupGetter(object,property),setter=lookupSetter(object,property);if(object.__proto__=prototype,getter||setter)return getter&&(descriptor.get=getter),setter&&(descriptor.set=setter),descriptor}return descriptor.value=object[property],descriptor}}}if(Object.getOwnPropertyNames||(Object.getOwnPropertyNames=function(object){return Object.keys(object)}),!Object.create){var createEmpty;createEmpty=null===Object.prototype.__proto__?function(){return{__proto__:null}}:function(){var empty={};for(var i in empty)empty[i]=null;return empty.constructor=empty.hasOwnProperty=empty.propertyIsEnumerable=empty.isPrototypeOf=empty.toLocaleString=empty.toString=empty.valueOf=empty.__proto__=null,empty},Object.create=function(prototype,properties){var object;if(null===prototype)object=createEmpty();else{if(\"object\"!=typeof prototype)throw new TypeError(\"typeof prototype[\"+typeof prototype+\"] != 'object'\");var Type=function(){};Type.prototype=prototype,object=new Type,object.__proto__=prototype}return void 0!==properties&&Object.defineProperties(object,properties),object}}if(Object.defineProperty){var definePropertyWorksOnObject=doesDefinePropertyWork({}),definePropertyWorksOnDom=\"undefined\"==typeof document||doesDefinePropertyWork(document.createElement(\"div\"));if(!definePropertyWorksOnObject||!definePropertyWorksOnDom)var definePropertyFallback=Object.defineProperty}if(!Object.defineProperty||definePropertyFallback){var ERR_NON_OBJECT_DESCRIPTOR=\"Property description must be an object: \",ERR_NON_OBJECT_TARGET=\"Object.defineProperty called on non-object: \",ERR_ACCESSORS_NOT_SUPPORTED=\"getters & setters can not be defined on this javascript engine\";Object.defineProperty=function(object,property,descriptor){if(\"object\"!=typeof object&&\"function\"!=typeof object||null===object)throw new TypeError(ERR_NON_OBJECT_TARGET+object);if(\"object\"!=typeof descriptor&&\"function\"!=typeof descriptor||null===descriptor)throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR+descriptor);if(definePropertyFallback)try{return definePropertyFallback.call(Object,object,property,descriptor)}catch(exception){}if(owns(descriptor,\"value\"))if(supportsAccessors&&(lookupGetter(object,property)||lookupSetter(object,property))){var prototype=object.__proto__;object.__proto__=prototypeOfObject,delete object[property],object[property]=descriptor.value,object.__proto__=prototype}else object[property]=descriptor.value;else{if(!supportsAccessors)throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);owns(descriptor,\"get\")&&defineGetter(object,property,descriptor.get),owns(descriptor,\"set\")&&defineSetter(object,property,descriptor.set)}return object}}Object.defineProperties||(Object.defineProperties=function(object,properties){for(var property in properties)owns(properties,property)&&Object.defineProperty(object,property,properties[property]);return object}),Object.seal||(Object.seal=function(object){return object}),Object.freeze||(Object.freeze=function(object){return object});try{Object.freeze(function(){})}catch(exception){Object.freeze=function(freezeObject){return function(object){return\"function\"==typeof object?object:freezeObject(object)}}(Object.freeze)}if(Object.preventExtensions||(Object.preventExtensions=function(object){return object}),Object.isSealed||(Object.isSealed=function(){return!1}),Object.isFrozen||(Object.isFrozen=function(){return!1}),Object.isExtensible||(Object.isExtensible=function(object){if(Object(object)===object)throw new TypeError;for(var name=\"\";owns(object,name);)name+=\"?\";object[name]=!0;var returnValue=owns(object,name);return delete object[name],returnValue}),!Object.keys){var hasDontEnumBug=!0,dontEnums=[\"toString\",\"toLocaleString\",\"valueOf\",\"hasOwnProperty\",\"isPrototypeOf\",\"propertyIsEnumerable\",\"constructor\"],dontEnumsLength=dontEnums.length;for(var key in{toString:null})hasDontEnumBug=!1;Object.keys=function(object){if(\"object\"!=typeof object&&\"function\"!=typeof object||null===object)throw new TypeError(\"Object.keys called on a non-object\");var keys=[];for(var name in object)owns(object,name)&&keys.push(name);if(hasDontEnumBug)for(var i=0,ii=dontEnumsLength;ii>i;i++){var dontEnum=dontEnums[i];owns(object,dontEnum)&&keys.push(dontEnum)}return keys}}Date.now||(Date.now=function(){return(new Date).getTime()});var ws=\"\t\\n\u000b\\f\\r   ᠎             　\\u2028\\u2029﻿\";if(!String.prototype.trim||ws.trim()){ws=\"[\"+ws+\"]\";var trimBeginRegexp=RegExp(\"^\"+ws+ws+\"*\"),trimEndRegexp=RegExp(ws+ws+\"*$\");String.prototype.trim=function(){return(this+\"\").replace(trimBeginRegexp,\"\").replace(trimEndRegexp,\"\")}}var toObject=function(o){if(null==o)throw new TypeError(\"can't convert \"+o+\" to object\");return Object(o)}});";

/***/ },
/* 4 */
/***/ function(module, exports) {

	ace.define("ace/ext/searchbox",["require","exports","module","ace/lib/dom","ace/lib/lang","ace/lib/event","ace/keyboard/hash_handler","ace/lib/keys"], function(acequire, exports, module) {
	"use strict";

	var dom = acequire("../lib/dom");
	var lang = acequire("../lib/lang");
	var event = acequire("../lib/event");
	var searchboxCss = "\
	.ace_search {\
	background-color: #ddd;\
	color: #666;\
	border: 1px solid #cbcbcb;\
	border-top: 0 none;\
	overflow: hidden;\
	margin: 0;\
	padding: 4px 6px 0 4px;\
	position: absolute;\
	top: 0;\
	z-index: 99;\
	white-space: normal;\
	}\
	.ace_search.left {\
	border-left: 0 none;\
	border-radius: 0px 0px 5px 0px;\
	left: 0;\
	}\
	.ace_search.right {\
	border-radius: 0px 0px 0px 5px;\
	border-right: 0 none;\
	right: 0;\
	}\
	.ace_search_form, .ace_replace_form {\
	margin: 0 20px 4px 0;\
	overflow: hidden;\
	line-height: 1.9;\
	}\
	.ace_replace_form {\
	margin-right: 0;\
	}\
	.ace_search_form.ace_nomatch {\
	outline: 1px solid red;\
	}\
	.ace_search_field {\
	border-radius: 3px 0 0 3px;\
	background-color: white;\
	color: black;\
	border: 1px solid #cbcbcb;\
	border-right: 0 none;\
	box-sizing: border-box!important;\
	outline: 0;\
	padding: 0;\
	font-size: inherit;\
	margin: 0;\
	line-height: inherit;\
	padding: 0 6px;\
	min-width: 17em;\
	vertical-align: top;\
	}\
	.ace_searchbtn {\
	border: 1px solid #cbcbcb;\
	line-height: inherit;\
	display: inline-block;\
	padding: 0 6px;\
	background: #fff;\
	border-right: 0 none;\
	border-left: 1px solid #dcdcdc;\
	cursor: pointer;\
	margin: 0;\
	position: relative;\
	box-sizing: content-box!important;\
	color: #666;\
	}\
	.ace_searchbtn:last-child {\
	border-radius: 0 3px 3px 0;\
	border-right: 1px solid #cbcbcb;\
	}\
	.ace_searchbtn:disabled {\
	background: none;\
	cursor: default;\
	}\
	.ace_searchbtn:hover {\
	background-color: #eef1f6;\
	}\
	.ace_searchbtn.prev, .ace_searchbtn.next {\
	padding: 0px 0.7em\
	}\
	.ace_searchbtn.prev:after, .ace_searchbtn.next:after {\
	content: \"\";\
	border: solid 2px #888;\
	width: 0.5em;\
	height: 0.5em;\
	border-width:  2px 0 0 2px;\
	display:inline-block;\
	transform: rotate(-45deg);\
	}\
	.ace_searchbtn.next:after {\
	border-width: 0 2px 2px 0 ;\
	}\
	.ace_searchbtn_close {\
	background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAcCAYAAABRVo5BAAAAZ0lEQVR42u2SUQrAMAhDvazn8OjZBilCkYVVxiis8H4CT0VrAJb4WHT3C5xU2a2IQZXJjiQIRMdkEoJ5Q2yMqpfDIo+XY4k6h+YXOyKqTIj5REaxloNAd0xiKmAtsTHqW8sR2W5f7gCu5nWFUpVjZwAAAABJRU5ErkJggg==) no-repeat 50% 0;\
	border-radius: 50%;\
	border: 0 none;\
	color: #656565;\
	cursor: pointer;\
	font: 16px/16px Arial;\
	padding: 0;\
	height: 14px;\
	width: 14px;\
	top: 9px;\
	right: 7px;\
	position: absolute;\
	}\
	.ace_searchbtn_close:hover {\
	background-color: #656565;\
	background-position: 50% 100%;\
	color: white;\
	}\
	.ace_button {\
	margin-left: 2px;\
	cursor: pointer;\
	-webkit-user-select: none;\
	-moz-user-select: none;\
	-o-user-select: none;\
	-ms-user-select: none;\
	user-select: none;\
	overflow: hidden;\
	opacity: 0.7;\
	border: 1px solid rgba(100,100,100,0.23);\
	padding: 1px;\
	box-sizing:    border-box!important;\
	color: black;\
	}\
	.ace_button:hover {\
	background-color: #eee;\
	opacity:1;\
	}\
	.ace_button:active {\
	background-color: #ddd;\
	}\
	.ace_button.checked {\
	border-color: #3399ff;\
	opacity:1;\
	}\
	.ace_search_options{\
	margin-bottom: 3px;\
	text-align: right;\
	-webkit-user-select: none;\
	-moz-user-select: none;\
	-o-user-select: none;\
	-ms-user-select: none;\
	user-select: none;\
	clear: both;\
	}\
	.ace_search_counter {\
	float: left;\
	font-family: arial;\
	padding: 0 8px;\
	}";
	var HashHandler = acequire("../keyboard/hash_handler").HashHandler;
	var keyUtil = acequire("../lib/keys");

	var MAX_COUNT = 999;

	dom.importCssString(searchboxCss, "ace_searchbox");

	var html = '<div class="ace_search right">\
	    <span action="hide" class="ace_searchbtn_close"></span>\
	    <div class="ace_search_form">\
	        <input class="ace_search_field" placeholder="Search for" spellcheck="false"></input>\
	        <span action="findPrev" class="ace_searchbtn prev"></span>\
	        <span action="findNext" class="ace_searchbtn next"></span>\
	        <span action="findAll" class="ace_searchbtn" title="Alt-Enter">All</span>\
	    </div>\
	    <div class="ace_replace_form">\
	        <input class="ace_search_field" placeholder="Replace with" spellcheck="false"></input>\
	        <span action="replaceAndFindNext" class="ace_searchbtn">Replace</span>\
	        <span action="replaceAll" class="ace_searchbtn">All</span>\
	    </div>\
	    <div class="ace_search_options">\
	        <span action="toggleReplace" class="ace_button" title="Toggel Replace mode"\
	            style="float:left;margin-top:-2px;padding:0 5px;">+</span>\
	        <span class="ace_search_counter"></span>\
	        <span action="toggleRegexpMode" class="ace_button" title="RegExp Search">.*</span>\
	        <span action="toggleCaseSensitive" class="ace_button" title="CaseSensitive Search">Aa</span>\
	        <span action="toggleWholeWords" class="ace_button" title="Whole Word Search">\\b</span>\
	        <span action="searchInSelection" class="ace_button" title="Search In Selection">S</span>\
	    </div>\
	</div>'.replace(/> +/g, ">");

	var SearchBox = function(editor, range, showReplaceForm) {
	    var div = dom.createElement("div");
	    div.innerHTML = html;
	    this.element = div.firstChild;

	    this.setSession = this.setSession.bind(this);

	    this.$init();
	    this.setEditor(editor);
	};

	(function() {
	    this.setEditor = function(editor) {
	        editor.searchBox = this;
	        editor.renderer.scroller.appendChild(this.element);
	        this.editor = editor;
	    };

	    this.setSession = function(e) {
	        this.searchRange = null;
	        this.$syncOptions(true);
	    };

	    this.$initElements = function(sb) {
	        this.searchBox = sb.querySelector(".ace_search_form");
	        this.replaceBox = sb.querySelector(".ace_replace_form");
	        this.searchOption = sb.querySelector("[action=searchInSelection]");
	        this.replaceOption = sb.querySelector("[action=toggleReplace]");
	        this.regExpOption = sb.querySelector("[action=toggleRegexpMode]");
	        this.caseSensitiveOption = sb.querySelector("[action=toggleCaseSensitive]");
	        this.wholeWordOption = sb.querySelector("[action=toggleWholeWords]");
	        this.searchInput = this.searchBox.querySelector(".ace_search_field");
	        this.replaceInput = this.replaceBox.querySelector(".ace_search_field");
	        this.searchCounter = sb.querySelector(".ace_search_counter");
	    };
	    
	    this.$init = function() {
	        var sb = this.element;
	        
	        this.$initElements(sb);
	        
	        var _this = this;
	        event.addListener(sb, "mousedown", function(e) {
	            setTimeout(function(){
	                _this.activeInput.focus();
	            }, 0);
	            event.stopPropagation(e);
	        });
	        event.addListener(sb, "click", function(e) {
	            var t = e.target || e.srcElement;
	            var action = t.getAttribute("action");
	            if (action && _this[action])
	                _this[action]();
	            else if (_this.$searchBarKb.commands[action])
	                _this.$searchBarKb.commands[action].exec(_this);
	            event.stopPropagation(e);
	        });

	        event.addCommandKeyListener(sb, function(e, hashId, keyCode) {
	            var keyString = keyUtil.keyCodeToString(keyCode);
	            var command = _this.$searchBarKb.findKeyCommand(hashId, keyString);
	            if (command && command.exec) {
	                command.exec(_this);
	                event.stopEvent(e);
	            }
	        });

	        this.$onChange = lang.delayedCall(function() {
	            _this.find(false, false);
	        });

	        event.addListener(this.searchInput, "input", function() {
	            _this.$onChange.schedule(20);
	        });
	        event.addListener(this.searchInput, "focus", function() {
	            _this.activeInput = _this.searchInput;
	            _this.searchInput.value && _this.highlight();
	        });
	        event.addListener(this.replaceInput, "focus", function() {
	            _this.activeInput = _this.replaceInput;
	            _this.searchInput.value && _this.highlight();
	        });
	    };
	    this.$closeSearchBarKb = new HashHandler([{
	        bindKey: "Esc",
	        name: "closeSearchBar",
	        exec: function(editor) {
	            editor.searchBox.hide();
	        }
	    }]);
	    this.$searchBarKb = new HashHandler();
	    this.$searchBarKb.bindKeys({
	        "Ctrl-f|Command-f": function(sb) {
	            var isReplace = sb.isReplace = !sb.isReplace;
	            sb.replaceBox.style.display = isReplace ? "" : "none";
	            sb.replaceOption.checked = false;
	            sb.$syncOptions();
	            sb.searchInput.focus();
	        },
	        "Ctrl-H|Command-Option-F": function(sb) {
	            sb.replaceOption.checked = true;
	            sb.$syncOptions();
	            sb.replaceInput.focus();
	        },
	        "Ctrl-G|Command-G": function(sb) {
	            sb.findNext();
	        },
	        "Ctrl-Shift-G|Command-Shift-G": function(sb) {
	            sb.findPrev();
	        },
	        "esc": function(sb) {
	            setTimeout(function() { sb.hide();});
	        },
	        "Return": function(sb) {
	            if (sb.activeInput == sb.replaceInput)
	                sb.replace();
	            sb.findNext();
	        },
	        "Shift-Return": function(sb) {
	            if (sb.activeInput == sb.replaceInput)
	                sb.replace();
	            sb.findPrev();
	        },
	        "Alt-Return": function(sb) {
	            if (sb.activeInput == sb.replaceInput)
	                sb.replaceAll();
	            sb.findAll();
	        },
	        "Tab": function(sb) {
	            (sb.activeInput == sb.replaceInput ? sb.searchInput : sb.replaceInput).focus();
	        }
	    });

	    this.$searchBarKb.addCommands([{
	        name: "toggleRegexpMode",
	        bindKey: {win: "Alt-R|Alt-/", mac: "Ctrl-Alt-R|Ctrl-Alt-/"},
	        exec: function(sb) {
	            sb.regExpOption.checked = !sb.regExpOption.checked;
	            sb.$syncOptions();
	        }
	    }, {
	        name: "toggleCaseSensitive",
	        bindKey: {win: "Alt-C|Alt-I", mac: "Ctrl-Alt-R|Ctrl-Alt-I"},
	        exec: function(sb) {
	            sb.caseSensitiveOption.checked = !sb.caseSensitiveOption.checked;
	            sb.$syncOptions();
	        }
	    }, {
	        name: "toggleWholeWords",
	        bindKey: {win: "Alt-B|Alt-W", mac: "Ctrl-Alt-B|Ctrl-Alt-W"},
	        exec: function(sb) {
	            sb.wholeWordOption.checked = !sb.wholeWordOption.checked;
	            sb.$syncOptions();
	        }
	    }, {
	        name: "toggleReplace",
	        exec: function(sb) {
	            sb.replaceOption.checked = !sb.replaceOption.checked;
	            sb.$syncOptions();
	        }
	    }, {
	        name: "searchInSelection",
	        exec: function(sb) {
	            sb.searchOption.checked = !sb.searchRange;
	            sb.setSearchRange(sb.searchOption.checked && sb.editor.getSelectionRange());
	            sb.$syncOptions();
	        }
	    }]);

	    this.setSearchRange = function(range) {
	        this.searchRange = range;
	        if (range) {
	            this.searchRangeMarker = this.editor.session.addMarker(range, "ace_active-line");
	        } else if (this.searchRangeMarker) {
	            this.editor.session.removeMarker(this.searchRangeMarker);
	            this.searchRangeMarker = null;
	        }
	    };

	    this.$syncOptions = function(preventScroll) {
	        dom.setCssClass(this.replaceOption, "checked", this.searchRange);
	        dom.setCssClass(this.searchOption, "checked", this.searchOption.checked);
	        this.replaceOption.textContent = this.replaceOption.checked ? "-" : "+";
	        dom.setCssClass(this.regExpOption, "checked", this.regExpOption.checked);
	        dom.setCssClass(this.wholeWordOption, "checked", this.wholeWordOption.checked);
	        dom.setCssClass(this.caseSensitiveOption, "checked", this.caseSensitiveOption.checked);
	        this.replaceBox.style.display = this.replaceOption.checked ? "" : "none";
	        this.find(false, false, preventScroll);
	    };

	    this.highlight = function(re) {
	        this.editor.session.highlight(re || this.editor.$search.$options.re);
	        this.editor.renderer.updateBackMarkers();
	    };
	    this.find = function(skipCurrent, backwards, preventScroll) {
	        var range = this.editor.find(this.searchInput.value, {
	            skipCurrent: skipCurrent,
	            backwards: backwards,
	            wrap: true,
	            regExp: this.regExpOption.checked,
	            caseSensitive: this.caseSensitiveOption.checked,
	            wholeWord: this.wholeWordOption.checked,
	            preventScroll: preventScroll,
	            range: this.searchRange
	        });
	        var noMatch = !range && this.searchInput.value;
	        dom.setCssClass(this.searchBox, "ace_nomatch", noMatch);
	        this.editor._emit("findSearchBox", { match: !noMatch });
	        this.highlight();
	        this.updateCounter();
	    };
	    this.updateCounter = function() {
	        var editor = this.editor;
	        var regex = editor.$search.$options.re;
	        var all = 0;
	        var before = 0;
	        if (regex) {
	            var value = this.searchRange
	                ? editor.session.getTextRange(this.searchRange)
	                : editor.getValue();

	            var offset = editor.session.doc.positionToIndex(editor.selection.anchor);
	            if (this.searchRange)
	                offset -= editor.session.doc.positionToIndex(this.searchRange.start);

	            var last = regex.lastIndex = 0;
	            var m;
	            while ((m = regex.exec(value))) {
	                all++;
	                last = m.index;
	                if (last <= offset)
	                    before++;
	                if (all > MAX_COUNT)
	                    break;
	                if (!m[0]) {
	                    regex.lastIndex = last += 1;
	                    if (last >= value.length)
	                        break;
	                }
	            }
	        }
	        this.searchCounter.textContent = before + " of " + (all > MAX_COUNT ? MAX_COUNT + "+" : all);
	    };
	    this.findNext = function() {
	        this.find(true, false);
	    };
	    this.findPrev = function() {
	        this.find(true, true);
	    };
	    this.findAll = function(){
	        var range = this.editor.findAll(this.searchInput.value, {            
	            regExp: this.regExpOption.checked,
	            caseSensitive: this.caseSensitiveOption.checked,
	            wholeWord: this.wholeWordOption.checked
	        });
	        var noMatch = !range && this.searchInput.value;
	        dom.setCssClass(this.searchBox, "ace_nomatch", noMatch);
	        this.editor._emit("findSearchBox", { match: !noMatch });
	        this.highlight();
	        this.hide();
	    };
	    this.replace = function() {
	        if (!this.editor.getReadOnly())
	            this.editor.replace(this.replaceInput.value);
	    };    
	    this.replaceAndFindNext = function() {
	        if (!this.editor.getReadOnly()) {
	            this.editor.replace(this.replaceInput.value);
	            this.findNext();
	        }
	    };
	    this.replaceAll = function() {
	        if (!this.editor.getReadOnly())
	            this.editor.replaceAll(this.replaceInput.value);
	    };

	    this.hide = function() {
	        this.active = false;
	        this.setSearchRange(null);
	        this.editor.off("changeSession", this.setSession);

	        this.element.style.display = "none";
	        this.editor.keyBinding.removeKeyboardHandler(this.$closeSearchBarKb);
	        this.editor.focus();
	    };
	    this.show = function(value, isReplace) {
	        this.active = true;
	        this.editor.on("changeSession", this.setSession);
	        this.element.style.display = "";
	        this.replaceOption.checked = isReplace;

	        if (value)
	            this.searchInput.value = value;
	        
	        this.searchInput.focus();
	        this.searchInput.select();

	        this.editor.keyBinding.addKeyboardHandler(this.$closeSearchBarKb);

	        this.$syncOptions(true);
	    };

	    this.isFocused = function() {
	        var el = document.activeElement;
	        return el == this.searchInput || el == this.replaceInput;
	    };
	}).call(SearchBox.prototype);

	exports.SearchBox = SearchBox;

	exports.Search = function(editor, isReplace) {
	    var sb = editor.searchBox || new SearchBox(editor);
	    sb.show(editor.session.getTextRange(), isReplace);
	};

	});
	                (function() {
	                    ace.acequire(["ace/ext/searchbox"], function() {});
	                })();
	            

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var VanillaPicker;

	if (window.Picker) {
	  // use the already loaded instance of VanillaPicker
	  VanillaPicker = window.Picker;
	}
	else {
	  try {
	    // load color picker
	    // Note that we load the ES5 distribution bundle
	    // instead of the "default" as the default currently
	    // points to `src/picker.js` which is ES6 code (v2.3.0).
	    VanillaPicker = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"vanilla-picker/dist/vanilla-picker\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
	  }
	  catch (err) {
	    // probably running the minimalist bundle
	  }
	}

	module.exports = VanillaPicker;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var VanillaPicker = __webpack_require__(5);
	var Highlighter = __webpack_require__(7);
	var History = __webpack_require__(8);
	var SearchBox = __webpack_require__(9);
	var ContextMenu = __webpack_require__(10);
	var TreePath = __webpack_require__(16);
	var Node = __webpack_require__(17);
	var ModeSwitcher = __webpack_require__(26);
	var util = __webpack_require__(12);
	var autocomplete = __webpack_require__(27);
	var showSortModal = __webpack_require__(22);
	var showTransformModal = __webpack_require__(24);
	var translate = __webpack_require__(15).translate;
	var setLanguages = __webpack_require__(15).setLanguages;
	var setLanguage = __webpack_require__(15).setLanguage;

	var DEFAULT_MODAL_ANCHOR = document.body; // TODO: this constant is defined twice

	// create a mixin with the functions for tree mode
	var treemode = {};

	/**
	 * Create a tree editor
	 * @param {Element} container    Container element
	 * @param {Object}  [options]    Object with options. available options:
	 *                               {String} mode            Editor mode. Available values:
	 *                                                        'tree' (default), 'view',
	 *                                                        and 'form'.
	 *                               {Boolean} search         Enable search box.
	 *                                                        True by default
	 *                               {Boolean} history        Enable history (undo/redo).
	 *                                                        True by default
	 *                               {function} onChange      Callback method, triggered
	 *                                                        on change of contents.
	 *                                                        Does not pass the changed contents.
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
	 *                               {String} name            Field name for the root node.
	 *                               {boolean} escapeUnicode  If true, unicode
	 *                                                        characters are escaped.
	 *                                                        false by default.
	 *                               {Object} schema          A JSON Schema for validation
	 *                               {function} onEvent       Function triggered
	 *                                                        when an event occurs
	 *                                                        in a field or value.
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
	  this.multiselection = {
	    nodes: []
	  };
	  this.validateSchema = null; // will be set in .setSchema(schema)
	  this.validationSequence = 0;
	  this.errorNodes = [];

	  this.node = null;
	  this.focusTarget = null;

	  this._setOptions(options);

	  if (options.autocomplete)
	      this.autocomplete = new autocomplete(options.autocomplete);

	  if (this.options.history && this.options.mode !== 'view') {
	    this.history = new History(this);
	  }

	  this._createFrame();
	  this._createTable();
	};

	/**
	 * Destroy the editor. Clean up DOM, event listeners, and web workers.
	 */
	treemode.destroy = function () {
	  if (this.frame && this.container && this.frame.parentNode == this.container) {
	    this.container.removeChild(this.frame);
	    this.frame = null;
	  }
	  this.container = null;

	  this.dom = null;

	  this.clear();
	  this.node = null;
	  this.focusTarget = null;
	  this.selection = null;
	  this.multiselection = null;
	  this.errorNodes = null;
	  this.validateSchema = null;
	  this._debouncedValidate = null;

	  if (this.history) {
	    this.history.destroy();
	    this.history = null;
	  }

	  if (this.searchBox) {
	    this.searchBox.destroy();
	    this.searchBox = null;
	  }

	  if (this.modeSwitcher) {
	    this.modeSwitcher.destroy();
	    this.modeSwitcher = null;
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
	    name: undefined,   // field name of root node
	    schema: null,
	    schemaRefs: null,
	    autocomplete: null,
	    navigationBar : true,
	    mainMenuBar: true,
	    onSelectionChange: null,
	    colorPicker: true,
	    onColorPicker: function (parent, color, onChange) {
	      if (VanillaPicker) {
	        new VanillaPicker({
	          parent: parent,
	          color: color,
	          popup: 'bottom',
	          onDone: function (color) {
	            var alpha = color.rgba[3];
	            var hex = (alpha === 1)
	                ? color.hex.substr(0, 7)  // return #RRGGBB
	                : color.hex;               // return #RRGGBBAA
	            onChange(hex);
	          }
	        }).show();
	      }
	      else {
	        console.warn('Cannot open color picker: the `vanilla-picker` library is not included in the bundle. ' +
	            'Either use the full bundle or implement your own color picker using `onColorPicker`.')
	      }
	    },
	    timestampTag: true,
	    onEvent: null,
	    enableSort: true,
	    enableTransform: true
	  };

	  // copy all options
	  if (options) {
	    for (var prop in options) {
	      if (options.hasOwnProperty(prop)) {
	        this.options[prop] = options[prop];
	      }
	    }
	  }

	  // compile a JSON schema validator if a JSON schema is provided
	  this.setSchema(this.options.schema, this.options.schemaRefs);

	  // create a debounced validate function
	  this._debouncedValidate = util.debounce(this.validate.bind(this), this.DEBOUNCE_INTERVAL);

	  if (options.onSelectionChange) {
	    this.onSelectionChange(options.onSelectionChange);
	  }

	  setLanguages(this.options.languages);
	  setLanguage(this.options.language)
	};

	/**
	 * Set new JSON object in editor.
	 * Resets the state of the editor (expanded nodes, search, selection).
	 *
	 * @param {*} json
	 */
	treemode.set = function (json) {
	  // verify if json is valid JSON, ignore when a function
	  if (json instanceof Function || (json === undefined)) {
	    this.clear();
	  }
	  else {
	    this.content.removeChild(this.table);  // Take the table offline

	    // replace the root node
	    var params = {
	      field: this.options.name,
	      value: json
	    };
	    var node = new Node(this, params);
	    this._setRoot(node);

	    // validate JSON schema (if configured)
	    this.validate();

	    // expand
	    var recurse = false;
	    this.node.expand(recurse);

	    this.content.appendChild(this.table);  // Put the table online again
	  }

	  // TODO: maintain history, store last state and previous document
	  if (this.history) {
	    this.history.clear();
	  }

	  // clear search
	  if (this.searchBox) {
	    this.searchBox.clear();
	  }
	};

	/**
	 * Update JSON object in editor.
	 * Maintains the state of the editor (expanded nodes, search, selection).
	 *
	 * @param {*} json
	 */
	treemode.update = function (json) {
	  // don't update if there are no changes
	  if (this.node.deepEqual(json)) {
	    return;
	  }

	  var selection = this.getSelection();

	  // apply the changed json
	  this.onChangeDisabled = true; // don't fire an onChange event
	  this.node.update(json);
	  this.onChangeDisabled = false;

	  // validate JSON schema
	  this.validate();

	  // update search result if any
	  if (this.searchBox && !this.searchBox.isEmpty()) {
	    this.searchBox.forceSearch();
	  }

	  // update selection if any
	  if (selection && selection.start && selection.end) {
	    // only keep/update the selection if both start and end node still exists,
	    // else we clear the selection
	    var startNode = this.node.findNodeByPath(selection.start.path);
	    var endNode = this.node.findNodeByPath(selection.end.path);
	    if (startNode && endNode) {
	      this.setSelection(selection.start, selection.end);
	    }
	    else {
	      this.setSelection({}, {}); // clear selection
	    }
	  }
	  else {
	    this.setSelection({}, {}); // clear selection
	  }
	};

	/**
	 * Get JSON object from editor
	 * @return {Object | undefined} json
	 */
	treemode.get = function () {
	  // remove focus from currently edited node
	  if (this.focusTarget) {
	    var node = Node.getNodeFromTarget(this.focusTarget);
	    if (node) {
	      node.blur();
	    }
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
	 * Set the text contents of the editor.
	 * Resets the state of the editor (expanded nodes, search, selection).
	 * @param {String} jsonText
	 */
	treemode.setText = function(jsonText) {
	  try {
	    this.set(util.parse(jsonText)); // this can throw an error
	  }
	  catch (err) {
	    // try to sanitize json, replace JavaScript notation with JSON notation
	    var sanitizedJsonText = util.sanitize(jsonText);

	    // try to parse again
	    this.set(util.parse(sanitizedJsonText)); // this can throw an error
	  }
	};

	/**
	 * Update the text contents of the editor.
	 * Maintains the state of the editor (expanded nodes, search, selection).
	 * @param {String} jsonText
	 */
	treemode.updateText = function(jsonText) {
	  try {
	    this.update(util.parse(jsonText)); // this can throw an error
	  }
	  catch (err) {
	    // try to sanitize json, replace JavaScript notation with JSON notation
	    var sanitizedJsonText = util.sanitize(jsonText);

	    // try to parse again
	    this.update(util.parse(sanitizedJsonText)); // this can throw an error
	  }
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
	  var input = this.scrollableContent.querySelector('[contenteditable=true]');
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
	    this.node.hide();
	    delete this.node;
	  }

	  if (this.treePath) {
	    this.treePath.reset();
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

	  this._onChange();
	};

	/**
	 * Handle a change:
	 * - Validate JSON schema
	 * - Send a callback to the onChange listener if provided
	 * @private
	 */
	treemode._onChange = function () {
	  if (this.onChangeDisabled) {
	    return;
	  }

	  // selection can be changed after undo/redo
	  this.selection = this.getDomSelection();

	  // validate JSON schema (if configured)
	  this._debouncedValidate();

	  if (this.treePath) {
	    var selectedNode = this.selection
	        ?  this.node.findNodeByInternalPath(this.selection.path)
	        : this.multiselection
	            ? this.multiselection.nodes[0]
	            : undefined;

	    if (selectedNode) {
	      this._updateTreePath(selectedNode.getNodePath())
	    }
	    else {
	      this.treePath.reset()
	    }
	  }

	  // trigger the onChange callback
	  if (this.options.onChange) {
	    try {
	      this.options.onChange();
	    }
	    catch (err) {
	      console.error('Error in onChange callback: ', err);
	    }
	  }

	  // trigger the onChangeJSON callback
	  if (this.options.onChangeJSON) {
	    try {
	      this.options.onChangeJSON(this.get());
	    }
	    catch (err) {
	      console.error('Error in onChangeJSON callback: ', err);
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

	  // trigger the onClassName callback
	  if(this.options.onClassName) {
	    this.node.recursivelyUpdateCssClassesOnNodes();
	  }

	  // trigger the onNodeName callback
	  if (this.options.onNodeName && this.node.childs) {
	    try {
	      this.node.recursivelyUpdateNodeName();
	    } catch (err) {
	      console.error("Error in onNodeName callback: ", err);
	    }  
	  }
	};

	/**
	 * Validate current JSON object against the configured JSON schema
	 * Throws an exception when no JSON schema is configured
	 */
	treemode.validate = function () {
	  var root = this.node;
	  if (!root) { // TODO: this should be redundant but is needed on mode switch
	    return;
	  }

	  var json = root.getValue();

	  // check for duplicate keys
	  var duplicateErrors = root.validate();

	  // execute JSON schema validation
	  var schemaErrors = [];
	  if (this.validateSchema) {
	    var valid = this.validateSchema(json);
	    if (!valid) {
	      // apply all new errors
	      schemaErrors = this.validateSchema.errors
	          .map(function (error) {
	            return util.improveSchemaError(error);
	          })
	          .map(function findNode (error) {
	            return {
	              node: root.findNode(error.dataPath),
	              error: error
	            }
	          })
	          .filter(function hasNode (entry) {
	            return entry.node != null
	          });
	    }
	  }

	  // execute custom validation and after than merge and render all errors
	  try {
	    this.validationSequence++;
	    var me = this;
	    var seq = this.validationSequence;
	    this._validateCustom(json)
	        .then(function (customValidationErrors) {
	          // only apply when there was no other validation started whilst resolving async results
	          if (seq === me.validationSequence) {
	            var errorNodes = [].concat(duplicateErrors, schemaErrors, customValidationErrors || []);
	            me._renderValidationErrors(errorNodes);
	          }
	        })
	        .catch(function (err) {
	          console.error(err);
	        });
	  }
	  catch (err) {
	    console.error(err);
	  }
	};

	treemode._renderValidationErrors = function (errorNodes) {
	  // clear all current errors
	  if (this.errorNodes) {
	    this.errorNodes.forEach(function (node) {
	      node.setError(null);
	    });
	  }

	  // render the new errors
	  var parentPairs = errorNodes
	      .reduce(function (all, entry) {
	        return entry.node
	            .findParents()
	            .filter(function (parent) {
	              return !all.some(function (pair) {
	                return pair[0] === parent;
	              });
	            })
	            .map(function (parent) {
	              return [parent, entry.node];
	            })
	            .concat(all);
	      }, []);

	  this.errorNodes = parentPairs
	      .map(function (pair) {
	        return {
	          node: pair[0],
	          child: pair[1],
	          error: {
	            message: pair[0].type === 'object'
	                ? 'Contains invalid properties' // object
	                : 'Contains invalid items'      // array
	          }
	        };
	      })
	      .concat(errorNodes)
	      .map(function setError (entry) {
	        entry.node.setError(entry.error, entry.child);
	        return entry.node;
	      });
	};

	/**
	 * Execute custom validation if configured.
	 *
	 * Returns a promise resolving with the custom errors (or nothing).
	 */
	treemode._validateCustom = function (json) {
	  try {
	    if (this.options.onValidate) {
	      var root = this.node;
	      var customValidateResults = this.options.onValidate(json);

	      var resultPromise = util.isPromise(customValidateResults)
	          ? customValidateResults
	          : Promise.resolve(customValidateResults);

	      return resultPromise.then(function (customValidationPathErrors) {
	        if (Array.isArray(customValidationPathErrors)) {
	          return customValidationPathErrors
	              .filter(function (error) {
	                var valid = util.isValidValidationError(error);

	                if (!valid) {
	                  console.warn('Ignoring a custom validation error with invalid structure. ' +
	                      'Expected structure: {path: [...], message: "..."}. ' +
	                      'Actual error:', error);
	                }

	                return valid;
	              })
	              .map(function (error) {
	                var node;
	                try {
	                  node = (error && error.path) ? root.findNodeByPath(error.path) : null
	                }
	                catch (err) {
	                  // stay silent here, we throw a generic warning if no node is found
	                }
	                if (!node) {
	                  console.warn('Ignoring validation error: node not found. Path:', error.path, 'Error:', error);
	                }

	                return {
	                  node: node,
	                  error: error
	                }
	              })
	              .filter(function (entry) {
	                return entry && entry.node && entry.error && entry.error.message
	              });
	        }
	        else {
	          return null;
	        }
	      });
	    }
	  }
	  catch (err) {
	    return Promise.reject(err);
	  }

	  return Promise.resolve(null);
	};

	/**
	 * Refresh the rendered contents
	 */
	treemode.refresh = function () {
	  if (this.node) {
	    this.node.updateDom({recurse: true});
	  }
	};

	/**
	 * Start autoscrolling when given mouse position is above the top of the
	 * editor contents, or below the bottom.
	 * @param {Number} mouseY  Absolute mouse position in pixels
	 */
	treemode.startAutoScroll = function (mouseY) {
	  var me = this;
	  var content = this.scrollableContent;
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
	 *                            {Node[]} nodes                Nodes in case of multi selection
	 *                            {Number} scrollTop            Scroll position
	 */
	treemode.setDomSelection = function (selection) {
	  if (!selection) {
	    return;
	  }

	  if ('scrollTop' in selection && this.scrollableContent) {
	    // TODO: animated scroll
	    this.scrollableContent.scrollTop = selection.scrollTop;
	  }
	  if (selection.paths) {
	    // multi-select
	    var me = this;
	    var nodes = selection.paths.map(function (path) {
	      return me.node.findNodeByInternalPath(path);
	    });

	    this.select(nodes);
	  }
	  else {
	    // find the actual DOM element where to apply the focus
	    var node = selection.path
	        ? this.node.findNodeByInternalPath(selection.path)
	        : null;
	    var container = (node && selection.domName)
	        ? node.dom[selection.domName]
	        : null;
	    if (selection.range && container) {
	      var range = Object.assign({}, selection.range, { container: container });
	      util.setSelectionOffset(range);
	    }
	    else if (node) { // just a fallback
	      node.focus();
	    }
	  }
	};

	/**
	 * Get the current focus
	 * @return {Object} selection An object containing fields:
	 *                            {Element | undefined} dom     The dom element
	 *                                                          which has focus
	 *                            {Range | TextRange} range     A text selection
	 *                            {Node[]} nodes                Nodes in case of multi selection
	 *                            {Number} scrollTop            Scroll position
	 */
	treemode.getDomSelection = function () {
	  // find the node and field name of the current target,
	  // so we can store the current selection in a serializable
	  // way (internal node path and domName)
	  var node = Node.getNodeFromTarget(this.focusTarget);
	  var focusTarget = this.focusTarget;
	  var domName = node
	      ? Object.keys(node.dom).find(function (domName) {
	        return node.dom[domName] === focusTarget;
	      })
	      : null;

	  var range = util.getSelectionOffset();
	  if (range && range.container.nodeName !== 'DIV') { // filter on (editable) divs)
	    range = null;
	  }
	  if (range && range.container !== focusTarget) {
	    range = null;
	  }
	  if (range) {
	    // we cannot rely on the current instance of the container,
	    // we need to store the internal node path and field and
	    // find the actual DOM field when applying the selection
	    delete range.container;
	  }

	  return {
	    path: node ? node.getInternalPath() : null,
	    domName: domName,
	    range: range,
	    paths: this.multiselection.length > 0
	        ? this.multiselection.nodes.map(function (node) {
	            return node.getInternalPath();
	          })
	        : null,
	    scrollTop: this.scrollableContent ? this.scrollableContent.scrollTop : 0
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
	  var content = this.scrollableContent;
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
	  this.frame.className = 'jsoneditor jsoneditor-mode-' + this.options.mode;
	  this.container.appendChild(this.frame);

	  this.contentOuter = document.createElement('div');
	  this.contentOuter.className = 'jsoneditor-outer';

	  // create one global event listener to handle all events from all nodes
	  var editor = this;
	  function onEvent(event) {
	    // when switching to mode "code" or "text" via the menu, some events
	    // are still fired whilst the _onEvent methods is already removed.
	    if (editor._onEvent) {
	      editor._onEvent(event);
	    }
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

	  if (this.options.mainMenuBar) {
	    util.addClassName(this.contentOuter, 'has-main-menu-bar');

	    // create menu
	    this.menu = document.createElement('div');
	    this.menu.className = 'jsoneditor-menu';
	    this.frame.appendChild(this.menu);

	    // create expand all button
	    var expandAll = document.createElement('button');
	    expandAll.type = 'button';
	    expandAll.className = 'jsoneditor-expand-all';
	    expandAll.title = translate('expandAll');
	    expandAll.onclick = function () {
	      editor.expandAll();
	    };
	    this.menu.appendChild(expandAll);

	    // create collapse all button
	    var collapseAll = document.createElement('button');
	    collapseAll.type = 'button';
	    collapseAll.title = translate('collapseAll');
	    collapseAll.className = 'jsoneditor-collapse-all';
	    collapseAll.onclick = function () {
	      editor.collapseAll();
	    };
	    this.menu.appendChild(collapseAll);

	    // create sort button
	    if (this.options.enableSort) {
	      var sort = document.createElement('button');
	      sort.type = 'button';
	      sort.className = 'jsoneditor-sort';
	      sort.title = translate('sortTitleShort');
	      sort.onclick = function () {
	        var anchor = editor.options.modalAnchor || DEFAULT_MODAL_ANCHOR;
	        showSortModal(editor.node, anchor)
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
	        var anchor = editor.options.modalAnchor || DEFAULT_MODAL_ANCHOR;
	        showTransformModal(editor.node, anchor)
	      };
	      this.menu.appendChild(transform);
	    }

	    // create undo/redo buttons
	    if (this.history) {
	      // create undo button
	      var undo = document.createElement('button');
	      undo.type = 'button';
	      undo.className = 'jsoneditor-undo jsoneditor-separator';
	      undo.title = translate('undo');
	      undo.onclick = function () {
	        editor._onUndo();
	      };
	      this.menu.appendChild(undo);
	      this.dom.undo = undo;

	      // create redo button
	      var redo = document.createElement('button');
	      redo.type = 'button';
	      redo.className = 'jsoneditor-redo';
	      redo.title = translate('redo');
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
	      var me = this;
	      this.modeSwitcher = new ModeSwitcher(this.menu, this.options.modes, this.options.mode, function onSwitch(mode) {
	        // switch mode and restore focus
	        me.setMode(mode);
	        me.modeSwitcher.focus();
	      });
	    }

	    // create search box
	    if (this.options.search) {
	      this.searchBox = new SearchBox(this, this.menu);
	    }
	  }

	  if (this.options.navigationBar) {
	    // create second menu row for treepath
	    this.navBar = document.createElement('div');
	    this.navBar.className = 'jsoneditor-navigation-bar nav-bar-empty';
	    this.frame.appendChild(this.navBar);

	    this.treePath = new TreePath(this.navBar, this.frame);
	    this.treePath.onSectionSelected(this._onTreePathSectionSelected.bind(this));
	    this.treePath.onContextMenuItemSelected(this._onTreePathMenuItemSelected.bind(this));
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

	    // fire change event
	    this._onChange();
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

	    // fire change event
	    this._onChange();
	  }
	};

	/**
	 * Event handler
	 * @param event
	 * @private
	 */
	treemode._onEvent = function (event) {
	  // don't process events when coming from the color picker
	  if (Node.targetIsColorPicker(event.target)) {
	    return;
	  }

	  if (event.type === 'keydown') {
	    this._onKeyDown(event);
	  }

	  if (event.type === 'focus') {
	    this.focusTarget = event.target;
	  }

	  if (event.type === 'mousedown') {
	    this._startDragDistance(event);
	  }
	  if (event.type === 'mousemove' || event.type === 'mouseup' || event.type === 'click') {
	    this._updateDragDistance(event);
	  }

	  var node = Node.getNodeFromTarget(event.target);

	  if (node && this.options && this.options.navigationBar && node && (event.type === 'keydown' || event.type === 'mousedown')) {
	    // apply on next tick, right after the new key press is applied
	    var me = this;
	    setTimeout(function () {
	      me._updateTreePath(node.getNodePath());
	    })
	  }

	  if (node && node.selected) {
	    if (event.type === 'click') {
	      if (event.target === node.dom.menu) {
	        this.showContextMenu(event.target);

	        // stop propagation (else we will open the context menu of a single node)
	        return;
	      }

	      // deselect a multi selection
	      if (!event.hasMoved) {
	        this.deselect();
	      }
	    }

	    if (event.type === 'mousedown') {
	      // drag multiple nodes
	      Node.onDragStart(this.multiselection.nodes, event);
	    }
	  }
	  else {
	    // filter mouse events in the contents part of the editor (not the main menu)
	    if (event.type === 'mousedown' && util.hasParentNode(event.target, this.content)) {
	      this.deselect();

	      if (node && event.target === node.dom.drag) {
	        // drag a singe node
	        Node.onDragStart(node, event);
	      }
	      else if (!node || (event.target !== node.dom.field && event.target !== node.dom.value && event.target !== node.dom.select)) {
	        // select multiple nodes
	        this._onMultiSelectStart(event);
	      }
	    }
	  }

	  if (node) {
	    node.onEvent(event);
	  }
	};

	/**
	 * Update TreePath components
	 * @param {Array<Node>} pathNodes list of nodes in path from root to selection
	 * @private
	 */
	treemode._updateTreePath = function (pathNodes) {
	  if (pathNodes && pathNodes.length) {
	    util.removeClassName(this.navBar, 'nav-bar-empty');

	    var pathObjs = [];
	    pathNodes.forEach(function (node) {
	      var pathObj = {
	        name: getName(node),
	        node: node,
	        children: []
	      };
	      if (node.childs && node.childs.length) {
	        node.childs.forEach(function (childNode) {
	          pathObj.children.push({
	            name: getName(childNode),
	            node: childNode
	          });
	        });
	      }
	      pathObjs.push(pathObj);
	    });
	    this.treePath.setPath(pathObjs);
	  } else {
	    util.addClassName(this.navBar, 'nav-bar-empty');
	  }

	  function getName(node) {
	    return node.parent
	        ? ((node.parent.type === 'array') ? node.index : node.field)
	        : node.type;
	  }
	};

	/**
	 * Callback for tree path section selection - focus the selected node in the tree
	 * @param {Object} pathObj path object that was represents the selected section node
	 * @private
	 */
	treemode._onTreePathSectionSelected = function (pathObj) {
	  if(pathObj && pathObj.node) {
	    pathObj.node.expandTo();
	    pathObj.node.focus();
	  }
	};

	/**
	 * Callback for tree path menu item selection - rebuild the path accrding to the new selection and focus the selected node in the tree
	 * @param {Object} pathObj path object that was represents the parent section node
	 * @param {String} selection selected section child
	 * @private
	 */
	treemode._onTreePathMenuItemSelected = function (pathObj, selection) {
	  if(pathObj && pathObj.children.length) {
	    var selectionObj = pathObj.children.find(function (obj) {
	      return obj.name === selection;
	    });
	    if(selectionObj && selectionObj.node) {
	      this._updateTreePath(selectionObj.node.getNodePath());
	      selectionObj.node.expandTo();
	      selectionObj.node.focus();
	    }
	  }
	};

	treemode._startDragDistance = function (event) {
	  this.dragDistanceEvent = {
	    initialTarget: event.target,
	    initialPageX: event.pageX,
	    initialPageY: event.pageY,
	    dragDistance: 0,
	    hasMoved: false
	  };
	};

	treemode._updateDragDistance = function (event) {
	  if (!this.dragDistanceEvent) {
	    this._startDragDistance(event);
	  }

	  var diffX = event.pageX - this.dragDistanceEvent.initialPageX;
	  var diffY = event.pageY - this.dragDistanceEvent.initialPageY;

	  this.dragDistanceEvent.dragDistance = Math.sqrt(diffX * diffX + diffY * diffY);
	  this.dragDistanceEvent.hasMoved =
	      this.dragDistanceEvent.hasMoved || this.dragDistanceEvent.dragDistance > 10;

	  event.dragDistance = this.dragDistanceEvent.dragDistance;
	  event.hasMoved = this.dragDistanceEvent.hasMoved;

	  return event.dragDistance;
	};

	/**
	 * Start multi selection of nodes by dragging the mouse
	 * @param event
	 * @private
	 */
	treemode._onMultiSelectStart = function (event) {
	  var node = Node.getNodeFromTarget(event.target);

	  if (this.options.mode !== 'tree' || this.options.onEditable !== undefined) {
	    // dragging not allowed in modes 'view' and 'form'
	    // TODO: allow multiselection of items when option onEditable is specified
	    return;
	  }

	  this.multiselection = {
	    start: node || null,
	    end: null,
	    nodes: []
	  };

	  this._startDragDistance(event);

	  var editor = this;
	  if (!this.mousemove) {
	    this.mousemove = util.addEventListener(window, 'mousemove', function (event) {
	      editor._onMultiSelect(event);
	    });
	  }
	  if (!this.mouseup) {
	    this.mouseup = util.addEventListener(window, 'mouseup', function (event ) {
	      editor._onMultiSelectEnd(event);
	    });
	  }

	  event.preventDefault();
	};

	/**
	 * Multiselect nodes by dragging
	 * @param event
	 * @private
	 */
	treemode._onMultiSelect = function (event) {
	  event.preventDefault();

	  this._updateDragDistance(event);
	  if (!event.hasMoved) {
	    return;
	  }

	  var node = Node.getNodeFromTarget(event.target);

	  if (node) {
	    if (this.multiselection.start == null) {
	      this.multiselection.start = node;
	    }
	    this.multiselection.end = node;
	  }

	  // deselect previous selection
	  this.deselect();

	  // find the selected nodes in the range from first to last
	  var start = this.multiselection.start;
	  var end = this.multiselection.end || this.multiselection.start;
	  if (start && end) {
	    // find the top level childs, all having the same parent
	    this.multiselection.nodes = this._findTopLevelNodes(start, end);
	    if (this.multiselection.nodes && this.multiselection.nodes.length) {
	      var firstNode = this.multiselection.nodes[0];
	      if (this.multiselection.start === firstNode || this.multiselection.start.isDescendantOf(firstNode)) {
	        this.multiselection.direction = 'down';
	      } else {
	        this.multiselection.direction = 'up';
	      }
	    }
	    this.select(this.multiselection.nodes);
	  }
	};

	/**
	 * End of multiselect nodes by dragging
	 * @private
	 */
	treemode._onMultiSelectEnd = function () {
	  // set focus to the context menu button of the first node
	  if (this.multiselection.nodes[0]) {
	    this.multiselection.nodes[0].dom.menu.focus();
	  }

	  this.multiselection.start = null;
	  this.multiselection.end = null;

	  // cleanup global event listeners
	  if (this.mousemove) {
	    util.removeEventListener(window, 'mousemove', this.mousemove);
	    delete this.mousemove;
	  }
	  if (this.mouseup) {
	    util.removeEventListener(window, 'mouseup', this.mouseup);
	    delete this.mouseup;
	  }
	};

	/**
	 * deselect currently selected nodes
	 * @param {boolean} [clearStartAndEnd=false]  If true, the `start` and `end`
	 *                                            state is cleared too.
	 */
	treemode.deselect = function (clearStartAndEnd) {
	  var selectionChanged = !!this.multiselection.nodes.length;
	  this.multiselection.nodes.forEach(function (node) {
	    node.setSelected(false);
	  });
	  this.multiselection.nodes = [];

	  if (clearStartAndEnd) {
	    this.multiselection.start = null;
	    this.multiselection.end = null;
	  }

	  if (selectionChanged) {
	    if (this._selectionChangedHandler) {
	      this._selectionChangedHandler();
	    }
	  }
	};

	/**
	 * select nodes
	 * @param {Node[] | Node} nodes
	 */
	treemode.select = function (nodes) {
	  if (!Array.isArray(nodes)) {
	    return this.select([nodes]);
	  }

	  if (nodes) {
	    this.deselect();

	    this.multiselection.nodes = nodes.slice(0);

	    var first = nodes[0];
	    nodes.forEach(function (node) {
	      node.expandPathToNode();
	      node.setSelected(true, node === first);
	    });

	    if (this._selectionChangedHandler) {
	      var selection = this.getSelection();
	      this._selectionChangedHandler(selection.start, selection.end);
	    }
	  }
	};

	/**
	 * From two arbitrary selected nodes, find their shared parent node.
	 * From that parent node, select the two child nodes in the brances going to
	 * nodes `start` and `end`, and select all childs in between.
	 * @param {Node} start
	 * @param {Node} end
	 * @return {Array.<Node>} Returns an ordered list with child nodes
	 * @private
	 */
	treemode._findTopLevelNodes = function (start, end) {
	  var startPath = start.getNodePath();
	  var endPath = end.getNodePath();
	  var i = 0;
	  while (i < startPath.length && startPath[i] === endPath[i]) {
	    i++;
	  }
	  var root = startPath[i - 1];
	  var startChild = startPath[i];
	  var endChild = endPath[i];

	  if (!startChild || !endChild) {
	    if (root.parent) {
	      // startChild is a parent of endChild or vice versa
	      startChild = root;
	      endChild = root;
	      root = root.parent
	    }
	    else {
	      // we have selected the root node (which doesn't have a parent)
	      startChild = root.childs[0];
	      endChild = root.childs[root.childs.length - 1];
	    }
	  }

	  if (root && startChild && endChild) {
	    var startIndex = root.childs.indexOf(startChild);
	    var endIndex = root.childs.indexOf(endChild);
	    var firstIndex = Math.min(startIndex, endIndex);
	    var lastIndex = Math.max(startIndex, endIndex);

	    return root.childs.slice(firstIndex, lastIndex + 1);
	  }
	  else {
	    return [];
	  }
	};

	/**
	 * Event handler for keydown. Handles shortcut keys
	 * @param {Event} event
	 * @private
	 */
	treemode._onKeyDown = function (event) {
	  var keynum = event.which || event.keyCode;
	  var altKey = event.altKey;
	  var ctrlKey = event.ctrlKey;
	  var metaKey = event.metaKey;
	  var shiftKey = event.shiftKey;
	  var handled = false;

	  if (keynum == 9) { // Tab or Shift+Tab
	    var me = this;
	    setTimeout(function () {
	      // select all text when moving focus to an editable div
	      util.selectContentEditable(me.focusTarget);
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

	  if ((this.options.autocomplete) && (!handled)) {
	      if (!ctrlKey && !altKey && !metaKey && (event.key.length == 1 || keynum == 8 || keynum == 46)) {
	          handled = false;
	          var jsonElementType = "";
	          if (event.target.className.indexOf("jsoneditor-value") >= 0) jsonElementType = "value";
	          if (event.target.className.indexOf("jsoneditor-field") >= 0) jsonElementType = "field";

	          var node = Node.getNodeFromTarget(event.target);
	          // Activate autocomplete
	          setTimeout(function (hnode, element) {
	              if (element.innerText.length > 0) {
	                  var result = this.options.autocomplete.getOptions(element.innerText, hnode.getPath(), jsonElementType, hnode.editor);
	                  if (result === null) {
	                      this.autocomplete.hideDropDown();
	                  } else if (typeof result.then === 'function') {
	                      // probably a promise
	                      if (result.then(function (obj) {
	                          if (obj === null) {
	                              this.autocomplete.hideDropDown();
	                          } else if (obj.options) {
	                              this.autocomplete.show(element, obj.startFrom, obj.options);
	                          } else {
	                              this.autocomplete.show(element, 0, obj);
	                          }
	                      }.bind(this)));
	                  } else {
	                      // definitely not a promise
	                      if (result.options)
	                          this.autocomplete.show(element, result.startFrom, result.options);
	                      else
	                          this.autocomplete.show(element, 0, result);
	                  }
	              }
	              else
	                  this.autocomplete.hideDropDown();

	          }.bind(this, node, event.target), 50);
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
	  if (this.options.navigationBar) {
	    util.addClassName(this.contentOuter, 'has-nav-bar');
	  }

	  this.scrollableContent = document.createElement('div');
	  this.scrollableContent.className = 'jsoneditor-tree';
	  this.contentOuter.appendChild(this.scrollableContent);

	  // the jsoneditor-tree-inner div with bottom padding is here to
	  // keep space for the action menu dropdown. It's created as a
	  // separate div instead of using scrollableContent to work around
	  // and issue in the Chrome browser showing scrollable contents outside of the div
	  // see https://github.com/josdejong/jsoneditor/issues/557
	  this.content = document.createElement('div');
	  this.content.className = 'jsoneditor-tree-inner';
	  this.scrollableContent.appendChild(this.content);

	  this.table = document.createElement('table');
	  this.table.className = 'jsoneditor-tree';
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

	  this.frame.appendChild(this.contentOuter);
	};

	/**
	 * Show a contextmenu for this node.
	 * Used for multiselection
	 * @param {HTMLElement} anchor   Anchor element to attach the context menu to.
	 * @param {function} [onClose]   Callback method called when the context menu
	 *                               is being closed.
	 */
	treemode.showContextMenu = function (anchor, onClose) {
	  var items = [];
	  var selectedNodes = this.multiselection.nodes.slice();

	  // create duplicate button
	  items.push({
	    text: translate('duplicateText'),
	    title: translate('duplicateTitle'),
	    className: 'jsoneditor-duplicate',
	    click: function () {
	      Node.onDuplicate(selectedNodes );
	    }
	  });

	  // create remove button
	  items.push({
	    text: translate('remove'),
	    title: translate('removeTitle'),
	    className: 'jsoneditor-remove',
	    click: function () {
	      Node.onRemove(selectedNodes);
	    }
	  });

	  var menu = new ContextMenu(items, {close: onClose});
	  menu.show(anchor, this.frame);
	};

	/**
	 * Get current selected nodes
	 * @return {{start:SerializableNode, end: SerializableNode}}
	 */
	treemode.getSelection = function () {
	  var selection = {
	    start: null,
	    end: null
	  };
	  if (this.multiselection.nodes && this.multiselection.nodes.length) {
	    if (this.multiselection.nodes.length) {
	      var selection1 = this.multiselection.nodes[0];
	      var selection2 = this.multiselection.nodes[this.multiselection.nodes.length - 1];
	      if (this.multiselection.direction === 'down') {
	        selection.start = selection1.serialize();
	        selection.end = selection2.serialize();
	      } else {
	        selection.start = selection2.serialize();
	        selection.end = selection1.serialize();
	      }
	    }
	  }
	  return selection;
	};

	/**
	 * Callback registration for selection change
	 * @param {selectionCallback} callback
	 *
	 * @callback selectionCallback
	 */
	treemode.onSelectionChange = function (callback) {
	  if (typeof callback === 'function') {
	    this._selectionChangedHandler = util.debounce(callback, this.DEBOUNCE_INTERVAL);
	  }
	};

	/**
	 * Select range of nodes.
	 * For selecting single node send only the start parameter
	 * For clear the selection do not send any parameter
	 * If the nodes are not from the same level the first common parent will be selected
	 * @param {{path: Array.<String>}} start object contains the path for selection start
	 * @param {{path: Array.<String>}} end object contains the path for selection end
	 */
	treemode.setSelection = function (start, end) {
	  // check for old usage
	  if (start && start.dom && start.range) {
	    console.warn('setSelection/getSelection usage for text selection is deprecated and should not be used, see documentation for supported selection options');
	    this.setDomSelection(start);
	  }

	  var nodes = this._getNodeInstancesByRange(start, end);

	  nodes.forEach(function(node) {
	    node.expandTo();
	  });
	  this.select(nodes);
	};

	/**
	 * Returns a set of Nodes according to a range of selection
	 * @param {{path: Array.<String>}} start object contains the path for range start
	 * @param {{path: Array.<String>}=} end object contains the path for range end
	 * @return {Array.<Node>} Node instances on the given range
	 * @private
	 */
	treemode._getNodeInstancesByRange = function (start, end) {
	  var startNode, endNode;

	  if (start && start.path) {
	    startNode = this.node.findNodeByPath(start.path);
	    if (end && end.path) {
	      endNode = this.node.findNodeByPath(end.path);
	    }
	  }

	  var nodes = [];
	  if (startNode instanceof Node) {
	    if (endNode instanceof Node && endNode !== startNode) {
	      if (startNode.parent === endNode.parent) {
	        var start, end;
	        if (startNode.getIndex() < endNode.getIndex()) {
	          start = startNode;
	          end = endNode;
	        } else {
	          start = endNode;
	          end = startNode;
	        }
	        var current = start;
	        nodes.push(current);
	        do {
	          current = current.nextSibling();
	          nodes.push(current);
	        } while (current && current !== end);
	      } else {
	        nodes = this._findTopLevelNodes(startNode, endNode);
	      }
	    } else {
	      nodes.push(startNode);
	    }
	  }

	  return nodes;

	};

	treemode.getNodesByRange = function (start, end) {
	  var nodes = this._getNodeInstancesByRange(start, end);
	  var serializableNodes = [];

	  nodes.forEach(function (node){
	    serializableNodes.push(node.serialize());
	  });

	  return serializableNodes;
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


/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * The highlighter can highlight/unhighlight a node, and
	 * animate the visibility of a context menu.
	 * @constructor Highlighter
	 */
	function Highlighter () {
	  this.locked = false;
	}

	/**
	 * Hightlight given node and its childs
	 * @param {Node} node
	 */
	Highlighter.prototype.highlight = function (node) {
	  if (this.locked) {
	    return;
	  }

	  if (this.node != node) {
	    // unhighlight current node
	    if (this.node) {
	      this.node.setHighlight(false);
	    }

	    // highlight new node
	    this.node = node;
	    this.node.setHighlight(true);
	  }

	  // cancel any current timeout
	  this._cancelUnhighlight();
	};

	/**
	 * Unhighlight currently highlighted node.
	 * Will be done after a delay
	 */
	Highlighter.prototype.unhighlight = function () {
	  if (this.locked) {
	    return;
	  }

	  var me = this;
	  if (this.node) {
	    this._cancelUnhighlight();

	    // do the unhighlighting after a small delay, to prevent re-highlighting
	    // the same node when moving from the drag-icon to the contextmenu-icon
	    // or vice versa.
	    this.unhighlightTimer = setTimeout(function () {
	      me.node.setHighlight(false);
	      me.node = undefined;
	      me.unhighlightTimer = undefined;
	    }, 0);
	  }
	};

	/**
	 * Cancel an unhighlight action (if before the timeout of the unhighlight action)
	 * @private
	 */
	Highlighter.prototype._cancelUnhighlight = function () {
	  if (this.unhighlightTimer) {
	    clearTimeout(this.unhighlightTimer);
	    this.unhighlightTimer = undefined;
	  }
	};

	/**
	 * Lock highlighting or unhighlighting nodes.
	 * methods highlight and unhighlight do not work while locked.
	 */
	Highlighter.prototype.lock = function () {
	  this.locked = true;
	};

	/**
	 * Unlock highlighting or unhighlighting nodes
	 */
	Highlighter.prototype.unlock = function () {
	  this.locked = false;
	};

	module.exports = Highlighter;


/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * @constructor History
	 * Store action history, enables undo and redo
	 * @param {JSONEditor} editor
	 */
	function History (editor) {
	  this.editor = editor;
	  this.history = [];
	  this.index = -1;

	  this.clear();

	  // helper function to find a Node from a path
	  function findNode(path) {
	    return editor.node.findNodeByInternalPath(path)
	  }

	  // map with all supported actions
	  this.actions = {
	    'editField': {
	      'undo': function (params) {
	        var parentNode = findNode(params.parentPath);
	        var node = parentNode.childs[params.index];
	        node.updateField(params.oldValue);
	      },
	      'redo': function (params) {
	        var parentNode = findNode(params.parentPath);
	        var node = parentNode.childs[params.index];
	        node.updateField(params.newValue);
	      }
	    },
	    'editValue': {
	      'undo': function (params) {
	        findNode(params.path).updateValue(params.oldValue);
	      },
	      'redo': function (params) {
	        findNode(params.path).updateValue(params.newValue);
	      }
	    },
	    'changeType': {
	      'undo': function (params) {
	        findNode(params.path).changeType(params.oldType);
	      },
	      'redo': function (params) {
	        findNode(params.path).changeType(params.newType);
	      }
	    },

	    'appendNodes': {
	      'undo': function (params) {
	        var parentNode = findNode(params.parentPath);
	        params.paths.map(findNode).forEach(function (node) {
	          parentNode.removeChild(node);
	        });
	       },
	      'redo': function (params) {
	        var parentNode = findNode(params.parentPath);
	        params.nodes.forEach(function (node) {
	          parentNode.appendChild(node);
	        });
	      }
	    },
	    'insertBeforeNodes': {
	      'undo': function (params) {
	        var parentNode = findNode(params.parentPath);
	        params.paths.map(findNode).forEach(function (node) {
	          parentNode.removeChild(node);
	        });
	      },
	      'redo': function (params) {
	        var parentNode = findNode(params.parentPath);
	        var beforeNode = findNode(params.beforePath);
	        params.nodes.forEach(function (node) {
	          parentNode.insertBefore(node, beforeNode);
	        });
	      }
	    },
	    'insertAfterNodes': {
	      'undo': function (params) {
	        var parentNode = findNode(params.parentPath);
	        params.paths.map(findNode).forEach(function (node) {
	          parentNode.removeChild(node);
	        });
	      },
	      'redo': function (params) {
	        var parentNode = findNode(params.parentPath);
	        var afterNode = findNode(params.afterPath);
	        params.nodes.forEach(function (node) {
	          parentNode.insertAfter(node, afterNode);
	          afterNode = node;
	        });
	      }
	    },
	    'removeNodes': {
	      'undo': function (params) {
	        var parentNode = findNode(params.parentPath);
	        var beforeNode = parentNode.childs[params.index] || parentNode.append;
	        params.nodes.forEach(function (node) {
	          parentNode.insertBefore(node, beforeNode);
	        });
	      },
	      'redo': function (params) {
	        var parentNode = findNode(params.parentPath);
	        params.paths.map(findNode).forEach(function (node) {
	          parentNode.removeChild(node);
	        });
	      }
	    },
	    'duplicateNodes': {
	      'undo': function (params) {
	        var parentNode = findNode(params.parentPath);
	        params.clonePaths.map(findNode).forEach(function (node) {
	          parentNode.removeChild(node);
	        });
	      },
	      'redo': function (params) {
	        var parentNode = findNode(params.parentPath);
	        var afterNode = findNode(params.afterPath);
	        var nodes = params.paths.map(findNode);
	        nodes.forEach(function (node) {
	          var clone = node.clone();
	          parentNode.insertAfter(clone, afterNode);
	          afterNode = clone;
	        });
	      }
	    },
	    'moveNodes': {
	      'undo': function (params) {
	        var oldParentNode = findNode(params.oldParentPath);
	        var newParentNode = findNode(params.newParentPath);
	        var oldBeforeNode = oldParentNode.childs[params.oldIndex] || oldParentNode.append;

	        // first copy the nodes, then move them
	        var nodes = newParentNode.childs.slice(params.newIndex, params.newIndex + params.count);

	        nodes.forEach(function (node, index) {
	          node.field = params.fieldNames[index];
	          oldParentNode.moveBefore(node, oldBeforeNode);
	        });

	        // This is a hack to work around an issue that we don't know tha original
	        // path of the new parent after dragging, as the node is already moved at that time.
	        if (params.newParentPathRedo === null) {
	          params.newParentPathRedo = newParentNode.getInternalPath();
	        }
	      },
	      'redo': function (params) {
	        var oldParentNode = findNode(params.oldParentPathRedo);
	        var newParentNode = findNode(params.newParentPathRedo);
	        var newBeforeNode = newParentNode.childs[params.newIndexRedo] || newParentNode.append;

	        // first copy the nodes, then move them
	        var nodes = oldParentNode.childs.slice(params.oldIndexRedo, params.oldIndexRedo + params.count);

	        nodes.forEach(function (node, index) {
	          node.field = params.fieldNames[index];
	          newParentNode.moveBefore(node, newBeforeNode);
	        });
	      }
	    },

	    'sort': {
	      'undo': function (params) {
	        var node = findNode(params.path);
	        node.hideChilds();
	        node.childs = params.oldChilds;
	        node.updateDom({updateIndexes: true});
	        node.showChilds();
	      },
	      'redo': function (params) {
	        var node = findNode(params.path);
	        node.hideChilds();
	        node.childs = params.newChilds;
	        node.updateDom({updateIndexes: true});
	        node.showChilds();
	      }
	    },

	    'transform': {
	      'undo': function (params) {
	        findNode(params.path).setInternalValue(params.oldValue);

	        // TODO: would be nice to restore the state of the node and childs
	      },
	      'redo': function (params) {
	        findNode(params.path).setInternalValue(params.newValue);

	        // TODO: would be nice to restore the state of the node and childs
	      }
	    }

	    // TODO: restore the original caret position and selection with each undo
	    // TODO: implement history for actions "expand", "collapse", "scroll", "setDocument"
	  };
	}

	/**
	 * The method onChange is executed when the History is changed, and can
	 * be overloaded.
	 */
	History.prototype.onChange = function () {};

	/**
	 * Add a new action to the history
	 * @param {String} action  The executed action. Available actions: "editField",
	 *                         "editValue", "changeType", "appendNode",
	 *                         "removeNode", "duplicateNode", "moveNode"
	 * @param {Object} params  Object containing parameters describing the change.
	 *                         The parameters in params depend on the action (for
	 *                         example for "editValue" the Node, old value, and new
	 *                         value are provided). params contains all information
	 *                         needed to undo or redo the action.
	 */
	History.prototype.add = function (action, params) {
	  this.index++;
	  this.history[this.index] = {
	    'action': action,
	    'params': params,
	    'timestamp': new Date()
	  };

	  // remove redo actions which are invalid now
	  if (this.index < this.history.length - 1) {
	    this.history.splice(this.index + 1, this.history.length - this.index - 1);
	  }

	  // fire onchange event
	  this.onChange();
	};

	/**
	 * Clear history
	 */
	History.prototype.clear = function () {
	  this.history = [];
	  this.index = -1;

	  // fire onchange event
	  this.onChange();
	};

	/**
	 * Check if there is an action available for undo
	 * @return {Boolean} canUndo
	 */
	History.prototype.canUndo = function () {
	  return (this.index >= 0);
	};

	/**
	 * Check if there is an action available for redo
	 * @return {Boolean} canRedo
	 */
	History.prototype.canRedo = function () {
	  return (this.index < this.history.length - 1);
	};

	/**
	 * Undo the last action
	 */
	History.prototype.undo = function () {
	  if (this.canUndo()) {
	    var obj = this.history[this.index];
	    if (obj) {
	      var action = this.actions[obj.action];
	      if (action && action.undo) {
	        action.undo(obj.params);
	        if (obj.params.oldSelection) {
	          try {
	            this.editor.setDomSelection(obj.params.oldSelection);
	          }
	          catch (err) {
	            console.error(err);
	          }
	        }
	      }
	      else {
	        console.error(new Error('unknown action "' + obj.action + '"'));
	      }
	    }
	    this.index--;

	    // fire onchange event
	    this.onChange();
	  }
	};

	/**
	 * Redo the last action
	 */
	History.prototype.redo = function () {
	  if (this.canRedo()) {
	    this.index++;

	    var obj = this.history[this.index];
	    if (obj) {
	      var action = this.actions[obj.action];
	      if (action && action.redo) {
	        action.redo(obj.params);
	        if (obj.params.newSelection) {
	          try {
	            this.editor.setDomSelection(obj.params.newSelection);
	          }
	          catch (err) {
	            console.error(err);
	          }
	        }
	      }
	      else {
	        console.error(new Error('unknown action "' + obj.action + '"'));
	      }
	    }

	    // fire onchange event
	    this.onChange();
	  }
	};

	/**
	 * Destroy history
	 */
	History.prototype.destroy = function () {
	  this.editor = null;

	  this.history = [];
	  this.index = -1;
	};

	module.exports = History;


/***/ },
/* 9 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * @constructor SearchBox
	 * Create a search box in given HTML container
	 * @param {JSONEditor} editor    The JSON Editor to attach to
	 * @param {Element} container               HTML container element of where to
	 *                                          create the search box
	 */
	function SearchBox (editor, container) {
	  var searchBox = this;

	  this.editor = editor;
	  this.timeout = undefined;
	  this.delay = 200; // ms
	  this.lastText = undefined;

	  this.dom = {};
	  this.dom.container = container;

	  var table = document.createElement('table');
	  this.dom.table = table;
	  table.className = 'jsoneditor-search';
	  container.appendChild(table);
	  var tbody = document.createElement('tbody');
	  this.dom.tbody = tbody;
	  table.appendChild(tbody);
	  var tr = document.createElement('tr');
	  tbody.appendChild(tr);

	  var td = document.createElement('td');
	  tr.appendChild(td);
	  var results = document.createElement('div');
	  this.dom.results = results;
	  results.className = 'jsoneditor-results';
	  td.appendChild(results);

	  td = document.createElement('td');
	  tr.appendChild(td);
	  var divInput = document.createElement('div');
	  this.dom.input = divInput;
	  divInput.className = 'jsoneditor-frame';
	  divInput.title = 'Search fields and values';
	  td.appendChild(divInput);

	  // table to contain the text input and search button
	  var tableInput = document.createElement('table');
	  divInput.appendChild(tableInput);
	  var tbodySearch = document.createElement('tbody');
	  tableInput.appendChild(tbodySearch);
	  tr = document.createElement('tr');
	  tbodySearch.appendChild(tr);

	  var refreshSearch = document.createElement('button');
	  refreshSearch.type = 'button';
	  refreshSearch.className = 'jsoneditor-refresh';
	  td = document.createElement('td');
	  td.appendChild(refreshSearch);
	  tr.appendChild(td);

	  var search = document.createElement('input');
	  // search.type = 'button';
	  this.dom.search = search;
	  search.oninput = function (event) {
	    searchBox._onDelayedSearch(event);
	  };
	  search.onchange = function (event) { // For IE 9
	    searchBox._onSearch();
	  };
	  search.onkeydown = function (event) {
	    searchBox._onKeyDown(event);
	  };
	  search.onkeyup = function (event) {
	    searchBox._onKeyUp(event);
	  };
	  refreshSearch.onclick = function (event) {
	    search.select();
	  };

	  // TODO: ESC in FF restores the last input, is a FF bug, https://bugzilla.mozilla.org/show_bug.cgi?id=598819
	  td = document.createElement('td');
	  td.appendChild(search);
	  tr.appendChild(td);

	  var searchNext = document.createElement('button');
	  searchNext.type = 'button';
	  searchNext.title = 'Next result (Enter)';
	  searchNext.className = 'jsoneditor-next';
	  searchNext.onclick = function () {
	    searchBox.next();
	  };
	  td = document.createElement('td');
	  td.appendChild(searchNext);
	  tr.appendChild(td);

	  var searchPrevious = document.createElement('button');
	  searchPrevious.type = 'button';
	  searchPrevious.title = 'Previous result (Shift+Enter)';
	  searchPrevious.className = 'jsoneditor-previous';
	  searchPrevious.onclick = function () {
	    searchBox.previous();
	  };
	  td = document.createElement('td');
	  td.appendChild(searchPrevious);
	  tr.appendChild(td);
	}

	/**
	 * Go to the next search result
	 * @param {boolean} [focus]   If true, focus will be set to the next result
	 *                            focus is false by default.
	 */
	SearchBox.prototype.next = function(focus) {
	  if (this.results != undefined) {
	    var index = (this.resultIndex != undefined) ? this.resultIndex + 1 : 0;
	    if (index > this.results.length - 1) {
	      index = 0;
	    }
	    this._setActiveResult(index, focus);
	  }
	};

	/**
	 * Go to the prevous search result
	 * @param {boolean} [focus]   If true, focus will be set to the next result
	 *                            focus is false by default.
	 */
	SearchBox.prototype.previous = function(focus) {
	  if (this.results != undefined) {
	    var max = this.results.length - 1;
	    var index = (this.resultIndex != undefined) ? this.resultIndex - 1 : max;
	    if (index < 0) {
	      index = max;
	    }
	    this._setActiveResult(index, focus);
	  }
	};

	/**
	 * Set new value for the current active result
	 * @param {Number} index
	 * @param {boolean} [focus]   If true, focus will be set to the next result.
	 *                            focus is false by default.
	 * @private
	 */
	SearchBox.prototype._setActiveResult = function(index, focus) {
	  // de-activate current active result
	  if (this.activeResult) {
	    var prevNode = this.activeResult.node;
	    var prevElem = this.activeResult.elem;
	    if (prevElem == 'field') {
	      delete prevNode.searchFieldActive;
	    }
	    else {
	      delete prevNode.searchValueActive;
	    }
	    prevNode.updateDom();
	  }

	  if (!this.results || !this.results[index]) {
	    // out of range, set to undefined
	    this.resultIndex = undefined;
	    this.activeResult = undefined;
	    return;
	  }

	  this.resultIndex = index;

	  // set new node active
	  var node = this.results[this.resultIndex].node;
	  var elem = this.results[this.resultIndex].elem;
	  if (elem == 'field') {
	    node.searchFieldActive = true;
	  }
	  else {
	    node.searchValueActive = true;
	  }
	  this.activeResult = this.results[this.resultIndex];
	  node.updateDom();

	  // TODO: not so nice that the focus is only set after the animation is finished
	  node.scrollTo(function () {
	    if (focus) {
	      node.focus(elem);
	    }
	  });
	};

	/**
	 * Cancel any running onDelayedSearch.
	 * @private
	 */
	SearchBox.prototype._clearDelay = function() {
	  if (this.timeout != undefined) {
	    clearTimeout(this.timeout);
	    delete this.timeout;
	  }
	};

	/**
	 * Start a timer to execute a search after a short delay.
	 * Used for reducing the number of searches while typing.
	 * @param {Event} event
	 * @private
	 */
	SearchBox.prototype._onDelayedSearch = function (event) {
	  // execute the search after a short delay (reduces the number of
	  // search actions while typing in the search text box)
	  this._clearDelay();
	  var searchBox = this;
	  this.timeout = setTimeout(function (event) {
	    searchBox._onSearch();
	  },
	  this.delay);
	};

	/**
	 * Handle onSearch event
	 * @param {boolean} [forceSearch]  If true, search will be executed again even
	 *                                 when the search text is not changed.
	 *                                 Default is false.
	 * @private
	 */
	SearchBox.prototype._onSearch = function (forceSearch) {
	  this._clearDelay();

	  var value = this.dom.search.value;
	  var text = (value.length > 0) ? value : undefined;
	  if (text !== this.lastText || forceSearch) {
	    // only search again when changed
	    this.lastText = text;
	    this.results = this.editor.search(text);
	    var MAX_SEARCH_RESULTS = this.results[0]
	        ? this.results[0].node.MAX_SEARCH_RESULTS
	        : Infinity;

	    // try to maintain the current active result if this is still part of the new search results
	    var activeResultIndex = 0;
	    if (this.activeResult) {
	      for (var i = 0; i < this.results.length; i++) {
	        if (this.results[i].node === this.activeResult.node) {
	          activeResultIndex = i;
	          break;
	        }
	      }
	    }

	    this._setActiveResult(activeResultIndex, false);

	    // display search results
	    if (text !== undefined) {
	      var resultCount = this.results.length;
	      if (resultCount === 0) {
	        this.dom.results.innerHTML = 'no&nbsp;results';
	      }
	      else if (resultCount === 1) {
	        this.dom.results.innerHTML = '1&nbsp;result';
	      }
	      else if (resultCount > MAX_SEARCH_RESULTS) {
	        this.dom.results.innerHTML = MAX_SEARCH_RESULTS + '+&nbsp;results';
	      }
	      else {
	        this.dom.results.innerHTML = resultCount + '&nbsp;results';
	      }
	    }
	    else {
	      this.dom.results.innerHTML = '';
	    }
	  }
	};

	/**
	 * Handle onKeyDown event in the input box
	 * @param {Event} event
	 * @private
	 */
	SearchBox.prototype._onKeyDown = function (event) {
	  var keynum = event.which;
	  if (keynum == 27) { // ESC
	    this.dom.search.value = '';  // clear search
	    this._onSearch();
	    event.preventDefault();
	    event.stopPropagation();
	  }
	  else if (keynum == 13) { // Enter
	    if (event.ctrlKey) {
	      // force to search again
	      this._onSearch(true);
	    }
	    else if (event.shiftKey) {
	      // move to the previous search result
	      this.previous();
	    }
	    else {
	      // move to the next search result
	      this.next();
	    }
	    event.preventDefault();
	    event.stopPropagation();
	  }
	};

	/**
	 * Handle onKeyUp event in the input box
	 * @param {Event} event
	 * @private
	 */
	SearchBox.prototype._onKeyUp = function (event) {
	  var keynum = event.keyCode;
	  if (keynum != 27 && keynum != 13) { // !show and !Enter
	    this._onDelayedSearch(event);   // For IE 9
	  }
	};

	/**
	 * Clear the search results
	 */
	SearchBox.prototype.clear = function () {
	  this.dom.search.value = '';
	  this._onSearch();
	};

	/**
	 * Refresh searchResults if there is a search value
	 */
	SearchBox.prototype.forceSearch = function () {
	  this._onSearch(true);
	};

	/**
	 * Test whether the search box value is empty
	 * @returns {boolean} Returns true when empty.
	 */
	SearchBox.prototype.isEmpty = function () {
	  return this.dom.search.value === '';
	};

	/**
	 * Destroy the search box
	 */
	SearchBox.prototype.destroy = function () {
	  this.editor = null;
	  this.dom.container.removeChild(this.dom.table);
	  this.dom = null;

	  this.results = null;
	  this.activeResult = null;

	  this._clearDelay();

	};

	module.exports = SearchBox;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var createAbsoluteAnchor = __webpack_require__(11).createAbsoluteAnchor;
	var util = __webpack_require__(12);
	var translate = __webpack_require__(15).translate;

	/**
	 * A context menu
	 * @param {Object[]} items    Array containing the menu structure
	 *                            TODO: describe structure
	 * @param {Object} [options]  Object with options. Available options:
	 *                            {function} close    Callback called when the
	 *                                                context menu is being closed.
	 * @constructor
	 */
	function ContextMenu (items, options) {
	  this.dom = {};

	  var me = this;
	  var dom = this.dom;
	  this.anchor = undefined;
	  this.items = items;
	  this.eventListeners = {};
	  this.selection = undefined; // holds the selection before the menu was opened
	  this.onClose = options ? options.close : undefined;

	  // create root element
	  var root = document.createElement('div');
	  root.className = 'jsoneditor-contextmenu-root';
	  dom.root = root;

	  // create a container element
	  var menu = document.createElement('div');
	  menu.className = 'jsoneditor-contextmenu';
	  dom.menu = menu;
	  root.appendChild(menu);

	  // create a list to hold the menu items
	  var list = document.createElement('ul');
	  list.className = 'jsoneditor-menu';
	  menu.appendChild(list);
	  dom.list = list;
	  dom.items = []; // list with all buttons

	  // create a (non-visible) button to set the focus to the menu
	  var focusButton = document.createElement('button');
	  focusButton.type = 'button';
	  dom.focusButton = focusButton;
	  var li = document.createElement('li');
	  li.style.overflow = 'hidden';
	  li.style.height = '0';
	  li.appendChild(focusButton);
	  list.appendChild(li);

	  function createMenuItems (list, domItems, items) {
	    items.forEach(function (item) {
	      if (item.type == 'separator') {
	        // create a separator
	        var separator = document.createElement('div');
	        separator.className = 'jsoneditor-separator';
	        li = document.createElement('li');
	        li.appendChild(separator);
	        list.appendChild(li);
	      }
	      else {
	        var domItem = {};

	        // create a menu item
	        var li = document.createElement('li');
	        list.appendChild(li);

	        // create a button in the menu item
	        var button = document.createElement('button');
	        button.type = 'button';
	        button.className = item.className;
	        domItem.button = button;
	        if (item.title) {
	          button.title = item.title;
	        }
	        if (item.click) {
	          button.onclick = function (event) {
	            event.preventDefault();
	            me.hide();
	            item.click();
	          };
	        }
	        li.appendChild(button);

	        // create the contents of the button
	        if (item.submenu) {
	          // add the icon to the button
	          var divIcon = document.createElement('div');
	          divIcon.className = 'jsoneditor-icon';
	          button.appendChild(divIcon);
	          var divText = document.createElement('div');
	          divText.className = 'jsoneditor-text' +
	              (item.click ? '' : ' jsoneditor-right-margin');
	          divText.appendChild(document.createTextNode(item.text));
	          button.appendChild(divText);

	          var buttonSubmenu;
	          if (item.click) {
	            // submenu and a button with a click handler
	            button.className += ' jsoneditor-default';

	            var buttonExpand = document.createElement('button');
	            buttonExpand.type = 'button';
	            domItem.buttonExpand = buttonExpand;
	            buttonExpand.className = 'jsoneditor-expand';
	            buttonExpand.innerHTML = '<div class="jsoneditor-expand"></div>';
	            li.appendChild(buttonExpand);
	            if (item.submenuTitle) {
	              buttonExpand.title = item.submenuTitle;
	            }

	            buttonSubmenu = buttonExpand;
	          }
	          else {
	            // submenu and a button without a click handler
	            var divExpand = document.createElement('div');
	            divExpand.className = 'jsoneditor-expand';
	            button.appendChild(divExpand);

	            buttonSubmenu = button;
	          }

	          // attach a handler to expand/collapse the submenu
	          buttonSubmenu.onclick = function (event) {
	            event.preventDefault();
	            me._onExpandItem(domItem);
	            buttonSubmenu.focus();
	          };

	          // create the submenu
	          var domSubItems = [];
	          domItem.subItems = domSubItems;
	          var ul = document.createElement('ul');
	          domItem.ul = ul;
	          ul.className = 'jsoneditor-menu';
	          ul.style.height = '0';
	          li.appendChild(ul);
	          createMenuItems(ul, domSubItems, item.submenu);
	        }
	        else {
	          // no submenu, just a button with clickhandler
	          button.innerHTML = '<div class="jsoneditor-icon"></div>' +
	              '<div class="jsoneditor-text">' + translate(item.text) + '</div>';
	        }

	        domItems.push(domItem);
	      }
	    });
	  }
	  createMenuItems(list, this.dom.items, items);

	  // TODO: when the editor is small, show the submenu on the right instead of inline?

	  // calculate the max height of the menu with one submenu expanded
	  this.maxHeight = 0; // height in pixels
	  items.forEach(function (item) {
	    var height = (items.length + (item.submenu ? item.submenu.length : 0)) * 24;
	    me.maxHeight = Math.max(me.maxHeight, height);
	  });
	}

	/**
	 * Get the currently visible buttons
	 * @return {Array.<HTMLElement>} buttons
	 * @private
	 */
	ContextMenu.prototype._getVisibleButtons = function () {
	  var buttons = [];
	  var me = this;
	  this.dom.items.forEach(function (item) {
	    buttons.push(item.button);
	    if (item.buttonExpand) {
	      buttons.push(item.buttonExpand);
	    }
	    if (item.subItems && item == me.expandedItem) {
	      item.subItems.forEach(function (subItem) {
	        buttons.push(subItem.button);
	        if (subItem.buttonExpand) {
	          buttons.push(subItem.buttonExpand);
	        }
	        // TODO: change to fully recursive method
	      });
	    }
	  });

	  return buttons;
	};

	// currently displayed context menu, a singleton. We may only have one visible context menu
	ContextMenu.visibleMenu = undefined;

	/**
	 * Attach the menu to an anchor
	 * @param {HTMLElement} anchor    Anchor where the menu will be attached as sibling.
	 * @param {HTMLElement} frame     The root of the JSONEditor window
	 * @param {Boolean=} ignoreParent ignore anchor parent in regard to the calculation of the position, needed when the parent position is absolute
	 */
	ContextMenu.prototype.show = function (anchor, frame, ignoreParent) {
	  this.hide();

	  // determine whether to display the menu below or above the anchor
	  var showBelow = true;
	  var parent = anchor.parentNode;
	  var anchorRect = anchor.getBoundingClientRect();
	  var parentRect = parent.getBoundingClientRect();
	  var frameRect = frame.getBoundingClientRect();

	  var me = this;
	  this.dom.absoluteAnchor = createAbsoluteAnchor(anchor, frame, function () {
	    me.hide()
	  });

	  if (anchorRect.bottom + this.maxHeight < frameRect.bottom) {
	    // fits below -> show below
	  }
	  else if (anchorRect.top - this.maxHeight > frameRect.top) {
	    // fits above -> show above
	    showBelow = false;
	  }
	  else {
	    // doesn't fit above nor below -> show below
	  }

	  var topGap = ignoreParent ? 0 : (anchorRect.top - parentRect.top);

	  // position the menu
	  if (showBelow) {
	    // display the menu below the anchor
	    var anchorHeight = anchor.offsetHeight;
	    this.dom.menu.style.left = '0';
	    this.dom.menu.style.top = topGap + anchorHeight + 'px';
	    this.dom.menu.style.bottom = '';
	  }
	  else {
	    // display the menu above the anchor
	    this.dom.menu.style.left = '0';
	    this.dom.menu.style.top = '';
	    this.dom.menu.style.bottom = '0px';
	  }

	  // attach the menu to the temporary, absolute anchor
	  // parent.insertBefore(this.dom.root, anchor);
	  this.dom.absoluteAnchor.appendChild(this.dom.root);

	  // move focus to the first button in the context menu
	  this.selection = util.getSelection();
	  this.anchor = anchor;
	  setTimeout(function () {
	    me.dom.focusButton.focus();
	  }, 0);

	  if (ContextMenu.visibleMenu) {
	    ContextMenu.visibleMenu.hide();
	  }
	  ContextMenu.visibleMenu = this;
	};

	/**
	 * Hide the context menu if visible
	 */
	ContextMenu.prototype.hide = function () {
	  // remove temporary absolutely positioned anchor
	  if (this.dom.absoluteAnchor) {
	    this.dom.absoluteAnchor.destroy();
	    delete this.dom.absoluteAnchor;
	  }

	  // remove the menu from the DOM
	  if (this.dom.root.parentNode) {
	    this.dom.root.parentNode.removeChild(this.dom.root);
	    if (this.onClose) {
	      this.onClose();
	    }
	  }

	  if (ContextMenu.visibleMenu == this) {
	    ContextMenu.visibleMenu = undefined;
	  }
	};

	/**
	 * Expand a submenu
	 * Any currently expanded submenu will be hided.
	 * @param {Object} domItem
	 * @private
	 */
	ContextMenu.prototype._onExpandItem = function (domItem) {
	  var me = this;
	  var alreadyVisible = (domItem == this.expandedItem);

	  // hide the currently visible submenu
	  var expandedItem = this.expandedItem;
	  if (expandedItem) {
	    //var ul = expandedItem.ul;
	    expandedItem.ul.style.height = '0';
	    expandedItem.ul.style.padding = '';
	    setTimeout(function () {
	      if (me.expandedItem != expandedItem) {
	        expandedItem.ul.style.display = '';
	        util.removeClassName(expandedItem.ul.parentNode, 'jsoneditor-selected');
	      }
	    }, 300); // timeout duration must match the css transition duration
	    this.expandedItem = undefined;
	  }

	  if (!alreadyVisible) {
	    var ul = domItem.ul;
	    ul.style.display = 'block';
	    var height = ul.clientHeight; // force a reflow in Firefox
	    setTimeout(function () {
	      if (me.expandedItem == domItem) {
	        var childsHeight = 0;
	        for (var i = 0; i < ul.childNodes.length; i++) {
	          childsHeight += ul.childNodes[i].clientHeight;
	        }
	        ul.style.height = childsHeight + 'px';
	        ul.style.padding = '5px 10px';
	      }
	    }, 0);
	    util.addClassName(ul.parentNode, 'jsoneditor-selected');
	    this.expandedItem = domItem;
	  }
	};

	/**
	 * Handle onkeydown event
	 * @param {Event} event
	 * @private
	 */
	ContextMenu.prototype._onKeyDown = function (event) {
	  var target = event.target;
	  var keynum = event.which;
	  var handled = false;
	  var buttons, targetIndex, prevButton, nextButton;

	  if (keynum == 27) { // ESC
	    // hide the menu on ESC key

	    // restore previous selection and focus
	    if (this.selection) {
	      util.setSelection(this.selection);
	    }
	    if (this.anchor) {
	      this.anchor.focus();
	    }

	    this.hide();

	    handled = true;
	  }
	  else if (keynum == 9) { // Tab
	    if (!event.shiftKey) { // Tab
	      buttons = this._getVisibleButtons();
	      targetIndex = buttons.indexOf(target);
	      if (targetIndex == buttons.length - 1) {
	        // move to first button
	        buttons[0].focus();
	        handled = true;
	      }
	    }
	    else { // Shift+Tab
	      buttons = this._getVisibleButtons();
	      targetIndex = buttons.indexOf(target);
	      if (targetIndex == 0) {
	        // move to last button
	        buttons[buttons.length - 1].focus();
	        handled = true;
	      }
	    }
	  }
	  else if (keynum == 37) { // Arrow Left
	    if (target.className == 'jsoneditor-expand') {
	      buttons = this._getVisibleButtons();
	      targetIndex = buttons.indexOf(target);
	      prevButton = buttons[targetIndex - 1];
	      if (prevButton) {
	        prevButton.focus();
	      }
	    }
	    handled = true;
	  }
	  else if (keynum == 38) { // Arrow Up
	    buttons = this._getVisibleButtons();
	    targetIndex = buttons.indexOf(target);
	    prevButton = buttons[targetIndex - 1];
	    if (prevButton && prevButton.className == 'jsoneditor-expand') {
	      // skip expand button
	      prevButton = buttons[targetIndex - 2];
	    }
	    if (!prevButton) {
	      // move to last button
	      prevButton = buttons[buttons.length - 1];
	    }
	    if (prevButton) {
	      prevButton.focus();
	    }
	    handled = true;
	  }
	  else if (keynum == 39) { // Arrow Right
	    buttons = this._getVisibleButtons();
	    targetIndex = buttons.indexOf(target);
	    nextButton = buttons[targetIndex + 1];
	    if (nextButton && nextButton.className == 'jsoneditor-expand') {
	      nextButton.focus();
	    }
	    handled = true;
	  }
	  else if (keynum == 40) { // Arrow Down
	    buttons = this._getVisibleButtons();
	    targetIndex = buttons.indexOf(target);
	    nextButton = buttons[targetIndex + 1];
	    if (nextButton && nextButton.className == 'jsoneditor-expand') {
	      // skip expand button
	      nextButton = buttons[targetIndex + 2];
	    }
	    if (!nextButton) {
	      // move to first button
	      nextButton = buttons[0];
	    }
	    if (nextButton) {
	      nextButton.focus();
	      handled = true;
	    }
	    handled = true;
	  }
	  // TODO: arrow left and right

	  if (handled) {
	    event.stopPropagation();
	    event.preventDefault();
	  }
	};

	module.exports = ContextMenu;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(12);

	/**
	 * Create an anchor element absolutely positioned in the `parent`
	 * element.
	 * @param {HTMLElement} anchor
	 * @param {HTMLElement} parent
	 * @param [onDestroy(function(anchor)]  Callback when the anchor is destroyed
	 * @returns {HTMLElement}
	 */
	exports.createAbsoluteAnchor = function (anchor, parent, onDestroy) {
	  var root = getRootNode(anchor);
	  var eventListeners = {};

	  var anchorRect = anchor.getBoundingClientRect();
	  var frameRect = parent.getBoundingClientRect();

	  var absoluteAnchor = document.createElement('div');
	  absoluteAnchor.className = 'jsoneditor-anchor';
	  absoluteAnchor.style.position = 'absolute';
	  absoluteAnchor.style.left = (anchorRect.left - frameRect.left) + 'px';
	  absoluteAnchor.style.top = (anchorRect.top - frameRect.top) + 'px';
	  absoluteAnchor.style.width = (anchorRect.width - 2) + 'px';
	  absoluteAnchor.style.height = (anchorRect.height - 2) + 'px';
	  absoluteAnchor.style.boxSizing = 'border-box';
	  parent.appendChild(absoluteAnchor);

	  function destroy () {
	    // remove temporary absolutely positioned anchor
	    if (absoluteAnchor && absoluteAnchor.parentNode) {
	      absoluteAnchor.parentNode.removeChild(absoluteAnchor);

	      // remove all event listeners
	      // all event listeners are supposed to be attached to document.
	      for (var name in eventListeners) {
	        if (eventListeners.hasOwnProperty(name)) {
	          var fn = eventListeners[name];
	          if (fn) {
	            util.removeEventListener(root, name, fn);
	          }
	          delete eventListeners[name];
	        }
	      }

	      if (typeof onDestroy === 'function') {
	        onDestroy(anchor);
	      }
	    }
	  }

	  // create and attach event listeners
	  var destroyIfOutside = function (event) {
	    var target = event.target;
	    if ((target !== absoluteAnchor) && !util.isChildOf(target, absoluteAnchor)) {
	      destroy();
	    }
	  }

	  eventListeners.mousedown = util.addEventListener(root, 'mousedown', destroyIfOutside);
	  eventListeners.mousewheel = util.addEventListener(root, 'mousewheel', destroyIfOutside);
	  // eventListeners.scroll = util.addEventListener(root, 'scroll', destroyIfOutside);

	  absoluteAnchor.destroy = destroy;

	  return absoluteAnchor
	}

	/**
	 * Node.getRootNode shim
	 * @param  {HTMLElement} node node to check
	 * @return {HTMLElement}      node's rootNode or `window` if there is ShadowDOM is not supported.
	 */
	function getRootNode(node){
	  return (typeof node.getRootNode === 'function')
	      ? node.getRootNode()
	      : window;
	}


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var jsonlint = __webpack_require__(13);
	var jsonMap = __webpack_require__(14);

	/**
	 * Parse JSON using the parser built-in in the browser.
	 * On exception, the jsonString is validated and a detailed error is thrown.
	 * @param {String} jsonString
	 * @return {JSON} json
	 */
	exports.parse = function parse(jsonString) {
	  try {
	    return JSON.parse(jsonString);
	  }
	  catch (err) {
	    // try to throw a more detailed error message using validate
	    exports.validate(jsonString);

	    // rethrow the original error
	    throw err;
	  }
	};

	/**
	 * Sanitize a JSON-like string containing. For example changes JavaScript
	 * notation into JSON notation.
	 * This function for example changes a string like "{a: 2, 'b': {c: 'd'}"
	 * into '{"a": 2, "b": {"c": "d"}'
	 * @param {string} jsString
	 * @returns {string} json
	 */
	exports.sanitize = function (jsString) {
	  // escape all single and double quotes inside strings
	  var chars = [];
	  var i = 0;

	  //If JSON starts with a function (characters/digits/"_-"), remove this function.
	  //This is useful for "stripping" JSONP objects to become JSON
	  //For example: /* some comment */ function_12321321 ( [{"a":"b"}] ); => [{"a":"b"}]
	  var match = jsString.match(/^\s*(\/\*(.|[\r\n])*?\*\/)?\s*[\da-zA-Z_$]+\s*\(([\s\S]*)\)\s*;?\s*$/);
	  if (match) {
	    jsString = match[3];
	  }

	  var controlChars = {
	    '\b': '\\b',
	    '\f': '\\f',
	    '\n': '\\n',
	    '\r': '\\r',
	    '\t': '\\t'
	  };

	  var quote = '\'';
	  var quoteDbl = '"';
	  var quoteLeft = '\u2018';
	  var quoteRight = '\u2019';
	  var quoteDblLeft = '\u201C';
	  var quoteDblRight = '\u201D';
	  var graveAccent = '\u0060';
	  var acuteAccent = '\u00B4';

	  // helper functions to get the current/prev/next character
	  function curr () { return jsString.charAt(i);     }
	  function next()  { return jsString.charAt(i + 1); }
	  function prev()  { return jsString.charAt(i - 1); }

	  function isWhiteSpace(c) {
	    return c === ' ' || c === '\n' || c === '\r' || c === '\t';
	  }

	  // get the last parsed non-whitespace character
	  function lastNonWhitespace () {
	    var p = chars.length - 1;

	    while (p >= 0) {
	      var pp = chars[p];
	      if (!isWhiteSpace(pp)) {
	        return pp;
	      }
	      p--;
	    }

	    return '';
	  }

	  // get at the first next non-white space character
	  function nextNonWhiteSpace() {
	    var iNext = i + 1;
	    while (iNext < jsString.length && isWhiteSpace(jsString[iNext])) {
	      iNext++;
	    }

	    return jsString[iNext];
	  }

	  // skip a block comment '/* ... */'
	  function skipBlockComment () {
	    i += 2;
	    while (i < jsString.length && (curr() !== '*' || next() !== '/')) {
	      i++;
	    }
	    i += 2;
	  }

	  // skip a comment '// ...'
	  function skipComment () {
	    i += 2;
	    while (i < jsString.length && (curr() !== '\n')) {
	      i++;
	    }
	  }

	  // parse single or double quoted string
	  function parseString(endQuote) {
	    chars.push('"');
	    i++;
	    var c = curr();
	    while (i < jsString.length && c !== endQuote) {
	      if (c === '"' && prev() !== '\\') {
	        // unescaped double quote, escape it
	        chars.push('\\"');
	      }
	      else if (controlChars.hasOwnProperty(c)) {
	        // replace unescaped control characters with escaped ones
	        chars.push(controlChars[c])
	      }
	      else if (c === '\\') {
	        // remove the escape character when followed by a single quote ', not needed
	        i++;
	        c = curr();
	        if (c !== '\'') {
	          chars.push('\\');
	        }
	        chars.push(c);
	      }
	      else {
	        // regular character
	        chars.push(c);
	      }

	      i++;
	      c = curr();
	    }
	    if (c === endQuote) {
	      chars.push('"');
	      i++;
	    }
	  }

	  // parse an unquoted key
	  function parseKey() {
	    var specialValues = ['null', 'true', 'false'];
	    var key = '';
	    var c = curr();

	    var regexp = /[a-zA-Z_$\d]/; // letter, number, underscore, dollar character
	    while (regexp.test(c)) {
	      key += c;
	      i++;
	      c = curr();
	    }

	    if (specialValues.indexOf(key) === -1) {
	      chars.push('"' + key + '"');
	    }
	    else {
	      chars.push(key);
	    }
	  }

	  while(i < jsString.length) {
	    var c = curr();

	    if (c === '/' && next() === '*') {
	      skipBlockComment();
	    }
	    else if (c === '/' && next() === '/') {
	      skipComment();
	    }
	    else if (c === '\u00A0' || (c >= '\u2000' && c <= '\u200A') || c === '\u202F' || c === '\u205F' || c === '\u3000') {
	      // special white spaces (like non breaking space)
	      chars.push(' ');
	      i++
	    }
	    else if (c === quote) {
	      parseString(quote);
	    }
	    else if (c === quoteDbl) {
	      parseString(quoteDbl);
	    }
	    else if (c === graveAccent) {
	      parseString(acuteAccent);
	    }
	    else if (c === quoteLeft) {
	      parseString(quoteRight);
	    }
	    else if (c === quoteDblLeft) {
	      parseString(quoteDblRight);
	    }
	    else if (c === ',' && [']', '}'].indexOf(nextNonWhiteSpace()) !== -1) {
	      // skip trailing commas
	      i++;
	    }
	    else if (/[a-zA-Z_$]/.test(c) && ['{', ','].indexOf(lastNonWhitespace()) !== -1) {
	      // an unquoted object key (like a in '{a:2}')
	      parseKey();
	    }
	    else {
	      chars.push(c);
	      i++;
	    }
	  }

	  return chars.join('');
	};

	/**
	 * Escape unicode characters.
	 * For example input '\u2661' (length 1) will output '\\u2661' (length 5).
	 * @param {string} text
	 * @return {string}
	 */
	exports.escapeUnicodeChars = function (text) {
	  // see https://www.wikiwand.com/en/UTF-16
	  // note: we leave surrogate pairs as two individual chars,
	  // as JSON doesn't interpret them as a single unicode char.
	  return text.replace(/[\u007F-\uFFFF]/g, function(c) {
	    return '\\u'+('0000' + c.charCodeAt(0).toString(16)).slice(-4);
	  })
	};

	/**
	 * Validate a string containing a JSON object
	 * This method uses JSONLint to validate the String. If JSONLint is not
	 * available, the built-in JSON parser of the browser is used.
	 * @param {String} jsonString   String with an (invalid) JSON object
	 * @throws Error
	 */
	exports.validate = function validate(jsonString) {
	  if (typeof(jsonlint) != 'undefined') {
	    jsonlint.parse(jsonString);
	  }
	  else {
	    JSON.parse(jsonString);
	  }
	};

	/**
	 * Extend object a with the properties of object b
	 * @param {Object} a
	 * @param {Object} b
	 * @return {Object} a
	 */
	exports.extend = function extend(a, b) {
	  for (var prop in b) {
	    if (b.hasOwnProperty(prop)) {
	      a[prop] = b[prop];
	    }
	  }
	  return a;
	};

	/**
	 * Remove all properties from object a
	 * @param {Object} a
	 * @return {Object} a
	 */
	exports.clear = function clear (a) {
	  for (var prop in a) {
	    if (a.hasOwnProperty(prop)) {
	      delete a[prop];
	    }
	  }
	  return a;
	};

	/**
	 * Get the type of an object
	 * @param {*} object
	 * @return {String} type
	 */
	exports.type = function type (object) {
	  if (object === null) {
	    return 'null';
	  }
	  if (object === undefined) {
	    return 'undefined';
	  }
	  if ((object instanceof Number) || (typeof object === 'number')) {
	    return 'number';
	  }
	  if ((object instanceof String) || (typeof object === 'string')) {
	    return 'string';
	  }
	  if ((object instanceof Boolean) || (typeof object === 'boolean')) {
	    return 'boolean';
	  }
	  if ((object instanceof RegExp) || (typeof object === 'regexp')) {
	    return 'regexp';
	  }
	  if (exports.isArray(object)) {
	    return 'array';
	  }

	  return 'object';
	};

	/**
	 * Test whether a text contains a url (matches when a string starts
	 * with 'http://*' or 'https://*' and has no whitespace characters)
	 * @param {String} text
	 */
	var isUrlRegex = /^https?:\/\/\S+$/;
	exports.isUrl = function isUrl (text) {
	  return (typeof text == 'string' || text instanceof String) &&
	      isUrlRegex.test(text);
	};

	/**
	 * Tes whether given object is an Array
	 * @param {*} obj
	 * @returns {boolean} returns true when obj is an array
	 */
	exports.isArray = function (obj) {
	  return Object.prototype.toString.call(obj) === '[object Array]';
	};

	/**
	 * Retrieve the absolute left value of a DOM element
	 * @param {Element} elem    A dom element, for example a div
	 * @return {Number} left    The absolute left position of this element
	 *                          in the browser page.
	 */
	exports.getAbsoluteLeft = function getAbsoluteLeft(elem) {
	  var rect = elem.getBoundingClientRect();
	  return rect.left + window.pageXOffset || document.scrollLeft || 0;
	};

	/**
	 * Retrieve the absolute top value of a DOM element
	 * @param {Element} elem    A dom element, for example a div
	 * @return {Number} top     The absolute top position of this element
	 *                          in the browser page.
	 */
	exports.getAbsoluteTop = function getAbsoluteTop(elem) {
	  var rect = elem.getBoundingClientRect();
	  return rect.top + window.pageYOffset || document.scrollTop || 0;
	};

	/**
	 * add a className to the given elements style
	 * @param {Element} elem
	 * @param {String} className
	 */
	exports.addClassName = function addClassName(elem, className) {
	  var classes = elem.className.split(' ');
	  if (classes.indexOf(className) == -1) {
	    classes.push(className); // add the class to the array
	    elem.className = classes.join(' ');
	  }
	};

	/**
	 * remove all classes from the given elements style
	 * @param {Element} elem 
	 */
	exports.removeAllClassNames = function removeAllClassNames(elem) {
	    elem.className = "";
	};

	/**
	 * add a className to the given elements style
	 * @param {Element} elem
	 * @param {String} className
	 */
	exports.removeClassName = function removeClassName(elem, className) {
	  var classes = elem.className.split(' ');
	  var index = classes.indexOf(className);
	  if (index != -1) {
	    classes.splice(index, 1); // remove the class from the array
	    elem.className = classes.join(' ');
	  }
	};

	/**
	 * Strip the formatting from the contents of a div
	 * the formatting from the div itself is not stripped, only from its childs.
	 * @param {Element} divElement
	 */
	exports.stripFormatting = function stripFormatting(divElement) {
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
	      for (var j = attributes.length - 1; j >= 0; j--) {
	        var attribute = attributes[j];
	        if (attribute.specified === true) {
	          child.removeAttribute(attribute.name);
	        }
	      }
	    }

	    // recursively strip childs
	    exports.stripFormatting(child);
	  }
	};

	/**
	 * Set focus to the end of an editable div
	 * code from Nico Burns
	 * http://stackoverflow.com/users/140293/nico-burns
	 * http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
	 * @param {Element} contentEditableElement   A content editable div
	 */
	exports.setEndOfContentEditable = function setEndOfContentEditable(contentEditableElement) {
	  var range, selection;
	  if(document.createRange) {
	    range = document.createRange();//Create a range (a range is a like the selection but invisible)
	    range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
	    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
	    selection = window.getSelection();//get the selection object (allows you to change selection)
	    selection.removeAllRanges();//remove any selections already made
	    selection.addRange(range);//make the range you have just created the visible selection
	  }
	};

	/**
	 * Select all text of a content editable div.
	 * http://stackoverflow.com/a/3806004/1262753
	 * @param {Element} contentEditableElement   A content editable div
	 */
	exports.selectContentEditable = function selectContentEditable(contentEditableElement) {
	  if (!contentEditableElement || contentEditableElement.nodeName != 'DIV') {
	    return;
	  }

	  var sel, range;
	  if (window.getSelection && document.createRange) {
	    range = document.createRange();
	    range.selectNodeContents(contentEditableElement);
	    sel = window.getSelection();
	    sel.removeAllRanges();
	    sel.addRange(range);
	  }
	};

	/**
	 * Get text selection
	 * http://stackoverflow.com/questions/4687808/contenteditable-selected-text-save-and-restore
	 * @return {Range | TextRange | null} range
	 */
	exports.getSelection = function getSelection() {
	  if (window.getSelection) {
	    var sel = window.getSelection();
	    if (sel.getRangeAt && sel.rangeCount) {
	      return sel.getRangeAt(0);
	    }
	  }
	  return null;
	};

	/**
	 * Set text selection
	 * http://stackoverflow.com/questions/4687808/contenteditable-selected-text-save-and-restore
	 * @param {Range | TextRange | null} range
	 */
	exports.setSelection = function setSelection(range) {
	  if (range) {
	    if (window.getSelection) {
	      var sel = window.getSelection();
	      sel.removeAllRanges();
	      sel.addRange(range);
	    }
	  }
	};

	/**
	 * Get selected text range
	 * @return {Object} params  object containing parameters:
	 *                              {Number}  startOffset
	 *                              {Number}  endOffset
	 *                              {Element} container  HTML element holding the
	 *                                                   selected text element
	 *                          Returns null if no text selection is found
	 */
	exports.getSelectionOffset = function getSelectionOffset() {
	  var range = exports.getSelection();

	  if (range && 'startOffset' in range && 'endOffset' in range &&
	      range.startContainer && (range.startContainer == range.endContainer)) {
	    return {
	      startOffset: range.startOffset,
	      endOffset: range.endOffset,
	      container: range.startContainer.parentNode
	    };
	  }

	  return null;
	};

	/**
	 * Set selected text range in given element
	 * @param {Object} params   An object containing:
	 *                              {Element} container
	 *                              {Number} startOffset
	 *                              {Number} endOffset
	 */
	exports.setSelectionOffset = function setSelectionOffset(params) {
	  if (document.createRange && window.getSelection) {
	    var selection = window.getSelection();
	    if(selection) {
	      var range = document.createRange();

	      if (!params.container.firstChild) {
	        params.container.appendChild(document.createTextNode(''));
	      }

	      // TODO: do not suppose that the first child of the container is a textnode,
	      //       but recursively find the textnodes
	      range.setStart(params.container.firstChild, params.startOffset);
	      range.setEnd(params.container.firstChild, params.endOffset);

	      exports.setSelection(range);
	    }
	  }
	};

	/**
	 * Get the inner text of an HTML element (for example a div element)
	 * @param {Element} element
	 * @param {Object} [buffer]
	 * @return {String} innerText
	 */
	exports.getInnerText = function getInnerText(element, buffer) {
	  var first = (buffer == undefined);
	  if (first) {
	    buffer = {
	      'text': '',
	      'flush': function () {
	        var text = this.text;
	        this.text = '';
	        return text;
	      },
	      'set': function (text) {
	        this.text = text;
	      }
	    };
	  }

	  // text node
	  if (element.nodeValue) {
	    return buffer.flush() + element.nodeValue;
	  }

	  // divs or other HTML elements
	  if (element.hasChildNodes()) {
	    var childNodes = element.childNodes;
	    var innerText = '';

	    for (var i = 0, iMax = childNodes.length; i < iMax; i++) {
	      var child = childNodes[i];

	      if (child.nodeName == 'DIV' || child.nodeName == 'P') {
	        var prevChild = childNodes[i - 1];
	        var prevName = prevChild ? prevChild.nodeName : undefined;
	        if (prevName && prevName != 'DIV' && prevName != 'P' && prevName != 'BR') {
	          innerText += '\n';
	          buffer.flush();
	        }
	        innerText += exports.getInnerText(child, buffer);
	        buffer.set('\n');
	      }
	      else if (child.nodeName == 'BR') {
	        innerText += buffer.flush();
	        buffer.set('\n');
	      }
	      else {
	        innerText += exports.getInnerText(child, buffer);
	      }
	    }

	    return innerText;
	  }
	  else {
	    if (element.nodeName == 'P' && exports.getInternetExplorerVersion() != -1) {
	      // On Internet Explorer, a <p> with hasChildNodes()==false is
	      // rendered with a new line. Note that a <p> with
	      // hasChildNodes()==true is rendered without a new line
	      // Other browsers always ensure there is a <br> inside the <p>,
	      // and if not, the <p> does not render a new line
	      return buffer.flush();
	    }
	  }

	  // br or unknown
	  return '';
	};

	/**
	 * Test whether an element has the provided parent node somewhere up the node tree.
	 * @param {Element} elem
	 * @param {Element} parent
	 * @return {boolean}
	 */
	exports.hasParentNode = function (elem, parent) {
	  var e = elem ? elem.parentNode : undefined;

	  while (e) {
	    if (e === parent) {
	      return true;
	    }
	    e = e.parentNode;
	  }

	  return false;
	}

	/**
	 * Returns the version of Internet Explorer or a -1
	 * (indicating the use of another browser).
	 * Source: http://msdn.microsoft.com/en-us/library/ms537509(v=vs.85).aspx
	 * @return {Number} Internet Explorer version, or -1 in case of an other browser
	 */
	exports.getInternetExplorerVersion = function getInternetExplorerVersion() {
	  if (_ieVersion == -1) {
	    var rv = -1; // Return value assumes failure.
	    if (typeof navigator !== 'undefined' && navigator.appName == 'Microsoft Internet Explorer') {
	      var ua = navigator.userAgent;
	      var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
	      if (re.exec(ua) != null) {
	        rv = parseFloat( RegExp.$1 );
	      }
	    }

	    _ieVersion = rv;
	  }

	  return _ieVersion;
	};

	/**
	 * Test whether the current browser is Firefox
	 * @returns {boolean} isFirefox
	 */
	exports.isFirefox = function isFirefox () {
	  return (typeof navigator !== 'undefined' && navigator.userAgent.indexOf("Firefox") !== -1);
	};

	/**
	 * cached internet explorer version
	 * @type {Number}
	 * @private
	 */
	var _ieVersion = -1;

	/**
	 * Add and event listener. Works for all browsers
	 * @param {Element}     element    An html element
	 * @param {string}      action     The action, for example "click",
	 *                                 without the prefix "on"
	 * @param {function}    listener   The callback function to be executed
	 * @param {boolean}     [useCapture] false by default
	 * @return {function}   the created event listener
	 */
	exports.addEventListener = function addEventListener(element, action, listener, useCapture) {
	  if (element.addEventListener) {
	    if (useCapture === undefined)
	      useCapture = false;

	    if (action === "mousewheel" && exports.isFirefox()) {
	      action = "DOMMouseScroll";  // For Firefox
	    }

	    element.addEventListener(action, listener, useCapture);
	    return listener;
	  } else if (element.attachEvent) {
	    // Old IE browsers
	    var f = function () {
	      return listener.call(element, window.event);
	    };
	    element.attachEvent("on" + action, f);
	    return f;
	  }
	};

	/**
	 * Remove an event listener from an element
	 * @param {Element}  element   An html dom element
	 * @param {string}   action    The name of the event, for example "mousedown"
	 * @param {function} listener  The listener function
	 * @param {boolean}  [useCapture]   false by default
	 */
	exports.removeEventListener = function removeEventListener(element, action, listener, useCapture) {
	  if (element.removeEventListener) {
	    if (useCapture === undefined)
	      useCapture = false;

	    if (action === "mousewheel" && exports.isFirefox()) {
	      action = "DOMMouseScroll";  // For Firefox
	    }

	    element.removeEventListener(action, listener, useCapture);
	  } else if (element.detachEvent) {
	    // Old IE browsers
	    element.detachEvent("on" + action, listener);
	  }
	};

	/**
	 * Test if an element is a child of a parent element.
	 * @param {Element} elem
	 * @param {Element} parent
	 * @return {boolean} returns true if elem is a child of the parent
	 */
	exports.isChildOf = function (elem, parent) {
	  var e = elem.parentNode;
	  while (e) {
	    if (e === parent) {
	      return true;
	    }
	    e = e.parentNode;
	  }

	  return false;
	};

	/**
	 * Parse a JSON path like '.items[3].name' into an array
	 * @param {string} jsonPath
	 * @return {Array}
	 */
	exports.parsePath = function parsePath(jsonPath) {
	  var prop, remainder;

	  if (jsonPath.length === 0) {
	    return [];
	  }

	  // find a match like '.prop'
	  var match = jsonPath.match(/^\.([\w$]+)/);
	  if (match) {
	    prop = match[1];
	    remainder = jsonPath.substr(prop.length + 1);
	  }
	  else if (jsonPath[0] === '[') {
	    // find a match like
	    var end = jsonPath.indexOf(']');
	    if (end === -1) {
	      throw new SyntaxError('Character ] expected in path');
	    }
	    if (end === 1) {
	      throw new SyntaxError('Index expected after [');
	    }

	    var value = jsonPath.substring(1, end);
	    if (value[0] === '\'') {
	      // ajv produces string prop names with single quotes, so we need
	      // to reformat them into valid double-quoted JSON strings
	      value = '\"' + value.substring(1, value.length - 1) + '\"';
	    }

	    prop = value === '*' ? value : JSON.parse(value); // parse string and number
	    remainder = jsonPath.substr(end + 1);
	  }
	  else {
	    throw new SyntaxError('Failed to parse path');
	  }

	  return [prop].concat(parsePath(remainder))
	};

	/**
	 * Stringify an array with a path in a JSON path like '.items[3].name'
	 * @param {Array.<string | number>} path
	 * @returns {string}
	 */
	exports.stringifyPath = function stringifyPath(path) {
	  return path
	      .map(function (p) {
	        return typeof p === 'number' ? ('[' + p + ']') : ('.' + p);
	      })
	      .join('');
	};

	/**
	 * Improve the error message of a JSON schema error
	 * @param {Object} error
	 * @return {Object} The error
	 */
	exports.improveSchemaError = function (error) {
	  if (error.keyword === 'enum' && Array.isArray(error.schema)) {
	    var enums = error.schema;
	    if (enums) {
	      enums = enums.map(function (value) {
	        return JSON.stringify(value);
	      });

	      if (enums.length > 5) {
	        var more = ['(' + (enums.length - 5) + ' more...)'];
	        enums = enums.slice(0, 5);
	        enums.push(more);
	      }
	      error.message = 'should be equal to one of: ' + enums.join(', ');
	    }
	  }

	  if (error.keyword === 'additionalProperties') {
	    error.message = 'should NOT have additional property: ' + error.params.additionalProperty;
	  }

	  return error;
	};

	/**
	 * Test whether something is a Promise
	 * @param {*} object
	 * @returns {boolean} Returns true when object is a promise, false otherwise
	 */
	exports.isPromise = function (object) {
	  return object && typeof object.then === 'function' && typeof object.catch === 'function';
	};

	/**
	 * Test whether a custom validation error has the correct structure
	 * @param {*} validationError The error to be checked.
	 * @returns {boolean} Returns true if the structure is ok, false otherwise
	 */
	exports.isValidValidationError = function (validationError) {
	  return typeof validationError === 'object' &&
	      Array.isArray(validationError.path) &&
	      typeof validationError.message === 'string';
	};

	/**
	 * Test whether the child rect fits completely inside the parent rect.
	 * @param {ClientRect} parent
	 * @param {ClientRect} child
	 * @param {number} margin
	 */
	exports.insideRect = function (parent, child, margin) {
	  var _margin = margin !== undefined ? margin : 0;
	  return child.left   - _margin >= parent.left
	      && child.right  + _margin <= parent.right
	      && child.top    - _margin >= parent.top
	      && child.bottom + _margin <= parent.bottom;
	};

	/**
	 * Returns a function, that, as long as it continues to be invoked, will not
	 * be triggered. The function will be called after it stops being called for
	 * N milliseconds.
	 *
	 * Source: https://davidwalsh.name/javascript-debounce-function
	 *
	 * @param {function} func
	 * @param {number} wait                 Number in milliseconds
	 * @param {boolean} [immediate=false]   If `immediate` is passed, trigger the
	 *                                      function on the leading edge, instead
	 *                                      of the trailing.
	 * @return {function} Return the debounced function
	 */
	exports.debounce = function debounce(func, wait, immediate) {
	  var timeout;
	  return function() {
	    var context = this, args = arguments;
	    var later = function() {
	      timeout = null;
	      if (!immediate) func.apply(context, args);
	    };
	    var callNow = immediate && !timeout;
	    clearTimeout(timeout);
	    timeout = setTimeout(later, wait);
	    if (callNow) func.apply(context, args);
	  };
	};

	/**
	 * Determines the difference between two texts.
	 * Can only detect one removed or inserted block of characters.
	 * @param {string} oldText
	 * @param {string} newText
	 * @return {{start: number, end: number}} Returns the start and end
	 *                                        of the changed part in newText.
	 */
	exports.textDiff = function textDiff(oldText, newText) {
	  var len = newText.length;
	  var start = 0;
	  var oldEnd = oldText.length;
	  var newEnd = newText.length;

	  while (newText.charAt(start) === oldText.charAt(start)
	  && start < len) {
	    start++;
	  }

	  while (newText.charAt(newEnd - 1) === oldText.charAt(oldEnd - 1)
	  && newEnd > start && oldEnd > 0) {
	    newEnd--;
	    oldEnd--;
	  }

	  return {start: start, end: newEnd};
	};


	/**
	 * Return an object with the selection range or cursor position (if both have the same value)
	 * Support also old browsers (IE8-)
	 * Source: http://ourcodeworld.com/articles/read/282/how-to-get-the-current-cursor-position-and-selection-within-a-text-input-or-textarea-in-javascript
	 * @param {DOMElement} el A dom element of a textarea or input text.
	 * @return {Object} reference Object with 2 properties (start and end) with the identifier of the location of the cursor and selected text.
	 **/
	exports.getInputSelection = function(el) {
	  var startIndex = 0, endIndex = 0, normalizedValue, range, textInputRange, len, endRange;

	  if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
	      startIndex = el.selectionStart;
	      endIndex = el.selectionEnd;
	  } else {
	      range = document.selection.createRange();

	      if (range && range.parentElement() == el) {
	          len = el.value.length;
	          normalizedValue = el.value.replace(/\r\n/g, "\n");

	          // Create a working TextRange that lives only in the input
	          textInputRange = el.createTextRange();
	          textInputRange.moveToBookmark(range.getBookmark());

	          // Check if the startIndex and endIndex of the selection are at the very end
	          // of the input, since moveStart/moveEnd doesn't return what we want
	          // in those cases
	          endRange = el.createTextRange();
	          endRange.collapse(false);

	          if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
	              startIndex = endIndex = len;
	          } else {
	              startIndex = -textInputRange.moveStart("character", -len);
	              startIndex += normalizedValue.slice(0, startIndex).split("\n").length - 1;

	              if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
	                  endIndex = len;
	              } else {
	                  endIndex = -textInputRange.moveEnd("character", -len);
	                  endIndex += normalizedValue.slice(0, endIndex).split("\n").length - 1;
	              }
	          }
	      }
	  }

	  return {
	      startIndex: startIndex,
	      endIndex: endIndex,
	      start: _positionForIndex(startIndex),
	      end: _positionForIndex(endIndex)
	  };

	  /**
	   * Returns textarea row and column position for certain index
	   * @param {Number} index text index
	   * @returns {{row: Number, col: Number}}
	   */
	  function _positionForIndex(index) {
	    var textTillIndex = el.value.substring(0,index);
	    var row = (textTillIndex.match(/\n/g) || []).length + 1;
	    var col = textTillIndex.length - textTillIndex.lastIndexOf("\n");

	    return {
	      row: row,
	      column: col
	    }
	  }
	}

	/**
	 * Returns the index for certaion position in text element
	 * @param {DOMElement} el A dom element of a textarea or input text.
	 * @param {Number} row row value, > 0, if exceeds rows number - last row will be returned
	 * @param {Number} column column value, > 0, if exceeds column length - end of column will be returned
	 * @returns {Number} index of position in text, -1 if not found
	 */
	exports.getIndexForPosition = function(el, row, column) {
	  var text = el.value || '';
	  if (row > 0 && column > 0) {
	    var rows = text.split('\n', row);
	    row = Math.min(rows.length, row);
	    column = Math.min(rows[row - 1].length, column - 1);
	    var columnCount = (row == 1 ? column : column + 1); // count new line on multiple rows
	    return rows.slice(0, row - 1).join('\n').length + columnCount;
	  }
	  return -1;
	}

	/**
	 * Returns location of json paths in certain json string
	 * @param {String} text json string
	 * @param {Array<String>} paths array of json paths
	 * @returns {Array<{path: String, line: Number, row: Number}>}
	 */
	exports.getPositionForPath = function(text, paths) {
	  var me = this;
	  var result = [];
	  var jsmap;
	  if (!paths || !paths.length) {
	    return result;
	  }
	  
	  try {
	    jsmap = jsonMap.parse(text);    
	  } catch (err) {
	    return result;
	  }

	  paths.forEach(function (path) {
	    var pathArr = me.parsePath(path);
	    var pointerName = pathArr.length ? "/" + pathArr.join("/") : "";
	    var pointer = jsmap.pointers[pointerName];
	    if (pointer) {
	      result.push({
	        path: path,
	        line: pointer.key ? pointer.key.line : (pointer.value ? pointer.value.line : 0),
	        column: pointer.key ? pointer.key.column : (pointer.value ? pointer.value.column : 0)
	      });
	    }
	  });

	  return result;
	  
	}

	/**
	 * Get the applied color given a color name or code
	 * Source: https://stackoverflow.com/questions/6386090/validating-css-color-names/33184805
	 * @param {string} color
	 * @returns {string | null} returns the color if the input is a valid
	 *                   color, and returns null otherwise. Example output:
	 *                   'rgba(255,0,0,0.7)' or 'rgb(255,0,0)'
	 */
	exports.getColorCSS = function (color) {
	  var ele = document.createElement('div');
	  ele.style.color = color;
	  return ele.style.color.split(/\s+/).join('').toLowerCase() || null;
	}

	/**
	 * Test if a string contains a valid color name or code.
	 * @param {string} color
	 * @returns {boolean} returns true if a valid color, false otherwise
	 */
	exports.isValidColor = function (color) {
	  return !!exports.getColorCSS(color);
	}

	if (typeof Element !== 'undefined') {
	  // Polyfill for array remove
	  (function () {
	    function polyfill (item) {
	      if (item.hasOwnProperty('remove')) {
	        return;
	      }
	      Object.defineProperty(item, 'remove', {
	        configurable: true,
	        enumerable: true,
	        writable: true,
	        value: function remove() {
	          if (this.parentNode != null)
	            this.parentNode.removeChild(this);
	        }
	      });
	    }

	    if (typeof Element !== 'undefined')       { polyfill(Element.prototype); }
	    if (typeof CharacterData !== 'undefined') { polyfill(CharacterData.prototype); }
	    if (typeof DocumentType !== 'undefined')  { polyfill(DocumentType.prototype); }
	  })();
	}


	// Polyfill for startsWith
	if (!String.prototype.startsWith) {
	    String.prototype.startsWith = function (searchString, position) {
	        position = position || 0;
	        return this.substr(position, searchString.length) === searchString;
	    };
	}

	// Polyfill for Array.find
	if (!Array.prototype.find) {
	  Array.prototype.find = function(callback) {    
	    for (var i = 0; i < this.length; i++) {
	      var element = this[i];
	      if ( callback.call(this, element, i, this) ) {
	        return element;
	      }
	    }
	  }
	}

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/* Jison generated parser */
	var jsonlint = (function(){
	var parser = {trace: function trace() { },
	yy: {},
	symbols_: {"error":2,"JSONString":3,"STRING":4,"JSONNumber":5,"NUMBER":6,"JSONNullLiteral":7,"NULL":8,"JSONBooleanLiteral":9,"TRUE":10,"FALSE":11,"JSONText":12,"JSONValue":13,"EOF":14,"JSONObject":15,"JSONArray":16,"{":17,"}":18,"JSONMemberList":19,"JSONMember":20,":":21,",":22,"[":23,"]":24,"JSONElementList":25,"$accept":0,"$end":1},
	terminals_: {2:"error",4:"STRING",6:"NUMBER",8:"NULL",10:"TRUE",11:"FALSE",14:"EOF",17:"{",18:"}",21:":",22:",",23:"[",24:"]"},
	productions_: [0,[3,1],[5,1],[7,1],[9,1],[9,1],[12,2],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[15,2],[15,3],[20,3],[19,1],[19,3],[16,2],[16,3],[25,1],[25,3]],
	performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

	var $0 = $$.length - 1;
	switch (yystate) {
	case 1: // replace escaped characters with actual character
	          this.$ = yytext.replace(/\\(\\|")/g, "$"+"1")
	                     .replace(/\\n/g,'\n')
	                     .replace(/\\r/g,'\r')
	                     .replace(/\\t/g,'\t')
	                     .replace(/\\v/g,'\v')
	                     .replace(/\\f/g,'\f')
	                     .replace(/\\b/g,'\b');
	        
	break;
	case 2:this.$ = Number(yytext);
	break;
	case 3:this.$ = null;
	break;
	case 4:this.$ = true;
	break;
	case 5:this.$ = false;
	break;
	case 6:return this.$ = $$[$0-1];
	break;
	case 13:this.$ = {};
	break;
	case 14:this.$ = $$[$0-1];
	break;
	case 15:this.$ = [$$[$0-2], $$[$0]];
	break;
	case 16:this.$ = {}; this.$[$$[$0][0]] = $$[$0][1];
	break;
	case 17:this.$ = $$[$0-2]; $$[$0-2][$$[$0][0]] = $$[$0][1];
	break;
	case 18:this.$ = [];
	break;
	case 19:this.$ = $$[$0-1];
	break;
	case 20:this.$ = [$$[$0]];
	break;
	case 21:this.$ = $$[$0-2]; $$[$0-2].push($$[$0]);
	break;
	}
	},
	table: [{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],12:1,13:2,15:7,16:8,17:[1,14],23:[1,15]},{1:[3]},{14:[1,16]},{14:[2,7],18:[2,7],22:[2,7],24:[2,7]},{14:[2,8],18:[2,8],22:[2,8],24:[2,8]},{14:[2,9],18:[2,9],22:[2,9],24:[2,9]},{14:[2,10],18:[2,10],22:[2,10],24:[2,10]},{14:[2,11],18:[2,11],22:[2,11],24:[2,11]},{14:[2,12],18:[2,12],22:[2,12],24:[2,12]},{14:[2,3],18:[2,3],22:[2,3],24:[2,3]},{14:[2,4],18:[2,4],22:[2,4],24:[2,4]},{14:[2,5],18:[2,5],22:[2,5],24:[2,5]},{14:[2,1],18:[2,1],21:[2,1],22:[2,1],24:[2,1]},{14:[2,2],18:[2,2],22:[2,2],24:[2,2]},{3:20,4:[1,12],18:[1,17],19:18,20:19},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:23,15:7,16:8,17:[1,14],23:[1,15],24:[1,21],25:22},{1:[2,6]},{14:[2,13],18:[2,13],22:[2,13],24:[2,13]},{18:[1,24],22:[1,25]},{18:[2,16],22:[2,16]},{21:[1,26]},{14:[2,18],18:[2,18],22:[2,18],24:[2,18]},{22:[1,28],24:[1,27]},{22:[2,20],24:[2,20]},{14:[2,14],18:[2,14],22:[2,14],24:[2,14]},{3:20,4:[1,12],20:29},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:30,15:7,16:8,17:[1,14],23:[1,15]},{14:[2,19],18:[2,19],22:[2,19],24:[2,19]},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:31,15:7,16:8,17:[1,14],23:[1,15]},{18:[2,17],22:[2,17]},{18:[2,15],22:[2,15]},{22:[2,21],24:[2,21]}],
	defaultActions: {16:[2,6]},
	parseError: function parseError(str, hash) {
	    throw new Error(str);
	},
	parse: function parse(input) {
	    var self = this,
	        stack = [0],
	        vstack = [null], // semantic value stack
	        lstack = [], // location stack
	        table = this.table,
	        yytext = '',
	        yylineno = 0,
	        yyleng = 0,
	        recovering = 0,
	        TERROR = 2,
	        EOF = 1;

	    //this.reductionCount = this.shiftCount = 0;

	    this.lexer.setInput(input);
	    this.lexer.yy = this.yy;
	    this.yy.lexer = this.lexer;
	    if (typeof this.lexer.yylloc == 'undefined')
	        this.lexer.yylloc = {};
	    var yyloc = this.lexer.yylloc;
	    lstack.push(yyloc);

	    if (typeof this.yy.parseError === 'function')
	        this.parseError = this.yy.parseError;

	    function popStack (n) {
	        stack.length = stack.length - 2*n;
	        vstack.length = vstack.length - n;
	        lstack.length = lstack.length - n;
	    }

	    function lex() {
	        var token;
	        token = self.lexer.lex() || 1; // $end = 1
	        // if token isn't its numeric value, convert
	        if (typeof token !== 'number') {
	            token = self.symbols_[token] || token;
	        }
	        return token;
	    }

	    var symbol, preErrorSymbol, state, action, a, r, yyval={},p,len,newState, expected;
	    while (true) {
	        // retreive state number from top of stack
	        state = stack[stack.length-1];

	        // use default actions if available
	        if (this.defaultActions[state]) {
	            action = this.defaultActions[state];
	        } else {
	            if (symbol == null)
	                symbol = lex();
	            // read action for current state and first input
	            action = table[state] && table[state][symbol];
	        }

	        // handle parse error
	        _handle_error:
	        if (typeof action === 'undefined' || !action.length || !action[0]) {

	            if (!recovering) {
	                // Report error
	                expected = [];
	                for (p in table[state]) if (this.terminals_[p] && p > 2) {
	                    expected.push("'"+this.terminals_[p]+"'");
	                }
	                var errStr = '';
	                if (this.lexer.showPosition) {
	                    errStr = 'Parse error on line '+(yylineno+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+expected.join(', ') + ", got '" + this.terminals_[symbol]+ "'";
	                } else {
	                    errStr = 'Parse error on line '+(yylineno+1)+": Unexpected " +
	                                  (symbol == 1 /*EOF*/ ? "end of input" :
	                                              ("'"+(this.terminals_[symbol] || symbol)+"'"));
	                }
	                this.parseError(errStr,
	                    {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
	            }

	            // just recovered from another error
	            if (recovering == 3) {
	                if (symbol == EOF) {
	                    throw new Error(errStr || 'Parsing halted.');
	                }

	                // discard current lookahead and grab another
	                yyleng = this.lexer.yyleng;
	                yytext = this.lexer.yytext;
	                yylineno = this.lexer.yylineno;
	                yyloc = this.lexer.yylloc;
	                symbol = lex();
	            }

	            // try to recover from error
	            while (1) {
	                // check for error recovery rule in this state
	                if ((TERROR.toString()) in table[state]) {
	                    break;
	                }
	                if (state == 0) {
	                    throw new Error(errStr || 'Parsing halted.');
	                }
	                popStack(1);
	                state = stack[stack.length-1];
	            }

	            preErrorSymbol = symbol; // save the lookahead token
	            symbol = TERROR;         // insert generic error symbol as new lookahead
	            state = stack[stack.length-1];
	            action = table[state] && table[state][TERROR];
	            recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
	        }

	        // this shouldn't happen, unless resolve defaults are off
	        if (action[0] instanceof Array && action.length > 1) {
	            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
	        }

	        switch (action[0]) {

	            case 1: // shift
	                //this.shiftCount++;

	                stack.push(symbol);
	                vstack.push(this.lexer.yytext);
	                lstack.push(this.lexer.yylloc);
	                stack.push(action[1]); // push state
	                symbol = null;
	                if (!preErrorSymbol) { // normal execution/no error
	                    yyleng = this.lexer.yyleng;
	                    yytext = this.lexer.yytext;
	                    yylineno = this.lexer.yylineno;
	                    yyloc = this.lexer.yylloc;
	                    if (recovering > 0)
	                        recovering--;
	                } else { // error just occurred, resume old lookahead f/ before error
	                    symbol = preErrorSymbol;
	                    preErrorSymbol = null;
	                }
	                break;

	            case 2: // reduce
	                //this.reductionCount++;

	                len = this.productions_[action[1]][1];

	                // perform semantic action
	                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
	                // default location, uses first token for firsts, last for lasts
	                yyval._$ = {
	                    first_line: lstack[lstack.length-(len||1)].first_line,
	                    last_line: lstack[lstack.length-1].last_line,
	                    first_column: lstack[lstack.length-(len||1)].first_column,
	                    last_column: lstack[lstack.length-1].last_column
	                };
	                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);

	                if (typeof r !== 'undefined') {
	                    return r;
	                }

	                // pop off stack
	                if (len) {
	                    stack = stack.slice(0,-1*len*2);
	                    vstack = vstack.slice(0, -1*len);
	                    lstack = lstack.slice(0, -1*len);
	                }

	                stack.push(this.productions_[action[1]][0]);    // push nonterminal (reduce)
	                vstack.push(yyval.$);
	                lstack.push(yyval._$);
	                // goto new state = table[STATE][NONTERMINAL]
	                newState = table[stack[stack.length-2]][stack[stack.length-1]];
	                stack.push(newState);
	                break;

	            case 3: // accept
	                return true;
	        }

	    }

	    return true;
	}};
	/* Jison generated lexer */
	var lexer = (function(){
	var lexer = ({EOF:1,
	parseError:function parseError(str, hash) {
	        if (this.yy.parseError) {
	            this.yy.parseError(str, hash);
	        } else {
	            throw new Error(str);
	        }
	    },
	setInput:function (input) {
	        this._input = input;
	        this._more = this._less = this.done = false;
	        this.yylineno = this.yyleng = 0;
	        this.yytext = this.matched = this.match = '';
	        this.conditionStack = ['INITIAL'];
	        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
	        return this;
	    },
	input:function () {
	        var ch = this._input[0];
	        this.yytext+=ch;
	        this.yyleng++;
	        this.match+=ch;
	        this.matched+=ch;
	        var lines = ch.match(/\n/);
	        if (lines) this.yylineno++;
	        this._input = this._input.slice(1);
	        return ch;
	    },
	unput:function (ch) {
	        this._input = ch + this._input;
	        return this;
	    },
	more:function () {
	        this._more = true;
	        return this;
	    },
	less:function (n) {
	        this._input = this.match.slice(n) + this._input;
	    },
	pastInput:function () {
	        var past = this.matched.substr(0, this.matched.length - this.match.length);
	        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
	    },
	upcomingInput:function () {
	        var next = this.match;
	        if (next.length < 20) {
	            next += this._input.substr(0, 20-next.length);
	        }
	        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
	    },
	showPosition:function () {
	        var pre = this.pastInput();
	        var c = new Array(pre.length + 1).join("-");
	        return pre + this.upcomingInput() + "\n" + c+"^";
	    },
	next:function () {
	        if (this.done) {
	            return this.EOF;
	        }
	        if (!this._input) this.done = true;

	        var token,
	            match,
	            tempMatch,
	            index,
	            col,
	            lines;
	        if (!this._more) {
	            this.yytext = '';
	            this.match = '';
	        }
	        var rules = this._currentRules();
	        for (var i=0;i < rules.length; i++) {
	            tempMatch = this._input.match(this.rules[rules[i]]);
	            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
	                match = tempMatch;
	                index = i;
	                if (!this.options.flex) break;
	            }
	        }
	        if (match) {
	            lines = match[0].match(/\n.*/g);
	            if (lines) this.yylineno += lines.length;
	            this.yylloc = {first_line: this.yylloc.last_line,
	                           last_line: this.yylineno+1,
	                           first_column: this.yylloc.last_column,
	                           last_column: lines ? lines[lines.length-1].length-1 : this.yylloc.last_column + match[0].length}
	            this.yytext += match[0];
	            this.match += match[0];
	            this.yyleng = this.yytext.length;
	            this._more = false;
	            this._input = this._input.slice(match[0].length);
	            this.matched += match[0];
	            token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
	            if (this.done && this._input) this.done = false;
	            if (token) return token;
	            else return;
	        }
	        if (this._input === "") {
	            return this.EOF;
	        } else {
	            this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(), 
	                    {text: "", token: null, line: this.yylineno});
	        }
	    },
	lex:function lex() {
	        var r = this.next();
	        if (typeof r !== 'undefined') {
	            return r;
	        } else {
	            return this.lex();
	        }
	    },
	begin:function begin(condition) {
	        this.conditionStack.push(condition);
	    },
	popState:function popState() {
	        return this.conditionStack.pop();
	    },
	_currentRules:function _currentRules() {
	        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
	    },
	topState:function () {
	        return this.conditionStack[this.conditionStack.length-2];
	    },
	pushState:function begin(condition) {
	        this.begin(condition);
	    }});
	lexer.options = {};
	lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

	var YYSTATE=YY_START
	switch($avoiding_name_collisions) {
	case 0:/* skip whitespace */
	break;
	case 1:return 6
	break;
	case 2:yy_.yytext = yy_.yytext.substr(1,yy_.yyleng-2); return 4
	break;
	case 3:return 17
	break;
	case 4:return 18
	break;
	case 5:return 23
	break;
	case 6:return 24
	break;
	case 7:return 22
	break;
	case 8:return 21
	break;
	case 9:return 10
	break;
	case 10:return 11
	break;
	case 11:return 8
	break;
	case 12:return 14
	break;
	case 13:return 'INVALID'
	break;
	}
	};
	lexer.rules = [/^(?:\s+)/,/^(?:(-?([0-9]|[1-9][0-9]+))(\.[0-9]+)?([eE][-+]?[0-9]+)?\b)/,/^(?:"(?:\\[\\"bfnrt/]|\\u[a-fA-F0-9]{4}|[^\\\0-\x09\x0a-\x1f"])*")/,/^(?:\{)/,/^(?:\})/,/^(?:\[)/,/^(?:\])/,/^(?:,)/,/^(?::)/,/^(?:true\b)/,/^(?:false\b)/,/^(?:null\b)/,/^(?:$)/,/^(?:.)/];
	lexer.conditions = {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13],"inclusive":true}};


	;
	return lexer;})()
	parser.lexer = lexer;
	return parser;
	})();
	if (true) {
	  exports.parser = jsonlint;
	  exports.parse = jsonlint.parse.bind(jsonlint);
	}

/***/ },
/* 14 */
/***/ function(module, exports) {

	'use strict';

	var escapedChars = {
	  'b': '\b',
	  'f': '\f',
	  'n': '\n',
	  'r': '\r',
	  't': '\t',
	  '"': '"',
	  '/': '/',
	  '\\': '\\'
	};

	var A_CODE = 'a'.charCodeAt();


	exports.parse = function (source) {
	  var pointers = {};
	  var line = 0;
	  var column = 0;
	  var pos = 0;
	  return {
	    data: _parse('', true),
	    pointers: pointers
	  };

	  function _parse(ptr, topLevel) {
	    whitespace();
	    var data;
	    map(ptr, 'value');
	    var char = getChar();
	    switch (char) {
	      case 't': read('rue'); data = true; break;
	      case 'f': read('alse'); data = false; break;
	      case 'n': read('ull'); data = null; break;
	      case '"': data = parseString(); break;
	      case '[': data = parseArray(ptr); break;
	      case '{': data = parseObject(ptr); break;
	      default:
	        backChar();
	        if ('-0123456789'.indexOf(char) >= 0)
	          data = parseNumber();
	        else
	          unexpectedToken();
	    }
	    map(ptr, 'valueEnd');
	    whitespace();
	    if (topLevel && pos < source.length) unexpectedToken();
	    return data;
	  }

	  function whitespace() {
	    loop:
	      while (pos < source.length) {
	        switch (source[pos]) {
	          case ' ': column++; break;
	          case '\t': column += 4; break;
	          case '\r': column = 0; break;
	          case '\n': column = 0; line++; break;
	          default: break loop;
	        }
	        pos++;
	      }
	  }

	  function parseString() {
	    var str = '';
	    var char;
	    while (true) {
	      char = getChar();
	      if (char == '"') {
	        break;
	      } else if (char == '\\') {
	        char = getChar();
	        if (char in escapedChars)
	          str += escapedChars[char];
	        else if (char == 'u')
	          str += getCharCode();
	        else
	          wasUnexpectedToken();
	      } else {
	        str += char;
	      }
	    }
	    return str;
	  }

	  function parseNumber() {
	    var numStr = '';
	    if (source[pos] == '-') numStr += getChar();

	    numStr += source[pos] == '0'
	              ? getChar()
	              : getDigits();

	    if (source[pos] == '.')
	      numStr += getChar() + getDigits();

	    if (source[pos] == 'e' || source[pos] == 'E') {
	      numStr += getChar();
	      if (source[pos] == '+' || source[pos] == '-') numStr += getChar();
	      numStr += getDigits();
	    }

	    return +numStr;
	  }

	  function parseArray(ptr) {
	    whitespace();
	    var arr = [];
	    var i = 0;
	    if (getChar() == ']') return arr;
	    backChar();

	    while (true) {
	      var itemPtr = ptr + '/' + i;
	      arr.push(_parse(itemPtr));
	      whitespace();
	      var char = getChar();
	      if (char == ']') break;
	      if (char != ',') wasUnexpectedToken();
	      whitespace();
	      i++;
	    }
	    return arr;
	  }

	  function parseObject(ptr) {
	    whitespace();
	    var obj = {};
	    if (getChar() == '}') return obj;
	    backChar();

	    while (true) {
	      var loc = getLoc();
	      if (getChar() != '"') wasUnexpectedToken();
	      var key = parseString();
	      var propPtr = ptr + '/' + escapeJsonPointer(key);
	      mapLoc(propPtr, 'key', loc);
	      map(propPtr, 'keyEnd');
	      whitespace();
	      if (getChar() != ':') wasUnexpectedToken();
	      whitespace();
	      obj[key] = _parse(propPtr);
	      whitespace();
	      var char = getChar();
	      if (char == '}') break;
	      if (char != ',') wasUnexpectedToken();
	      whitespace();
	    }
	    return obj;
	  }

	  function read(str) {
	    for (var i=0; i<str.length; i++)
	      if (getChar() !== str[i]) wasUnexpectedToken();
	  }

	  function getChar() {
	    checkUnexpectedEnd();
	    var char = source[pos];
	    pos++;
	    column++; // new line?
	    return char;
	  }

	  function backChar() {
	    pos--;
	    column--;
	  }

	  function getCharCode() {
	    var count = 4;
	    var code = 0;
	    while (count--) {
	      code <<= 4;
	      var char = getChar().toLowerCase();
	      if (char >= 'a' && char <= 'f')
	        code += char.charCodeAt() - A_CODE + 10;
	      else if (char >= '0' && char <= '9')
	        code += +char;
	      else
	        wasUnexpectedToken();
	    }
	    return String.fromCharCode(code);
	  }

	  function getDigits() {
	    var digits = '';
	    while (source[pos] >= '0' && source[pos] <= '9')
	      digits += getChar();

	    if (digits.length) return digits;
	    checkUnexpectedEnd();
	    unexpectedToken();
	  }

	  function map(ptr, prop) {
	    mapLoc(ptr, prop, getLoc());
	  }

	  function mapLoc(ptr, prop, loc) {
	    pointers[ptr] = pointers[ptr] || {};
	    pointers[ptr][prop] = loc;
	  }

	  function getLoc() {
	    return {
	      line: line,
	      column: column,
	      pos: pos
	    };
	  }

	  function unexpectedToken() {
	    throw new SyntaxError('Unexpected token ' + source[pos] + ' in JSON at position ' + pos);
	  }

	  function wasUnexpectedToken() {
	    backChar();
	    unexpectedToken();
	  }

	  function checkUnexpectedEnd() {
	    if (pos >= source.length)
	      throw new SyntaxError('Unexpected end of JSON input');
	  }
	};


	exports.stringify = function (data, _, whitespace) {
	  if (!validType(data)) return;
	  var wsLine = 0;
	  var wsPos, wsColumn;
	  switch (typeof whitespace) {
	    case 'number':
	      var len = whitespace > 10
	                  ? 10
	                  : whitespace < 0
	                    ? 0
	                    : Math.floor(whitespace);
	      whitespace = len && repeat(len, ' ');
	      wsPos = len;
	      wsColumn = len;
	      break;
	    case 'string':
	      whitespace = whitespace.slice(0, 10);
	      wsPos = 0;
	      wsColumn = 0;
	      for (var j=0; j<whitespace.length; j++) {
	        var char = whitespace[j];
	        switch (char) {
	          case ' ': wsColumn++; break;
	          case '\t': wsColumn += 4; break;
	          case '\r': wsColumn = 0; break;
	          case '\n': wsColumn = 0; wsLine++; break;
	          default: throw new Error('whitespace characters not allowed in JSON');
	        }
	        wsPos++;
	      }
	      break;
	    default:
	      whitespace = undefined;
	  }

	  var json = '';
	  var pointers = {};
	  var line = 0;
	  var column = 0;
	  var pos = 0;
	  _stringify(data, 0, '');
	  return {
	    json: json,
	    pointers: pointers
	  };

	  function _stringify(_data, lvl, ptr) {
	    map(ptr, 'value');
	    switch (typeof _data) {
	      case 'number':
	      case 'boolean':
	        out('' + _data); break;
	      case 'string':
	        out(quoted(_data)); break;
	      case 'object':
	        if (_data === null)
	          out('null');
	        else if (typeof _data.toJSON == 'function')
	          out(quoted(_data.toJSON()));
	        else if (Array.isArray(_data))
	          stringifyArray();
	        else
	          stringifyObject();
	    }
	    map(ptr, 'valueEnd');

	    function stringifyArray() {
	      if (_data.length) {
	        out('[');
	        var itemLvl = lvl + 1;
	        for (var i=0; i<_data.length; i++) {
	          if (i) out(',');
	          indent(itemLvl);
	          var item = validType(_data[i]) ? _data[i] : null;
	          var itemPtr = ptr + '/' + i;
	          _stringify(item, itemLvl, itemPtr);
	        }
	        indent(lvl);
	        out(']');
	      } else {
	        out('[]');
	      }
	    }

	    function stringifyObject() {
	      var keys = Object.keys(_data);
	      if (keys.length) {
	        out('{');
	        var propLvl = lvl + 1;
	        for (var i=0; i<keys.length; i++) {
	          var key = keys[i];
	          var value = _data[key];
	          if (validType(value)) {
	            if (i) out(',');
	            var propPtr = ptr + '/' + escapeJsonPointer(key);
	            indent(propLvl);
	            map(propPtr, 'key');
	            out(quoted(key));
	            map(propPtr, 'keyEnd');
	            out(':');
	            if (whitespace) out(' ');
	            _stringify(value, propLvl, propPtr);
	          }
	        }
	        indent(lvl);
	        out('}');
	      } else {
	        out('{}');
	      }
	    }
	  }

	  function out(str) {
	    column += str.length;
	    pos += str.length;
	    json += str;
	  }

	  function indent(lvl) {
	    if (whitespace) {
	      json += '\n' + repeat(lvl, whitespace);
	      line++;
	      column = 0;
	      while (lvl--) {
	        if (wsLine) {
	          line += wsLine;
	          column = wsColumn;
	        } else {
	          column += wsColumn;
	        }
	        pos += wsPos;
	      }
	      pos += 1; // \n character
	    }
	  }

	  function map(ptr, prop) {
	    pointers[ptr] = pointers[ptr] || {};
	    pointers[ptr][prop] = {
	      line: line,
	      column: column,
	      pos: pos
	    };
	  }

	  function repeat(n, str) {
	    return Array(n + 1).join(str);
	  }
	};


	var VALID_TYPES = ['number', 'boolean', 'string', 'object'];
	function validType(data) {
	  return VALID_TYPES.indexOf(typeof data) >= 0;
	}


	var ESC_QUOTE = /"|\\/g;
	var ESC_B = /[\b]/g;
	var ESC_F = /\f/g;
	var ESC_N = /\n/g;
	var ESC_R = /\r/g;
	var ESC_T = /\t/g;
	function quoted(str) {
	  str = str.replace(ESC_QUOTE, '\\$&')
	           .replace(ESC_F, '\\f')
	           .replace(ESC_B, '\\b')
	           .replace(ESC_N, '\\n')
	           .replace(ESC_R, '\\r')
	           .replace(ESC_T, '\\t');
	  return '"' + str + '"';
	}


	var ESC_0 = /~/g;
	var ESC_1 = /\//g;
	function escapeJsonPointer(str) {
	  return str.replace(ESC_0, '~0')
	            .replace(ESC_1, '~1');
	}


/***/ },
/* 15 */
/***/ function(module, exports) {

	'use strict';

	var _locales = ['en', 'pt-BR'];
	var _defs = {
	  en: {
	    array: 'Array',
	    auto: 'Auto',
	    appendText: 'Append',
	    appendTitle: 'Append a new field with type \'auto\' after this field (Ctrl+Shift+Ins)',
	    appendSubmenuTitle: 'Select the type of the field to be appended',
	    appendTitleAuto: 'Append a new field with type \'auto\' (Ctrl+Shift+Ins)',
	    ascending: 'Ascending',
	    ascendingTitle: 'Sort the childs of this ${type} in ascending order',
	    actionsMenu: 'Click to open the actions menu (Ctrl+M)',
	    collapseAll: 'Collapse all fields',
	    descending: 'Descending',
	    descendingTitle: 'Sort the childs of this ${type} in descending order',
	    drag: 'Drag to move this field (Alt+Shift+Arrows)',
	    duplicateKey: 'duplicate key',
	    duplicateText: 'Duplicate',
	    duplicateTitle: 'Duplicate selected fields (Ctrl+D)',
	    duplicateField: 'Duplicate this field (Ctrl+D)',
	    empty: 'empty',
	    expandAll: 'Expand all fields',
	    expandTitle: 'Click to expand/collapse this field (Ctrl+E). \n' +
	      'Ctrl+Click to expand/collapse including all childs.',
	    insert: 'Insert',
	    insertTitle: 'Insert a new field with type \'auto\' before this field (Ctrl+Ins)',
	    insertSub: 'Select the type of the field to be inserted',
	    object: 'Object',
	    ok: 'Ok',
	    redo: 'Redo (Ctrl+Shift+Z)',
	    removeText: 'Remove',
	    removeTitle: 'Remove selected fields (Ctrl+Del)',
	    removeField: 'Remove this field (Ctrl+Del)',
	    selectNode: 'Select a node...',
	    showAll: 'show all',
	    showMore: 'show more',
	    showMoreStatus: 'displaying ${visibleChilds} of ${totalChilds} items.',
	    sort: 'Sort',
	    sortTitle: 'Sort the childs of this ${type}',
	    sortTitleShort: 'Sort contents',
	    sortFieldLabel: 'Field:',
	    sortDirectionLabel: 'Direction:',
	    sortFieldTitle: 'Select the nested field by which to sort the array or object',
	    sortAscending: 'Ascending',
	    sortAscendingTitle: 'Sort the selected field in ascending order',
	    sortDescending: 'Descending',
	    sortDescendingTitle: 'Sort the selected field in descending order',
	    string: 'String',
	    transform: 'Transform',
	    transformTitle: 'Filter, sort, or transform the childs of this ${type}',
	    transformTitleShort: 'Filter, sort, or transform contents',
	    transformQueryTitle: 'Enter a JMESPath query',
	    transformWizardLabel: 'Wizard',
	    transformWizardFilter: 'Filter',
	    transformWizardSortBy: 'Sort by',
	    transformWizardSelectFields: 'Select fields',
	    transformQueryLabel: 'Query',
	    transformPreviewLabel: 'Preview',
	    type: 'Type',
	    typeTitle: 'Change the type of this field',
	    openUrl: 'Ctrl+Click or Ctrl+Enter to open url in new window',
	    undo: 'Undo last action (Ctrl+Z)',
	    validationCannotMove: 'Cannot move a field into a child of itself',
	    autoType: 'Field type "auto". ' +
	      'The field type is automatically determined from the value ' +
	      'and can be a string, number, boolean, or null.',
	    objectType: 'Field type "object". ' +
	      'An object contains an unordered set of key/value pairs.',
	    arrayType: 'Field type "array". ' +
	      'An array contains an ordered collection of values.',
	    stringType: 'Field type "string". ' +
	      'Field type is not determined from the value, ' +
	      'but always returned as string.',
	    modeCodeText: 'Code',
	    modeCodeTitle: 'Switch to code highlighter',
	    modeFormText: 'Form',
	    modeFormTitle: 'Switch to form editor',
	    modeTextText: 'Text',
	    modeTextTitle: 'Switch to plain text editor',
	    modeTreeText: 'Tree',
	    modeTreeTitle: 'Switch to tree editor',
	    modeViewText: 'View',
	    modeViewTitle: 'Switch to tree view',
	  },
	  'pt-BR': {
	    array: 'Lista',
	    auto: 'Automatico',
	    appendText: 'Adicionar',
	    appendTitle: 'Adicionar novo campo com tipo \'auto\' depois deste campo (Ctrl+Shift+Ins)',
	    appendSubmenuTitle: 'Selecione o tipo do campo a ser adicionado',
	    appendTitleAuto: 'Adicionar novo campo com tipo \'auto\' (Ctrl+Shift+Ins)',
	    ascending: 'Ascendente',
	    ascendingTitle: 'Organizar filhor do tipo ${type} em crescente',
	    actionsMenu: 'Clique para abrir o menu de ações (Ctrl+M)',
	    collapseAll: 'Fechar todos campos',
	    descending: 'Descendente',
	    descendingTitle: 'Organizar o filhos do tipo ${type} em decrescente',
	    duplicateKey: 'chave duplicada',
	    drag: 'Arraste para mover este campo (Alt+Shift+Arrows)',
	    duplicateText: 'Duplicar',
	    duplicateTitle: 'Duplicar campos selecionados (Ctrl+D)',
	    duplicateField: 'Duplicar este campo (Ctrl+D)',
	    empty: 'vazio',
	    expandAll: 'Expandir todos campos',
	    expandTitle: 'Clique para expandir/encolher este campo (Ctrl+E). \n' +
	      'Ctrl+Click para expandir/encolher incluindo todos os filhos.',
	    insert: 'Inserir',
	    insertTitle: 'Inserir um novo campo do tipo \'auto\' antes deste campo (Ctrl+Ins)',
	    insertSub: 'Selecionar o tipo de campo a ser inserido',
	    object: 'Objeto',
	    ok: 'Ok',
	    redo: 'Refazer (Ctrl+Shift+Z)',
	    removeText: 'Remover',
	    removeTitle: 'Remover campos selecionados (Ctrl+Del)',
	    removeField: 'Remover este campo (Ctrl+Del)',
	    // TODO: correctly translate
	    selectNode: 'Select a node...',
	    // TODO: correctly translate
	    showAll: 'mostre tudo',
	    // TODO: correctly translate
	    showMore: 'mostre mais',
	    // TODO: correctly translate
	    showMoreStatus: 'exibindo ${visibleChilds} de ${totalChilds} itens.',
	    sort: 'Organizar',
	    sortTitle: 'Organizar os filhos deste ${type}',
	    // TODO: correctly translate
	    sortTitleShort: 'Organizar os filhos',
	    // TODO: correctly translate
	    sortFieldLabel: 'Field:',
	    // TODO: correctly translate
	    sortDirectionLabel: 'Direction:',
	    // TODO: correctly translate
	    sortFieldTitle: 'Select the nested field by which to sort the array or object',
	    // TODO: correctly translate
	    sortAscending: 'Ascending',
	    // TODO: correctly translate
	    sortAscendingTitle: 'Sort the selected field in ascending order',
	    // TODO: correctly translate
	    sortDescending: 'Descending',
	    // TODO: correctly translate
	    sortDescendingTitle: 'Sort the selected field in descending order',
	    string: 'Texto',
	    // TODO: correctly translate
	    transform: 'Transform',
	    // TODO: correctly translate
	    transformTitle: 'Filter, sort, or transform the childs of this ${type}',
	    // TODO: correctly translate
	    transformTitleShort: 'Filter, sort, or transform contents',
	    // TODO: correctly translate
	    transformQueryTitle: 'Enter a JMESPath query',
	    // TODO: correctly translate
	    transformWizardLabel: 'Wizard',
	    // TODO: correctly translate
	    transformWizardFilter: 'Filter',
	    // TODO: correctly translate
	    transformWizardSortBy: 'Sort by',
	    // TODO: correctly translate
	    transformWizardSelectFields: 'Select fields',
	    // TODO: correctly translate
	    transformQueryLabel: 'Query',
	    // TODO: correctly translate
	    transformPreviewLabel: 'Preview',
	    type: 'Tipo',
	    typeTitle: 'Mudar o tipo deste campo',
	    openUrl: 'Ctrl+Click ou Ctrl+Enter para abrir link em nova janela',
	    undo: 'Desfazer último ação (Ctrl+Z)',
	    validationCannotMove: 'Não pode mover um campo como filho dele mesmo',
	    autoType: 'Campo do tipo "auto". ' +
	      'O tipo do campo é determinao automaticamente a partir do seu valor ' +
	      'e pode ser texto, número, verdade/falso ou nulo.',
	    objectType: 'Campo do tipo "objeto". ' +
	      'Um objeto contém uma lista de pares com chave e valor.',
	    arrayType: 'Campo do tipo "lista". ' +
	      'Uma lista contem uma coleção de valores ordenados.',
	    stringType: 'Campo do tipo "string". ' +
	      'Campo do tipo nao é determinado através do seu valor, ' +
	      'mas sempre retornara um texto.'
	  }
	};

	var _defaultLang = 'en';
	var _lang;
	var userLang = typeof navigator !== 'undefined' ?
	  navigator.language || navigator.userLanguage :
	  undefined;
	_lang = _locales.find(function (l) {
	  return l === userLang;
	});
	if (!_lang) {
	  _lang = _defaultLang;
	}

	module.exports = {
	  // supported locales
	  _locales: _locales,
	  _defs: _defs,
	  _lang: _lang,
	  setLanguage: function (lang) {
	    if (!lang) {
	      return;
	    }
	    var langFound = _locales.find(function (l) {
	      return l === lang;
	    });
	    if (langFound) {
	      _lang = langFound;
	    } else {
	      console.error('Language not found');
	    }
	  },
	  setLanguages: function (languages) {
	    if (!languages) {
	      return;
	    }
	    for (var key in languages) {
	      var langFound = _locales.find(function (l) {
	        return l === key;
	      });
	      if (!langFound) {
	        _locales.push(key);
	      }
	      _defs[key] = Object.assign({}, _defs[_defaultLang], _defs[key], languages[key]);
	    }
	  },
	  translate: function (key, data, lang) {
	    if (!lang) {
	      lang = _lang;
	    }
	    var text = _defs[lang][key];
	    if (data) {
	      for (key in data) {
	        text = text.replace('${' + key + '}', data[key]);
	      }
	    }
	    return text || key;
	  }
	};

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var ContextMenu = __webpack_require__(10);
	var translate = __webpack_require__(15).translate;
	var util = __webpack_require__(12);

	/**
	 * Creates a component that visualize path selection in tree based editors
	 * @param {HTMLElement} container 
	 * @param {HTMLElement} root
	 * @constructor
	 */
	function TreePath(container, root) {
	  if (container) {
	    this.root = root;
	    this.path = document.createElement('div');
	    this.path.className = 'jsoneditor-treepath';
	    this.path.setAttribute('tabindex',0);
	    this.contentMenuClicked;
	    container.appendChild(this.path);
	    this.reset();
	  }
	}

	/**
	 * Reset component to initial status
	 */
	TreePath.prototype.reset = function () {
	  this.path.innerHTML = translate('selectNode');
	};

	/**
	 * Renders the component UI according to a given path objects
	 * @param {Array<{name: String, childs: Array}>} pathObjs a list of path objects
	 * 
	 */
	TreePath.prototype.setPath = function (pathObjs) {
	  var me = this;

	  this.path.innerHTML = '';

	  if (pathObjs && pathObjs.length) {
	    pathObjs.forEach(function (pathObj, idx) {
	      var pathEl = document.createElement('span');
	      var sepEl;
	      pathEl.className = 'jsoneditor-treepath-element';
	      pathEl.innerText = pathObj.name;
	      pathEl.onclick = _onSegmentClick.bind(me, pathObj);
	  
	      me.path.appendChild(pathEl);

	      if (pathObj.children.length) {
	        sepEl = document.createElement('span');
	        sepEl.className = 'jsoneditor-treepath-seperator';
	        sepEl.innerHTML = '&#9658;';

	        sepEl.onclick = function () {
	          me.contentMenuClicked = true;
	          var items = [];
	          pathObj.children.forEach(function (child) {
	            items.push({
	              'text': child.name,
	              'className': 'jsoneditor-type-modes' + (pathObjs[idx + 1] + 1 && pathObjs[idx + 1].name === child.name ? ' jsoneditor-selected' : ''),
	              'click': _onContextMenuItemClick.bind(me, pathObj, child.name)
	            });
	          });
	          var menu = new ContextMenu(items);
	          menu.show(sepEl, me.root, true);
	        };

	        me.path.appendChild(sepEl);
	      }

	      if(idx === pathObjs.length - 1) {
	        var leftRectPos = (sepEl || pathEl).getBoundingClientRect().right;
	        if(me.path.offsetWidth < leftRectPos) {
	          me.path.scrollLeft = leftRectPos;
	        }

	        if (me.path.scrollLeft) {
	          var showAllBtn = document.createElement('span');
	          showAllBtn.className = 'jsoneditor-treepath-show-all-btn';
	          showAllBtn.title = 'show all path';
	          showAllBtn.innerHTML = '...';
	          showAllBtn.onclick = _onShowAllClick.bind(me, pathObjs);
	          me.path.insertBefore(showAllBtn, me.path.firstChild);
	        }
	      }
	    });
	  }

	  function _onShowAllClick(pathObjs) {
	    me.contentMenuClicked = false;
	    util.addClassName(me.path, 'show-all');
	    me.path.style.width = me.path.parentNode.getBoundingClientRect().width - 10 + 'px';
	    me.path.onblur = function() {
	      if (me.contentMenuClicked) {
	        me.contentMenuClicked = false;
	        me.path.focus();
	        return;
	      }
	      util.removeClassName(me.path, 'show-all');
	      me.path.onblur = undefined;
	      me.path.style.width = '';
	      me.setPath(pathObjs);
	    };
	  }

	  function _onSegmentClick(pathObj) {
	    if (this.selectionCallback) {
	      this.selectionCallback(pathObj);
	    }
	  }

	  function _onContextMenuItemClick(pathObj, selection) {
	    if (this.contextMenuCallback) {
	      this.contextMenuCallback(pathObj, selection);
	    }
	  }
	};

	/**
	 * set a callback function for selection of path section
	 * @param {Function} callback function to invoke when section is selected
	 */
	TreePath.prototype.onSectionSelected = function (callback) {
	  if (typeof callback === 'function') {
	    this.selectionCallback = callback;      
	  }
	};

	/**
	 * set a callback function for selection of path section
	 * @param {Function} callback function to invoke when section is selected
	 */
	TreePath.prototype.onContextMenuItemSelected = function (callback) {
	  if (typeof callback === 'function') {
	    this.contextMenuCallback = callback;
	  }
	};

	module.exports = TreePath;

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var jmespath = __webpack_require__(18);
	var naturalSort = __webpack_require__(19);
	var createAbsoluteAnchor = __webpack_require__(11).createAbsoluteAnchor;
	var ContextMenu = __webpack_require__(10);
	var appendNodeFactory = __webpack_require__(20);
	var showMoreNodeFactory = __webpack_require__(21);
	var showSortModal = __webpack_require__(22);
	var showTransformModal = __webpack_require__(24);
	var util = __webpack_require__(12);
	var translate = __webpack_require__(15).translate;

	var DEFAULT_MODAL_ANCHOR = document.body; // TODO: this constant is defined twice

	var YEAR_2000 = 946684800000;

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
	    if ('value' in params) {
	      this.setValue(params.value, params.type);
	    }
	    if ('internalValue' in params) {
	      this.setInternalValue(params.internalValue);
	    }
	  }
	  else {
	    this.setField('');
	    this.setValue(null);
	  }

	  this._debouncedOnChangeValue = util.debounce(this._onChangeValue.bind(this), Node.prototype.DEBOUNCE_INTERVAL);
	  this._debouncedOnChangeField = util.debounce(this._onChangeField.bind(this), Node.prototype.DEBOUNCE_INTERVAL);

	  // starting value for visible children
	  this.visibleChilds = this.getMaxVisibleChilds();
	}

	// debounce interval for keyboard input in milliseconds
	Node.prototype.DEBOUNCE_INTERVAL = 150;

	// search will stop iterating as soon as the max is reached
	Node.prototype.MAX_SEARCH_RESULTS = 999;

	// default number of child nodes to display 
	var DEFAULT_MAX_VISIBLE_CHILDS = 100;

	Node.prototype.getMaxVisibleChilds = function() {
	  return (this.editor && this.editor.options && this.editor.options.maxVisibleChilds)
	      ? this.editor.options.maxVisibleChilds
	      : DEFAULT_MAX_VISIBLE_CHILDS;
	}

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
	 * @return {{string|number}[]} Array containing the path to this node.
	 * Element is a number if is the index of an array, a string otherwise.
	 */
	Node.prototype.getPath = function () {
	  var node = this;
	  var path = [];
	  while (node) {
	    var field = node.getName();
	    if (field !== undefined) {
	      path.unshift(field);
	    }
	    node = node.parent;
	  }
	  return path;
	};

	/**
	 * Get the internal path of this node, a list with the child indexes.
	 * @return {String[]} Array containing the internal path to this node
	 */
	Node.prototype.getInternalPath = function () {
	  var node = this;
	  var internalPath = [];
	  while (node) {
	    if (node.parent) {
	      internalPath.unshift(node.getIndex());
	    }
	    node = node.parent;
	  }
	  return internalPath;
	};

	/**
	 * Get node serializable name
	 * @returns {String|Number}
	 */
	Node.prototype.getName = function () {
	 return !this.parent
	 ? undefined  // do not add an (optional) field name of the root node
	 :  (this.parent.type != 'array')
	     ? this.field
	     : this.index;
	};

	/**
	 * Find child node by serializable path
	 * @param {Array<String>} path
	 */
	Node.prototype.findNodeByPath = function (path) {
	  if (!path) {
	    return;
	  }

	  if (path.length == 0) {
	    return this;
	  }

	  if (path.length && this.childs && this.childs.length) {
	    for (var i=0; i < this.childs.length; ++i) {
	      if (('' + path[0]) === ('' + this.childs[i].getName())) {
	        return this.childs[i].findNodeByPath(path.slice(1));
	      }
	    }
	  }
	};

	/**
	 * Find child node by an internal path: the indexes of the childs nodes
	 * @param {Array<String>} internalPath
	 * @return {Node | undefined} Returns the node if the path exists.
	 *                            Returns undefined otherwise.
	 */
	Node.prototype.findNodeByInternalPath = function (internalPath) {
	  if (!internalPath) {
	    return undefined;
	  }

	  var node = this;
	  for (var i = 0; i < internalPath.length && node; i++) {
	    var childIndex = internalPath[i];
	    node = node.childs[childIndex];
	  }

	  return node;
	};

	/**
	 * @typedef {{value: String|Object|Number|Boolean, path: Array.<String|Number>}} SerializableNode
	 *
	 * Returns serializable representation for the node
	 * @return {SerializableNode}
	 */
	Node.prototype.serialize = function () {
	  return {
	    value: this.getValue(),
	    path: this.getPath()
	  };
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
	  this.error = error;
	  this.errorChild = child;

	  if (this.dom && this.dom.tr) {
	    this.updateError();
	  }
	};

	/**
	 * Render the error
	 */
	Node.prototype.updateError = function() {
	  var error = this.error;
	  var tdError = this.dom.tdError;
	  if (error && this.dom && this.dom.tr) {
	    util.addClassName(this.dom.tr, 'jsoneditor-validation-error');

	    if (!tdError) {
	      tdError = document.createElement('td');
	      this.dom.tdError = tdError;
	      this.dom.tdValue.parentNode.appendChild(tdError);
	    }

	    var popover = document.createElement('div');
	    popover.className = 'jsoneditor-popover jsoneditor-right';
	    popover.appendChild(document.createTextNode(error.message));

	    var button = document.createElement('button');
	    button.type = 'button';
	    button.className = 'jsoneditor-button jsoneditor-schema-error';
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
	    var child = this.errorChild;
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
	    if (this.dom.tr) {
	      util.removeClassName(this.dom.tr, 'jsoneditor-validation-error');
	    }

	    if (tdError) {
	      this.dom.tdError.parentNode.removeChild(this.dom.tdError);
	      delete this.dom.tdError;
	    }
	  }
	};

	/**
	 * Get the index of this node: the index in the list of childs where this
	 * node is part of
	 * @return {number | null} Returns the index, or null if this is the root node
	 */
	Node.prototype.getIndex = function () {
	  if (this.parent) {
	    var index = this.parent.childs.indexOf(this);
	    return index !== -1 ? index : null;
	  }
	  else {
	    return -1;
	  }
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
	  var childValue, child, visible;
	  var i, j;
	  var notUpdateDom = false;
	  var previousChilds = this.childs;

	  this.type = this._getType(value);

	  // check if type corresponds with the provided type
	  if (type && type !== this.type) {
	    if (type === 'string' && this.type === 'auto') {
	      this.type = type;
	    }
	    else {
	      throw new Error('Type mismatch: ' +
	          'cannot cast value of type "' + this.type +
	          ' to the specified type "' + type + '"');
	    }
	  }

	  if (this.type === 'array') {
	    // array
	    if (!this.childs) {
	      this.childs = [];
	    }

	    for (i = 0; i < value.length; i++) {
	      childValue = value[i];
	      if (childValue !== undefined && !(childValue instanceof Function)) {
	        if (i < this.childs.length) {
	          // reuse existing child, keep its state
	          child = this.childs[i];

	          child.fieldEditable = false;
	          child.index = i;
	          child.setValue(childValue);
	        }
	        else {
	          // create a new child
	          child = new Node(this.editor, {
	            value: childValue
	          });
	          visible = i < this.getMaxVisibleChilds();
	          this.appendChild(child, visible, notUpdateDom);
	        }
	      }
	    }

	    // cleanup redundant childs
	    // we loop backward to prevent issues with shifting index numbers
	    for (j = this.childs.length; j >= value.length; j--) {
	      this.removeChild(this.childs[j], notUpdateDom);
	    }
	  }
	  else if (this.type === 'object') {
	    // object
	    if (!this.childs) {
	      this.childs = [];
	    }

	    // cleanup redundant childs
	    // we loop backward to prevent issues with shifting index numbers
	    for (j = this.childs.length - 1; j >= 0; j--) {
	      if (!value.hasOwnProperty(this.childs[j].field)) {
	        this.removeChild(this.childs[j], notUpdateDom);
	      }
	    }

	    i = 0;
	    for (var childField in value) {
	      if (value.hasOwnProperty(childField)) {
	        childValue = value[childField];
	        if (childValue !== undefined && !(childValue instanceof Function)) {
	          child = this.findChildByProperty(childField);

	          if (child) {
	            // reuse existing child, keep its state
	            child.setField(childField, true);
	            child.setValue(childValue);
	          }
	          else {
	            // create a new child
	            child = new Node(this.editor, {
	              field: childField,
	              value: childValue
	            });
	            visible = i < this.getMaxVisibleChilds();
	            this.appendChild(child, visible, notUpdateDom);
	          }
	        }
	        i++;
	      }

	    }
	    this.value = '';

	    // sort object keys
	    if (this.editor.options.sortObjectKeys === true) {
	      this.sort([], 'asc');
	    }
	  }
	  else {
	    // value
	    this.hideChilds();

	    delete this.append;
	    delete this.showMore;
	    delete this.expanded;
	    delete this.childs;

	    this.value = value;
	  }

	  // recreate the DOM if switching from an object/array to auto/string or vice versa
	  // needed to recreated the expand button for example
	  if (Array.isArray(previousChilds) !== Array.isArray(this.childs)) {
	    this.recreateDom();
	  }

	  this.updateDom({'updateIndexes': true});

	  this.previousValue = this.value; // used only to check for changes in DOM vs JS model
	};

	/**
	 * Set internal value
	 * @param {*} internalValue  Internal value structure keeping type,
	 *                           order and duplicates in objects
	 */
	Node.prototype.setInternalValue = function(internalValue) {
	  var childValue, child, visible;
	  var i, j;
	  var notUpdateDom = false;
	  var previousChilds = this.childs;

	  this.type = internalValue.type;

	  if (internalValue.type === 'array') {
	    // array
	    if (!this.childs) {
	      this.childs = [];
	    }

	    for (i = 0; i < internalValue.childs.length; i++) {
	      childValue = internalValue.childs[i];
	      if (childValue !== undefined && !(childValue instanceof Function)) {
	        if (i < this.childs.length) {
	          // reuse existing child, keep its state
	          child = this.childs[i];

	          child.fieldEditable = false;
	          child.index = i;
	          child.setInternalValue(childValue);
	        }
	        else {
	          // create a new child
	          child = new Node(this.editor, {
	            internalValue: childValue
	          });
	          visible = i < this.getMaxVisibleChilds();
	          this.appendChild(child, visible, notUpdateDom);
	        }
	      }
	    }

	    // cleanup redundant childs
	    // we loop backward to prevent issues with shifting index numbers
	    for (j = this.childs.length; j >= internalValue.childs.length; j--) {
	      this.removeChild(this.childs[j], notUpdateDom);
	    }
	  }
	  else if (internalValue.type === 'object') {
	    // object
	    if (!this.childs) {
	      this.childs = [];
	    }

	    for (i = 0; i < internalValue.childs.length; i++) {
	      childValue = internalValue.childs[i];
	      if (childValue !== undefined && !(childValue instanceof Function)) {
	        if (i < this.childs.length) {
	          // reuse existing child, keep its state
	          child = this.childs[i];

	          delete child.index;
	          child.setField(childValue.field, true);
	          child.setInternalValue(childValue.value);
	        }
	        else {
	          // create a new child
	          child = new Node(this.editor, {
	            field: childValue.field,
	            internalValue: childValue.value
	          });
	          visible = i < this.getMaxVisibleChilds();
	          this.appendChild(child, visible, notUpdateDom);
	        }
	      }
	    }

	    // cleanup redundant childs
	    // we loop backward to prevent issues with shifting index numbers
	    for (j = this.childs.length; j >= internalValue.childs.length; j--) {
	      this.removeChild(this.childs[j], notUpdateDom);
	    }
	  }
	  else {
	    // value
	    this.hideChilds();

	    delete this.append;
	    delete this.showMore;
	    delete this.expanded;
	    delete this.childs;

	    this.value = internalValue.value;
	  }

	  // recreate the DOM if switching from an object/array to auto/string or vice versa
	  // needed to recreated the expand button for example
	  if (Array.isArray(previousChilds) !== Array.isArray(this.childs)) {
	    this.recreateDom();
	  }

	  this.updateDom({'updateIndexes': true});

	  this.previousValue = this.value; // used only to check for changes in DOM vs JS model
	};

	/**
	 * Remove the DOM of this node and it's childs and recreate it again
	 */
	Node.prototype.recreateDom = function() {
	  if (this.dom && this.dom.tr && this.dom.tr.parentNode) {
	    var domAnchor = this._detachFromDom();

	    this.clearDom();

	    this._attachToDom(domAnchor);
	  }
	  else {
	    this.clearDom();
	  }
	};

	/**
	 * Get value. Value is a JSON structure
	 * @return {*} value
	 */
	Node.prototype.getValue = function() {
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
	 * Get internal value, a structure which maintains ordering and duplicates in objects
	 * @return {*} value
	 */
	Node.prototype.getInternalValue = function() {
	  if (this.type === 'array') {
	    return {
	      type: this.type,
	      childs: this.childs.map (function (child) {
	        return child.getInternalValue();
	      })
	    };
	  }
	  else if (this.type === 'object') {
	    return {
	      type: this.type,
	      childs: this.childs.map(function (child) {
	        return {
	          field: child.getField(),
	          value: child.getInternalValue()
	        }
	      })
	    };
	  }
	  else {
	    if (this.value === undefined) {
	      this._getDomValue();
	    }

	    return {
	      type: this.type,
	      value: this.value
	    };
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
	 * Get jsonpath of the current node
	 * @return {Node[]} Returns an array with nodes
	 */
	Node.prototype.getNodePath = function () {
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
	  clone.previousField = this.previousField;
	  clone.value = this.value;
	  clone.valueInnerText = this.valueInnerText;
	  clone.previousValue = this.previousValue;
	  clone.expanded = this.expanded;
	  clone.visibleChilds = this.visibleChilds;

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
	    this.dom.expand.className = 'jsoneditor-button jsoneditor-expanded';
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
	    this.dom.expand.className = 'jsoneditor-button jsoneditor-collapsed';
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
	    var append = this.getAppendDom();
	    if (!append.parentNode) {
	      var nextTr = tr.nextSibling;
	      if (nextTr) {
	        table.insertBefore(append, nextTr);
	      }
	      else {
	        table.appendChild(append);
	      }
	    }

	    // show childs
	    var iMax = Math.min(this.childs.length, this.visibleChilds);
	    var nextTr = this._getNextTr();
	    for (var i = 0; i < iMax; i++) {
	      var child = this.childs[i];
	      if (!child.getDom().parentNode) {
	        table.insertBefore(child.getDom(), nextTr);
	      }
	      child.showChilds();
	    }

	    // show "show more childs" if limited
	    var showMore = this.getShowMoreDom();
	    var nextTr = this._getNextTr();
	    if (!showMore.parentNode) {
	      table.insertBefore(showMore, nextTr);
	    }
	    this.showMore.updateDom(); // to update the counter
	  }
	};

	Node.prototype._getNextTr = function() {
	  if (this.showMore && this.showMore.getDom().parentNode) {
	    return this.showMore.getDom();
	  }

	  if (this.append && this.append.getDom().parentNode) {
	    return this.append.getDom();
	  }
	};

	/**
	 * Hide the node with all its childs
	 * @param {{resetVisibleChilds: boolean}} [options]
	 */
	Node.prototype.hide = function(options) {
	  var tr = this.dom.tr;
	  var table = tr ? tr.parentNode : undefined;
	  if (table) {
	    table.removeChild(tr);
	  }
	  this.hideChilds(options);
	};


	/**
	 * Recursively hide all childs
	 * @param {{resetVisibleChilds: boolean}} [options]
	 */
	Node.prototype.hideChilds = function(options) {
	  var childs = this.childs;
	  if (!childs) {
	    return;
	  }
	  if (!this.expanded) {
	    return;
	  }

	  // hide append row
	  var append = this.getAppendDom();
	  if (append.parentNode) {
	    append.parentNode.removeChild(append);
	  }

	  // hide childs
	  this.childs.forEach(function (child) {
	    child.hide();
	  });

	  // hide "show more" row
	  var showMore = this.getShowMoreDom();
	  if (showMore.parentNode) {
	    showMore.parentNode.removeChild(showMore);
	  }

	  // reset max visible childs
	  if (!options || options.resetVisibleChilds) {
	    this.visibleChilds = this.getMaxVisibleChilds();
	  }
	};

	/**
	 * set custom css classes on a node
	 */
	Node.prototype._updateCssClassName = function () {
	  if(this.dom.field
	    && this.editor 
	    && this.editor.options 
	    && typeof this.editor.options.onClassName ==='function'
	    && this.dom.tree){              
	      util.removeAllClassNames(this.dom.tree);              
	      var addClasses = this.editor.options.onClassName({ path: this.getPath(), field: this.field, value: this.value }) || "";
	      util.addClassName(this.dom.tree, "jsoneditor-values " + addClasses);
	  }
	};

	Node.prototype.recursivelyUpdateCssClassesOnNodes = function () {  
	  this._updateCssClassName();
	  if (this.childs !== 'undefined') {
	    for (var i = 0; i < this.childs.length; i++) {
	      this.childs[i].recursivelyUpdateCssClassesOnNodes();
	    }
	  }  
	}

	/**
	 * Goes through the path from the node to the root and ensures that it is expanded
	 */
	Node.prototype.expandTo = function() {
	  var currentNode = this.parent;
	  while (currentNode) {
	    if (!currentNode.expanded) {
	      currentNode.expand();
	    }
	    currentNode = currentNode.parent;
	  }
	};


	/**
	 * Add a new child to the node.
	 * Only applicable when Node value is of type array or object
	 * @param {Node} node
	 * @param {boolean} [visible] If true (default), the child will be rendered
	 * @param {boolean} [updateDom]  If true (default), the DOM of both parent
	 *                               node and appended node will be updated
	 *                               (child count, indexes)
	 */
	Node.prototype.appendChild = function(node, visible, updateDom) {
	  if (this._hasChilds()) {
	    // adjust the link to the parent
	    node.setParent(this);
	    node.fieldEditable = (this.type == 'object');
	    if (this.type == 'array') {
	      node.index = this.childs.length;
	    }
	    if (this.type === 'object' && node.field == undefined) {
	      // initialize field value if needed
	      node.setField('');
	    }
	    this.childs.push(node);

	    if (this.expanded && visible !== false) {
	      // insert into the DOM, before the appendRow
	      var newTr = node.getDom();
	      var nextTr = this._getNextTr();
	      var table = nextTr ? nextTr.parentNode : undefined;
	      if (nextTr && table) {
	        table.insertBefore(newTr, nextTr);
	      }

	      node.showChilds();

	      this.visibleChilds++;
	    }

	    if (updateDom !== false) {
	      this.updateDom({'updateIndexes': true});
	      node.updateDom({'recurse': true});
	    }
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

	    if (beforeNode instanceof AppendNode || !beforeNode) {
	      // the this.childs.length + 1 is to reckon with the node that we're about to add
	      if (this.childs.length + 1 > this.visibleChilds) {
	        var lastVisibleNode = this.childs[this.visibleChilds - 1];
	        this.insertBefore(node, lastVisibleNode);
	      }
	      else {
	        this.appendChild(node);
	      }
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
	 * Insert a new child before a given node
	 * Only applicable when Node value is of type array or object
	 * @param {Node} node
	 * @param {Node} beforeNode
	 */
	Node.prototype.insertBefore = function(node, beforeNode) {
	  if (this._hasChilds()) {
	    this.visibleChilds++;

	    // initialize field value if needed
	    if (this.type === 'object' && node.field == undefined) {
	      node.setField('');
	    }

	    if (beforeNode === this.append) {
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
	      this.showChilds();
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
	 * Searches are case insensitive.
	 * @param {String} text
	 * @param {Node[]} [results] Array where search results will be added
	 *                           used to count and limit the results whilst iterating
	 * @return {Node[]} results  Array with nodes containing the search text
	 */
	Node.prototype.search = function(text, results) {
	  if (!Array.isArray(results)) {
	    results = [];
	  }
	  var index;
	  var search = text ? text.toLowerCase() : undefined;

	  // delete old search data
	  delete this.searchField;
	  delete this.searchValue;

	  // search in field
	  if (this.field !== undefined && results.length <= this.MAX_SEARCH_RESULTS) {
	    var field = String(this.field).toLowerCase();
	    index = field.indexOf(search);
	    if (index !== -1) {
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
	      this.childs.forEach(function (child) {
	        child.search(text, results);
	      });
	    }
	  }
	  else {
	    // string, auto
	    if (this.value !== undefined  && results.length <= this.MAX_SEARCH_RESULTS) {
	      var value = String(this.value).toLowerCase();
	      index = value.indexOf(search);
	      if (index !== -1) {
	        this.searchValue = true;
	        results.push({
	          'node': this,
	          'elem': 'value'
	        });
	      }

	      // update dom
	      this._updateDomValue();
	    }
	  }

	  return results;
	};

	/**
	 * Move the scroll position such that this node is in the visible area.
	 * The node will not get the focus
	 * @param {function(boolean)} [callback]
	 */
	Node.prototype.scrollTo = function(callback) {
	  this.expandPathToNode();

	  if (this.dom.tr && this.dom.tr.parentNode) {
	    this.editor.scrollTo(this.dom.tr.offsetTop, callback);
	  }
	};

	/**
	 * if the node is not visible, expand its parents
	 */
	Node.prototype.expandPathToNode = function () {
	  var node = this;
	  var recurse = false;
	  while (node && node.parent) {
	    // expand visible childs of the parent if needed
	    var index = node.parent.type === 'array'
	        ? node.index
	        : node.parent.childs.indexOf(node);
	    while (node.parent.visibleChilds < index + 1) {
	      node.parent.visibleChilds += this.getMaxVisibleChilds();
	    }

	    // expand the parent itself
	    node.parent.expand(recurse);
	    node = node.parent;
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
	        if (dom.select) {
	          // enum select box
	          dom.select.focus();
	        }
	        else if (dom.value && !this._hasChilds()) {
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
	 * Remove a child from the node.
	 * Only applicable when Node value is of type array or object
	 * @param {Node} node   The child node to be removed;
	 * @param {boolean} [updateDom]  If true (default), the DOM of the parent
	 *                               node will be updated (like child count)
	 * @return {Node | undefined} node  The removed node on success,
	 *                                             else undefined
	 */
	Node.prototype.removeChild = function(node, updateDom) {
	  if (this.childs) {
	    var index = this.childs.indexOf(node);

	    if (index !== -1) {
	      if (index < this.visibleChilds && this.expanded) {
	        this.visibleChilds--;
	      }

	      node.hide();

	      // delete old search results
	      delete node.searchField;
	      delete node.searchValue;

	      var removedNode = this.childs.splice(index, 1)[0];
	      removedNode.parent = null;

	      if (updateDom !== false) {
	        this.updateDom({'updateIndexes': true});
	      }

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
	    var domAnchor = this._detachFromDom();

	    // delete the old DOM
	    this.clearDom();

	    // adjust the field and the value
	    this.type = newType;

	    // adjust childs
	    if (newType == 'object') {
	      if (!this.childs) {
	        this.childs = [];
	      }

	      this.childs.forEach(function (child) {
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

	    this._attachToDom(domAnchor);
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
	 * Test whether the JSON contents of this node are deep equal to provided JSON object.
	 * @param {*} json
	 */
	Node.prototype.deepEqual = function (json) {
	  var i;

	  if (this.type === 'array') {
	    if (!Array.isArray(json)) {
	      return false;
	    }

	    if (this.childs.length !== json.length) {
	      return false;
	    }

	    for (i = 0; i < this.childs.length; i++) {
	      if (!this.childs[i].deepEqual(json[i])) {
	        return false;
	      }
	    }
	  }
	  else if (this.type === 'object') {
	    if (typeof json !== 'object' || !json) {
	      return false;
	    }

	    // TODO: for better efficiency, we could create a property `isDuplicate` on all of the childs
	    // and keep that up to date. This should make deepEqual about 20% faster.
	    var props = {};
	    var propCount = 0;
	    for (i = 0; i < this.childs.length; i++) {
	      var child = this.childs[i];
	      if (!props[child.field]) {
	        // We can have childs with duplicate field names.
	        // We take the first, and ignore the others.
	        props[child.field] = true;
	        propCount++;

	        if (!(child.field in json)) {
	          return false;
	        }

	        if (!child.deepEqual(json[child.field])) {
	          return false;
	        }
	      }
	    }

	    if (propCount !== Object.keys(json).length) {
	      return false;
	    }
	  }
	  else {
	    if (this.value !== json) {
	      return false;
	    }
	  }

	  return true;
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
	  var oldSelection = this.editor.getDomSelection();
	  if (oldSelection.range) {
	    var undoDiff = util.textDiff(String(this.value), String(this.previousValue));
	    oldSelection.range.startOffset = undoDiff.start;
	    oldSelection.range.endOffset = undoDiff.end;
	  }
	  var newSelection = this.editor.getDomSelection();
	  if (newSelection.range) {
	    var redoDiff = util.textDiff(String(this.previousValue), String(this.value));
	    newSelection.range.startOffset = redoDiff.start;
	    newSelection.range.endOffset = redoDiff.end;
	  }

	  this.editor._onAction('editValue', {
	    path: this.getInternalPath(),
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
	  var oldSelection = this.editor.getDomSelection();
	  var previous = this.previousField || '';
	  if (oldSelection.range) {
	    var undoDiff = util.textDiff(this.field, previous);
	    oldSelection.range.startOffset = undoDiff.start;
	    oldSelection.range.endOffset = undoDiff.end;
	  }
	  var newSelection = this.editor.getDomSelection();
	  if (newSelection.range) {
	    var redoDiff = util.textDiff(previous, this.field);
	    newSelection.range.startOffset = redoDiff.start;
	    newSelection.range.endOffset = redoDiff.end;
	  }

	  this.editor._onAction('editField', {
	    parentPath: this.parent.getInternalPath(),
	    index: this.getIndex(),
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
	      domValue.title = translate('openUrl');
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

	    // create select box when this node has an enum object
	    if (this.enum && this.editable.value) {
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

	    // show color picker when value is a color
	    if (this.editable.value &&
	        this.editor.options.colorPicker &&
	        typeof value === 'string' &&
	        util.isValidColor(value)) {

	      if (!this.dom.color) {
	        this.dom.color = document.createElement('div');
	        this.dom.color.className = 'jsoneditor-color';

	        this.dom.tdColor = document.createElement('td');
	        this.dom.tdColor.className = 'jsoneditor-tree';
	        this.dom.tdColor.appendChild(this.dom.color);

	        this.dom.tdValue.parentNode.insertBefore(this.dom.tdColor, this.dom.tdValue);

	        // this is a bit hacky, overriding the text color like this. find a nicer solution
	        this.dom.value.style.color = '#1A1A1A';
	      }

	      // update the color background
	      this.dom.color.style.backgroundColor = value;
	    }
	    else {
	      // cleanup color picker when displayed
	      this._deleteDomColor();
	    }

	    // show date tag when value is a timestamp in milliseconds
	    if (this.editor.options.timestampTag &&
	        typeof value === 'number' &&
	        value > YEAR_2000 &&
	        !isNaN(new Date(value).valueOf())) {

	      if (!this.dom.date) {
	        this.dom.date = document.createElement('div');
	        this.dom.date.className = 'jsoneditor-date'
	        this.dom.value.parentNode.appendChild(this.dom.date);
	      }

	      this.dom.date.innerHTML = new Date(value).toISOString();
	      this.dom.date.title = new Date(value).toString();
	    }
	    else {
	      // cleanup date tag
	      if (this.dom.date) {
	        this.dom.date.parentNode.removeChild(this.dom.date);
	        delete this.dom.date;
	      }
	    }

	    // strip formatting from the contents of the editable div
	    util.stripFormatting(domValue);
	  }
	};

	Node.prototype._deleteDomColor = function () {
	  if (this.dom.color) {
	    this.dom.tdColor.parentNode.removeChild(this.dom.tdColor);
	    delete this.dom.tdColor;
	    delete this.dom.color;

	    this.dom.value.style.color = '';
	  }
	}

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
	      if (keys.hasOwnProperty(child.field)) {
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
	                message: translate('duplicateKey') + ' "' + node.field + '"'
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
	        domDrag.type = 'button';
	        dom.drag = domDrag;
	        domDrag.className = 'jsoneditor-button jsoneditor-dragarea';
	        domDrag.title = translate('drag');
	        tdDrag.appendChild(domDrag);
	      }
	    }
	    dom.tr.appendChild(tdDrag);

	    // create context menu
	    var tdMenu = document.createElement('td');
	    var menu = document.createElement('button');
	    menu.type = 'button';
	    dom.menu = menu;
	    menu.className = 'jsoneditor-button jsoneditor-contextmenu';
	    menu.title = translate('actionsMenu');
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
	 * Test whether a Node is rendered and visible
	 * @returns {boolean}
	 */
	Node.prototype.isVisible = function () {
	  return this.dom && this.dom.tr && this.dom.tr.parentNode || false
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
	  var parent = firstNode.parent;
	  var draggedNode = Node.getNodeFromTarget(event.target);
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
	    oldSelection: editor.getDomSelection(),
	    oldPaths: nodes.map(getInternalPath),
	    oldParent: parent,
	    oldNextNode: parent.childs[lastNode.getIndex() + 1] || parent.append,
	    oldParentPathRedo: parent.getInternalPath(),
	    oldIndexRedo: firstNode.getIndex(),
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

	    if (nodePrev && nodePrev.isVisible()) {
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

	          if (nodeNext &&
	              nodeNext.parent.childs.length == nodes.length &&
	              nodeNext.parent.childs[nodes.length - 1] == lastNode) {
	            // We are about to remove the last child of this parent,
	            // which will make the parents appendNode visible.
	            topThis += 27;
	            // TODO: dangerous to suppose the height of the appendNode a constant of 27 px.
	          }

	          trNext = trNext.nextSibling;
	        }
	      }
	      while (trNext && mouseY > topThis + heightNext);

	      if (nodeNext && nodeNext.parent) {
	        // calculate the desired level
	        var diffX = (mouseX - editor.drag.mouseX);
	        var diffLevel = Math.round(diffX / 24 / 2);
	        var level = editor.drag.level + diffLevel; // desired level
	        var levelNext = nodeNext.getLevel();     // level to be

	        // find the best fitting level (move upwards over the append nodes)
	        trPrev = nodeNext.dom.tr && nodeNext.dom.tr.previousSibling;
	        while (levelNext < level && trPrev) {
	          nodePrev = Node.getNodeFromTarget(trPrev);

	          var isDraggedNode = nodes.some(function (node) {
	            return node === nodePrev || nodePrev.isDescendantOf(node);
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

	        if (nodeNext instanceof AppendNode && !nodeNext.isVisible() &&
	            nodeNext.parent.showMore.isVisible()) {
	          nodeNext = nodeNext._nextNode();
	        }

	        // move the node when its position is changed
	        if (nodeNext && nodeNext.dom.tr && trLast.nextSibling != nodeNext.dom.tr) {
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

	  // set focus to the context menu button of the first node
	  if (nodes[0]) {
	    nodes[0].dom.menu.focus();
	  }

	  var oldParentPath = editor.drag.oldParent.getInternalPath();
	  var newParentPath = firstNode.parent.getInternalPath();
	  var sameParent = editor.drag.oldParent === firstNode.parent;
	  var oldIndex = editor.drag.oldNextNode.getIndex();
	  var newIndex = firstNode.getIndex();
	  var oldParentPathRedo = editor.drag.oldParentPathRedo;

	  var oldIndexRedo = editor.drag.oldIndexRedo;
	  var newIndexRedo = (sameParent && oldIndexRedo < newIndex)
	      ? (newIndex + nodes.length)
	      : newIndex;

	  if (!sameParent || oldIndexRedo !== newIndex) {
	    // only register this action if the node is actually moved to another place
	    editor._onAction('moveNodes', {
	      count: nodes.length,
	      fieldNames: nodes.map(getField),

	      oldParentPath: oldParentPath,
	      newParentPath: newParentPath,
	      oldIndex: oldIndex,
	      newIndex: newIndex,

	      oldIndexRedo: oldIndexRedo,
	      newIndexRedo: newIndexRedo,
	      oldParentPathRedo: oldParentPathRedo,
	      newParentPathRedo: null, // This is a hack, value will be filled in during undo

	      oldSelection: editor.drag.oldSelection,
	      newSelection: editor.getDomSelection()
	    });
	  }

	  document.body.style.cursor = editor.drag.oldCursor;
	  editor.highlighter.unlock();
	  nodes.forEach(function (node) {
	    node.updateDom();

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
	 * Test if this node is a sescendant of an other node
	 * @param {Node} node
	 * @return {boolean} isDescendant
	 * @private
	 */
	Node.prototype.isDescendantOf = function (node) {
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

	    if (this.showMore) {
	      this.showMore.setSelected(selected);
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
	  this.previousValue = value;
	  this.updateDom();
	};

	/**
	 * Update the field of the node.
	 * @param {String} field
	 */
	Node.prototype.updateField = function (field) {
	  this.field = field;
	  this.previousField = field;
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
	      // add title from schema description to show the tips for user input
	      domField.title = Node._findSchema(this.editor.options.schema || {}, this.editor.options.schemaRefs || {}, this.getPath())['description'] || '';
	    }
	    else {
	      // parent is an array this is the root node
	      domField.contentEditable = false;
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
	    if (this.type == 'array') {
	      this.updateNodeName();
	      util.addClassName(this.dom.tr, 'jsoneditor-expandable');
	    }
	    else if (this.type == 'object') {
	      this.updateNodeName();
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
	   
	  this._updateCssClassName();

	  // update childs indexes
	  if (options && options.updateIndexes === true) {
	    // updateIndexes is true or undefined
	    this._updateDomIndexes();
	  }

	  // update childs recursively
	  if (options && options.recurse === true) {
	    if (this.childs) {
	      this.childs.forEach(function (child) {
	        child.updateDom(options);
	      });
	    }
	  }

	  // update rendering of error
	  if (this.error) {
	    this.updateError()
	  }

	  // update row with append button
	  if (this.append) {
	    this.append.updateDom();
	  }

	  // update "show more" text at the bottom of large arrays
	  if (this.showMore) {
	    this.showMore.updateDom();
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
	    this.schema = this.editor.options.schema
	        // fix childSchema with $ref, and not display the select element on the child schema because of not found enum
	        ? Node._findSchema(this.editor.options.schema, this.editor.options.schemaRefs || {}, this.getPath())
	        : null;
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
	 * @param {Object} schemaRefs
	 * @param {Array.<string | number>} path
	 * @return {Object | null}
	 * @private
	 */
	Node._findSchema = function (schema, schemaRefs, path) {
	  var childSchema = schema;
	  var foundSchema = childSchema;

	  var allSchemas = schema.oneOf || schema.anyOf || schema.allOf;
	  if (!allSchemas) {
	    allSchemas = [schema];
	  }

	  for (var j = 0; j < allSchemas.length; j++) {
	    childSchema = allSchemas[j];

	    for (var i = 0; i < path.length && childSchema; i++) {
	      var key = path[i];

	      // fix childSchema with $ref, and not display the select element on the child schema because of not found enum
	      if (typeof key === 'string' && childSchema['$ref']) {
	        childSchema = schemaRefs[childSchema['$ref']];
	        if (childSchema) {
	          foundSchema = Node._findSchema(childSchema, schemaRefs, path.slice(i, path.length));
	        }
	      }
	      else if (typeof key === 'string' && childSchema.patternProperties && i == path.length - 1) {
	        for (var prop in childSchema.patternProperties) {
	          foundSchema = Node._findSchema(childSchema.patternProperties[prop], schemaRefs, path.slice(i, path.length));
	        }
	      }
	      else if (childSchema.items && childSchema.items.properties) {
	        childSchema = childSchema.items.properties[key];
	        if (childSchema) {
	          foundSchema = Node._findSchema(childSchema, schemaRefs, path.slice(i, path.length));
	        }
	      }
	      else if (typeof key === 'string' && childSchema.properties) {
	        childSchema = childSchema.properties[key] || null;
	        if (childSchema) {
	          foundSchema = Node._findSchema(childSchema, schemaRefs, path.slice(i, path.length));
	        }
	      }
	      else if (typeof key === 'number' && childSchema.items) {
	        childSchema = childSchema.items;
	        if (childSchema) {
	          foundSchema = Node._findSchema(childSchema, schemaRefs, path.slice(i, path.length));
	        }
	      }
	    }

	  }
	  return foundSchema
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
	  expand.type = 'button';
	  if (this._hasChilds()) {
	    expand.className = this.expanded
	        ? 'jsoneditor-button jsoneditor-expanded'
	        : 'jsoneditor-button jsoneditor-collapsed';
	    expand.title = translate('expandTitle');
	  }
	  else {
	    expand.className = 'jsoneditor-button jsoneditor-invisible';
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


	  if (typeof this.editor.options.onEvent === 'function') {
	    this._onEvent(event);
	  }

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

	  if (type === 'click' && (event.target === node.dom.tdColor || event.target === node.dom.color)) {
	    this._showColorPicker();
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
	        this.editor.selection = this.editor.getDomSelection();
	        break;

	      case 'click':
	        if (event.ctrlKey && this.editable.value) {
	          // if read-only, we use the regular click behavior of an anchor
	          if (util.isUrl(this.value)) {
	            event.preventDefault();
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
	        this.editor.selection = this.editor.getDomSelection();
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
	  if (domTree && target == domTree.parentNode && type == 'click' && !event.hasMoved) {
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
	 * Trigger external onEvent provided in options if node is a JSON field or
	 * value.
	 * Information provided depends on the element, value is only included if
	 * event occurs in a JSON value:
	 * {field: string, path: {string|number}[] [, value: string]}
	 * @param {Event} event
	 * @private
	 */
	Node.prototype._onEvent = function (event) {
	  var element = event.target;
	  if (element === this.dom.field || element === this.dom.value) {
	    var info = {
	      field: this.getField(),
	      path: this.getPath()
	    };
	    // For leaf values, include value
	    if (!this._hasChilds() &&element === this.dom.value) {
	      info.value = this.getValue();
	    }
	    this.editor.options.onEvent(info, event);
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
	  var oldNextNode;
	  var oldParent;
	  var oldIndexRedo;
	  var newIndexRedo;
	  var oldParentPathRedo;
	  var newParentPathRedo;
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
	        var appendDom = lastNode.getAppendDom();
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
	          oldSelection = this.editor.getDomSelection();
	          oldParent = firstNode.parent;
	          oldNextNode = oldParent.childs[lastNode.getIndex() + 1] || oldParent.append;
	          oldIndexRedo = firstNode.getIndex();
	          newIndexRedo = nextNode2.getIndex();
	          oldParentPathRedo = oldParent.getInternalPath();
	          newParentPathRedo = nextNode2.parent.getInternalPath();

	          selectedNodes.forEach(function (node) {
	            nextNode2.parent.moveBefore(node, nextNode2);
	          });
	          this.focus(Node.focusElement || this._getElementName(target));


	          this.editor._onAction('moveNodes', {
	            count: selectedNodes.length,
	            fieldNames: selectedNodes.map(getField),

	            oldParentPath: oldParent.getInternalPath(),
	            newParentPath: firstNode.parent.getInternalPath(),
	            oldIndex: oldNextNode.getIndex(),
	            newIndex: firstNode.getIndex(),

	            oldIndexRedo: oldIndexRedo,
	            newIndexRedo: newIndexRedo,
	            oldParentPathRedo: oldParentPathRedo,
	            newParentPathRedo: newParentPathRedo,

	            oldSelection: oldSelection,
	            newSelection: this.editor.getDomSelection()
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
	        oldSelection = this.editor.getDomSelection();
	        oldParent = firstNode.parent;
	        oldNextNode = oldParent.childs[lastNode.getIndex() + 1] || oldParent.append;
	        oldIndexRedo = firstNode.getIndex();
	        newIndexRedo = prevNode.getIndex();
	        oldParentPathRedo = oldParent.getInternalPath();
	        newParentPathRedo = prevNode.parent.getInternalPath();

	        selectedNodes.forEach(function (node) {
	          prevNode.parent.moveBefore(node, prevNode);
	        });
	        this.focus(Node.focusElement || this._getElementName(target));

	        this.editor._onAction('moveNodes', {
	          count: selectedNodes.length,
	          fieldNames: selectedNodes.map(getField),

	          oldParentPath: oldParent.getInternalPath(),
	          newParentPath: firstNode.parent.getInternalPath(),
	          oldIndex: oldNextNode.getIndex(),
	          newIndex: firstNode.getIndex(),

	          oldIndexRedo: oldIndexRedo,
	          newIndexRedo: newIndexRedo,
	          oldParentPathRedo: oldParentPathRedo,
	          newParentPathRedo: newParentPathRedo,

	          oldSelection: oldSelection,
	          newSelection: this.editor.getDomSelection()
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
	        if (prevNode && prevNode.parent && !prevNode.isVisible()) {
	          oldSelection = this.editor.getDomSelection();
	          oldParent = firstNode.parent;
	          oldNextNode = oldParent.childs[lastNode.getIndex() + 1] || oldParent.append;
	          oldIndexRedo = firstNode.getIndex();
	          newIndexRedo = prevNode.getIndex();
	          oldParentPathRedo = oldParent.getInternalPath();
	          newParentPathRedo = prevNode.parent.getInternalPath();

	          selectedNodes.forEach(function (node) {
	            prevNode.parent.moveBefore(node, prevNode);
	          });
	          this.focus(Node.focusElement || this._getElementName(target));

	          this.editor._onAction('moveNodes', {
	            count: selectedNodes.length,
	            fieldNames: selectedNodes.map(getField),

	            oldParentPath: oldParent.getInternalPath(),
	            newParentPath: firstNode.parent.getInternalPath(),
	            oldIndex: oldNextNode.getIndex(),
	            newIndex: firstNode.getIndex(),

	            oldIndexRedo: oldIndexRedo,
	            newIndexRedo: newIndexRedo,
	            oldParentPathRedo: oldParentPathRedo,
	            newParentPathRedo: newParentPathRedo,

	            oldSelection: oldSelection,
	            newSelection: this.editor.getDomSelection()
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

	      // when the next node is not visible, we've reached the "showMore" buttons
	      if (nextNode && !nextNode.isVisible()) {
	        nextNode = nextNode.parent.showMore;
	      }

	      if (nextNode && nextNode instanceof AppendNode) {
	        nextNode = lastNode;
	      }

	      var nextNode2 = nextNode && (nextNode._nextNode() || nextNode.parent.append);
	      if (nextNode2 && nextNode2.parent) {
	        oldSelection = this.editor.getDomSelection();
	        oldParent = firstNode.parent;
	        oldNextNode = oldParent.childs[lastNode.getIndex() + 1] || oldParent.append;
	        oldIndexRedo = firstNode.getIndex();
	        newIndexRedo = nextNode2.getIndex();
	        oldParentPathRedo = oldParent.getInternalPath();
	        newParentPathRedo = nextNode2.parent.getInternalPath();

	        selectedNodes.forEach(function (node) {
	          nextNode2.parent.moveBefore(node, nextNode2);
	        });
	        this.focus(Node.focusElement || this._getElementName(target));

	        this.editor._onAction('moveNodes', {
	          count: selectedNodes.length,
	          fieldNames: selectedNodes.map(getField),
	          oldParentPath: oldParent.getInternalPath(),
	          newParentPath: firstNode.parent.getInternalPath(),
	          oldParentPathRedo: oldParentPathRedo,
	          newParentPathRedo: newParentPathRedo,
	          oldIndexRedo: oldIndexRedo,
	          newIndexRedo: newIndexRedo,
	          oldIndex: oldNextNode.getIndex(),
	          newIndex: firstNode.getIndex(),
	          oldSelection: oldSelection,
	          newSelection: this.editor.getDomSelection()
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
	 * Open a color picker to select a new color
	 * @private
	 */
	Node.prototype._showColorPicker = function () {
	  if (typeof this.editor.options.onColorPicker === 'function' && this.dom.color) {
	    var node = this;

	    // force deleting current color picker (if any)
	    node._deleteDomColor();
	    node.updateDom();

	    var colorAnchor = createAbsoluteAnchor(this.dom.color, this.editor.frame);

	    this.editor.options.onColorPicker(colorAnchor, this.value, function onChange(value) {
	      if (typeof value === 'string' && value !== node.value) {
	        // force recreating the color block, to cleanup any attached color picker
	        node._deleteDomColor();

	        node.value = value;
	        node.updateDom();
	        node._debouncedOnChangeValue();
	      }
	    });
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
	    var oldSelection = editor.getDomSelection();
	    Node.blurNodes(nodes);
	    var newSelection = editor.getDomSelection();

	    // store the paths before removing them (needed for history)
	    var paths = nodes.map(getInternalPath);

	    // remove the nodes
	    nodes.forEach(function (node) {
	      node.parent._remove(node);
	    });

	    // store history action
	    editor._onAction('removeNodes', {
	      nodes: nodes,
	      paths: paths,
	      parentPath: parent.getInternalPath(),
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
	    var oldSelection = editor.getDomSelection();
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
	    var newSelection = editor.getDomSelection();

	    editor._onAction('duplicateNodes', {
	      paths: nodes.map(getInternalPath),
	      clonePaths: clones.map(getInternalPath),
	      afterPath: lastNode.getInternalPath(),
	      parentPath: parent.getInternalPath(),
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
	  var oldSelection = this.editor.getDomSelection();

	  var newNode = new Node(this.editor, {
	    field: (field != undefined) ? field : '',
	    value: (value != undefined) ? value : '',
	    type: type
	  });
	  newNode.expand(true);

	  var beforePath = this.getInternalPath();

	  this.parent.insertBefore(newNode, this);
	  this.editor.highlighter.unhighlight();
	  newNode.focus('field');
	  var newSelection = this.editor.getDomSelection();

	  this.editor._onAction('insertBeforeNodes', {
	    nodes: [newNode],
	    paths: [newNode.getInternalPath()],
	    beforePath: beforePath,
	    parentPath: this.parent.getInternalPath(),
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
	  var oldSelection = this.editor.getDomSelection();

	  var newNode = new Node(this.editor, {
	    field: (field != undefined) ? field : '',
	    value: (value != undefined) ? value : '',
	    type: type
	  });
	  newNode.expand(true);
	  this.parent.insertAfter(newNode, this);
	  this.editor.highlighter.unhighlight();
	  newNode.focus('field');
	  var newSelection = this.editor.getDomSelection();

	  this.editor._onAction('insertAfterNodes', {
	    nodes: [newNode],
	    paths: [newNode.getInternalPath()],
	    afterPath: this.getInternalPath(),
	    parentPath: this.parent.getInternalPath(),
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
	  var oldSelection = this.editor.getDomSelection();

	  var newNode = new Node(this.editor, {
	    field: (field != undefined) ? field : '',
	    value: (value != undefined) ? value : '',
	    type: type
	  });
	  newNode.expand(true);
	  this.parent.appendChild(newNode);
	  this.editor.highlighter.unhighlight();
	  newNode.focus('field');
	  var newSelection = this.editor.getDomSelection();

	  this.editor._onAction('appendNodes', {
	    nodes: [newNode],
	    paths: [newNode.getInternalPath()],
	    parentPath: this.parent.getInternalPath(),
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
	    var oldSelection = this.editor.getDomSelection();
	    this.changeType(newType);
	    var newSelection = this.editor.getDomSelection();

	    this.editor._onAction('changeType', {
	      path: this.getInternalPath(),
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
	 * @param {String[]} path      Path of the child value to be compared
	 * @param {String} direction   Sorting direction. Available values: "asc", "desc"
	 * @private
	 */
	Node.prototype.sort = function (path, direction) {
	  if (!this._hasChilds()) {
	    return;
	  }

	  this.hideChilds(); // sorting is faster when the childs are not attached to the dom

	  // copy the childs array (the old one will be kept for an undo action
	  var oldChilds = this.childs;
	  this.childs = this.childs.concat();

	  // sort the childs array
	  var order = (direction === 'desc') ? -1 : 1;

	  if (this.type === 'object') {
	    this.childs.sort(function (a, b) {
	      return order * naturalSort(a.field, b.field);
	    });
	  }
	  else { // this.type === 'array'
	    this.childs.sort(function (a, b) {
	      var nodeA = a.getNestedChild(path);
	      var nodeB = b.getNestedChild(path);

	      if (!nodeA) {
	        return order;
	      }
	      if (!nodeB) {
	        return -order;
	      }

	      var valueA = nodeA.value;
	      var valueB = nodeB.value;

	      if (typeof valueA !== 'string' && typeof valueB !== 'string') {
	        // both values are a number, boolean, or null -> use simple, fast sorting
	        return valueA > valueB ? order : valueA < valueB ? -order : 0;
	      }

	      return order * naturalSort(valueA, valueB);
	    });
	  }

	  // update the index numbering
	  this._updateDomIndexes();

	  this.editor._onAction('sort', {
	    path: this.getInternalPath(),
	    oldChilds: oldChilds,
	    newChilds: this.childs
	  });

	  this.showChilds();
	};

	/**
	 * Replace the value of the node, keep it's state
	 * @param {*} newValue
	 */
	Node.prototype.update = function (newValue) {
	  var oldValue = this.getInternalValue();

	  this.setValue(newValue);

	  this.editor._onAction('transform', {
	    path: this.getInternalPath(),
	    oldValue: oldValue,
	    newValue: this.getInternalValue()
	  });
	};

	/**
	 * Remove this node from the DOM
	 * @returns {{table: Element, nextTr?: Element}}
	 *            Returns the DOM elements that which be used to attach the node
	 *            to the DOM again, see _attachToDom.
	 * @private
	 */
	Node.prototype._detachFromDom = function () {
	  var table = this.dom.tr ? this.dom.tr.parentNode : undefined;
	  var lastTr;
	  if (this.expanded) {
	    lastTr = this.getAppendDom();
	  }
	  else {
	    lastTr = this.getDom();
	  }
	  var nextTr = (lastTr && lastTr.parentNode) ? lastTr.nextSibling : undefined;

	  this.hide({ resetVisibleChilds: false });

	  return {
	    table: table,
	    nextTr: nextTr
	  }
	};

	/**
	 * Attach this node to the DOM again
	 * @param {{table: Element, nextTr?: Element}} domAnchor
	 *            The DOM elements returned by _detachFromDom.
	 * @private
	 */
	Node.prototype._attachToDom = function (domAnchor) {
	  if (domAnchor.table) {
	    if (domAnchor.nextTr) {
	      domAnchor.table.insertBefore(this.getDom(), domAnchor.nextTr);
	    }
	    else {
	      domAnchor.table.appendChild(this.getDom());
	    }
	  }

	  if (this.expanded) {
	    this.showChilds();
	  }
	};

	/**
	 * Transform the node given a JMESPath query.
	 * @param {String} query    JMESPath query to apply
	 * @private
	 */
	Node.prototype.transform = function (query) {
	  if (!this._hasChilds()) {
	    return;
	  }

	  this.hideChilds(); // sorting is faster when the childs are not attached to the dom

	  try {
	    // apply the JMESPath query
	    var oldInternalValue = this.getInternalValue();

	    var oldValue = this.getValue();
	    var newValue = jmespath.search(oldValue, query);
	    this.setValue(newValue);

	    var newInternalValue = this.getInternalValue();

	    this.editor._onAction('transform', {
	      path: this.getInternalPath(),
	      oldValue: oldInternalValue,
	      newValue: newInternalValue
	    });

	    this.showChilds();
	  }
	  catch (err) {
	    this.showChilds();

	    this.editor._onError(err);
	  }
	};

	/**
	 * Get a nested child given a path with properties
	 * @param {String[]} path
	 * @returns {Node}
	 */
	Node.prototype.getNestedChild = function (path) {
	  var i = 0;
	  var child = this;

	  while (child && i < path.length) {
	    child = child.findChildByProperty(path[i]);
	    i++;
	  }

	  return child;
	};

	/**
	 * Find a child by property name
	 * @param {string} prop
	 * @return {Node | undefined} Returns the child node when found, or undefined otherwise
	 */
	Node.prototype.findChildByProperty = function(prop) {
	  if (this.type !== 'object') {
	    return undefined;
	  }

	  return this.childs.find(function (child) {
	    return child.field === prop;
	  });
	};

	/**
	 * Get the child paths of this node
	 * @param {boolean} [includeObjects=false] If true, object and array paths are returned as well
	 * @return {string[]}
	 */
	Node.prototype.getChildPaths = function (includeObjects) {
	  var pathsMap = {};

	  this._getChildPaths(pathsMap, '', includeObjects);

	  if (this.type === 'array') {
	    this.childs.forEach(function (child) {
	      child._getChildPaths(pathsMap, '', includeObjects);
	    });
	  }

	  return Object.keys(pathsMap).sort();
	};

	/**
	 * Get the child paths of this node
	 * @param {Object<String, boolean>} pathsMap
	 * @param {boolean} [includeObjects=false]  If true, object and array paths are returned as well
	 * @param {string} rootPath
	 */
	Node.prototype._getChildPaths = function (pathsMap, rootPath, includeObjects) {
	  if (this.type === 'auto' || this.type === 'string' || includeObjects) {
	    pathsMap[rootPath || '.'] = true;
	  }

	  if (this.type === 'object') {
	    this.childs.forEach(function (child) {
	      child._getChildPaths(pathsMap, rootPath + '.' + child.field, includeObjects);
	    });
	  }
	};

	/**
	 * Create a table row with an append button.
	 * @return {HTMLElement | undefined} tr with the AppendNode contents
	 */
	Node.prototype.getAppendDom = function () {
	  if (!this.append) {
	    this.append = new AppendNode(this.editor);
	    this.append.setParent(this);
	  }
	  return this.append.getDom();
	};

	/**
	 * Create a table row with an showMore button and text
	 * @return {HTMLElement | undefined} tr with the AppendNode contents
	 */
	Node.prototype.getShowMoreDom = function () {
	  if (!this.showMore) {
	    this.showMore = new ShowMoreNode(this.editor, this);
	  }
	  return this.showMore.getDom();
	};

	/**
	 * Find the node from an event target
	 * @param {HTMLElement} target
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
	 * Test whether target is a child of the color DOM of a node
	 * @param {HTMLElement} target
	 * @returns {boolean}
	 */
	Node.targetIsColorPicker = function (target) {
	  var node = Node.getNodeFromTarget(target);

	  if (node) {
	    var parent = target && target.parentNode;
	    while (parent) {
	      if (parent === node.dom.color) {
	        return true;
	      }
	      parent = parent.parentNode;
	    }
	  }

	  return false;
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
	 */
	Node.prototype.nextSibling = function () {
	  var index = this.parent.childs.indexOf(this);
	  return this.parent.childs[index + 1] || this.parent.append;
	};

	/**
	 * Get the previously rendered node
	 * @return {Node | null} previousNode
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
	    while (prevDom && prevNode && (prevNode instanceof AppendNode && !prevNode.isVisible()));
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
	    while (nextDom && nextNode && (nextNode instanceof AppendNode && !nextNode.isVisible()));
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
	    while (lastDom && lastNode && !lastNode.isVisible()) {
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
	  'auto': translate('autoType'),
	  'object': translate('objectType'),
	  'array': translate('arrayType'),
	  'string': translate('stringType')
	};

	Node.prototype.addTemplates = function (menu, append) {
	    var node = this;
	    var templates = node.editor.options.templates;
	    if (templates == null) return;
	    if (templates.length) {
	        // create a separator
	        menu.push({
	            'type': 'separator'
	        });
	    }
	    var appendData = function (name, data) {
	        node._onAppend(name, data);
	    };
	    var insertData = function (name, data) {
	        node._onInsertBefore(name, data);
	    };
	    templates.forEach(function (template) {
	        menu.push({
	            text: template.text,
	            className: (template.className || 'jsoneditor-type-object'),
	            title: template.title,
	            click: (append ? appendData.bind(this, template.field, template.value) : insertData.bind(this, template.field, template.value))
	        });
	    });
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
	      text: translate('type'),
	      title: translate('typeTitle'),
	      className: 'jsoneditor-type-' + this.type,
	      submenu: [
	        {
	          text: translate('auto'),
	          className: 'jsoneditor-type-auto' +
	              (this.type == 'auto' ? ' jsoneditor-selected' : ''),
	          title: titles.auto,
	          click: function () {
	            node._onChangeType('auto');
	          }
	        },
	        {
	          text: translate('array'),
	          className: 'jsoneditor-type-array' +
	              (this.type == 'array' ? ' jsoneditor-selected' : ''),
	          title: titles.array,
	          click: function () {
	            node._onChangeType('array');
	          }
	        },
	        {
	          text: translate('object'),
	          className: 'jsoneditor-type-object' +
	              (this.type == 'object' ? ' jsoneditor-selected' : ''),
	          title: titles.object,
	          click: function () {
	            node._onChangeType('object');
	          }
	        },
	        {
	          text: translate('string'),
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
	    if (this.editor.options.enableSort) {
	      items.push({
	        text: translate('sort'),
	        title: translate('sortTitle', {type: this.type}),
	        className: 'jsoneditor-sort-asc',
	        click: function () {
	          var anchor = node.editor.options.modalAnchor || DEFAULT_MODAL_ANCHOR;
	          showSortModal(node, anchor)
	        }
	      });
	    }

	    if (this.editor.options.enableTransform) {
	      items.push({
	        text: translate('transform'),
	        title: translate('transformTitle', {type: this.type}),
	        className: 'jsoneditor-transform',
	        click: function () {
	          var anchor = node.editor.options.modalAnchor || DEFAULT_MODAL_ANCHOR;
	          showTransformModal(node, anchor)
	        }
	      });
	    }
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
	        var appendSubmenu = [
	            {
	                text: translate('auto'),
	                className: 'jsoneditor-type-auto',
	                title: titles.auto,
	                click: function () {
	                    node._onAppend('', '', 'auto');
	                }
	            },
	            {
	                text: translate('array'),
	                className: 'jsoneditor-type-array',
	                title: titles.array,
	                click: function () {
	                    node._onAppend('', []);
	                }
	            },
	            {
	                text: translate('object'),
	                className: 'jsoneditor-type-object',
	                title: titles.object,
	                click: function () {
	                    node._onAppend('', {});
	                }
	            },
	            {
	                text: translate('string'),
	                className: 'jsoneditor-type-string',
	                title: titles.string,
	                click: function () {
	                    node._onAppend('', '', 'string');
	                }
	            }
	        ];
	        node.addTemplates(appendSubmenu, true);
	        items.push({
	            text: translate('appendText'),
	            title: translate('appendTitle'),
	            submenuTitle: translate('appendSubmenuTitle'),
	            className: 'jsoneditor-append',
	            click: function () {
	                node._onAppend('', '', 'auto');
	            },
	            submenu: appendSubmenu
	        });
	    }



	    // create insert button
	    var insertSubmenu = [
	        {
	            text: translate('auto'),
	            className: 'jsoneditor-type-auto',
	            title: titles.auto,
	            click: function () {
	                node._onInsertBefore('', '', 'auto');
	            }
	        },
	        {
	            text: translate('array'),
	            className: 'jsoneditor-type-array',
	            title: titles.array,
	            click: function () {
	                node._onInsertBefore('', []);
	            }
	        },
	        {
	            text: translate('object'),
	            className: 'jsoneditor-type-object',
	            title: titles.object,
	            click: function () {
	                node._onInsertBefore('', {});
	            }
	        },
	        {
	            text: translate('string'),
	            className: 'jsoneditor-type-string',
	            title: titles.string,
	            click: function () {
	                node._onInsertBefore('', '', 'string');
	            }
	        }
	    ];
	    node.addTemplates(insertSubmenu, false);
	    items.push({
	      text: translate('insert'),
	      title: translate('insertTitle'),
	      submenuTitle: translate('insertSub'),
	      className: 'jsoneditor-insert',
	      click: function () {
	        node._onInsertBefore('', '', 'auto');
	      },
	      submenu: insertSubmenu
	    });

	    if (this.editable.field) {
	      // create duplicate button
	      items.push({
	        text: translate('duplicateText'),
	        title: translate('duplicateField'),
	        className: 'jsoneditor-duplicate',
	        click: function () {
	          Node.onDuplicate(node);
	        }
	      });

	      // create remove button
	      items.push({
	        text: translate('removeText'),
	        title: translate('removeField'),
	        className: 'jsoneditor-remove',
	        click: function () {
	          Node.onRemove(node);
	        }
	      });
	    }
	  }

	  var menu = new ContextMenu(items, {close: onClose});
	  menu.show(anchor, this.editor.frame);
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

	/**
	 * update the object name according to the callback onNodeName
	 * @private
	 */
	Node.prototype.updateNodeName = function () {
	  var count = this.childs ? this.childs.length : 0;
	  var nodeName;
	  if (this.type === 'object' || this.type === 'array') {
	    if (this.editor.options.onNodeName) {
	      try {
	        nodeName = this.editor.options.onNodeName({
	          path: this.getPath(),
	          size: count,
	          type: this.type
	        });
	      }
	      catch (err) {
	        console.error('Error in onNodeName callback: ', err);
	      }
	    }

	    this.dom.value.innerHTML = (this.type === 'object')
	      ? ('{' + (nodeName || count) + '}')
	      : ('[' + (nodeName || count) + ']');
	  }
	}

	/**
	 * update recursively the object's and its children's name.
	 * @private
	 */
	Node.prototype.recursivelyUpdateNodeName = function () {
	  if (this.expanded) {
	    this.updateNodeName();
	    if (this.childs !== 'undefined') {
	      var i;
	      for (i in this.childs) {
	        this.childs[i].recursivelyUpdateNodeName();
	      }
	    }
	  }
	}

	// helper function to get the internal path of a node
	function getInternalPath (node) {
	  return node.getInternalPath();
	}

	// helper function to get the field of a node
	function getField (node) {
	  return node.getField();
	}

	// TODO: find a nicer solution to resolve this circular dependency between Node and AppendNode
	//       idea: introduce properties .isAppendNode and .isNode and use that instead of instanceof AppendNode checks
	var AppendNode = appendNodeFactory(Node);
	var ShowMoreNode = showMoreNodeFactory(Node);

	module.exports = Node;


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	(function(exports) {
	  "use strict";

	  function isArray(obj) {
	    if (obj !== null) {
	      return Object.prototype.toString.call(obj) === "[object Array]";
	    } else {
	      return false;
	    }
	  }

	  function isObject(obj) {
	    if (obj !== null) {
	      return Object.prototype.toString.call(obj) === "[object Object]";
	    } else {
	      return false;
	    }
	  }

	  function strictDeepEqual(first, second) {
	    // Check the scalar case first.
	    if (first === second) {
	      return true;
	    }

	    // Check if they are the same type.
	    var firstType = Object.prototype.toString.call(first);
	    if (firstType !== Object.prototype.toString.call(second)) {
	      return false;
	    }
	    // We know that first and second have the same type so we can just check the
	    // first type from now on.
	    if (isArray(first) === true) {
	      // Short circuit if they're not the same length;
	      if (first.length !== second.length) {
	        return false;
	      }
	      for (var i = 0; i < first.length; i++) {
	        if (strictDeepEqual(first[i], second[i]) === false) {
	          return false;
	        }
	      }
	      return true;
	    }
	    if (isObject(first) === true) {
	      // An object is equal if it has the same key/value pairs.
	      var keysSeen = {};
	      for (var key in first) {
	        if (hasOwnProperty.call(first, key)) {
	          if (strictDeepEqual(first[key], second[key]) === false) {
	            return false;
	          }
	          keysSeen[key] = true;
	        }
	      }
	      // Now check that there aren't any keys in second that weren't
	      // in first.
	      for (var key2 in second) {
	        if (hasOwnProperty.call(second, key2)) {
	          if (keysSeen[key2] !== true) {
	            return false;
	          }
	        }
	      }
	      return true;
	    }
	    return false;
	  }

	  function isFalse(obj) {
	    // From the spec:
	    // A false value corresponds to the following values:
	    // Empty list
	    // Empty object
	    // Empty string
	    // False boolean
	    // null value

	    // First check the scalar values.
	    if (obj === "" || obj === false || obj === null) {
	        return true;
	    } else if (isArray(obj) && obj.length === 0) {
	        // Check for an empty array.
	        return true;
	    } else if (isObject(obj)) {
	        // Check for an empty object.
	        for (var key in obj) {
	            // If there are any keys, then
	            // the object is not empty so the object
	            // is not false.
	            if (obj.hasOwnProperty(key)) {
	              return false;
	            }
	        }
	        return true;
	    } else {
	        return false;
	    }
	  }

	  function objValues(obj) {
	    var keys = Object.keys(obj);
	    var values = [];
	    for (var i = 0; i < keys.length; i++) {
	      values.push(obj[keys[i]]);
	    }
	    return values;
	  }

	  function merge(a, b) {
	      var merged = {};
	      for (var key in a) {
	          merged[key] = a[key];
	      }
	      for (var key2 in b) {
	          merged[key2] = b[key2];
	      }
	      return merged;
	  }

	  var trimLeft;
	  if (typeof String.prototype.trimLeft === "function") {
	    trimLeft = function(str) {
	      return str.trimLeft();
	    };
	  } else {
	    trimLeft = function(str) {
	      return str.match(/^\s*(.*)/)[1];
	    };
	  }

	  // Type constants used to define functions.
	  var TYPE_NUMBER = 0;
	  var TYPE_ANY = 1;
	  var TYPE_STRING = 2;
	  var TYPE_ARRAY = 3;
	  var TYPE_OBJECT = 4;
	  var TYPE_BOOLEAN = 5;
	  var TYPE_EXPREF = 6;
	  var TYPE_NULL = 7;
	  var TYPE_ARRAY_NUMBER = 8;
	  var TYPE_ARRAY_STRING = 9;

	  var TOK_EOF = "EOF";
	  var TOK_UNQUOTEDIDENTIFIER = "UnquotedIdentifier";
	  var TOK_QUOTEDIDENTIFIER = "QuotedIdentifier";
	  var TOK_RBRACKET = "Rbracket";
	  var TOK_RPAREN = "Rparen";
	  var TOK_COMMA = "Comma";
	  var TOK_COLON = "Colon";
	  var TOK_RBRACE = "Rbrace";
	  var TOK_NUMBER = "Number";
	  var TOK_CURRENT = "Current";
	  var TOK_EXPREF = "Expref";
	  var TOK_PIPE = "Pipe";
	  var TOK_OR = "Or";
	  var TOK_AND = "And";
	  var TOK_EQ = "EQ";
	  var TOK_GT = "GT";
	  var TOK_LT = "LT";
	  var TOK_GTE = "GTE";
	  var TOK_LTE = "LTE";
	  var TOK_NE = "NE";
	  var TOK_FLATTEN = "Flatten";
	  var TOK_STAR = "Star";
	  var TOK_FILTER = "Filter";
	  var TOK_DOT = "Dot";
	  var TOK_NOT = "Not";
	  var TOK_LBRACE = "Lbrace";
	  var TOK_LBRACKET = "Lbracket";
	  var TOK_LPAREN= "Lparen";
	  var TOK_LITERAL= "Literal";

	  // The "&", "[", "<", ">" tokens
	  // are not in basicToken because
	  // there are two token variants
	  // ("&&", "[?", "<=", ">=").  This is specially handled
	  // below.

	  var basicTokens = {
	    ".": TOK_DOT,
	    "*": TOK_STAR,
	    ",": TOK_COMMA,
	    ":": TOK_COLON,
	    "{": TOK_LBRACE,
	    "}": TOK_RBRACE,
	    "]": TOK_RBRACKET,
	    "(": TOK_LPAREN,
	    ")": TOK_RPAREN,
	    "@": TOK_CURRENT
	  };

	  var operatorStartToken = {
	      "<": true,
	      ">": true,
	      "=": true,
	      "!": true
	  };

	  var skipChars = {
	      " ": true,
	      "\t": true,
	      "\n": true
	  };


	  function isAlpha(ch) {
	      return (ch >= "a" && ch <= "z") ||
	             (ch >= "A" && ch <= "Z") ||
	             ch === "_";
	  }

	  function isNum(ch) {
	      return (ch >= "0" && ch <= "9") ||
	             ch === "-";
	  }
	  function isAlphaNum(ch) {
	      return (ch >= "a" && ch <= "z") ||
	             (ch >= "A" && ch <= "Z") ||
	             (ch >= "0" && ch <= "9") ||
	             ch === "_";
	  }

	  function Lexer() {
	  }
	  Lexer.prototype = {
	      tokenize: function(stream) {
	          var tokens = [];
	          this._current = 0;
	          var start;
	          var identifier;
	          var token;
	          while (this._current < stream.length) {
	              if (isAlpha(stream[this._current])) {
	                  start = this._current;
	                  identifier = this._consumeUnquotedIdentifier(stream);
	                  tokens.push({type: TOK_UNQUOTEDIDENTIFIER,
	                               value: identifier,
	                               start: start});
	              } else if (basicTokens[stream[this._current]] !== undefined) {
	                  tokens.push({type: basicTokens[stream[this._current]],
	                              value: stream[this._current],
	                              start: this._current});
	                  this._current++;
	              } else if (isNum(stream[this._current])) {
	                  token = this._consumeNumber(stream);
	                  tokens.push(token);
	              } else if (stream[this._current] === "[") {
	                  // No need to increment this._current.  This happens
	                  // in _consumeLBracket
	                  token = this._consumeLBracket(stream);
	                  tokens.push(token);
	              } else if (stream[this._current] === "\"") {
	                  start = this._current;
	                  identifier = this._consumeQuotedIdentifier(stream);
	                  tokens.push({type: TOK_QUOTEDIDENTIFIER,
	                               value: identifier,
	                               start: start});
	              } else if (stream[this._current] === "'") {
	                  start = this._current;
	                  identifier = this._consumeRawStringLiteral(stream);
	                  tokens.push({type: TOK_LITERAL,
	                               value: identifier,
	                               start: start});
	              } else if (stream[this._current] === "`") {
	                  start = this._current;
	                  var literal = this._consumeLiteral(stream);
	                  tokens.push({type: TOK_LITERAL,
	                               value: literal,
	                               start: start});
	              } else if (operatorStartToken[stream[this._current]] !== undefined) {
	                  tokens.push(this._consumeOperator(stream));
	              } else if (skipChars[stream[this._current]] !== undefined) {
	                  // Ignore whitespace.
	                  this._current++;
	              } else if (stream[this._current] === "&") {
	                  start = this._current;
	                  this._current++;
	                  if (stream[this._current] === "&") {
	                      this._current++;
	                      tokens.push({type: TOK_AND, value: "&&", start: start});
	                  } else {
	                      tokens.push({type: TOK_EXPREF, value: "&", start: start});
	                  }
	              } else if (stream[this._current] === "|") {
	                  start = this._current;
	                  this._current++;
	                  if (stream[this._current] === "|") {
	                      this._current++;
	                      tokens.push({type: TOK_OR, value: "||", start: start});
	                  } else {
	                      tokens.push({type: TOK_PIPE, value: "|", start: start});
	                  }
	              } else {
	                  var error = new Error("Unknown character:" + stream[this._current]);
	                  error.name = "LexerError";
	                  throw error;
	              }
	          }
	          return tokens;
	      },

	      _consumeUnquotedIdentifier: function(stream) {
	          var start = this._current;
	          this._current++;
	          while (this._current < stream.length && isAlphaNum(stream[this._current])) {
	              this._current++;
	          }
	          return stream.slice(start, this._current);
	      },

	      _consumeQuotedIdentifier: function(stream) {
	          var start = this._current;
	          this._current++;
	          var maxLength = stream.length;
	          while (stream[this._current] !== "\"" && this._current < maxLength) {
	              // You can escape a double quote and you can escape an escape.
	              var current = this._current;
	              if (stream[current] === "\\" && (stream[current + 1] === "\\" ||
	                                               stream[current + 1] === "\"")) {
	                  current += 2;
	              } else {
	                  current++;
	              }
	              this._current = current;
	          }
	          this._current++;
	          return JSON.parse(stream.slice(start, this._current));
	      },

	      _consumeRawStringLiteral: function(stream) {
	          var start = this._current;
	          this._current++;
	          var maxLength = stream.length;
	          while (stream[this._current] !== "'" && this._current < maxLength) {
	              // You can escape a single quote and you can escape an escape.
	              var current = this._current;
	              if (stream[current] === "\\" && (stream[current + 1] === "\\" ||
	                                               stream[current + 1] === "'")) {
	                  current += 2;
	              } else {
	                  current++;
	              }
	              this._current = current;
	          }
	          this._current++;
	          var literal = stream.slice(start + 1, this._current - 1);
	          return literal.replace("\\'", "'");
	      },

	      _consumeNumber: function(stream) {
	          var start = this._current;
	          this._current++;
	          var maxLength = stream.length;
	          while (isNum(stream[this._current]) && this._current < maxLength) {
	              this._current++;
	          }
	          var value = parseInt(stream.slice(start, this._current));
	          return {type: TOK_NUMBER, value: value, start: start};
	      },

	      _consumeLBracket: function(stream) {
	          var start = this._current;
	          this._current++;
	          if (stream[this._current] === "?") {
	              this._current++;
	              return {type: TOK_FILTER, value: "[?", start: start};
	          } else if (stream[this._current] === "]") {
	              this._current++;
	              return {type: TOK_FLATTEN, value: "[]", start: start};
	          } else {
	              return {type: TOK_LBRACKET, value: "[", start: start};
	          }
	      },

	      _consumeOperator: function(stream) {
	          var start = this._current;
	          var startingChar = stream[start];
	          this._current++;
	          if (startingChar === "!") {
	              if (stream[this._current] === "=") {
	                  this._current++;
	                  return {type: TOK_NE, value: "!=", start: start};
	              } else {
	                return {type: TOK_NOT, value: "!", start: start};
	              }
	          } else if (startingChar === "<") {
	              if (stream[this._current] === "=") {
	                  this._current++;
	                  return {type: TOK_LTE, value: "<=", start: start};
	              } else {
	                  return {type: TOK_LT, value: "<", start: start};
	              }
	          } else if (startingChar === ">") {
	              if (stream[this._current] === "=") {
	                  this._current++;
	                  return {type: TOK_GTE, value: ">=", start: start};
	              } else {
	                  return {type: TOK_GT, value: ">", start: start};
	              }
	          } else if (startingChar === "=") {
	              if (stream[this._current] === "=") {
	                  this._current++;
	                  return {type: TOK_EQ, value: "==", start: start};
	              }
	          }
	      },

	      _consumeLiteral: function(stream) {
	          this._current++;
	          var start = this._current;
	          var maxLength = stream.length;
	          var literal;
	          while(stream[this._current] !== "`" && this._current < maxLength) {
	              // You can escape a literal char or you can escape the escape.
	              var current = this._current;
	              if (stream[current] === "\\" && (stream[current + 1] === "\\" ||
	                                               stream[current + 1] === "`")) {
	                  current += 2;
	              } else {
	                  current++;
	              }
	              this._current = current;
	          }
	          var literalString = trimLeft(stream.slice(start, this._current));
	          literalString = literalString.replace("\\`", "`");
	          if (this._looksLikeJSON(literalString)) {
	              literal = JSON.parse(literalString);
	          } else {
	              // Try to JSON parse it as "<literal>"
	              literal = JSON.parse("\"" + literalString + "\"");
	          }
	          // +1 gets us to the ending "`", +1 to move on to the next char.
	          this._current++;
	          return literal;
	      },

	      _looksLikeJSON: function(literalString) {
	          var startingChars = "[{\"";
	          var jsonLiterals = ["true", "false", "null"];
	          var numberLooking = "-0123456789";

	          if (literalString === "") {
	              return false;
	          } else if (startingChars.indexOf(literalString[0]) >= 0) {
	              return true;
	          } else if (jsonLiterals.indexOf(literalString) >= 0) {
	              return true;
	          } else if (numberLooking.indexOf(literalString[0]) >= 0) {
	              try {
	                  JSON.parse(literalString);
	                  return true;
	              } catch (ex) {
	                  return false;
	              }
	          } else {
	              return false;
	          }
	      }
	  };

	      var bindingPower = {};
	      bindingPower[TOK_EOF] = 0;
	      bindingPower[TOK_UNQUOTEDIDENTIFIER] = 0;
	      bindingPower[TOK_QUOTEDIDENTIFIER] = 0;
	      bindingPower[TOK_RBRACKET] = 0;
	      bindingPower[TOK_RPAREN] = 0;
	      bindingPower[TOK_COMMA] = 0;
	      bindingPower[TOK_RBRACE] = 0;
	      bindingPower[TOK_NUMBER] = 0;
	      bindingPower[TOK_CURRENT] = 0;
	      bindingPower[TOK_EXPREF] = 0;
	      bindingPower[TOK_PIPE] = 1;
	      bindingPower[TOK_OR] = 2;
	      bindingPower[TOK_AND] = 3;
	      bindingPower[TOK_EQ] = 5;
	      bindingPower[TOK_GT] = 5;
	      bindingPower[TOK_LT] = 5;
	      bindingPower[TOK_GTE] = 5;
	      bindingPower[TOK_LTE] = 5;
	      bindingPower[TOK_NE] = 5;
	      bindingPower[TOK_FLATTEN] = 9;
	      bindingPower[TOK_STAR] = 20;
	      bindingPower[TOK_FILTER] = 21;
	      bindingPower[TOK_DOT] = 40;
	      bindingPower[TOK_NOT] = 45;
	      bindingPower[TOK_LBRACE] = 50;
	      bindingPower[TOK_LBRACKET] = 55;
	      bindingPower[TOK_LPAREN] = 60;

	  function Parser() {
	  }

	  Parser.prototype = {
	      parse: function(expression) {
	          this._loadTokens(expression);
	          this.index = 0;
	          var ast = this.expression(0);
	          if (this._lookahead(0) !== TOK_EOF) {
	              var t = this._lookaheadToken(0);
	              var error = new Error(
	                  "Unexpected token type: " + t.type + ", value: " + t.value);
	              error.name = "ParserError";
	              throw error;
	          }
	          return ast;
	      },

	      _loadTokens: function(expression) {
	          var lexer = new Lexer();
	          var tokens = lexer.tokenize(expression);
	          tokens.push({type: TOK_EOF, value: "", start: expression.length});
	          this.tokens = tokens;
	      },

	      expression: function(rbp) {
	          var leftToken = this._lookaheadToken(0);
	          this._advance();
	          var left = this.nud(leftToken);
	          var currentToken = this._lookahead(0);
	          while (rbp < bindingPower[currentToken]) {
	              this._advance();
	              left = this.led(currentToken, left);
	              currentToken = this._lookahead(0);
	          }
	          return left;
	      },

	      _lookahead: function(number) {
	          return this.tokens[this.index + number].type;
	      },

	      _lookaheadToken: function(number) {
	          return this.tokens[this.index + number];
	      },

	      _advance: function() {
	          this.index++;
	      },

	      nud: function(token) {
	        var left;
	        var right;
	        var expression;
	        switch (token.type) {
	          case TOK_LITERAL:
	            return {type: "Literal", value: token.value};
	          case TOK_UNQUOTEDIDENTIFIER:
	            return {type: "Field", name: token.value};
	          case TOK_QUOTEDIDENTIFIER:
	            var node = {type: "Field", name: token.value};
	            if (this._lookahead(0) === TOK_LPAREN) {
	                throw new Error("Quoted identifier not allowed for function names.");
	            } else {
	                return node;
	            }
	            break;
	          case TOK_NOT:
	            right = this.expression(bindingPower.Not);
	            return {type: "NotExpression", children: [right]};
	          case TOK_STAR:
	            left = {type: "Identity"};
	            right = null;
	            if (this._lookahead(0) === TOK_RBRACKET) {
	                // This can happen in a multiselect,
	                // [a, b, *]
	                right = {type: "Identity"};
	            } else {
	                right = this._parseProjectionRHS(bindingPower.Star);
	            }
	            return {type: "ValueProjection", children: [left, right]};
	          case TOK_FILTER:
	            return this.led(token.type, {type: "Identity"});
	          case TOK_LBRACE:
	            return this._parseMultiselectHash();
	          case TOK_FLATTEN:
	            left = {type: TOK_FLATTEN, children: [{type: "Identity"}]};
	            right = this._parseProjectionRHS(bindingPower.Flatten);
	            return {type: "Projection", children: [left, right]};
	          case TOK_LBRACKET:
	            if (this._lookahead(0) === TOK_NUMBER || this._lookahead(0) === TOK_COLON) {
	                right = this._parseIndexExpression();
	                return this._projectIfSlice({type: "Identity"}, right);
	            } else if (this._lookahead(0) === TOK_STAR &&
	                       this._lookahead(1) === TOK_RBRACKET) {
	                this._advance();
	                this._advance();
	                right = this._parseProjectionRHS(bindingPower.Star);
	                return {type: "Projection",
	                        children: [{type: "Identity"}, right]};
	            } else {
	                return this._parseMultiselectList();
	            }
	            break;
	          case TOK_CURRENT:
	            return {type: TOK_CURRENT};
	          case TOK_EXPREF:
	            expression = this.expression(bindingPower.Expref);
	            return {type: "ExpressionReference", children: [expression]};
	          case TOK_LPAREN:
	            var args = [];
	            while (this._lookahead(0) !== TOK_RPAREN) {
	              if (this._lookahead(0) === TOK_CURRENT) {
	                expression = {type: TOK_CURRENT};
	                this._advance();
	              } else {
	                expression = this.expression(0);
	              }
	              args.push(expression);
	            }
	            this._match(TOK_RPAREN);
	            return args[0];
	          default:
	            this._errorToken(token);
	        }
	      },

	      led: function(tokenName, left) {
	        var right;
	        switch(tokenName) {
	          case TOK_DOT:
	            var rbp = bindingPower.Dot;
	            if (this._lookahead(0) !== TOK_STAR) {
	                right = this._parseDotRHS(rbp);
	                return {type: "Subexpression", children: [left, right]};
	            } else {
	                // Creating a projection.
	                this._advance();
	                right = this._parseProjectionRHS(rbp);
	                return {type: "ValueProjection", children: [left, right]};
	            }
	            break;
	          case TOK_PIPE:
	            right = this.expression(bindingPower.Pipe);
	            return {type: TOK_PIPE, children: [left, right]};
	          case TOK_OR:
	            right = this.expression(bindingPower.Or);
	            return {type: "OrExpression", children: [left, right]};
	          case TOK_AND:
	            right = this.expression(bindingPower.And);
	            return {type: "AndExpression", children: [left, right]};
	          case TOK_LPAREN:
	            var name = left.name;
	            var args = [];
	            var expression, node;
	            while (this._lookahead(0) !== TOK_RPAREN) {
	              if (this._lookahead(0) === TOK_CURRENT) {
	                expression = {type: TOK_CURRENT};
	                this._advance();
	              } else {
	                expression = this.expression(0);
	              }
	              if (this._lookahead(0) === TOK_COMMA) {
	                this._match(TOK_COMMA);
	              }
	              args.push(expression);
	            }
	            this._match(TOK_RPAREN);
	            node = {type: "Function", name: name, children: args};
	            return node;
	          case TOK_FILTER:
	            var condition = this.expression(0);
	            this._match(TOK_RBRACKET);
	            if (this._lookahead(0) === TOK_FLATTEN) {
	              right = {type: "Identity"};
	            } else {
	              right = this._parseProjectionRHS(bindingPower.Filter);
	            }
	            return {type: "FilterProjection", children: [left, right, condition]};
	          case TOK_FLATTEN:
	            var leftNode = {type: TOK_FLATTEN, children: [left]};
	            var rightNode = this._parseProjectionRHS(bindingPower.Flatten);
	            return {type: "Projection", children: [leftNode, rightNode]};
	          case TOK_EQ:
	          case TOK_NE:
	          case TOK_GT:
	          case TOK_GTE:
	          case TOK_LT:
	          case TOK_LTE:
	            return this._parseComparator(left, tokenName);
	          case TOK_LBRACKET:
	            var token = this._lookaheadToken(0);
	            if (token.type === TOK_NUMBER || token.type === TOK_COLON) {
	                right = this._parseIndexExpression();
	                return this._projectIfSlice(left, right);
	            } else {
	                this._match(TOK_STAR);
	                this._match(TOK_RBRACKET);
	                right = this._parseProjectionRHS(bindingPower.Star);
	                return {type: "Projection", children: [left, right]};
	            }
	            break;
	          default:
	            this._errorToken(this._lookaheadToken(0));
	        }
	      },

	      _match: function(tokenType) {
	          if (this._lookahead(0) === tokenType) {
	              this._advance();
	          } else {
	              var t = this._lookaheadToken(0);
	              var error = new Error("Expected " + tokenType + ", got: " + t.type);
	              error.name = "ParserError";
	              throw error;
	          }
	      },

	      _errorToken: function(token) {
	          var error = new Error("Invalid token (" +
	                                token.type + "): \"" +
	                                token.value + "\"");
	          error.name = "ParserError";
	          throw error;
	      },


	      _parseIndexExpression: function() {
	          if (this._lookahead(0) === TOK_COLON || this._lookahead(1) === TOK_COLON) {
	              return this._parseSliceExpression();
	          } else {
	              var node = {
	                  type: "Index",
	                  value: this._lookaheadToken(0).value};
	              this._advance();
	              this._match(TOK_RBRACKET);
	              return node;
	          }
	      },

	      _projectIfSlice: function(left, right) {
	          var indexExpr = {type: "IndexExpression", children: [left, right]};
	          if (right.type === "Slice") {
	              return {
	                  type: "Projection",
	                  children: [indexExpr, this._parseProjectionRHS(bindingPower.Star)]
	              };
	          } else {
	              return indexExpr;
	          }
	      },

	      _parseSliceExpression: function() {
	          // [start:end:step] where each part is optional, as well as the last
	          // colon.
	          var parts = [null, null, null];
	          var index = 0;
	          var currentToken = this._lookahead(0);
	          while (currentToken !== TOK_RBRACKET && index < 3) {
	              if (currentToken === TOK_COLON) {
	                  index++;
	                  this._advance();
	              } else if (currentToken === TOK_NUMBER) {
	                  parts[index] = this._lookaheadToken(0).value;
	                  this._advance();
	              } else {
	                  var t = this._lookahead(0);
	                  var error = new Error("Syntax error, unexpected token: " +
	                                        t.value + "(" + t.type + ")");
	                  error.name = "Parsererror";
	                  throw error;
	              }
	              currentToken = this._lookahead(0);
	          }
	          this._match(TOK_RBRACKET);
	          return {
	              type: "Slice",
	              children: parts
	          };
	      },

	      _parseComparator: function(left, comparator) {
	        var right = this.expression(bindingPower[comparator]);
	        return {type: "Comparator", name: comparator, children: [left, right]};
	      },

	      _parseDotRHS: function(rbp) {
	          var lookahead = this._lookahead(0);
	          var exprTokens = [TOK_UNQUOTEDIDENTIFIER, TOK_QUOTEDIDENTIFIER, TOK_STAR];
	          if (exprTokens.indexOf(lookahead) >= 0) {
	              return this.expression(rbp);
	          } else if (lookahead === TOK_LBRACKET) {
	              this._match(TOK_LBRACKET);
	              return this._parseMultiselectList();
	          } else if (lookahead === TOK_LBRACE) {
	              this._match(TOK_LBRACE);
	              return this._parseMultiselectHash();
	          }
	      },

	      _parseProjectionRHS: function(rbp) {
	          var right;
	          if (bindingPower[this._lookahead(0)] < 10) {
	              right = {type: "Identity"};
	          } else if (this._lookahead(0) === TOK_LBRACKET) {
	              right = this.expression(rbp);
	          } else if (this._lookahead(0) === TOK_FILTER) {
	              right = this.expression(rbp);
	          } else if (this._lookahead(0) === TOK_DOT) {
	              this._match(TOK_DOT);
	              right = this._parseDotRHS(rbp);
	          } else {
	              var t = this._lookaheadToken(0);
	              var error = new Error("Sytanx error, unexpected token: " +
	                                    t.value + "(" + t.type + ")");
	              error.name = "ParserError";
	              throw error;
	          }
	          return right;
	      },

	      _parseMultiselectList: function() {
	          var expressions = [];
	          while (this._lookahead(0) !== TOK_RBRACKET) {
	              var expression = this.expression(0);
	              expressions.push(expression);
	              if (this._lookahead(0) === TOK_COMMA) {
	                  this._match(TOK_COMMA);
	                  if (this._lookahead(0) === TOK_RBRACKET) {
	                    throw new Error("Unexpected token Rbracket");
	                  }
	              }
	          }
	          this._match(TOK_RBRACKET);
	          return {type: "MultiSelectList", children: expressions};
	      },

	      _parseMultiselectHash: function() {
	        var pairs = [];
	        var identifierTypes = [TOK_UNQUOTEDIDENTIFIER, TOK_QUOTEDIDENTIFIER];
	        var keyToken, keyName, value, node;
	        for (;;) {
	          keyToken = this._lookaheadToken(0);
	          if (identifierTypes.indexOf(keyToken.type) < 0) {
	            throw new Error("Expecting an identifier token, got: " +
	                            keyToken.type);
	          }
	          keyName = keyToken.value;
	          this._advance();
	          this._match(TOK_COLON);
	          value = this.expression(0);
	          node = {type: "KeyValuePair", name: keyName, value: value};
	          pairs.push(node);
	          if (this._lookahead(0) === TOK_COMMA) {
	            this._match(TOK_COMMA);
	          } else if (this._lookahead(0) === TOK_RBRACE) {
	            this._match(TOK_RBRACE);
	            break;
	          }
	        }
	        return {type: "MultiSelectHash", children: pairs};
	      }
	  };


	  function TreeInterpreter(runtime) {
	    this.runtime = runtime;
	  }

	  TreeInterpreter.prototype = {
	      search: function(node, value) {
	          return this.visit(node, value);
	      },

	      visit: function(node, value) {
	          var matched, current, result, first, second, field, left, right, collected, i;
	          switch (node.type) {
	            case "Field":
	              if (value === null ) {
	                  return null;
	              } else if (isObject(value)) {
	                  field = value[node.name];
	                  if (field === undefined) {
	                      return null;
	                  } else {
	                      return field;
	                  }
	              } else {
	                return null;
	              }
	              break;
	            case "Subexpression":
	              result = this.visit(node.children[0], value);
	              for (i = 1; i < node.children.length; i++) {
	                  result = this.visit(node.children[1], result);
	                  if (result === null) {
	                      return null;
	                  }
	              }
	              return result;
	            case "IndexExpression":
	              left = this.visit(node.children[0], value);
	              right = this.visit(node.children[1], left);
	              return right;
	            case "Index":
	              if (!isArray(value)) {
	                return null;
	              }
	              var index = node.value;
	              if (index < 0) {
	                index = value.length + index;
	              }
	              result = value[index];
	              if (result === undefined) {
	                result = null;
	              }
	              return result;
	            case "Slice":
	              if (!isArray(value)) {
	                return null;
	              }
	              var sliceParams = node.children.slice(0);
	              var computed = this.computeSliceParams(value.length, sliceParams);
	              var start = computed[0];
	              var stop = computed[1];
	              var step = computed[2];
	              result = [];
	              if (step > 0) {
	                  for (i = start; i < stop; i += step) {
	                      result.push(value[i]);
	                  }
	              } else {
	                  for (i = start; i > stop; i += step) {
	                      result.push(value[i]);
	                  }
	              }
	              return result;
	            case "Projection":
	              // Evaluate left child.
	              var base = this.visit(node.children[0], value);
	              if (!isArray(base)) {
	                return null;
	              }
	              collected = [];
	              for (i = 0; i < base.length; i++) {
	                current = this.visit(node.children[1], base[i]);
	                if (current !== null) {
	                  collected.push(current);
	                }
	              }
	              return collected;
	            case "ValueProjection":
	              // Evaluate left child.
	              base = this.visit(node.children[0], value);
	              if (!isObject(base)) {
	                return null;
	              }
	              collected = [];
	              var values = objValues(base);
	              for (i = 0; i < values.length; i++) {
	                current = this.visit(node.children[1], values[i]);
	                if (current !== null) {
	                  collected.push(current);
	                }
	              }
	              return collected;
	            case "FilterProjection":
	              base = this.visit(node.children[0], value);
	              if (!isArray(base)) {
	                return null;
	              }
	              var filtered = [];
	              var finalResults = [];
	              for (i = 0; i < base.length; i++) {
	                matched = this.visit(node.children[2], base[i]);
	                if (!isFalse(matched)) {
	                  filtered.push(base[i]);
	                }
	              }
	              for (var j = 0; j < filtered.length; j++) {
	                current = this.visit(node.children[1], filtered[j]);
	                if (current !== null) {
	                  finalResults.push(current);
	                }
	              }
	              return finalResults;
	            case "Comparator":
	              first = this.visit(node.children[0], value);
	              second = this.visit(node.children[1], value);
	              switch(node.name) {
	                case TOK_EQ:
	                  result = strictDeepEqual(first, second);
	                  break;
	                case TOK_NE:
	                  result = !strictDeepEqual(first, second);
	                  break;
	                case TOK_GT:
	                  result = first > second;
	                  break;
	                case TOK_GTE:
	                  result = first >= second;
	                  break;
	                case TOK_LT:
	                  result = first < second;
	                  break;
	                case TOK_LTE:
	                  result = first <= second;
	                  break;
	                default:
	                  throw new Error("Unknown comparator: " + node.name);
	              }
	              return result;
	            case TOK_FLATTEN:
	              var original = this.visit(node.children[0], value);
	              if (!isArray(original)) {
	                return null;
	              }
	              var merged = [];
	              for (i = 0; i < original.length; i++) {
	                current = original[i];
	                if (isArray(current)) {
	                  merged.push.apply(merged, current);
	                } else {
	                  merged.push(current);
	                }
	              }
	              return merged;
	            case "Identity":
	              return value;
	            case "MultiSelectList":
	              if (value === null) {
	                return null;
	              }
	              collected = [];
	              for (i = 0; i < node.children.length; i++) {
	                  collected.push(this.visit(node.children[i], value));
	              }
	              return collected;
	            case "MultiSelectHash":
	              if (value === null) {
	                return null;
	              }
	              collected = {};
	              var child;
	              for (i = 0; i < node.children.length; i++) {
	                child = node.children[i];
	                collected[child.name] = this.visit(child.value, value);
	              }
	              return collected;
	            case "OrExpression":
	              matched = this.visit(node.children[0], value);
	              if (isFalse(matched)) {
	                  matched = this.visit(node.children[1], value);
	              }
	              return matched;
	            case "AndExpression":
	              first = this.visit(node.children[0], value);

	              if (isFalse(first) === true) {
	                return first;
	              }
	              return this.visit(node.children[1], value);
	            case "NotExpression":
	              first = this.visit(node.children[0], value);
	              return isFalse(first);
	            case "Literal":
	              return node.value;
	            case TOK_PIPE:
	              left = this.visit(node.children[0], value);
	              return this.visit(node.children[1], left);
	            case TOK_CURRENT:
	              return value;
	            case "Function":
	              var resolvedArgs = [];
	              for (i = 0; i < node.children.length; i++) {
	                  resolvedArgs.push(this.visit(node.children[i], value));
	              }
	              return this.runtime.callFunction(node.name, resolvedArgs);
	            case "ExpressionReference":
	              var refNode = node.children[0];
	              // Tag the node with a specific attribute so the type
	              // checker verify the type.
	              refNode.jmespathType = TOK_EXPREF;
	              return refNode;
	            default:
	              throw new Error("Unknown node type: " + node.type);
	          }
	      },

	      computeSliceParams: function(arrayLength, sliceParams) {
	        var start = sliceParams[0];
	        var stop = sliceParams[1];
	        var step = sliceParams[2];
	        var computed = [null, null, null];
	        if (step === null) {
	          step = 1;
	        } else if (step === 0) {
	          var error = new Error("Invalid slice, step cannot be 0");
	          error.name = "RuntimeError";
	          throw error;
	        }
	        var stepValueNegative = step < 0 ? true : false;

	        if (start === null) {
	            start = stepValueNegative ? arrayLength - 1 : 0;
	        } else {
	            start = this.capSliceRange(arrayLength, start, step);
	        }

	        if (stop === null) {
	            stop = stepValueNegative ? -1 : arrayLength;
	        } else {
	            stop = this.capSliceRange(arrayLength, stop, step);
	        }
	        computed[0] = start;
	        computed[1] = stop;
	        computed[2] = step;
	        return computed;
	      },

	      capSliceRange: function(arrayLength, actualValue, step) {
	          if (actualValue < 0) {
	              actualValue += arrayLength;
	              if (actualValue < 0) {
	                  actualValue = step < 0 ? -1 : 0;
	              }
	          } else if (actualValue >= arrayLength) {
	              actualValue = step < 0 ? arrayLength - 1 : arrayLength;
	          }
	          return actualValue;
	      }

	  };

	  function Runtime(interpreter) {
	    this._interpreter = interpreter;
	    this.functionTable = {
	        // name: [function, <signature>]
	        // The <signature> can be:
	        //
	        // {
	        //   args: [[type1, type2], [type1, type2]],
	        //   variadic: true|false
	        // }
	        //
	        // Each arg in the arg list is a list of valid types
	        // (if the function is overloaded and supports multiple
	        // types.  If the type is "any" then no type checking
	        // occurs on the argument.  Variadic is optional
	        // and if not provided is assumed to be false.
	        abs: {_func: this._functionAbs, _signature: [{types: [TYPE_NUMBER]}]},
	        avg: {_func: this._functionAvg, _signature: [{types: [TYPE_ARRAY_NUMBER]}]},
	        ceil: {_func: this._functionCeil, _signature: [{types: [TYPE_NUMBER]}]},
	        contains: {
	            _func: this._functionContains,
	            _signature: [{types: [TYPE_STRING, TYPE_ARRAY]},
	                        {types: [TYPE_ANY]}]},
	        "ends_with": {
	            _func: this._functionEndsWith,
	            _signature: [{types: [TYPE_STRING]}, {types: [TYPE_STRING]}]},
	        floor: {_func: this._functionFloor, _signature: [{types: [TYPE_NUMBER]}]},
	        length: {
	            _func: this._functionLength,
	            _signature: [{types: [TYPE_STRING, TYPE_ARRAY, TYPE_OBJECT]}]},
	        map: {
	            _func: this._functionMap,
	            _signature: [{types: [TYPE_EXPREF]}, {types: [TYPE_ARRAY]}]},
	        max: {
	            _func: this._functionMax,
	            _signature: [{types: [TYPE_ARRAY_NUMBER, TYPE_ARRAY_STRING]}]},
	        "merge": {
	            _func: this._functionMerge,
	            _signature: [{types: [TYPE_OBJECT], variadic: true}]
	        },
	        "max_by": {
	          _func: this._functionMaxBy,
	          _signature: [{types: [TYPE_ARRAY]}, {types: [TYPE_EXPREF]}]
	        },
	        sum: {_func: this._functionSum, _signature: [{types: [TYPE_ARRAY_NUMBER]}]},
	        "starts_with": {
	            _func: this._functionStartsWith,
	            _signature: [{types: [TYPE_STRING]}, {types: [TYPE_STRING]}]},
	        min: {
	            _func: this._functionMin,
	            _signature: [{types: [TYPE_ARRAY_NUMBER, TYPE_ARRAY_STRING]}]},
	        "min_by": {
	          _func: this._functionMinBy,
	          _signature: [{types: [TYPE_ARRAY]}, {types: [TYPE_EXPREF]}]
	        },
	        type: {_func: this._functionType, _signature: [{types: [TYPE_ANY]}]},
	        keys: {_func: this._functionKeys, _signature: [{types: [TYPE_OBJECT]}]},
	        values: {_func: this._functionValues, _signature: [{types: [TYPE_OBJECT]}]},
	        sort: {_func: this._functionSort, _signature: [{types: [TYPE_ARRAY_STRING, TYPE_ARRAY_NUMBER]}]},
	        "sort_by": {
	          _func: this._functionSortBy,
	          _signature: [{types: [TYPE_ARRAY]}, {types: [TYPE_EXPREF]}]
	        },
	        join: {
	            _func: this._functionJoin,
	            _signature: [
	                {types: [TYPE_STRING]},
	                {types: [TYPE_ARRAY_STRING]}
	            ]
	        },
	        reverse: {
	            _func: this._functionReverse,
	            _signature: [{types: [TYPE_STRING, TYPE_ARRAY]}]},
	        "to_array": {_func: this._functionToArray, _signature: [{types: [TYPE_ANY]}]},
	        "to_string": {_func: this._functionToString, _signature: [{types: [TYPE_ANY]}]},
	        "to_number": {_func: this._functionToNumber, _signature: [{types: [TYPE_ANY]}]},
	        "not_null": {
	            _func: this._functionNotNull,
	            _signature: [{types: [TYPE_ANY], variadic: true}]
	        }
	    };
	  }

	  Runtime.prototype = {
	    callFunction: function(name, resolvedArgs) {
	      var functionEntry = this.functionTable[name];
	      if (functionEntry === undefined) {
	          throw new Error("Unknown function: " + name + "()");
	      }
	      this._validateArgs(name, resolvedArgs, functionEntry._signature);
	      return functionEntry._func.call(this, resolvedArgs);
	    },

	    _validateArgs: function(name, args, signature) {
	        // Validating the args requires validating
	        // the correct arity and the correct type of each arg.
	        // If the last argument is declared as variadic, then we need
	        // a minimum number of args to be required.  Otherwise it has to
	        // be an exact amount.
	        var pluralized;
	        if (signature[signature.length - 1].variadic) {
	            if (args.length < signature.length) {
	                pluralized = signature.length === 1 ? " argument" : " arguments";
	                throw new Error("ArgumentError: " + name + "() " +
	                                "takes at least" + signature.length + pluralized +
	                                " but received " + args.length);
	            }
	        } else if (args.length !== signature.length) {
	            pluralized = signature.length === 1 ? " argument" : " arguments";
	            throw new Error("ArgumentError: " + name + "() " +
	                            "takes " + signature.length + pluralized +
	                            " but received " + args.length);
	        }
	        var currentSpec;
	        var actualType;
	        var typeMatched;
	        for (var i = 0; i < signature.length; i++) {
	            typeMatched = false;
	            currentSpec = signature[i].types;
	            actualType = this._getTypeName(args[i]);
	            for (var j = 0; j < currentSpec.length; j++) {
	                if (this._typeMatches(actualType, currentSpec[j], args[i])) {
	                    typeMatched = true;
	                    break;
	                }
	            }
	            if (!typeMatched) {
	                throw new Error("TypeError: " + name + "() " +
	                                "expected argument " + (i + 1) +
	                                " to be type " + currentSpec +
	                                " but received type " + actualType +
	                                " instead.");
	            }
	        }
	    },

	    _typeMatches: function(actual, expected, argValue) {
	        if (expected === TYPE_ANY) {
	            return true;
	        }
	        if (expected === TYPE_ARRAY_STRING ||
	            expected === TYPE_ARRAY_NUMBER ||
	            expected === TYPE_ARRAY) {
	            // The expected type can either just be array,
	            // or it can require a specific subtype (array of numbers).
	            //
	            // The simplest case is if "array" with no subtype is specified.
	            if (expected === TYPE_ARRAY) {
	                return actual === TYPE_ARRAY;
	            } else if (actual === TYPE_ARRAY) {
	                // Otherwise we need to check subtypes.
	                // I think this has potential to be improved.
	                var subtype;
	                if (expected === TYPE_ARRAY_NUMBER) {
	                  subtype = TYPE_NUMBER;
	                } else if (expected === TYPE_ARRAY_STRING) {
	                  subtype = TYPE_STRING;
	                }
	                for (var i = 0; i < argValue.length; i++) {
	                    if (!this._typeMatches(
	                            this._getTypeName(argValue[i]), subtype,
	                                             argValue[i])) {
	                        return false;
	                    }
	                }
	                return true;
	            }
	        } else {
	            return actual === expected;
	        }
	    },
	    _getTypeName: function(obj) {
	        switch (Object.prototype.toString.call(obj)) {
	            case "[object String]":
	              return TYPE_STRING;
	            case "[object Number]":
	              return TYPE_NUMBER;
	            case "[object Array]":
	              return TYPE_ARRAY;
	            case "[object Boolean]":
	              return TYPE_BOOLEAN;
	            case "[object Null]":
	              return TYPE_NULL;
	            case "[object Object]":
	              // Check if it's an expref.  If it has, it's been
	              // tagged with a jmespathType attr of 'Expref';
	              if (obj.jmespathType === TOK_EXPREF) {
	                return TYPE_EXPREF;
	              } else {
	                return TYPE_OBJECT;
	              }
	        }
	    },

	    _functionStartsWith: function(resolvedArgs) {
	        return resolvedArgs[0].lastIndexOf(resolvedArgs[1]) === 0;
	    },

	    _functionEndsWith: function(resolvedArgs) {
	        var searchStr = resolvedArgs[0];
	        var suffix = resolvedArgs[1];
	        return searchStr.indexOf(suffix, searchStr.length - suffix.length) !== -1;
	    },

	    _functionReverse: function(resolvedArgs) {
	        var typeName = this._getTypeName(resolvedArgs[0]);
	        if (typeName === TYPE_STRING) {
	          var originalStr = resolvedArgs[0];
	          var reversedStr = "";
	          for (var i = originalStr.length - 1; i >= 0; i--) {
	              reversedStr += originalStr[i];
	          }
	          return reversedStr;
	        } else {
	          var reversedArray = resolvedArgs[0].slice(0);
	          reversedArray.reverse();
	          return reversedArray;
	        }
	    },

	    _functionAbs: function(resolvedArgs) {
	      return Math.abs(resolvedArgs[0]);
	    },

	    _functionCeil: function(resolvedArgs) {
	        return Math.ceil(resolvedArgs[0]);
	    },

	    _functionAvg: function(resolvedArgs) {
	        var sum = 0;
	        var inputArray = resolvedArgs[0];
	        for (var i = 0; i < inputArray.length; i++) {
	            sum += inputArray[i];
	        }
	        return sum / inputArray.length;
	    },

	    _functionContains: function(resolvedArgs) {
	        return resolvedArgs[0].indexOf(resolvedArgs[1]) >= 0;
	    },

	    _functionFloor: function(resolvedArgs) {
	        return Math.floor(resolvedArgs[0]);
	    },

	    _functionLength: function(resolvedArgs) {
	       if (!isObject(resolvedArgs[0])) {
	         return resolvedArgs[0].length;
	       } else {
	         // As far as I can tell, there's no way to get the length
	         // of an object without O(n) iteration through the object.
	         return Object.keys(resolvedArgs[0]).length;
	       }
	    },

	    _functionMap: function(resolvedArgs) {
	      var mapped = [];
	      var interpreter = this._interpreter;
	      var exprefNode = resolvedArgs[0];
	      var elements = resolvedArgs[1];
	      for (var i = 0; i < elements.length; i++) {
	          mapped.push(interpreter.visit(exprefNode, elements[i]));
	      }
	      return mapped;
	    },

	    _functionMerge: function(resolvedArgs) {
	      var merged = {};
	      for (var i = 0; i < resolvedArgs.length; i++) {
	        var current = resolvedArgs[i];
	        for (var key in current) {
	          merged[key] = current[key];
	        }
	      }
	      return merged;
	    },

	    _functionMax: function(resolvedArgs) {
	      if (resolvedArgs[0].length > 0) {
	        var typeName = this._getTypeName(resolvedArgs[0][0]);
	        if (typeName === TYPE_NUMBER) {
	          return Math.max.apply(Math, resolvedArgs[0]);
	        } else {
	          var elements = resolvedArgs[0];
	          var maxElement = elements[0];
	          for (var i = 1; i < elements.length; i++) {
	              if (maxElement.localeCompare(elements[i]) < 0) {
	                  maxElement = elements[i];
	              }
	          }
	          return maxElement;
	        }
	      } else {
	          return null;
	      }
	    },

	    _functionMin: function(resolvedArgs) {
	      if (resolvedArgs[0].length > 0) {
	        var typeName = this._getTypeName(resolvedArgs[0][0]);
	        if (typeName === TYPE_NUMBER) {
	          return Math.min.apply(Math, resolvedArgs[0]);
	        } else {
	          var elements = resolvedArgs[0];
	          var minElement = elements[0];
	          for (var i = 1; i < elements.length; i++) {
	              if (elements[i].localeCompare(minElement) < 0) {
	                  minElement = elements[i];
	              }
	          }
	          return minElement;
	        }
	      } else {
	        return null;
	      }
	    },

	    _functionSum: function(resolvedArgs) {
	      var sum = 0;
	      var listToSum = resolvedArgs[0];
	      for (var i = 0; i < listToSum.length; i++) {
	        sum += listToSum[i];
	      }
	      return sum;
	    },

	    _functionType: function(resolvedArgs) {
	        switch (this._getTypeName(resolvedArgs[0])) {
	          case TYPE_NUMBER:
	            return "number";
	          case TYPE_STRING:
	            return "string";
	          case TYPE_ARRAY:
	            return "array";
	          case TYPE_OBJECT:
	            return "object";
	          case TYPE_BOOLEAN:
	            return "boolean";
	          case TYPE_EXPREF:
	            return "expref";
	          case TYPE_NULL:
	            return "null";
	        }
	    },

	    _functionKeys: function(resolvedArgs) {
	        return Object.keys(resolvedArgs[0]);
	    },

	    _functionValues: function(resolvedArgs) {
	        var obj = resolvedArgs[0];
	        var keys = Object.keys(obj);
	        var values = [];
	        for (var i = 0; i < keys.length; i++) {
	            values.push(obj[keys[i]]);
	        }
	        return values;
	    },

	    _functionJoin: function(resolvedArgs) {
	        var joinChar = resolvedArgs[0];
	        var listJoin = resolvedArgs[1];
	        return listJoin.join(joinChar);
	    },

	    _functionToArray: function(resolvedArgs) {
	        if (this._getTypeName(resolvedArgs[0]) === TYPE_ARRAY) {
	            return resolvedArgs[0];
	        } else {
	            return [resolvedArgs[0]];
	        }
	    },

	    _functionToString: function(resolvedArgs) {
	        if (this._getTypeName(resolvedArgs[0]) === TYPE_STRING) {
	            return resolvedArgs[0];
	        } else {
	            return JSON.stringify(resolvedArgs[0]);
	        }
	    },

	    _functionToNumber: function(resolvedArgs) {
	        var typeName = this._getTypeName(resolvedArgs[0]);
	        var convertedValue;
	        if (typeName === TYPE_NUMBER) {
	            return resolvedArgs[0];
	        } else if (typeName === TYPE_STRING) {
	            convertedValue = +resolvedArgs[0];
	            if (!isNaN(convertedValue)) {
	                return convertedValue;
	            }
	        }
	        return null;
	    },

	    _functionNotNull: function(resolvedArgs) {
	        for (var i = 0; i < resolvedArgs.length; i++) {
	            if (this._getTypeName(resolvedArgs[i]) !== TYPE_NULL) {
	                return resolvedArgs[i];
	            }
	        }
	        return null;
	    },

	    _functionSort: function(resolvedArgs) {
	        var sortedArray = resolvedArgs[0].slice(0);
	        sortedArray.sort();
	        return sortedArray;
	    },

	    _functionSortBy: function(resolvedArgs) {
	        var sortedArray = resolvedArgs[0].slice(0);
	        if (sortedArray.length === 0) {
	            return sortedArray;
	        }
	        var interpreter = this._interpreter;
	        var exprefNode = resolvedArgs[1];
	        var requiredType = this._getTypeName(
	            interpreter.visit(exprefNode, sortedArray[0]));
	        if ([TYPE_NUMBER, TYPE_STRING].indexOf(requiredType) < 0) {
	            throw new Error("TypeError");
	        }
	        var that = this;
	        // In order to get a stable sort out of an unstable
	        // sort algorithm, we decorate/sort/undecorate (DSU)
	        // by creating a new list of [index, element] pairs.
	        // In the cmp function, if the evaluated elements are
	        // equal, then the index will be used as the tiebreaker.
	        // After the decorated list has been sorted, it will be
	        // undecorated to extract the original elements.
	        var decorated = [];
	        for (var i = 0; i < sortedArray.length; i++) {
	          decorated.push([i, sortedArray[i]]);
	        }
	        decorated.sort(function(a, b) {
	          var exprA = interpreter.visit(exprefNode, a[1]);
	          var exprB = interpreter.visit(exprefNode, b[1]);
	          if (that._getTypeName(exprA) !== requiredType) {
	              throw new Error(
	                  "TypeError: expected " + requiredType + ", received " +
	                  that._getTypeName(exprA));
	          } else if (that._getTypeName(exprB) !== requiredType) {
	              throw new Error(
	                  "TypeError: expected " + requiredType + ", received " +
	                  that._getTypeName(exprB));
	          }
	          if (exprA > exprB) {
	            return 1;
	          } else if (exprA < exprB) {
	            return -1;
	          } else {
	            // If they're equal compare the items by their
	            // order to maintain relative order of equal keys
	            // (i.e. to get a stable sort).
	            return a[0] - b[0];
	          }
	        });
	        // Undecorate: extract out the original list elements.
	        for (var j = 0; j < decorated.length; j++) {
	          sortedArray[j] = decorated[j][1];
	        }
	        return sortedArray;
	    },

	    _functionMaxBy: function(resolvedArgs) {
	      var exprefNode = resolvedArgs[1];
	      var resolvedArray = resolvedArgs[0];
	      var keyFunction = this.createKeyFunction(exprefNode, [TYPE_NUMBER, TYPE_STRING]);
	      var maxNumber = -Infinity;
	      var maxRecord;
	      var current;
	      for (var i = 0; i < resolvedArray.length; i++) {
	        current = keyFunction(resolvedArray[i]);
	        if (current > maxNumber) {
	          maxNumber = current;
	          maxRecord = resolvedArray[i];
	        }
	      }
	      return maxRecord;
	    },

	    _functionMinBy: function(resolvedArgs) {
	      var exprefNode = resolvedArgs[1];
	      var resolvedArray = resolvedArgs[0];
	      var keyFunction = this.createKeyFunction(exprefNode, [TYPE_NUMBER, TYPE_STRING]);
	      var minNumber = Infinity;
	      var minRecord;
	      var current;
	      for (var i = 0; i < resolvedArray.length; i++) {
	        current = keyFunction(resolvedArray[i]);
	        if (current < minNumber) {
	          minNumber = current;
	          minRecord = resolvedArray[i];
	        }
	      }
	      return minRecord;
	    },

	    createKeyFunction: function(exprefNode, allowedTypes) {
	      var that = this;
	      var interpreter = this._interpreter;
	      var keyFunc = function(x) {
	        var current = interpreter.visit(exprefNode, x);
	        if (allowedTypes.indexOf(that._getTypeName(current)) < 0) {
	          var msg = "TypeError: expected one of " + allowedTypes +
	                    ", received " + that._getTypeName(current);
	          throw new Error(msg);
	        }
	        return current;
	      };
	      return keyFunc;
	    }

	  };

	  function compile(stream) {
	    var parser = new Parser();
	    var ast = parser.parse(stream);
	    return ast;
	  }

	  function tokenize(stream) {
	      var lexer = new Lexer();
	      return lexer.tokenize(stream);
	  }

	  function search(data, expression) {
	      var parser = new Parser();
	      // This needs to be improved.  Both the interpreter and runtime depend on
	      // each other.  The runtime needs the interpreter to support exprefs.
	      // There's likely a clean way to avoid the cyclic dependency.
	      var runtime = new Runtime();
	      var interpreter = new TreeInterpreter(runtime);
	      runtime._interpreter = interpreter;
	      var node = parser.parse(expression);
	      return interpreter.search(node, data);
	  }

	  exports.tokenize = tokenize;
	  exports.compile = compile;
	  exports.search = search;
	  exports.strictDeepEqual = strictDeepEqual;
	})( false ? this.jmespath = {} : exports);


/***/ },
/* 19 */
/***/ function(module, exports) {

	/*
	 * Natural Sort algorithm for Javascript - Version 0.7 - Released under MIT license
	 * Author: Jim Palmer (based on chunking idea from Dave Koelle)
	 */
	/*jshint unused:false */
	module.exports = function naturalSort (a, b) {
		"use strict";
		var re = /(^([+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?)?$|^0x[0-9a-f]+$|\d+)/gi,
			sre = /(^[ ]*|[ ]*$)/g,
			dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
			hre = /^0x[0-9a-f]+$/i,
			ore = /^0/,
			i = function(s) { return naturalSort.insensitive && ('' + s).toLowerCase() || '' + s; },
			// convert all to strings strip whitespace
			x = i(a).replace(sre, '') || '',
			y = i(b).replace(sre, '') || '',
			// chunk/tokenize
			xN = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
			yN = y.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
			// numeric, hex or date detection
			xD = parseInt(x.match(hre), 16) || (xN.length !== 1 && x.match(dre) && Date.parse(x)),
			yD = parseInt(y.match(hre), 16) || xD && y.match(dre) && Date.parse(y) || null,
			oFxNcL, oFyNcL;
		// first try and sort Hex codes or Dates
		if (yD) {
			if ( xD < yD ) { return -1; }
			else if ( xD > yD ) { return 1; }
		}
		// natural sorting through split numeric strings and default strings
		for(var cLoc=0, numS=Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
			// find floats not starting with '0', string or 0 if not defined (Clint Priest)
			oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
			oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
			// handle numeric vs string comparison - number < string - (Kyle Adams)
			if (isNaN(oFxNcL) !== isNaN(oFyNcL)) { return (isNaN(oFxNcL)) ? 1 : -1; }
			// rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
			else if (typeof oFxNcL !== typeof oFyNcL) {
				oFxNcL += '';
				oFyNcL += '';
			}
			if (oFxNcL < oFyNcL) { return -1; }
			if (oFxNcL > oFyNcL) { return 1; }
		}
		return 0;
	};


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var util = __webpack_require__(12);
	var ContextMenu = __webpack_require__(10);
	var translate = __webpack_require__(15).translate;

	/**
	 * A factory function to create an AppendNode, which depends on a Node
	 * @param {Node} Node
	 */
	function appendNodeFactory(Node) {
	  /**
	   * @constructor AppendNode
	   * @extends Node
	   * @param {TreeEditor} editor
	   * Create a new AppendNode. This is a special node which is created at the
	   * end of the list with childs for an object or array
	   */
	  function AppendNode (editor) {
	    /** @type {TreeEditor} */
	    this.editor = editor;
	    this.dom = {};
	  }

	  AppendNode.prototype = new Node();

	  /**
	   * Return a table row with an append button.
	   * @return {Element} dom   TR element
	   */
	  AppendNode.prototype.getDom = function () {
	    // TODO: implement a new solution for the append node
	    var dom = this.dom;

	    if (dom.tr) {
	      return dom.tr;
	    }

	    this._updateEditability();

	    // a row for the append button
	    var trAppend = document.createElement('tr');
	    trAppend.className = 'jsoneditor-append';
	    trAppend.node = this;
	    dom.tr = trAppend;

	    // TODO: consistent naming

	    if (this.editor.options.mode === 'tree') {
	      // a cell for the dragarea column
	      dom.tdDrag = document.createElement('td');

	      // create context menu
	      var tdMenu = document.createElement('td');
	      dom.tdMenu = tdMenu;
	      var menu = document.createElement('button');
	      menu.type = 'button';
	      menu.className = 'jsoneditor-button jsoneditor-contextmenu';
	      menu.title = 'Click to open the actions menu (Ctrl+M)';
	      dom.menu = menu;
	      tdMenu.appendChild(dom.menu);
	    }

	    // a cell for the contents (showing text 'empty')
	    var tdAppend = document.createElement('td');
	    var domText = document.createElement('div');
	    domText.innerHTML = '(' + translate('empty') + ')';
	    domText.className = 'jsoneditor-readonly';
	    tdAppend.appendChild(domText);
	    dom.td = tdAppend;
	    dom.text = domText;

	    this.updateDom();

	    return trAppend;
	  };

	  /**
	   * Append node doesn't have a path
	   * @returns {null}
	   */
	  AppendNode.prototype.getPath = function() {
	    return null;
	  };

	  /**
	   * Append node doesn't have an index
	   * @returns {null}
	   */
	  AppendNode.prototype.getIndex = function() {
	    return null;
	  };

	  /**
	   * Update the HTML dom of the Node
	   */
	  AppendNode.prototype.updateDom = function(options) {
	    var dom = this.dom;
	    var tdAppend = dom.td;
	    if (tdAppend) {
	      tdAppend.style.paddingLeft = (this.getLevel() * 24 + 26) + 'px';
	      // TODO: not so nice hard coded offset
	    }

	    var domText = dom.text;
	    if (domText) {
	      domText.innerHTML = '(' + translate('empty') + ' ' + this.parent.type + ')';
	    }

	    // attach or detach the contents of the append node:
	    // hide when the parent has childs, show when the parent has no childs
	    var trAppend = dom.tr;
	    if (!this.isVisible()) {
	      if (dom.tr.firstChild) {
	        if (dom.tdDrag) {
	          trAppend.removeChild(dom.tdDrag);
	        }
	        if (dom.tdMenu) {
	          trAppend.removeChild(dom.tdMenu);
	        }
	        trAppend.removeChild(tdAppend);
	      }
	    }
	    else {
	      if (!dom.tr.firstChild) {
	        if (dom.tdDrag) {
	          trAppend.appendChild(dom.tdDrag);
	        }
	        if (dom.tdMenu) {
	          trAppend.appendChild(dom.tdMenu);
	        }
	        trAppend.appendChild(tdAppend);
	      }
	    }
	  };

	  /**
	   * Check whether the AppendNode is currently visible.
	   * the AppendNode is visible when its parent has no childs (i.e. is empty).
	   * @return {boolean} isVisible
	   */
	  AppendNode.prototype.isVisible = function () {
	    return (this.parent.childs.length == 0);
	  };

	  /**
	   * Show a contextmenu for this node
	   * @param {HTMLElement} anchor   The element to attach the menu to.
	   * @param {function} [onClose]   Callback method called when the context menu
	   *                               is being closed.
	   */
	  AppendNode.prototype.showContextMenu = function (anchor, onClose) {
	    var node = this;
	    var titles = Node.TYPE_TITLES;
	    var appendSubmenu = [
	        {
	            text: translate('auto'),
	            className: 'jsoneditor-type-auto',
	            title: titles.auto,
	            click: function () {
	                node._onAppend('', '', 'auto');
	            }
	        },
	        {
	            text: translate('array'),
	            className: 'jsoneditor-type-array',
	            title: titles.array,
	            click: function () {
	                node._onAppend('', []);
	            }
	        },
	        {
	            text: translate('object'),
	            className: 'jsoneditor-type-object',
	            title: titles.object,
	            click: function () {
	                node._onAppend('', {});
	            }
	        },
	        {
	            text: translate('string'),
	            className: 'jsoneditor-type-string',
	            title: titles.string,
	            click: function () {
	                node._onAppend('', '', 'string');
	            }
	        }
	    ];
	    node.addTemplates(appendSubmenu, true);
	    var items = [
	      // create append button
	      {
	        'text': translate('appendText'),
	        'title': translate('appendTitleAuto'),
	        'submenuTitle': translate('appendSubmenuTitle'),
	        'className': 'jsoneditor-insert',
	        'click': function () {
	          node._onAppend('', '', 'auto');
	        },
	        'submenu': appendSubmenu
	      }
	    ];

	    var menu = new ContextMenu(items, {close: onClose});
	    menu.show(anchor, this.editor.content);
	  };

	  /**
	   * Handle an event. The event is caught centrally by the editor
	   * @param {Event} event
	   */
	  AppendNode.prototype.onEvent = function (event) {
	    var type = event.type;
	    var target = event.target || event.srcElement;
	    var dom = this.dom;

	    // highlight the append nodes parent
	    var menu = dom.menu;
	    if (target == menu) {
	      if (type == 'mouseover') {
	        this.editor.highlighter.highlight(this.parent);
	      }
	      else if (type == 'mouseout') {
	        this.editor.highlighter.unhighlight();
	      }
	    }

	    // context menu events
	    if (type == 'click' && target == dom.menu) {
	      var highlighter = this.editor.highlighter;
	      highlighter.highlight(this.parent);
	      highlighter.lock();
	      util.addClassName(dom.menu, 'jsoneditor-selected');
	      this.showContextMenu(dom.menu, function () {
	        util.removeClassName(dom.menu, 'jsoneditor-selected');
	        highlighter.unlock();
	        highlighter.unhighlight();
	      });
	    }

	    if (type == 'keydown') {
	      this.onKeyDown(event);
	    }
	  };

	  return AppendNode;
	}

	module.exports = appendNodeFactory;


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var translate = __webpack_require__(15).translate;

	/**
	 * A factory function to create an ShowMoreNode, which depends on a Node
	 * @param {function} Node
	 */
	function showMoreNodeFactory(Node) {
	  /**
	   * @constructor ShowMoreNode
	   * @extends Node
	   * @param {TreeEditor} editor
	   * @param {Node} parent
	   * Create a new ShowMoreNode. This is a special node which is created
	   * for arrays or objects having more than 100 items
	   */
	  function ShowMoreNode (editor, parent) {
	    /** @type {TreeEditor} */
	    this.editor = editor;
	    this.parent = parent;
	    this.dom = {};
	  }

	  ShowMoreNode.prototype = new Node();

	  /**
	   * Return a table row with an append button.
	   * @return {Element} dom   TR element
	   */
	  ShowMoreNode.prototype.getDom = function () {
	    if (this.dom.tr) {
	      return this.dom.tr;
	    }

	    this._updateEditability();

	    // display "show more"
	    if (!this.dom.tr) {
	      var me = this;
	      var parent = this.parent;
	      var showMoreButton = document.createElement('a');
	      showMoreButton.appendChild(document.createTextNode(translate('showMore')));
	      showMoreButton.href = '#';
	      showMoreButton.onclick = function (event) {
	        // TODO: use callback instead of accessing a method of the parent
	        parent.visibleChilds = Math.floor(parent.visibleChilds / parent.getMaxVisibleChilds() + 1) *
	            parent.getMaxVisibleChilds();
	        me.updateDom();
	        parent.showChilds();

	        event.preventDefault();
	        return false;
	      };

	      var showAllButton = document.createElement('a');
	      showAllButton.appendChild(document.createTextNode(translate('showAll')));
	      showAllButton.href = '#';
	      showAllButton.onclick = function (event) {
	        // TODO: use callback instead of accessing a method of the parent
	        parent.visibleChilds = Infinity;
	        me.updateDom();
	        parent.showChilds();

	        event.preventDefault();
	        return false;
	      };

	      var moreContents = document.createElement('div');
	      var moreText = document.createTextNode(this._getShowMoreText());
	      moreContents.className = 'jsoneditor-show-more';
	      moreContents.appendChild(moreText);
	      moreContents.appendChild(showMoreButton);
	      moreContents.appendChild(document.createTextNode('. '));
	      moreContents.appendChild(showAllButton);
	      moreContents.appendChild(document.createTextNode('. '));

	      var tdContents = document.createElement('td');
	      tdContents.appendChild(moreContents);

	      var moreTr = document.createElement('tr');
	      if (this.editor.options.mode === 'tree') {
	        moreTr.appendChild(document.createElement('td'));
	        moreTr.appendChild(document.createElement('td'));
	      }
	      moreTr.appendChild(tdContents);
	      moreTr.className = 'jsoneditor-show-more';
	      this.dom.tr = moreTr;
	      this.dom.moreContents = moreContents;
	      this.dom.moreText = moreText;
	    }

	    this.updateDom();

	    return this.dom.tr;
	  };

	  /**
	   * Update the HTML dom of the Node
	   */
	  ShowMoreNode.prototype.updateDom = function(options) {
	    if (this.isVisible()) {
	      // attach to the right child node (the first non-visible child)
	      this.dom.tr.node = this.parent.childs[this.parent.visibleChilds];

	      if (!this.dom.tr.parentNode) {
	        var nextTr = this.parent._getNextTr();
	        if (nextTr) {
	          nextTr.parentNode.insertBefore(this.dom.tr, nextTr);
	        }
	      }

	      // update the counts in the text
	      this.dom.moreText.nodeValue = this._getShowMoreText();

	      // update left margin
	      this.dom.moreContents.style.marginLeft = (this.getLevel() + 1) * 24 + 'px';
	    }
	    else {
	      if (this.dom.tr && this.dom.tr.parentNode) {
	        this.dom.tr.parentNode.removeChild(this.dom.tr);
	      }
	    }
	  };

	  ShowMoreNode.prototype._getShowMoreText = function() {
	    return translate('showMoreStatus', {
	      visibleChilds: this.parent.visibleChilds,
	      totalChilds: this.parent.childs.length
	    }) + ' ';
	  };

	  /**
	   * Check whether the ShowMoreNode is currently visible.
	   * the ShowMoreNode is visible when it's parent has more childs than
	   * the current visibleChilds
	   * @return {boolean} isVisible
	   */
	  ShowMoreNode.prototype.isVisible = function () {
	    return this.parent.expanded && this.parent.childs.length > this.parent.visibleChilds;
	  };

	  /**
	   * Handle an event. The event is caught centrally by the editor
	   * @param {Event} event
	   */
	  ShowMoreNode.prototype.onEvent = function (event) {
	    var type = event.type;
	    if (type === 'keydown') {
	      this.onKeyDown(event);
	    }
	  };

	  return ShowMoreNode;
	}

	module.exports = showMoreNodeFactory;


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var picoModal = __webpack_require__(23);
	var translate = __webpack_require__(15).translate;

	/**
	 * Show advanced sorting modal
	 * @param {Node} node the node to be sorted
	 * @param {HTMLElement} container   The container where to center
	 *                                  the modal and create an overlay
	 */
	function showSortModal (node, container) {
	  var content = '<div class="pico-modal-contents">' +
	      '<div class="pico-modal-header">' + translate('sort') + '</div>' +
	      '<form>' +
	      '<table>' +
	      '<tbody>' +
	      '<tr>' +
	      '  <td>' + translate('sortFieldLabel') + ' </td>' +
	      '  <td class="jsoneditor-modal-input">' +
	      '  <div class="jsoneditor-select-wrapper">' +
	      '    <select id="field" title="' + translate('sortFieldTitle') + '">' +
	      '    </select>' +
	      '  </div>' +
	      '  </td>' +
	      '</tr>' +
	      '<tr>' +
	      '  <td>' + translate('sortDirectionLabel') + ' </td>' +
	      '  <td class="jsoneditor-modal-input">' +
	      '  <div id="direction" class="jsoneditor-button-group">' +
	      '<input type="button" ' +
	      'value="' + translate('sortAscending') + '" ' +
	      'title="'  + translate('sortAscendingTitle') + '" ' +
	      'data-value="asc" ' +
	      'class="jsoneditor-button-first jsoneditor-button-asc"/>' +
	      '<input type="button" ' +
	      'value="' + translate('sortDescending') + '" ' +
	      'title="' + translate('sortDescendingTitle') + '" ' +
	      'data-value="desc" ' +
	      'class="jsoneditor-button-last jsoneditor-button-desc"/>' +
	      '  </div>' +
	      '  </td>' +
	      '</tr>' +
	      '<tr>' +
	      '<td colspan="2" class="jsoneditor-modal-input jsoneditor-modal-actions">' +
	      '  <input type="submit" id="ok" value="' + translate('ok') + '" />' +
	      '</td>' +
	      '</tr>' +
	      '</tbody>' +
	      '</table>' +
	      '</form>' +
	      '</div>';

	  picoModal({
	    parent: container,
	    content: content,
	    overlayClass: 'jsoneditor-modal-overlay',
	    modalClass: 'jsoneditor-modal jsoneditor-modal-sort'
	  })
	      .afterCreate(function (modal) {
	        var form = modal.modalElem().querySelector('form');
	        var ok = modal.modalElem().querySelector('#ok');
	        var field = modal.modalElem().querySelector('#field');
	        var direction = modal.modalElem().querySelector('#direction');

	        var paths = node.type === 'array'
	            ? node.getChildPaths()
	            : ['.'];

	        paths.forEach(function (path) {
	          var option = document.createElement('option');
	          option.text = path;
	          option.value = path;
	          field.appendChild(option);
	        });

	        function setDirection(value) {
	          direction.value = value;
	          direction.className = 'jsoneditor-button-group jsoneditor-button-group-value-' + direction.value;
	        }

	        field.value = node.sortedBy ? node.sortedBy.path : paths[0];
	        setDirection(node.sortedBy ? node.sortedBy.direction : 'asc');

	        direction.onclick = function (event) {
	          setDirection(event.target.getAttribute('data-value'));
	        };

	        ok.onclick = function (event) {
	          event.preventDefault();
	          event.stopPropagation();

	          modal.close();

	          var path = field.value;
	          var pathArray = (path === '.') ? [] : path.split('.').slice(1);

	          node.sortedBy = {
	            path: path,
	            direction: direction.value
	          };

	          node.sort(pathArray, direction.value)
	        };

	        if (form) { // form is not available when JSONEditor is created inside a form
	          form.onsubmit = ok.onclick;
	        }
	      })
	      .afterClose(function (modal) {
	        modal.destroy();
	      })
	      .show();
	}

	module.exports = showSortModal;


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */

	(function (root, factory) {
	    "use strict";

	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    }
	    else if (typeof module === 'object' && module.exports) {
	        module.exports = factory();
	    }
	    else {
	        root.picoModal = factory();
	    }
	}(this, function () {

	    /**
	     * A self-contained modal library
	     */
	    "use strict";

	    /** Returns whether a value is a dom node */
	    function isNode(value) {
	        if ( typeof Node === "object" ) {
	            return value instanceof Node;
	        }
	        else {
	            return value && typeof value === "object" && typeof value.nodeType === "number";
	        }
	    }

	    /** Returns whether a value is a string */
	    function isString(value) {
	        return typeof value === "string";
	    }

	    /**
	     * Generates observable objects that can be watched and triggered
	     */
	    function observable() {
	        var callbacks = [];
	        return {
	            watch: callbacks.push.bind(callbacks),
	            trigger: function(context, detail) {

	                var unprevented = true;
	                var event = {
	                    detail: detail,
	                    preventDefault: function preventDefault () {
	                        unprevented = false;
	                    }
	                };

	                for (var i = 0; i < callbacks.length; i++) {
	                    callbacks[i](context, event);
	                }

	                return unprevented;
	            }
	        };
	    }


	    /** Whether an element is hidden */
	    function isHidden ( elem ) {
	        // @see http://stackoverflow.com/questions/19669786
	        return window.getComputedStyle(elem).display === 'none';
	    }


	    /**
	     * A small interface for creating and managing a dom element
	     */
	    function Elem( elem ) {
	        this.elem = elem;
	    }

	    /** Creates a new div */
	    Elem.make = function ( parent, tag ) {
	        if ( typeof parent === "string" ) {
	            parent = document.querySelector(parent);
	        }
	        var elem = document.createElement(tag || 'div');
	        (parent || document.body).appendChild(elem);
	        return new Elem(elem);
	    };

	    Elem.prototype = {

	        /** Creates a child of this node */
	        child: function (tag) {
	            return Elem.make(this.elem, tag);
	        },

	        /** Applies a set of styles to an element */
	        stylize: function(styles) {
	            styles = styles || {};

	            if ( typeof styles.opacity !== "undefined" ) {
	                styles.filter = "alpha(opacity=" + (styles.opacity * 100) + ")";
	            }

	            for (var prop in styles) {
	                if (styles.hasOwnProperty(prop)) {
	                    this.elem.style[prop] = styles[prop];
	                }
	            }

	            return this;
	        },

	        /** Adds a class name */
	        clazz: function (clazz) {
	            this.elem.className += " " + clazz;
	            return this;
	        },

	        /** Sets the HTML */
	        html: function (content) {
	            if ( isNode(content) ) {
	                this.elem.appendChild( content );
	            }
	            else {
	                this.elem.innerHTML = content;
	            }
	            return this;
	        },

	        /** Adds a click handler to this element */
	        onClick: function(callback) {
	            this.elem.addEventListener('click', callback);
	            return this;
	        },

	        /** Removes this element from the DOM */
	        destroy: function() {
	            this.elem.parentNode.removeChild(this.elem);
	        },

	        /** Hides this element */
	        hide: function() {
	            this.elem.style.display = "none";
	        },

	        /** Shows this element */
	        show: function() {
	            this.elem.style.display = "block";
	        },

	        /** Sets an attribute on this element */
	        attr: function ( name, value ) {
	            if (value !== undefined) {
	                this.elem.setAttribute(name, value);
	            }
	            return this;
	        },

	        /** Executes a callback on all the ancestors of an element */
	        anyAncestor: function ( predicate ) {
	            var elem = this.elem;
	            while ( elem ) {
	                if ( predicate( new Elem(elem) ) ) {
	                    return true;
	                }
	                else {
	                    elem = elem.parentNode;
	                }
	            }
	            return false;
	        },

	        /** Whether this element is visible */
	        isVisible: function () {
	            return !isHidden(this.elem);
	        }
	    };


	    /** Generates the grey-out effect */
	    function buildOverlay( getOption, close ) {
	        return Elem.make( getOption("parent") )
	            .clazz("pico-overlay")
	            .clazz( getOption("overlayClass", "") )
	            .stylize({
	                display: "none",
	                position: "fixed",
	                top: "0px",
	                left: "0px",
	                height: "100%",
	                width: "100%",
	                zIndex: 10000
	            })
	            .stylize(getOption('overlayStyles', {
	                opacity: 0.5,
	                background: "#000"
	            }))
	            .onClick(function () {
	                if ( getOption('overlayClose', true) ) {
	                    close();
	                }
	            });
	    }

	    // An auto incrementing ID assigned to each modal
	    var autoinc = 1;

	    /** Builds the content of a modal */
	    function buildModal( getOption, close ) {
	        var width = getOption('width', 'auto');
	        if ( typeof width === "number" ) {
	            width = "" + width + "px";
	        }

	        var id = getOption("modalId", "pico-" + autoinc++);

	        var elem = Elem.make( getOption("parent") )
	            .clazz("pico-content")
	            .clazz( getOption("modalClass", "") )
	            .stylize({
	                display: 'none',
	                position: 'fixed',
	                zIndex: 10001,
	                left: "50%",
	                top: "38.1966%",
	                maxHeight: '90%',
	                boxSizing: 'border-box',
	                width: width,
	                '-ms-transform': 'translate(-50%,-38.1966%)',
	                '-moz-transform': 'translate(-50%,-38.1966%)',
	                '-webkit-transform': 'translate(-50%,-38.1966%)',
	                '-o-transform': 'translate(-50%,-38.1966%)',
	                transform: 'translate(-50%,-38.1966%)'
	            })
	            .stylize(getOption('modalStyles', {
	                overflow: 'auto',
	                backgroundColor: "white",
	                padding: "20px",
	                borderRadius: "5px"
	            }))
	            .html( getOption('content') )
	            .attr("id", id)
	            .attr("role", "dialog")
	            .attr("aria-labelledby", getOption("ariaLabelledBy"))
	            .attr("aria-describedby", getOption("ariaDescribedBy", id))
	            .onClick(function (event) {
	                var isCloseClick = new Elem(event.target).anyAncestor(function (elem) {
	                    return /\bpico-close\b/.test(elem.elem.className);
	                });
	                if ( isCloseClick ) {
	                    close();
	                }
	            });

	        return elem;
	    }

	    /** Builds the close button */
	    function buildClose ( elem, getOption ) {
	        if ( getOption('closeButton', true) ) {
	            return elem.child('button')
	                .html( getOption('closeHtml', "&#xD7;") )
	                .clazz("pico-close")
	                .clazz( getOption("closeClass", "") )
	                .stylize( getOption('closeStyles', {
	                    borderRadius: "2px",
	                    border: 0,
	                    padding: 0,
	                    cursor: "pointer",
	                    height: "15px",
	                    width: "15px",
	                    position: "absolute",
	                    top: "5px",
	                    right: "5px",
	                    fontSize: "16px",
	                    textAlign: "center",
	                    lineHeight: "15px",
	                    background: "#CCC"
	                }) )
	                .attr("aria-label", getOption("close-label", "Close"));
	        }
	    }

	    /** Builds a method that calls a method and returns an element */
	    function buildElemAccessor( builder ) {
	        return function () {
	            return builder().elem;
	        };
	    }


	    // An observable that is triggered whenever the escape key is pressed
	    var escapeKey = observable();

	    // An observable that is triggered when the user hits the tab key
	    var tabKey = observable();

	    /** A global event handler to detect the escape key being pressed */
	    document.documentElement.addEventListener('keydown', function onKeyPress (event) {
	        var keycode = event.which || event.keyCode;

	        // If this is the escape key
	        if ( keycode === 27 ) {
	            escapeKey.trigger();
	        }

	        // If this is the tab key
	        else if ( keycode === 9 ) {
	            tabKey.trigger(event);
	        }
	    });


	    /** Attaches focus management events */
	    function manageFocus ( iface, isEnabled ) {

	        /** Whether an element matches a selector */
	        function matches ( elem, selector ) {
	            var fn = elem.msMatchesSelector || elem.webkitMatchesSelector || elem.matches;
	            return fn.call(elem, selector);
	        }

	        /**
	         * Returns whether an element is focusable
	         * @see http://stackoverflow.com/questions/18261595
	         */
	        function canFocus( elem ) {
	            if (
	                isHidden(elem) ||
	                matches(elem, ":disabled") ||
	                elem.hasAttribute("contenteditable")
	            ) {
	                return false;
	            }
	            else {
	                return elem.hasAttribute("tabindex") ||
	                    matches(elem, "input,select,textarea,button,a[href],area[href],iframe");
	            }
	        }

	        /** Returns the first descendant that can be focused */
	        function firstFocusable ( elem ) {
	            var items = elem.getElementsByTagName("*");
	            for (var i = 0; i < items.length; i++) {
	                if ( canFocus(items[i]) ) {
	                    return items[i];
	                }
	            }
	        }

	        /** Returns the last descendant that can be focused */
	        function lastFocusable ( elem ) {
	            var items = elem.getElementsByTagName("*");
	            for (var i = items.length; i--;) {
	                if ( canFocus(items[i]) ) {
	                    return items[i];
	                }
	            }
	        }

	        // The element focused before the modal opens
	        var focused;

	        // Records the currently focused element so state can be returned
	        // after the modal closes
	        iface.beforeShow(function getActiveFocus() {
	            focused = document.activeElement;
	        });

	        // Shift focus into the modal
	        iface.afterShow(function focusModal() {
	            if ( isEnabled() ) {
	                var focusable = firstFocusable(iface.modalElem());
	                if ( focusable ) {
	                    focusable.focus();
	                }
	            }
	        });

	        // Restore the previously focused element when the modal closes
	        iface.afterClose(function returnFocus() {
	            if ( isEnabled() && focused ) {
	                focused.focus();
	            }
	            focused = null;
	        });

	        // Capture tab key presses and loop them within the modal
	        tabKey.watch(function tabKeyPress (event) {
	            if ( isEnabled() && iface.isVisible() ) {
	                var first = firstFocusable(iface.modalElem());
	                var last = lastFocusable(iface.modalElem());

	                var from = event.shiftKey ? first : last;
	                if ( from === document.activeElement ) {
	                    (event.shiftKey ? last : first).focus();
	                    event.preventDefault();
	                }
	            }
	        });
	    }

	    /** Manages setting the 'overflow: hidden' on the body tag */
	    function manageBodyOverflow(iface, isEnabled) {
	        var origOverflow;
	        var body = new Elem(document.body);

	        iface.beforeShow(function () {
	            // Capture the current values so they can be restored
	            origOverflow = body.elem.style.overflow;

	            if (isEnabled()) {
	                body.stylize({ overflow: "hidden" });
	            }
	        });

	        iface.afterClose(function () {
	            body.stylize({ overflow: origOverflow });
	        });
	    }

	    /**
	     * Displays a modal
	     */
	    return function picoModal(options) {

	        if ( isString(options) || isNode(options) ) {
	            options = { content: options };
	        }

	        var afterCreateEvent = observable();
	        var beforeShowEvent = observable();
	        var afterShowEvent = observable();
	        var beforeCloseEvent = observable();
	        var afterCloseEvent = observable();

	        /**
	         * Returns a named option if it has been explicitly defined. Otherwise,
	         * it returns the given default value
	         */
	        function getOption ( opt, defaultValue ) {
	            var value = options[opt];
	            if ( typeof value === "function" ) {
	                value = value( defaultValue );
	            }
	            return value === undefined ? defaultValue : value;
	        }


	        // The various DOM elements that constitute the modal
	        var modalElem = build.bind(window, 'modal');
	        var shadowElem = build.bind(window, 'overlay');
	        var closeElem = build.bind(window, 'close');

	        // This will eventually contain the modal API returned to the user
	        var iface;


	        /** Hides this modal */
	        function forceClose (detail) {
	            shadowElem().hide();
	            modalElem().hide();
	            afterCloseEvent.trigger(iface, detail);
	        }

	        /** Gracefully hides this modal */
	        function close (detail) {
	            if ( beforeCloseEvent.trigger(iface, detail) ) {
	                forceClose(detail);
	            }
	        }

	        /** Wraps a method so it returns the modal interface */
	        function returnIface ( callback ) {
	            return function () {
	                callback.apply(this, arguments);
	                return iface;
	            };
	        }


	        // The constructed dom nodes
	        var built;

	        /** Builds a method that calls a method and returns an element */
	        function build (name, detail) {
	            if ( !built ) {
	                var modal = buildModal(getOption, close);
	                built = {
	                    modal: modal,
	                    overlay: buildOverlay(getOption, close),
	                    close: buildClose(modal, getOption)
	                };
	                afterCreateEvent.trigger(iface, detail);
	            }
	            return built[name];
	        }

	        iface = {

	            /** Returns the wrapping modal element */
	            modalElem: buildElemAccessor(modalElem),

	            /** Returns the close button element */
	            closeElem: buildElemAccessor(closeElem),

	            /** Returns the overlay element */
	            overlayElem: buildElemAccessor(shadowElem),

	            /** Builds the dom without showing the modal */
	            buildDom: returnIface(build.bind(null, null)),

	            /** Returns whether this modal is currently being shown */
	            isVisible: function () {
	                return !!(built && modalElem && modalElem().isVisible());
	            },

	            /** Shows this modal */
	            show: function (detail) {
	                if ( beforeShowEvent.trigger(iface, detail) ) {
	                    shadowElem().show();
	                    closeElem();
	                    modalElem().show();
	                    afterShowEvent.trigger(iface, detail);
	                }
	                return this;
	            },

	            /** Hides this modal */
	            close: returnIface(close),

	            /**
	             * Force closes this modal. This will not call beforeClose
	             * events and will just immediately hide the modal
	             */
	            forceClose: returnIface(forceClose),

	            /** Destroys this modal */
	            destroy: function () {
	                modalElem().destroy();
	                shadowElem().destroy();
	                shadowElem = modalElem = closeElem = undefined;
	            },

	            /**
	             * Updates the options for this modal. This will only let you
	             * change options that are re-evaluted regularly, such as
	             * `overlayClose`.
	             */
	            options: function ( opts ) {
	                Object.keys(opts).map(function (key) {
	                    options[key] = opts[key];
	                });
	            },

	            /** Executes after the DOM nodes are created */
	            afterCreate: returnIface(afterCreateEvent.watch),

	            /** Executes a callback before this modal is closed */
	            beforeShow: returnIface(beforeShowEvent.watch),

	            /** Executes a callback after this modal is shown */
	            afterShow: returnIface(afterShowEvent.watch),

	            /** Executes a callback before this modal is closed */
	            beforeClose: returnIface(beforeCloseEvent.watch),

	            /** Executes a callback after this modal is closed */
	            afterClose: returnIface(afterCloseEvent.watch)
	        };

	        manageFocus(iface, getOption.bind(null, "focus", true));

	        manageBodyOverflow(iface, getOption.bind(null, "bodyOverflow", true));

	        // If a user presses the 'escape' key, close the modal.
	        escapeKey.watch(function escapeKeyPress () {
	            if ( getOption("escCloses", true) && iface.isVisible() ) {
	                iface.close();
	            }
	        });

	        return iface;
	    };

	}));


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var jmespath = __webpack_require__(18);
	var picoModal = __webpack_require__(23);
	var Selectr = __webpack_require__(25);
	var translate = __webpack_require__(15).translate;
	var debounce = __webpack_require__(12).debounce;

	var MAX_PREVIEW_LINES = 100;

	/**
	 * Show advanced filter and transform modal using JMESPath
	 * @param {Node} node the node to be transformed
	 * @param {HTMLElement} container   The container where to center
	 *                                  the modal and create an overlay
	 */
	function showTransformModal (node, container) {
	  var value = node.getValue();

	  var content = '<label class="pico-modal-contents">' +
	      '<div class="pico-modal-header">' + translate('transform') + '</div>' +
	      '<p>' +
	      'Enter a <a href="http://jmespath.org" target="_blank">JMESPath</a> query to filter, sort, or transform the JSON data.<br/>' +
	      'To learn JMESPath, go to <a href="http://jmespath.org/tutorial.html" target="_blank">the interactive tutorial</a>.' +
	      '</p>' +
	      '<table>' +
	      '<tbody>' +
	      '<tr>' +
	      '  <th>' + translate('transformWizardLabel') + ' </th>' +
	      '  <td>' +
	      '  <div id="wizard" class="jsoneditor-jmespath-wizard">' +
	      '  <div>' +
	      '    <div class="jsoneditor-jmespath-wizard-label">' + translate('transformWizardFilter') + '</div>' +
	      '    <div class="jsoneditor-jmespath-filter">' +
	      '      <div class="jsoneditor-inline jsoneditor-jmespath-filter-field" >' +
	      '        <select id="filterField">' +
	      '        </select>' +
	      '      </div>' +
	      '      <div class="jsoneditor-inline jsoneditor-jmespath-filter-relation" >' +
	      '        <select id="filterRelation">' +
	      '          <option value="==">==</option>' +
	      '          <option value="!=">!=</option>' +
	      '          <option value="<">&lt;</option>' +
	      '          <option value="<=">&lt;=</option>' +
	      '          <option value=">">&gt;</option>' +
	      '          <option value=">=">&gt;=</option>' +
	      '        </select>' +
	      '      </div>' +
	      '      <div class="jsoneditor-inline jsoneditor-jmespath-filter-value" >' +
	      '        <input placeholder="value..." id="filterValue" />' +
	      '      </div>' +
	      '    </div>' +
	      '  </div>' +
	      '  <div>' +
	      '    <div class="jsoneditor-jmespath-wizard-label">' + translate('transformWizardSortBy') + '</div>' +
	      '    <div class="jsoneditor-jmespath-filter">' +
	      '      <div class="jsoneditor-inline jsoneditor-jmespath-sort-field">' +
	      '        <select id="sortField">' +
	      '        </select>' +
	      '      </div>' +
	      '      <div class="jsoneditor-inline jsoneditor-jmespath-sort-order" >' +
	      '        <select id="sortOrder">' +
	      '          <option value="asc">Ascending</option>' +
	      '          <option value="desc">Descending</option>' +
	      '        </select>' +
	      '      </div>' +
	      '    </div>' +
	      '  </div>' +
	      '  <div id="selectFieldsPart">' +
	      '    <div class="jsoneditor-jmespath-wizard-label">' + translate('transformWizardSelectFields') + '</div>' +
	      '    <select class="jsoneditor-jmespath-select-fields" id="selectFields" multiple>' +
	      '    </select>' +
	      '  </div>' +
	      '  </div>' +
	      '  </td>' +
	      '</tr>' +
	      '<tr>' +
	      '  <th>' + translate('transformQueryLabel') + ' </th>' +
	      '  <td class="jsoneditor-modal-input">' +
	      '    <textarea id="query" ' +
	      '              rows="4" ' +
	      '              autocomplete="off" ' +
	      '              autocorrect="off" ' +
	      '              autocapitalize="off" ' +
	      '              spellcheck="false"' +
	      '              title="' + translate('transformQueryTitle') + '">[*]</textarea>' +
	      '  </td>' +
	      '</tr>' +
	      '<tr>' +
	      '  <th>' + translate('transformPreviewLabel') + ' </th>' +
	      '  <td class="jsoneditor-modal-input">' +
	      '    <textarea id="preview" ' +
	      '        class="jsoneditor-transform-preview"' +
	      '        readonly> </textarea>' +
	      '  </td>' +
	      '</tr>' +
	      '<tr>' +
	      '<td colspan="2" class="jsoneditor-modal-input jsoneditor-modal-actions">' +
	      '  <input type="submit" id="ok" value="' + translate('ok') + '" autofocus />' +
	      '</td>' +
	      '</tr>' +
	      '</tbody>' +
	      '</table>' +
	      '</div>';

	  picoModal({
	    parent: container,
	    content: content,
	    overlayClass: 'jsoneditor-modal-overlay',
	    modalClass: 'jsoneditor-modal jsoneditor-modal-transform',
	    focus: false
	  })
	      .afterCreate(function (modal) {
	        var elem = modal.modalElem();

	        var wizard = elem.querySelector('#wizard');
	        var ok = elem.querySelector('#ok');
	        var filterField = elem.querySelector('#filterField');
	        var filterRelation = elem.querySelector('#filterRelation');
	        var filterValue = elem.querySelector('#filterValue');
	        var sortField = elem.querySelector('#sortField');
	        var sortOrder = elem.querySelector('#sortOrder');
	        var selectFields = elem.querySelector('#selectFields');
	        var query = elem.querySelector('#query');
	        var preview = elem.querySelector('#preview');

	        if (!Array.isArray(value)) {
	          wizard.style.display = 'none';
	          wizard.parentNode.style.fontStyle = 'italic';
	          wizard.parentNode.appendChild(
	              document.createTextNode('(wizard not available for objects, only for arrays)')
	          );
	        }

	        var paths = node.getChildPaths();
	        paths.forEach(function (path) {
	          var formattedPath = preprocessPath(path);
	          var filterOption = document.createElement('option');
	          filterOption.text = formattedPath;
	          filterOption.value = formattedPath;
	          filterField.appendChild(filterOption);

	          var sortOption = document.createElement('option');
	          sortOption.text = formattedPath;
	          sortOption.value = formattedPath;
	          sortField.appendChild(sortOption);
	        });

	        var allPaths = node.getChildPaths(true).filter(function(path) {
	          return path !== '.';
	        });

	        if (allPaths.length > 0) {
	          allPaths.forEach(function (path) {
	            var formattedPath = preprocessPath(path);
	            var option = document.createElement('option');
	            option.text = formattedPath;
	            option.value = formattedPath;
	            selectFields.appendChild(option);
	          });
	        }
	        else {
	          elem.querySelector('#selectFieldsPart').style.display = 'none';
	        }

	        var selectrFilterField = new Selectr(filterField, { defaultSelected: false, clearable: true, allowDeselect: true, placeholder: 'field...' });
	        var selectrFilterRelation = new Selectr(filterRelation, { defaultSelected: false, clearable: true, allowDeselect: true, placeholder: 'compare...' });
	        var selectrSortField = new Selectr(sortField, { defaultSelected: false, clearable: true, allowDeselect: true, placeholder: 'field...' });
	        var selectrSortOrder = new Selectr(sortOrder, { defaultSelected: false, clearable: true, allowDeselect: true, placeholder: 'order...' });
	        var selectrSelectFields = new Selectr(selectFields, {multiple: true, clearable: true, defaultSelected: false});

	        selectrFilterField.on('selectr.change', generateQueryFromWizard);
	        selectrFilterRelation.on('selectr.change', generateQueryFromWizard);
	        filterValue.oninput = generateQueryFromWizard;
	        selectrSortField.on('selectr.change', generateQueryFromWizard);
	        selectrSortOrder.on('selectr.change', generateQueryFromWizard);
	        selectrSelectFields.on('selectr.change', generateQueryFromWizard);

	        elem.querySelector('.pico-modal-contents').onclick = function (event) {
	          // prevent the first clear button from getting focus when clicking anywhere in the modal
	          event.preventDefault();
	        };

	        query.value = Array.isArray(value) ? '[*]' : '@';

	        function preprocessPath(path) {
	          if (path[0] === '.') {
	            return (path === '.')
	                ? '@'
	                : path.slice(1);
	          }
	          else {
	            return path;
	          }
	        }

	        function generateQueryFromWizard () {
	          if (filterField.value && filterRelation.value && filterValue.value) {
	            var field1 = filterField.value;
	            // TODO: move _stringCast into a static util function
	            var value1 = JSON.stringify(node._stringCast(filterValue.value));
	            query.value = '[? ' +
	                field1 + ' ' +
	                filterRelation.value + ' ' +
	                '`' + value1 + '`' +
	                ']';
	          }
	          else {
	            query.value = '[*]';
	          }

	          if (sortField.value && sortOrder.value) {
	            var field2 = sortField.value;
	            if (sortOrder.value === 'desc') {
	              query.value += ' | reverse(sort_by(@, &' + field2 + '))';
	            }
	            else {
	              query.value += ' | sort_by(@, &' + field2 + ')';
	            }
	          }

	          if (selectFields.value) {
	            var values = [];
	            for (var i=0; i < selectFields.options.length; i++) {
	              if (selectFields.options[i].selected) {
	                var value = selectFields.options[i].value;
	                values.push(value);
	              }
	            }

	            if (query.value[query.value.length - 1] !== ']') {
	              query.value += ' | [*]';
	            }

	            if (values.length === 1) {
	              query.value += '.' + value;
	            }
	            else if (values.length > 1) {
	              query.value += '.{' +
	                  values.map(function (value) {
	                    var parts = value.split('.');
	                    var last = parts[parts.length - 1];
	                    return last + ': ' + value;
	                  }).join(', ') +
	                  '}';
	            }
	            else { // values.length === 0
	              // ignore
	            }
	          }

	          debouncedUpdatePreview();
	        }

	        function updatePreview() {
	          try {
	            var transformed = jmespath.search(value, query.value);
	            var lines =  JSON.stringify(transformed, null, 2).split('\n');

	            if (lines.length > MAX_PREVIEW_LINES) {
	              lines = lines.slice(0, MAX_PREVIEW_LINES).concat(['...'])
	            }


	            preview.className = 'jsoneditor-transform-preview';
	            preview.value = lines.join('\n');
	            ok.disabled = false;
	          }
	          catch (err) {
	            preview.className = 'jsoneditor-transform-preview jsoneditor-error';
	            preview.value = err.toString();
	            ok.disabled = true;
	          }
	        }

	        var debouncedUpdatePreview = debounce(updatePreview, 300);

	        query.oninput = debouncedUpdatePreview;
	        debouncedUpdatePreview();

	        ok.onclick = function (event) {
	          event.preventDefault();
	          event.stopPropagation();

	          modal.close();

	          node.transform(query.value)
	        };

	        setTimeout(function () {
	          query.select();
	          query.focus();
	          query.selectionStart = 3;
	          query.selectionEnd = 3;
	        });
	      })
	      .afterClose(function (modal) {
	        modal.destroy();
	      })
	      .show();
	}

	module.exports = showTransformModal;


/***/ },
/* 25 */
/***/ function(module, exports) {

	/*!
	 * Selectr 2.4.0
	 * https://github.com/Mobius1/Selectr
	 *
	 * Released under the MIT license
	 */

	'use strict';

	/**
	 * Default configuration options
	 * @type {Object}
	 */
	var defaultConfig = {
	  /**
	   * Emulates browser behaviour by selecting the first option by default
	   * @type {Boolean}
	   */
	  defaultSelected: true,

	  /**
	   * Sets the width of the container
	   * @type {String}
	   */
	  width: "auto",

	  /**
	   * Enables/ disables the container
	   * @type {Boolean}
	   */
	  disabled: false,

	  /**
	   * Enables / disables the search function
	   * @type {Boolean}
	   */
	  searchable: true,

	  /**
	   * Enable disable the clear button
	   * @type {Boolean}
	   */
	  clearable: false,

	  /**
	   * Sort the tags / multiselect options
	   * @type {Boolean}
	   */
	  sortSelected: false,

	  /**
	   * Allow deselecting of select-one options
	   * @type {Boolean}
	   */
	  allowDeselect: false,

	  /**
	   * Close the dropdown when scrolling (@AlexanderReiswich, #11)
	   * @type {Boolean}
	   */
	  closeOnScroll: false,

	  /**
	   * Allow the use of the native dropdown (@jonnyscholes, #14)
	   * @type {Boolean}
	   */
	  nativeDropdown: false,

	  /**
	   * Set the main placeholder
	   * @type {String}
	   */
	  placeholder: "Select an option...",

	  /**
	   * Allow the tagging feature
	   * @type {Boolean}
	   */
	  taggable: false,

	  /**
	   * Set the tag input placeholder (@labikmartin, #21, #22)
	   * @type {String}
	   */
	  tagPlaceholder: "Enter a tag..."
	};

	/**
	 * Event Emitter
	 */
	var Events = function() {};

	/**
	 * Event Prototype
	 * @type {Object}
	 */
	Events.prototype = {
	  /**
	   * Add custom event listener
	   * @param  {String} event Event type
	   * @param  {Function} func   Callback
	   * @return {Void}
	   */
	  on: function(event, func) {
	    this._events = this._events || {};
	    this._events[event] = this._events[event] || [];
	    this._events[event].push(func);
	  },

	  /**
	   * Remove custom event listener
	   * @param  {String} event Event type
	   * @param  {Function} func   Callback
	   * @return {Void}
	   */
	  off: function(event, func) {
	    this._events = this._events || {};
	    if (event in this._events === false) return;
	    this._events[event].splice(this._events[event].indexOf(func), 1);
	  },

	  /**
	   * Fire a custom event
	   * @param  {String} event Event type
	   * @return {Void}
	   */
	  emit: function(event /* , args... */ ) {
	    this._events = this._events || {};
	    if (event in this._events === false) return;
	    for (var i = 0; i < this._events[event].length; i++) {
	      this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
	    }
	  }
	};

	/**
	 * Event mixin
	 * @param  {Object} obj
	 * @return {Object}
	 */
	Events.mixin = function(obj) {
	  var props = ['on', 'off', 'emit'];
	  for (var i = 0; i < props.length; i++) {
	    if (typeof obj === 'function') {
	      obj.prototype[props[i]] = Events.prototype[props[i]];
	    } else {
	      obj[props[i]] = Events.prototype[props[i]];
	    }
	  }
	  return obj;
	};

	/**
	 * Helpers
	 * @type {Object}
	 */
	var util = {
	  extend: function(src, props) {
	    props = props || {};
	    var p;
	    for (p in src) {
	      if (src.hasOwnProperty(p)) {
	        if (!props.hasOwnProperty(p)) {
	          props[p] = src[p];
	        }
	      }
	    }
	    return props;
	  },
	  each: function(a, b, c) {
	    if ("[object Object]" === Object.prototype.toString.call(a)) {
	      for (var d in a) {
	        if (Object.prototype.hasOwnProperty.call(a, d)) {
	          b.call(c, d, a[d], a);
	        }
	      }
	    } else {
	      for (var e = 0, f = a.length; e < f; e++) {
	        b.call(c, e, a[e], a);
	      }
	    }
	  },
	  createElement: function(e, a) {
	    var d = document,
	        el = d.createElement(e);
	    if (a && "[object Object]" === Object.prototype.toString.call(a)) {
	      var i;
	      for (i in a)
	        if (i in el) el[i] = a[i];
	        else if ("html" === i) el.innerHTML = a[i];
	        else if ("text" === i) {
	          var t = d.createTextNode(a[i]);
	          el.appendChild(t);
	        } else el.setAttribute(i, a[i]);
	    }
	    return el;
	  },
	  hasClass: function(a, b) {
	    if (a)
	      return a.classList ? a.classList.contains(b) : !!a.className && !!a.className.match(new RegExp("(\\s|^)" + b + "(\\s|$)"));
	  },
	  addClass: function(a, b) {
	    if (!util.hasClass(a, b)) {
	      if (a.classList) {
	        a.classList.add(b);
	      } else {
	        a.className = a.className.trim() + " " + b;
	      }
	    }
	  },
	  removeClass: function(a, b) {
	    if (util.hasClass(a, b)) {
	      if (a.classList) {
	        a.classList.remove(b);
	      } else {
	        a.className = a.className.replace(new RegExp("(^|\\s)" + b.split(" ").join("|") + "(\\s|$)", "gi"), " ");
	      }
	    }
	  },
	  closest: function(el, fn) {
	    return el && el !== document.body && (fn(el) ? el : util.closest(el.parentNode, fn));
	  },
	  isInt: function(val) {
	    return typeof val === 'number' && isFinite(val) && Math.floor(val) === val;
	  },
	  debounce: function(a, b, c) {
	    var d;
	    return function() {
	      var e = this,
	          f = arguments,
	          g = function() {
	            d = null;
	            if (!c) a.apply(e, f);
	          },
	          h = c && !d;
	      clearTimeout(d);
	      d = setTimeout(g, b);
	      if (h) {
	        a.apply(e, f);
	      }
	    };
	  },
	  rect: function(el, abs) {
	    var w = window;
	    var r = el.getBoundingClientRect();
	    var x = abs ? w.pageXOffset : 0;
	    var y = abs ? w.pageYOffset : 0;

	    return {
	      bottom: r.bottom + y,
	      height: r.height,
	      left: r.left + x,
	      right: r.right + x,
	      top: r.top + y,
	      width: r.width
	    };
	  },
	  includes: function(a, b) {
	    return a.indexOf(b) > -1;
	  },
	  truncate: function(el) {
	    while (el.firstChild) {
	      el.removeChild(el.firstChild);
	    }
	  }
	};


	function isset(obj, prop) {
	  return obj.hasOwnProperty(prop) && (obj[prop] === true || obj[prop].length);
	}

	/**
	 * Append an item to the list
	 * @param  {Object} item
	 * @param  {Object} custom
	 * @return {Void}
	 */
	function appendItem(item, parent, custom) {
	  if (item.parentNode) {
	    if (!item.parentNode.parentNode) {
	      parent.appendChild(item.parentNode);
	    }
	  } else {
	    parent.appendChild(item);
	  }

	  util.removeClass(item, "excluded");
	  if (!custom) {
	    item.innerHTML = item.textContent;
	  }
	}

	/**
	 * Render the item list
	 * @return {Void}
	 */
	var render = function() {
	  if (this.items.length) {
	    var f = document.createDocumentFragment();

	    if (this.config.pagination) {
	      var pages = this.pages.slice(0, this.pageIndex);

	      util.each(pages, function(i, items) {
	        util.each(items, function(j, item) {
	          appendItem(item, f, this.customOption);
	        }, this);
	      }, this);
	    } else {
	      util.each(this.items, function(i, item) {
	        appendItem(item, f, this.customOption);
	      }, this);
	    }

	    if (f.childElementCount) {
	      util.removeClass(this.items[this.navIndex], "active");
	      this.navIndex = f.querySelector(".selectr-option").idx;
	      util.addClass(this.items[this.navIndex], "active");
	    }

	    this.tree.appendChild(f);
	  }
	};

	/**
	 * Dismiss / close the dropdown
	 * @param  {obj} e
	 * @return {void}
	 */
	var dismiss = function(e) {
	  var target = e.target;
	  if (!this.container.contains(target) && (this.opened || util.hasClass(this.container, "notice"))) {
	    this.close();
	  }
	};

	/**
	 * Build a list item from the HTMLOptionElement
	 * @param  {int} i      HTMLOptionElement index
	 * @param  {HTMLOptionElement} option
	 * @param  {bool} group  Has parent optgroup
	 * @return {void}
	 */
	var createItem = function(option, data) {
	  data = data || option;
	  var content = this.customOption ? this.config.renderOption(data) : option.textContent;
	  var opt = util.createElement("li", {
	    class: "selectr-option",
	    html: content,
	    role: "treeitem",
	    "aria-selected": false
	  });

	  opt.idx = option.idx;

	  this.items.push(opt);

	  if (option.defaultSelected) {
	    this.defaultSelected.push(option.idx);
	  }

	  if (option.disabled) {
	    opt.disabled = true;
	    util.addClass(opt, "disabled");
	  }

	  return opt;
	};

	/**
	 * Build the container
	 * @return {Void}
	 */
	var build = function() {

	  this.requiresPagination = this.config.pagination && this.config.pagination > 0;

	  // Set width
	  if (isset(this.config, "width")) {
	    if (util.isInt(this.config.width)) {
	      this.width = this.config.width + "px";
	    } else {
	      if (this.config.width === "auto") {
	        this.width = "100%";
	      } else if (util.includes(this.config.width, "%")) {
	        this.width = this.config.width;
	      }
	    }
	  }

	  this.container = util.createElement("div", {
	    class: "selectr-container"
	  });

	  // Custom className
	  if (this.config.customClass) {
	    util.addClass(this.container, this.config.customClass);
	  }

	  // Mobile device
	  if (this.mobileDevice) {
	    util.addClass(this.container, "selectr-mobile");
	  } else {
	    util.addClass(this.container, "selectr-desktop");
	  }

	  // Hide the HTMLSelectElement and prevent focus
	  this.el.tabIndex = -1;

	  // Native dropdown
	  if (this.config.nativeDropdown || this.mobileDevice) {
	    util.addClass(this.el, "selectr-visible");
	  } else {
	    util.addClass(this.el, "selectr-hidden");
	  }

	  this.selected = util.createElement("div", {
	    class: "selectr-selected",
	    disabled: this.disabled,
	    tabIndex: 1, // enable tabIndex (#9)
	    "aria-expanded": false
	  });

	  this.label = util.createElement(this.el.multiple ? "ul" : "span", {
	    class: "selectr-label"
	  });

	  var dropdown = util.createElement("div", {
	    class: "selectr-options-container"
	  });

	  this.tree = util.createElement("ul", {
	    class: "selectr-options",
	    role: "tree",
	    "aria-hidden": true,
	    "aria-expanded": false
	  });

	  this.notice = util.createElement("div", {
	    class: "selectr-notice"
	  });

	  this.el.setAttribute("aria-hidden", true);

	  if (this.disabled) {
	    this.el.disabled = true;
	  }

	  if (this.el.multiple) {
	    util.addClass(this.label, "selectr-tags");
	    util.addClass(this.container, "multiple");

	    // Collection of tags
	    this.tags = [];

	    // Collection of selected values
	    this.selectedValues = this.getSelectedProperties('value');

	    // Collection of selected indexes
	    this.selectedIndexes = this.getSelectedProperties('idx');
	  }

	  this.selected.appendChild(this.label);

	  if (this.config.clearable) {
	    this.selectClear = util.createElement("button", {
	      class: "selectr-clear",
	      type: "button"
	    });

	    this.container.appendChild(this.selectClear);

	    util.addClass(this.container, "clearable");
	  }

	  if (this.config.taggable) {
	    var li = util.createElement('li', {
	      class: 'input-tag'
	    });
	    this.input = util.createElement("input", {
	      class: "selectr-tag-input",
	      placeholder: this.config.tagPlaceholder,
	      tagIndex: 0,
	      autocomplete: "off",
	      autocorrect: "off",
	      autocapitalize: "off",
	      spellcheck: "false",
	      role: "textbox",
	      type: "search"
	    });

	    li.appendChild(this.input);
	    this.label.appendChild(li);
	    util.addClass(this.container, "taggable");

	    this.tagSeperators = [","];
	    if (this.config.tagSeperators) {
	      this.tagSeperators = this.tagSeperators.concat(this.config.tagSeperators);
	    }
	  }

	  if (this.config.searchable) {
	    this.input = util.createElement("input", {
	      class: "selectr-input",
	      tagIndex: -1,
	      autocomplete: "off",
	      autocorrect: "off",
	      autocapitalize: "off",
	      spellcheck: "false",
	      role: "textbox",
	      type: "search"
	    });
	    this.inputClear = util.createElement("button", {
	      class: "selectr-input-clear",
	      type: "button"
	    });
	    this.inputContainer = util.createElement("div", {
	      class: "selectr-input-container"
	    });

	    this.inputContainer.appendChild(this.input);
	    this.inputContainer.appendChild(this.inputClear);
	    dropdown.appendChild(this.inputContainer);
	  }

	  dropdown.appendChild(this.notice);
	  dropdown.appendChild(this.tree);

	  // List of items for the dropdown
	  this.items = [];

	  // Establish options
	  this.options = [];

	  // Check for options in the element
	  if (this.el.options.length) {
	    this.options = [].slice.call(this.el.options);
	  }

	  // Element may have optgroups so
	  // iterate element.children instead of element.options
	  var group = false,
	      j = 0;
	  if (this.el.children.length) {
	    util.each(this.el.children, function(i, element) {
	      if (element.nodeName === "OPTGROUP") {

	        group = util.createElement("ul", {
	          class: "selectr-optgroup",
	          role: "group",
	          html: "<li class='selectr-optgroup--label'>" + element.label + "</li>"
	        });

	        util.each(element.children, function(x, el) {
	          el.idx = j;
	          group.appendChild(createItem.call(this, el, group));
	          j++;
	        }, this);
	      } else {
	        element.idx = j;
	        createItem.call(this, element);
	        j++;
	      }
	    }, this);
	  }

	  // Options defined by the data option
	  if (this.config.data && Array.isArray(this.config.data)) {
	    this.data = [];
	    var optgroup = false,
	        option;

	    group = false;
	    j = 0;

	    util.each(this.config.data, function(i, opt) {
	      // Check for group options
	      if (isset(opt, "children")) {
	        optgroup = util.createElement("optgroup", {
	          label: opt.text
	        });

	        group = util.createElement("ul", {
	          class: "selectr-optgroup",
	          role: "group",
	          html: "<li class='selectr-optgroup--label'>" + opt.text + "</li>"
	        });

	        util.each(opt.children, function(x, data) {
	          option = new Option(data.text, data.value, false, data.hasOwnProperty("selected") && data.selected === true);

	          option.disabled = isset(data, "disabled");

	          this.options.push(option);

	          optgroup.appendChild(option);

	          option.idx = j;

	          group.appendChild(createItem.call(this, option, data));

	          this.data[j] = data;

	          j++;
	        }, this);
	      } else {
	        option = new Option(opt.text, opt.value, false, opt.hasOwnProperty("selected") && opt.selected === true);

	        option.disabled = isset(opt, "disabled");

	        this.options.push(option);

	        option.idx = j;

	        createItem.call(this, option, opt);

	        this.data[j] = opt;

	        j++;
	      }
	    }, this);
	  }

	  this.setSelected(true);

	  var first;
	  this.navIndex = 0;
	  for (var i = 0; i < this.items.length; i++) {
	    first = this.items[i];

	    if (!util.hasClass(first, "disabled")) {

	      util.addClass(first, "active");
	      this.navIndex = i;
	      break;
	    }
	  }

	  // Check for pagination / infinite scroll
	  if (this.requiresPagination) {
	    this.pageIndex = 1;

	    // Create the pages
	    this.paginate();
	  }

	  this.container.appendChild(this.selected);
	  this.container.appendChild(dropdown);

	  this.placeEl = util.createElement("div", {
	    class: "selectr-placeholder"
	  });

	  // Set the placeholder
	  this.setPlaceholder();

	  this.selected.appendChild(this.placeEl);

	  // Disable if required
	  if (this.disabled) {
	    this.disable();
	  }

	  this.el.parentNode.insertBefore(this.container, this.el);
	  this.container.appendChild(this.el);
	};

	/**
	 * Navigate through the dropdown
	 * @param  {obj} e
	 * @return {void}
	 */
	var navigate = function(e) {
	  e = e || window.event;

	  // Filter out the keys we don"t want
	  if (!this.items.length || !this.opened || !util.includes([13, 38, 40], e.which)) {
	    this.navigating = false;
	    return;
	  }

	  e.preventDefault();

	  if (e.which === 13) {

	    if (this.config.taggable && this.input.value.length > 0) {
	      return false;
	    }

	    return this.change(this.navIndex);
	  }

	  var direction, prevEl = this.items[this.navIndex];

	  switch (e.which) {
	    case 38:
	      direction = 0;
	      if (this.navIndex > 0) {
	        this.navIndex--;
	      }
	      break;
	    case 40:
	      direction = 1;
	      if (this.navIndex < this.items.length - 1) {
	        this.navIndex++;
	      }
	  }

	  this.navigating = true;


	  // Instead of wasting memory holding a copy of this.items
	  // with disabled / excluded options omitted, skip them instead
	  while (util.hasClass(this.items[this.navIndex], "disabled") || util.hasClass(this.items[this.navIndex], "excluded")) {
	    if (direction) {
	      this.navIndex++;
	    } else {
	      this.navIndex--;
	    }

	    if (this.searching) {
	      if (this.navIndex > this.tree.lastElementChild.idx) {
	        this.navIndex = this.tree.lastElementChild.idx;
	        break;
	      } else if (this.navIndex < this.tree.firstElementChild.idx) {
	        this.navIndex = this.tree.firstElementChild.idx;
	        break;
	      }
	    }
	  }

	  // Autoscroll the dropdown during navigation
	  var r = util.rect(this.items[this.navIndex]);

	  if (!direction) {
	    if (this.navIndex === 0) {
	      this.tree.scrollTop = 0;
	    } else if (r.top - this.optsRect.top < 0) {
	      this.tree.scrollTop = this.tree.scrollTop + (r.top - this.optsRect.top);
	    }
	  } else {
	    if (this.navIndex === 0) {
	      this.tree.scrollTop = 0;
	    } else if ((r.top + r.height) > (this.optsRect.top + this.optsRect.height)) {
	      this.tree.scrollTop = this.tree.scrollTop + ((r.top + r.height) - (this.optsRect.top + this.optsRect.height));
	    }

	    // Load another page if needed
	    if (this.navIndex === this.tree.childElementCount - 1 && this.requiresPagination) {
	      load.call(this);
	    }
	  }

	  if (prevEl) {
	    util.removeClass(prevEl, "active");
	  }

	  util.addClass(this.items[this.navIndex], "active");
	};

	/**
	 * Add a tag
	 * @param  {HTMLElement} item
	 */
	var addTag = function(item) {
	  var that = this,
	      r;

	  var docFrag = document.createDocumentFragment();
	  var option = this.options[item.idx];
	  var data = this.data ? this.data[item.idx] : option;
	  var content = this.customSelected ? this.config.renderSelection(data) : option.textContent;

	  var tag = util.createElement("li", {
	    class: "selectr-tag",
	    html: content
	  });
	  var btn = util.createElement("button", {
	    class: "selectr-tag-remove",
	    type: "button"
	  });

	  tag.appendChild(btn);

	  // Set property to check against later
	  tag.idx = item.idx;
	  tag.tag = option.value;

	  this.tags.push(tag);

	  if (this.config.sortSelected) {

	    var tags = this.tags.slice();

	    // Deal with values that contain numbers
	    r = function(val, arr) {
	      val.replace(/(\d+)|(\D+)/g, function(that, $1, $2) {
	        arr.push([$1 || Infinity, $2 || ""]);
	      });
	    };

	    tags.sort(function(a, b) {
	      var x = [],
	          y = [],
	          ac, bc;
	      if (that.config.sortSelected === true) {
	        ac = a.tag;
	        bc = b.tag;
	      } else if (that.config.sortSelected === 'text') {
	        ac = a.textContent;
	        bc = b.textContent;
	      }

	      r(ac, x);
	      r(bc, y);

	      while (x.length && y.length) {
	        var ax = x.shift();
	        var by = y.shift();
	        var nn = (ax[0] - by[0]) || ax[1].localeCompare(by[1]);
	        if (nn) return nn;
	      }

	      return x.length - y.length;
	    });

	    util.each(tags, function(i, tg) {
	      docFrag.appendChild(tg);
	    });

	    this.label.innerHTML = "";

	  } else {
	    docFrag.appendChild(tag);
	  }

	  if (this.config.taggable) {
	    this.label.insertBefore(docFrag, this.input.parentNode);
	  } else {
	    this.label.appendChild(docFrag);
	  }
	};

	/**
	 * Remove a tag
	 * @param  {HTMLElement} item
	 * @return {void}
	 */
	var removeTag = function(item) {
	  var tag = false;

	  util.each(this.tags, function(i, t) {
	    if (t.idx === item.idx) {
	      tag = t;
	    }
	  }, this);

	  if (tag) {
	    this.label.removeChild(tag);
	    this.tags.splice(this.tags.indexOf(tag), 1);
	  }
	};

	/**
	 * Load the next page of items
	 * @return {void}
	 */
	var load = function() {
	  var tree = this.tree;
	  var scrollTop = tree.scrollTop;
	  var scrollHeight = tree.scrollHeight;
	  var offsetHeight = tree.offsetHeight;
	  var atBottom = scrollTop >= (scrollHeight - offsetHeight);

	  if ((atBottom && this.pageIndex < this.pages.length)) {
	    var f = document.createDocumentFragment();

	    util.each(this.pages[this.pageIndex], function(i, item) {
	      appendItem(item, f, this.customOption);
	    }, this);

	    tree.appendChild(f);

	    this.pageIndex++;

	    this.emit("selectr.paginate", {
	      items: this.items.length,
	      total: this.data.length,
	      page: this.pageIndex,
	      pages: this.pages.length
	    });
	  }
	};

	/**
	 * Clear a search
	 * @return {void}
	 */
	var clearSearch = function() {
	  if (this.config.searchable || this.config.taggable) {
	    this.input.value = null;
	    this.searching = false;
	    if (this.config.searchable) {
	      util.removeClass(this.inputContainer, "active");
	    }

	    if (util.hasClass(this.container, "notice")) {
	      util.removeClass(this.container, "notice");
	      util.addClass(this.container, "open");
	      this.input.focus();
	    }

	    util.each(this.items, function(i, item) {
	      // Items that didn't match need the class
	      // removing to make them visible again
	      util.removeClass(item, "excluded");
	      // Remove the span element for underlining matched items
	      if (!this.customOption) {
	        item.innerHTML = item.textContent;
	      }
	    }, this);
	  }
	};

	/**
	 * Query matching for searches
	 * @param  {string} query
	 * @param  {HTMLOptionElement} option
	 * @return {bool}
	 */
	var match = function(query, option) {
	  var result = new RegExp(query, "i").exec(option.textContent);
	  if (result) {
	    return option.textContent.replace(result[0], "<span class='selectr-match'>" + result[0] + "</span>");
	  }
	  return false;
	};

	// Main Lib
	var Selectr = function(el, config) {

	  config = config || {};

	  if (!el) {
	    throw new Error("You must supply either a HTMLSelectElement or a CSS3 selector string.");
	  }

	  this.el = el;

	  // CSS3 selector string
	  if (typeof el === "string") {
	    this.el = document.querySelector(el);
	  }

	  if (this.el === null) {
	    throw new Error("The element you passed to Selectr can not be found.");
	  }

	  if (this.el.nodeName.toLowerCase() !== "select") {
	    throw new Error("The element you passed to Selectr is not a HTMLSelectElement.");
	  }

	  this.render(config);
	};

	/**
	 * Render the instance
	 * @param  {object} config
	 * @return {void}
	 */
	Selectr.prototype.render = function(config) {

	  if (this.rendered) return;

	  // Merge defaults with user set config
	  this.config = util.extend(defaultConfig, config);

	  // Store type
	  this.originalType = this.el.type;

	  // Store tabIndex
	  this.originalIndex = this.el.tabIndex;

	  // Store defaultSelected options for form reset
	  this.defaultSelected = [];

	  // Store the original option count
	  this.originalOptionCount = this.el.options.length;

	  if (this.config.multiple || this.config.taggable) {
	    this.el.multiple = true;
	  }

	  // Disabled?
	  this.disabled = isset(this.config, "disabled");

	  this.opened = false;

	  if (this.config.taggable) {
	    this.config.searchable = false;
	  }

	  this.navigating = false;

	  this.mobileDevice = false;
	  if (/Android|webOS|iPhone|iPad|BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent)) {
	    this.mobileDevice = true;
	  }

	  this.customOption = this.config.hasOwnProperty("renderOption") && typeof this.config.renderOption === "function";
	  this.customSelected = this.config.hasOwnProperty("renderSelection") && typeof this.config.renderSelection === "function";

	  // Enable event emitter
	  Events.mixin(this);

	  build.call(this);

	  this.bindEvents();

	  this.update();

	  this.optsRect = util.rect(this.tree);

	  this.rendered = true;

	  // Fixes macOS Safari bug #28
	  if (!this.el.multiple) {
	    this.el.selectedIndex = this.selectedIndex;
	  }

	  var that = this;
	  setTimeout(function() {
	    that.emit("selectr.init");
	  }, 20);
	};

	Selectr.prototype.getSelected = function () {
	  var selected = this.el.querySelectorAll('option:checked');
	  return selected;
	};

	Selectr.prototype.getSelectedProperties = function (prop) {
	  var selected = this.getSelected();
	  var values = [].slice.call(selected)
	      .map(function(option) { return option[prop]; })
	      .filter(function(i) { return i!==null && i!==undefined; });
	  return values;
	};

	/**
	 * Attach the required event listeners
	 */
	Selectr.prototype.bindEvents = function() {

	  var that = this;

	  this.events = {};

	  this.events.dismiss = dismiss.bind(this);
	  this.events.navigate = navigate.bind(this);
	  this.events.reset = this.reset.bind(this);

	  if (this.config.nativeDropdown || this.mobileDevice) {

	    this.container.addEventListener("touchstart", function(e) {
	      if (e.changedTouches[0].target === that.el) {
	        that.toggle();
	      }
	    });

	    if (this.config.nativeDropdown || this.mobileDevice) {
	      this.container.addEventListener("click", function(e) {
	        e.preventDefault();  // Jos: Added to prevent emitting clear directly after select
	        e.stopPropagation(); // Jos: Added to prevent emitting clear directly after select

	        if (e.target === that.el) {
	          that.toggle();
	        }
	      });
	    }

	    var getChangedOptions = function(last, current) {
	      var added=[], removed=last.slice(0);
	      var idx;
	      for (var i=0; i<current.length; i++) {
	        idx = removed.indexOf(current[i]);
	        if (idx > -1)
	          removed.splice(idx, 1);
	        else
	          added.push(current[i]);
	      }
	      return [added, removed];
	    };

	    // Listen for the change on the native select
	    // and update accordingly
	    this.el.addEventListener("change", function(e) {
	      if (that.el.multiple) {
	        var indexes = that.getSelectedProperties('idx');
	        var changes = getChangedOptions(that.selectedIndexes, indexes);

	        util.each(changes[0], function(i, idx) {
	          that.select(idx);
	        }, that);

	        util.each(changes[1], function(i, idx) {
	          that.deselect(idx);
	        }, that);

	      } else {
	        if (that.el.selectedIndex > -1) {
	          that.select(that.el.selectedIndex);
	        }
	      }
	    });

	  }

	  // Open the dropdown with Enter key if focused
	  if (this.config.nativeDropdown) {
	    this.container.addEventListener("keydown", function(e) {
	      if (e.key === "Enter" && that.selected === document.activeElement) {
	        // Show the native
	        that.toggle();

	        // Focus on the native multiselect
	        setTimeout(function() {
	          that.el.focus();
	        }, 200);
	      }
	    });
	  }

	  // Non-native dropdown
	  this.selected.addEventListener("click", function(e) {

	    if (!that.disabled) {
	      that.toggle();
	    }

	    e.preventDefault();
	    e.stopPropagation(); // Jos: Added to prevent emitting clear directly after select
	  });

	  // Remove tag
	  this.label.addEventListener("click", function(e) {
	    if (util.hasClass(e.target, "selectr-tag-remove")) {
	      that.deselect(e.target.parentNode.idx);
	    }
	  });

	  // Clear input
	  if (this.selectClear) {
	    this.selectClear.addEventListener("click", this.clear.bind(this));
	  }

	  // Prevent text selection
	  this.tree.addEventListener("mousedown", function(e) {
	    e.preventDefault();
	  });

	  // Select / deselect items
	  this.tree.addEventListener("click", function(e) {
	    e.preventDefault();  // Jos: Added to prevent emitting clear directly after select
	    e.stopPropagation(); // Jos: Added to prevent emitting clear directly after select

	    var item = util.closest(e.target, function(el) {
	      return el && util.hasClass(el, "selectr-option");
	    });

	    if (item) {
	      if (!util.hasClass(item, "disabled")) {
	        if (util.hasClass(item, "selected")) {
	          if (that.el.multiple || !that.el.multiple && that.config.allowDeselect) {
	            that.deselect(item.idx);
	          }
	        } else {
	          that.select(item.idx);
	        }

	        if (that.opened && !that.el.multiple) {
	          that.close();
	        }
	      }
	    }
	  });

	  // Mouseover list items
	  this.tree.addEventListener("mouseover", function(e) {
	    if (util.hasClass(e.target, "selectr-option")) {
	      if (!util.hasClass(e.target, "disabled")) {
	        util.removeClass(that.items[that.navIndex], "active");

	        util.addClass(e.target, "active");

	        that.navIndex = [].slice.call(that.items).indexOf(e.target);
	      }
	    }
	  });

	  // Searchable
	  if (this.config.searchable) {
	    // Show / hide the search input clear button

	    this.input.addEventListener("focus", function(e) {
	      that.searching = true;
	    });

	    this.input.addEventListener("blur", function(e) {
	      that.searching = false;
	    });

	    this.input.addEventListener("keyup", function(e) {
	      that.search();

	      if (!that.config.taggable) {
	        // Show / hide the search input clear button
	        if (this.value.length) {
	          util.addClass(this.parentNode, "active");
	        } else {
	          util.removeClass(this.parentNode, "active");
	        }
	      }
	    });

	    // Clear the search input
	    this.inputClear.addEventListener("click", function(e) {
	      that.input.value = null;
	      clearSearch.call(that);

	      if (!that.tree.childElementCount) {
	        render.call(that);
	      }
	    });
	  }

	  if (this.config.taggable) {
	    this.input.addEventListener("keyup", function(e) {

	      that.search();

	      if (that.config.taggable && this.value.length) {
	        var val = this.value.trim();

	        if (e.which === 13 || util.includes(that.tagSeperators, e.key)) {

	          util.each(that.tagSeperators, function(i, k) {
	            val = val.replace(k, '');
	          });

	          var option = that.add({
	            value: val,
	            text: val,
	            selected: true
	          }, true);

	          if (!option) {
	            this.value = '';
	            that.setMessage('That tag is already in use.');
	          } else {
	            that.close();
	            clearSearch.call(that);
	          }
	        }
	      }
	    });
	  }

	  this.update = util.debounce(function() {
	    // Optionally close dropdown on scroll / resize (#11)
	    if (that.opened && that.config.closeOnScroll) {
	      that.close();
	    }
	    if (that.width) {
	      that.container.style.width = that.width;
	    }
	    that.invert();
	  }, 50);

	  if (this.requiresPagination) {
	    this.paginateItems = util.debounce(function() {
	      load.call(this);
	    }, 50);

	    this.tree.addEventListener("scroll", this.paginateItems.bind(this));
	  }

	  // Dismiss when clicking outside the container
	  document.addEventListener("click", this.events.dismiss);
	  window.addEventListener("keydown", this.events.navigate);

	  window.addEventListener("resize", this.update);
	  window.addEventListener("scroll", this.update);

	  // Listen for form.reset() (@ambrooks, #13)
	  if (this.el.form) {
	    this.el.form.addEventListener("reset", this.events.reset);
	  }
	};

	/**
	 * Check for selected options
	 * @param {bool} reset
	 */
	Selectr.prototype.setSelected = function(reset) {

	  // Select first option as with a native select-one element - #21, #24
	  if (!this.config.data && !this.el.multiple && this.el.options.length) {
	    // Browser has selected the first option by default
	    if (this.el.selectedIndex === 0) {
	      if (!this.el.options[0].defaultSelected && !this.config.defaultSelected) {
	        this.el.selectedIndex = -1;
	      }
	    }

	    this.selectedIndex = this.el.selectedIndex;

	    if (this.selectedIndex > -1) {
	      this.select(this.selectedIndex);
	    }
	  }

	  // If we're changing a select-one to select-multiple via the config
	  // and there are no selected options, the first option will be selected by the browser
	  // Let's prevent that here.
	  if (this.config.multiple && this.originalType === "select-one" && !this.config.data) {
	    if (this.el.options[0].selected && !this.el.options[0].defaultSelected) {
	      this.el.options[0].selected = false;
	    }
	  }

	  util.each(this.options, function(i, option) {
	    if (option.selected && option.defaultSelected) {
	      this.select(option.idx);
	    }
	  }, this);

	  if (this.config.selectedValue) {
	    this.setValue(this.config.selectedValue);
	  }

	  if (this.config.data) {


	    if (!this.el.multiple && this.config.defaultSelected && this.el.selectedIndex < 0) {
	      this.select(0);
	    }

	    var j = 0;
	    util.each(this.config.data, function(i, opt) {
	      // Check for group options
	      if (isset(opt, "children")) {
	        util.each(opt.children, function(x, item) {
	          if (item.hasOwnProperty("selected") && item.selected === true) {
	            this.select(j);
	          }
	          j++;
	        }, this);
	      } else {
	        if (opt.hasOwnProperty("selected") && opt.selected === true) {
	          this.select(j);
	        }
	        j++;
	      }
	    }, this);
	  }
	};

	/**
	 * Destroy the instance
	 * @return {void}
	 */
	Selectr.prototype.destroy = function() {

	  if (!this.rendered) return;

	  this.emit("selectr.destroy");

	  // Revert to select-single if programtically set to multiple
	  if (this.originalType === 'select-one') {
	    this.el.multiple = false;
	  }

	  if (this.config.data) {
	    this.el.innerHTML = "";
	  }

	  // Remove the className from select element
	  util.removeClass(this.el, 'selectr-hidden');

	  // Remove reset listener from parent form
	  if (this.el.form) {
	    util.off(this.el.form, "reset", this.events.reset);
	  }

	  // Remove event listeners attached to doc and win
	  util.off(document, "click", this.events.dismiss);
	  util.off(document, "keydown", this.events.navigate);
	  util.off(window, "resize", this.update);
	  util.off(window, "scroll", this.update);

	  // Replace the container with the original select element
	  this.container.parentNode.replaceChild(this.el, this.container);

	  this.rendered = false;
	};

	/**
	 * Change an options state
	 * @param  {Number} index
	 * @return {void}
	 */
	Selectr.prototype.change = function(index) {
	  var item = this.items[index],
	      option = this.options[index];

	  if (option.disabled) {
	    return;
	  }

	  if (option.selected && util.hasClass(item, "selected")) {
	    this.deselect(index);
	  } else {
	    this.select(index);
	  }

	  if (this.opened && !this.el.multiple) {
	    this.close();
	  }
	};

	/**
	 * Select an option
	 * @param  {Number} index
	 * @return {void}
	 */
	Selectr.prototype.select = function(index) {

	  var item = this.items[index],
	      options = [].slice.call(this.el.options),
	      option = this.options[index];

	  if (this.el.multiple) {
	    if (util.includes(this.selectedIndexes, index)) {
	      return false;
	    }

	    if (this.config.maxSelections && this.tags.length === this.config.maxSelections) {
	      this.setMessage("A maximum of " + this.config.maxSelections + " items can be selected.", true);
	      return false;
	    }

	    this.selectedValues.push(option.value);
	    this.selectedIndexes.push(index);

	    addTag.call(this, item);
	  } else {
	    var data = this.data ? this.data[index] : option;
	    this.label.innerHTML = this.customSelected ? this.config.renderSelection(data) : option.textContent;

	    this.selectedValue = option.value;
	    this.selectedIndex = index;

	    util.each(this.options, function(i, o) {
	      var opt = this.items[i];

	      if (i !== index) {
	        if (opt) {
	          util.removeClass(opt, "selected");
	        }
	        o.selected = false;
	        o.removeAttribute("selected");
	      }
	    }, this);
	  }

	  if (!util.includes(options, option)) {
	    this.el.add(option);
	  }

	  item.setAttribute("aria-selected", true);

	  util.addClass(item, "selected");
	  util.addClass(this.container, "has-selected");

	  option.selected = true;
	  option.setAttribute("selected", "");

	  this.emit("selectr.change", option);

	  this.emit("selectr.select", option);
	};

	/**
	 * Deselect an option
	 * @param  {Number} index
	 * @return {void}
	 */
	Selectr.prototype.deselect = function(index, force) {
	  var item = this.items[index],
	      option = this.options[index];

	  if (this.el.multiple) {
	    var selIndex = this.selectedIndexes.indexOf(index);
	    this.selectedIndexes.splice(selIndex, 1);

	    var valIndex = this.selectedValues.indexOf(option.value);
	    this.selectedValues.splice(valIndex, 1);

	    removeTag.call(this, item);

	    if (!this.tags.length) {
	      util.removeClass(this.container, "has-selected");
	    }
	  } else {

	    if (!force && !this.config.clearable && !this.config.allowDeselect) {
	      return false;
	    }

	    this.label.innerHTML = "";
	    this.selectedValue = null;

	    this.el.selectedIndex = this.selectedIndex = -1;

	    util.removeClass(this.container, "has-selected");
	  }


	  this.items[index].setAttribute("aria-selected", false);

	  util.removeClass(this.items[index], "selected");

	  option.selected = false;

	  option.removeAttribute("selected");

	  this.emit("selectr.change", null);

	  this.emit("selectr.deselect", option);
	};

	/**
	 * Programmatically set selected values
	 * @param {String|Array} value - A string or an array of strings
	 */
	Selectr.prototype.setValue = function(value) {
	  var isArray = Array.isArray(value);

	  if (!isArray) {
	    value = value.toString().trim();
	  }

	  // Can't pass array to select-one
	  if (!this.el.multiple && isArray) {
	    return false;
	  }

	  util.each(this.options, function(i, option) {
	    if (isArray && util.includes(value.toString(), option.value) || option.value === value) {
	      this.change(option.idx);
	    }
	  }, this);
	};

	/**
	 * Set the selected value(s)
	 * @param  {bool} toObject Return only the raw values or an object
	 * @param  {bool} toJson   Return the object as a JSON string
	 * @return {mixed}         Array or String
	 */
	Selectr.prototype.getValue = function(toObject, toJson) {
	  var value;

	  if (this.el.multiple) {
	    if (toObject) {
	      if (this.selectedIndexes.length) {
	        value = {};
	        value.values = [];
	        util.each(this.selectedIndexes, function(i, index) {
	          var option = this.options[index];
	          value.values[i] = {
	            value: option.value,
	            text: option.textContent
	          };
	        }, this);
	      }
	    } else {
	      value = this.selectedValues.slice();
	    }
	  } else {
	    if (toObject) {
	      var option = this.options[this.selectedIndex];
	      value = {
	        value: option.value,
	        text: option.textContent
	      };
	    } else {
	      value = this.selectedValue;
	    }
	  }

	  if (toObject && toJson) {
	    value = JSON.stringify(value);
	  }

	  return value;
	};

	/**
	 * Add a new option or options
	 * @param {object} data
	 */
	Selectr.prototype.add = function(data, checkDuplicate) {
	  if (data) {

	    this.data = this.data || [];
	    this.items = this.items || [];
	    this.options = this.options || [];

	    if (Array.isArray(data)) {
	      // We have an array on items
	      util.each(data, function(i, obj) {
	        this.add(obj, checkDuplicate);
	      }, this);
	    }
	    // User passed a single object to the method
	    // or Selectr passed an object from an array
	    else if ("[object Object]" === Object.prototype.toString.call(data)) {

	      if (checkDuplicate) {
	        var dupe = false;

	        util.each(this.options, function(i, option) {
	          if (option.value.toLowerCase() === data.value.toLowerCase()) {
	            dupe = true;
	          }
	        });

	        if (dupe) {
	          return false;
	        }
	      }

	      var option = util.createElement('option', data);

	      this.data.push(data);

	      // Add the new option to the list
	      this.options.push(option);

	      // Add the index for later use
	      option.idx = this.options.length > 0 ? this.options.length - 1 : 0;

	      // Create a new item
	      createItem.call(this, option);

	      // Select the item if required
	      if (data.selected) {
	        this.select(option.idx);
	      }

	      return option;
	    }

	    // We may have had an empty select so update
	    // the placeholder to reflect the changes.
	    this.setPlaceholder();

	    // Recount the pages
	    if (this.config.pagination) {
	      this.paginate();
	    }

	    return true;
	  }
	};

	/**
	 * Remove an option or options
	 * @param  {Mixed} o Array, integer (index) or string (value)
	 * @return {Void}
	 */
	Selectr.prototype.remove = function(o) {
	  var options = [];
	  if (Array.isArray(o)) {
	    util.each(o, function(i, opt) {
	      if (util.isInt(opt)) {
	        options.push(this.getOptionByIndex(opt));
	      } else if (typeof o === "string") {
	        options.push(this.getOptionByValue(opt));
	      }
	    }, this);

	  } else if (util.isInt(o)) {
	    options.push(this.getOptionByIndex(o));
	  } else if (typeof o === "string") {
	    options.push(this.getOptionByValue(o));
	  }

	  if (options.length) {
	    var index;
	    util.each(options, function(i, option) {
	      index = option.idx;

	      // Remove the HTMLOptionElement
	      this.el.remove(option);

	      // Remove the reference from the option array
	      this.options.splice(index, 1);

	      // If the item has a parentNode (group element) it needs to be removed
	      // otherwise the render function will still append it to the dropdown
	      var parentNode = this.items[index].parentNode;

	      if (parentNode) {
	        parentNode.removeChild(this.items[index]);
	      }

	      // Remove reference from the items array
	      this.items.splice(index, 1);

	      // Reset the indexes
	      util.each(this.options, function(i, opt) {
	        opt.idx = i;
	        this.items[i].idx = i;
	      }, this);
	    }, this);

	    // We may have had an empty select now so update
	    // the placeholder to reflect the changes.
	    this.setPlaceholder();

	    // Recount the pages
	    if (this.config.pagination) {
	      this.paginate();
	    }
	  }
	};

	/**
	 * Remove all options
	 */
	Selectr.prototype.removeAll = function() {

	  // Clear any selected options
	  this.clear(true);

	  // Remove the HTMLOptionElements
	  util.each(this.el.options, function(i, option) {
	    this.el.remove(option);
	  }, this);

	  // Empty the dropdown
	  util.truncate(this.tree);

	  // Reset variables
	  this.items = [];
	  this.options = [];
	  this.data = [];

	  this.navIndex = 0;

	  if (this.requiresPagination) {
	    this.requiresPagination = false;

	    this.pageIndex = 1;
	    this.pages = [];
	  }

	  // Update the placeholder
	  this.setPlaceholder();
	};

	/**
	 * Perform a search
	 * @param  {string} query The query string
	 */
	Selectr.prototype.search = function(string) {

	  if (this.navigating) return;

	  string = string || this.input.value;

	  var f = document.createDocumentFragment();

	  // Remove message
	  this.removeMessage();

	  // Clear the dropdown
	  util.truncate(this.tree);

	  if (string.length > 1) {
	    // Check the options for the matching string
	    util.each(this.options, function(i, option) {
	      var item = this.items[option.idx];
	      var includes = util.includes(option.textContent.toLowerCase(), string.toLowerCase());

	      if (includes && !option.disabled) {

	        appendItem(item, f, this.customOption);

	        util.removeClass(item, "excluded");

	        // Underline the matching results
	        if (!this.customOption) {
	          item.innerHTML = match(string, option);
	        }
	      } else {
	        util.addClass(item, "excluded");
	      }
	    }, this);


	    if (!f.childElementCount) {
	      if (!this.config.taggable) {
	        this.setMessage("no results.");
	      }
	    } else {
	      // Highlight top result (@binary-koan #26)
	      var prevEl = this.items[this.navIndex];
	      var firstEl = f.firstElementChild;

	      util.removeClass(prevEl, "active");

	      this.navIndex = firstEl.idx;

	      util.addClass(firstEl, "active");
	    }

	  } else {
	    render.call(this);
	  }

	  this.tree.appendChild(f);
	};

	/**
	 * Toggle the dropdown
	 * @return {void}
	 */
	Selectr.prototype.toggle = function() {
	  if (!this.disabled) {
	    if (this.opened) {
	      this.close();
	    } else {
	      this.open();
	    }
	  }
	};

	/**
	 * Open the dropdown
	 * @return {void}
	 */
	Selectr.prototype.open = function() {

	  var that = this;

	  if (!this.options.length) {
	    return false;
	  }

	  if (!this.opened) {
	    this.emit("selectr.open");
	  }

	  this.opened = true;

	  if (this.mobileDevice || this.config.nativeDropdown) {
	    util.addClass(this.container, "native-open");

	    if (this.config.data) {
	      // Dump the options into the select
	      // otherwise the native dropdown will be empty
	      util.each(this.options, function(i, option) {
	        this.el.add(option);
	      }, this);
	    }

	    return;
	  }

	  util.addClass(this.container, "open");

	  render.call(this);

	  this.invert();

	  this.tree.scrollTop = 0;

	  util.removeClass(this.container, "notice");

	  this.selected.setAttribute("aria-expanded", true);

	  this.tree.setAttribute("aria-hidden", false);
	  this.tree.setAttribute("aria-expanded", true);

	  if (this.config.searchable && !this.config.taggable) {
	    setTimeout(function() {
	      that.input.focus();
	      // Allow tab focus
	      that.input.tabIndex = 0;
	    }, 10);
	  }
	};

	/**
	 * Close the dropdown
	 * @return {void}
	 */
	Selectr.prototype.close = function() {

	  if (this.opened) {
	    this.emit("selectr.close");
	  }

	  this.opened = false;

	  if (this.mobileDevice || this.config.nativeDropdown) {
	    util.removeClass(this.container, "native-open");
	    return;
	  }

	  var notice = util.hasClass(this.container, "notice");

	  if (this.config.searchable && !notice) {
	    this.input.blur();
	    // Disable tab focus
	    this.input.tabIndex = -1;
	    this.searching = false;
	  }

	  if (notice) {
	    util.removeClass(this.container, "notice");
	    this.notice.textContent = "";
	  }

	  util.removeClass(this.container, "open");
	  util.removeClass(this.container, "native-open");

	  this.selected.setAttribute("aria-expanded", false);

	  this.tree.setAttribute("aria-hidden", true);
	  this.tree.setAttribute("aria-expanded", false);

	  util.truncate(this.tree);
	  clearSearch.call(this);
	};


	/**
	 * Enable the element
	 * @return {void}
	 */
	Selectr.prototype.enable = function() {
	  this.disabled = false;
	  this.el.disabled = false;

	  this.selected.tabIndex = this.originalIndex;

	  if (this.el.multiple) {
	    util.each(this.tags, function(i, t) {
	      t.lastElementChild.tabIndex = 0;
	    });
	  }

	  util.removeClass(this.container, "selectr-disabled");
	};

	/**
	 * Disable the element
	 * @param  {boolean} container Disable the container only (allow value submit with form)
	 * @return {void}
	 */
	Selectr.prototype.disable = function(container) {
	  if (!container) {
	    this.el.disabled = true;
	  }

	  this.selected.tabIndex = -1;

	  if (this.el.multiple) {
	    util.each(this.tags, function(i, t) {
	      t.lastElementChild.tabIndex = -1;
	    });
	  }

	  this.disabled = true;
	  util.addClass(this.container, "selectr-disabled");
	};


	/**
	 * Reset to initial state
	 * @return {void}
	 */
	Selectr.prototype.reset = function() {
	  if (!this.disabled) {
	    this.clear();

	    this.setSelected(true);

	    util.each(this.defaultSelected, function(i, idx) {
	      this.select(idx);
	    }, this);

	    this.emit("selectr.reset");
	  }
	};

	/**
	 * Clear all selections
	 * @return {void}
	 */
	Selectr.prototype.clear = function(force) {

	  if (this.el.multiple) {
	    // Loop over the selectedIndexes so we don't have to loop over all the options
	    // which can be costly if there are a lot of them

	    if (this.selectedIndexes.length) {
	      // Copy the array or we'll get an error
	      var indexes = this.selectedIndexes.slice();

	      util.each(indexes, function(i, idx) {
	        this.deselect(idx);
	      }, this);
	    }
	  } else {
	    if (this.selectedIndex > -1) {
	      this.deselect(this.selectedIndex, force);
	    }
	  }

	  this.emit("selectr.clear");
	};

	/**
	 * Return serialised data
	 * @param  {boolean} toJson
	 * @return {mixed} Returns either an object or JSON string
	 */
	Selectr.prototype.serialise = function(toJson) {
	  var data = [];
	  util.each(this.options, function(i, option) {
	    var obj = {
	      value: option.value,
	      text: option.textContent
	    };

	    if (option.selected) {
	      obj.selected = true;
	    }
	    if (option.disabled) {
	      obj.disabled = true;
	    }
	    data[i] = obj;
	  });

	  return toJson ? JSON.stringify(data) : data;
	};

	/**
	 * Localised version of serialise() method
	 */
	Selectr.prototype.serialize = function(toJson) {
	  return this.serialise(toJson);
	};

	/**
	 * Sets the placeholder
	 * @param {String} placeholder
	 */
	Selectr.prototype.setPlaceholder = function(placeholder) {
	  // Set the placeholder
	  placeholder = placeholder || this.config.placeholder || this.el.getAttribute("placeholder");

	  if (!this.options.length) {
	    placeholder = "No options available";
	  }

	  this.placeEl.innerHTML = placeholder;
	};

	/**
	 * Paginate the option list
	 * @return {Array}
	 */
	Selectr.prototype.paginate = function() {
	  if (this.items.length) {
	    var that = this;

	    this.pages = this.items.map(function(v, i) {
	      return i % that.config.pagination === 0 ? that.items.slice(i, i + that.config.pagination) : null;
	    }).filter(function(pages) {
	      return pages;
	    });

	    return this.pages;
	  }
	};

	/**
	 * Display a message
	 * @param  {String} message The message
	 */
	Selectr.prototype.setMessage = function(message, close) {
	  if (close) {
	    this.close();
	  }
	  util.addClass(this.container, "notice");
	  this.notice.textContent = message;
	};

	/**
	 * Dismiss the current message
	 */
	Selectr.prototype.removeMessage = function() {
	  util.removeClass(this.container, "notice");
	  this.notice.innerHTML = "";
	};

	/**
	 * Keep the dropdown within the window
	 * @return {void}
	 */
	Selectr.prototype.invert = function() {
	  var rt = util.rect(this.selected),
	      oh = this.tree.parentNode.offsetHeight,
	      wh = window.innerHeight,
	      doInvert = rt.top + rt.height + oh > wh;

	  if (doInvert) {
	    util.addClass(this.container, "inverted");
	    this.isInverted = true;
	  } else {
	    util.removeClass(this.container, "inverted");
	    this.isInverted = false;
	  }

	  this.optsRect = util.rect(this.tree);
	};

	/**
	 * Get an option via it's index
	 * @param  {Integer} index The index of the HTMLOptionElement required
	 * @return {HTMLOptionElement}
	 */
	Selectr.prototype.getOptionByIndex = function(index) {
	  return this.options[index];
	};

	/**
	 * Get an option via it's value
	 * @param  {String} value The value of the HTMLOptionElement required
	 * @return {HTMLOptionElement}
	 */
	Selectr.prototype.getOptionByValue = function(value) {
	  var option = false;

	  for (var i = 0, l = this.options.length; i < l; i++) {
	    if (this.options[i].value.trim() === value.toString().trim()) {
	      option = this.options[i];
	      break;
	    }
	  }

	  return option;
	};

	module.exports = Selectr;


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var ContextMenu = __webpack_require__(10);
	var translate = __webpack_require__(15).translate;

	/**
	 * Create a select box to be used in the editor menu's, which allows to switch mode
	 * @param {HTMLElement} container
	 * @param {String[]} modes  Available modes: 'code', 'form', 'text', 'tree', 'view'
	 * @param {String} current  Available modes: 'code', 'form', 'text', 'tree', 'view'
	 * @param {function(mode: string)} onSwitch  Callback invoked on switch
	 * @constructor
	 */
	function ModeSwitcher(container, modes, current, onSwitch) {
	  // available modes
	  var availableModes = {
	    code: {
	      'text': translate('modeCodeText'),
	      'title': translate('modeCodeTitle'),
	      'click': function () {
	        onSwitch('code')
	      }
	    },
	    form: {
	      'text': translate('modeFormText'),
	      'title': translate('modeFormTitle'),
	      'click': function () {
	        onSwitch('form');
	      }
	    },
	    text: {
	      'text': translate('modeTextText'),
	      'title': translate('modeTextTitle'),
	      'click': function () {
	        onSwitch('text');
	      }
	    },
	    tree: {
	      'text': translate('modeTreeText'),
	      'title': translate('modeTreeTitle'),
	      'click': function () {
	        onSwitch('tree');
	      }
	    },
	    view: {
	      'text': translate('modeViewText'),
	      'title': translate('modeViewTitle'),
	      'click': function () {
	        onSwitch('view');
	      }
	    }
	  };

	  // list the selected modes
	  var items = [];
	  for (var i = 0; i < modes.length; i++) {
	    var mode = modes[i];
	    var item = availableModes[mode];
	    if (!item) {
	      throw new Error('Unknown mode "' + mode + '"');
	    }

	    item.className = 'jsoneditor-type-modes' + ((current == mode) ? ' jsoneditor-selected' : '');
	    items.push(item);
	  }

	  // retrieve the title of current mode
	  var currentMode = availableModes[current];
	  if (!currentMode) {
	    throw new Error('Unknown mode "' + current + '"');
	  }
	  var currentTitle = currentMode.text;

	  // create the html element
	  var box = document.createElement('button');
	  box.type = 'button';
	  box.className = 'jsoneditor-modes jsoneditor-separator';
	  box.innerHTML = currentTitle + ' &#x25BE;';
	  box.title = 'Switch editor mode';
	  box.onclick = function () {
	    var menu = new ContextMenu(items);
	    menu.show(box, container);
	  };

	  var frame = document.createElement('div');
	  frame.className = 'jsoneditor-modes';
	  frame.style.position = 'relative';
	  frame.appendChild(box);

	  container.appendChild(frame);

	  this.dom = {
	    container: container,
	    box: box,
	    frame: frame
	  };
	}

	/**
	 * Set focus to switcher
	 */
	ModeSwitcher.prototype.focus = function () {
	  this.dom.box.focus();
	};

	/**
	 * Destroy the ModeSwitcher, remove from DOM
	 */
	ModeSwitcher.prototype.destroy = function () {
	  if (this.dom && this.dom.frame && this.dom.frame.parentNode) {
	    this.dom.frame.parentNode.removeChild(this.dom.frame);
	  }
	  this.dom = null;
	};

	module.exports = ModeSwitcher;

/***/ },
/* 27 */
/***/ function(module, exports) {

	'use strict';

	function completely(config) {
	    config = config || {};
	    config.confirmKeys = config.confirmKeys || [39, 35, 9] // right, end, tab 
	    config.caseSensitive = config.caseSensitive || false    // autocomplete case sensitive

	    var fontSize = '';
	    var fontFamily = '';    

	    var wrapper = document.createElement('div');
	    wrapper.style.position = 'relative';
	    wrapper.style.outline = '0';
	    wrapper.style.border = '0';
	    wrapper.style.margin = '0';
	    wrapper.style.padding = '0';

	    var dropDown = document.createElement('div');
	    dropDown.className = 'autocomplete dropdown';
	    dropDown.style.position = 'absolute';
	    dropDown.style.visibility = 'hidden';

	    var spacer;
	    var leftSide; // <-- it will contain the leftSide part of the textfield (the bit that was already autocompleted)
	    var createDropDownController = function (elem, rs) {
	        var rows = [];
	        var ix = 0;
	        var oldIndex = -1;

	        var onMouseOver = function () { this.style.outline = '1px solid #ddd'; }
	        var onMouseOut = function () { this.style.outline = '0'; }
	        var onMouseDown = function () { p.hide(); p.onmouseselection(this.__hint, p.rs); }

	        var p = {
	            rs: rs,
	            hide: function () {
	                elem.style.visibility = 'hidden';
	                //rs.hideDropDown();
	            },
	            refresh: function (token, array) {
	                elem.style.visibility = 'hidden';
	                ix = 0;
	                elem.innerHTML = '';
	                var vph = (window.innerHeight || document.documentElement.clientHeight);
	                var rect = elem.parentNode.getBoundingClientRect();
	                var distanceToTop = rect.top - 6;                        // heuristic give 6px 
	                var distanceToBottom = vph - rect.bottom - 6;  // distance from the browser border.

	                rows = [];
	                for (var i = 0; i < array.length; i++) {

	                    if (  (config.caseSensitive && array[i].indexOf(token) !== 0)
	                        ||(!config.caseSensitive && array[i].toLowerCase().indexOf(token.toLowerCase()) !== 0)) { continue; }

	                    var divRow = document.createElement('div');
	                    divRow.className = 'item';
	                    //divRow.style.color = config.color;
	                    divRow.onmouseover = onMouseOver;
	                    divRow.onmouseout = onMouseOut;
	                    divRow.onmousedown = onMouseDown;
	                    divRow.__hint = array[i];
	                    divRow.innerHTML = array[i].substring(0, token.length) + '<b>' + array[i].substring(token.length) + '</b>';
	                    rows.push(divRow);
	                    elem.appendChild(divRow);
	                }
	                if (rows.length === 0) {
	                    return; // nothing to show.
	                }
	                if (rows.length === 1 && (   (token.toLowerCase() === rows[0].__hint.toLowerCase() && !config.caseSensitive) 
	                                           ||(token === rows[0].__hint && config.caseSensitive))){
	                    return; // do not show the dropDown if it has only one element which matches what we have just displayed.
	                }

	                if (rows.length < 2) return;
	                p.highlight(0);

	                if (distanceToTop > distanceToBottom * 3) {        // Heuristic (only when the distance to the to top is 4 times more than distance to the bottom
	                    elem.style.maxHeight = distanceToTop + 'px';  // we display the dropDown on the top of the input text
	                    elem.style.top = '';
	                    elem.style.bottom = '100%';
	                } else {
	                    elem.style.top = '100%';
	                    elem.style.bottom = '';
	                    elem.style.maxHeight = distanceToBottom + 'px';
	                }
	                elem.style.visibility = 'visible';
	            },
	            highlight: function (index) {
	                if (oldIndex != -1 && rows[oldIndex]) {
	                    rows[oldIndex].className = "item";
	                }
	                rows[index].className = "item hover"; 
	                oldIndex = index;
	            },
	            move: function (step) { // moves the selection either up or down (unless it's not possible) step is either +1 or -1.
	                if (elem.style.visibility === 'hidden') return ''; // nothing to move if there is no dropDown. (this happens if the user hits escape and then down or up)
	                if (ix + step === -1 || ix + step === rows.length) return rows[ix].__hint; // NO CIRCULAR SCROLLING. 
	                ix += step;
	                p.highlight(ix);
	                return rows[ix].__hint;//txtShadow.value = uRows[uIndex].__hint ;
	            },
	            onmouseselection: function () { } // it will be overwritten. 
	        };
	        return p;
	    }

	    function setEndOfContenteditable(contentEditableElement) {
	        var range, selection;
	        if (document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
	        {
	            range = document.createRange();//Create a range (a range is a like the selection but invisible)
	            range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
	            range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
	            selection = window.getSelection();//get the selection object (allows you to change selection)
	            selection.removeAllRanges();//remove any selections already made
	            selection.addRange(range);//make the range you have just created the visible selection
	        }
	        else if (document.selection)//IE 8 and lower
	        {
	            range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
	            range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
	            range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
	            range.select();//Select the range (make it the visible selection
	        }
	    }

	    function calculateWidthForText(text) {
	        if (spacer === undefined) { // on first call only.
	            spacer = document.createElement('span');
	            spacer.style.visibility = 'hidden';
	            spacer.style.position = 'fixed';
	            spacer.style.outline = '0';
	            spacer.style.margin = '0';
	            spacer.style.padding = '0';
	            spacer.style.border = '0';
	            spacer.style.left = '0';
	            spacer.style.whiteSpace = 'pre';
	            spacer.style.fontSize = fontSize;
	            spacer.style.fontFamily = fontFamily;
	            spacer.style.fontWeight = 'normal';
	            document.body.appendChild(spacer);
	        }

	        // Used to encode an HTML string into a plain text.
	        // taken from http://stackoverflow.com/questions/1219860/javascript-jquery-html-encoding
	        spacer.innerHTML = String(text).replace(/&/g, '&amp;')
	            .replace(/"/g, '&quot;')
	            .replace(/'/g, '&#39;')
	            .replace(/</g, '&lt;')
	            .replace(/>/g, '&gt;');
	        return spacer.getBoundingClientRect().right;
	    }

	    var rs = {
	        onArrowDown: function () { }, // defaults to no action.
	        onArrowUp: function () { },   // defaults to no action.
	        onEnter: function () { },     // defaults to no action.
	        onTab: function () { },       // defaults to no action.
	        startFrom: 0,
	        options: [],
	        element: null,
	        elementHint: null,
	        elementStyle: null,
	        wrapper: wrapper,      // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations)
	        show: function (element, startPos, options) {
	            this.startFrom = startPos;
	            this.wrapper.remove();
	            if (this.elementHint) {
	                this.elementHint.remove();
	                this.elementHint = null;
	            }
	            
	            if (fontSize == '') {
	                fontSize = window.getComputedStyle(element).getPropertyValue('font-size');
	            }
	            if (fontFamily == '') {
	                fontFamily = window.getComputedStyle(element).getPropertyValue('font-family');
	            }
	            
	            var w = element.getBoundingClientRect().right - element.getBoundingClientRect().left;
	            dropDown.style.marginLeft = '0';
	            dropDown.style.marginTop = element.getBoundingClientRect().height + 'px';
	            this.options = options;

	            if (this.element != element) {
	                this.element = element;
	                this.elementStyle = {
	                    zIndex: this.element.style.zIndex,
	                    position: this.element.style.position,
	                    backgroundColor: this.element.style.backgroundColor,
	                    borderColor: this.element.style.borderColor
	                }
	            }

	            this.element.style.zIndex = 3;
	            this.element.style.position = 'relative';
	            this.element.style.backgroundColor = 'transparent';
	            this.element.style.borderColor = 'transparent';

	            this.elementHint = element.cloneNode();
	            this.elementHint.className = 'autocomplete hint';
	            this.elementHint.style.zIndex = 2;
	            this.elementHint.style.position = 'absolute';
	            this.elementHint.onfocus = function () { this.element.focus(); }.bind(this);



	            if (this.element.addEventListener) {
	                this.element.removeEventListener("keydown", keyDownHandler);
	                this.element.addEventListener("keydown", keyDownHandler, false);
	                this.element.removeEventListener("blur", onBlurHandler);
	                this.element.addEventListener("blur", onBlurHandler, false);                
	            } 

	            wrapper.appendChild(this.elementHint);
	            wrapper.appendChild(dropDown);
	            element.parentElement.appendChild(wrapper);


	            this.repaint(element);
	        },
	        setText: function (text) {
	            this.element.innerText = text;
	        },
	        getText: function () {
	            return this.element.innerText;
	        },
	        hideDropDown: function () {
	            this.wrapper.remove();
	            if (this.elementHint) {
	                this.elementHint.remove();
	                this.elementHint = null;
	                dropDownController.hide();
	                this.element.style.zIndex = this.elementStyle.zIndex;
	                this.element.style.position = this.elementStyle.position;
	                this.element.style.backgroundColor = this.elementStyle.backgroundColor;
	                this.element.style.borderColor = this.elementStyle.borderColor;
	            }
	            
	        },
	        repaint: function (element) {
	            var text = element.innerText;
	            text = text.replace('\n', '');

	            var startFrom = this.startFrom;
	            var options = this.options;
	            var optionsLength = this.options.length;

	            // breaking text in leftSide and token.
	            
	            var token = text.substring(this.startFrom);
	            leftSide = text.substring(0, this.startFrom);
	            
	            for (var i = 0; i < optionsLength; i++) {
	                var opt = this.options[i];
	                if (   (!config.caseSensitive && opt.toLowerCase().indexOf(token.toLowerCase()) === 0)
	                    || (config.caseSensitive && opt.indexOf(token) === 0)) {   // <-- how about upperCase vs. lowercase
	                    this.elementHint.innerText = leftSide + token + opt.substring(token.length);
	                    this.elementHint.realInnerText = leftSide + opt;
	                    break;
	                }
	            }
	            // moving the dropDown and refreshing it.
	            dropDown.style.left = calculateWidthForText(leftSide) + 'px';
	            dropDownController.refresh(token, this.options);
	            this.elementHint.style.width = calculateWidthForText(this.elementHint.innerText) + 10 + 'px'
	            var wasDropDownHidden = (dropDown.style.visibility == 'hidden');
	            if (!wasDropDownHidden)
	                this.elementHint.style.width = calculateWidthForText(this.elementHint.innerText) + dropDown.clientWidth + 'px';
	        }
	    };

	    var dropDownController = createDropDownController(dropDown, rs);

	    var keyDownHandler = function (e) {
	        //console.log("Keydown:" + e.keyCode);
	        e = e || window.event;
	        var keyCode = e.keyCode;

	        if (this.elementHint == null) return;

	        if (keyCode == 33) { return; } // page up (do nothing)
	        if (keyCode == 34) { return; } // page down (do nothing);

	        if (keyCode == 27) { //escape
	            rs.hideDropDown();
	            rs.element.focus();
	            e.preventDefault();
	            e.stopPropagation();
	            return;
	        }

	        var text = this.element.innerText;
	        text = text.replace('\n', '');
	        var startFrom = this.startFrom;

	        if (config.confirmKeys.indexOf(keyCode) >= 0) { //  (autocomplete triggered)
	            if (keyCode == 9) {                 
	                if (this.elementHint.innerText.length == 0) {
	                    rs.onTab(); 
	                }
	            }
	            if (this.elementHint.innerText.length > 0) { // if there is a hint               
	                if (this.element.innerText != this.elementHint.realInnerText) {
	                    this.element.innerText = this.elementHint.realInnerText;
	                    rs.hideDropDown();
	                    setEndOfContenteditable(this.element);
	                    if (keyCode == 9) {                
	                        rs.element.focus();
	                        e.preventDefault();
	                        e.stopPropagation();
	                    }
	                }                
	            }
	            return;
	        }

	        if (keyCode == 13) {       // enter  (autocomplete triggered)
	            if (this.elementHint.innerText.length == 0) { // if there is a hint
	                rs.onEnter();
	            } else {
	                var wasDropDownHidden = (dropDown.style.visibility == 'hidden');
	                dropDownController.hide();

	                if (wasDropDownHidden) {
	                    rs.hideDropDown();
	                    rs.element.focus();
	                    rs.onEnter();
	                    return;
	                }

	                this.element.innerText = this.elementHint.realInnerText;
	                rs.hideDropDown();
	                setEndOfContenteditable(this.element);
	                e.preventDefault();
	                e.stopPropagation();
	            }
	            return;
	        }

	        if (keyCode == 40) {     // down
	            var token = text.substring(this.startFrom);
	            var m = dropDownController.move(+1);
	            if (m == '') { rs.onArrowDown(); }
	            this.elementHint.innerText = leftSide + token + m.substring(token.length);
	            this.elementHint.realInnerText = leftSide + m;
	            e.preventDefault();
	            e.stopPropagation();
	            return;
	        }

	        if (keyCode == 38) {    // up
	            var token = text.substring(this.startFrom);
	            var m = dropDownController.move(-1);
	            if (m == '') { rs.onArrowUp(); }
	            this.elementHint.innerText = leftSide + token + m.substring(token.length);
	            this.elementHint.realInnerText = leftSide + m;
	            e.preventDefault();
	            e.stopPropagation();
	            return;
	        }

	    }.bind(rs);

	    var onBlurHandler = function (e) {
	        rs.hideDropDown();
	        //console.log("Lost focus.");
	    }.bind(rs);

	    dropDownController.onmouseselection = function (text, rs) {
	        rs.element.innerText = rs.elementHint.innerText = leftSide + text;        
	        rs.hideDropDown();   
	        window.setTimeout(function () {
	            rs.element.focus();
	            setEndOfContenteditable(rs.element);  
	        }, 1);              
	    };

	    return rs;
	}

	module.exports = completely;

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var ace = __webpack_require__(1);
	var ModeSwitcher = __webpack_require__(26);
	var util = __webpack_require__(12);

	// create a mixin with the functions for text mode
	var textmode = {};

	var DEFAULT_THEME = 'ace/theme/jsoneditor';

	/**
	 * Create a text editor
	 * @param {Element} container
	 * @param {Object} [options]   Object with options. available options:
	 *                             {String} mode             Available values:
	 *                                                       "text" (default)
	 *                                                       or "code".
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
	 *                             {function} onEditable     Determine if textarea is readOnly
	 *                                                       readOnly defaults true
	 *                             {Object} ace              A custom instance of
	 *                                                       Ace editor.
	 *                             {boolean} escapeUnicode   If true, unicode
	 *                                                       characters are escaped.
	 *                                                       false by default.
	 *                             {function} onTextSelectionChange Callback method, 
	 *                                                              triggered on text selection change
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
	      __webpack_require__(29);
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
	  this.validationSequence = 0;
	  this.annotations = [];
	  /**
	   * Visibility of validation error table
	   * @type {Boolean|undefined} undefined means default behavior for mode
	   */
	  this.errorTableVisible = undefined;

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

	    if (this.mode == 'code') {
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

	  if (this.mode == 'code') {
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

	  var validationErrorsContainer = document.createElement('div');
	  validationErrorsContainer.className = 'jsoneditor-validation-errors-container';
	  this.dom.validationErrorsContainer = validationErrorsContainer;
	  this.frame.appendChild(validationErrorsContainer);

	  var additionalErrorsIndication = document.createElement('div');
	  additionalErrorsIndication.style.display = 'none';
	  additionalErrorsIndication.className = "jsoneditor-additional-errors fadein";
	  additionalErrorsIndication.innerHTML = "Scroll for more &#9663;";
	  this.dom.additionalErrorsIndication = additionalErrorsIndication;
	  validationErrorsContainer.appendChild(additionalErrorsIndication);

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

	    var validationErrorIcon = document.createElement('span');
	    validationErrorIcon.className = 'jsoneditor-validation-error-icon';
	    validationErrorIcon.style.display = 'none';

	    var validationErrorCount = document.createElement('span');
	    validationErrorCount.className = 'jsoneditor-validation-error-count';    
	    validationErrorCount.style.display = 'none';

	    this.validationErrorIndication = {
	      validationErrorIcon: validationErrorIcon,
	      validationErrorCount: validationErrorCount
	    };

	    statusBar.appendChild(validationErrorCount);
	    statusBar.appendChild(validationErrorIcon);

	    this.parseErrorIndication = document.createElement('span');
	    this.parseErrorIndication.className = 'jsoneditor-parse-error-icon';    
	    this.parseErrorIndication.style.display = 'none';
	    statusBar.appendChild(this.parseErrorIndication);
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

	  if (this.frame && this.container && this.frame.parentNode == this.container) {
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
	  this.setText(text);
	};

	/**
	 * Format the code in the text editor
	 */
	textmode.format = function () {
	  var json = this.get();
	  var text = JSON.stringify(json, null, this.indentation);
	  this.setText(text);
	};

	/**
	 * Repair the code in the text editor
	 */
	textmode.repair = function () {
	  var text = this.getText();
	  var sanitizedText = util.sanitize(text);
	  this.setText(sanitizedText);
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

	    this.onChangeDisabled = false;
	  }
	  // validate JSON schema
	  this._debouncedValidate();
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

	  this.onChangeDisabled = true; // don't fire an onChange event
	  this.setText(jsonText);
	  this.onChangeDisabled = false;
	};

	/**
	 * Validate current JSON object against the configured JSON schema
	 * Throws an exception when no JSON schema is configured
	 */
	textmode.validate = function () {
	  var doValidate = false;
	  var schemaErrors = [];
	  var parseErrors = [];
	  var json;
	  try {
	    json = this.get(); // this can fail when there is no valid json
	    if (this.parseErrorIndication) {
	      this.parseErrorIndication.style.display = 'none';
	    }
	    doValidate = true;
	  }
	  catch (err) {
	    if (this.getText()) {
	      if (this.parseErrorIndication) {
	        this.parseErrorIndication.style.display = 'block';
	      }
	      // try to extract the line number from the jsonlint error message
	      var match = /\w*line\s*(\d+)\w*/g.exec(err.message);
	      var line;
	      if (match) {
	        line = +match[1];
	      }
	      if (this.parseErrorIndication) {
	        this.parseErrorIndication.title = !isNaN(line) ? ('parse error on line ' + line) : 'parse error - check that the json is valid';
	      }
	      parseErrors.push({
	        type: 'error',
	        message: err.message.replace(/\n/g, '<br>'),
	        line: line
	      });
	    }
	  }

	  // only validate the JSON when parsing the JSON succeeded
	  if (doValidate) {
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
	    try {
	      this.validationSequence++;
	      var me = this;
	      var seq = this.validationSequence;
	      this._validateCustom(json)
	          .then(function (customValidationErrors) {
	            // only apply when there was no other validation started whilst resolving async results
	            if (seq === me.validationSequence) {
	              var errors = schemaErrors.concat(parseErrors || []).concat(customValidationErrors || []);
	              me._renderErrors(errors);
	            }
	          })
	          .catch(function (err) {
	            console.error(err);
	          });
	    }
	    catch(err) {
	      console.error(err);
	    }
	  }
	  else {
	    this._renderErrors(parseErrors || [], true);
	  }
	};

	/**
	 * Execute custom validation if configured.
	 *
	 * Returns a promise resolving with the custom errors (or nothing).
	 */
	textmode._validateCustom = function (json) {
	  if (this.options.onValidate) {
	    try {
	      var customValidateResults = this.options.onValidate(json);

	      var resultPromise = util.isPromise(customValidateResults)
	          ? customValidateResults
	          : Promise.resolve(customValidateResults);

	      return resultPromise.then(function (customValidationPathErrors) {
	        if (Array.isArray(customValidationPathErrors)) {
	          return customValidationPathErrors
	              .filter(function (error) {
	                var valid = util.isValidValidationError(error);

	                if (!valid) {
	                  console.warn('Ignoring a custom validation error with invalid structure. ' +
	                      'Expected structure: {path: [...], message: "..."}. ' +
	                      'Actual error:', error);
	                }

	                return valid;
	              })
	              .map(function (error) {
	                // change data structure into the structure matching the JSON schema errors
	                return {
	                  dataPath: util.stringifyPath(error.path),
	                  message: error.message
	                }
	              });
	        }
	        else {
	          return null;
	        }
	      });
	    }
	    catch (err) {
	      return Promise.reject(err);
	    }
	  }

	  return Promise.resolve(null);
	};

	textmode._renderErrors = function(errors, noValidation) {
	  // clear all current errors
	  var me = this;
	  var validationErrorsCount = 0;

	  this.errorTableVisible = (typeof this.errorTableVisible === 'undefined') ? !this.aceEditor : this.errorTableVisible;

	  if (this.dom.validationErrors) {
	    this.dom.validationErrors.parentNode.removeChild(this.dom.validationErrors);
	    this.dom.validationErrors = null;
	    this.dom.additionalErrorsIndication.style.display = 'none';

	    this.content.style.marginBottom = '';
	    this.content.style.paddingBottom = '';
	  }

	  var jsonText = this.getText();
	  var errorPaths = [];
	  errors.reduce(function(acc, curr) {
	    if(acc.indexOf(curr.dataPath) === -1) {
	      acc.push(curr.dataPath);
	    }
	    return acc;
	  }, errorPaths);
	  var errorLocations = util.getPositionForPath(jsonText, errorPaths);

	  // render the new errors
	  if (errors.length > 0) {
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

	    // keep default behavior for parse errors
	    if (noValidation ? !this.aceEditor : this.errorTableVisible) {
	       var validationErrors = document.createElement('div');
	      validationErrors.innerHTML = '<table class="jsoneditor-text-errors"><tbody></tbody></table>';
	      var tbody = validationErrors.getElementsByTagName('tbody')[0];

	      errors.forEach(function (error) {
	        var message;
	        if (typeof error === 'string') {
	          message = '<td colspan="2"><pre>' + error + '</pre></td>';
	        }
	        else {
	          message = 
	              '<td>' + (error.dataPath || '') + '</td>' +
	              '<td>' + error.message + '</td>';
	        }

	        var line;

	        if (!isNaN(error.line)) {
	          line = error.line;
	        } else if (error.dataPath) {
	          var errLoc = errorLocations.find(function(loc) { return loc.path === error.dataPath; });
	          if (errLoc) {
	            line = errLoc.line + 1;
	          }
	        }

	        var trEl = document.createElement('tr');
	        trEl.className = !isNaN(line) ? 'jump-to-line' : '';
	        if (error.type === 'error') {
	          trEl.className += ' parse-error';
	        } else {
	          trEl.className += ' validation-error';
	          ++validationErrorsCount;
	        }
	        
	        trEl.innerHTML =  ('<td><button class="jsoneditor-schema-error"></button></td><td style="white-space:nowrap;">'+ (!isNaN(line) ? ('Ln ' + line) : '') +'</td>' + message);
	        trEl.onclick = function() {
	          me.isFocused = true;
	          if (!isNaN(line)) {
	            me.setTextSelection({row: line, column: 1}, {row: line, column: 1000});
	          }
	        };

	        tbody.appendChild(trEl);
	      });

	      this.dom.validationErrors = validationErrors;
	      this.dom.validationErrorsContainer.appendChild(validationErrors);
	      this.dom.additionalErrorsIndication.title = errors.length + " errors total";

	      if (this.dom.validationErrorsContainer.clientHeight < this.dom.validationErrorsContainer.scrollHeight) {
	        this.dom.additionalErrorsIndication.style.display = 'block';
	        this.dom.validationErrorsContainer.onscroll = function () {
	          me.dom.additionalErrorsIndication.style.display =
	            (me.dom.validationErrorsContainer.clientHeight > 0 && me.dom.validationErrorsContainer.scrollTop === 0) ? 'block' : 'none';
	        }
	      } else {
	        this.dom.validationErrorsContainer.onscroll = undefined;
	      }

	      var height = this.dom.validationErrorsContainer.clientHeight + (this.dom.statusBar ? this.dom.statusBar.clientHeight : 0);
	      this.content.style.marginBottom = (-height) + 'px';
	      this.content.style.paddingBottom = height + 'px';
	    } else {
	      validationErrorsCount = errors.reduce(function (acc, curr) {return (curr.type === 'validation' ? ++acc: acc)}, 0);
	    }
	    
	  } else {
	    if (this.aceEditor) {
	      this.annotations = [];
	      this._refreshAnnotations();
	    }
	  }

	  if (this.options.statusBar) {
	    validationErrorsCount = validationErrorsCount || this.annotations.length;
	    var showIndication = !!validationErrorsCount;
	    this.validationErrorIndication.validationErrorIcon.style.display = showIndication ? 'inline' : 'none';
	    this.validationErrorIndication.validationErrorCount.style.display = showIndication ? 'inline' : 'none';
	    if (showIndication) {
	      this.validationErrorIndication.validationErrorCount.innerText = validationErrorsCount;
	      this.validationErrorIndication.validationErrorIcon.title = validationErrorsCount + ' schema validation error(s) found';
	      this.validationErrorIndication.validationErrorCount.onclick = this.validationErrorIndication.validationErrorIcon.onclick = this._toggleErrorTableVisibility.bind(this);
	    }
	  }

	  // update the height of the ace editor
	  if (this.aceEditor) {
	    var force = false;
	    this.aceEditor.resize(force);
	  }
	};

	textmode._toggleErrorTableVisibility = function () {
	  this.errorTableVisible = !this.errorTableVisible;
	  this.validate();
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


/***/ },
/* 29 */
/***/ function(module, exports) {

	/* ***** BEGIN LICENSE BLOCK *****
	 * Distributed under the BSD license:
	 *
	 * Copyright (c) 2010, Ajax.org B.V.
	 * All rights reserved.
	 * 
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are met:
	 *     * Redistributions of source code must retain the above copyright
	 *       notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above copyright
	 *       notice, this list of conditions and the following disclaimer in the
	 *       documentation and/or other materials provided with the distribution.
	 *     * Neither the name of Ajax.org B.V. nor the
	 *       names of its contributors may be used to endorse or promote products
	 *       derived from this software without specific prior written permission.
	 * 
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
	 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
	 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
	 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
	 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 *
	 * ***** END LICENSE BLOCK ***** */

	ace.define('ace/theme/jsoneditor', ['require', 'exports', 'module', 'ace/lib/dom'], function(acequire, exports, module) {

	exports.isDark = false;
	exports.cssClass = "ace-jsoneditor";
	exports.cssText = ".ace-jsoneditor .ace_gutter {\
	background: #ebebeb;\
	color: #333\
	}\
	\
	.ace-jsoneditor.ace_editor {\
	font-family: \"dejavu sans mono\", \"droid sans mono\", consolas, monaco, \"lucida console\", \"courier new\", courier, monospace, sans-serif;\
	line-height: 1.3;\
	background-color: #fff;\
	}\
	.ace-jsoneditor .ace_print-margin {\
	width: 1px;\
	background: #e8e8e8\
	}\
	.ace-jsoneditor .ace_scroller {\
	background-color: #FFFFFF\
	}\
	.ace-jsoneditor .ace_text-layer {\
	color: gray\
	}\
	.ace-jsoneditor .ace_variable {\
	color: #1a1a1a\
	}\
	.ace-jsoneditor .ace_cursor {\
	border-left: 2px solid #000000\
	}\
	.ace-jsoneditor .ace_overwrite-cursors .ace_cursor {\
	border-left: 0px;\
	border-bottom: 1px solid #000000\
	}\
	.ace-jsoneditor .ace_marker-layer .ace_selection {\
	background: lightgray\
	}\
	.ace-jsoneditor.ace_multiselect .ace_selection.ace_start {\
	box-shadow: 0 0 3px 0px #FFFFFF;\
	border-radius: 2px\
	}\
	.ace-jsoneditor .ace_marker-layer .ace_step {\
	background: rgb(255, 255, 0)\
	}\
	.ace-jsoneditor .ace_marker-layer .ace_bracket {\
	margin: -1px 0 0 -1px;\
	border: 1px solid #BFBFBF\
	}\
	.ace-jsoneditor .ace_marker-layer .ace_active-line {\
	background: #FFFBD1\
	}\
	.ace-jsoneditor .ace_gutter-active-line {\
	background-color : #dcdcdc\
	}\
	.ace-jsoneditor .ace_marker-layer .ace_selected-word {\
	border: 1px solid lightgray\
	}\
	.ace-jsoneditor .ace_invisible {\
	color: #BFBFBF\
	}\
	.ace-jsoneditor .ace_keyword,\
	.ace-jsoneditor .ace_meta,\
	.ace-jsoneditor .ace_support.ace_constant.ace_property-value {\
	color: #AF956F\
	}\
	.ace-jsoneditor .ace_keyword.ace_operator {\
	color: #484848\
	}\
	.ace-jsoneditor .ace_keyword.ace_other.ace_unit {\
	color: #96DC5F\
	}\
	.ace-jsoneditor .ace_constant.ace_language {\
	color: darkorange\
	}\
	.ace-jsoneditor .ace_constant.ace_numeric {\
	color: red\
	}\
	.ace-jsoneditor .ace_constant.ace_character.ace_entity {\
	color: #BF78CC\
	}\
	.ace-jsoneditor .ace_invalid {\
	color: #FFFFFF;\
	background-color: #FF002A;\
	}\
	.ace-jsoneditor .ace_fold {\
	background-color: #AF956F;\
	border-color: #000000\
	}\
	.ace-jsoneditor .ace_storage,\
	.ace-jsoneditor .ace_support.ace_class,\
	.ace-jsoneditor .ace_support.ace_function,\
	.ace-jsoneditor .ace_support.ace_other,\
	.ace-jsoneditor .ace_support.ace_type {\
	color: #C52727\
	}\
	.ace-jsoneditor .ace_string {\
	color: green\
	}\
	.ace-jsoneditor .ace_comment {\
	color: #BCC8BA\
	}\
	.ace-jsoneditor .ace_entity.ace_name.ace_tag,\
	.ace-jsoneditor .ace_entity.ace_other.ace_attribute-name {\
	color: #606060\
	}\
	.ace-jsoneditor .ace_markup.ace_underline {\
	text-decoration: underline\
	}\
	.ace-jsoneditor .ace_indent-guide {\
	background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y\
	}";

	var dom = acequire("../lib/dom");
	dom.importCssString(exports.cssText, exports.cssClass);
	});


/***/ }
/******/ ])
});
;