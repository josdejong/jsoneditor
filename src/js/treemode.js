'use strict'

import VanillaPicker from './vanilla-picker'
import { Highlighter } from './Highlighter'
import { NodeHistory } from './NodeHistory'
import { SearchBox } from './SearchBox'
import { ContextMenu } from './ContextMenu'
import { TreePath } from './TreePath'
import { Node } from './Node'
import { ModeSwitcher } from './ModeSwitcher'
import { FocusTracker } from './FocusTracker'
import {
  addClassName,
  addEventListener,
  debounce,
  getAbsoluteTop,
  getSelectionOffset,
  hasParentNode,
  improveSchemaError,
  isPromise,
  isValidValidationError,
  parse,
  removeClassName,
  removeEventListener,
  repair,
  selectContentEditable,
  setSelectionOffset,
  isValidationErrorChanged
} from './util'
import { autocomplete } from './autocomplete'
import { setLanguage, setLanguages, translate } from './i18n'
import { createQuery, executeQuery } from './jmespathQuery'

// create a mixin with the functions for tree mode
const treemode = {}

/**
 * Create a tree editor
 * @param {Element} container    Container element
 * @param {Object} [options]   Object with options. See docs for details.
 * @private
 */
treemode.create = function (container, options) {
  if (!container) {
    throw new Error('No container element provided.')
  }
  this.container = container
  this.dom = {}
  this.highlighter = new Highlighter()
  this.selection = undefined // will hold the last input selection
  this.multiselection = {
    nodes: []
  }
  this.validateSchema = null // will be set in .setSchema(schema)
  this.validationSequence = 0
  this.errorNodes = []
  this.lastSchemaErrors = undefined

  this.node = null
  this.focusTarget = null

  this._setOptions(options)

  if (options.autocomplete) { this.autocomplete = autocomplete(options.autocomplete) }

  if (this.options.history && this.options.mode !== 'view') {
    this.history = new NodeHistory(this)
  }

  this._createFrame()
  this._createTable()
}

/**
 * Destroy the editor. Clean up DOM, event listeners, and web workers.
 */
treemode.destroy = function () {
  if (this.frame && this.container && this.frame.parentNode === this.container) {
    this.container.removeChild(this.frame)
    this.frame = null
  }
  this.container = null

  this.dom = null

  this.clear()
  this.node = null
  this.focusTarget = null
  this.selection = null
  this.multiselection = null
  this.errorNodes = null
  this.validateSchema = null
  this._debouncedValidate = null

  if (this.history) {
    this.history.destroy()
    this.history = null
  }

  if (this.searchBox) {
    this.searchBox.destroy()
    this.searchBox = null
  }

  if (this.modeSwitcher) {
    this.modeSwitcher.destroy()
    this.modeSwitcher = null
  }

  // Removing the FocusTracker set to track the editor's focus event
  this.frameFocusTracker.destroy()
}

/**
 * Initialize and set default options
 * @param {Object}  [options]    See description in constructor
 * @private
 */
treemode._setOptions = function (options) {
  this.options = {
    search: true,
    history: true,
    mode: 'tree',
    name: undefined, // field name of root node
    schema: null,
    schemaRefs: null,
    autocomplete: null,
    navigationBar: true,
    mainMenuBar: true,
    limitDragging: false,
    onSelectionChange: null,
    colorPicker: true,
    onColorPicker: function (parent, color, onChange) {
      if (VanillaPicker) {
        // we'll render the color picker on top
        // when there is not enough space below, and there is enough space above
        const pickerHeight = 300 // estimated height of the color picker
        const top = parent.getBoundingClientRect().top
        const windowHeight = window.innerHeight
        const showOnTop = ((windowHeight - top) < pickerHeight && top > pickerHeight)

        new VanillaPicker({
          parent: parent,
          color: color,
          popup: showOnTop ? 'top' : 'bottom',
          onDone: function (color) {
            const alpha = color.rgba[3]
            const hex = (alpha === 1)
              ? color.hex.substr(0, 7) // return #RRGGBB
              : color.hex // return #RRGGBBAA
            onChange(hex)
          }
        }).show()
      } else {
        console.warn('Cannot open color picker: the `vanilla-picker` library is not included in the bundle. ' +
            'Either use the full bundle or implement your own color picker using `onColorPicker`.')
      }
    },
    timestampTag: true,
    timestampFormat: null,
    createQuery,
    executeQuery,
    onEvent: null,
    enableSort: true,
    enableTransform: true
  }

  // copy all options
  if (options) {
    Object.keys(options).forEach(prop => {
      this.options[prop] = options[prop]
    })

    // default limitDragging to true when a JSON schema is defined
    if (options.limitDragging == null && options.schema != null) {
      this.options.limitDragging = true
    }
  }

  // compile a JSON schema validator if a JSON schema is provided
  this.setSchema(this.options.schema, this.options.schemaRefs)

  // create a debounced validate function
  this._debouncedValidate = debounce(this.validate.bind(this), this.DEBOUNCE_INTERVAL)

  if (options.onSelectionChange) {
    this.onSelectionChange(options.onSelectionChange)
  }

  setLanguages(this.options.languages)
  setLanguage(this.options.language)
}

/**
 * Set new JSON object in editor.
 * Resets the state of the editor (expanded nodes, search, selection).
 *
 * @param {*} json
 */
treemode.set = function (json) {
  // verify if json is valid JSON, ignore when a function
  if (json instanceof Function || (json === undefined)) {
    this.clear()
  } else {
    this.content.removeChild(this.table) // Take the table offline

    // replace the root node
    const params = {
      field: this.options.name,
      value: json
    }
    const node = new Node(this, params)
    this._setRoot(node)

    // validate JSON schema (if configured)
    this.validate()

    // expand
    const recurse = false
    this.node.expand(recurse)

    this.content.appendChild(this.table) // Put the table online again
  }

  // TODO: maintain history, store last state and previous document
  if (this.history) {
    this.history.clear()
  }

  // clear search
  if (this.searchBox) {
    this.searchBox.clear()
  }
}

