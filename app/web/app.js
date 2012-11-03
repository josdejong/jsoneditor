/**
 * @file app.js
 *
 * @brief
 * JSONEditor is an editor to display and edit JSON data in a treeview.
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
 * Copyright (C) 2011-2012 Jos de Jong, http://jsoneditoronline.org
 *
 * @author  Jos de Jong, <wjosdejong@gmail.com>
 * @date    2012-11-03
 */


var editor = null;
var formatter = null;

var app = {};

/**
 * Get the JSON from the formatter and load it in the editor
 */
app.formatterToEditor = function() {
    try {
        editor.set(formatter.get());
    }
    catch (err) {
         app.notify.showError(err);
    }
};

/**
 * Get the JSON from the editor and load it into the formatter
 */
app.editorToFormatter = function () {
    try {
        formatter.set(editor.get());
    }
    catch (err) {
        app.notify.showError(err);
    }
};

/**
 * Load the interface (editor, formatter, splitter)
 */
// TODO: split the method load in multiple methods, it is too large
app.load = function() {
    try {
        // notification handler
        app.notify = new Notify();

        // retriever for loading/saving files
        app.retriever = new FileRetriever({
            scriptUrl: 'fileretriever.php',
            notify: app.notify
        });

        // default json document
        var json = {
            "name": "John Smith",
            "age": 32,
            "employed": true,
            "address": {
                "street": "701 First Ave.",
                "city": "Sunnyvale, CA 95125",
                "country": "United States"
            },
            "children": [
                {
                    "name": "Richard",
                    "age": 7
                },
                {
                    "name": "Susan",
                    "age": 4
                },
                {
                    "name": "James",
                    "age": 3
                }
            ]
        };

        // load url if query parameters contains a url
        if (window.QueryParams) {
            var qp = new QueryParams();
            var url = qp.getValue('url');
            if (url) {
                json = {};
                app.openUrl(url);
            }
        }

        // Store whether editor or formatter is last changed
        app.lastChanged = undefined;

        // formatter
        var container = document.getElementById("jsonformatter");
        formatter = new JSONFormatter(container, {
            change: function () {
                app.lastChanged = formatter;
            }
        });
        formatter.set(json);
        formatter.onError = function (err) {
            app.notify.showError(err);
        };

        // editor
        container = document.getElementById("jsoneditor");
        editor = new JSONEditor(container, {
            change: function () {
                app.lastChanged = editor;
            }
        });
        editor.set(json);
        // TODO: automatically synchronize data of formatter and editor? (editor should keep its state though)

        // splitter
        var domSplitter = document.getElementById('splitter');
        app.splitter = new Splitter({
            container: domSplitter,
            change: function () {
                app.resize();
            }
        });

        // button Formatter-to-Editor
        domSplitter.appendChild(document.createElement('br'));
        domSplitter.appendChild(document.createElement('br'));
        domSplitter.appendChild(document.createElement('br'));
        var toForm = document.createElement('button');
        toForm.id = 'toForm';
        toForm.title = 'JSON to Editor';
        toForm.className = 'convert';
        toForm.innerHTML = '<div class="convert-right"></div>';
        toForm.onclick = function () {
            this.focus();
            app.formatterToEditor();
        };
        domSplitter.appendChild(toForm);

        // button Editor-to-Formatter
        domSplitter.appendChild(document.createElement('br'));
        domSplitter.appendChild(document.createElement('br'));
        var toJSON = document.createElement('button');
        toJSON.id = 'toJSON';
        toJSON.title = 'Editor to JSON';
        toJSON.className = 'convert';
        toJSON.innerHTML = '<div class="convert-left"></div>';
        toJSON.onclick = function () {
            this.focus();
            app.editorToFormatter();
        };
        domSplitter.appendChild(toJSON);

        // web page resize handler
        JSONEditor.Events.addEventListener(window, 'resize', app.resize);

        // clear button
        var domClear = document.getElementById('clear');
        domClear.onclick = app.clearFile;

        /* TODO: enable clicking on open to execute the default, "open file"
        // open button
        var domOpen = document.getElementById('open');
        var domOpenMenuButton = document.getElementById('openMenuButton');
        domOpen.onclick = function (event) {
            event = event || window.event; // for IE8
            var target = event.target || event.srcElement;
            if (target == domOpenMenuButton ||
                    (event.offsetX > domOpen.offsetWidth - domOpenMenuButton.offsetWidth)) {
                // clicked on the menu button
            }
            else {
                app.openFile();
            }
        };
        */

        // menu button open file
        var domMenuOpenFile = document.getElementById('menuOpenFile');
        domMenuOpenFile.onclick = function (event) {
            app.openFile();
            JSONEditor.Events.stopPropagation(event);
            JSONEditor.Events.preventDefault(event);
        };

        // menu button open url
        var domMenuOpenUrl = document.getElementById('menuOpenUrl');
        domMenuOpenUrl.onclick = function (event) {
            app.openUrl();
            JSONEditor.Events.stopPropagation(event);
            JSONEditor.Events.preventDefault(event);
        };

        // save button
        var domSave = document.getElementById('save');
        domSave.onclick = app.saveFile;

        // TODO: implement a focus method
        formatter.textarea.focus();

        // enforce FireFox to not do spell checking on any input field
        document.body.spellcheck = false;
    } catch (err) {
        app.notify.showError(err);
    }
};

