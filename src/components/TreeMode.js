// @flow weak

import { createElement as h, Component } from 'react'
import isEqual from 'lodash/isEqual'
import reverse from 'lodash/reverse'
import initial from 'lodash/initial'
import last from 'lodash/last'
import Hammer from 'react-hammerjs'
import jump from '../assets/jump.js/src/jump'
import Ajv from 'ajv'

import { updateIn, getIn, setIn } from '../utils/immutabilityHelpers'
import { parseJSON } from '../utils/jsonUtils'
import { findUniqueName } from '../utils/stringUtils'
import { enrichSchemaError } from '../utils/schemaUtils'
import {
    jsonToEson, esonToJson, toEsonPath, pathExists,
    expand, expandPath, addErrors,
    search, applySearchResults, nextSearchResult, previousSearchResult,
    applySelection, pathsFromSelection, contentsFromPaths,
    compileJSONPointer, parseJSONPointer
} from '../eson'
import { patchEson } from '../patchEson'
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
  moveUp, moveDown, moveLeft, moveRight, moveDownSibling, moveHome, moveEnd,
  findNode, findBaseNode, selectFind, searchHasFocus, setSelection
} from './utils/domSelector'
import { createFindKeyBinding } from '../utils/keyBindings'
import { KEY_BINDINGS } from '../constants'

import type { ESON, ESONPatch, JSONPath, ESONSelection } from '../types'

const AJV_OPTIONS = {
  allErrors: true,
  verbose: true,
  jsonPointers: true
}

const MAX_HISTORY_ITEMS = 1000   // maximum number of undo/redo items to be kept in memory
const SEARCH_DEBOUNCE = 300      // milliseconds
const SCROLL_DURATION = 400      // milliseconds

export default class TreeMode extends Component {
  id: number
  state: Object

  keyDownActions = null

  constructor (props) {
    super(props)

    const data = jsonToEson(this.props.data || {}, TreeMode.expandAll, [])

    this.id = Math.round(Math.random() * 1e5) // TODO: create a uuid here?

    this.keyDownActions = {
      'up': this.moveUp,
      'down': this.moveDown,
      'left': this.moveLeft,
      'right': this.moveRight,
      'home': this.moveHome,
      'end': this.moveEnd,
      'cut': this.handleCut,
      'copy': this.handleCopy,
      'paste': this.handlePaste,
      'undo': this.handleUndo,
      'redo': this.handleRedo,
      'find': this.handleFocusFind,
      'findNext': this.handleNext,
      'findPrevious': this.handlePrevious
    }

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
        findKeyBinding: this.handleFindKeyBinding
      },

      search: {
        text: '',
        active: null // active search result
      },

      selection: {
        start: null, // ESONPointer
        end: null,   // ESONPointer
      },

