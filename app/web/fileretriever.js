/**
 * @file fileretriever.js
 *
 * FileRetriever manages client side loading and saving of files.
 * It requires a server script (fileretriever.php). Loading and saving
 * files is done purely clientside using HTML5 techniques when supported
 * by the browser.
 *
 * Requires ajax.js.
 *
 * Supported browsers: Chrome, Firefox, Opera, Safari,
 * Internet Explorer 8+.
 *
 * Example usage:
 *     var retriever = new FileRetriever({
 *        'serverUrl': 'fileretriever.php'
 *     });
 *     retriever.loadFile(function (err, data) {
 *         console.log('file loaded:', data);
 *     });
 *     retriever.loadUrl(function (err, data) {
 *         console.log('url loaded:', data);
 *     });
 *     retriever.saveFile("some text");
 *
 * @constructor FileRetriever
 * @param {String} options Available options:
 *                         {string} serverUrl Server side script for
 *                                            handling files, for
 *                                            example "fileretriever.php"
 *                         {Number} [maxSize] Maximum allowed file size
 *                                            in bytes. (this should
 *                                            be the same as maximum
 *                                            size allowed by the server
 *                                            side script). Default is
 *                                            1024 * 1024 bytes.
 *                         {Number} [timeout] Timeout in milliseconds.
 *                                            30000 ms by default.
 *                         {Boolean} [html5]  Use HTML5 solutions
 *                                            to load/save files when
 *                                            supported by the browser.
 *                                            True by default.
 *                         {Notify} [notify]  A handler for notifications
 *                                            If provided, messages like
 *                                            "loading" and "saving" are created.
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
 * Copyright (c) 2013 Jos de Jong, http://jsoneditoronline.org
 *
 * @author  Jos de Jong, <wjosdejong@gmail.com>
 * @date    2013-01-01
 */
var FileRetriever = function (options) {
  // set options and variables
  options = options || {};
  this.options = {
    maxSize: ((options.maxSize != undefined) ? options.maxSize : 1024 * 1024),
    html5: ((options.html5 != undefined) ? options.html5 : true)
  };
  this.timeout = Number(options.timeout) || 30000;
  this.headers = {'Accept': 'application/json'};   // headers for ajax requests
  this.scriptUrl = options.scriptUrl || 'fileretriever.php';
  this.notify = options.notify || undefined;
  this.defaultFilename = 'document.json';
  this.dom = {};
};

/**
 * make an HTML DOM element invisible
 * @param {Element} elem
 * @private
 */
FileRetriever.prototype._hide = function (elem) {
  elem.style.visibility = 'hidden';
  elem.style.position = 'absolute';
  elem.style.left = '-1000px';
  elem.style.top = '-1000px';
  elem.style.width = '0';
  elem.style.height = '0';
};

/**
 * Delete all HTML DOM elements created by the FileRetriever.
 * The FileRetriever cannot be used after its DOM elements are deleted.
 */
FileRetriever.prototype.remove = function () {
  var dom = this.dom;
  for (var prop in dom) {
    if (dom.hasOwnProperty(prop)) {
      var elem = dom[prop];
      if (elem.parentNode) {
        elem.parentNode.removeChild(elem);
      }
    }
  }
  this.dom = {};
};

/**
 * get a filename from a path or url.
 * For example "http://site.com/files/example.json" will return "example.json"
 * @param {String} path       A filename, path, or url
 * @return {String} filename
 * @private
 */
FileRetriever.prototype._getFilename = function (path) {
  // http://stackoverflow.com/a/423385/1262753
  return path ? path.replace(/^.*[\\\/]/, '') : '';
};

/**
 * Set the last url
 * @param {String} url
 */
FileRetriever.prototype.setUrl = function (url) {
  this.url = url;
};

/**
 * Get last filename
 * @return {String} filename
 */
FileRetriever.prototype.getFilename = function () {
  return this.defaultFilename;
};

/**
 * Get the last url
 * @return {String | undefined} url
 */
