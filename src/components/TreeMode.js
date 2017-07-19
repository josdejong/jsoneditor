// @flow weak

import { createElement as h, Component } from 'react'
import jump from '../assets/jump.js/src/jump'
import Ajv from 'ajv'

import { updateIn, getIn, setIn } from '../utils/immutabilityHelpers'
import { parseJSON } from '../utils/jsonUtils'
import { enrichSchemaError } from '../utils/schemaUtils'
import {
    jsonToData, dataToJson, toDataPath, patchData, pathExists,
    expand, expandPath, addErrors,
    search, addSearchResults, nextSearchResult, previousSearchResult,
    compileJSONPointer
} from '../jsonData'
import {
    duplicate, insert, append, remove,
    changeType, changeValue, changeProperty, sort
} from '../actions'
import JSONNode from './JSONNode'
import JSONNodeView from './JSONNodeView'
import JSONNodeForm from './JSONNodeForm'
import ModeButton from './menu/ModeButton'
import Search from './menu/Search'
import {
  moveUp, moveDown, moveLeft, moveRight, moveDownSibling,
  findNode, selectFind, searchHasFocus, setSelection
} from './utils/domSelector'
import { keyComboFromEvent } from '../utils/keyBindings'

import type { JSONData, JSONPatch } from '../types'

const AJV_OPTIONS = {
  allErrors: true,
  verbose: true,
  jsonPointers: true
}

const MAX_HISTORY_ITEMS = 1000   // maximum number of undo/redo items to be kept in memory
const SEARCH_DEBOUNCE = 300      // milliseconds
const SCROLL_DURATION = 400      // milliseconds

// TODO: make key bindings configurable
// TODO: implement support for namespaces for key bindings
const KEY_BINDINGS = {
  'duplicate':    ['Ctrl+D', 'Command+D'],
  'insert':       ['Ctrl+Insert', 'Command+Insert'],
  'remove':       ['Ctrl+Delete', 'Command+Delete'],
  'actionMenu':   ['Ctrl+M', 'Command+M'],
  'find':         ['Ctrl+F', 'Command+F'],
  'findNext':     ['F3', 'Ctrl+G', 'Command+G'],
  'findPrevious': ['Shift+F3', 'Ctrl+Shift+G', 'Command+Shift+G'],
  'up':           ['Alt+Up', 'Option+Up'],
  'down':         ['Alt+Down', 'Option+Down'],
  'left':         ['Alt+Left', 'Option+Left'],
  'right':        ['Alt+Right', 'Option+Right'],
  'openUrl':      ['Ctrl+Enter', 'Command+Enter']
  // TODO: implement all quick keys
  // Ctrl+Shift+Arrow Up/Down	Select multiple fields
  // Shift+Alt+Arrows	Move current field or selected fields up/down/left/right
  // Ctrl+Z	Undo last action
  // Ctrl+Shift+Z	Redo
}

export default class TreeMode extends Component {
  id: number
  state: Object

  keyDownActions = {
    'up': (event) => moveUp(event.target),
    'down': (event) => moveDown(event.target),
    'left': (event) => moveLeft(event.target),
    'right': (event) => moveRight(event.target),
    'find': (event) => selectFind(event.target),
    'findNext': (event) => this.handleNext(),
    'findPrevious': (event) => this.handlePrevious()
  }

  constructor (props) {
    super(props)

    const data = jsonToData(this.props.data || {}, TreeMode.expandAll, [])

    this.id = Math.round(Math.random() * 1e5) // TODO: create a uuid here?

    this.state = {
      data,

      history: [data],
      historyIndex: 0,

      events: {
        onChangeProperty: this.handleChangeProperty,
        onChangeValue: this.handleChangeValue,
        onChangeType: this.handleChangeType,
        onInsert: this.handleInsert,
        onAppend: this.handleAppend,
        onDuplicate: this.handleDuplicate,
        onRemove: this.handleRemove,
        onSort: this.handleSort,

        onExpand: this.handleExpand,

        // TODO: now we're passing not just events but also other methods. reorganize this or rename 'state.events'
        findKeyBinding: this.findKeyBinding
      },

      search: {
        text: '',
        active: null // active search result
      },

      keyCombos: this.bindingsByCombos (KEY_BINDINGS)
    }
  }