      clipboard: null // array entries {prop: string, value: JSON}
    }
  }

  componentWillMount () {
    this.applyProps(this.props, {})
  }

  componentWillReceiveProps (nextProps) {
    this.applyProps(nextProps, this.props)
  }

  // TODO: create some sort of watcher structure for these props? Is there a React pattern for that?
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

    // Apply key bindings
    if (!this.findKeyBinding ||
        JSON.stringify(nextProps.keyBindings) !== JSON.stringify(currentProps.keyBindings)) {
      // merge default and custom key bindings
      const keyBindings = Object.assign({}, KEY_BINDINGS, nextProps.keyBindings)
      this.findKeyBinding = createFindKeyBinding(keyBindings)
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
      data = applySearchResults(data, searchResults, this.state.search.active)
    }
    if (this.state.selection) {
      data = applySelection(data, this.state.selection)
    }

    return h('div', {
      className: `jsoneditor jsoneditor-mode-${props.mode}`,
      onKeyDown: this.handleKeyDown,
      'data-jsoneditor': 'true'
    }, [
      this.renderMenu(searchResults),

      h('div', {
        key: 'contents',
        ref: 'contents',
        className: 'jsoneditor-contents jsoneditor-tree-contents'
      },
        h(Hammer, {
              id: this.id,
              direction:  'DIRECTION_VERTICAL',
              onTap: this.handleTap,
              onPanStart: this.handlePanStart,
              onPan: this.handlePan,
              onPanEnd: this.handlePanEnd
        },
          h('ul', {className: 'jsoneditor-list jsoneditor-root' + (data.selected ? ' jsoneditor-selected' : '')},
            h(Node, {
              data,
              events: state.events,
              options: props,
              path: [],
              prop: null
            })
          )
        )
      )
    ])
  }

  renderMenu (searchResults: [] | null) {
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
   * Validate the JSON against the configured JSON schema
   * Returns an array with the errors when not valid, returns an empty array
   * when valid.
   * @return {Array.<JSONSchemaError>}
   */
  getErrors () {
    if (this.state.compiledSchema) {
      const valid = this.state.compiledSchema(esonToJson(this.state.data))
      if (!valid) {
        return this.state.compiledSchema.errors.map(enrichSchemaError)
      }
    }

    return []
  }

  findKeyBinding = createFindKeyBinding(KEY_BINDINGS)

  handleKeyDown = (event) => {
    const keyBinding = this.findKeyBinding(event)
    const action = this.keyDownActions[keyBinding]

    if (action) {
      action(event)
    }
  }

  handleChangeValue = (path, value) => {
    this.handlePatch(changeValue(this.state.data, path, value))
  }

  handleChangeProperty = (parentPath, oldProp, newProp) => {
    this.handlePatch(changeProperty(this.state.data, parentPath, oldProp, newProp))
  }

  handleChangeType = (path, type) => {
    this.handlePatch(changeType(this.state.data, path, type))
  }

  handleInsert = (path, type) => {
    this.handlePatch(insert(this.state.data, path, type))

    // apply focus to new node
    this.focusToNext(path)
  }

  handleAppend = (parentPath, type) => {
    this.handlePatch(append(this.state.data, parentPath, type))

    // apply focus to new node
    this.focusToNext(parentPath)
  }

  handleDuplicate = (path) => {
    this.handlePatch(duplicate(this.state.data, path))

    // apply focus to the duplicated node
    this.focusToNext(path)
  }

  handleRemove = (path) => {
    // apply focus to next sibling element if existing, else to the previous element
    const fromElement = findNode(this.refs.contents, path)
    const success = moveDownSibling(fromElement, 'property')
    if (!success) {
      moveUp(fromElement, 'property')
    }

    this.handlePatch(remove(path))
  }

  moveUp = (event) => {
    event.preventDefault()
    moveUp(event.target)
  }

  moveDown = (event) => {
    event.preventDefault()
    moveDown(event.target)
  }

  moveLeft = (event) => {
    event.preventDefault()
    moveLeft(event.target)
  }

  moveRight = (event) => {
    event.preventDefault()
    moveRight(event.target)
  }

  moveHome = (event) => {
    event.preventDefault()
    moveHome(event.target)
  }

  moveEnd = (event) => {
    event.preventDefault()
    moveEnd(event.target)
  }

  handleCut = (event) => {
    const { data, selection } = this.state

    if (selection) {
      event.preventDefault()

      const paths = pathsFromSelection(data, selection)
      const clipboard = contentsFromPaths(data, paths)

      this.setState({ clipboard, selection: null })

      // note that we reverse the order, else we will mess up indices to be deleted in case of an array
      const patch = reverse(paths).map(path => ({op: 'remove', path: compileJSONPointer(path)}))

      this.handlePatch(patch)
    }
    else {
      // clear clipboard
      this.setState({ clipboard: null, selection: null })
    }
  }

  handleCopy = (event) => {
    const { data, selection } = this.state

    if (selection) {
      event.preventDefault()

      const paths = pathsFromSelection(data, selection)
      const clipboard = contentsFromPaths(data, paths)

      this.setState({ clipboard })
    }
    else {
      // clear clipboard
      this.setState({ clipboard: null, selection: null })
    }
  }

  handlePaste = (event) => {
    const { data, clipboard } = this.state

    if (clipboard && clipboard.length > 0) {
      event.preventDefault()

      // FIXME: handle pasting in an empty object or array

      const path = this.findDataPathFromElement(event.target)
      if (path && path.length > 0) {
        const parentPath = initial(path)
        const parent = getIn(data, toEsonPath(data, parentPath))
        const isObject = parent.type === 'Object'

        if (parent.type === 'Object') {
          const existingProps = parent.props.map(p => p.name)
          const prop = last(path)
          const patch = clipboard.map(entry => ({
            op: 'add',
            path: compileJSONPointer(parentPath.concat(findUniqueName(entry.name, existingProps))),
            value: entry.value,
            jsoneditor: { before: prop }
          }))

          this.handlePatch(patch)
        }
        else { // parent.type === 'Array'
          const patch = clipboard.map(entry => ({
            op: 'add',
            path: compileJSONPointer(path),
            value: entry.value
          }))

          this.handlePatch(patch)
        }
      }
    }
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

  handleSort = (path, order = null) => {
    this.handlePatch(sort(this.state.data, path, order))
  }

  handleExpand = (path, expanded, recurse) => {
    if (recurse) {
      const esonPath = toEsonPath(this.state.data, path)

      this.setState({
        data: updateIn(this.state.data, esonPath, function (child) {
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

  handleFindKeyBinding = (event) => {
    // findKeyBinding can change on the fly, so we can't bind it statically
    return this.findKeyBinding (event)
  }

  handleExpandAll = () => {
    const expanded = true

    this.setState({
      data: expand(this.state.data, TreeMode.expandAll, expanded)
    })
  }

  handleCollapseAll = () => {
    const expanded = false

    this.setState({
      data: expand(this.state.data, TreeMode.expandAll, expanded)
    })
  }

  handleSearch = (text) => {
    const searchResults = search(this.state.data, text)

    if (searchResults.length > 0) {
      const active = searchResults[0]

      this.setState({
        search: { text, active },
        data: expandPath(this.state.data, initial(active.path))
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

  handleFocusFind = (event) => {
    event.preventDefault()
    selectFind(event.target)
  }

  handleNext = (event) => {
    event.preventDefault()

    const searchResults = search(this.state.data, this.state.search.text)
    if (searchResults) {
      const next = nextSearchResult(searchResults, this.state.search.active)

      this.setState({
        search: setIn(this.state.search, ['active'], next),
        data: next ? expandPath(this.state.data, initial(next.path)) : this.state.data
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

  handlePrevious = (event) => {
    event.preventDefault()

    const searchResults = search(this.state.data, this.state.search.text)
    if (searchResults) {
      const previous = previousSearchResult(searchResults, this.state.search.active)

      this.setState({
        search: setIn(this.state.search, ['active'], previous),
        data: previous ? expandPath(this.state.data, initial(previous.path)) : this.state.data
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
   * Apply a ESONPatch to the current JSON document and emit a change event
   * @param {ESONPatch} actions
   * @private
   */
  handlePatch = (actions) => {
    // apply changes
    const result = this.patch(actions)

    this.emitOnChange (actions, result.revert, result.data)
  }

  handleTap = (event) => {
    if (this.state.selection) {
      this.setState({ selection: null })
    }
  }

  handlePanStart = (event) => {
    const path = this.findDataPathFromElement(event.target.firstChild)
    if (path) {
      this.setState({
        selection: {
          start: {path},
          end: {path}
        }
      })
    }
  }

  handlePan = (event) => {
    const path = this.findDataPathFromElement(event.target.firstChild)
    if (path && this.state.selection && !isEqual(path, this.state.selection.end.path)) {
      this.setState({
        selection: {
          start: this.state.selection.start,
          end: {path}
        }
      })
    }
  }

  handlePanEnd = (event) => {
    const path = this.findDataPathFromElement(event.target.firstChild)
    if (path) {
      // TODO: implement a better solution to keep focus in the editor than selecting the action menu. Most also be solved for undo/redo for example
      const element = findNode(this.refs.contents, path)
      const actionMenuButton = element && element.querySelector('button.jsoneditor-actionmenu')
      if (actionMenuButton) {
        actionMenuButton.focus()
      }
    }
  }

  findDataPathFromElement (element: Element) : JSONPath | null {
    const base = findBaseNode(element)
    const attr = base && base.getAttribute && base.getAttribute('data-path')

    // The .replace is to change paths like `/myarray/-` into `/myarray`
    return attr ? parseJSONPointer(attr.replace(/\/-$/, '')) : null
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
  emitOnChange (patch: ESONPatch, revert: ESONPatch, data: ESON) {
    if (this.props.onPatch) {
      this.props.onPatch(patch, revert)
    }

    if (this.props.onChange || this.props.onChangeText) {
      const json = esonToJson(data)

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

  handleUndo = (event) => {
    event.preventDefault()
    this.undo()
  }

  handleRedo = (event) => {
    event.preventDefault()
    this.redo()
  }

  canUndo = () => {
    return this.state.historyIndex < this.state.history.length
  }

  canRedo = () => {
    return this.state.historyIndex > 0
  }

  undo = () => {
    console.log('undo')
    if (this.canUndo()) {
      const history = this.state.history
      const historyIndex = this.state.historyIndex
      const historyItem = history[historyIndex]

      const result = patchEson(this.state.data, historyItem.undo)

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

      const result = patchEson(this.state.data, historyItem.redo)

      this.setState({
        data: result.data,
        history,
        historyIndex
      })

      this.emitOnChange (historyItem.redo, historyItem.undo, result.data)
    }
  }

  /**
   * Apply a ESONPatch to the current JSON document
   * @param {ESONPatch} actions       ESONPatch actions
   * @param {ESONPatchOptions} [options]  If no expand function is provided, the
   *                                  expanded state will be kept as is for
   *                                  existing paths. New paths will be fully
   *                                  expanded.
   * @return {ESONPatchAction} Returns a ESONPatch result containing the
   *                           patch, a patch to revert the action, and
   *                           an error object which is null when successful
   */
  patch (actions, options = {}) {
    if (!Array.isArray(actions)) {
      throw new TypeError('Array with patch actions expected')
    }

    const expand = options.expand || (path => this.expandKeepOrExpandAll(path))
    const result = patchEson(this.state.data, actions, expand)
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
      data: jsonToEson(json, expand, []),

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
    return esonToJson(this.state.data)
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
    return getIn(this.state.data, toEsonPath(this.state.data, path)).expanded
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
