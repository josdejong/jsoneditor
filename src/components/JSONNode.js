// @flow weak

import { createElement as h, Component } from 'react'

import ActionMenu from './menu/ActionMenu'
import { escapeHTML, unescapeHTML } from '../utils/stringUtils'
import { getInnerText, insideRect, findParentWithAttribute } from '../utils/domUtils'
import { stringConvert, valueType, isUrl } from  '../utils/typeUtils'
import { compileJSONPointer } from  '../eson'

import type { ESONObjectProperty, ESON, SearchResultStatus, Path } from '../types'

export default class JSONNode extends Component {
  static URL_TITLE = 'Ctrl+Click or Ctrl+Enter to open url'

  state = {
    menu: null,       // can contain object {anchor, root}
    appendMenu: null, // can contain object {anchor, root}
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

  renderJSONObject ({prop, index, data, options, events}) {
    const childCount = data.props.length
    const node = h('div', {
        'data-path': compileJSONPointer(this.props.path),
        onKeyDown: this.handleKeyDown,
        key: 'node',
        className: 'jsoneditor-node jsoneditor-object'
      }, [
      this.renderExpandButton(),
      this.renderActionMenu('update', this.state.menu, this.handleCloseActionMenu),
      this.renderActionMenuButton(),
      this.renderProperty(prop, index, data, options),
      this.renderReadonly(`{${childCount}}`, `Array containing ${childCount} items`),
      this.renderError(data.error)
    ])

    let childs
    if (data.expanded) {
      if (data.props.length > 0) {
        const props = data.props.map(prop => {
          return h('li', { key: prop.id, className: (prop.value.selected ? ' jsoneditor-selected' : '') },
            h(this.constructor, {
              path: this.props.path.concat(prop.name),
              prop,
              data: prop.value,
              options,
              events
            })
          )
        })

        childs = h('ul', {key: 'childs', className: 'jsoneditor-list'}, props)
      }
      else {
        childs = h('ul', {key: 'childs', className: 'jsoneditor-list'},
          h('li', {},
            this.renderAppend('(empty object)')
          )
        )
      }
    }

    return h('div', {}, [node, childs])
  }

  // TODO: extract a function renderChilds shared by both renderJSONObject and renderJSONArray (rename .props and .items to .childs?)
  renderJSONArray ({prop, index, data, options, events}) {
    const childCount = data.items.length
    const node = h('div', {
        'data-path': compileJSONPointer(this.props.path),
        onKeyDown: this.handleKeyDown,
        key: 'node',
        className: 'jsoneditor-node jsoneditor-array'
      }, [
      this.renderExpandButton(),
      this.renderActionMenu('update', this.state.menu, this.handleCloseActionMenu),
      this.renderActionMenuButton(),
      this.renderProperty(prop, index, data, options),
      this.renderReadonly(`[${childCount}]`, `Array containing ${childCount} items`),
      this.renderError(data.error)
    ])

    let childs
    if (data.expanded) {
      if (data.items.length > 0) {
        const items = data.items.map((item, index) => {
          return h('li', { key : item.id, className: (item.value.selected ? ' jsoneditor-selected' : '')},
            h(this.constructor, {
              path: this.props.path.concat(String(index)),
              index,
              data: item.value,
              options,
              events
            })
          )
        })
        childs = h('ul', {key: 'childs', className: 'jsoneditor-list'}, items)
      }
      else {
        childs = h('ul', {key: 'childs', className: 'jsoneditor-list'},
          h('li', {},
            this.renderAppend('(empty array)')
          )
        )
      }
    }

    return h('div', {}, [node, childs])
  }

  renderJSONValue ({prop, index, data, options}) {
    return h('div', {
        'data-path': compileJSONPointer(this.props.path),
        onKeyDown: this.handleKeyDown,
        className: 'jsoneditor-node'
      }, [
      this.renderPlaceholder(),
      this.renderActionMenu('update', this.state.menu, this.handleCloseActionMenu),
      this.renderActionMenuButton(),
      this.renderProperty(prop, index, data, options),
      this.renderSeparator(),
      this.renderValue(data.value, data.searchResult, options),
      this.renderError(data.error)
    ])
  }

  /**
   * Render contents for an empty object or array
   * @param {string} text
   * @return {*}
   */
  renderAppend (text) {
    return h('div', {
        'data-path': compileJSONPointer(this.props.path) + '/-',
        className: 'jsoneditor-node',
        onKeyDown: this.handleKeyDownAppend
      }, [
      this.renderPlaceholder(),
      this.renderActionMenu('append', this.state.appendMenu, this.handleCloseAppendActionMenu),
      this.renderAppendActionMenuButton(),
      this.renderReadonly(text)
    ])
  }

  renderPlaceholder () {
    return h('div', {key: 'placeholder', className: 'jsoneditor-button-placeholder'})
  }

  renderReadonly (text, title = null) {
    return h('div', {key: 'readonly', className: 'jsoneditor-readonly', title}, text)
  }

  // TODO: simplify the method renderProperty
  renderProperty (prop?: ESONObjectProperty, index?: number, data: ESON, options: {escapeUnicode: boolean, isPropertyEditable: (Path) => boolean}) {
    const isIndex = typeof index === 'number'

    if (!prop && !isIndex) {
      // root node
      const rootName = JSONNode.getRootName(data, options)

      return h('div', {
        key: 'property',
        className: 'jsoneditor-property jsoneditor-readonly',
        spellCheck: 'false',
        onBlur: this.handleChangeProperty
      }, rootName)
    }

    const editable = !isIndex && (!options.isPropertyEditable || options.isPropertyEditable(this.props.path))

    const emptyClassName = (prop && prop.name.length === 0) ? ' jsoneditor-empty' : ''
    const searchClassName = prop ? JSONNode.getSearchResultClass(prop.searchResult) : ''
    const escapedPropName = prop ? escapeHTML(prop.name, options.escapeUnicode) : null

    if (editable) {
      return h('div', {
        key: 'property',
        className: 'jsoneditor-property' + emptyClassName + searchClassName,
        contentEditable: 'true',
        spellCheck: 'false',
        onBlur: this.handleChangeProperty
      }, escapedPropName)
    }
    else {
      return h('div', {
        key: 'property',
        className: 'jsoneditor-property jsoneditor-readonly' + searchClassName,
        spellCheck: 'false'
      }, isIndex ? index : escapedPropName)
    }
  }

  renderSeparator() {
    return h('div', {key: 'separator', className: 'jsoneditor-separator'}, ':')
  }

  renderValue (value, searchResult, options) {
    const escapedValue = escapeHTML(value, options.escapeUnicode)
    const type = valueType (value)
    const itsAnUrl = isUrl(value)
    const isEmpty = escapedValue.length === 0

    const editable = !options.isValueEditable || options.isValueEditable(this.props.path)
    if (editable) {
      return h('div', {
        key: 'value',
        className: JSONNode.getValueClass(type, itsAnUrl, isEmpty) +
            JSONNode.getSearchResultClass(searchResult),
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

        const contents = event.target.parentNode.parentNode.parentNode
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

    target.className = JSONNode.getValueClass(type, itsAnUrl, isEmpty) +
        JSONNode.getSearchResultClass(this.props.data.searchResult)
    target.title = itsAnUrl ? JSONNode.URL_TITLE : ''

    // remove all classNames from childs (needed for IE and Edge)
    JSONNode.removeChildClasses(target)
  }

  /**
   * Create the className for the property value
   * @param {string} type
   * @param {boolean} isUrl
   * @param {boolean} isEmpty
   * @return {string}
   * @public
   */
  static getValueClass (type, isUrl, isEmpty) {
    return 'jsoneditor-value ' +
        'jsoneditor-' + type +
        (isUrl ? ' jsoneditor-url' : '') +
        (isEmpty ? ' jsoneditor-empty' : '')
  }

  /**
   * Get the css style given a search result type
   */
  static getSearchResultClass (searchResultStatus?: SearchResultStatus) {
    if (searchResultStatus === 'active') {
      return ' jsoneditor-highlight-active'
    }

    if (searchResultStatus === 'normal') {
      return ' jsoneditor-highlight'
    }

    return ''
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

  // TODO: simplify code for the two action menus
  renderActionMenu (menuType, menuState, onClose) {
    if (!menuState) {
      return null
    }

    return h(ActionMenu, {
      key: 'menu',
      path: this.props.path,
      events: this.props.events,
      type: this.props.data.type,

      menuType,
      open: true,
      anchor: menuState.anchor,
      root: menuState.root,

      onRequestClose: onClose
    })
  }

  renderActionMenuButton () {
    const className = 'jsoneditor-button jsoneditor-actionmenu' +
        ((this.state.open) ? ' jsoneditor-visible' : '')

    return h('div', {className: 'jsoneditor-button-container', key: 'action'}, [
      h('button', {
        key: 'button',
        ref: 'actionMenuButton',
        className,
        onClick: this.handleOpenActionMenu
      })
    ])
  }

  renderAppendActionMenuButton () {
    const className = 'jsoneditor-button jsoneditor-actionmenu' +
        ((this.state.appendOpen) ? ' jsoneditor-visible' : '')

    return h('div', {className: 'jsoneditor-button-container', key: 'action'}, [
      h('button', {
        key: 'button',
        ref: 'appendActionMenuButton',
        className,
        onClick: this.handleOpenAppendActionMenu
      })
    ])
  }

  handleOpenActionMenu = (event) => {
    // TODO: don't use refs, find root purely via DOM?
    const root = findParentWithAttribute(this.refs.actionMenuButton, 'data-jsoneditor', 'true')

    this.setState({
      menu: {
        open: true,
        anchor: this.refs.actionMenuButton,
        root
      }
    })
  }

  handleCloseActionMenu = () => {
    this.setState({ menu: null })
  }

  handleOpenAppendActionMenu = (event) => {
    // TODO: don't use refs, find root purely via DOM?
    const root = findParentWithAttribute(this.refs.appendActionMenuButton, 'data-jsoneditor', 'true')

    this.setState({
      appendMenu: {
        open: true,
        anchor: this.refs.actionMenuButton,
        root
      }
    })
  }

  handleCloseAppendActionMenu = () => {
    this.setState({ appendMenu: null })
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

  static getRootName (data, options) {
    return typeof options.name === 'string'
        ? options.name
        : (data.type === 'Object' || data.type === 'Array')
        ? data.type
        : valueType(data.value)
  }

  /** @private */
  handleChangeProperty = (event) => {
    const parentPath = allButLast(this.props.path)
    const oldProp = this.props.prop.name
    const newProp = unescapeHTML(getInnerText(event.target))

    if (newProp !== oldProp) {
      this.props.events.onChangeProperty(parentPath, oldProp, newProp)
    }
  }

  /** @private */
  handleChangeValue = (event) => {
    const value = this.getValueFromEvent(event)

    if (value !== this.props.data.value) {
      this.props.events.onChangeValue(this.props.path, value)
    }
  }

  /** @private */
  handleClickValue = (event) => {
    if (event.ctrlKey && event.button === 0) { // Ctrl+Left click
      this.openLinkIfUrl(event)
    }
  }

  /** @private */
  handleKeyDown = (event) => {
    const keyBinding = this.props.events.findKeyBinding(event)

    if (keyBinding === 'duplicate') {
      event.preventDefault()
      this.props.events.onDuplicate(this.props.path)
    }

    if (keyBinding === 'insert') {
      event.preventDefault()
      this.props.events.onInsert(this.props.path, 'value')
    }

    if (keyBinding === 'remove') {
      event.preventDefault()
      this.props.events.onRemove(this.props.path)
    }

    if (keyBinding === 'expand') {
      event.preventDefault()
      const recurse = false
      const expanded = !this.props.data.expanded
      this.props.events.onExpand(this.props.path, expanded, recurse)
    }

    if (keyBinding === 'actionMenu') {
      event.preventDefault()
      this.handleOpenActionMenu(event)
    }
  }

  /** @private */
  handleKeyDownAppend = (event) => {
    const keyBinding = this.props.events.findKeyBinding(event)

    if (keyBinding === 'insert') {
      event.preventDefault()
      this.props.events.onAppend(this.props.path, 'value')
    }

    if (keyBinding === 'actionMenu') {
      event.preventDefault()
      this.handleOpenAppendActionMenu(event)
    }
  }

  /** @private */
  handleKeyDownValue = (event) => {
    const keyBinding = this.props.events.findKeyBinding(event)

    if (keyBinding === 'openUrl') {
      this.openLinkIfUrl(event)
    }
  }

  /** @private */
  handleExpand = (event) => {
    const recurse = event.ctrlKey
    const expanded = !this.props.data.expanded

    this.props.events.onExpand(this.props.path, expanded, recurse)
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
}

/**
 * Returns a copy of the array having the last item removed
 */
function allButLast (array: []): any {
  return array.slice(0, array.length - 1)
}
