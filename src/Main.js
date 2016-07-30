import { h, Component } from 'preact'
import * as pointer from 'json-pointer'

import { setIn, updateIn, getIn, deleteIn, cloneDeep } from './utils/objectUtils'
import { compareAsc, compareDesc, last } from './utils/arrayUtils'
import { isObject } from './utils/typeUtils'
import bindMethods from './utils/bindMethods'
import JSONNode from './JSONNode'

export default class Main extends Component {
  constructor (props) {
    super(props)

    // TODO: create a function bindMethods(this)
    bindMethods(this)

    this.state = {
      options: Object.assign({
        name: null,
        expand: Main.expand    // TODO: remove expand as option, should be passed as optional callback to editor.set
      }, props.options || {}),

      data: {
        type: 'object',
        expanded: true,
        childs: []
      },

      events: {
        onChangeProperty: this.handleChangeProperty,
        onChangeValue: this.handleChangeValue,
        onChangeType: this.handleChangeType,
        onInsert: this.handleInsert,
        onDuplicate: this.handleDuplicate,
        onRemove: this.handleRemove,
        onSort: this.handleSort,

        onExpand: this.handleExpand,

        showContextMenu: this.handleShowContextMenu,
        hideContextMenu: this.handleHideContextMenu
      },

      /** @type {string | null} */
      contextMenuPath: null,  // json pointer to the node having menu visible

      search: null
    }
  }

  render() {
    return h('div', {class: 'jsoneditor', onClick: this.handleHideContextMenu}, [
      h('ul', {class: 'jsoneditor-list'}, [
        h(JSONNode, {
          data: this.state.data,
          events: this.state.events,
          options: this.state.options,
          path: []
        })
      ])
    ])
  }

  handleChangeValue (path, value) {
    console.log('handleChangeValue', path, value)

    this._setIn(path, ['value'], value)
  }

  handleChangeProperty (path, oldProp, newProp) {
    console.log('handleChangeProperty', path, oldProp, newProp)

    const index = this._findIndex(path, oldProp)
    const newPath = path.concat(newProp)

    this._setIn(path, ['childs', index, 'path'], newPath)
    this._setIn(path, ['childs', index, 'prop'], newProp)
  }

  handleChangeType (path, type) {
    console.log('handleChangeType', path, type)

    this._setIn(path, ['type'], type)
  }

  handleInsert (path, prop, value, type) {
    console.log('handleInsert', path, prop, value, type)

    this.handleHideContextMenu()  // TODO: should be handled by the contextmenu itself

    // TODO: this method is quite complicated. Can we simplify it?

    const afterProp = last(path)
    const parentPath = path.slice(0, path.length - 1)
    const parent = this._getIn(parentPath)

    const index = parent.type === 'array'
        ? parseInt(afterProp)
        : this._findIndex(parentPath, afterProp)

    this._updateIn(parentPath, ['childs'], function (childs) {
      const updated = childs.slice(0)
      const type = isObject(value) ? 'object' : Array.isArray(value) ? 'array' : (type || 'value')
      const newEntry = {
        expanded: true,
        type,
        prop,
        value,
        childs: []
      }

      updated.splice(index + 1, 0, newEntry)

      return updated
    })
  }

  handleDuplicate (path) {
    console.log('handleDuplicate', path)

    this.handleHideContextMenu()  // TODO: should be handled by the contextmenu itself

    // TODO: this method is quite complicated. Can we simplify it?

    const prop = last(path)
    const parentPath = path.slice(0, path.length - 1)
    const parent = this._getIn(parentPath)

    const index = parent.type === 'array'
        ? parseInt(prop)
        : this._findIndex(parentPath, prop)

    this._updateIn(parentPath, ['childs'], function (childs) {
      const updated = childs.slice(0)
      const original = childs[index]
      const duplicate = cloneDeep(original)

      updated.splice(index + 1, 0, duplicate)

      return updated
    })
  }

  handleRemove (path) {
    console.log('handleRemove', path)

    this.handleHideContextMenu()  // TODO: should be handled by the contextmenu itself

    this._deleteIn(path)
  }

  /**
   * Order the childs of an array in ascending or descending order
   * @param {Array.<string | number>} path
   * @param {'asc' | 'desc' | null} [order=null]  If not provided, will toggle current ordering
   */
  handleSort (path, order = null) {
    console.log('handleSort', path, order)

    this.handleHideContextMenu()  // TODO: should be handled by the contextmenu itself

    let _order
    if (order === 'asc' || order === 'desc') {
      _order = order
    }
    else {
      // toggle previous order
      const current = this._getIn(path, ['order'])
      _order = current !== 'asc' ? 'asc' : 'desc'
      this._setIn(path, ['order'], _order)
    }

    this._updateIn(path, ['childs'], function (childs) {
      const ordered = childs.slice(0)
      const compare = _order === 'desc' ? compareDesc : compareAsc

      ordered.sort((a, b) => compare(a.value, b.value))

      return ordered
    })
  }

