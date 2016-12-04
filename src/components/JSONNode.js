import { createElement as h, Component } from 'react'

import ActionButton from './menu/ActionButton'
import AppendActionButton from './menu/AppendActionButton'
import { escapeHTML, unescapeHTML } from '../utils/stringUtils'
import { getInnerText, insideRect } from '../utils/domUtils'
import { stringConvert, valueType, isUrl } from  '../utils/typeUtils'

/**
 * @type {JSONNode | null} activeContextMenu  singleton holding the JSONNode having
 *                                            the active (visible) context menu
 */
let activeContextMenu = null

export default class JSONNode extends Component {
  static URL_TITLE = 'Ctrl+Click or Ctrl+Enter to open url'

  constructor (props) {
    super(props)

    this.state = {
      menu: null,        // context menu
      appendMenu: null,  // append context menu (used in placeholder of empty object/array)
    }
  }

  render () {
    const { props } = this

    if (props.data.type === 'Array') {
      return this.renderJSONArray(props)
    }
    else if (props.data.type === 'Object') {
      return this.renderJSONObject(props)
    }
    else {
      return this.renderJSONValue(props)
    }
  }

  renderJSONObject ({prop, data, options, events}) {
    const childCount = data.props.length
    const contents = [
      h('div', {key: 'node', className: 'jsoneditor-node jsoneditor-object'}, [
        this.renderExpandButton(),
        this.renderActionMenuButton(),
        this.renderProperty(prop, data, options),
        this.renderReadonly(`{${childCount}}`, `Array containing ${childCount} items`),
        this.renderError(data.error)
      ])
    ]

    if (data.expanded) {
      if (data.props.length > 0) {
        const props = data.props.map(prop => {
          return h(this.constructor, {
            key: prop.name,
            parent: this,
            prop: prop.name,
            data: prop.value,
            options,
            events
          })
        })

        contents.push(h('ul', {key: 'props', className: 'jsoneditor-list'}, props))
      }
      else {
        contents.push(h('ul', {key: 'append', className: 'jsoneditor-list'},
          this.renderAppend('(empty object)')
        ))
      }
    }

    return h('li', {}, contents)
  }

  renderJSONArray ({prop, data, options, events}) {
    const childCount = data.items.length
    const contents = [
      h('div', {key: 'node', className: 'jsoneditor-node jsoneditor-array'}, [
        this.renderExpandButton(),
        this.renderActionMenuButton(),
        this.renderProperty(prop, data, options),
        this.renderReadonly(`[${childCount}]`, `Array containing ${childCount} items`),
        this.renderError(data.error)
      ])
    ]

    if (data.expanded) {
      if (data.items.length > 0) {
        const items = data.items.map((child, index) => {
          return h(this.constructor, {
            key: index,
            parent: this,
            prop: index,
            data: child,
            options,
            events
          })
        })
        contents.push(h('ul', {key: 'items', className: 'jsoneditor-list'}, items))
      }
      else {
        contents.push(h('ul', {key: 'append', className: 'jsoneditor-list'},
          this.renderAppend('(empty array)')
        ))
      }
    }

    return h('li', {}, contents)
  }

  renderJSONValue ({prop, data, options}) {
    return h('li', {},
      h('div', {className: 'jsoneditor-node'}, [
        this.renderPlaceholder(),
        this.renderActionMenuButton(),
        this.renderProperty(prop, data, options),
        this.renderSeparator(),
        this.renderValue(data.value, data.searchValue, options),
        this.renderError(data.error)
      ])
    )
  }

  /**
   * Render contents for an empty object or array
   * @param {string} text
   * @return {*}
   */
  renderAppend (text) {
    return h('li', {key: 'append'},
      h('div', {className: 'jsoneditor-node'}, [
        this.renderPlaceholder(),
        this.renderAppendMenuButton(),
        this.renderReadonly(text)
      ])
    )
  }

  renderPlaceholder () {
    return h('div', {key: 'placeholder', className: 'jsoneditor-button-placeholder'})
  }

  renderReadonly (text, title = null) {
    return h('div', {key: 'readonly', className: 'jsoneditor-readonly', title}, text)
  }

  renderProperty (prop, data, options) {
    if (prop === null) {
      // root node
      const rootName = JSONNode.getRootName(data, options)

      return h('div', {
        key: 'property',
        ref: 'property',
        className: 'jsoneditor-property jsoneditor-readonly',
        spellCheck: 'false',
        onBlur: this.handleChangeProperty
      }, rootName)
    }

    const isIndex = typeof prop === 'number' // FIXME: pass an explicit prop isIndex or editable
    const editable = !isIndex && (!options.isPropertyEditable || options.isPropertyEditable(this.getPath()))

    const emptyClassName = (prop.length === 0 ? ' jsoneditor-empty' : '')
    const searchClassName = data.searchProperty ? ' jsoneditor-highlight': '';

    if (editable) {
      const escapedProp = escapeHTML(prop, options.escapeUnicode)

      return h('div', {
        key: 'property',
        className: 'jsoneditor-property' + emptyClassName + searchClassName,
        contentEditable: 'true',
        spellCheck: 'false',
        onBlur: this.handleChangeProperty
      }, escapedProp)
    }
    else {
      return h('div', {
        key: 'property',
        className: 'jsoneditor-property jsoneditor-readonly' + searchClassName,
        spellCheck: 'false'
      }, prop)
    }
  }

