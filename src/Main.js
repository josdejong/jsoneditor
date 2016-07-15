import { h, Component } from 'preact'

import { setIn } from './utils/objectUtils'
import { last } from './utils/arrayUtils'
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
      }
    }

    this._onExpand = this._onExpand.bind(this)
    this._onChangeValue = this._onChangeValue.bind(this)
    this._onChangeProperty = this._onChangeProperty.bind(this)
  }

  render() {
    return h('div', {class: 'jsoneditor'}, [
      h('ul', {class: 'jsoneditor-list'}, [
        h(JSONNode, {
          data: this.state.data,
          options: this.state.options,
          onChangeProperty: this._onChangeProperty,
          onChangeValue: this._onChangeValue,
          onExpand: this._onExpand
        })
      ])
    ])
  }

  _onChangeValue (path, value) {
    console.log('_onChangeValue', path, value)

    const modelPath = Main._pathToModelPath(this.state.data, path).concat('value')

    this.setState({
      data: setIn(this.state.data, modelPath, value)
    })
  }

  _onChangeProperty (oldPath, newPath) {
    console.log('_onChangeProperty', oldPath, newPath)

    const modelPath = Main._pathToModelPath(this.state.data, oldPath).concat('path')

    this.setState({
      data: setIn(this.state.data, modelPath, newPath)
    })
  }

  _onExpand(path, expand) {
    const modelPath = Main._pathToModelPath(this.state.data, path).concat('expanded')

    this.setState({
      data: setIn(this.state.data, modelPath, expand)
    })
  }

  // TODO: comment
  get () {
    return Main._modelToJson(this.state.data)
  }

  // TODO: comment
  set (json) {
    this.setState({
      data: Main._jsonToModel([], json, this.state.options.expand)
    })
  }

  /**
   * Default function to determine whether or not to expand a node initially
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
      index = model.childs.findIndex(child => last(child.path) === path[0])
    }

    return ['childs', index]
        .concat(Main._pathToModelPath(model.childs[index], path.slice(1)))
  }

  /**
   * Convert a JSON object into the internally used data model
   * @param {Array.<string | number>} path
   * @param {Object | Array | string | number | boolean | null} value
   * @param {function(path: Array.<string>)} expand
   * @return {Model}
   * @private
   */
  static _jsonToModel (path, value, expand) {
    if (Array.isArray(value)) {
      return {
        type: 'array',
        expanded: expand(path),
        path,
        childs: value.map((child, index) => Main._jsonToModel(path.concat(index), child, expand))
      }
    }
    else if (isObject(value)) {
      return {
        type: 'object',
        expanded: expand(path),
        path,
        childs: Object.keys(value).map(prop => {
          return Main._jsonToModel(path.concat(prop), value[prop], expand)
        })
      }
    }
    else {
      return {
        type: 'auto',
        path,
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
        const prop = last(child.path)
        object[prop] = Main._modelToJson(child)
      })

      return object
    }
    else {
      // type 'auto' or 'string'
      return model.value
    }
  }

}