/**
 * Update JSON object in editor.
 * Maintains the state of the editor (expanded nodes, search, selection).
 *
 * @param {*} json
 */
treemode.update = function (json) {
  // don't update if there are no changes
  if (this.node.deepEqual(json)) {
    return
  }

  const selection = this.getSelection()

  // apply the changed json
  this.onChangeDisabled = true // don't fire an onChange event
  this.node.update(json)
  this.onChangeDisabled = false

  // validate JSON schema
  this.validate()

  // update search result if any
  if (this.searchBox && !this.searchBox.isEmpty()) {
    this.searchBox.forceSearch()
  }

  // update selection if any
  if (selection && selection.start && selection.end) {
    // only keep/update the selection if both start and end node still exists,
    // else we clear the selection
    const startNode = this.node.findNodeByPath(selection.start.path)
    const endNode = this.node.findNodeByPath(selection.end.path)
    if (startNode && endNode) {
      this.setSelection(selection.start, selection.end)
    } else {
      this.setSelection({}, {}) // clear selection
    }
  } else {
    this.setSelection({}, {}) // clear selection
  }
}

/**
 * Get JSON object from editor
 * @return {Object | undefined} json
 */
treemode.get = function () {
  // TODO: resolve pending debounced input changes if any, but do not resolve invalid inputs

  if (this.node) {
    return this.node.getValue()
  } else {
    return undefined
  }
}

/**
 * Get the text contents of the editor
 * @return {String} jsonText
 */
treemode.getText = function () {
  return JSON.stringify(this.get())
}

/**
 * Set the text contents of the editor.
 * Resets the state of the editor (expanded nodes, search, selection).
 * @param {String} jsonText
 */
treemode.setText = function (jsonText) {
  try {
    this.set(parse(jsonText)) // this can throw an error
  } catch (err) {
    // try to repair json, replace JavaScript notation with JSON notation
    const repairedJsonText = repair(jsonText)

    // try to parse again
    this.set(parse(repairedJsonText)) // this can throw an error
  }
}

/**
 * Update the text contents of the editor.
 * Maintains the state of the editor (expanded nodes, search, selection).
 * @param {String} jsonText
 */
treemode.updateText = function (jsonText) {
  try {
    this.update(parse(jsonText)) // this can throw an error
  } catch (err) {
    // try to repair json, replace JavaScript notation with JSON notation
    const repairJsonText = repair(jsonText)

    // try to parse again
    this.update(parse(repairJsonText)) // this can throw an error
  }
}

/**
 * Set a field name for the root node.
 * @param {String | undefined} name
 */
treemode.setName = function (name) {
  this.options.name = name
  if (this.node) {
    this.node.updateField(this.options.name)
  }
}

/**
 * Get the field name for the root node.
 * @return {String | undefined} name
 */
treemode.getName = function () {
  return this.options.name
}

/**
 * Set focus to the editor. Focus will be set to:
 * - the first editable field or value, or else
 * - to the expand button of the root node, or else
 * - to the context menu button of the root node, or else
 * - to the first button in the top menu
 */
treemode.focus = function () {
  let input = this.scrollableContent.querySelector('[contenteditable=true]')
  if (input) {
    input.focus()
  } else if (this.node.dom.expand) {
    this.node.dom.expand.focus()
  } else if (this.node.dom.menu) {
    this.node.dom.menu.focus()
  } else {
    // focus to the first button in the menu
    input = this.frame.querySelector('button')
    if (input) {
      input.focus()
    }
  }
}

/**
 * Remove the root node from the editor
 */
treemode.clear = function () {
  if (this.node) {
    this.node.hide()
    delete this.node
  }

  if (this.treePath) {
    this.treePath.reset()
  }
}

/**
 * Set the root node for the json editor
 * @param {Node} node
 * @private
 */
treemode._setRoot = function (node) {
  this.clear()

  this.node = node
  node.setParent(null)
  node.setField(this.getName(), false)
  delete node.index

  // append to the dom
  this.tbody.appendChild(node.getDom())
}

/**
 * Search text in all nodes
 * The nodes will be expanded when the text is found one of its childs,
 * else it will be collapsed. Searches are case insensitive.
 * @param {String} text
 * @return {Object[]} results  Array with nodes containing the search results
 *                             The result objects contains fields:
 *                             - {Node} node,
 *                             - {String} elem  the dom element name where
 *                                              the result is found ('field' or
 *                                              'value')
 */
treemode.search = function (text) {
  let results
  if (this.node) {
    this.content.removeChild(this.table) // Take the table offline
    results = this.node.search(text)
    this.content.appendChild(this.table) // Put the table online again
  } else {
    results = []
  }

  return results
}

/**
 * Expand all nodes
 */
treemode.expandAll = function () {
  if (this.node) {
    this.content.removeChild(this.table) // Take the table offline
    this.node.expand()
    this.content.appendChild(this.table) // Put the table online again
  }
}

/**
 * Collapse all nodes
 */
treemode.collapseAll = function () {
  if (this.node) {
    this.content.removeChild(this.table) // Take the table offline
    this.node.collapse()
    this.content.appendChild(this.table) // Put the table online again
  }
}

/**
 * The method onChange is called whenever a field or value is changed, created,
 * deleted, duplicated, etc.
 * @param {String} action  Change action. Available values: "editField",
 *                         "editValue", "changeType", "appendNode",
 *                         "removeNode", "duplicateNode", "moveNode", "expand",
 *                         "collapse".
 * @param {Object} params  Object containing parameters describing the change.
 *                         The parameters in params depend on the action (for
 *                         example for "editValue" the Node, old value, and new
 *                         value are provided). params contains all information
 *                         needed to undo or redo the action.
 * @private
 */
treemode._onAction = function (action, params) {
  // add an action to the history
  if (this.history) {
    this.history.add(action, params)
  }

  this._onChange()
}

/**
 * Handle a change:
 * - Validate JSON schema
 * - Send a callback to the onChange listener if provided
 * @private
 */
