'use strict'

import jsonrepair from 'jsonrepair'
import ace from './ace'
import { DEFAULT_MODAL_ANCHOR } from './constants'
import { ErrorTable } from './ErrorTable'
import { FocusTracker } from './FocusTracker'
import { setLanguage, setLanguages, translate } from './i18n'
import { createQuery, executeQuery } from './jmespathQuery'
import { ModeSwitcher } from './ModeSwitcher'
import { showSortModal } from './showSortModal'
import { showTransformModal } from './showTransformModal'
import { tryRequireThemeJsonEditor } from './tryRequireThemeJsonEditor'
import {
  addClassName,
  debounce,
  escapeUnicodeChars,
  getIndexForPosition,
  getInputSelection,
  getPositionForPath,
  improveSchemaError,
  isObject,
  isValidationErrorChanged,
  parse,
  sort,
  sortObjectKeys
} from './util'
import { validateCustom } from './validationUtils'

// create a mixin with the functions for text mode
const textmode = {}

const DEFAULT_THEME = 'ace/theme/jsoneditor'

/**
 * Create a text editor
 * @param {Element} container
 * @param {Object} [options]   Object with options. See docs for details.
 * @private
 */
textmode.create = function (container, options = {}) {
  if (typeof options.statusBar === 'undefined') {
    options.statusBar = true
  }

  // setting default for textmode
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

  // grab ace from options if provided
  const _ace = options.ace ? options.ace : ace
  // TODO: make the option options.ace deprecated, it's not needed anymore (see #309)

  // determine mode
  this.mode = (options.mode === 'code') ? 'code' : 'text'
  if (this.mode === 'code') {
    // verify whether Ace editor is available and supported
    if (typeof _ace === 'undefined') {
      this.mode = 'text'
      console.warn('Failed to load Ace editor, falling back to plain text mode. Please use a JSONEditor bundle including Ace, or pass Ace as via the configuration option `ace`.')
    }
  }

  // determine theme
  this.theme = options.theme || DEFAULT_THEME
  if (this.theme === DEFAULT_THEME && _ace) {
    tryRequireThemeJsonEditor()
  }

  if (options.onTextSelectionChange) {
    this.onTextSelectionChange(options.onTextSelectionChange)
  }

  const me = this
  this.container = container
  this.dom = {}
  this.aceEditor = undefined // ace code editor
  this.textarea = undefined // plain text editor (fallback when Ace is not available)
  this.validateSchema = null
  this.annotations = []
  this.lastSchemaErrors = undefined

  // create a debounced validate function
  this._debouncedValidate = debounce(this.validate.bind(this), this.DEBOUNCE_INTERVAL)

  this.width = container.clientWidth
  this.height = container.clientHeight

  this.frame = document.createElement('div')
  this.frame.className = 'jsoneditor jsoneditor-mode-' + this.options.mode
  this.frame.onclick = event => {
    // prevent default submit action when the editor is located inside a form
    event.preventDefault()
  }
  this.frame.onkeydown = event => {
    me._onKeyDown(event)
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
    buttonFormat.onclick = () => {
      try {
        me.format()
        me._onChange()
      } catch (err) {
        me._onError(err)
      }
    }

    // create compact button
    const buttonCompact = document.createElement('button')
    buttonCompact.type = 'button'
    buttonCompact.className = 'jsoneditor-compact'
    buttonCompact.title = translate('compactTitle')
    this.menu.appendChild(buttonCompact)
    buttonCompact.onclick = () => {
      try {
        me.compact()
        me._onChange()
      } catch (err) {
        me._onError(err)
      }
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
      this.menu.appendChild(transform)
    }

    // create repair button
    const buttonRepair = document.createElement('button')
    buttonRepair.type = 'button'
    buttonRepair.className = 'jsoneditor-repair'
    buttonRepair.title = translate('repairTitle')
    this.menu.appendChild(buttonRepair)
    buttonRepair.onclick = () => {
      try {
        me.repair()
        me._onChange()
      } catch (err) {
        me._onError(err)
      }
    }

    // create undo/redo buttons
    if (this.mode === 'code') {
      // create undo button
      const undo = document.createElement('button')
      undo.type = 'button'
      undo.className = 'jsoneditor-undo jsoneditor-separator'
      undo.title = translate('undo')
      undo.onclick = () => {
        this.aceEditor.getSession().getUndoManager().undo()
      }
      this.menu.appendChild(undo)
      this.dom.undo = undo

      // create redo button
      const redo = document.createElement('button')
      redo.type = 'button'
      redo.className = 'jsoneditor-redo'
      redo.title = translate('redo')
      redo.onclick = () => {
        this.aceEditor.getSession().getUndoManager().redo()
      }
      this.menu.appendChild(redo)
      this.dom.redo = redo
    }

    // create mode box
    if (this.options && this.options.modes && this.options.modes.length) {
      this.modeSwitcher = new ModeSwitcher(this.menu, this.options.modes, this.options.mode, function onSwitch (mode) {
        // switch mode and restore focus
        me.setMode(mode)
        me.modeSwitcher.focus()
      })
    }

    if (this.mode === 'code') {
      const poweredBy = document.createElement('a')
      poweredBy.appendChild(document.createTextNode('powered by ace'))
      poweredBy.href = 'https://ace.c9.io/'
      poweredBy.target = '_blank'
      poweredBy.className = 'jsoneditor-poweredBy'
      poweredBy.onclick = () => {
        // TODO: this anchor falls below the margin of the content,
        // therefore the normal a.href does not work. We use a click event
        // for now, but this should be fixed.
        window.open(poweredBy.href, poweredBy.target, 'noopener')
      }
      this.menu.appendChild(poweredBy)
    }
  }

  const emptyNode = {}
  const isReadOnly = (this.options.onEditable &&
  typeof (this.options.onEditable === 'function') &&
  !this.options.onEditable(emptyNode))

  this.frame.appendChild(this.content)
  this.container.appendChild(this.frame)

  if (this.mode === 'code') {
    this.editorDom = document.createElement('div')
    this.editorDom.style.height = '100%' // TODO: move to css
    this.editorDom.style.width = '100%' // TODO: move to css
    this.content.appendChild(this.editorDom)

    const aceEditor = _ace.edit(this.editorDom)
    const aceSession = aceEditor.getSession()
    aceEditor.$blockScrolling = Infinity
    aceEditor.setTheme(this.theme)
    aceEditor.setOptions({ readOnly: isReadOnly })
    aceEditor.setShowPrintMargin(false)
    aceEditor.setFontSize('13px')
    aceSession.setMode('ace/mode/json')
    aceSession.setTabSize(this.indentation)
    aceSession.setUseSoftTabs(true)
    aceSession.setUseWrapMode(true)

    // replace ace setAnnotations with custom function that also covers jsoneditor annotations
    const originalSetAnnotations = aceSession.setAnnotations
    aceSession.setAnnotations = function (annotations) {
      originalSetAnnotations.call(this, annotations && annotations.length ? annotations : me.annotations)
    }

    // disable Ctrl+L quickkey of Ace (is used by the browser to select the address bar)
    aceEditor.commands.bindKey('Ctrl-L', null)
    aceEditor.commands.bindKey('Command-L', null)

    // disable the quickkeys we want to use for Format and Compact
    aceEditor.commands.bindKey('Ctrl-\\', null)
    aceEditor.commands.bindKey('Command-\\', null)
    aceEditor.commands.bindKey('Ctrl-Shift-\\', null)
    aceEditor.commands.bindKey('Command-Shift-\\', null)

    this.aceEditor = aceEditor

    // register onchange event
    aceEditor.on('change', this._onChange.bind(this))
    aceEditor.on('changeSelection', this._onSelect.bind(this))
  } else {
    // load a plain text textarea
    const textarea = document.createElement('textarea')
    textarea.className = 'jsoneditor-text'
    textarea.spellcheck = false
    this.content.appendChild(textarea)
    this.textarea = textarea
    this.textarea.readOnly = isReadOnly

    // register onchange event
    if (this.textarea.oninput === null) {
      this.textarea.oninput = this._onChange.bind(this)
    } else {
      // oninput is undefined. For IE8-
      this.textarea.onchange = this._onChange.bind(this)
    }

    textarea.onselect = this._onSelect.bind(this)
    textarea.onmousedown = this._onMouseDown.bind(this)
    textarea.onblur = this._onBlur.bind(this)
  }

  this._updateHistoryButtons()

  this.errorTable = new ErrorTable({
    errorTableVisible: this.mode === 'text',
    onToggleVisibility: function () {
      me.validate()
    },
    onFocusLine: function (line) {
      me.isFocused = true
      if (!isNaN(line)) {
        me.setTextSelection({ row: line, column: 1 }, { row: line, column: 1000 })
      }
    },
    onChangeHeight: function (height) {
      // TODO: change CSS to using flex box, remove setting height using JavaScript
      const statusBarHeight = me.dom.statusBar ? me.dom.statusBar.clientHeight : 0
      const totalHeight = height + statusBarHeight + 1
      me.content.style.marginBottom = (-totalHeight) + 'px'
      me.content.style.paddingBottom = totalHeight + 'px'
    }
  })
  this.frame.appendChild(this.errorTable.getErrorTable())

  if (options.statusBar) {
    addClassName(this.content, 'has-status-bar')

    this.curserInfoElements = {}
    const statusBar = document.createElement('div')
    this.dom.statusBar = statusBar
    statusBar.className = 'jsoneditor-statusbar'
    this.frame.appendChild(statusBar)

    const lnLabel = document.createElement('span')
    lnLabel.className = 'jsoneditor-curserinfo-label'
    lnLabel.innerText = 'Ln:'

    const lnVal = document.createElement('span')
    lnVal.className = 'jsoneditor-curserinfo-val'
    lnVal.innerText = '1'

    statusBar.appendChild(lnLabel)
    statusBar.appendChild(lnVal)

    const colLabel = document.createElement('span')
    colLabel.className = 'jsoneditor-curserinfo-label'
    colLabel.innerText = 'Col:'

    const colVal = document.createElement('span')
    colVal.className = 'jsoneditor-curserinfo-val'
    colVal.innerText = '1'

    statusBar.appendChild(colLabel)
    statusBar.appendChild(colVal)

    this.curserInfoElements.colVal = colVal
    this.curserInfoElements.lnVal = lnVal

    const countLabel = document.createElement('span')
    countLabel.className = 'jsoneditor-curserinfo-label'
    countLabel.innerText = 'characters selected'
    countLabel.style.display = 'none'

    const countVal = document.createElement('span')
    countVal.className = 'jsoneditor-curserinfo-count'
    countVal.innerText = '0'
    countVal.style.display = 'none'

    this.curserInfoElements.countLabel = countLabel
    this.curserInfoElements.countVal = countVal

    statusBar.appendChild(countVal)
    statusBar.appendChild(countLabel)

    statusBar.appendChild(this.errorTable.getErrorCounter())
    statusBar.appendChild(this.errorTable.getWarningIcon())
    statusBar.appendChild(this.errorTable.getErrorIcon())
  }

  this.setSchema(this.options.schema, this.options.schemaRefs)
}

