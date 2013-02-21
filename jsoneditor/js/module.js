/*!
 * @file jsoneditor.js
 *
 * @brief
 * JSONEditor is a web-based tool to view, edit, and format JSON.
 * It shows data a clear, editable treeview.
 *
 * Supported browsers: Chrome, Firefox, Safari, Opera, Internet Explorer 8+
 *
 * @license
 * This json editor is open sourced with the intention to use the editor as
 * a component in your own application. Not to just copy and monetize the editor
 * as it is.
 *
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
 * @date    2013-02-21
 */

(function () {
// module

/***code_placeholder***/

// module exports
var jsoneditorExports = {
    'JSONEditor': jsoneditor.JSONEditor,
    'JSONFormatter': jsoneditor.JSONFormatter,
    'util': jsoneditor.util
};

/**
 * load jsoneditor.css
 */
var loadCss = function () {
    // get the script location, and built the css file name from the js file name
    // http://stackoverflow.com/a/2161748/1262753
    var scripts = document.getElementsByTagName('script');
    var jsFile = scripts[scripts.length-1].src.split('?')[0];
    var cssFile = jsFile.substring(0, jsFile.length - 2) + 'css';

    // load css
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = cssFile;
    document.getElementsByTagName('head')[0].appendChild(link);
};

/**
 * CommonJS module exports
 */
if (typeof(module) != 'undefined' && typeof(exports) != 'undefined') {
    loadCss();
    module.exports = exports = jsoneditorExports;
}

/**
 * AMD module exports
 */
if (typeof(require) != 'undefined' && typeof(define) != 'undefined') {
    define(function () {
        loadCss();
        return jsoneditorExports;
    });
}
else {
    // create attach the module to window, load as a regular javascript file
    window['jsoneditor'] = jsoneditorExports;
}

})();