treemode._onChange = function () {
  if (this.onChangeDisabled) {
    return
  }

  // selection can be changed after undo/redo
  this.selection = this.getDomSelection()

  // validate JSON schema (if configured)
  this._debouncedValidate()

  if (this.treePath) {
    const selectedNode = (this.node && this.selection)
      ? this.node.findNodeByInternalPath(this.selection.path)
      : this.multiselection
        ? this.multiselection.nodes[0]
        : undefined

    if (selectedNode) {
      this._updateTreePath(selectedNode.getNodePath())
    } else {
      this.treePath.reset()
    }
  }

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

  // trigger the onClassName callback
  if (this.options.onClassName) {
    this.node.recursivelyUpdateCssClassesOnNodes()
  }

  // trigger the onNodeName callback
  if (this.options.onNodeName && this.node.childs) {
    try {
      this.node.recursivelyUpdateNodeName()
    } catch (err) {
      console.error('Error in onNodeName callback: ', err)
    }
  }
}

/**
 * Validate current JSON object against the configured JSON schema
 * Throws an exception when no JSON schema is configured
 */
treemode.validate = function () {
  const root = this.node
  if (!root) { // TODO: this should be redundant but is needed on mode switch
    return
  }

  const json = root.getValue()

  // execute JSON schema validation
  let schemaErrors = []
  if (this.validateSchema) {
    const valid = this.validateSchema(json)
    if (!valid) {
      // apply all new errors
      schemaErrors = this.validateSchema.errors
        .map(error => improveSchemaError(error))
        .map(function findNode (error) {
          return {
            node: root.findNode(error.dataPath),
            error: error,
            type: 'validation'
          }
        })
        .filter(function hasNode (entry) {
          return entry.node != null
        })
    }
  }

  // execute custom validation and after than merge and render all errors
  try {
    this.validationSequence++
    const me = this
    const seq = this.validationSequence
    this._validateCustom(json)
      .then(customValidationErrors => {
        // only apply when there was no other validation started whilst resolving async results
        if (seq === me.validationSequence) {
          const errorNodes = [].concat(schemaErrors, customValidationErrors || [])
          me._renderValidationErrors(errorNodes)
          if (typeof this.options.onValidationError === 'function') {
            if (isValidationErrorChanged(errorNodes, this.lastSchemaErrors)) {
              this.options.onValidationError.call(this, errorNodes)
            }
            this.lastSchemaErrors = errorNodes
          }
        }
      })
      .catch(err => {
        console.error(err)
      })
  } catch (err) {
    console.error(err)
  }
}

treemode._renderValidationErrors = function (errorNodes) {
  // clear all current errors
  if (this.errorNodes) {
    this.errorNodes.forEach(node => {
      node.setError(null)
    })
  }

  // render the new errors
  const parentPairs = errorNodes
    .reduce((all, entry) => entry.node
      .findParents()
      .filter(parent => !all.some(pair => pair[0] === parent))
      .map(parent => [parent, entry.node])
      .concat(all), [])

  this.errorNodes = parentPairs
    .map(pair => ({
      node: pair[0],
      child: pair[1],

      error: {
        message: pair[0].type === 'object'
          ? 'Contains invalid properties' // object
          : 'Contains invalid items' // array
      }
    }))
    .concat(errorNodes)
    .map(function setError (entry) {
      entry.node.setError(entry.error, entry.child)
      return entry.node
    })
}

/**
 * Execute custom validation if configured.
 *
 * Returns a promise resolving with the custom errors (or nothing).
 */
treemode._validateCustom = function (json) {
  try {
    if (this.options.onValidate) {
      const root = this.node
      const customValidateResults = this.options.onValidate(json)

      const resultPromise = isPromise(customValidateResults)
        ? customValidateResults
        : Promise.resolve(customValidateResults)

      return resultPromise.then(customValidationPathErrors => {
        if (Array.isArray(customValidationPathErrors)) {
          return customValidationPathErrors
            .filter(error => {
              const valid = isValidValidationError(error)

              if (!valid) {
                console.warn('Ignoring a custom validation error with invalid structure. ' +
                      'Expected structure: {path: [...], message: "..."}. ' +
                      'Actual error:', error)
              }

              return valid
            })
            .map(error => {
              let node
              try {
                node = (error && error.path) ? root.findNodeByPath(error.path) : null
              } catch (err) {
                // stay silent here, we throw a generic warning if no node is found
              }
              if (!node) {
                console.warn('Ignoring validation error: node not found. Path:', error.path, 'Error:', error)
              }

              return {
                node: node,
                error: error,
                type: 'customValidation'
              }
            })
            .filter(entry => entry && entry.node && entry.error && entry.error.message)
        } else {
          return null
        }
      })
    }
  } catch (err) {
    return Promise.reject(err)
  }

  return Promise.resolve(null)
}

/**
 * Refresh the rendered contents
 */
treemode.refresh = function () {
  if (this.node) {
    this.node.updateDom({ recurse: true })
  }
}

/**
 * Start autoscrolling when given mouse position is above the top of the
 * editor contents, or below the bottom.
 * @param {Number} mouseY  Absolute mouse position in pixels
 */
treemode.startAutoScroll = function (mouseY) {
  const me = this
  const content = this.scrollableContent
  const top = getAbsoluteTop(content)
  const height = content.clientHeight
  const bottom = top + height
  const margin = 24
  const interval = 50 // ms

  if ((mouseY < top + margin) && content.scrollTop > 0) {
    this.autoScrollStep = ((top + margin) - mouseY) / 3
  } else if (mouseY > bottom - margin &&
      height + content.scrollTop < content.scrollHeight) {
    this.autoScrollStep = ((bottom - margin) - mouseY) / 3
  } else {
    this.autoScrollStep = undefined
  }

  if (this.autoScrollStep) {
    if (!this.autoScrollTimer) {
      this.autoScrollTimer = setInterval(() => {
        if (me.autoScrollStep) {
          content.scrollTop -= me.autoScrollStep
        } else {
          me.stopAutoScroll()
        }
      }, interval)
    }
  } else {
    this.stopAutoScroll()
  }
}