/**
 * Handle a change:
 * - Validate JSON schema
 * - Send a callback to the onChange listener if provided
 * @private
 */
textmode._onChange = function () {
  if (this.onChangeDisabled) {
    return
  }

  // enable/disable undo/redo buttons
  setTimeout(() => this._updateHistoryButtons())

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

  // trigger the onChangeText callback
  if (this.options.onChangeText) {
    try {
      this.options.onChangeText(this.getText())
    } catch (err) {
      console.error('Error in onChangeText callback: ', err)
    }
  }
}

textmode._updateHistoryButtons = function () {
  if (this.aceEditor && this.dom.undo && this.dom.redo) {
    const undoManager = this.aceEditor.getSession().getUndoManager()

    if (undoManager && undoManager.hasUndo && undoManager.hasRedo) {
      this.dom.undo.disabled = !undoManager.hasUndo()
      this.dom.redo.disabled = !undoManager.hasRedo()
    }
  }
}

/**
 * Open a sort modal
 * @private
 */
textmode._showSortModal = function () {
  const me = this
  const container = this.options.modalAnchor || DEFAULT_MODAL_ANCHOR
  const json = this.get()

  function onSort (sortedBy) {
    if (Array.isArray(json)) {
      const sortedJson = sort(json, sortedBy.path, sortedBy.direction)

      me.sortedBy = sortedBy
      me.update(sortedJson)
    }

    if (isObject(json)) {
      const sortedJson = sortObjectKeys(json, sortedBy.direction)

      me.sortedBy = sortedBy
      me.update(sortedJson)
    }
  }

  showSortModal(container, json, onSort, me.sortedBy)
}

