import { h, Component } from 'preact'

import { updateIn, getIn } from '../utils/immutabilityHelpers'
import { expand, jsonToData, dataToJson, toDataPath, patchData, pathExists } from '../jsonData'
import { parseJSON } from '../utils/jsonUtils'
import {
  duplicate, insert, append, remove, changeType, changeValue, changeProperty, sort
} from '../actions'
import JSONNode from './JSONNode'
import JSONNodeView from './JSONNodeView'
import JSONNodeForm from './JSONNodeForm'
import ModeButton from './menu/ModeButton'

const MAX_HISTORY_ITEMS = 1000   // maximum number of undo/redo items to be kept in memory

export default class TreeMode extends Component {
  constructor (props) {
    super(props)

    const data = jsonToData(this.props.data || {}, TreeMode.expandAll, [])

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

        onExpand: this.handleExpand
      },

      search: null
    }
  }

  render (props, state) {
    const Node = (props.mode === 'view')
        ? JSONNodeView
        : (props.mode === 'form')
            ? JSONNodeForm
            : JSONNode

    return h('div', {
      class: `jsoneditor jsoneditor-mode-${props.mode}`,
      'data-jsoneditor': 'true'
    }, [
      this.renderMenu(),

      h('div', {class: 'jsoneditor-contents jsoneditor-tree-contents', onClick: this.handleHideMenus}, [
        h('ul', {class: 'jsoneditor-list jsoneditor-root'}, [
          h(Node, {
            data: state.data,
            events: state.events,
            options: props.options,
            parent: null,
            prop: null
          })
        ])
      ])
    ])
  }

  renderMenu () {
    let items = [
      h('button', {
        class: 'jsoneditor-expand-all',
        title: 'Expand all objects and arrays',
        onClick: this.handleExpandAll
      }),
      h('button', {
        class: 'jsoneditor-collapse-all',
        title: 'Collapse all objects and arrays',
        onClick: this.handleCollapseAll
      })
    ]

    if (this.props.mode !== 'view' && this.props.options.history != false) {
      items = items.concat([
        h('div', {class: 'jsoneditor-vertical-menu-separator'}),

        h('div', {style: 'display:inline-block'}, [
          h('button', {
            class: 'jsoneditor-undo',
            title: 'Undo last action',
            disabled: !this.canUndo(),
            onClick: this.undo
          }),
        ]),
        h('button', {
          class: 'jsoneditor-redo',
          title: 'Redo',
          disabled: !this.canRedo(),
          onClick: this.redo
        })
      ])
    }

    if (this.props.options.modes ) {
      items = items.concat([
        h('div', {class: 'jsoneditor-vertical-menu-separator'}),

        h(ModeButton, {
          modes: this.props.options.modes,
          mode: this.props.mode,
          onChangeMode: this.props.onChangeMode,
          onError: this.handleError
        })
      ])
    }

    return h('div', {class: 'jsoneditor-menu'}, items)
  }

  /** @private */
  handleHideMenus = () => {
    JSONNode.hideActionMenu()
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
  }

  /** @private */
  handleAppend = (parentPath, type) => {
    this.handlePatch(append(this.state.data, parentPath, type))
  }

  /** @private */
  handleDuplicate = (path) => {
    this.handlePatch(duplicate(this.state.data, path))
  }

  /** @private */
  handleRemove = (path) => {
    this.handlePatch(remove(path))
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

  /**
   * Apply a JSONPatch to the current JSON document and emit a change event
   * @param {JSONPatch} actions
   * @private
   */
  handlePatch = (actions) => {
    // apply changes
    const result = this.patch(actions)

    this.emitOnChange (actions, result.revert)
  }

  /** @private */
  handleError = (err) => {
    if (this.props.options && this.props.options.onError) {
      this.props.options.onError(err)
    }
    else {
      console.error(err)
    }
  }

  /**
   * Emit an onChange event when there is a listener for it.
   * @param {JSONPatch} patch
   * @param {JSONPatch} revert
   * @private
   */
  emitOnChange (patch, revert) {
    if (this.props.options.onChange) {
      this.props.options.onChange(patch, revert)
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

      this.emitOnChange (historyItem.undo, historyItem.redo)
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

      this.emitOnChange (historyItem.redo, historyItem.undo)
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

    if (this.props.options.history != false) {
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
      error: result.error
    }
  }

  /**
   * Set JSON object in editor
   * @param {Object | Array | string | number | boolean | null} json   JSON data
   * @param {SetOptions} [options]  If no expand function is provided,
   *                                The root will be expanded and all other nodes
   *                                will be collapsed.
   */
  set (json, options = {}) {
    const expand = options.expand || TreeMode.expandRoot

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
    const indentation = this.props.options.indentation || 2
    return JSON.stringify(this.get(), null, indentation)
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
   * Destroy the editor
   */
  destroy () {

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

