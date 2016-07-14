import { h, Component } from 'preact'
import { escapeHTML, unescapeHTML } from './utils/stringUtils'
import { getInnerText } from './utils/domUtils'
import {stringConvert, valueType, isUrl, isObject} from  './utils/typeUtils'

export default class JSONNode extends Component {
  constructor (props) {
    super(props)

    this.state = {
      expanded: false
    }

    this.handleChangeField = this.handleChangeField.bind(this)
    this.handleChangeValue = this.handleChangeValue.bind(this)
    this.handleClickValue = this.handleClickValue.bind(this)
    this.handleKeyDownValue = this.handleKeyDownValue.bind(this)
    this.handleExpand = this.handleExpand.bind(this)
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

  renderJSONObject ({parent, index, field, value, onChangeValue, onChangeField}) {
    const childCount = Object.keys(value).length
    const contents = [
      h('div', {class: 'jsoneditor-node jsoneditor-object'}, [
        this.renderExpandButton(),
        this.renderField(parent, index, field, value),
        this.renderSeparator(),
        this.renderReadonly(`{${childCount}}`, `Array containing ${childCount} items`)
      ])
    ]

    if (this.state.expanded) {
      const childs = this.state.expanded && Object.keys(value).map(f => {
            return h(JSONNode, {
              parent: this,
              field: f,
              value: value[f],
              onChangeValue,
              onChangeField
            })
          })

      contents.push(h('ul', {class: 'jsoneditor-list'}, childs))
    }

    return h('li', {}, contents)
  }

  renderJSONArray ({parent, index, field, value, onChangeValue, onChangeField}) {
    const childCount = value.length
    const contents = [
      h('div', {class: 'jsoneditor-node jsoneditor-array'}, [
        this.renderExpandButton(),
        this.renderField(parent, index, field, value),
        this.renderSeparator(),
        this.renderReadonly(`[${childCount}]`, `Array containing ${childCount} items`)
      ])
    ]

    if (this.state.expanded) {
      const childs = this.state.expanded && value.map((v, i) => {
            return h(JSONNode, {
              parent: this,
              index: i,
              value: v,
              onChangeValue,
              onChangeField
            })
          })

      contents.push(h('ul', {class: 'jsoneditor-list'}, childs))
    }

    return h('li', {}, contents)
  }

  renderJSONValue ({parent, index, field, value}) {
    return h('li', {}, [
      h('div', {class: 'jsoneditor-node'}, [
        h('div', {class: 'jsoneditor-button-placeholder'}),
        this.renderField(parent, index, field, value),
        this.renderSeparator(),
        this.renderValue(value)
      ])
    ])
  }

  renderReadonly (text, title = null) {
    return h('div', {class: 'jsoneditor-readonly', contentEditable: false, title}, text)
  }

  renderField (parent, index, field, value) {
    const readonly = !parent || index !== undefined
    const content = !parent
        ? valueType(value)        // render 'object' or 'array', or 'number' as field
        : index !== undefined
            ? index               // render the array index of the item
            : escapeHTML(field)   // render the property name

    return h('div', {
      class: 'jsoneditor-field' + (readonly ? ' jsoneditor-readonly' : ''),
      contentEditable: !readonly,
      spellCheck: 'false',
      onBlur: this.handleChangeField
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
      onBlur: this.handleChangeValue,
      onClick: this.handleClickValue,
      onKeyDown: this.handleKeyDownValue,
      title: _isUrl ? 'Ctrl+Click or ctrl+Enter to open url' : null
    }, escapeHTML(value))
  }

  renderExpandButton () {
    const className = `jsoneditor-button jsoneditor-${this.state.expanded ? 'expanded' : 'collapsed'}`
    return h('div', {class: 'jsoneditor-button-container'},
        h('button', {class: className, onClick: this.handleExpand})
    )
  }

  shouldComponentUpdate(nextProps, nextState) {
    return Object.keys(nextProps).some(prop => this.props[prop] !== nextProps[prop]) ||
        (this.state && Object.keys(nextState).some(prop => this.state[prop] !== nextState[prop]))
  }

  handleChangeField (event) {
    const path = this.props.parent.getPath()
    const newField = unescapeHTML(getInnerText(event.target))
    const oldField = this.props.field
    if (newField !== oldField) {
      this.props.onChangeField(path, oldField, newField)
    }
  }

  handleChangeValue (event) {
    const path = this.getPath()
    const value = this._getValueFromEvent(event)
    if (value !== this.props.value) {
      this.props.onChangeValue(path, value)
    }
  }

  handleClickValue (event) {
    if (event.ctrlKey && event.button === 0) { // Ctrl+Left click
      this._openLinkIfUrl(event)
    }
  }

  handleKeyDownValue (event) {
    if (event.ctrlKey && event.which === 13) { // Ctrl+Enter
      this._openLinkIfUrl(event)
    }
  }

  handleExpand (event) {
    this.setState({
      expanded: !this.state.expanded
    })
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
