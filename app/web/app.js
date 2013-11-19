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
 * @date    2013-04-30
 */


var treeEditor = null;
var codeEditor = null;

var app = {};

/**
 * Get the JSON from the code editor and load it in the tree editor
 */
app.CodeToTree = function() {
  try {
    treeEditor.set(codeEditor.get());
  }
  catch (err) {
    app.notify.showError(app.formatError(err));
  }
};

/**
 * Get the JSON from the tree editor and load it into the code editor
 */
app.treeToCode = function () {
  try {
    codeEditor.set(treeEditor.get());
  }
  catch (err) {
    app.notify.showError(app.formatError(err));
  }
};

/**
 * Load the interface (tree editor, code editor, splitter)
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

    // Store whether tree editor or code editor is last changed
    app.lastChanged = undefined;

    // code editor
    var container = document.getElementById("codeEditor");
    codeEditor = new jsoneditor.JSONEditor(container, {
      mode: 'code',
      change: function () {
        app.lastChanged = codeEditor;
      },
      error: function (err) {
        app.notify.showError(app.formatError(err));
      }
    });
    codeEditor.set(json);

    // tree editor
    container = document.getElementById("treeEditor");
    treeEditor = new jsoneditor.JSONEditor(container, {
      mode: 'tree',
      change: function () {
        app.lastChanged = treeEditor;
      },
      error: function (err) {
        app.notify.showError(app.formatError(err));
      }
    });
    treeEditor.set(json);
    // TODO: automatically synchronize data of code and tree editor? (tree editor should keep its state though)

    // splitter
    app.splitter = new Splitter({
      container: document.getElementById('drag'),
      change: function () {
        app.resize();
      }
    });

    // button Code-to-Tree
    var toTree = document.getElementById('toTree');
    toTree.onclick = function () {
      this.focus();
      app.CodeToTree();
    };

    // button Tree-to-Code
    var toCode = document.getElementById('toCode');
    toCode.onclick = function () {
      this.focus();
      app.treeToCode();
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
      event.stopPropagation();
      event.preventDefault();
    };

    // menu button open url
    var domMenuOpenUrl = document.getElementById('menuOpenUrl');
    domMenuOpenUrl.onclick = function (event) {
      app.openUrl();
      event.stopPropagation();
      event.preventDefault();
    };

    // save button
    var domSave = document.getElementById('save');
    domSave.onclick = app.saveFile;

    // set focus on the code editor
    codeEditor.focus();

    // enforce FireFox to not do spell checking on any input field
    document.body.spellcheck = false;
  } catch (err) {
    try {
      app.notify.showError(err);
    }
    catch (e) {
      if (console && console.log) {
        console.log(err);
      }
      alert(err);
    }
  }
};

/**
 * Callback method called when a file or url is opened.
 * @param {Error} err
 * @param {String} data
 */
app.openCallback = function (err, data) {
  if (!err) {
    if (data != null) {
      codeEditor.setText(data);
      try {
        var json = jsoneditor.util.parse(data);
        treeEditor.set(json);
      }
      catch (err) {
        treeEditor.set({});
        app.notify.showError(app.formatError(err));
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
  // first synchronize both editors contents
  if (app.lastChanged == treeEditor) {
    app.treeToCode();
  }
  /* TODO: also sync from code to tree editor? will clear the history ...
   if (app.lastChanged == codeEditor) {
   app.CodeToEditor();
   }
   */
  app.lastChanged = undefined;

  // save the text from the code editor
  // TODO: show a 'saving...' notification
  var data = codeEditor.getText();
  app.retriever.saveFile(data, function (err) {
    if (err) {
      app.notify.showError(err);
    }
  });
};

/**
 * Format a JSON parse/stringify error as HTML
 * @param {Error} err
 * @returns {string}
 */
app.formatError = function (err) {
  var message = '<pre class="error">' + err.toString() + '</pre>';
  if (typeof(jsonlint) != 'undefined') {
    message +=
        '<a class="error" href="http://zaach.github.com/jsonlint/" target="_blank">' +
            'validated by jsonlint' +
            '</a>';
  }
  return message;
};

/**
 * Clear the current file
 */
app.clearFile = function () {
  var json = {};
  codeEditor.set(json);
  treeEditor.set(json);
};

app.resize = function() {
  var domMenu = document.getElementById('menu');
  var domTreeEditor = document.getElementById('treeEditor');
  var domCodeEditor = document.getElementById('codeEditor');
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
    var showCodeEditor = (value > 0);
    var showTreeEditor = (value < 1);
    var showButtons = showCodeEditor && showTreeEditor;
    domSplitterButtons.style.display = showButtons ? '' : 'none';

    var splitterWidth = domSplitter.clientWidth;
    var splitterLeft;
    if (!showCodeEditor) {
      // code editor not visible
      splitterLeft = 0;
      domSplitterDrag.innerHTML = '&rsaquo;';
      domSplitterDrag.title = 'Drag right to show the code editor';
    }
    else if (!showTreeEditor) {
      // tree editor not visible
      splitterLeft = width * value - splitterWidth;
      domSplitterDrag.innerHTML = '&lsaquo;';
      domSplitterDrag.title = 'Drag left to show the tree editor';
    }
    else {
      // both tree and code editor visible
      splitterLeft = width * value - splitterWidth / 2;

      // TODO: find a character with vertical dots that works on IE8 too, or use an image
      var isIE8 = (jsoneditor.util.getInternetExplorerVersion() == 8);
      domSplitterDrag.innerHTML = (!isIE8) ? '&#8942;' : '|';
      domSplitterDrag.title = 'Drag left or right to change the width of the panels';
    }

    // resize code editor
    domCodeEditor.style.display = (value == 0) ? 'none' : '';
    domCodeEditor.style.width = Math.max(Math.round(splitterLeft), 0) + 'px';
    codeEditor.resize();

    // resize the splitter
    domSplitterDrag.style.height = (domSplitter.clientHeight -
        domSplitterButtons.clientHeight - 2 * margin -
        (showButtons ? margin : 0)) + 'px';
    domSplitterDrag.style.lineHeight = domSplitterDrag.style.height;

    // resize tree editor
    // the width has a -1 to prevent the width from being just half a pixel
    // wider than the window, causing the content elements to wrap...
    domTreeEditor.style.display = (value == 1) ? 'none' : '';
    domTreeEditor.style.left = Math.round(splitterLeft + splitterWidth) + 'px';
    domTreeEditor.style.width = Math.max(Math.round(width - splitterLeft - splitterWidth - 2), 0) + 'px';
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
