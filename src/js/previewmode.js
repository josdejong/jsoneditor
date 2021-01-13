'use strict'

import jsonrepair from 'jsonrepair'
import {
  DEFAULT_MODAL_ANCHOR,
  MAX_PREVIEW_CHARACTERS,
  PREVIEW_HISTORY_LIMIT,
  SIZE_LARGE
} from './constants'
import { ErrorTable } from './ErrorTable'
import { FocusTracker } from './FocusTracker'
import { History } from './History'
import { setLanguage, setLanguages, translate } from './i18n'
import { createQuery, executeQuery } from './jmespathQuery'
import { ModeSwitcher } from './ModeSwitcher'
import { showSortModal } from './showSortModal'
import { showTransformModal } from './showTransformModal'
import { textModeMixins } from './textmode'
import {
  addClassName,
  debounce,
  escapeUnicodeChars,
  formatSize,
  isObject,
  limitCharacters,
  parse,
  removeClassName,
  sort,
  sortObjectKeys
} from './util'

const textmode = textModeMixins[0].mixin

// create a mixin with the functions for text mode
const previewmode = {}

/**
 * Create a JSON document preview, suitable for processing of large documents
 * @param {Element} container
 * @param {Object} [options]   Object with options. See docs for details.
 * @private
 */
previewmode.create = function (container, options = {}) {
  if (typeof options.statusBar === 'undefined') {
    options.statusBar = true
  }

  // setting default for previewmode
  options.mainMenuBar = options.mainMenuBar !== false
  options.enableSort = options.enableSort !== false
  options.enableTransform = options.enableTransform !== false
  options.createQuery = options.createQuery || createQuery
  options.executeQuery = options.executeQuery || executeQuery

  this.options = options

  // indentation
  if (typeof options.indentation === 'number') {
    this.indentation = Number(options.indentation)
  } else {
    this.indentation = 2 // number of spaces
  }

  // language
  setLanguages(this.options.languages)
  setLanguage(this.options.language)

  // determine mode
  this.mode = 'preview'

  const me = this
  this.container = container
  this.dom = {}

  this.json = undefined
  this.text = ''

  // TODO: JSON Schema support

  // create a debounced validate function
  this._debouncedValidate = debounce(this.validate.bind(this), this.DEBOUNCE_INTERVAL)

  this.width = container.clientWidth
  this.height = container.clientHeight

  this.frame = document.createElement('div')
  this.frame.className = 'jsoneditor jsoneditor-mode-preview'
  this.frame.onclick = event => {
    // prevent default submit action when the editor is located inside a form
    event.preventDefault()
  }

  // setting the FocusTracker on 'this.frame' to track the editor's focus event
  const focusTrackerConfig = {
    target: this.frame,
    onFocus: this.options.onFocus || null,
    onBlur: this.options.onBlur || null
  }

  this.frameFocusTracker = new FocusTracker(focusTrackerConfig)

  this.content = document.createElement('div')
  this.content.className = 'jsoneditor-outer'

  this.dom.busy = document.createElement('div')
  this.dom.busy.className = 'jsoneditor-busy'
  this.dom.busyContent = document.createElement('span')
  this.dom.busyContent.textContent = 'busy...'
  this.dom.busy.appendChild(this.dom.busyContent)
  this.content.appendChild(this.dom.busy)

  this.dom.previewContent = document.createElement('pre')
  this.dom.previewContent.className = 'jsoneditor-preview'
  this.dom.previewText = document.createTextNode('')
  this.dom.previewContent.appendChild(this.dom.previewText)
  this.content.appendChild(this.dom.previewContent)

  if (this.options.mainMenuBar) {
    addClassName(this.content, 'has-main-menu-bar')

    // create menu
    this.menu = document.createElement('div')
    this.menu.className = 'jsoneditor-menu'
    this.frame.appendChild(this.menu)

    // create format button
    const buttonFormat = document.createElement('button')
    buttonFormat.type = 'button'
    buttonFormat.className = 'jsoneditor-format'
    buttonFormat.title = translate('formatTitle')
    this.menu.appendChild(buttonFormat)
    buttonFormat.onclick = function handleFormat () {
      me.executeWithBusyMessage(() => {
        try {
          me.format()
        } catch (err) {
          me._onError(err)
        }
      }, 'formatting...')
    }

    // create compact button
    const buttonCompact = document.createElement('button')
    buttonCompact.type = 'button'
    buttonCompact.className = 'jsoneditor-compact'
    buttonCompact.title = translate('compactTitle')
    this.menu.appendChild(buttonCompact)
    buttonCompact.onclick = function handleCompact () {
      me.executeWithBusyMessage(() => {
        try {
          me.compact()
        } catch (err) {
          me._onError(err)
        }
      }, 'compacting...')
    }

    // create sort button
    if (this.options.enableSort) {
      const sort = document.createElement('button')
      sort.type = 'button'
      sort.className = 'jsoneditor-sort'
      sort.title = translate('sortTitleShort')
      sort.onclick = () => {
        me._showSortModal()
      }
      this.menu.appendChild(sort)
    }

    // create transform button
    if (this.options.enableTransform) {
      const transform = document.createElement('button')
      transform.type = 'button'
      transform.title = translate('transformTitleShort')
      transform.className = 'jsoneditor-transform'
      transform.onclick = () => {
        me._showTransformModal()
      }
      this.dom.transform = transform
      this.menu.appendChild(transform)
    }

    // create repair button
    const buttonRepair = document.createElement('button')
    buttonRepair.type = 'button'
    buttonRepair.className = 'jsoneditor-repair'
    buttonRepair.title = translate('repairTitle')
    this.menu.appendChild(buttonRepair)
    buttonRepair.onclick = () => {
      if (me.json === undefined) { // only repair if we don't have valid JSON
        me.executeWithBusyMessage(() => {
          try {
            me.repair()
          } catch (err) {
            me._onError(err)
          }
        }, 'repairing...')
      }
    }

    // create history and undo/redo buttons
    if (this.options.history !== false) { // default option value is true
      const onHistoryChange = () => {
        me.dom.undo.disabled = !me.history.canUndo()
        me.dom.redo.disabled = !me.history.canRedo()
      }

      const calculateItemSize = item => // times two to account for the json object
        item.text.length * 2

      this.history = new History(onHistoryChange, calculateItemSize, PREVIEW_HISTORY_LIMIT)

      // create undo button
      const undo = document.createElement('button')
      undo.type = 'button'
      undo.className = 'jsoneditor-undo jsoneditor-separator'
      undo.title = translate('undo')
      undo.onclick = () => {
        const action = me.history.undo()
        if (action) {
          me._applyHistory(action)
        }
      }
      this.menu.appendChild(undo)
      this.dom.undo = undo

      // create redo button
      const redo = document.createElement('button')
      redo.type = 'button'
      redo.className = 'jsoneditor-redo'
      redo.title = translate('redo')
      redo.onclick = () => {
        const action = me.history.redo()
        if (action) {
          me._applyHistory(action)
        }
      }
      this.menu.appendChild(redo)
      this.dom.redo = redo

      // force enabling/disabling the undo/redo button
      this.history.onChange()
    }

    // create mode box
    if (this.options && this.options.modes && this.options.modes.length) {
      this.modeSwitcher = new ModeSwitcher(this.menu, this.options.modes, this.options.mode, function onSwitch (mode) {
        // switch mode and restore focus
        me.setMode(mode)
        me.modeSwitcher.focus()
      })
    }
  }

  this.errorTable = new ErrorTable({
    errorTableVisible: true,
    onToggleVisibility: function () {
      me.validate()
    },
    onFocusLine: null,
    onChangeHeight: function (height) {
      // TODO: change CSS to using flex box, remove setting height using JavaScript
      const statusBarHeight = me.dom.statusBar ? me.dom.statusBar.clientHeight : 0
      const totalHeight = height + statusBarHeight + 1
      me.content.style.marginBottom = (-totalHeight) + 'px'
      me.content.style.paddingBottom = totalHeight + 'px'
    }
  })

  this.frame.appendChild(this.content)
  this.frame.appendChild(this.errorTable.getErrorTable())
  this.container.appendChild(this.frame)

  if (options.statusBar) {
    addClassName(this.content, 'has-status-bar')

    const statusBar = document.createElement('div')
    this.dom.statusBar = statusBar
    statusBar.className = 'jsoneditor-statusbar'
    this.frame.appendChild(statusBar)

    this.dom.fileSizeInfo = document.createElement('span')
    this.dom.fileSizeInfo.className = 'jsoneditor-size-info'
    this.dom.fileSizeInfo.innerText = ''
    statusBar.appendChild(this.dom.fileSizeInfo)

    this.dom.arrayInfo = document.createElement('span')
    this.dom.arrayInfo.className = 'jsoneditor-size-info'
    this.dom.arrayInfo.innerText = ''
    statusBar.appendChild(this.dom.arrayInfo)

    statusBar.appendChild(this.errorTable.getErrorCounter())
    statusBar.appendChild(this.errorTable.getWarningIcon())
    statusBar.appendChild(this.errorTable.getErrorIcon())
  }

  this._renderPreview()

  this.setSchema(this.options.schema, this.options.schemaRefs)
}

