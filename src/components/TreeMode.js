import { h, Component } from 'preact'

import Ajv from 'ajv'
import { updateIn, getIn, setIn } from '../utils/immutabilityHelpers'
import { parseJSON } from '../utils/jsonUtils'
import { enrichSchemaError } from '../utils/schemaUtils'
import {
    jsonToData, dataToJson, toDataPath, patchData, pathExists,
    expand, addErrors, search, addSearchResults
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

const AJV_OPTIONS = {
  allErrors: true,
  verbose: true,
  jsonPointers: true
}

const MAX_HISTORY_ITEMS = 1000   // maximum number of undo/redo items to be kept in memory
const SEARCH_DEBOUNCE = 300      // milliseconds

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

      search: {
        text: '',
        selectedPath: null
      }
    }
  }

  render (props, state) {
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
    const searchResults = this.state.search.text ? search(data, this.state.search.text) : null
    if (searchResults) {
      data = addSearchResults(data, searchResults)
    }
    // TODO: pass number of search results to search box in top menu

    return h('div', {
      class: `jsoneditor jsoneditor-mode-${props.mode}`,
      'data-jsoneditor': 'true'
    }, [
      this.renderMenu(),

      h('div', {class: 'jsoneditor-contents jsoneditor-tree-contents', onClick: this.handleHideMenus},
        h('ul', {class: 'jsoneditor-list jsoneditor-root'},
          h(Node, {
            data,
            events: state.events,
            options: props.options,
            parent: null,
            prop: null
          })
        )
      )
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
          onError: this.props.onError
        })
      ])
    }

    if (this.props.options.search !== false) {
      // option search is true or undefined
      items = items.concat([
        h('div', {class: 'jsoneditor-menu-panel-right'},
          h(Search, {
            text: this.state.search.text,
            onChange: this.handleSearch,
            delay: SEARCH_DEBOUNCE
          })
        )
      ])
    }

    return h('div', {class: 'jsoneditor-menu'}, items)
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

  /** @private */
  handleSearch = (text) => {
    this.setState(setIn(this.state, ['search', 'text'], text))
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
   * Set a JSON schema for validation of the JSON object.
   * To remove the schema, call JSONEditor.setSchema(null)
   * @param {Object | null} schema
   */
  // TODO: deduplicate this function, it's also implemented in TextMode
  setSchema (schema) {
    if (schema) {
      const ajv = this.props.options.ajv || Ajv && Ajv(AJV_OPTIONS)

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