/**
 * Open a transform modal
 * @private
 */
textmode._showTransformModal = function () {
  const { modalAnchor, createQuery, executeQuery, queryDescription } = this.options
  const json = this.get()

  showTransformModal({
    container: modalAnchor || DEFAULT_MODAL_ANCHOR,
    json,
    queryDescription, // can be undefined
    createQuery,
    executeQuery,
    onTransform: query => {
      const updatedJson = executeQuery(json, query)
      this.update(updatedJson)
    }
  })
}

/**
 * Handle text selection
 * Calculates the cursor position and selection range and updates menu
 * @private
 */
textmode._onSelect = function () {
  this._updateCursorInfo()
  this._emitSelectionChange()
}

/**
 * Event handler for keydown. Handles shortcut keys
 * @param {Event} event
 * @private
 */
textmode._onKeyDown = function (event) {
  const keynum = event.which || event.keyCode
  let handled = false

  if (keynum === 73 && event.ctrlKey) {
    if (event.shiftKey) { // Ctrl+Shift+I
      this.compact()
      this._onChange()
    } else { // Ctrl+I
      this.format()
      this._onChange()
    }
    handled = true
  }

  if (handled) {
    event.preventDefault()
    event.stopPropagation()
  }

  this._updateCursorInfo()
  this._emitSelectionChange()
}