  renderSeparator() {
    return h('div', {key: 'separator', className: 'jsoneditor-separator'}, ':')
  }

  renderValue (value, searchValue, options) {
    const escapedValue = escapeHTML(value, options.escapeUnicode)
    const type = valueType (value)
    const itsAnUrl = isUrl(value)
    const isEmpty = escapedValue.length === 0

    const editable = !options.isValueEditable || options.isValueEditable(this.getPath())
    if (editable) {
      return h('div', {
        key: 'value',
        ref: 'value',
        className: JSONNode.getValueClass(type, itsAnUrl, isEmpty, searchValue),
        contentEditable: 'true',
        spellCheck: 'false',
        onBlur: this.handleChangeValue,
        onInput: this.updateValueStyling,
        onClick: this.handleClickValue,
        onKeyDown: this.handleKeyDownValue,
        title: itsAnUrl ? JSONNode.URL_TITLE : null
      }, escapedValue)
    }
    else {
      return h('div', {
        key: 'value',
        className: 'jsoneditor-readonly',
        title: itsAnUrl ? JSONNode.URL_TITLE : null
      }, escapedValue)
    }
  }

  renderError (error) {
    if (error) {
      return h('button', {
          key: 'error',
          ref: 'error',
          type: 'button',
          className: 'jsoneditor-schema-error',
          onFocus: this.updatePopoverDirection,
          onMouseOver: this.updatePopoverDirection
        },
        h('div', {className: 'jsoneditor-popover jsoneditor-right'}, error.message)
      )
    }
    else {
      return null
    }
  }

  /**
   * Find the best position for the popover: right, above, below, or left
   * from the warning icon.
   * @param event
   */
  updatePopoverDirection = (event) => {
    if (event.target.nodeName === 'BUTTON') {
      const popover = event.target.firstChild

      const directions = ['right', 'above', 'below', 'left']
      for (let i = 0; i < directions.length; i++) {
        const  direction = directions[i]
        popover.className = 'jsoneditor-popover jsoneditor-' + direction

        // FIXME: the contentRect is that of the whole contents, not the visible window
        // TODO: use a ref on the root of the node instead of this parentNode chain?
        const contents = this.refs.error.parentNode.parentNode.parentNode
        const contentRect = contents.getBoundingClientRect()
        const popoverRect = popover.getBoundingClientRect()
        const margin = 20 // account for a scroll bar

        if (insideRect(contentRect, popoverRect, margin)) {
          // we found a location that fits, stop here
          break
        }
      }
    }
  }

  /**
   * Note: this function manipulates the className and title of the editable div
   * outside of Preact, so the user gets immediate feedback
   * @param event
   */
  updateValueStyling = (event) => {
    const value = this.getValueFromEvent(event)
    const type = valueType (value)
    const itsAnUrl = isUrl(value)
    const isEmpty = false  // not needed, our div has a border and is clearly visible

    // find the editable div, the root
    let target = event.target
    while (target.contentEditable !== 'true') {
      target = target.parentNode
    }

    target.className = JSONNode.getValueClass(type, itsAnUrl, isEmpty)
    target.title = itsAnUrl ? JSONNode.URL_TITLE : ''

    // remove all classNames from childs (needed for IE and Edge)
    JSONNode.removeChildClasses(target)
  }

  /**
   * Create the className for the property value
   * @param {string} type
   * @param {boolean} isUrl
   * @param {boolean} isEmpty
   * @param {boolean} [searchValue]
   * @return {string}
   * @public
   */
  static getValueClass (type, isUrl, isEmpty, searchValue) {
    return 'jsoneditor-value ' +
        'jsoneditor-' + type +
        (isUrl ? ' jsoneditor-url' : '') +
        (isEmpty ? ' jsoneditor-empty' : '') +
        (searchValue ? ' jsoneditor-highlight' : '')
  }

  /**
   * Recursively remove all classes from the childs of this element
   * @param elem
   * @public
   */
  static removeChildClasses (elem) {
    for (let i = 0; i < elem.childNodes.length; i++) {
      const child = elem.childNodes[i]
      if (child.class) {
        child.class = ''
      }
      JSONNode.removeChildClasses(child)
    }
  }

  renderExpandButton () {
    const className = `jsoneditor-button jsoneditor-${this.props.data.expanded ? 'expanded' : 'collapsed'}`

    return h('div', {key: 'expand', className: 'jsoneditor-button-container'},
        h('button', {
          className: className,
          onClick: this.handleExpand,
          title:
            'Click to expand/collapse this field. \n' +
            'Ctrl+Click to expand/collapse including all childs.'
        })
    )
  }

  renderActionMenuButton () {
    return h(ActionButton, {
      key: 'action',
      path: this.getPath(),
      type: this.props.data.type,
      events: this.props.events
    })
  }

