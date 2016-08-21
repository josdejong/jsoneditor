import { h, Component } from 'preact'

import { setIn, updateIn } from './utils/immutabilityHelpers'
import {
  changeValue, changeProperty, changeType,
  insert, append, duplicate, remove,
  sort,
  expand,
  jsonToData, dataToJson, toDataPath
} from './jsonData'
import JSONNode from './JSONNode'

export default class TreeMode extends Component {
  // TODO: define propTypes

  constructor (props) {
    super(props)

    // TODO: don't put name and expand like this in the constructor
    const name   = this.props.options && this.props.options.name || null
    const expand = this.props.options && this.props.options.expand || TreeMode.expand

    this.state = {
      options: {
        name
      },

      data: jsonToData([], this.props.data || {}, expand),
      
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

  handleChangeValue = (path, value) => {
    this.setState({
      data: changeValue(this.state.data, path, value)
    })
  }

  handleChangeProperty = (path, oldProp, newProp) => {
    this.setState({
      data: changeProperty(this.state.data, path, oldProp, newProp)
    })
  }

  handleChangeType = (path, type) => {
    this.setState({
      data: changeType(this.state.data, path, type)
    })
  }

  handleInsert = (path, afterProp, type) => {
    this.setState({
      data: insert(this.state.data, path, afterProp, type)
    })
  }

  handleAppend = (path, type) => {
    this.setState({
      data: append(this.state.data, path, type)
    })
  }

  handleDuplicate = (path, type) => {
    this.setState({
      data: duplicate(this.state.data, path, type)
    })
  }

  handleRemove = (path, prop) => {
    this.setState({
      data: remove(this.state.data, path, prop)
    })
  }

  handleSort = (path, order = null) => {
    this.setState({
      data: sort(this.state.data, path, order)
    })
  }

  handleExpand = (path, expanded, recurse) => {
    if (recurse) {
      const dataPath = toDataPath(this.state.data, path)

      this.setState({
        data: updateIn (this.state.data, dataPath, function (child) {
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

  handleExpandAll = () => {
    const all = (path) => true
    const expanded = true

    this.setState({
      data: expand(this.state.data, all, expanded)
    })
  }

  handleCollapseAll = () => {
    const all = (path) => true
    const expanded = false

    this.setState({
      data: expand(this.state.data, all, expanded)
    })
  }

  /**
   * Set JSON object in editor
   * @param {Object | Array | string | number | boolean | null} json   JSON data
   * @param {SetOptions} [options]
   */
  set (json, options = {}) {
    this.setState({
      options: setIn(this.state.options, ['name'], options && options.name || null),

      data: jsonToData([], json, options.expand || TreeMode.expand)
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

  // TODO: implement expand
  // TODO: implement getText and setText

  /**
   * Default function to determine whether or not to expand a node initially
   *
   * Rule: expand the root node only
   *
   * @param {Array.<string | number>} path
   * @return {boolean}
   */
  static expand (path) {
    return path.length === 0
  }

}