/**
 * Event handler for mousedown.
 * @private
 */
textmode._onMouseDown = function () {
  this._updateCursorInfo()
  this._emitSelectionChange()
}

/**
 * Event handler for blur.
 * @private
 */
textmode._onBlur = function () {
  const me = this
  // this allows to avoid blur when clicking inner elements (like the errors panel)
  // just make sure to set the isFocused to true on the inner element onclick callback
  setTimeout(() => {
    if (!me.isFocused) {
      me._updateCursorInfo()
      me._emitSelectionChange()
    }
    me.isFocused = false
  })
}

/**
 * Update the cursor info and the status bar, if presented
 */
textmode._updateCursorInfo = function () {
  const me = this
  let line, col, count

  if (this.textarea) {
    setTimeout(() => { // this to verify we get the most updated textarea cursor selection
      const selectionRange = getInputSelection(me.textarea)

      if (selectionRange.startIndex !== selectionRange.endIndex) {
        count = selectionRange.endIndex - selectionRange.startIndex
      }

      if (count && me.cursorInfo && me.cursorInfo.line === selectionRange.end.row && me.cursorInfo.column === selectionRange.end.column) {
        line = selectionRange.start.row
        col = selectionRange.start.column
      } else {
        line = selectionRange.end.row
        col = selectionRange.end.column
      }

      me.cursorInfo = {
        line: line,
        column: col,
        count: count
      }

      if (me.options.statusBar) {
        updateDisplay()
      }
    }, 0)
  } else if (this.aceEditor && this.curserInfoElements) {
    const curserPos = this.aceEditor.getCursorPosition()
    const selectedText = this.aceEditor.getSelectedText()

    line = curserPos.row + 1
    col = curserPos.column + 1
    count = selectedText.length

    me.cursorInfo = {
      line: line,
      column: col,
      count: count
    }

    if (this.options.statusBar) {
      updateDisplay()
    }
  }

  function updateDisplay () {
    if (me.curserInfoElements.countVal.innerText !== count) {
      me.curserInfoElements.countVal.innerText = count
      me.curserInfoElements.countVal.style.display = count ? 'inline' : 'none'
      me.curserInfoElements.countLabel.style.display = count ? 'inline' : 'none'
    }
    me.curserInfoElements.lnVal.innerText = line
    me.curserInfoElements.colVal.innerText = col
  }
}