FileRetriever.prototype.getUrl = function () {
  return this.url;
};

/**
 * Load a url
 * @param {String} url          The url to be retrieved
 * @param {function} callback   Callback method, called with parameters:
 *                                  {Error} error
 *                                  {string} data
 */
FileRetriever.prototype.loadUrl = function (url, callback) {
  // set current filename (will be used when saving a file again)
  this.setUrl(url);

  // loading notification
  var loading = undefined;
  if (this.notify) {
    loading = this.notify.showNotification('loading url...');
  }

  // method to ensure the callback is only executed once
  var me = this;
  var callbackOnce = function (error, data) {
    if (callback) {
      callback(error, data);
      callback = undefined;
    }
    if (me.notify && loading) {
      me.notify.removeMessage(loading);
      loading = undefined;
    }
  };

  // try to fetch to the url directly (may result in a cross-domain error)
  var scriptUrl = this.scriptUrl;
  ajax.get(url, me.headers, function(data, status) {
    if (status == 200) {
      // success. great. no cross-domain error
      callbackOnce(null, data);
    }
    else {
      // cross-domain error (or other). retrieve the url via the server
      var indirectUrl = scriptUrl + '?url=' + encodeURIComponent(url);
      var err;
      ajax.get(indirectUrl, me.headers, function(data, status) {
        if (status == 200) {
          callbackOnce(null, data);
        }
        else if (status == 404) {
          console.log('Error: url "' + url + '" not found', status, data);
          err = new Error('Error: url "' + url + '" not found');
          callbackOnce(err, null);
        }
        else {
          console.log('Error: failed to load url "' + url + '"', status, data);
          err = new Error('Error: failed to load url "' + url + '"');
          callbackOnce(err, null);
        }
      });
    }
  });

  // safety mechanism: callback after a timeout
  setTimeout(function () {
    callbackOnce(new Error('Error loading url (time out)'));
  }, this.timeout);
};

/**
 * Load a file from disk.
 * A file explorer will be opened to select a file and press ok.
 * In case of Internet Explorer, an upload form will be shown where the
 * user has to select a file via a file explorer after that click load.
 * @param {function} [callback]   Callback method, called with parameters:
 *                                    {Error} error
 *                                    {string} data
 */
FileRetriever.prototype.loadFile = function (callback) {
  // loading notification
  var loading = undefined;
  var me = this;

  var startLoading = function () {
    if (me.notify && !loading) {
      loading = me.notify.showNotification('loading file...');
    }

    // safety mechanism: callback after a timeout
    setTimeout(function () {
      callbackOnce(new Error('Error loading url (time out)'));
    }, me.timeout);
  };

  // method to ensure the callback is only executed once
  var callbackOnce = function (error, data) {
    if (callback) {
      callback(error, data);
      callback = undefined;
    }
    if (me.notify && loading) {
      me.notify.removeMessage(loading);
      loading = undefined;
    }
  };

  // create a form to select a file and submit
  var useFileReader = (me.options.html5 && window.File && window.FileReader);

  if (useFileReader) {
    this.prompt({
      title: 'Open file',
      titleSubmit: 'Open',
      description: 'Select a file on your computer.',
      inputType: 'file',
      inputName: 'file',
      callback: function (value, field) {
        if (value) {
          if (useFileReader) {
            // load file via HTML5 FileReader (no size limits)
            var file = field.files[0];
            var reader = new FileReader();
            reader.onload = function(event) {
              var data = event.target.result;
              callbackOnce(null, data);
            };

            // Read in the image file as a data URL.
            reader.readAsText(file);
          }

          startLoading();
        }
      }
    });
    // TODO: handle a cancel
  }
  else {
    // no html5 filereader available

    // create an iframe for uploading files
    // the iframe must have an unique name, allowing multiple
    // FileRetrievers. The name is needed as target for the uploadForm
    var iframeName = 'fileretriever-upload-' + Math.round(Math.random() * 1E15);
    var iframe = document.createElement('iframe');
    iframe.name = iframeName;
    me._hide(iframe);
    iframe.onload = function () {
      // when a downloaded file is retrieved, send a callback with
      // the retrieved data
      var id = iframe.contentWindow.document.body.innerHTML;
      if (id) {
        var url = me.scriptUrl + '?id=' + id + '&filename=' + me.getFilename();
        ajax.get(url, me.headers, function (data, status) {
          if (status == 200) {
            callbackOnce(null, data);
          }
          else {
            var err = new Error('Error loading file ' + me.getFilename());
            callbackOnce(err, null);
          }

          // cleanup the frame again
          if (iframe.parentNode === document.body) {
            document.body.removeChild(iframe);
          }
        });
      }
    };
    document.body.appendChild(iframe);

    this.prompt({
      title: 'Open file',
      titleSubmit: 'Open',
      description: 'Select a file on your computer.',
      inputType: 'file',
      inputName: 'file',
      formAction: this.scriptUrl,
      formMethod: 'POST',
      formTarget: iframeName,
      callback: function (value) {
        if (value) {
          startLoading();
        }
      }
    });
    // TODO: handle a cancel
  }
};