previewmode._renderPreview = function () {
  const text = this.getText()

  this.dom.previewText.nodeValue = limitCharacters(text, MAX_PREVIEW_CHARACTERS)

  if (this.dom.fileSizeInfo) {
    this.dom.fileSizeInfo.innerText = 'Size: ' + formatSize(text.length)
  }

  if (this.dom.arrayInfo) {
    if (Array.isArray(this.json)) {
      this.dom.arrayInfo.innerText = ('Array: ' + this.json.length + ' items')
    } else {
      this.dom.arrayInfo.innerText = ''
    }
  }
}

/**
 * Handle a change:
 * - Validate JSON schema
 * - Send a callback to the onChange listener if provided
 * @private
 */
previewmode._onChange = function () {
  // validate JSON schema (if configured)
  this._debouncedValidate()

  // trigger the onChange callback
  if (this.options.onChange) {
    try {
      this.options.onChange()
    } catch (err) {
      console.error('Error in onChange callback: ', err)
    }
  }

  // trigger the onChangeJSON callback
  if (this.options.onChangeJSON) {
    try {
      this.options.onChangeJSON(this.get())
    } catch (err) {
      console.error('Error in onChangeJSON callback: ', err)
    }
  }

  // trigger the onChangeText callback
  if (this.options.onChangeText) {
    try {
      this.options.onChangeText(this.getText())
    } catch (err) {
      console.error('Error in onChangeText callback: ', err)
    }
  }
}

