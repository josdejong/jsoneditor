/**
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
 * Copyright (c) 2011-2013 Jos de Jong, http://jsoneditoronline.org
 *
 * @author  Jos de Jong, <wjosdejong@gmail.com>
 */

// create namespace
var jsoneditor = jsoneditor || {};

/**
 * Create a JSONFormatter and attach it to given container
 * @constructor jsoneditor.JSONFormatter
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
jsoneditor.JSONFormatter = function (container, options, json) {
    if (!(this instanceof jsoneditor.JSONFormatter)) {
        throw new Error('JSONFormatter constructor called without "new".');
    }

    // check availability of JSON parser (not available in IE7 and older)
    if (typeof(JSON) == 'undefined') {
        throw new Error('Your browser does not support JSON. \n\n' +
            'Please install the newest version of your browser.\n' +
            '(all modern browsers support JSON).');
    }

    // read options
    options = options || {};
    if (options.indentation) {
        this.indentation = Number(options.indentation);
    }
    this.mode = (options.mode == 'code') ? 'code' : 'text';
    if (this.mode == 'code') {
        // verify whether Ace editor is available and supported
        if (typeof ace === 'undefined') {
            this.mode = 'text';
            console.log('WARNING: Cannot load code editor, Ace library not loaded. ' +
                'Falling back to plain text editor');
        }
        if (jsoneditor.util.getInternetExplorerVersion() == 8) {
            this.mode = 'text';
            console.log('WARNING: Cannot load code editor, Ace is not supported on IE8. ' +
                'Falling back to plain text editor');
        }
    }

    var me = this;
    this.container = container;
    this.editor = undefined;    // ace code editor
    this.textarea = undefined;  // plain text editor (fallback when Ace is not available)
    this.indentation = 4;       // number of spaces

    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.frame = document.createElement('div');
    this.frame.className = 'jsoneditor';
    this.frame.onclick = function (event) {
        // prevent default submit action when JSONFormatter is located inside a form
        jsoneditor.util.preventDefault(event);
    };

    // create menu
    this.menu = document.createElement('div');
    this.menu.className = 'menu';
    this.frame.appendChild(this.menu);

    // create format button
    var buttonFormat = document.createElement('button');
    //buttonFormat.innerHTML = 'Format';
    buttonFormat.className = 'format';
    buttonFormat.title = 'Format JSON data, with proper indentation and line feeds';
    //buttonFormat.className = 'jsoneditor-button';
    this.menu.appendChild(buttonFormat);
    buttonFormat.onclick = function () {
        me.format();
    };

    // create compact button
    var buttonCompact = document.createElement('button');
    //buttonCompact.innerHTML = 'Compact';
    buttonCompact.className = 'compact';
    buttonCompact.title = 'Compact JSON data, remove all whitespaces';
    //buttonCompact.className = 'jsoneditor-button';
    this.menu.appendChild(buttonCompact);
    buttonCompact.onclick = function () {
        me.compact();
    };

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
        editor.setTheme('ace/theme/jso');
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
        textarea.className = 'content';
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
 * This method is executed on error.
 * It can be overwritten for each instance of the JSONFormatter
 * @param {String} err
 */
jsoneditor.JSONFormatter.prototype.onError = function(err) {
    // action should be implemented for the instance
};

/**
 * Compact the code in the formatter
 */
jsoneditor.JSONFormatter.prototype.compact = function () {
    try {
        var json = jsoneditor.util.parse(this.getText());
        this.setText(JSON.stringify(json));
    }
    catch (err) {
        this.onError(err);
    }
};

/**
 * Format the code in the formatter
 */
jsoneditor.JSONFormatter.prototype.format = function () {
    try {
        var json = jsoneditor.util.parse(this.getText());
        this.setText(JSON.stringify(json, null, this.indentation));
    }
    catch (err) {
        this.onError(err);
    }
};

/**
 * Set focus to the formatter
 */
jsoneditor.JSONFormatter.prototype.focus = function () {
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
jsoneditor.JSONFormatter.prototype.resize = function () {
    if (this.editor) {
        var force = false;
        this.editor.resize(force);
    }
};

/**
 * Set json data in the formatter
 * @param {Object} json
 */
jsoneditor.JSONFormatter.prototype.set = function(json) {
    this.setText(JSON.stringify(json, null, this.indentation));
};

/**
 * Get json data from the formatter
 * @return {Object} json
 */
jsoneditor.JSONFormatter.prototype.get = function() {
    return jsoneditor.util.parse(this.getText());
};

/**
 * Get the text contents of the JSONFormatter
 * @return {String} text
 */
jsoneditor.JSONFormatter.prototype.getText = function() {
    if (this.textarea) {
        return this.textarea.value;
    }
    if (this.editor) {
        return this.editor.getValue();
    }
    return '';
};

/**
 * Set the text contents of the JSONFormatter
 * @param {String} text
 */
jsoneditor.JSONFormatter.prototype.setText = function(text) {
    if (this.textarea) {
        this.textarea.value = text;
    }
    if (this.editor) {
        return this.editor.setValue(text, -1);
    }
};