/**
 * Stop auto scrolling. Only applicable when scrolling
 */
treemode.stopAutoScroll = function () {
  if (this.autoScrollTimer) {
    clearTimeout(this.autoScrollTimer)
    delete this.autoScrollTimer
  }
  if (this.autoScrollStep) {
    delete this.autoScrollStep
  }
}

/**
 * Set the focus to an element in the editor, set text selection, and
 * set scroll position.
 * @param {Object} selection  An object containing fields:
 *                            {Element | undefined} dom     The dom element
 *                                                          which has focus
 *                            {Range | TextRange} range     A text selection
 *                            {Node[]} nodes                Nodes in case of multi selection
 *                            {Number} scrollTop            Scroll position
 */
treemode.setDomSelection = function (selection) {
  if (!selection) {
    return
  }

  if ('scrollTop' in selection && this.scrollableContent) {
    // TODO: animated scroll
    this.scrollableContent.scrollTop = selection.scrollTop
  }
  if (selection.paths) {
    // multi-select
    const me = this
    const nodes = selection.paths.map(path => me.node.findNodeByInternalPath(path))

    this.select(nodes)
  } else {
    // find the actual DOM element where to apply the focus
    const node = selection.path
      ? this.node.findNodeByInternalPath(selection.path)
      : null
    const container = (node && selection.domName)
      ? node.dom[selection.domName]
      : null
    if (selection.range && container) {
      const range = Object.assign({}, selection.range, { container: container })
      setSelectionOffset(range)
    } else if (node) { // just a fallback
      node.focus()
    }
  }
}

/**
 * Get the current focus
 * @return {Object} selection An object containing fields:
 *                            {Element | undefined} dom     The dom element
 *                                                          which has focus
 *                            {Range | TextRange} range     A text selection
 *                            {Node[]} nodes                Nodes in case of multi selection
 *                            {Number} scrollTop            Scroll position
 */
treemode.getDomSelection = function () {
  // find the node and field name of the current target,
  // so we can store the current selection in a serializable
  // way (internal node path and domName)
  const node = Node.getNodeFromTarget(this.focusTarget)
  const focusTarget = this.focusTarget
  const domName = node
    ? Object.keys(node.dom).find(domName => node.dom[domName] === focusTarget)
    : null

  let range = getSelectionOffset()
  if (range && range.container.nodeName !== 'DIV') { // filter on (editable) divs)
    range = null
  }
  if (range && range.container !== focusTarget) {
    range = null
  }
  if (range) {
    // we cannot rely on the current instance of the container,
    // we need to store the internal node path and field and
    // find the actual DOM field when applying the selection
    delete range.container
  }

  return {
    path: node ? node.getInternalPath() : null,
    domName: domName,
    range: range,
    paths: this.multiselection.length > 0
      ? this.multiselection.nodes.map(node => node.getInternalPath())
      : null,
    scrollTop: this.scrollableContent ? this.scrollableContent.scrollTop : 0
  }
}

/**
 * Adjust the scroll position such that given top position is shown at 1/4
 * of the window height.
 * @param {Number} top
 * @param {function(boolean)} [animateCallback] Callback, executed when animation is
 *                                              finished. The callback returns true
 *                                              when animation is finished, or false
 *                                              when not.
 */
treemode.scrollTo = function (top, animateCallback) {
  const content = this.scrollableContent
  if (content) {
    const editor = this
    // cancel any running animation
    if (editor.animateTimeout) {
      clearTimeout(editor.animateTimeout)
      delete editor.animateTimeout
    }
    if (editor.animateCallback) {
      editor.animateCallback(false)
      delete editor.animateCallback
    }

    // calculate final scroll position
    const height = content.clientHeight
    const bottom = content.scrollHeight - height
    const finalScrollTop = Math.min(Math.max(top - height / 4, 0), bottom)

    // animate towards the new scroll position
    const animate = () => {
      const scrollTop = content.scrollTop
      const diff = (finalScrollTop - scrollTop)
      if (Math.abs(diff) > 3) {
        content.scrollTop += diff / 3
        editor.animateCallback = animateCallback
        editor.animateTimeout = setTimeout(animate, 50)
      } else {
        // finished
        if (animateCallback) {
          animateCallback(true)
        }
        content.scrollTop = finalScrollTop
        delete editor.animateTimeout
        delete editor.animateCallback
      }
    }
    animate()
  } else {
    if (animateCallback) {
      animateCallback(false)
    }
  }
}

/**
 * Create main frame
 * @private
 */