  componentWillMount () {
    this.applyProps(this.props, {})
  }

  componentWillReceiveProps (nextProps) {
    this.applyProps(nextProps, this.props)
  }

  // TODO: create some sort of watcher structure for these props? Is there a Reactpattern for that?
  applyProps (nextProps, currentProps) {
    // Apply text
    if (nextProps.text !== currentProps.text) {
      this.patch([{
        op: 'replace',
        path: '',
        value: parseJSON(nextProps.text) // FIXME: this can fail, handle error correctly
      }])
    }

    // Apply json
    if (nextProps.json !== currentProps.json) {
      this.patch([{
        op: 'replace',
        path: '',
        value: nextProps.json
      }])
    }

    // Apply JSON Schema
    if (nextProps.schema !== currentProps.schema) {
      this.setSchema(nextProps.schema)
    }

    // TODO: apply patchText
    // TODO: apply patch
  }

  render () {
    const { props, state } = this

    const Node = (props.mode === 'view')
        ? JSONNodeView
        : (props.mode === 'form')
            ? JSONNodeForm
            : JSONNode

    // enrich the data with JSON Schema errors
    let data = state.data
    const errors = this.getErrors()
    if (errors.length) {
      data = addErrors(data, this.getErrors())
    }

    // enrich the data with search results
    // TODO: performance improvements in search would be nice though it's acceptable right now
    const searchResults = this.state.search.text ? search(data, this.state.search.text) : null
    if (searchResults) {
      data = addSearchResults(data, searchResults, this.state.search.active)
    }

    return h('div', {
      className: `jsoneditor jsoneditor-mode-${props.mode}`,
      'onKeyDown': this.handleKeyDown,
      'data-jsoneditor': 'true'
    }, [
      this.renderMenu(searchResults),

      h('div', {
            key: 'contents',
            ref: 'contents',
            className: 'jsoneditor-contents jsoneditor-tree-contents',
            id: this.id
      },
        h('ul', {className: 'jsoneditor-list jsoneditor-root'},
          h(Node, {
            data,
            events: state.events,
            options: props,
            path: [],
            prop: null
          })
        )
      )
    ])
  }

  renderMenu (searchResults: Array) {
    let items = [
      h('button', {
        key: 'expand-all',
        className: 'jsoneditor-expand-all',
        title: 'Expand all objects and arrays',
        onClick: this.handleExpandAll
      }),
      h('button', {
        key: 'collapse-all',
        className: 'jsoneditor-collapse-all',
        title: 'Collapse all objects and arrays',
        onClick: this.handleCollapseAll
      })
    ]

    if (this.props.mode !== 'view' && this.props.history !== false) {
      items = items.concat([
        h('div', {key: 'history-separator', className: 'jsoneditor-vertical-menu-separator'}),

        h('button', {
          key: 'undo',
          className: 'jsoneditor-undo',
          title: 'Undo last action',
          disabled: !this.canUndo(),
          onClick: this.undo
        }),
        h('button', {
          key: 'redo',
          className: 'jsoneditor-redo',
          title: 'Redo',
          disabled: !this.canRedo(),
          onClick: this.redo
        })
      ])
    }

    if (this.props.modes ) {
      items = items.concat([
        h('div', {key: 'mode-separator', className: 'jsoneditor-vertical-menu-separator'}),

        h(ModeButton, {
          key: 'mode',
          modes: this.props.modes,
          mode: this.props.mode,
          onChangeMode: this.props.onChangeMode,
          onError: this.props.onError
        })
      ])
    }

    if (this.props.search !== false) {
      // option search is true or undefined
      items = items.concat([
        h('div', {key: 'search', className: 'jsoneditor-menu-panel-right'},
          h(Search, {
            text: this.state.search.text,
            searchResults,
            onChange: this.handleSearch,
            onNext: this.handleNext,
            onPrevious: this.handlePrevious,
            findKeyBinding: this.findKeyBinding,
            delay: SEARCH_DEBOUNCE
          })
        )
      ])
    }

    return h('div', {key: 'menu', className: 'jsoneditor-menu'}, items)
  }