/**
 * Callback method called when a file or url is opened.
 * @param {Error} err
 * @param {String} data
 */
app.openCallback = function (err, data) {
    if (!err) {
        if (data != undefined) {
            formatter.setText(data);
            try {
                var json = JSONEditor.parse(data);
                editor.set(json);
            }
            catch (err) {
                editor.set({});
                app.notify.showError(err);
            }
        }
    }
    else {
        app.notify.showError(err);
    }
};

/**
 * Open a file explorer to select a file and open the file
 */
app.openFile = function() {
    app.retriever.loadFile(app.openCallback);
};

/**
 * Open a url. If no url is provided as parameter, a dialog will be opened
 * to select a url.
 * @param {String} [url]
 */
app.openUrl = function (url) {
    if (!url) {
        app.retriever.loadUrlDialog(app.openCallback);
    }
    else {
        app.retriever.loadUrl(url, app.openCallback);
    }
};

/**
 * Open a file explorer to save the file.
 */
app.saveFile = function () {
    // first synchronize the editors and formatters contents
    if (app.lastChanged == editor) {
        app.editorToFormatter();
    }
    /* TODO: also sync from formatter to editor? will clear the history ...
    if (app.lastChanged == formatter) {
        app.formatterToEditor();
    }
    */
    app.lastChanged = undefined;

    // save the text from the formatter
    // TODO: show a 'saving...' notification
    var data = formatter.getText();
    app.retriever.saveFile(data, function (err) {
        if (err) {
            app.notify.showError(err);
        }
    });
};

/**
 * Clear the current file
 */
app.clearFile = function () {
    var json = {};
    formatter.set(json);
    editor.set(json);
    app.retriever.removeUrl();
};

app.resize = function() {
    var domEditor = document.getElementById('jsoneditor');
    var domFormatter = document.getElementById('jsonformatter');
    var domSplitter = document.getElementById('splitter');
    var domAd = document.getElementById('ad');
    var domAdInfo = document.getElementById('adInfo');

    var width = window.innerWidth || document.body.offsetWidth || document.documentElement.offsetWidth;
    var height = window.innerHeight || document.body.offsetHeight || document.documentElement.offsetHeight;
    var adWidth = domAd ? domAd.clientWidth : 0;
    var splitterWidth = domSplitter.clientWidth;
    if (adWidth) {
        width -= (adWidth + 15); // Not so nice, +15 here for the margin
    }

    var splitterLeft = width * app.splitter.getValue();

    // resize formatter
    domFormatter.style.width = Math.round(splitterLeft) + 'px';

    // resize editor
    // the width has a -1 to prevent the width from being just half a pixel
    // wider than the window, causing the content elements to wrap...
    domEditor.style.left = Math.round(splitterLeft + splitterWidth) + 'px';
    domEditor.style.width = Math.round(width - splitterLeft - splitterWidth - 1) + 'px';

    // resize ad text
    if (domAdInfo && domAd) {
        var infoHeight = domAdInfo.clientHeight;
        domAd.style.paddingTop = infoHeight + 'px';
    }
};

/**
 * Hide the advertisement
 */
app.hideAds = function() {
    var domAd = document.getElementById("ad");
    if (domAd) {
        domAd.parentNode.removeChild(domAd);
        app.resize();
    }
};