treemode._createFrame = function () {
  // create the frame
  this.frame = document.createElement('div')
  this.frame.className = 'jsoneditor jsoneditor-mode-' + this.options.mode
  // this.frame.setAttribute("tabindex","0");

  this.container.appendChild(this.frame)

  this.contentOuter = document.createElement('div')
  this.contentOuter.className = 'jsoneditor-outer'

  // create one global event listener to handle all events from all nodes
  const editor = this
  function onEvent (event) {
    // when switching to mode "code" or "text" via the menu, some events
    // are still fired whilst the _onEvent methods is already removed.
    if (editor._onEvent) {
      editor._onEvent(event)
    }
  }

  // setting the FocusTracker on 'this.frame' to track the editor's focus event
  const focusTrackerConfig = {
    target: this.frame,
    onFocus: this.options.onFocus || null,
    onBlur: this.options.onBlur || null
  }

  this.frameFocusTracker = new FocusTracker(focusTrackerConfig)

  this.frame.onclick = event => {
    const target = event.target// || event.srcElement;

    onEvent(event)

    // prevent default submit action of buttons when editor is located
    // inside a form
    if (target.nodeName === 'BUTTON') {
      event.preventDefault()
    }
  }
  this.frame.oninput = onEvent
  this.frame.onchange = onEvent
  this.frame.onkeydown = onEvent
  this.frame.onkeyup = onEvent
  this.frame.oncut = onEvent
  this.frame.onpaste = onEvent
  this.frame.onmousedown = onEvent
  this.frame.onmouseup = onEvent
  this.frame.onmouseover = onEvent
  this.frame.onmouseout = onEvent
  // Note: focus and blur events do not propagate, therefore they defined
  // using an eventListener with useCapture=true
  // see http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
  addEventListener(this.frame, 'focus', onEvent, true)
  addEventListener(this.frame, 'blur', onEvent, true)
  this.frame.onfocusin = onEvent // for IE
  this.frame.onfocusout = onEvent // for IE

  if (this.options.mainMenuBar) {
    addClassName(this.contentOuter, 'has-main-menu-bar')

    // create menu
    this.menu = document.createElement('div')
    this.menu.className = 'jsoneditor-menu'
    this.frame.appendChild(this.menu)

    // create expand all button
    const expandAll = document.createElement('button')
    expandAll.type = 'button'
    expandAll.className = 'jsoneditor-expand-all'
    expandAll.title = translate('expandAll')
    expandAll.onclick = () => {
      editor.expandAll()
    }
    this.menu.appendChild(expandAll)

    // create collapse all button
    const collapseAll = document.createElement('button')
    collapseAll.type = 'button'
    collapseAll.title = translate('collapseAll')
    collapseAll.className = 'jsoneditor-collapse-all'
    collapseAll.onclick = () => {
      editor.collapseAll()
    }
    this.menu.appendChild(collapseAll)

    // create sort button
    if (this.options.enableSort) {
      const sort = document.createElement('button')
      sort.type = 'button'
      sort.className = 'jsoneditor-sort'
      sort.title = translate('sortTitleShort')
      sort.onclick = () => {
        editor.node.showSortModal()
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
        editor.node.showTransformModal()
      }
      this.menu.appendChild(transform)
    }

    // create undo/redo buttons
    if (this.history) {
      // create undo button
      const undo = document.createElement('button')
      undo.type = 'button'
      undo.className = 'jsoneditor-undo jsoneditor-separator'
      undo.title = translate('undo')
      undo.onclick = () => {
        editor._onUndo()
      }
      this.menu.appendChild(undo)
      this.dom.undo = undo

      // create redo button
      const redo = document.createElement('button')
      redo.type = 'button'
      redo.className = 'jsoneditor-redo'
      redo.title = translate('redo')
      redo.onclick = () => {
        editor._onRedo()
      }
      this.menu.appendChild(redo)
      this.dom.redo = redo

      // register handler for onchange of history
      this.history.onChange = () => {
        undo.disabled = !editor.history.canUndo()
        redo.disabled = !editor.history.canRedo()
      }
      this.history.onChange()
    }

    // create mode box
    if (this.options && this.options.modes && this.options.modes.length) {
      const me = this
      this.modeSwitcher = new ModeSwitcher(this.menu, this.options.modes, this.options.mode, function onSwitch (mode) {
        // switch mode and restore focus
        me.setMode(mode)
        me.modeSwitcher.focus()
      })
    }

    // create search box
    if (this.options.search) {
      this.searchBox = new SearchBox(this, this.menu)
    }
  }

  if (this.options.navigationBar) {
    // create second menu row for treepath
    this.navBar = document.createElement('div')
    this.navBar.className = 'jsoneditor-navigation-bar nav-bar-empty'
    this.frame.appendChild(this.navBar)

    this.treePath = new TreePath(this.navBar, this.getPopupAnchor())
    this.treePath.onSectionSelected(this._onTreePathSectionSelected.bind(this))
    this.treePath.onContextMenuItemSelected(this._onTreePathMenuItemSelected.bind(this))
  }
}

/**
 * Perform an undo action
 * @private
 */
treemode._onUndo = function () {
  if (this.history) {
    // undo last action
    this.history.undo()

    // fire change event
    this._onChange()
  }
}

/**
 * Perform a redo action
 * @private
 */
treemode._onRedo = function () {
  if (this.history) {
    // redo last action
    this.history.redo()

    // fire change event
    this._onChange()
  }
}

/**
 * Event handler
 * @param event
 * @private
 */
treemode._onEvent = function (event) {
  // don't process events when coming from the color picker
  if (Node.targetIsColorPicker(event.target)) {
    return
  }

  const node = Node.getNodeFromTarget(event.target)

  if (event.type === 'keydown') {
    this._onKeyDown(event)
  }

  if (node && event.type === 'focus') {
    this.focusTarget = event.target
    if (this.options.autocomplete && this.options.autocomplete.trigger === 'focus') {
      this._showAutoComplete(event.target)
    }
  }

  if (event.type === 'mousedown') {
    this._startDragDistance(event)
  }
  if (event.type === 'mousemove' || event.type === 'mouseup' || event.type === 'click') {
    this._updateDragDistance(event)
  }

  if (node && this.options && this.options.navigationBar && node && (event.type === 'keydown' || event.type === 'mousedown')) {
    // apply on next tick, right after the new key press is applied
    const me = this
    setTimeout(() => {
      me._updateTreePath(node.getNodePath())
    })
  }

  if (node && node.selected) {
    if (event.type === 'click') {
      if (event.target === node.dom.menu) {
        this.showContextMenu(event.target)

        // stop propagation (else we will open the context menu of a single node)
        return
      }

      // deselect a multi selection
      if (!event.hasMoved) {
        this.deselect()
      }
    }

    if (event.type === 'mousedown') {
      // drag multiple nodes
      Node.onDragStart(this.multiselection.nodes, event)
    }
  } else {
    // filter mouse events in the contents part of the editor (not the main menu)
    if (event.type === 'mousedown' && hasParentNode(event.target, this.content)) {
      this.deselect()

      if (node && event.target === node.dom.drag) {
        // drag a singe node
        Node.onDragStart(node, event)
      } else if (!node || (event.target !== node.dom.field && event.target !== node.dom.value && event.target !== node.dom.select)) {
        // select multiple nodes
        this._onMultiSelectStart(event)
      }
    }
  }

  if (node) {
    node.onEvent(event)
  }
}

