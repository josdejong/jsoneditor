'use strict'

import { ContextMenu } from './ContextMenu'
import { translate } from './i18n'
import { addClassName, removeClassName } from './util'

/**
 * Creates a component that visualize path selection in tree based editors
 * @param {HTMLElement} container
 * @param {HTMLElement} root
 * @constructor
 */
export class TreePath {
  constructor (container, root) {
    if (container) {
      this.root = root
      this.path = document.createElement('div')
      this.path.className = 'jsoneditor-treepath'
      this.path.setAttribute('tabindex', 0)
      this.contentMenuClicked = false
      container.appendChild(this.path)
      this.reset()
    }
  }

  /**
   * Reset component to initial status
   */
  reset () {
    this.path.textContent = translate('selectNode')
  }

  /**
   * Renders the component UI according to a given path objects
   * @param {Array<{name: String, childs: Array}>} pathObjs a list of path objects
   *
   */
  setPath (pathObjs) {
    const me = this

    this.path.textContent = ''

    if (pathObjs && pathObjs.length) {
      pathObjs.forEach((pathObj, idx) => {
        const pathEl = document.createElement('span')
        let sepEl
        pathEl.className = 'jsoneditor-treepath-element'
        pathEl.innerText = pathObj.name
        pathEl.onclick = _onSegmentClick.bind(me, pathObj)

        me.path.appendChild(pathEl)

        if (pathObj.children.length) {
          sepEl = document.createElement('span')
          sepEl.className = 'jsoneditor-treepath-seperator'
          sepEl.textContent = '\u25BA'

          sepEl.onclick = () => {
            me.contentMenuClicked = true
            const items = []
            pathObj.children.forEach(child => {
              items.push({
                text: child.name,
                className: 'jsoneditor-type-modes' + (pathObjs[idx + 1] + 1 && pathObjs[idx + 1].name === child.name ? ' jsoneditor-selected' : ''),
                click: _onContextMenuItemClick.bind(me, pathObj, child.name)
              })
            })
            const menu = new ContextMenu(items, { limitHeight: true })
            menu.show(sepEl, me.root, true)
          }

          me.path.appendChild(sepEl)
        }

        if (idx === pathObjs.length - 1) {
          const leftRectPos = (sepEl || pathEl).getBoundingClientRect().right
          if (me.path.offsetWidth < leftRectPos) {
            me.path.scrollLeft = leftRectPos
          }

          if (me.path.scrollLeft) {
            const showAllBtn = document.createElement('span')
            showAllBtn.className = 'jsoneditor-treepath-show-all-btn'
            showAllBtn.title = 'show all path'
            showAllBtn.textContent = '...'
            showAllBtn.onclick = _onShowAllClick.bind(me, pathObjs)
            me.path.insertBefore(showAllBtn, me.path.firstChild)
          }
        }
      })
    }

    function _onShowAllClick (pathObjs) {
      me.contentMenuClicked = false
      addClassName(me.path, 'show-all')
      me.path.style.width = me.path.parentNode.getBoundingClientRect().width - 10 + 'px'
      me.path.onblur = () => {
        if (me.contentMenuClicked) {
          me.contentMenuClicked = false
          me.path.focus()
          return
        }
        removeClassName(me.path, 'show-all')
        me.path.onblur = undefined
        me.path.style.width = ''
        me.setPath(pathObjs)
      }
    }

    function _onSegmentClick (pathObj) {
      if (this.selectionCallback) {
        this.selectionCallback(pathObj)
      }
    }

    function _onContextMenuItemClick (pathObj, selection) {
      if (this.contextMenuCallback) {
        this.contextMenuCallback(pathObj, selection)
      }
    }
  }

  /**
   * set a callback function for selection of path section
   * @param {Function} callback function to invoke when section is selected
   */
  onSectionSelected (callback) {
    if (typeof callback === 'function') {
      this.selectionCallback = callback
    }
  }

  /**
   * set a callback function for selection of path section
   * @param {Function} callback function to invoke when section is selected
   */
  onContextMenuItemSelected (callback) {
    if (typeof callback === 'function') {
      this.contextMenuCallback = callback
    }
  }
}