/**
 * emits selection change callback, if given
 * @private
 */
textmode._emitSelectionChange = function () {
  if (this._selectionChangedHandler) {
    const currentSelection = this.getTextSelection()
    this._selectionChangedHandler(currentSelection.start, currentSelection.end, currentSelection.text)
  }
}

/**
 * refresh ERROR annotations state
 * error annotations are handled by the ace json mode (ace/mode/json)
 * validation annotations are handled by this mode
 * therefore in order to refresh we send only the annotations of error type in order to maintain its state
 * @private
 */
textmode._refreshAnnotations = function () {
  const session = this.aceEditor && this.aceEditor.getSession()
  if (session) {
    const errEnnotations = session.getAnnotations().filter(annotation => annotation.type === 'error')
    session.setAnnotations(errEnnotations)
  }
}

/**
 * Destroy the editor. Clean up DOM, event listeners, and web workers.
 */
textmode.destroy = function () {
  // remove old ace editor
  if (this.aceEditor) {
    this.aceEditor.destroy()
    this.aceEditor = null
  }

  if (this.frame && this.container && this.frame.parentNode === this.container) {
    this.container.removeChild(this.frame)
  }

  if (this.modeSwitcher) {
    this.modeSwitcher.destroy()
    this.modeSwitcher = null
  }

  this.textarea = null

  this._debouncedValidate = null

  // Removing the FocusTracker set to track the editor's focus event
  this.frameFocusTracker.destroy()
}

/**
 * Compact the code in the text editor
 */
textmode.compact = function () {
  const json = this.get()
  const text = JSON.stringify(json)
  this.updateText(text)
}

/**
 * Format the code in the text editor
 */
textmode.format = function () {
  const json = this.get()
  const text = JSON.stringify(json, null, this.indentation)
  this.updateText(text)
}

/**
 * Repair the code in the text editor
 */
textmode.repair = function () {
  const text = this.getText()
  try {
    const repairedText = jsonrepair(text)
    this.updateText(repairedText)
  } catch (err) {
    // repair was not successful, do nothing
  }
}

/**
 * Set focus to the formatter
 */
textmode.focus = function () {
  if (this.textarea) {
    this.textarea.focus()
  }
  if (this.aceEditor) {
    this.aceEditor.focus()
  }
}

/**
 * Resize the formatter
 */
textmode.resize = function () {
  if (this.aceEditor) {
    const force = false
    this.aceEditor.resize(force)
  }
}

/**
 * Set json data in the formatter
 * @param {*} json
 */
textmode.set = function (json) {
  this.setText(JSON.stringify(json, null, this.indentation))
}

/**
 * Update data. Same as calling `set` in text/code mode.
 * @param {*} json
 */
textmode.update = function (json) {
  this.updateText(JSON.stringify(json, null, this.indentation))
}

/**
 * Get json data from the formatter
 * @return {*} json
 */
textmode.get = function () {
  const text = this.getText()

  return parse(text) // this can throw an error
}

/**
 * Get the text contents of the editor
 * @return {String} jsonText
 */
textmode.getText = function () {
  if (this.textarea) {
    return this.textarea.value
  }
  if (this.aceEditor) {
    return this.aceEditor.getValue()
  }
  return ''
}

/**
 * Set the text contents of the editor and optionally clear the history
 * @param {String} jsonText
 * @param {boolean} clearHistory   Only applicable for mode 'code'
 * @private
 */