/**
 * Open a sort modal
 * @private
 */
previewmode._showSortModal = function () {
  const me = this

  function onSort (json, sortedBy) {
    if (Array.isArray(json)) {
      const sortedArray = sort(json, sortedBy.path, sortedBy.direction)

      me.sortedBy = sortedBy
      me._setAndFireOnChange(sortedArray)
    }

    if (isObject(json)) {
      const sortedObject = sortObjectKeys(json, sortedBy.direction)

      me.sortedBy = sortedBy
      me._setAndFireOnChange(sortedObject)
    }
  }

  this.executeWithBusyMessage(() => {
    const container = me.options.modalAnchor || DEFAULT_MODAL_ANCHOR
    const json = me.get()
    me._renderPreview() // update array count

    showSortModal(container, json, sortedBy => {
      me.executeWithBusyMessage(() => {
        onSort(json, sortedBy)
      }, 'sorting...')
    }, me.sortedBy)
  }, 'parsing...')
}

/**
 * Open a transform modal
 * @private
 */
previewmode._showTransformModal = function () {
  this.executeWithBusyMessage(() => {
    const { createQuery, executeQuery, modalAnchor, queryDescription } = this.options
    const json = this.get()

    this._renderPreview() // update array count

    showTransformModal({
      container: modalAnchor || DEFAULT_MODAL_ANCHOR,
      json,
      queryDescription, // can be undefined
      createQuery,
      executeQuery,
      onTransform: query => {
        this.executeWithBusyMessage(() => {
          const updatedJson = executeQuery(json, query)
          this._setAndFireOnChange(updatedJson)
        }, 'transforming...')
      }
    })
  }, 'parsing...')
}

/**
 * Destroy the editor. Clean up DOM, event listeners, and web workers.
 */
previewmode.destroy = function () {
  if (this.frame && this.container && this.frame.parentNode === this.container) {
    this.container.removeChild(this.frame)
  }

  if (this.modeSwitcher) {
    this.modeSwitcher.destroy()
    this.modeSwitcher = null
  }

  this._debouncedValidate = null

  if (this.history) {
    this.history.clear()
    this.history = null
  }

  // Removing the FocusTracker set to track the editor's focus event
  this.frameFocusTracker.destroy()
}

/**
 * Compact the code in the text editor
 */
previewmode.compact = function () {
  const json = this.get()
  const text = JSON.stringify(json)

  // we know that in this case the json is still the same, so we pass json too
  this._setTextAndFireOnChange(text, json)
}

/**
 * Format the code in the text editor
 */
previewmode.format = function () {
  const json = this.get()
  const text = JSON.stringify(json, null, this.indentation)

  // we know that in this case the json is still the same, so we pass json too
  this._setTextAndFireOnChange(text, json)
}

/**
 * Repair the code in the text editor
 */
