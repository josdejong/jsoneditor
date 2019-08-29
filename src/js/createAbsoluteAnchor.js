import { isChildOf, removeEventListener, addEventListener } from './util'

/**
 * Create an anchor element absolutely positioned in the `parent`
 * element.
 * @param {HTMLElement} anchor
 * @param {HTMLElement} parent
 * @param [onDestroy(function(anchor)]  Callback when the anchor is destroyed
 * @returns {HTMLElement}
 */
export function createAbsoluteAnchor (anchor, parent, onDestroy) {
  const root = getRootNode(anchor)
  const eventListeners = {}

  const anchorRect = anchor.getBoundingClientRect()
  const frameRect = parent.getBoundingClientRect()

  const absoluteAnchor = document.createElement('div')
  absoluteAnchor.className = 'jsoneditor-anchor'
  absoluteAnchor.style.position = 'absolute'
  absoluteAnchor.style.left = (anchorRect.left - frameRect.left) + 'px'
  absoluteAnchor.style.top = (anchorRect.top - frameRect.top) + 'px'
  absoluteAnchor.style.width = (anchorRect.width - 2) + 'px'
  absoluteAnchor.style.height = (anchorRect.height - 2) + 'px'
  absoluteAnchor.style.boxSizing = 'border-box'
  parent.appendChild(absoluteAnchor)

  function destroy () {
    // remove temporary absolutely positioned anchor
    if (absoluteAnchor && absoluteAnchor.parentNode) {
      absoluteAnchor.parentNode.removeChild(absoluteAnchor)

      // remove all event listeners
      // all event listeners are supposed to be attached to document.
      for (const name in eventListeners) {
        if (hasOwnProperty(eventListeners, name)) {
          const fn = eventListeners[name]
          if (fn) {
            removeEventListener(root, name, fn)
          }
          delete eventListeners[name]
        }
      }

      if (typeof onDestroy === 'function') {
        onDestroy(anchor)
      }
    }
  }

  // create and attach event listeners
  const destroyIfOutside = event => {
    const target = event.target
    if ((target !== absoluteAnchor) && !isChildOf(target, absoluteAnchor)) {
      destroy()
    }
  }

  eventListeners.mousedown = addEventListener(root, 'mousedown', destroyIfOutside)
  eventListeners.mousewheel = addEventListener(root, 'mousewheel', destroyIfOutside)
  // eventListeners.scroll = addEventListener(root, 'scroll', destroyIfOutside);

  absoluteAnchor.destroy = destroy

  return absoluteAnchor
}

/**
 * Node.getRootNode shim
 * @param  {HTMLElement} node node to check
 * @return {HTMLElement}      node's rootNode or `window` if there is ShadowDOM is not supported.
 */
function getRootNode (node) {
  return (typeof node.getRootNode === 'function')
    ? node.getRootNode()
    : window
}

function hasOwnProperty (object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}
