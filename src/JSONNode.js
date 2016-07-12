import { h, Component } from 'preact'
import isObject from './utils/isObject'
import escapeHTML from './utils/escapeHTML'
import unescapeHTML from './utils/unescapeHTML'
import getInnerText from './utils/getInnerText'
import stringConvert from './utils/stringConvert'

export default class JSONNode extends Component {
  constructor (props) {
    super(props)

    this.onBlurField = this.onBlurField.bind(this)
    this.onBlurValue = this.onBlurValue.bind(this)
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

  // TODO: reorganize the render methods, they are too large now

  renderObject ({parent, field, value, onChangeValue, onChangeField}) {
    //console.log('JSONObject', field,value)
    const hasParent = parent !== null

    return h('li', {}, [
      h('div', {class: 'jsoneditor-node jsoneditor-object'}, [
        h('div', {class: 'jsoneditor-field' + (hasParent ? '' : ' jsoneditor-readonly'), contentEditable: hasParent, onBlur: this.onBlurField}, hasParent ? escapeHTML(field) : 'object'),
        h('div', {class: 'jsoneditor-separator'}, ':'),
        h('div', {class: 'jsoneditor-readonly', contentEditable: false}, '{' + Object.keys(value).length + '}')
      ]),
      h('ul',
          {class: 'jsoneditor-list'},
          Object
              .keys(value)
              .map(f => h(JSONNode, {parent: this, field: f, value: value[f], onChangeValue, onChangeField})))
    ])
  }

  renderArray ({parent, field, value, onChangeValue, onChangeField}) {
    const hasParent = parent !== null

    return h('li', {}, [
      h('div', {class: 'jsoneditor-node jsoneditor-array'}, [
        h('div', {class: 'jsoneditor-field' + (hasParent ? '' : ' jsoneditor-readonly'), contentEditable: hasParent, onBlur: this.onBlurField}, hasParent ? escapeHTML(field) : 'array'),
        h('div', {class: 'jsoneditor-separator'}, ':'),
        h('div', {class: 'jsoneditor-readonly', contentEditable: false}, '{' + value.length + '}')
      ]),
      h('ul',
          {class: 'jsoneditor-list'},
          value
              .map((v, i) => h(JSONNode, {parent: this, index: i, value: v, onChangeValue, onChangeField})))
    ])
  }

  renderValue ({parent, index, field, value}) {
    const hasParent = parent !== null
    //console.log('JSONValue', field, value)

    return h('li', {}, [
      h('div', {class: 'jsoneditor-node'}, [
        index !== undefined
            ? h('div', {class: 'jsoneditor-readonly', contentEditable: false}, index)
            : h('div', {class: 'jsoneditor-field' + (hasParent ? '' : ' jsoneditor-readonly'), contentEditable: hasParent, onBlur: this.onBlurField}, hasParent ? escapeHTML(field) : 'value'),
        h('div', {class: 'jsoneditor-separator'}, ':'),
        h('div', {class: 'jsoneditor-value', contentEditable: true, onBlur: this.onBlurValue}, escapeHTML(value))
      ])
    ])
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.field !== this.props.field || nextProps.value !== this.props.value
  }

  onBlurField (event) {
    const path = this.props.parent.getPath()
    const newField = unescapeHTML(getInnerText(event.target))
    const oldField = this.props.field
    if (newField !== oldField) {
      this.props.onChangeField(path, newField, oldField)
    }
  }

  onBlurValue (event) {
    const path = this.getPath()
    const value = stringConvert(unescapeHTML(getInnerText(event.target)))
    if (value !== this.props.value) {
      this.props.onChangeValue(path, value)
    }
  }

  getPath () {
    const path = []

    let node = this
    while (node) {
      path.unshift(node.props.field || node.props.index)

      node = node.props.parent
    }

    path.shift() // remove the root node again (null)

    return path
  }

  getRoot () {
    let node = this
    while (node && node.props.parent) {
      node = node.props.parent
    }
    return node
  }
}
