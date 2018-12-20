var util = require('./util');

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