/**
 * Update TreePath components
 * @param {Array<Node>} pathNodes list of nodes in path from root to selection
 * @private
 */
treemode._updateTreePath = function (pathNodes) {
  if (pathNodes && pathNodes.length) {
    removeClassName(this.navBar, 'nav-bar-empty')

    const pathObjs = []
    pathNodes.forEach(node => {
      const pathObj = {
        name: getName(node),
        node: node,
        children: []
      }
      if (node.childs && node.childs.length) {
        node.childs.forEach(childNode => {
          pathObj.children.push({
            name: getName(childNode),
            node: childNode
          })
        })
      }
      pathObjs.push(pathObj)
    })
    this.treePath.setPath(pathObjs)
  } else {
    addClassName(this.navBar, 'nav-bar-empty')
  }

  function getName (node) {
    return node.parent
      ? ((node.parent.type === 'array') ? node.index : node.field)
      : (node.field || node.type)
  }
}

/**
 * Callback for tree path section selection - focus the selected node in the tree
 * @param {Object} pathObj path object that was represents the selected section node
 * @private
 */
treemode._onTreePathSectionSelected = pathObj => {
  if (pathObj && pathObj.node) {
    pathObj.node.expandTo()
    pathObj.node.focus()
  }
}

/**
 * Callback for tree path menu item selection - rebuild the path accrding to the new selection and focus the selected node in the tree
 * @param {Object} pathObj path object that was represents the parent section node
 * @param {String} selection selected section child
 * @private
 */
treemode._onTreePathMenuItemSelected = function (pathObj, selection) {
  if (pathObj && pathObj.children.length) {
    const selectionObj = pathObj.children.find(obj => obj.name === selection)
    if (selectionObj && selectionObj.node) {
      this._updateTreePath(selectionObj.node.getNodePath())
      selectionObj.node.expandTo()
      selectionObj.node.focus()
    }
  }
}

treemode._startDragDistance = function (event) {
  this.dragDistanceEvent = {
    initialTarget: event.target,
    initialPageX: event.pageX,
    initialPageY: event.pageY,
    dragDistance: 0,
    hasMoved: false
  }
}

treemode._updateDragDistance = function (event) {
  if (!this.dragDistanceEvent) {
    this._startDragDistance(event)
  }

  const diffX = event.pageX - this.dragDistanceEvent.initialPageX
  const diffY = event.pageY - this.dragDistanceEvent.initialPageY

  this.dragDistanceEvent.dragDistance = Math.sqrt(diffX * diffX + diffY * diffY)
  this.dragDistanceEvent.hasMoved =
      this.dragDistanceEvent.hasMoved || this.dragDistanceEvent.dragDistance > 10

  event.dragDistance = this.dragDistanceEvent.dragDistance
  event.hasMoved = this.dragDistanceEvent.hasMoved

  return event.dragDistance
}

/**
 * Start multi selection of nodes by dragging the mouse
 * @param event
 * @private
 */
treemode._onMultiSelectStart = function (event) {
  const node = Node.getNodeFromTarget(event.target)

  if (this.options.mode !== 'tree' || this.options.onEditable !== undefined) {
    // dragging not allowed in modes 'view' and 'form'
    // TODO: allow multiselection of items when option onEditable is specified
    return
  }

  this.multiselection = {
    start: node || null,
    end: null,
    nodes: []
  }

  this._startDragDistance(event)

  const editor = this
  if (!this.mousemove) {
    this.mousemove = addEventListener(window, 'mousemove', event => {
      editor._onMultiSelect(event)
    })
  }
  if (!this.mouseup) {
    this.mouseup = addEventListener(window, 'mouseup', event => {
      editor._onMultiSelectEnd(event)
    })
  }

  event.preventDefault()
}

/**
 * Multiselect nodes by dragging
 * @param event
 * @private
 */
treemode._onMultiSelect = function (event) {
  event.preventDefault()

  this._updateDragDistance(event)
  if (!event.hasMoved) {
    return
  }

  const node = Node.getNodeFromTarget(event.target)

  if (node) {
    if (this.multiselection.start == null) {
      this.multiselection.start = node
    }
    this.multiselection.end = node
  }

  // deselect previous selection
  this.deselect()

  // find the selected nodes in the range from first to last
  const start = this.multiselection.start
  const end = this.multiselection.end || this.multiselection.start
  if (start && end) {
    // find the top level childs, all having the same parent
    this.multiselection.nodes = this._findTopLevelNodes(start, end)
    if (this.multiselection.nodes && this.multiselection.nodes.length) {
      const firstNode = this.multiselection.nodes[0]
      if (this.multiselection.start === firstNode || this.multiselection.start.isDescendantOf(firstNode)) {
        this.multiselection.direction = 'down'
      } else {
        this.multiselection.direction = 'up'
      }
    }
    this.select(this.multiselection.nodes)
  }
}

/**
 * End of multiselect nodes by dragging
 * @private
 */
treemode._onMultiSelectEnd = function () {
  // set focus to the context menu button of the first node
  if (this.multiselection.nodes[0]) {
    this.multiselection.nodes[0].dom.menu.focus()
  }

  this.multiselection.start = null
  this.multiselection.end = null

  // cleanup global event listeners
  if (this.mousemove) {
    removeEventListener(window, 'mousemove', this.mousemove)
    delete this.mousemove
  }
  if (this.mouseup) {
    removeEventListener(window, 'mouseup', this.mouseup)
    delete this.mouseup
  }
}

/**
 * deselect currently selected nodes
 * @param {boolean} [clearStartAndEnd=false]  If true, the `start` and `end`
 *                                            state is cleared too.
 */