previewmode.repair = function () {
  const text = this.getText()
  try {
    const repairedText = jsonrepair(text)

    this._setTextAndFireOnChange(repairedText)
  } catch (err) {
    // repair was not successful, do nothing
  }
}

/**
 * Set focus to the editor
 */
previewmode.focus = function () {
  // we don't really have a place to focus,
  // let's focus on the transform button
  this.dom.transform.focus()
}

/**
 * Set json data in the editor
 * @param {*} json
 */
previewmode.set = function (json) {
  if (this.history) {
    this.history.clear()
  }

  this._set(json)
}

/**
 * Update data. Same as calling `set` in text/code mode.
 * @param {*} json
 */
previewmode.update = function (json) {
  this._set(json)
}

/**
 * Set json data
 * @param {*} json
 */
previewmode._set = function (json) {
  this.text = undefined
  this.json = json

  this._renderPreview()

  this._pushHistory()

  // validate JSON schema
  this._debouncedValidate()
}

previewmode._setAndFireOnChange = function (json) {
  this._set(json)
  this._onChange()
}

/**
 * Get json data
 * @return {*} json
 */
previewmode.get = function () {
  if (this.json === undefined) {
    const text = this.getText()

    this.json = parse(text) // this can throw an error
  }

  return this.json
}

/**
 * Get the text contents of the editor
 * @return {String} jsonText
 */
previewmode.getText = function () {
  if (this.text === undefined) {
    this.text = JSON.stringify(this.json, null, this.indentation)

    if (this.options.escapeUnicode === true) {
      this.text = escapeUnicodeChars(this.text)
    }
  }

  return this.text
}

/**
 * Set the text contents of the editor
 * @param {String} jsonText
 */
previewmode.setText = function (jsonText) {
  if (this.history) {
    this.history.clear()
  }

  this._setText(jsonText)
}

/**
 * Update the text contents
 * @param {string} jsonText
 */
previewmode.updateText = function (jsonText) {
  // don't update if there are no changes
  if (this.getText() === jsonText) {
    return
  }

  this._setText(jsonText)
}

/**
 * Set the text contents of the editor
 * @param {string} jsonText
 * @param {*} [json] Optional JSON instance of the text
 * @private
 */
previewmode._setText = function (jsonText, json) {
  if (this.options.escapeUnicode === true) {
    this.text = escapeUnicodeChars(jsonText)
  } else {
    this.text = jsonText
  }
  this.json = json

  this._renderPreview()

  if (this.json === undefined) {
    const me = this
    this.executeWithBusyMessage(() => {
      try {
        // force parsing the json now, else it will be done in validate without feedback
        me.json = me.get()
        me._renderPreview()
        me._pushHistory()
      } catch (err) {
        // no need to throw an error, validation will show an error
      }
    }, 'parsing...')
  } else {
    this._pushHistory()
  }

  this._debouncedValidate()
}

/**
 * Set text and fire onChange callback
 * @param {string} jsonText
 * @param {*} [json] Optional JSON instance of the text
 * @private
 */
previewmode._setTextAndFireOnChange = function (jsonText, json) {
  this._setText(jsonText, json)
  this._onChange()
}

/**
 * Apply history to the current state
 * @param {{json?: JSON, text?: string}} action
 * @private
 */
previewmode._applyHistory = function (action) {
  this.json = action.json
  this.text = action.text

  this._renderPreview()

  this._debouncedValidate()
}

/**
 * Push the current state to history
 * @private
 */
previewmode._pushHistory = function () {
  if (!this.history) {
    return
  }

  const action = {
    text: this.text,
    json: this.json
  }

  this.history.add(action)
}

/**
 * Execute a heavy, blocking action.
 * Before starting the action, show a message on screen like "parsing..."
 * @param {function} fn
 * @param {string} message
 */
previewmode.executeWithBusyMessage = function (fn, message) {
  const size = this.getText().length

  if (size > SIZE_LARGE) {
    const me = this
    addClassName(me.frame, 'busy')
    me.dom.busyContent.innerText = message

    setTimeout(() => {
      fn()
      removeClassName(me.frame, 'busy')
      me.dom.busyContent.innerText = ''
    }, 100)
  } else {
    fn()
  }
}

// TODO: refactor into composable functions instead of this shaky mixin-like structure
previewmode.validate = textmode.validate
previewmode._renderErrors = textmode._renderErrors

// define modes
export const previewModeMixins = [
  {
    mode: 'preview',
    mixin: previewmode,
    data: 'json'
  }
]
