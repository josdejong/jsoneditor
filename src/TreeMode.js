import { h, Component } from 'preact'

import { setIn, updateIn } from './utils/immutabilityHelpers'
import {
  expand, jsonToData, dataToJson, toDataPath, patchData, compileJSONPointer
} from './jsonData'
import {
  duplicate, insert, append, remove, changeType, changeValue, changeProperty, sort
} from './actions'
import JSONNode from './JSONNode'

const MAX_HISTORY_ITEMS = 1000   // maximum number of undo/redo items to be kept in memory

export default class TreeMode extends Component {
  // TODO: define propTypes

  constructor (props) {
    super(props)

    const expand = this.props.options && this.props.options.expand || TreeMode.expand
    const data = jsonToData([], this.props.data || {}, expand)

    this.state = {
      options: {
        name: null
      },

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
    return h('div', {class: 'jsoneditor'}, [
      h('div', {class: 'jsoneditor-menu'}, [
          h('button', {
            class: 'jsoneditor-expand-all',
            title: 'Expand all objects and arrays',
            onClick: this.handleExpandAll
          }),
          h('button', {
            class: 'jsoneditor-collapse-all',
            title: 'Collapse all objects and arrays',
            onClick: this.handleCollapseAll
          }),
          h('div', {class: 'jsoneditor-vertical-menu-separator'}),
          h('button', {
            class: 'jsoneditor-undo',
            title: 'Undo last action',
            disabled: !this.canUndo(),
            onClick: this.undo
          }),
          h('button', {
            class: 'jsoneditor-redo',
            title: 'Redo',
            disabled: !this.canRedo(),
            onClick: this.redo
          })
      ]),

      h('div', {class: 'jsoneditor-treemode', contentEditable: 'false', onClick: JSONNode.hideContextMenu}, [
        h('ul', {class: 'jsoneditor-list', contentEditable: 'false'}, [
          h(JSONNode, {
            data: state.data,
            events: state.events,
            options: state.options,
            parent: null,
            prop: null
          })
        ])
      ])
    ])
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
    const revert = this.patch(actions)

    this.emitOnChange (actions, revert)
  }

  /**
   * Emit an onChange event when there is a listener for it.
   * @param {JSONPatch} patch
   * @param {JSONPatch} revert
   * @private
   */
  emitOnChange (patch, revert) {
    if (this.props.options && this.props.options.onChange) {
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
   * @param {JSONPatch} actions   JSONPatch actions
   * @return {JSONPatch} Returns a JSONPatch to revert the applied patch
   */
  patch (actions) {
    const result = patchData(this.state.data, actions)
    const data = result.data

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

    return result.revert
  }

  /**
   * Set JSON object in editor
   * @param {Object | Array | string | number | boolean | null} json   JSON data
   * @param {SetOptions} [options]
   */
  set (json, options = {}) {
    const name = options && options.name || null // the root name
    const data = jsonToData([], json, options.expand || TreeMode.expand)

    this.setState({
      options: setIn(this.state.options, ['name'], name),

      data,
      // TODO: do we want to keep history when .set(json) is called?
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

  // TODO: implement getText and setText

  /**
   * Default function to determine whether or not to expand a node initially
   *
   * Rule: expand the root node only
   *
   * @param {Array.<string>} path
   * @return {boolean}
   */
  static expand (path) {
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

