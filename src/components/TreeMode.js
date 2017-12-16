// @flow weak

import { createElement as h, Component } from 'react'
import isEqual from 'lodash/isEqual'
import reverse from 'lodash/reverse'
import initial from 'lodash/initial'
import Hammer from 'react-hammerjs'
import jump from '../assets/jump.js/src/jump'
import Ajv from 'ajv'

import { getIn, setIn, updateIn } from '../utils/immutabilityHelpers'
import { parseJSON } from '../utils/jsonUtils'
import { enrichSchemaError } from '../utils/schemaUtils'
import {
    META,
    jsonToEson, esonToJson, pathExists,
    expand, expandOne, expandPath, applyErrors,
    search, nextSearchResult, previousSearchResult,
    applySelection, pathsFromSelection, contentsFromPaths,
    compileJSONPointer, parseJSONPointer
} from '../eson'
import { patchEson } from '../patchEson'
import {
    duplicate, insertBefore, append, remove, removeAll, replace,
    createEntry, changeType, changeValue, changeProperty, sort
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

import type { ESON, ESONPatch, JSONPath, Selection, ESONPointer } from '../types'

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

    const json = this.props.json || {}
    const expandCallback = this.props.expand || TreeMode.expandRoot
    const eson = expand(jsonToEson(json), expandCallback)

    this.id = Math.round(Math.random() * 1e5) // TODO: create a uuid here?

    this.keyDownActions = {
      'up': this.moveUp,
      'down': this.moveDown,
      'left': this.moveLeft,
      'right': this.moveRight,
      'home': this.moveHome,
      'end': this.moveEnd,
      'cut': this.handleKeyDownCut,
      'copy': this.handleKeyDownCopy,
      'paste': this.handleKeyDownPaste,
      'duplicate': this.handleKeyDownDuplicate,
      'undo': this.handleUndo,
      'redo': this.handleRedo,
      'find': this.handleFocusFind,
      'findNext': this.handleNext,
      'findPrevious': this.handlePrevious
    }

    this.state = {
      json,
      eson,

      history: [eson],
      historyIndex: 0,

      events: {
        onChangeProperty: this.handleChangeProperty,
        onChangeValue: this.handleChangeValue,
        onChangeType: this.handleChangeType,
        onInsert: this.handleInsert,
        onInsertStructure: this.handleInsertStructure,
        onAppend: this.handleAppend,
        onDuplicate: this.handleDuplicate,
        onRemove: this.handleRemove,
        onSort: this.handleSort,

        onCut: this.handleCut,
        onCopy: this.handleCopy,
        onPaste: this.handlePaste,

        onExpand: this.handleExpand,

        onSelect: this.handleSelect,

        // TODO: now we're passing not just events but also other methods. reorganize this or rename 'state.events'
        findKeyBinding: this.handleFindKeyBinding
      },

      searchResult: {
        text: '',
        matches: null,
        active: null // active search result
      },

      errors: null,

      selection: null,

      clipboard: null // array entries {name: string, value: JSONType}
    }
  }

  componentWillMount () {
    this.applyProps(this.props, {})
  }

  componentWillReceiveProps (nextProps) {
    this.applyProps(nextProps, this.props)
  }

  // TODO: use or cleanup
  // componentDidMount () {
  //   document.addEventListener('keydown', this.handleKeyDown)
  // }
  //
  // componentWillUnmount () {
  //   document.removeEventListener('keydown', this.handleKeyDown)
  // }

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
      // FIXME: merge meta data from existing eson
      this.setState({
        json: nextProps.json,
        eson: jsonToEson(nextProps.json) // FIXME: how to handle expand?
      })
      // TODO: cleanup
      // this.patch([{
      //   op: 'replace',
      //   path: '',
      //   value: nextProps.json
      // }])
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

  render() {
    const { props, state } = this

    const Node = (props.mode === 'view')
        ? JSONNodeView
        : (props.mode === 'form')
            ? JSONNodeForm
            : JSONNode

    let eson = state.eson

    // enrich the eson with selection and JSON Schema errors
    // TODO: for optimization, we can apply errors only when the eson is changed? (a wrapper around setState or something?)
    eson = applyErrors(eson, this.getErrors())
    eson = applySelection(eson, this.state.selection)

    return h('div', {
      className: `jsoneditor jsoneditor-mode-${props.mode}`,
      onKeyDown: this.handleKeyDown,
      'data-jsoneditor': 'true'
    }, [
      this.renderMenu(),

      h('div', {
        key: 'contents',
        ref: 'contents',
        className: 'jsoneditor-contents jsoneditor-tree-contents'
      },
        h(Hammer, {
              id: this.id,
              direction:  'DIRECTION_VERTICAL',
              onPan: this.handlePan,
              onPanEnd: this.handlePanEnd
        },
          h('div', {
              onMouseDown: this.handleTouchStart,
              onTouchStart: this.handleTouchStart,
              className: 'jsoneditor-list jsoneditor-root' +
                  (eson[META].selected ? ' jsoneditor-selected' : '')},
            h(Node, {
              eson,
              events: state.events,
              options: props,
              prop: null
            })
          )
        )
      )
    ])
  }

  renderMenu () {
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

    if (this.props.searchResult !== false) {
      // option search is true or undefined
      items = items.concat([
        h('div', {key: 'search', className: 'jsoneditor-menu-panel-right'},
          h(Search, {
            text: this.state.searchResult.text,
            resultCount: this.state.searchResult.matches ? this.state.searchResult.matches.length : 0,
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
      const valid = this.state.compiledSchema(this.state.json)
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
    this.handlePatch(changeValue(this.state.eson, path, value))
  }

  handleChangeProperty = (parentPath, oldProp, newProp) => {
    this.handlePatch(changeProperty(this.state.eson, parentPath, oldProp, newProp))
  }

  handleChangeType = (path, type) => {
    this.handlePatch(changeType(this.state.eson, path, type))
  }

  handleInsert = (path, type) => {
    this.handlePatch(insertBefore(this.state.eson, path, [{
      type,
      name: '',
      value: createEntry(type)
    }]))

    this.setState({ selection : null }) // TODO: select the inserted entry

    // apply focus to new node
    this.focusToPrevious(path)
  }

  handleInsertStructure = (path) => {
    // TODO: implement handleInsertStructure
    console.log('TODO: handleInsertStructure', path)
    alert('not yet implemented...')
  }

  handleAppend = (parentPath, type) => {
    this.handlePatch(append(this.state.eson, parentPath, type))

    // apply focus to new node
    this.focusToNext(parentPath)
  }

  handleDuplicate = () => {
    if (this.state.selection) {
      this.handlePatch(duplicate(this.state.eson, this.state.selection))
      // TODO: focus to duplicated selection
    }
  }

  handleRemove = (path) => {
    if (path) {
      // apply focus to next sibling element if existing, else to the previous element
      const fromElement = findNode(this.refs.contents, path)
      const success = moveDownSibling(fromElement, 'property')
      if (!success) {
        moveUp(fromElement, 'property')
      }

      this.setState({ selection : null })
      this.handlePatch(remove(path))
    }
    else if (this.state.selection) {
      // remove selection
      // TODO: select next property? (same as when removing a path?)
      const paths = pathsFromSelection(this.state.eson, this.state.selection)
      this.setState({ selection: null })
      this.handlePatch(removeAll(paths))
    }
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

  handleKeyDownCut = (event) => {
    if (this.state.selection) {
      event.preventDefault()
    }
    this.handleCut()
  }

  handleKeyDownCopy = (event) => {
    if (this.state.selection) {
      event.preventDefault()
    }
    this.handleCopy()
  }

  handleKeyDownPaste = (event) => {
    const { clipboard, eson } = this.state

    if (clipboard && clipboard.length > 0) {
      event.preventDefault()

      const path = this.findDataPathFromElement(event.target)
      this.handlePatch(insertBefore(eson, path, clipboard))
    }
  }

  handleKeyDownDuplicate = (event) => {
    const path = this.findDataPathFromElement(event.target)
    if (path) {
      const selection = { start: path, end: path }
      this.handlePatch(duplicate(this.state.eson, selection))

      // apply focus to the duplicated node
      this.focusToNext(path)
    }
  }

  handleCut = () => {
    const selection = this.state.selection
    if (selection && selection.start && selection.end) {
      const eson = this.state.eson
      const paths = pathsFromSelection(eson, selection)
      const clipboard = contentsFromPaths(eson, paths)

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

  handleCopy = () => {
    const selection = this.state.selection
    if (selection && selection.start && selection.end) {
      const eson = this.state.eson
      const paths = pathsFromSelection(eson, selection)
      const clipboard = contentsFromPaths(eson, paths)

      this.setState({ clipboard })
    }
    else {
      // clear clipboard
      this.setState({ clipboard: null, selection: null })
    }
  }

  handlePaste = () => {
    const { eson, selection, clipboard } = this.state

    if (selection && clipboard && clipboard.length > 0) {
      this.setState({ selection: null })
      this.handlePatch(replace(eson, selection, clipboard))
      // TODO: select the pasted contents
    }
  }

  /**
   * Move focus to the next node
   * @param {Path} path
   */
  focusToNext (path) {
    setTimeout(() => {
      const element = findNode(this.refs.contents, path)
      if (element) {
        moveDown(element, 'property')
      }
    })
  }

  /**
   * Move focus to the previous node
   * @param {Path} path
   */
  focusToPrevious (path) {
    setTimeout(() => {
      const element = findNode(this.refs.contents, path)
      if (element) {
        moveUp(element, 'property')
      }
    })
  }

  handleSort = (path, order = null) => {
    this.handlePatch(sort(this.state.eson, path, order))
  }

  handleSelect = (selection: Selection) => {
    this.setState({ selection })
  }

  handleExpand = (path, expanded, recurse) => {
    if (recurse) {
      this.setState({
        eson: updateIn(this.state.eson, path, function (child) {
          return expand(child, (path) => true, expanded)
        })
      })
    }
    else {
      this.setState({
        eson: expandOne(this.state.eson, path, expanded)
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
      eson: expand(this.state.eson, TreeMode.expandAll, expanded)
    })
  }

  handleCollapseAll = () => {
    const expanded = false

    this.setState({
      eson: expand(this.state.eson, TreeMode.expandAll, expanded)
    })
  }

  handleSearch = (text) => {
    // FIXME: also apply search when eson is changed
    const { eson, searchResult } = search(this.state.eson, text)
    if (searchResult.matches.length > 0) {
      this.setState({
        eson: expandPath(eson, initial(searchResult.active.path)),
        searchResult
      })

      // scroll to active search result (on next tick, after this path has been expanded)
      setTimeout(() => this.scrollTo(searchResult.active.path))
    }
    else {
      this.setState({
        eson,
        searchResult
      })
    }
  }

  handleFocusFind = (event) => {
    event.preventDefault()
    selectFind(event.target)
  }

  handleNext = (event) => {
    event.preventDefault()

    if (this.state.searchResult) {
      const { eson, searchResult } = nextSearchResult(this.state.eson, this.state.searchResult)

      this.setState({
        eson,
        searchResult
      })

      // scroll to the active result (on next tick, after this path has been expanded)
      // TODO: this code is duplicate with handlePrevious, move into a separate function
      setTimeout(() => {
        if (searchResult.active && searchResult.active.path) {
          this.scrollTo(searchResult.active.path)

          if (!searchHasFocus()) {
            setSelection(this.refs.contents, searchResult.active.path, searchResult.active.area)
          }
        }
      })
    }
  }

  handlePrevious = (event) => {
    event.preventDefault()

    if (this.state.searchResult) {
      const { eson, searchResult } = previousSearchResult(this.state.eson, this.state.searchResult)

      this.setState({
        eson,
        searchResult
      })

      // scroll to the active result (on next tick, after this path has been expanded)
      setTimeout(() => {
        if (searchResult.active && searchResult.active.path) {
          this.scrollTo(searchResult.active.path)

          if (!searchHasFocus()) {
            setSelection(this.refs.contents, searchResult.active.path, searchResult.active.area)
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

  handleTouchStart = (event) => {
    const pointer = this.findESONPointerFromElement(event.target)
    const clickedOnEmptySpace = (event.target.nodeName === 'DIV') &&
        (event.target.contentEditable !== 'true')

    if (clickedOnEmptySpace && pointer) {
      this.setState({ selection: this.selectionFromESONPointer(pointer)})
    }
    else {
      this.setState({ selection: null })
    }
  }

  handlePan = (event) => {
    const selection = this.state.selection
    const path = this.findDataPathFromElement(event.target.firstChild)
    if (path && selection && !isEqual(path, selection.end)) {
      this.setState({
        selection: {
          start: selection.start || selection.before || selection.after,
          end: path
        }
      })
    }
  }

  handlePanEnd = (event) => {
    const path = this.findDataPathFromElement(event.target.firstChild)
    if (path) {
      // TODO: implement a better solution to keep focus in the editor than selecting the action menu. Most also be solved for undo/redo for example
      // --> focus to menu?
      // const element = findNode(this.refs.contents, path)
      // const actionMenuButton = element && element.querySelector('button.jsoneditor-actionmenu')
      // if (actionMenuButton) {
      //   actionMenuButton.focus()
      // }
    }
  }

  findDataPathFromElement (element: Element) : JSONPath | null {
    const base = findBaseNode(element)
    const attr = base && base.getAttribute && base.getAttribute('data-path')

    // The .replace is to change paths like `/myarray/-` into `/myarray`
    return attr ? parseJSONPointer(attr.replace(/\/-$/, '')) : null
  }

  findESONPointerFromElement (element: Element) : ESONPointer {
    const path = this.findDataPathFromElement(element)
    const area = element && element.getAttribute && element.getAttribute('data-area') || null

    return path ? { path, area } : null
  }

  selectionFromESONPointer (pointer: ESONPointer) : Selection {
    if (pointer.area === 'after') {
      return {after: pointer.path}
    }
    else if (pointer.area === 'before') {
      return {before: pointer.path}
    }
    else {
      return {start: pointer.path, end: pointer.path}
    }
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
  emitOnChange (patch: ESONPatch, revert: ESONPatch, eson: ESON) {
    if (this.props.onPatch) {
      this.props.onPatch(patch, revert)
    }

    if (this.props.onChange || this.props.onChangeText) {
      const json = esonToJson(eson)

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
    if (this.canUndo()) {
      const history = this.state.history
      const historyIndex = this.state.historyIndex
      const historyItem = history[historyIndex]

      const result = patchEson(this.state.eson, historyItem.undo)

      // FIXME: apply search
      this.setState({
        eson: result.data,
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

      const result = patchEson(this.state.eson, historyItem.redo)

      // FIXME: apply search
      this.setState({
        eson: result.data,
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
    const result = patchEson(this.state.eson, actions, expand)
    const eson = result.data

    if (this.props.history !== false) {
      // update data and store history
      const historyItem = {
        redo: actions,
        undo: result.revert
      }

      const history = [historyItem]
          .concat(this.state.history.slice(this.state.historyIndex))
          .slice(0, MAX_HISTORY_ITEMS)

      // FIXME: apply search
      this.setState({
        eson,
        history,
        historyIndex: 0
      })
    }
    else {
      // update data and don't store history
      // FIXME: apply search
      this.setState({ eson })
    }

    return {
      patch: actions,
      revert: result.revert,
      error: result.error,
      data: eson  // FIXME: shouldn't pass data here
    }
  }

  /**
   * Set JSON object in editor
   * @param {Object | Array | string | number | boolean | null} json   JSON data
   */
  set (json) {
    // FIXME: when both json and expand are being changed via React, this.props must be updated before set(json) is called
    // TODO: document option expand
    const expandCallback = this.props.expand || TreeMode.expandRoot

    // FIXME: apply search
    this.setState({
      json: json,
      eson: expand(jsonToEson(json), expandCallback),

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
    // FIXME: keep a copy of the json file up to date with the internal eson
    return esonToJson(this.state.eson)
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
      eson: expand(this.state.eson, callback, true)
    })
  }

  /**
   * Collapse one or multiple objects or arrays
   * @param {Path | function (path: Path) : boolean} callback
   */
  collapse (callback) {
    this.setState({
      eson: expand(this.state.eson, callback, false)
    })
  }

  /**
   * Test whether a path exists in the editor
   * @param {Path} path
   */
  exists (path) {
    return pathExists(this.state.eson, path)
  }

  /**
   * Test whether an Array or Object at a certain path is expanded.
   * When the node does not exist, the function throws an error
   * @param {Path} path
   * @return {boolean} Returns true when expanded, false otherwise
   */
  isExpanded (path) {
    return getIn(this.state.eson, path)[META].expanded
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
