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
        props: []
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

    this._setIn(path, ['props', index, 'name'], newProp)
  }

  handleChangeType (path, type) {
    console.log('handleChangeType', path, type)

    this._setIn(path, ['type'], type)
  }

  handleInsert (path, type) {
    console.log('handleInsert', path, type)

    this.handleHideContextMenu()  // TODO: should be handled by the contextmenu itself

    // TODO: this method is quite complicated. Can we simplify it?

    const afterProp = last(path)
    const parentPath = path.slice(0, path.length - 1)
    const parent = this._getIn(parentPath)

    if (parent.type === 'array') {
      this._updateIn(parentPath, ['items'], (items) => {
        const index = parseInt(afterProp)
        const updated = items.slice(0)

        updated.splice(index + 1, 0, createDataEntry(type))

        return updated
      })
    }
    else { // parent.type === 'object'
      this._updateIn(parentPath, ['props'], (props) => {
        const index = this._findIndex(parentPath, afterProp)
        const updated = props.slice(0)

        updated.splice(index + 1, 0, {
          name: '',
          value: createDataEntry(type)
        })

        return updated
      })
    }
  }

  handleDuplicate (path) {
    console.log('handleDuplicate', path)

    this.handleHideContextMenu()  // TODO: should be handled by the contextmenu itself

    // TODO: this method is quite complicated. Can we simplify it?

    const prop = last(path)
    const parentPath = path.slice(0, path.length - 1)
    const parent = this._getIn(parentPath)

    if (parent.type === 'array') {
      this._updateIn(parentPath, ['items'], (items) => {
        const index = parseInt(prop)
        const updated = items.slice(0)
        const original = items[index]
        const duplicate = cloneDeep(original)

        updated.splice(index + 1, 0, duplicate)

        return updated
      })
    }
    else { // parent.type === 'object'
      this._updateIn(parentPath, ['props'], (props) => {
        const index = this._findIndex(parentPath, prop)
        const updated = props.slice(0)
        const original = props[index]
        const duplicate = cloneDeep(original)

        updated.splice(index + 1, 0, duplicate)

        return updated
      })
    }
  }

  handleRemove (path) {
    console.log('handleRemove', path)

    this.handleHideContextMenu()  // TODO: should be handled by the contextmenu itself

    const parentPath = path.slice(0, path.length - 1)
    const parent = this._getIn(parentPath)

    if (parent.type === 'array') {
      const dataPath = toDataPath(this.state.data, path)

      this.setState({
        data: deleteIn(this.state.data, dataPath)
      })
    }
    else { // parent.type === 'object'
      const dataPath = toDataPath(this.state.data, path)

      dataPath.pop()  // remove the 'value' property, we want to remove the whole object property
      this.setState({
        data: deleteIn(this.state.data, dataPath)
      })
    }
  }

  /**
   * Order the items of an array or the properties of an object in ascending
   * or descending order
   * @param {Array.<string | number>} path
   * @param {'asc' | 'desc' | null} [order=null]  If not provided, will toggle current ordering
   */
  handleSort (path, order = null) {
    console.log('handleSort', path, order)

    this.handleHideContextMenu()  // TODO: should be handled by the contextmenu itself

    const object = this._getIn(path)

    let _order
    if (order === 'asc' || order === 'desc') {
      _order = order
    }
    else {
      // toggle previous order
      _order = object.order !== 'asc' ? 'asc' : 'desc'
      this._setIn(path, ['order'], _order)
    }

    if (object.type === 'array') {
      this._updateIn(path, ['items'], function (items) {
        const ordered = items.slice(0)
        const compare = _order === 'desc' ? compareDesc : compareAsc

        ordered.sort((a, b) => compare(a.value, b.value))

        return ordered
      })
    }
    else { // object.type === 'object'
      this._updateIn(path, ['props'], function (props) {
        const ordered = props.slice(0)
        const compare = _order === 'desc' ? compareDesc : compareAsc

        ordered.sort((a, b) => compare(a.name, b.name))

        return ordered
      })
    }
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

  _getIn (path, dataProps = []) {
    const dataPath = toDataPath(this.state.data, path)

    return getIn(this.state.data, dataPath.concat(dataProps))
  }

  _setIn (path, dataProps = [], value) {
    const dataPath = toDataPath(this.state.data, path)

    this.setState({
      data: setIn(this.state.data, dataPath.concat(dataProps), value)
    })
  }

  _updateIn (path, dataProps = [], callback) {
    const dataPath = toDataPath(this.state.data, path)

    this.setState({
      data: updateIn(this.state.data, dataPath.concat(dataProps), callback)
    })
  }

  _findIndex(path, prop) {
    const object = this._getIn(path)
    return object.props.findIndex(p => p.name === prop)
  }

  // TODO: comment
  get () {
    return dataToJson(this.state.data)
  }

  // TODO: comment
  set (json) {
    this.setState({
      data: jsonToData([], json, this.state.options.expand)
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

}

/**
 * Convert a path of a JSON object into a path in the corresponding data model
 * @param {Data} data
 * @param {Array.<string | number>} path
 * @return {Array.<string | number>} dataPath
 * @private
 */
function toDataPath (data, path) {
  if (path.length === 0) {
    return []
  }

  let index
  if (data.type === 'array') {
    // index of an array
    index = path[0]

    return ['items', index].concat(toDataPath(data.items[index], path.slice(1)))
  }
  else {
    // object property. find the index of this property
    index = data.props.findIndex(prop => prop.name === path[0])

    return ['props', index, 'value'].concat(toDataPath(data.props[index].value, path.slice(1)))
  }
}

/**
 * Convert a JSON object into the internally used data model
 * @param {Array.<string | number>} path
 * @param {Object | Array | string | number | boolean | null} json
 * @param {function(path: Array.<string | number>)} expand
 * @return {Data}
 */
function jsonToData (path, json, expand) {
  if (Array.isArray(json)) {
    return {
      type: 'array',
      expanded: expand(path),
      items: json.map((child, index) => jsonToData(path.concat(index), child, expand))
    }
  }
  else if (isObject(json)) {
    return {
      type: 'object',
      expanded: expand(path),
      props: Object.keys(json).map(name => {
        return {
          name,
          value: jsonToData(path.concat(name), json[name], expand)
        }
      })
    }
  }
  else {
    return {
      type: 'json',
      value: json
    }
  }
}

/**
 * Convert the internal data model to a regular JSON object
 * @param {Data} data
 * @return {Object | Array | string | number | boolean | null} json
 */
function dataToJson (data) {
  if (data.type === 'array') {
    return data.items.map(dataToJson)
  }
  else if (data.type === 'object') {
    const object = {}

    data.props.forEach(prop => {
      object[prop.name] = dataToJson(prop.value)
    })

    return object
  }
  else {
    // type 'value' or 'string'
    return data.value
  }
}


/**
 * Create a new data entry
 * @param {'object' | 'array' | 'value' | 'string'} [type]
 * @return {*}
 */
function createDataEntry (type) {
  if (type === 'array') {
    return {
      type,
      expanded: true,
      items: []
    }
  }
  else if (type === 'object') {
    return {
      type,
      expanded: true,
      props: []
    }
  }
  else {
    return {
      type,
      value: ''
    }
  }
}