  /**
   * Turn a map with key bindings by name into a map by combo
   * @param {Object.<String, Array.string>} keyBindings
   * @return {Object.<String, string>} Returns keyCombos
   */
  bindingsByCombos (keyBindings) {
    const keyCombos = {}

    Object.keys(keyBindings).forEach ((name) => {
      keyBindings[name].forEach(combo => keyCombos[combo.toUpperCase()] = name)
    })

    return keyCombos
  }

  findKeyBinding = (event) => {
    const keyCombo = keyComboFromEvent(event)

    return this.state.keyCombos[keyCombo.toUpperCase()] || null
  }

  /**
   * Validate the JSON against the configured JSON schema
   * Returns an array with the errors when not valid, returns an empty array
   * when valid.
   * @return {Array.<JSONSchemaError>}
   */
  getErrors () {
    if (this.state.compiledSchema) {
      const valid = this.state.compiledSchema(dataToJson(this.state.data))
      if (!valid) {
        return this.state.compiledSchema.errors.map(enrichSchemaError)
      }
    }

    return []
  }

  handleKeyDown = (event) => {
    const keyBinding = this.findKeyBinding(event)
    const action = this.keyDownActions[keyBinding]

    if (action) {
      event.preventDefault()
      action(event)
    }
  }

  /** @private */
  handleChangeValue = (path, value) => {
    this.handlePatch(changeValue(this.state.data, path, value))
  }

  /** @private */
  handleChangeProperty = (parentPath, oldProp, newProp) => {
    this.handlePatch(changeProperty(this.state.data, parentPath, oldProp, newProp))
  }

  /** @private */
  handleChangeType = (path, type) => {
    this.handlePatch(changeType(this.state.data, path, type))
  }

  /** @private */
  handleInsert = (path, type) => {
    this.handlePatch(insert(this.state.data, path, type))

    // apply focus to new node
    this.focusToNext(path)
  }

  /** @private */
  handleAppend = (parentPath, type) => {
    this.handlePatch(append(this.state.data, parentPath, type))

    // apply focus to new node
    this.focusToNext(parentPath)
  }

  /** @private */
  handleDuplicate = (path) => {
    this.handlePatch(duplicate(this.state.data, path))

    // apply focus to the duplicated node
    this.focusToNext(path)
  }

  /** @private */
  handleRemove = (path) => {
    // apply focus to next sibling element if existing, else to the previous element
    const fromElement = findNode(this.refs.contents, path)
    const success = moveDownSibling(fromElement, 'property')
    if (!success) {
      moveUp(fromElement, 'property')
    }

    this.handlePatch(remove(path))
  }

  /**
   * Move focus to the next search result
   * @param {Path} path
   */
  focusToNext (path) {
    // apply focus to new element
    setTimeout(() => {
      const element = findNode(this.refs.contents, path)
      if (element) {
        moveDown(element, 'property')
      }
    })
  }

  /** @private */
  handleSort = (path, order = null) => {
    this.handlePatch(sort(this.state.data, path, order))
  }

  /** @private */
  handleExpand = (path, expanded, recurse) => {
    if (recurse) {
      const dataPath = toDataPath(this.state.data, path)

      this.setState({
        data: updateIn(this.state.data, dataPath, function (child) {
          return expand(child, (path) => true, expanded)
        })
      })
    }
    else {
      this.setState({
        data: expand(this.state.data, path, expanded)
      })
    }
  }

  /** @private */
  handleExpandAll = () => {
    const expanded = true

    this.setState({
      data: expand(this.state.data, TreeMode.expandAll, expanded)
    })
  }

  /** @private */
  handleCollapseAll = () => {
    const expanded = false

    this.setState({
      data: expand(this.state.data, TreeMode.expandAll, expanded)
    })
  }

  /** @private */
  handleSearch = (text) => {
    const searchResults = search(this.state.data, text)

    if (searchResults.length > 0) {
      const active = searchResults[0]

      this.setState({
        search: { text, active },
        data: expandPath(this.state.data, active.path)
      })

      // scroll to active search result (on next tick, after this path has been expanded)
      setTimeout(() => this.scrollTo(active.path))
    }
    else {
      this.setState({
        search: { text, active: null }
      })
    }
  }

