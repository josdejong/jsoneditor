/**
 * Utility to display notifications and error messages.
 * The messages are displayed on the top center of the web page
 * @constructor Notify
 */
function Notify () {
  this.dom = {};

  // TODO: attach the event as soon as there are one or multiple messages displayed,
  //       remove it as soon as they are all gone
  var me = this;
  jsoneditor.util.addEventListener(document, 'keydown', function (event) {
    me.onKeyDown(event);
  });
}

/**
 * Show a notification
 * @param {String} message
 * @return {Element} messageObject
 */
Notify.prototype.showNotification = function (message) {
  return this.showMessage({
    type: 'notification',
    message: message,
    closeButton: false
  });
};

/**
 * Show an error message
 * @param {Error} error
 * @return {Element} messageObject
 */
Notify.prototype.showError = function (error) {
  return this.showMessage({
    type: 'error',
    message: (error.message ? 'Error: ' + error.message : error.toString()),
    closeButton: true
  });
};

/**
 * Show a message
 * @param {Object} params    Available parameters:
 *                           {String} message
 *                           {String} type 'error', 'notification'
 *                           {Boolean} closeButton
 * @return {Element} messageObject
 */
Notify.prototype.showMessage = function (params) {
  var frame = this.dom.frame;
  if (!frame) {
    var width = 500;
    var top = 5;
    var windowWidth = document.body.offsetWidth ||  window.innerWidth;
    frame = document.createElement('div');
    frame.style.position = 'absolute';
    frame.style.left = (windowWidth - width) / 2 + 'px';
    frame.style.width = width + 'px';
    frame.style.top = top + 'px';
    frame.style.zIndex = '999';
    document.body.appendChild(frame);
    this.dom.frame = frame;
  }

  var type = params.type || 'notification';
  var closeable = (params.closeButton !== false);
  var divMessage = document.createElement('div');
  divMessage.className = type;
  divMessage.type = type;
  divMessage.closeable = closeable;
  divMessage.style.position = 'relative';
  frame.appendChild(divMessage);

  var table = document.createElement('table');
  table.style.width = '100%';
  divMessage.appendChild(table);
  var tbody = document.createElement('tbody');
  table.appendChild(tbody);
  var tr = document.createElement('tr');
  tbody.appendChild(tr);

  var tdMessage = document.createElement('td');
  tdMessage.innerHTML = params.message || '';
  tr.appendChild(tdMessage);

  if (closeable) {
    var tdClose = document.createElement('td');
    tdClose.style.textAlign = 'right';
    tdClose.style.verticalAlign = 'top';
    tr.appendChild(tdClose);

    var closeDiv = document.createElement('button');
    closeDiv.innerHTML = '&times;';
    closeDiv.title = 'Close message (ESC)';
    tdClose.appendChild(closeDiv);
    var me = this;
    closeDiv.onclick = function () {
      me.removeMessage(divMessage);
    }
  }

  return divMessage;
};

/**
 * Remove a message from the list with messages
 * @param {Element} [message]   The HTML DOM of a message
 *                              If undefined, the first closeable message will
 *                              closed.
 */
Notify.prototype.removeMessage = function (message) {
  var frame = this.dom.frame;
  if (!message && frame) {
    // find the first closable message in the list with displayed messages
    var child = frame.firstChild;
    while (child && !child.closeable) {
      child = child.nextSibling;
    }
    if (child && child.closeable) {
      message = child;
    }
  }

  if (message && message.parentNode == frame) {
    message.parentNode.removeChild(message);
  }

  if (frame && frame.childNodes.length == 0) {
    frame.parentNode.removeChild(frame);
    delete this.dom.frame;
  }
};

/**
 * Handle key down event.
 * @param {Event} event
 * @private
 */
Notify.prototype.onKeyDown = function (event) {
  var keynum = event.which;
  if (keynum == 27) { // ESC
    // remove the oldest open and closeable message
    this.removeMessage();
    event.preventDefault();
    event.stopPropagation();
  }
};
