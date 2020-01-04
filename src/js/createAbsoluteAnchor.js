import { isChildOf, removeEventListener, addEventListener } from './util'

/**
 * Create an anchor element absolutely positioned in the `parent`
 * element.
 * @param {HTMLElement} anchor
 * @param {HTMLElement} parent
 * @param {function(HTMLElement)} [onDestroy]  Callback when the anchor is destroyed
 * @param {boolean} [destroyOnMouseOut=false] If true, anchor will be removed on mouse out
 * @returns {HTMLElement}
 */
export function createAbsoluteAnchor (anchor, parent, onDestroy, destroyOnMouseOut = false) {
  const root = getRootNode(anchor)
  const eventListeners = {}

  const anchorRect = anchor.getBoundingClientRect()
  const parentRect = parent.getBoundingClientRect()

  const absoluteAnchor = document.createElement('div')
  absoluteAnchor.className = 'jsoneditor-anchor'
  absoluteAnchor.style.position = 'absolute'
  absoluteAnchor.style.left = (anchorRect.left - parentRect.left) + 'px'
  absoluteAnchor.style.top = (anchorRect.top - parentRect.top) + 'px'
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

  function isOutside (target) {
    return (target !== absoluteAnchor) && !isChildOf(target, absoluteAnchor)
  }

  // create and attach event listeners
  function destroyIfOutside (event) {
    if (isOutside(event.target)) {
      destroy()
    }
  }

  eventListeners.mousedown = addEventListener(root, 'mousedown', destroyIfOutside)
  eventListeners.mousewheel = addEventListener(root, 'mousewheel', destroyIfOutside)

  if (destroyOnMouseOut) {
    let destroyTimer = null

    absoluteAnchor.onmouseover = () => {
      clearTimeout(destroyTimer)
      destroyTimer = null
    }

    absoluteAnchor.onmouseout = () => {
      if (!destroyTimer) {
        destroyTimer = setTimeout(destroy, 200)
      }
    }
  }

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