  handleExpand(path, expand) {
    console.log('handleExpand', path, expand)

    this._setIn(path, ['expanded'], expand)
  }

  /**
   * Set ContextMenu to a json pointer, or hide the context menu by passing null as path
   * @param {Array.<string | number> | null} path
   * @param {Element} anchor
   * @param {Element} root
   * @private
   */
  handleShowContextMenu({path, anchor, root}) {
    console.log('handleShowContextMenu', path, anchor, root)

    // TODO: remove this cached this.state.contextMenuPath and do a brute-force sweep over the data instead?
    // hide previous context menu (if any)
    if (this.state.contextMenuPath !== null) {
      this._setIn(this.state.contextMenuPath, ['contextMenu'], null)
    }

    // show new menu
    if (Array.isArray(path)) {
      this._setIn(path, ['contextMenu'], {anchor, root})
    }

    this.setState({
      contextMenuPath: Array.isArray(path) ? path :  null  // store path of current menu, just to easily find it next time
    })
  }

  handleHideContextMenu () {
    // FIXME: find a different way to show/hide the context menu. create a single instance in the Main, pass a reference to it into the JSON nodes?
    this.handleShowContextMenu({})
  }

  _getIn (path, modelProps = []) {
    const modelPath = Main._pathToModelPath(this.state.data, path)

    return getIn(this.state.data, modelPath.concat(modelProps))
  }

  _setIn (path, modelProps = [], value) {
    const modelPath = Main._pathToModelPath(this.state.data, path)

    this.setState({
      data: setIn(this.state.data, modelPath.concat(modelProps), value)
    })
  }

  _updateIn (path, modelProps = [], callback) {
    const modelPath = Main._pathToModelPath(this.state.data, path)

    this.setState({
      data: updateIn(this.state.data, modelPath.concat(modelProps), callback)
    })
  }

  _deleteIn (path, modelProps = []) {
    const modelPath = Main._pathToModelPath(this.state.data, path)

    this.setState({
      data: deleteIn(this.state.data, modelPath.concat(modelProps))
    })
  }

  _findIndex(path, prop) {
    const object = this._getIn(path)
    return object.childs.findIndex(child => child.prop === prop)
  }

  // TODO: comment
  get () {
    return Main._modelToJson(this.state.data)
  }

  // TODO: comment
  set (json) {
    this.setState({
      data: Main._jsonToModel([], null, json, this.state.options.expand)
    })
  }

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

  /**
   * Convert a path of a JSON object into a path in the corresponding data model
   * @param {Model} model
   * @param {Array.<string | number>} path
   * @return {Array.<string | number>} modelPath
   * @private
   */
  static _pathToModelPath (model, path) {
    if (path.length === 0) {
      return []
    }

    let index
    if (typeof path[0] === 'number') {
      // index of an array
      index = path[0]
    }
    else {
      // object property. find the index of this property
      index = model.childs.findIndex(child => child.prop === path[0])
    }

    return ['childs', index]
        .concat(Main._pathToModelPath(model.childs[index], path.slice(1)))
  }

  /**
   * Convert a JSON object into the internally used data model
   * @param {Array.<string | number>} path
   * @param {string | null} prop
   * @param {Object | Array | string | number | boolean | null} value
   * @param {function(path: Array.<string | number>)} expand
   * @return {Model}
   * @private
   */
  static _jsonToModel (path, prop, value, expand) {
    if (Array.isArray(value)) {
      return {
        type: 'array',
        expanded: expand(path),
        prop,
        childs: value.map((child, index) => Main._jsonToModel(path.concat(index), null, child, expand))
      }
    }
    else if (isObject(value)) {
      return {
        type: 'object',
        expanded: expand(path),
        prop,
        childs: Object.keys(value).map(prop => {
          return Main._jsonToModel(path.concat(prop), prop, value[prop], expand)
        })
      }
    }
    else {
      return {
        type: 'value',
        prop,
        value
      }
    }
  }

  /**
   * Convert the internal data model to a regular JSON object
   * @param {Model} model
   * @return {Object | Array | string | number | boolean | null} json
   * @private
   */
  static _modelToJson (model) {
    if (model.type === 'array') {
      return model.childs.map(Main._modelToJson)
    }
    else if (model.type === 'object') {
      const object = {}

      model.childs.forEach(child => {
        object[child.prop] = Main._modelToJson(child)
      })

      return object
    }
    else {
      // type 'value' or 'string'
      return model.value
    }
  }

}
