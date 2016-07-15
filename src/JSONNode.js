import { h, Component } from 'preact'
import { escapeHTML, unescapeHTML } from './utils/stringUtils'
import { getInnerText } from './utils/domUtils'
import {stringConvert, valueType, isUrl} from  './utils/typeUtils'
import { last } from './utils/arrayUtils'

export default class JSONNode extends Component {
  constructor (props) {
    super(props)

    this.handleChangeProperty = this.handleChangeProperty.bind(this)
    this.handleChangeValue = this.handleChangeValue.bind(this)
    this.handleClickValue = this.handleClickValue.bind(this)
    this.handleKeyDownValue = this.handleKeyDownValue.bind(this)
    this.handleExpand = this.handleExpand.bind(this)
  }

  render (props) {
    if (props.data.type === 'array') {
      return this.renderJSONArray(props)
    }
    else if (props.data.type === 'object') {
      return this.renderJSONObject(props)
    }
    else {
      return this.renderJSONValue(props)
    }
  }

  renderJSONObject ({data, index, options, onChangeValue, onChangeProperty, onExpand}) {
    const childCount = data.childs.length
    const contents = [
      h('div', {class: 'jsoneditor-node jsoneditor-object'}, [
        this.renderExpandButton(),
        this.renderProperty(data, index, options),
        this.renderSeparator(),
        this.renderReadonly(`{${childCount}}`, `Array containing ${childCount} items`)
      ])
    ]

    if (data.expanded) {
      const childs = data.childs.map(child => {
        return h(JSONNode, {
          data: child,
          options,
          onChangeValue,
          onChangeProperty,
          onExpand
        })
      })

      contents.push(h('ul', {class: 'jsoneditor-list'}, childs))
    }

    return h('li', {}, contents)
  }

  renderJSONArray ({data, index, options, onChangeValue, onChangeProperty, onExpand}) {
    const childCount = data.childs.length
    const contents = [
      h('div', {class: 'jsoneditor-node jsoneditor-array'}, [
        this.renderExpandButton(),
        this.renderProperty(data, index, options),
        this.renderSeparator(),
        this.renderReadonly(`[${childCount}]`, `Array containing ${childCount} items`)
      ])
    ]

    if (data.expanded) {
      const childs = data.childs.map((child, index) => {
        return h(JSONNode, {
          data: child,
          index,
          options,
          onChangeValue,
          onChangeProperty,
          onExpand
        })
      })

      contents.push(h('ul', {class: 'jsoneditor-list'}, childs))
    }

    return h('li', {}, contents)
  }

  renderJSONValue ({data, index, options}) {
    return h('li', {}, [
      h('div', {class: 'jsoneditor-node'}, [
        h('div', {class: 'jsoneditor-button-placeholder'}),
        this.renderProperty(data, index, options),
        this.renderSeparator(),
        this.renderValue(data.value)
      ])
    ])
  }

  renderReadonly (text, title = null) {
    return h('div', {class: 'jsoneditor-readonly', contentEditable: false, title}, text)
  }

  renderProperty (data, index, options) {
    const property = last(data.path)
    const isProperty = typeof property === 'string'
    const content = isProperty
        ? escapeHTML(property)      // render the property name
        : index !== undefined
            ? index             // render the array index of the item
            : JSONNode._rootName(data, options)

    return h('div', {
      class: 'jsoneditor-property' + (isProperty ? '' : ' jsoneditor-readonly'),
      contentEditable: isProperty,
      spellCheck: 'false',
      onInput: this.handleChangeProperty
    }, content)
  }

  static _rootName (data, options) {
    return typeof options.name === 'string'
        ? options.name
        : (data.type === 'object' || data.type === 'array')
            ? data.type
            : valueType(data.value)
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
      onInput: this.handleChangeValue,
      onClick: this.handleClickValue,
      onKeyDown: this.handleKeyDownValue,
      title: _isUrl ? 'Ctrl+Click or ctrl+Enter to open url' : null
    }, escapeHTML(value))
  }

  renderExpandButton () {
    const className = `jsoneditor-button jsoneditor-${this.props.data.expanded ? 'expanded' : 'collapsed'}`
    return h('div', {class: 'jsoneditor-button-container'},
        h('button', {class: className, onClick: this.handleExpand})
    )
  }

  shouldComponentUpdate(nextProps, nextState) {
    return Object.keys(nextProps).some(prop => this.props[prop] !== nextProps[prop])
  }

  handleChangeProperty (event) {
    const property = unescapeHTML(getInnerText(event.target))
    const oldPath = this.props.data.path
    const newPath = oldPath.slice(0, oldPath.length - 1).concat(property)

    this.props.onChangeProperty(oldPath, newPath)
  }

  handleChangeValue (event) {
    const value = this._getValueFromEvent(event)

    this.props.onChangeValue(this.props.data.path, value)
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
    this.props.onExpand(this.props.data.path, !this.props.data.expanded)
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
}
