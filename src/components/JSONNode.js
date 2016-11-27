import { h, Component } from 'preact'

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

  render (props, state) {
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

  renderJSONObject ({prop, data, search, options, events}) {
    const childCount = data.props.length
    const contents = [
      h('div', {class: 'jsoneditor-node jsoneditor-object'}, [
        this.renderExpandButton(),
        this.renderActionMenuButton(),
        this.renderProperty(prop, data, search, options),
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
            search: prop.search,
            options,
            events
          })
        })

        contents.push(h('ul', {key: 'props', class: 'jsoneditor-list'}, props))
      }
      else {
        contents.push(h('ul', {key: 'append', class: 'jsoneditor-list'}, [
          this.renderAppend('(empty object)')
        ]))
      }
    }

    return h('li', {}, contents)
  }

  renderJSONArray ({prop, data, search, options, events}) {
    const childCount = data.items.length
    const contents = [
      h('div', {class: 'jsoneditor-node jsoneditor-array'}, [
        this.renderExpandButton(),
        this.renderActionMenuButton(),
        this.renderProperty(prop, data, search, options),
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
        contents.push(h('ul', {key: 'items', class: 'jsoneditor-list'}, items))
      }
      else {
        contents.push(h('ul', {key: 'append', class: 'jsoneditor-list'}, [
          this.renderAppend('(empty array)')
        ]))
      }
    }

    return h('li', {}, contents)
  }

  renderJSONValue ({prop, data, search, options}) {
    return h('li', {}, [
      h('div', {class: 'jsoneditor-node'}, [
        this.renderPlaceholder(),
        this.renderActionMenuButton(),
        this.renderProperty(prop, data, search, options),
        this.renderSeparator(),
        this.renderValue(data.value, data.search, options),
        this.renderError(data.error)
      ])
    ])
  }

  /**
   * Render contents for an empty object or array
   * @param {string} text
   * @return {*}
   */
  renderAppend (text) {
    return h('li', {key: 'append'}, [
      h('div', {class: 'jsoneditor-node'}, [
        this.renderPlaceholder(),
        this.renderAppendMenuButton(),
        this.renderReadonly(text)
      ])
    ])
  }

  renderPlaceholder () {
    return h('div', {class: 'jsoneditor-button-placeholder'})
  }

  renderReadonly (text, title = null) {
    return h('div', {class: 'jsoneditor-readonly', title}, text)
  }

  renderProperty (prop, data, search, options) {
    if (prop === null) {
      // root node
      const rootName = JSONNode.getRootName(data, options)

      return h('div', {
        class: 'jsoneditor-property jsoneditor-readonly',
        spellCheck: 'false',
        onBlur: this.handleChangeProperty
      }, rootName)
    }

    const isIndex = typeof prop === 'number' // FIXME: pass an explicit prop isIndex or editable
    const editable = !isIndex && (!options.isPropertyEditable || options.isPropertyEditable(this.getPath()))

    const emptyClassName = (prop.length === 0 ? ' jsoneditor-empty' : '')
    const searchClassName = search ? ' jsoneditor-highlight': '';

    if (editable) {
      const escapedProp = escapeHTML(prop, options.escapeUnicode)

      return h('div', {
        class: 'jsoneditor-property' + emptyClassName + searchClassName,
        contentEditable: 'true',
        spellCheck: 'false',
        onBlur: this.handleChangeProperty
      }, escapedProp)
    }
    else {
      return h('div', {
        class: 'jsoneditor-property jsoneditor-readonly' + searchClassName,
        spellCheck: 'false'
      }, prop)
    }
  }

  renderSeparator() {
    return h('div', {class: 'jsoneditor-separator'}, ':')
  }

  renderValue (value, searchResult, options) {
    const escapedValue = escapeHTML(value, options.escapeUnicode)
    const type = valueType (value)
    const itsAnUrl = isUrl(value)
    const isEmpty = escapedValue.length === 0

    const editable = !options.isValueEditable || options.isValueEditable(this.getPath())
    if (editable) {
      return h('div', {
        class: JSONNode.getValueClass(type, itsAnUrl, isEmpty, searchResult),
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
        class: 'jsoneditor-readonly',
        title: itsAnUrl ? JSONNode.URL_TITLE : null
      }, escapedValue)
    }
  }

  renderError (error) {
    if (error) {
      return h('button', {
        type: 'button',
        class: 'jsoneditor-schema-error',
        onFocus: this.updatePopoverDirection,
        onMouseOver: this.updatePopoverDirection
      },
        h('div', {class: 'jsoneditor-popover jsoneditor-right'}, error.message)
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
        const contents = this.base.parentNode.parentNode
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
   * @param {boolean | 'selected'} [searchResult]
   * @return {string}
   * @public
   */
  static getValueClass (type, isUrl, isEmpty, searchResult) {
    return 'jsoneditor-value ' +
        'jsoneditor-' + type +
        (isUrl ? ' jsoneditor-url' : '') +
        (isEmpty ? ' jsoneditor-empty' : '') +
        (searchResult === 'selected' ? ' jsoneditor-highlight-primary' :
            searchResult ? ' jsoneditor-highlight' : '')
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
    return h('div', {class: 'jsoneditor-button-container'},
        h('button', {
          class: className,
          onClick: this.handleExpand,
          title:
            'Click to expand/collapse this field. \n' +
            'Ctrl+Click to expand/collapse including all childs.'
        })
    )
  }

  renderActionMenuButton () {
    return h(ActionButton, {
      path: this.getPath(),
      type: this.props.data.type,
      events: this.props.events
    })
  }

  renderAppendMenuButton () {
    return h(AppendActionButton, {
      path: this.getPath(),
      events: this.props.events
    })
  }

  shouldComponentUpdate(nextProps, nextState) {
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