/**
 * Show a dialog to select and load an url.
 * @param {function} callback       Callback method, called with parameters:
 *                                  {Error} error
 *                                  {String} data
 */
FileRetriever.prototype.loadUrlDialog = function (callback) {
  var me = this;
  this.prompt({
    title: 'Open url',
    titleSubmit: 'Open',
    description: 'Enter a public url. ' +
        'Urls which need authentication or are located on an intranet cannot be loaded.',
    inputType: 'text',
    inputName: 'url',
    inputDefault: this.getUrl(),
    callback: function (url) {
      if (url) {
        me.loadUrl(url, callback);
      }
      else {
        // cancel
        callback();
      }
    }
  });
};

/**
 * Show a prompt.
 * The propmt can either:
 * - Post a form when formAction, and formMethod are provided.
 *   Will call callback on submit.
 * - Call the callback method "callback" with the entered value as first parameter and the created DOM field as second.
 *   This happens when a callback parameter is provided.
 * @param {Object} params   Available parameters:
 *                          {String} title
 *                          {String} titleSubmit
 *                          {String} titleCancel
 *                          {String} description
 *                          {String} inputType
 *                          {String} inputName
 *                          {String} inputDefault
 *                          {String} formTarget
 *                          {String} formAction
 *                          {String} formMethod
 *                          {function} callback
 */
