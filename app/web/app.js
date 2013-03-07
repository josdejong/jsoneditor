/*!
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
 * Copyright (C) 2011-2013 Jos de Jong, http://jsoneditoronline.org
 *
 * @author  Jos de Jong, <wjosdejong@gmail.com>
 * @date    2013-02-26
 */


var editor = null;
var formatter = null;

var app = {};

/**
 * Get the JSON from the formatter and load it in the editor
 */
app.JSONToEditor = function() {
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
app.editorToJSON = function () {
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
            "array": [1, 2, 3],
            "boolean": true,
            "null": null,
            "number": 123,
            "object": {"a": "b", "c": "d", "e": "f"},
            "string": "Hello World"
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
        formatter = new jsoneditor.JSONFormatter(container, {
            mode: 'code',
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
        editor = new jsoneditor.JSONEditor(container, {
            change: function () {
                app.lastChanged = editor;
            }
        });
        editor.set(json);
        // TODO: automatically synchronize data of formatter and editor? (editor should keep its state though)

        // splitter
        app.splitter = new Splitter({
            container: document.getElementById('drag'),
            change: function () {
                app.resize();
            }
        });

        // button JSON-to-Editor
        var toEditor = document.getElementById('toEditor');
        toEditor.onclick = function () {
            this.focus();
            app.JSONToEditor();
        };

        // button Editor-to-Editor
        var toJSON = document.getElementById('toJSON');
        toJSON.onclick = function () {
            this.focus();
            app.editorToJSON();
        };

        // web page resize handler
        jsoneditor.util.addEventListener(window, 'resize', app.resize);

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
            jsoneditor.util.stopPropagation(event);
            jsoneditor.util.preventDefault(event);
        };

        // menu button open url
        var domMenuOpenUrl = document.getElementById('menuOpenUrl');
        domMenuOpenUrl.onclick = function (event) {
            app.openUrl();
            jsoneditor.util.stopPropagation(event);
            jsoneditor.util.preventDefault(event);
        };

        // save button
        var domSave = document.getElementById('save');
        domSave.onclick = app.saveFile;

        // set focus on the formatter
        formatter.focus();

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
                var json = jsoneditor.util.parse(data);
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
        app.editorToJSON();
    }
    /* TODO: also sync from formatter to editor? will clear the history ...
    if (app.lastChanged == formatter) {
        app.JSONToEditor();
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
};

app.resize = function() {
    var domMenu = document.getElementById('menu');
    var domEditor = document.getElementById('jsoneditor');
    var domFormatter = document.getElementById('jsonformatter');
    var domSplitter = document.getElementById('splitter');
    var domSplitterButtons = document.getElementById('buttons');
    var domSplitterDrag = document.getElementById('drag');
    var domAd = document.getElementById('ad');

    var margin = 15;
    var width = (window.innerWidth || document.body.offsetWidth ||
        document.documentElement.offsetWidth);
    var adWidth = domAd ? domAd.clientWidth : 0;
    if (adWidth) {
        width -= (adWidth + margin);
    }

    if (app.splitter) {
        app.splitter.setWidth(width);

        // calculate horizontal splitter position
        var value = app.splitter.getValue();
        var showFormatter = (value > 0);
        var showEditor = (value < 1);
        var showButtons = showFormatter && showEditor;
        domSplitterButtons.style.display = showButtons ? '' : 'none';

        var splitterWidth = domSplitter.clientWidth;
        var splitterLeft;
        if (!showFormatter) {
            // formatter not visible
            splitterLeft = 0;
            domSplitterDrag.innerHTML = '&rsaquo;';
            domSplitterDrag.title = 'Drag right to show the code editor';
        }
        else if (!showEditor) {
            // editor not visible
            splitterLeft = width * value - splitterWidth;
            domSplitterDrag.innerHTML = '&lsaquo;';
            domSplitterDrag.title = 'Drag left to show the tree editor';
        }
        else {
            // both editor and formatter visible
            splitterLeft = width * value - splitterWidth / 2;
            domSplitterDrag.innerHTML = '&#8942;';
            domSplitterDrag.title = 'Drag left or right to change the width of the panels';
        }

        // resize formatter
        domFormatter.style.display = (value == 0) ? 'none' : '';
        domFormatter.style.width = Math.max(Math.round(splitterLeft), 0) + 'px';
        formatter.resize();

        // resize the splitter
        domSplitterDrag.style.height = (domSplitter.clientHeight -
            domSplitterButtons.clientHeight - 2 * margin -
            (showButtons ? margin : 0)) + 'px';
        domSplitterDrag.style.lineHeight = domSplitterDrag.style.height;

        // resize editor
        // the width has a -1 to prevent the width from being just half a pixel
        // wider than the window, causing the content elements to wrap...
        domEditor.style.display = (value == 1) ? 'none' : '';
        domEditor.style.left = Math.round(splitterLeft + splitterWidth) + 'px';
        domEditor.style.width = Math.max(Math.round(width - splitterLeft - splitterWidth - 2), 0) + 'px';
    }

    // align main menu with ads
    if (domMenu) {
        if (adWidth) {
            domMenu.style.right = (margin + (adWidth + margin)) + 'px';
        }
        else {
            domMenu.style.right = margin + 'px';
        }
    }
};
