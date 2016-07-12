import { h, Component } from 'preact'
import isObject from './utils/isObject'

export default class JSONNode extends Component {
  constructor (props) {
    super(props)

    this.onValueInput = this.onValueInput.bind(this)
  }

  render (props) {
    if (Array.isArray(props.value)) {
      return this.renderArray(props)
    }
    else if (isObject(props.value)) {
      return this.renderObject(props)
    }
    else {
      return this.renderValue(props)
    }
  }

  renderObject ({field, value, onChangeValue}) {
    //console.log('JSONObject', field,value)

    return h('li', {class: 'jsoneditor-object'}, [
      h('div', {class: 'jsoneditor-node'}, [
        h('div', {class: 'jsoneditor-field', contentEditable: true}, field),
        h('div', {class: 'jsoneditor-separator'}, ':'),
        h('div', {class: 'jsoneditor-info'}, '{' + Object.keys(value).length + '}')
      ]),
      h('ul',
          {class: 'jsoneditor-list'},
          Object.keys(value).map(f => h(JSONNode, {parent: this, field: f, value: value[f], onChangeValue})))
    ])
  }

  renderArray ({field, value, onChangeValue}) {
    return h('li', {}, [
      h('div', {class: 'jsoneditor-node jsoneditor-array'}, [
        h('div', {class: 'jsoneditor-field', contentEditable: true}, field),
        h('div', {class: 'jsoneditor-separator'}, ':'),
        h('div', {class: 'jsoneditor-info'}, '{' + value.length + '}')
      ]),
      h('ul',
          {class: 'jsoneditor-list'},
          value.map((v, f) => h(JSONNode, {parent: this, field: f, value: v, onChangeValue})))
    ])
  }

  renderValue ({field, value}) {
    //console.log('JSONValue', field, value)

    return h('li', {}, [
      h('div', {class: 'jsoneditor-node'}, [
        h('div', {class: 'jsoneditor-field', contentEditable: true}, field),
        h('div', {class: 'jsoneditor-separator'}, ':'),
        h('div', {
          class: 'jsoneditor-value',
          contentEditable: true,
          // 'data-path': JSON.stringify(this.getPath())
          onInput: this.onValueInput
        }, value)
      ])
    ])
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.field !== this.props.field || nextProps.value !== this.props.value
  }

  onValueInput (event) {
    const path = this.getPath()
    const value = event.target.innerHTML
    this.props.onChangeValue(path, value)
  }

  getPath () {
    const path = []

    let node = this
    while (node) {
      path.unshift(node.props.field)

      node = node.props.parent
    }

    path.shift() // remove the root node again (null)

    return path
  }
}
