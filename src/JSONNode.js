import { h, Component } from 'preact'
import { escapeHTML, unescapeHTML } from './utils/stringUtils'
import { getInnerText } from './utils/domUtils'
import {stringConvert, valueType, isUrl, isObject} from  './utils/typeUtils'

export default class JSONNode extends Component {
  constructor (props) {
    super(props)

    this.onChangeField = this.onChangeField.bind(this)
    this.onChangeValue = this.onChangeValue.bind(this)
    this.onClickValue = this.onClickValue.bind(this)
    this.onKeyDownValue = this.onKeyDownValue.bind(this)
  }

  render (props) {
    if (Array.isArray(props.value)) {
      return this.renderJSONArray(props)
    }
    else if (isObject(props.value)) {
      return this.renderJSONObject(props)
    }
    else {
      return this.renderJSONValue(props)
    }
  }

  renderJSONObject ({parent, field, value, onChangeValue, onChangeField}) {
    const childs = Object.keys(value).map(f => {
      return h(JSONNode, {
        parent: this,
        field: f,
        value: value[f],
        onChangeValue,
        onChangeField
      })
    })

    return h('li', {}, [
      h('div', {class: 'jsoneditor-node jsoneditor-object'}, [
        this.renderField(field, value, parent),
        this.renderSeparator(),
        this.renderReadonly('{' + Object.keys(value).length + '}')
      ]),
      h('ul', {class: 'jsoneditor-list'}, childs)
    ])
  }

  renderJSONArray ({parent, field, value, onChangeValue, onChangeField}) {
    const childs = value.map((v, i) => {
      return h(JSONNode, {
        parent: this,
        index: i,
        value: v,
        onChangeValue,
        onChangeField
      })
    })

    return h('li', {}, [
      h('div', {class: 'jsoneditor-node jsoneditor-array'}, [
        this.renderField(field, value, parent),
        this.renderSeparator(),
        this.renderReadonly('{' + value.length + '}')
      ]),
      h('ul', {class: 'jsoneditor-list'}, childs)
    ])
  }

  renderJSONValue ({parent, index, field, value}) {
    return h('li', {}, [
      h('div', {class: 'jsoneditor-node'}, [
        index !== undefined
            ? this.renderReadonly(index)
            : this.renderField(field, value, parent),
        this.renderSeparator(),
        this.renderValue(value)
      ])
    ])
  }

  renderReadonly (text) {
    return h('div', {class: 'jsoneditor-readonly', contentEditable: false}, text)
  }

  renderField (field, value, parent) {
    const hasParent = parent !== null
    const content = hasParent ? escapeHTML(field) : valueType(value)

    return h('div', {
      class: 'jsoneditor-field' + (hasParent ? '' : ' jsoneditor-readonly'),
      contentEditable: hasParent,
      spellCheck: 'false',
      onBlur: this.onChangeField
    }, content)
  }

  renderSeparator() {
    return h('div', {class: 'jsoneditor-separator'}, ':')
  }

  renderValue (value) {
    const type = valueType (value)
    const _isUrl = isUrl(value)
    const valueClass = 'jsoneditor-value jsoneditor-' + type + (_isUrl ? ' jsoneditor-url' : '')

    return h('div', {
      class: valueClass,
      contentEditable: true,
      spellCheck: 'false',
      onBlur: this.onChangeValue,
      onClick: this.onClickValue,
      onKeyDown: this.onKeyDownValue,
      title: _isUrl ? 'Ctrl+Click or ctrl+Enter to open url' : null
    }, escapeHTML(value))
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.field !== this.props.field || nextProps.value !== this.props.value
  }

  onChangeField (event) {
    const path = this.props.parent.getPath()
    const newField = unescapeHTML(getInnerText(event.target))
    const oldField = this.props.field
    if (newField !== oldField) {
      this.props.onChangeField(path, oldField, newField)
    }
  }

  onChangeValue (event) {
    const path = this.getPath()
    const value = this._getValueFromEvent(event)
    if (value !== this.props.value) {
      this.props.onChangeValue(path, value)
    }
  }

  onClickValue (event) {
    if (event.ctrlKey && event.button === 0) { // Ctrl+Left click
      this._openLinkIfUrl(event)
    }
  }

  onKeyDownValue (event) {
    if (event.ctrlKey && event.which === 13) { // Ctrl+Enter
      this._openLinkIfUrl(event)
    }
  }

  _openLinkIfUrl (event) {
    const value = this._getValueFromEvent(event)

    if (isUrl(value)) {
      event.preventDefault()
      event.stopPropagation()

      window.open(value, '_blank')
    }
  }

  _getValueFromEvent (event) {
    return stringConvert(unescapeHTML(getInnerText(event.target)))
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
}