  /** @private */
  handleNext = () => {
    const searchResults = search(this.state.data, this.state.search.text)
    if (searchResults) {
      const next = nextSearchResult(searchResults, this.state.search.active)

      this.setState({
        search: setIn(this.state.search, ['active'], next),
        data: expandPath(this.state.data, next && next.path)
      })

      // scroll to the active result (on next tick, after this path has been expanded)
      setTimeout(() => {
        if (next && next.path) {
          this.scrollTo(next.path)

          if (!searchHasFocus()) {
            setSelection(this.refs.contents, next.path, next.type)
          }
        }
      })
    }
  }

  /** @private */
  handlePrevious = () => {
    const searchResults = search(this.state.data, this.state.search.text)
    if (searchResults) {
      const previous = previousSearchResult(searchResults, this.state.search.active)

      this.setState({
        search: setIn(this.state.search, ['active'], previous),
        data: expandPath(this.state.data, previous && previous.path)
      })

      // scroll to the active result (on next tick, after this path has been expanded)
      setTimeout(() => {
        if (previous && previous.path) {
          this.scrollTo(previous && previous.path)

          if (!searchHasFocus()) {
            setSelection(this.refs.contents, previous.path, previous.type)
          }
        }
      })
    }
  }

  /**
   * Apply a JSONPatch to the current JSON document and emit a change event
   * @param {JSONPatch} actions
   * @private
   */
  handlePatch = (actions) => {
    // apply changes
    const result = this.patch(actions)

    this.emitOnChange (actions, result.revert, result.data)
  }

  /**
   * Scroll the window vertically to the node with given path
   * @param {Path} path
   * @private
   */
  scrollTo = (path) => {
    const container = this.refs.contents
    const elem = container.querySelector(`div[data-path="${compileJSONPointer(path)}"]`)
    const offset = -(container.getBoundingClientRect().height / 4)

    if (elem) {
      jump(elem, { container, offset, duration: SCROLL_DURATION })
    }
  }

  /**
   * Emit an onChange event when there is a listener for it.
   * @private
   */
  emitOnChange (patch: JSONPatch, revert: JSONPatch, data: JSONData) {
    if (this.props.onPatch) {
      this.props.onPatch(patch, revert)
    }

    if (this.props.onChange || this.props.onChangeText) {
      const json = dataToJson(data)

      if (this.props.onChange) {
        this.props.onChange(json)
      }

      if (this.props.onChangeText) {
        const indentation = this.props.indentation || 2
        const text = JSON.stringify(json, null, indentation)

        this.props.onChangeText(text)
      }
    }
  }

  canUndo = () => {
    return this.state.historyIndex < this.state.history.length
  }

  canRedo = () => {
    return this.state.historyIndex > 0
  }

  undo = () => {
    if (this.canUndo()) {
      const history = this.state.history
      const historyIndex = this.state.historyIndex
      const historyItem = history[historyIndex]

      const result = patchData(this.state.data, historyItem.undo)

      this.setState({
        data: result.data,
        history,
        historyIndex: historyIndex + 1
      })

      this.emitOnChange (historyItem.undo, historyItem.redo, result.data)
    }
  }

  redo = () => {
    if (this.canRedo()) {
      const history = this.state.history
      const historyIndex = this.state.historyIndex - 1
      const historyItem = history[historyIndex]

      const result = patchData(this.state.data, historyItem.redo)

      this.setState({
        data: result.data,
        history,
        historyIndex
      })

      this.emitOnChange (historyItem.redo, historyItem.undo, result.data)
    }
  }

