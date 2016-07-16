import { h, Component } from 'preact'
import * as pointer from 'json-pointer'

import { setIn, getIn } from './utils/objectUtils'
import { isObject } from './utils/typeUtils'
import JSONNode from './JSONNode'

export default class Main extends Component {
  constructor (props) {
    super(props)

    this.state = {
      options: Object.assign({
        name: null,
        expand: Main.expand
      }, props.options || {}),

      data: {
        type: 'object',
        expanded: true,
        path: [],
        childs: []
      },

      events: {
        onChangeProperty: this._onChangeProperty.bind(this),
        onChangeValue: this._onChangeValue.bind(this),
        onExpand: this._onExpand.bind(this),
        onContextMenu: this._onContextMenu.bind(this)
      },

      menu: null,

      search: null
    }
  }

  render() {
    return h('div', {class: 'jsoneditor'}, [
      h('ul', {class: 'jsoneditor-list'}, [
        h(JSONNode, this.state)
      ])
    ])
  }

  _onChangeValue (path, value) {
    console.log('_onChangeValue', path, value)

    const modelPath = Main._pathToModelPath(this.state.data, Main._parsePath(path)).concat('value')

    this.setState({
      data: setIn(this.state.data, modelPath, value)
    })
  }

  _onChangeProperty (path, oldProp, newProp) {
    console.log('_onChangeProperty', path, oldProp, newProp)

    const array = pointer.parse(path)
    const parent = getIn(this.state.data, array)
    const index = parent.childs.findIndex(child => child.prop === oldProp)

    const newPath = path + '/' + pointer.escape(newProp)
    const modelPath = Main._pathToModelPath(this.state.data, array).concat(['childs', index])

    let data = this.state.data
    data = setIn(data, modelPath.concat('path'), newPath)
    data = setIn(data, modelPath.concat('prop'), newProp)

    this.setState({ data })
  }

  _onExpand(path, expand) {
    const modelPath = Main._pathToModelPath(this.state.data, Main._parsePath(path)).concat('expanded')

    console.log('_onExpand', path, modelPath)

    this.setState({
      data: setIn(this.state.data, modelPath, expand)
    })
  }

  _onContextMenu(path, visible) {
    const modelPath = Main._pathToModelPath(this.state.data, Main._parsePath(path)).concat('menu')

    this.setState({
      data: setIn(this.state.data, modelPath, visible)
    })
  }

  // TODO: comment
  get () {
    return Main._modelToJson(this.state.data)
  }

  // TODO: comment
  set (json) {
    this.setState({
      data: Main._jsonToModel('', null, json, this.state.options.expand)
    })
  }

  /**
   * Default function to determine whether or not to expand a node initially
   *
   * Rule: expand the root node only
   *
   * @param {string} path   A JSON Pointer path
   * @return {boolean}
   */
  static expand (path) {
    return path.indexOf('/') === -1
  }

  /**
   * parse json pointer into an array, and replace strings containing a number
   * with a number
   * @param {string} path
   * @return {Array.<string | number>}
   * @private
   */
  static _parsePath (path) {
    return pointer.parse(path).map(item => {
      const num = Number(item)
      return isNaN(num) ? item : num
    })
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
   * @param {string} path
   * @param {string | null} prop
   * @param {Object | Array | string | number | boolean | null} value
   * @param {function(path: string)} expand
   * @return {Model}
   * @private
   */
  static _jsonToModel (path, prop, value, expand) {
    if (Array.isArray(value)) {
      return {
        type: 'array',
        expanded: expand(path),
        path,
        prop,
        childs: value.map((child, index) => Main._jsonToModel(path + '/' + index, null, child, expand))
      }
    }
    else if (isObject(value)) {
      return {
        type: 'object',
        expanded: expand(path),
        path,
        prop,
        childs: Object.keys(value).map(prop => {
          return Main._jsonToModel(path + '/' + pointer.escape(prop), prop, value[prop], expand)
        })
      }
    }
    else {
      return {
        type: 'auto',
        path,
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
      // type 'auto' or 'string'
      return model.value
    }
  }

}