FileRetriever.prototype.prompt = function (params) {
  var removeDialog = function () {
    // remove the form
    if (background.parentNode) {
      background.parentNode.removeChild(background);
    }
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }

    jsoneditor.util.removeEventListener(document, 'keydown', onKeyDown);
  };

  var onCancel = function () {
    removeDialog();
    if(params.callback) {
      params.callback(null);
    }
  };

  var onKeyDown = jsoneditor.util.addEventListener(document, 'keydown', function (event) {
    var keynum = event.which;
    if (keynum == 27) { // ESC
      onCancel();
      event.preventDefault();
      event.stopPropagation();
    }
  });

  var overlay = document.createElement('div');
  overlay.className = 'fileretriever-overlay';
  document.body.appendChild(overlay);

  var form = document.createElement('form');
  form.className = 'fileretriever-form';
  form.target = params.formTarget || '';
  form.action = params.formAction || '';
  form.method = params.formMethod || 'POST';
  form.enctype = 'multipart/form-data';
  form.encoding = 'multipart/form-data'; // needed for IE8 and older
  form.onsubmit = function () {
    if (field.value) {
      setTimeout(function () {
        // remove *after* the submit has taken place!
        removeDialog();
      }, 0);
      if (params.callback) {
        params.callback(field.value, field);
      }
      return (params.formAction != undefined && params.formMethod != undefined);
    }
    else {
      alert('Enter a ' + params.inputName + ' first...');
      return false;
    }
  };

  var title = document.createElement('div');
  title.className = 'fileretriever-title';
  title.appendChild(document.createTextNode(params.title || 'Dialog'));
  form.appendChild(title);

  if (params.description) {
    var description = document.createElement('div');
    description.className = 'fileretriever-description';
    description.appendChild(document.createTextNode(params.description));
    form.appendChild(description);
  }

  var field = document.createElement('input');
  field.className = 'fileretriever-field';
  field.type = params.inputType || 'text';
  field.name = params.inputName || 'text';
  field.value = params.inputDefault || '';

  var contents = document.createElement('div');
  contents.className = 'fileretriever-contents';
  contents.appendChild(field);
  form.appendChild(contents);

  var cancel = document.createElement('input');
  cancel.className = 'fileretriever-cancel';
  cancel.type = 'button';
  cancel.value = params.titleCancel || 'Cancel';
  cancel.onclick = onCancel;

  var submit = document.createElement('input');
  submit.className = 'fileretriever-submit';
  submit.type = 'submit';
  submit.value = params.titleSubmit || 'Ok';

  var buttons = document.createElement('div');
  buttons.className = 'fileretriever-buttons';
  buttons.appendChild(cancel);
  buttons.appendChild(submit);
  form.appendChild(buttons);

  var border = document.createElement('div');
  border.className = 'fileretriever-border';
  border.appendChild(form);

  var background = document.createElement('div');
  background.className = 'fileretriever-background';
  background.appendChild(border);
  background.onclick = function (event) {
    var target = event.target;
    if (target == background) {
      onCancel();
    }
  };
  document.body.appendChild(background);

  field.focus();
  field.select();
};

/**
 * Save data to disk
 * @param {String} data
 * @param {function} [callback]  Callback when the file is saved, called
 *                               with parameter:
 *                                  {Error} error
 */
FileRetriever.prototype.saveFile = function (data, callback) {
  // saving notification
  var saving = undefined;
  if (this.notify) {
    saving = this.notify.showNotification('saving file...');
  }

  // method to ensure the callback is only executed once
  var me = this;
  var callbackOnce = function (error) {
    if (callback) {
      callback(error);
      callback = undefined;
    }
    if (me.notify && saving) {
      me.notify.removeMessage(saving);
      saving = undefined;
    }
  };

  // create an anchor to save files to disk (if supported by the browser)
  // Note: save file using a.download is disabled in Firefox because of a
  //       a bug in Firefox, which breaks the cut/paste functionality of
  //       editable divs on the page.
  var a = document.createElement('a');
  if (this.options.html5 && a.download != undefined && !util.isFirefox()) {
    // save file directly using a data URL
    a.style.display = 'none';
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(data);
    a.download = this.getFilename();

    // attach the element to the DOM, invoke a click action, and remove it again
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    callbackOnce();
  }
  else {
    // save file by uploading it to the server and then downloading
    // it via an iframe
    if (data.length < this.options.maxSize) {
      ajax.post(me.scriptUrl, data, me.headers, function(id, status) {
        if (status == 200) {
          var iframe = document.createElement('iframe');
          iframe.src = me.scriptUrl + '?id=' + id  + '&filename=' + me.getFilename();
          me._hide(iframe);
          document.body.appendChild(iframe);
          /* TODO: send callback after the iframe is loaded. Problem: iframe.onload does not work on IE
           iframe.onload = function () {
           callbackOnce();
           };
           //*/
          callbackOnce();
          // TODO: cleanup the iframe after the file is saved. Problem: we cannot know when the save dialog is closed.
        }
        else {
          callbackOnce(new Error('Error saving file'));
        }
      });
    }
    else {
      callbackOnce(new Error('Maximum allowed file size exceeded (' +
          this.options.maxSize + ' bytes)'));
    }
  }

  // safety mechanism: callback after a timeout
  setTimeout(function () {
    callbackOnce(new Error('Error saving file (time out)'));
  }, this.timeout);
};