  renderAppendMenuButton () {
    return h(AppendActionButton, {
      key: 'append',
      path: this.getPath(),
      events: this.props.events
    })
  }

  shouldComponentUpdate (nextProps, nextState) {
    let prop

    for (prop in nextProps) {
      if (nextProps.hasOwnProperty(prop) && this.props[prop] !== nextProps[prop]) {
        return true
      }
    }

    for (prop in nextState) {
      if (nextState.hasOwnProperty(prop) && this.state[prop] !== nextState[prop]) {
        return true
      }
    }

    return false
  }

  componentDidUpdate (prevProps, prevState) {
    // TODO: focus to input field
    // if (this.props.data.focusProperty && !prevProps.data.focusProperty) {
    //   console.log('focus property', this.getPath())
    //   this.refs.property.focus()
    // }
    //
    // if (this.props.data.focusValue && !prevProps.data.focusValue) {
    //   console.log('focus value', this.getPath())
    //   this.refs.value.focus()
    // }
  }

  static getRootName (data, options) {
    return typeof options.name === 'string'
        ? options.name
        : (data.type === 'Object' || data.type === 'Array')
        ? data.type
        : valueType(data.value)
  }

  /** @private */
  handleChangeProperty = (event) => {
    const parentPath = this.props.parent.getPath()
    const oldProp = this.props.prop
    const newProp = unescapeHTML(getInnerText(event.target))

    if (newProp !== oldProp) {
      this.props.events.onChangeProperty(parentPath, oldProp, newProp)
    }
  }

  /** @private */
  handleChangeValue = (event) => {
    const value = this.getValueFromEvent(event)

    if (value !== this.props.data.value) {
      this.props.events.onChangeValue(this.getPath(), value)
    }
  }

  /** @private */
  handleClickValue = (event) => {
    if (event.ctrlKey && event.button === 0) { // Ctrl+Left click
      this.openLinkIfUrl(event)
    }
  }

  /** @private */
  handleKeyDownValue = (event) => {
    if (event.ctrlKey && event.which === 13) { // Ctrl+Enter
      this.openLinkIfUrl(event)
    }
  }

  /** @private */
  handleExpand = (event) => {
    const recurse = event.ctrlKey
    const expanded = !this.props.data.expanded

    this.props.events.onExpand(this.getPath(), expanded, recurse)
  }

  /** @private */
  handleContextMenu = (event) => {
    event.stopPropagation()

    if (this.state.menu) {
      // hide context menu
      JSONNode.hideActionMenu()
    }
    else {
      // hide any currently visible context menu
      JSONNode.hideActionMenu()

      // show context menu
      this.setState({
        menu: {
          anchor: event.target,
          root: JSONNode.findRootElement(event)
        }
      })
      activeContextMenu = this
    }
  }

  /** @private */
  handleAppendContextMenu = (event) => {
    event.stopPropagation()

    if (this.state.appendMenu) {
      // hide append context menu
      JSONNode.hideActionMenu()
    }
    else {
      // hide any currently visible context menu
      JSONNode.hideActionMenu()

      // show append context menu
      this.setState({
        appendMenu: {
          anchor: event.target,
          root: JSONNode.findRootElement(event)
        }
      })
      activeContextMenu = this
    }
  }

  /**
   * Singleton function to hide the currently visible context menu if any.
   * @private
   */
  static hideActionMenu () {
    if (activeContextMenu) {
      activeContextMenu.setState({
        menu: null,
        appendMenu: null
      })
      activeContextMenu = null
    }
  }

  /**
   * When this JSONNode holds an URL as value, open this URL in a new browser tab
   * @param event
   * @protected
   */
  openLinkIfUrl (event) {
    const value = this.getValueFromEvent(event)

    if (isUrl(value)) {
      event.preventDefault()
      event.stopPropagation()

      window.open(value, '_blank')
    }
  }

  /**
   * Get the path of this JSONNode
   * @return {Path}
   */
  // TODO: get rid of getPath, it's not nice having a reference to the parent in the child
  getPath () {
    const path = this.props.parent
        ? this.props.parent.getPath()
        : []

    if (this.props.prop !== null) {
      path.push(this.props.prop)
    }

    return path
  }

  /**
   * Get the value of the target of an event, and convert it to it's type
   * @param event
   * @return {string | number | boolean | null}
   * @private
   */
  getValueFromEvent (event) {
    const stringValue = unescapeHTML(getInnerText(event.target))
    return this.props.data.type === 'string'
        ? stringValue
        : stringConvert(stringValue)
  }

  /**
   * Find the root DOM element of the JSONEditor
   * Search is done based on the CSS class 'jsoneditor'
   * @param event
   * @return {*}
   */
  // TODO: make redundant and cleanup
  static findRootElement (event) {
    function isEditorElement (elem) {
      // FIXME: this is a bit tricky. can we use a special attribute or something?
      return elem.className.split(' ').indexOf('jsoneditor') !== -1
    }

    let elem = event.target
    while (elem) {
      if (isEditorElement(elem)) {
        return elem
      }

      elem = elem.parentNode
    }

    return null
  }

}