  /**
   * Apply a JSONPatch to the current JSON document
   * @param {JSONPatch} actions       JSONPatch actions
   * @param {PatchOptions} [options]  If no expand function is provided, the
   *                                  expanded state will be kept as is for
   *                                  existing paths. New paths will be fully
   *                                  expanded.
   * @return {JSONPatchResult} Returns a JSONPatch result containing the
   *                           patch, a patch to revert the action, and
   *                           an error object which is null when successful
   */
  patch (actions, options = {}) {
    if (!Array.isArray(actions)) {
      throw new TypeError('Array with patch actions expected')
    }

    const expand = options.expand || (path => this.expandKeepOrExpandAll(path))
    const result = patchData(this.state.data, actions, expand)
    const data = result.data

    if (this.props.history != false) {
      // update data and store history
      const historyItem = {
        redo: actions,
        undo: result.revert
      }

      const history = [historyItem]
          .concat(this.state.history.slice(this.state.historyIndex))
          .slice(0, MAX_HISTORY_ITEMS)

      this.setState({
        data,
        history,
        historyIndex: 0
      })
    }
    else {
      // update data and don't store history
      this.setState({ data })
    }

    return {
      patch: actions,
      revert: result.revert,
      error: result.error,
      data  // FIXME: shouldn't pass data here
    }
  }

  /**
   * Set JSON object in editor
   * @param {Object | Array | string | number | boolean | null} json   JSON data
   */
  set (json) {
    // FIXME: when both json and expand are being changed via React, this.props must be updated before set(json) is called
    // TODO: document option expand
    const expand = this.props.expand || TreeMode.expandRoot

    this.setState({
      data: jsonToData(json, expand, []),

      // TODO: do we want to keep history when .set(json) is called? (currently we remove history)
      history: [],
      historyIndex: 0
    })
  }

  /**
   * Get JSON from the editor
   * @returns {Object | Array | string | number | boolean | null} json
   */
  get () {
    return dataToJson(this.state.data)
  }

  /**
   * Set a string containing a JSON document
   * @param {string} text
   */
  setText (text) {
    this.set(parseJSON(text))
  }

  /**
   * Get the JSON document as text
   * @return {string} text
   */
  getText () {
    const indentation = this.props.indentation || 2
    return JSON.stringify(this.get(), null, indentation)
  }

  /**
   * Set a JSON schema for validation of the JSON object.
   * To remove the schema, call JSONEditor.setSchema(null)
   * @param {Object | null} schema
   */
  // TODO: deduplicate this function, it's also implemented in TextMode
  setSchema (schema) {
    if (schema) {
      const ajv = this.props.ajv || Ajv && Ajv(AJV_OPTIONS)

      if (!ajv) {
        throw new Error('Cannot validate JSON: ajv not available. ' +
            'Provide ajv via options or use a JSONEditor bundle including ajv.')
      }

      this.setState({
        compiledSchema: ajv.compile(schema)
      })
    }
    else {
      this.setState({
        compiledSchema: null
      })
    }
  }

  /**
   * Expand one or multiple objects or arrays
   * @param {Path | function (path: Path) : boolean} callback
   */
  expand (callback) {
    this.setState({
      data: expand(this.state.data, callback, true)
    })
  }

  /**
   * Collapse one or multiple objects or arrays
   * @param {Path | function (path: Path) : boolean} callback
   */
  collapse (callback) {
    this.setState({
      data: expand(this.state.data, callback, false)
    })
  }

  /**
   * Test whether a path exists in the editor
   * @param {Path} path
   */
  exists (path) {
    return pathExists(this.state.data, path)
  }

  /**
   * Test whether an Array or Object at a certain path is expanded.
   * When the node does not exist, the function throws an error
   * @param {Path} path
   * @return {boolean} Returns true when expanded, false otherwise
   */
  isExpanded (path) {
    return getIn(this.state.data, toDataPath(this.state.data, path)).expanded
  }

  /**
   * Expand function which keeps the expanded state the same as the current data.
   * When the path doesn't yet exist, it will be expanded.
   * @param {Path} path
   * @return {boolean}
   */
  expandKeepOrExpandAll (path) {
    return this.exists(path)
        ? this.isExpanded(path)
        : TreeMode.expandAll(path)
  }

  /**
   * Default function to determine whether or not to expand a node initially
   *
   * Rule: expand the root node only
   *
   * @param {Array.<string>} path
   * @return {boolean}
   */
  static expandRoot (path) {
    return path.length === 0
  }

  /**
   * Callback function to expand all nodes
   *
   * @param {Array.<string>} path
   * @return {boolean}
   */
  static expandAll (path) {
    return true
  }
}


// TODO: describe PropTypes