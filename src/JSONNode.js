import { h, Component } from 'preact'
import { escapeHTML, unescapeHTML } from './utils/stringUtils'
import { getInnerText } from './utils/domUtils'
import {stringConvert, valueType, isUrl, isObject} from  './utils/typeUtils'

export default class JSONNode extends Component {
  constructor (props) {
    super(props)

    this.onChangeField = this.onChangeField.bind(this)
    this.onChangeValue = this.onChangeValue.bind(this)
    this.onClickUrl = this.onClickUrl.bind(this)
    this.onKeyDownUrl = this.onKeyDownUrl.bind(this)
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

  // TODO: reorganize the render methods, they are too large now

  renderJSONObject ({parent, field, value, onChangeValue, onChangeField}) {
    //console.log('JSONObject', field,value)

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
        this.renderField(field, parent, this.onChangeField),
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
        this.renderField(field, parent, this.onChangeField),
        this.renderSeparator(),
        this.renderReadonly('{' + value.length + '}')
      ]),
      h('ul', {class: 'jsoneditor-list'}, childs)
    ])
  }

  renderJSONValue ({parent, index, field, value}) {
    //console.log('JSONValue', field, value)

    return h('li', {}, [
      h('div', {class: 'jsoneditor-node'}, [
        index !== undefined
            ? this.renderReadonly(index)
            : this.renderField(field, parent, this.onChangeField),
        this.renderSeparator(),
        this.renderValue(value, this.onChangeValue, this.onClickUrl, this.onKeyDownUrl)
      ])
    ])
  }

  renderReadonly (text) {
    return h('div', {class: 'jsoneditor-readonly', contentEditable: false}, text)
  }

  renderField (field, parent, onChangeField) {
    const hasParent = parent !== null
    const content = hasParent ? escapeHTML(field) : valueType(this.props.value)

    return h('div', {
      class: 'jsoneditor-field' + (hasParent ? '' : ' jsoneditor-readonly'),
      contentEditable: hasParent,
      spellCheck: 'false',
      onInput: onChangeField
    }, content)
  }

  renderSeparator() {
    return h('div', {class: 'jsoneditor-separator'}, ':')
  }

  renderValue (value, onChangeValue, onClickUrl, onKeyDownUrl) {
    const type = valueType (value)
    const _isUrl = isUrl(value)
    const valueClass = 'jsoneditor-value jsoneditor-' + type + (_isUrl ? ' jsoneditor-url' : '')

    return h('div', {
      class: valueClass,
      contentEditable: true,
      spellCheck: 'false',  // FIXME: turning off spellcheck doesn't work
      onInput: onChangeValue,
      onClick: _isUrl ? onClickUrl : null,
      onKeyDown: _isUrl ? onKeyDownUrl: null,
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
    const value = stringConvert(unescapeHTML(getInnerText(event.target)))
    if (value !== this.props.value) {
      this.props.onChangeValue(path, value)
    }
  }

  onClickUrl (event) {
    if (event.ctrlKey && event.button === 0) { // Ctrl+Left click
      event.preventDefault()
      event.stopPropagation()

      this.openUrl()
    }
  }

  onKeyDownUrl (event) {
    if (event.ctrlKey && event.which === 13) { // Ctrl+Enter
      event.preventDefault()
      event.stopPropagation()

      this.openUrl()
    }
  }

  openUrl () {
    window.open(this.props.value, '_blank')
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