treemode.deselect = function (clearStartAndEnd) {
  const selectionChanged = !!this.multiselection.nodes.length
  this.multiselection.nodes.forEach(node => {
    node.setSelected(false)
  })
  this.multiselection.nodes = []

  if (clearStartAndEnd) {
    this.multiselection.start = null
    this.multiselection.end = null
  }

  if (selectionChanged) {
    if (this._selectionChangedHandler) {
      this._selectionChangedHandler()
    }
  }
}

/**
 * select nodes
 * @param {Node[] | Node} nodes
 */
treemode.select = function (nodes) {
  if (!Array.isArray(nodes)) {
    return this.select([nodes])
  }

  if (nodes) {
    this.deselect()

    this.multiselection.nodes = nodes.slice(0)

    const first = nodes[0]
    nodes.forEach(node => {
      node.expandPathToNode()
      node.setSelected(true, node === first)
    })

    if (this._selectionChangedHandler) {
      const selection = this.getSelection()
      this._selectionChangedHandler(selection.start, selection.end)
    }
  }
}

/**
 * From two arbitrary selected nodes, find their shared parent node.
 * From that parent node, select the two child nodes in the brances going to
 * nodes `start` and `end`, and select all childs in between.
 * @param {Node} start
 * @param {Node} end
 * @return {Array.<Node>} Returns an ordered list with child nodes
 * @private
 */
treemode._findTopLevelNodes = (start, end) => {
  const startPath = start.getNodePath()
  const endPath = end.getNodePath()
  let i = 0
  while (i < startPath.length && startPath[i] === endPath[i]) {
    i++
  }
  let root = startPath[i - 1]
  let startChild = startPath[i]
  let endChild = endPath[i]

  if (!startChild || !endChild) {
    if (root.parent) {
      // startChild is a parent of endChild or vice versa
      startChild = root
      endChild = root
      root = root.parent
    } else {
      // we have selected the root node (which doesn't have a parent)
      startChild = root.childs[0]
      endChild = root.childs[root.childs.length - 1]
    }
  }

  if (root && startChild && endChild) {
    const startIndex = root.childs.indexOf(startChild)
    const endIndex = root.childs.indexOf(endChild)
    const firstIndex = Math.min(startIndex, endIndex)
    const lastIndex = Math.max(startIndex, endIndex)

    return root.childs.slice(firstIndex, lastIndex + 1)
  } else {
    return []
  }
}

/**
 * Show autocomplete menu
 * @param {HTMLElement} element
 * @private
 */
treemode._showAutoComplete = function (element) {
  const node = Node.getNodeFromTarget(element)

  let jsonElementType = ''
  if (element.className.indexOf('jsoneditor-value') >= 0) jsonElementType = 'value'
  if (element.className.indexOf('jsoneditor-field') >= 0) jsonElementType = 'field'

  const self = this

  setTimeout(() => {
    if (node && (self.options.autocomplete.trigger === 'focus' || element.innerText.length > 0)) {
      const result = self.options.autocomplete.getOptions(element.innerText, node.getPath(), jsonElementType, node.editor)
      if (result === null) {
        self.autocomplete.hideDropDown()
      } else if (typeof result.then === 'function') {
        // probably a promise
        result
          .then(obj => {
            if (obj === null) {
              self.autocomplete.hideDropDown()
            } else if (obj.options) {
              self.autocomplete.show(element, obj.startFrom, obj.options)
            } else {
              self.autocomplete.show(element, 0, obj)
            }
          })
          .catch(err => {
            console.error(err)
          })
      } else {
        // definitely not a promise
        if (result.options) {
          self.autocomplete.show(element, result.startFrom, result.options)
        } else {
          self.autocomplete.show(element, 0, result)
        }
      }
    } else { self.autocomplete.hideDropDown() }
  }, 50)
}

/**
 * Event handler for keydown. Handles shortcut keys
 * @param {Event} event
 * @private
 */
treemode._onKeyDown = function (event) {
  const keynum = event.which || event.keyCode
  const altKey = event.altKey
  const ctrlKey = event.ctrlKey
  const metaKey = event.metaKey
  const shiftKey = event.shiftKey
  let handled = false
  const currentTarget = this.focusTarget

  if (keynum === 9) { // Tab or Shift+Tab
    const me = this
    setTimeout(() => {
      /*
          - Checking for change in focusTarget
          - Without the check,
            pressing tab after reaching the final DOM element in the editor will
            set the focus back to it than passing focus outside the editor
      */
      if (me.focusTarget !== currentTarget) {
        // select all text when moving focus to an editable div
        selectContentEditable(me.focusTarget)
      }
    }, 0)
  }

  if (this.searchBox) {
    if (ctrlKey && keynum === 70) { // Ctrl+F
      this.searchBox.dom.search.focus()
      this.searchBox.dom.search.select()
      handled = true
    } else if (keynum === 114 || (ctrlKey && keynum === 71)) { // F3 or Ctrl+G
      const focus = true
      if (!shiftKey) {
        // select next search result (F3 or Ctrl+G)
        this.searchBox.next(focus)
      } else {
        // select previous search result (Shift+F3 or Ctrl+Shift+G)
        this.searchBox.previous(focus)
      }

      handled = true
    }
  }

  if (this.history) {
    if (ctrlKey && !shiftKey && keynum === 90) { // Ctrl+Z
      // undo
      this._onUndo()
      handled = true
    } else if (ctrlKey && shiftKey && keynum === 90) { // Ctrl+Shift+Z
      // redo
      this._onRedo()
      handled = true
    }
  }

  if ((this.options.autocomplete) && (!handled)) {
    if (!ctrlKey && !altKey && !metaKey && (event.key.length === 1 || keynum === 8 || keynum === 46)) {
      handled = false
      // Activate autocomplete
      this._showAutoComplete(event.target)
    }
  }

  if (handled) {
    event.preventDefault()
    event.stopPropagation()
  }
}

/**
 * Create main table
 * @private
 */
