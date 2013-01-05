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

    this.container = container;
    this.indentation = 4; // number of spaces

    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.frame = document.createElement('div');
    this.frame.className = "jsoneditor-frame";
    this.frame.onclick = function (event) {
        // prevent default submit action when JSONFormatter is located inside a form
        jsoneditor.util.preventDefault(event);
    };

    // create menu
    this.menu = document.createElement('div');
    this.menu.className = 'jsoneditor-menu';
    this.frame.appendChild(this.menu);

    // create format button
    var buttonFormat = document.createElement('button');
    //buttonFormat.innerHTML = 'Format';
    buttonFormat.className = 'jsoneditor-menu jsoneditor-format';
    buttonFormat.title = 'Format JSON data, with proper indentation and line feeds';
    //buttonFormat.className = 'jsoneditor-button';
    this.menu.appendChild(buttonFormat);

    // create compact button
    var buttonCompact = document.createElement('button');
    //buttonCompact.innerHTML = 'Compact';
    buttonCompact.className = 'jsoneditor-menu jsoneditor-compact';
    buttonCompact.title = 'Compact JSON data, remove all whitespaces';
    //buttonCompact.className = 'jsoneditor-button';
    this.menu.appendChild(buttonCompact);

    this.content = document.createElement('div');
    this.content.className = 'jsonformatter-content';
    this.frame.appendChild(this.content);

    this.textarea = document.createElement('textarea');
    this.textarea.className = "jsonformatter-textarea";
    this.textarea.spellcheck = false;
    this.content.appendChild(this.textarea);

    var textarea = this.textarea;

    // read the options
    if (options) {
        if (options.change) {
            // register on change event
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
        if (options.indentation) {
            this.indentation = Number(options.indentation);
        }
    }

    var me = this;
    buttonFormat.onclick = function () {
        try {
            var json = jsoneditor.util.parse(textarea.value);
            textarea.value = JSON.stringify(json, null, me.indentation);
        }
        catch (err) {
            me.onError(err);
        }
    };
    buttonCompact.onclick = function () {
        try {
            var json = jsoneditor.util.parse(textarea.value);
            textarea.value = JSON.stringify(json);
        }
        catch (err) {
            me.onError(err);
        }
    };

    this.container.appendChild(this.frame);

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
 * Set json data in the formatter
 * @param {Object} json
 */
jsoneditor.JSONFormatter.prototype.set = function(json) {
    this.textarea.value = JSON.stringify(json, null, this.indentation);
};

/**
 * Get json data from the formatter
 * @return {Object} json
 */
jsoneditor.JSONFormatter.prototype.get = function() {
    return jsoneditor.util.parse(this.textarea.value);
};

/**
 * Get the text contents of the JSONFormatter
 * @return {String} text
 */
jsoneditor.JSONFormatter.prototype.getText = function() {
    return this.textarea.value;
};

/**
 * Set the text contents of the JSONFormatter
 * @param {String} text
 */
jsoneditor.JSONFormatter.prototype.setText = function(text) {
    this.textarea.value = text;
};