textmode._setText = function (jsonText, clearHistory) {
  const text = (this.options.escapeUnicode === true)
    ? escapeUnicodeChars(jsonText)
    : jsonText

  if (this.textarea) {
    this.textarea.value = text
  }
  if (this.aceEditor) {
    // prevent emitting onChange events while setting new text
    this.onChangeDisabled = true
    this.aceEditor.setValue(text, -1)
    this.onChangeDisabled = false

    if (clearHistory) {
      // prevent initial undo action clearing the initial contents
      const me = this
      setTimeout(() => {
        if (me.aceEditor) {
          me.aceEditor.session.getUndoManager().reset()
        }
      })
    }

    setTimeout(() => this._updateHistoryButtons())
  }

  // validate JSON schema
  this._debouncedValidate()
}

/**
 * Set the text contents of the editor
 * @param {String} jsonText
 */
textmode.setText = function (jsonText) {
  this._setText(jsonText, true)
}

/**
 * Update the text contents
 * @param {string} jsonText
 */
textmode.updateText = function (jsonText) {
  // don't update if there are no changes
  if (this.getText() === jsonText) {
    return
  }

  this._setText(jsonText, false)
}

/**
 * Validate current JSON object against the configured JSON schema
 * Throws an exception when no JSON schema is configured
 */
textmode.validate = function () {
  let schemaErrors = []
  let parseErrors = []
  let json
  try {
    json = this.get() // this can fail when there is no valid json

    // execute JSON schema validation (ajv)
    if (this.validateSchema) {
      const valid = this.validateSchema(json)
      if (!valid) {
        schemaErrors = this.validateSchema.errors.map(error => {
          error.type = 'validation'
          return improveSchemaError(error)
        })
      }
    }

    // execute custom validation and after than merge and render all errors
    // TODO: implement a better mechanism for only using the last validation action
    this.validationSequence = (this.validationSequence || 0) + 1
    const me = this
    const seq = this.validationSequence
    validateCustom(json, this.options.onValidate)
      .then(customValidationErrors => {
        // only apply when there was no other validation started whilst resolving async results
        if (seq === me.validationSequence) {
          const errors = schemaErrors.concat(parseErrors).concat(customValidationErrors)
          me._renderErrors(errors)
          if (typeof this.options.onValidationError === 'function') {
            if (isValidationErrorChanged(errors, this.lastSchemaErrors)) {
              this.options.onValidationError.call(this, errors)
            }
            this.lastSchemaErrors = errors
          }
        }
      })
      .catch(err => {
        console.error('Custom validation function did throw an error', err)
      })
  } catch (err) {
    if (this.getText()) {
      // try to extract the line number from the jsonlint error message
      const match = /\w*line\s*(\d+)\w*/g.exec(err.message)
      let line
      if (match) {
        line = +match[1]
      }
      parseErrors = [{
        type: 'error',
        message: err.message.replace(/\n/g, '<br>'),
        line: line
      }]
    }

    this._renderErrors(parseErrors)

    if (typeof this.options.onValidationError === 'function') {
      if (isValidationErrorChanged(parseErrors, this.lastSchemaErrors)) {
        this.options.onValidationError.call(this, parseErrors)
      }
      this.lastSchemaErrors = parseErrors
    }
  }
}

textmode._renderErrors = function (errors) {
  const jsonText = this.getText()
  const errorPaths = []
  errors.reduce((acc, curr) => {
    if (typeof curr.dataPath === 'string' && acc.indexOf(curr.dataPath) === -1) {
      acc.push(curr.dataPath)
    }
    return acc
  }, errorPaths)
  const errorLocations = getPositionForPath(jsonText, errorPaths)

  // render annotations in Ace Editor (if any)
  if (this.aceEditor) {
    this.annotations = errorLocations.map(errLoc => {
      const validationErrors = errors.filter(err => err.dataPath === errLoc.path)
      const message = validationErrors.map(err => err.message).join('\n')
      if (message) {
        return {
          row: errLoc.line,
          column: errLoc.column,
          text: 'Schema validation error' + (validationErrors.length !== 1 ? 's' : '') + ': \n' + message,
          type: 'warning',
          source: 'jsoneditor'
        }
      }

      return {}
    })
    this._refreshAnnotations()
  }

  // render errors in the errors table (if any)
  this.errorTable.setErrors(errors, errorLocations)

  // update the height of the ace editor
  if (this.aceEditor) {
    const force = false
    this.aceEditor.resize(force)
  }
}