treemode._createTable = function () {
  if (this.options.navigationBar) {
    addClassName(this.contentOuter, 'has-nav-bar')
  }

  this.scrollableContent = document.createElement('div')
  this.scrollableContent.className = 'jsoneditor-tree'
  this.contentOuter.appendChild(this.scrollableContent)

  // the jsoneditor-tree-inner div with bottom padding is here to
  // keep space for the action menu dropdown. It's created as a
  // separate div instead of using scrollableContent to work around
  // and issue in the Chrome browser showing scrollable contents outside of the div
  // see https://github.com/josdejong/jsoneditor/issues/557
  this.content = document.createElement('div')
  this.content.className = 'jsoneditor-tree-inner'
  this.scrollableContent.appendChild(this.content)

  this.table = document.createElement('table')
  this.table.className = 'jsoneditor-tree'
  this.content.appendChild(this.table)

  // create colgroup where the first two columns don't have a fixed
  // width, and the edit columns do have a fixed width
  let col
  this.colgroupContent = document.createElement('colgroup')
  if (this.options.mode === 'tree') {
    col = document.createElement('col')
    col.width = '24px'
    this.colgroupContent.appendChild(col)
  }
  col = document.createElement('col')
  col.width = '24px'
  this.colgroupContent.appendChild(col)
  col = document.createElement('col')
  this.colgroupContent.appendChild(col)
  this.table.appendChild(this.colgroupContent)

  this.tbody = document.createElement('tbody')
  this.table.appendChild(this.tbody)

  this.frame.appendChild(this.contentOuter)
}

/**
 * Show a contextmenu for this node.
 * Used for multiselection
 * @param {HTMLElement} anchor   Anchor element to attach the context menu to.
 * @param {function} [onClose]   Callback method called when the context menu
 *                               is being closed.
 */
treemode.showContextMenu = function (anchor, onClose) {
  let items = []
  const selectedNodes = this.multiselection.nodes.slice()

  // create duplicate button
  items.push({
    text: translate('duplicateText'),
    title: translate('duplicateTitle'),
    className: 'jsoneditor-duplicate',
    click: function () {
      Node.onDuplicate(selectedNodes)
    }
  })

  // create remove button
  items.push({
    text: translate('remove'),
    title: translate('removeTitle'),
    className: 'jsoneditor-remove',
    click: function () {
      Node.onRemove(selectedNodes)
    }
  })

  if (this.options.onCreateMenu) {
    const paths = selectedNodes.map(node => node.getPath())

    items = this.options.onCreateMenu(items, {
      type: 'multiple',
      path: paths[0],
      paths: paths
    })
  }

  const menu = new ContextMenu(items, { close: onClose })
  menu.show(anchor, this.getPopupAnchor())
}

treemode.getPopupAnchor = function () {
  return this.options.popupAnchor || this.frame
}

/**
 * Get current selected nodes
 * @return {{start:SerializableNode, end: SerializableNode}}
 */
treemode.getSelection = function () {
  const selection = {
    start: null,
    end: null
  }
  if (this.multiselection.nodes && this.multiselection.nodes.length) {
    if (this.multiselection.nodes.length) {
      const selection1 = this.multiselection.nodes[0]
      const selection2 = this.multiselection.nodes[this.multiselection.nodes.length - 1]
      if (this.multiselection.direction === 'down') {
        selection.start = selection1.serialize()
        selection.end = selection2.serialize()
      } else {
        selection.start = selection2.serialize()
        selection.end = selection1.serialize()
      }
    }
  }
  return selection
}

/**
 * Callback registration for selection change
 * @param {selectionCallback} callback
 *
 * @callback selectionCallback
 */
treemode.onSelectionChange = function (callback) {
  if (typeof callback === 'function') {
    this._selectionChangedHandler = debounce(callback, this.DEBOUNCE_INTERVAL)
  }
}

/**
 * Select range of nodes.
 * For selecting single node send only the start parameter
 * For clear the selection do not send any parameter
 * If the nodes are not from the same level the first common parent will be selected
 * @param {{path: Array.<String>}} start object contains the path for selection start
 * @param {{path: Array.<String>}} end object contains the path for selection end
 */
treemode.setSelection = function (start, end) {
  // check for old usage
  if (start && start.dom && start.range) {
    console.warn('setSelection/getSelection usage for text selection is deprecated and should not be used, see documentation for supported selection options')
    this.setDomSelection(start)
  }

  const nodes = this._getNodeInstancesByRange(start, end)

  nodes.forEach(node => {
    node.expandTo()
  })
  this.select(nodes)
}

/**
 * Returns a set of Nodes according to a range of selection
 * @param {{path: Array.<String>}} start object contains the path for range start
 * @param {{path: Array.<String>}=} end object contains the path for range end
 * @return {Array.<Node>} Node instances on the given range
 * @private
 */
treemode._getNodeInstancesByRange = function (start, end) {
  let startNode, endNode

  if (start && start.path) {
    startNode = this.node.findNodeByPath(start.path)
    if (end && end.path) {
      endNode = this.node.findNodeByPath(end.path)
    }
  }

  let nodes = []
  if (startNode instanceof Node) {
    if (endNode instanceof Node && endNode !== startNode) {
      if (startNode.parent === endNode.parent) {
        if (startNode.getIndex() < endNode.getIndex()) {
          start = startNode
          end = endNode
        } else {
          start = endNode
          end = startNode
        }
        let current = start
        nodes.push(current)
        do {
          current = current.nextSibling()
          nodes.push(current)
        } while (current && current !== end)
      } else {
        nodes = this._findTopLevelNodes(startNode, endNode)
      }
    } else {
      nodes.push(startNode)
    }
  }

  return nodes
}

treemode.getNodesByRange = function (start, end) {
  const nodes = this._getNodeInstancesByRange(start, end)
  const serializableNodes = []

  nodes.forEach(node => {
    serializableNodes.push(node.serialize())
  })

  return serializableNodes
}

// define modes
export const treeModeMixins = [
  {
    mode: 'tree',
    mixin: treemode,
    data: 'json'
  },
  {
    mode: 'view',
    mixin: treemode,
    data: 'json'
  },
  {
    mode: 'form',
    mixin: treemode,
    data: 'json'
  }
]