/**
 * Get the selection details
 * @returns {{start:{row:Number, column:Number},end:{row:Number, column:Number},text:String}}
 */
textmode.getTextSelection = function () {
  let selection = {}
  if (this.textarea) {
    const selectionRange = getInputSelection(this.textarea)

    if (this.cursorInfo && this.cursorInfo.line === selectionRange.end.row && this.cursorInfo.column === selectionRange.end.column) {
      // selection direction is bottom => up
      selection.start = selectionRange.end
      selection.end = selectionRange.start
    } else {
      selection = selectionRange
    }

    return {
      start: selection.start,
      end: selection.end,
      text: this.textarea.value.substring(selectionRange.startIndex, selectionRange.endIndex)
    }
  }

  if (this.aceEditor) {
    const aceSelection = this.aceEditor.getSelection()
    const selectedText = this.aceEditor.getSelectedText()
    const range = aceSelection.getRange()
    const lead = aceSelection.getSelectionLead()

    if (lead.row === range.end.row && lead.column === range.end.column) {
      selection = range
    } else {
      // selection direction is bottom => up
      selection.start = range.end
      selection.end = range.start
    }

    return {
      start: {
        row: selection.start.row + 1,
        column: selection.start.column + 1
      },
      end: {
        row: selection.end.row + 1,
        column: selection.end.column + 1
      },
      text: selectedText
    }
  }
}

/**
 * Callback registration for selection change
 * @param {selectionCallback} callback
 *
 * @callback selectionCallback
 */
textmode.onTextSelectionChange = function (callback) {
  if (typeof callback === 'function') {
    this._selectionChangedHandler = debounce(callback, this.DEBOUNCE_INTERVAL)
  }
}

/**
 * Set selection on editor's text
 * @param {{row:Number, column:Number}} startPos selection start position
 * @param {{row:Number, column:Number}} endPos selected end position
 */
textmode.setTextSelection = function (startPos, endPos) {
  if (!startPos || !endPos) return

  if (this.textarea) {
    const startIndex = getIndexForPosition(this.textarea, startPos.row, startPos.column)
    const endIndex = getIndexForPosition(this.textarea, endPos.row, endPos.column)
    if (startIndex > -1 && endIndex > -1) {
      if (this.textarea.setSelectionRange) {
        this.textarea.focus()
        this.textarea.setSelectionRange(startIndex, endIndex)
      } else if (this.textarea.createTextRange) { // IE < 9
        const range = this.textarea.createTextRange()
        range.collapse(true)
        range.moveEnd('character', endIndex)
        range.moveStart('character', startIndex)
        range.select()
      }
      const rows = (this.textarea.value.match(/\n/g) || []).length + 1
      const lineHeight = this.textarea.scrollHeight / rows
      const selectionScrollPos = (startPos.row * lineHeight)
      this.textarea.scrollTop = selectionScrollPos > this.textarea.clientHeight ? (selectionScrollPos - (this.textarea.clientHeight / 2)) : 0
    }
  } else if (this.aceEditor) {
    const range = {
      start: {
        row: startPos.row - 1,
        column: startPos.column - 1
      },
      end: {
        row: endPos.row - 1,
        column: endPos.column - 1
      }
    }
    this.aceEditor.selection.setRange(range)
    this.aceEditor.scrollToLine(startPos.row - 1, true)
  }
}

function load () {
  try {
    this.format()
  } catch (err) {
    // in case of an error, just move on, failing formatting is not a big deal
  }
}

// define modes
export const textModeMixins = [
  {
    mode: 'text',
    mixin: textmode,
    data: 'text',
    load: load
  },
  {
    mode: 'code',
    mixin: textmode,
    data: 'text',
    load: load
  }
]
