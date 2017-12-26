import { createElement as h, PureComponent } from 'react'
import initial from 'lodash/initial'

import ActionMenu from './menu/ActionMenu'
import FloatingMenu from './menu/FloatingMenu'
import { escapeHTML, unescapeHTML } from '../utils/stringUtils'
import { getInnerText, insideRect, findParentWithAttribute } from '../utils/domUtils'
import { stringConvert, valueType, isUrl } from  '../utils/typeUtils'
import { compileJSONPointer, META, SELECTED, SELECTED_END, SELECTED_AFTER, SELECTED_BEFORE } from  '../eson'

// TODO: rename SELECTED, SELECTED_END, etc to AREA_*? It's used for both selection and hovering
const SELECTED_CLASS_NAMES = {
  [SELECTED]: ' jsoneditor-selected',
  [SELECTED_END]: ' jsoneditor-selected jsoneditor-selected-end',
  [SELECTED_AFTER]: ' jsoneditor-selected jsoneditor-selected-insert-area',
  [SELECTED_BEFORE]: ' jsoneditor-selected jsoneditor-selected-insert-area',
}

const HOVERED_CLASS_NAMES = {
  [SELECTED]: ' jsoneditor-hover',
  [SELECTED_END]: ' jsoneditor-hover jsoneditor-hover-end',
  [SELECTED_AFTER]: ' jsoneditor-hover jsoneditor-hover-insert-area',
  [SELECTED_BEFORE]: ' jsoneditor-hover jsoneditor-hover-insert-area',
}

export default class JSONNode extends PureComponent {
  static URL_TITLE = 'Ctrl+Click or Ctrl+Enter to open url'

  state = {
    menu: null,       // can contain object {anchor, root}
    appendMenu: null, // can contain object {anchor, root}
    hover: false
  }

  componentWillMount (props) {
  }

  componentWillUnmount () {
    if (hoveredNode === this) {
      hoveredNode = null
    }
  }

  render () {
    if (this.props.eson[META].type === 'Object') {
      return this.renderJSONObject(this.props)
    }
    else if (this.props.eson[META].type === 'Array') {
      return this.renderJSONArray(this.props)
    }
    else { // no Object or Array
      return this.renderJSONValue(this.props)
    }
  }

  renderJSONObject ({prop, index, eson, options, events}) {
    const props = eson[META].props
    const node = h('div', {
        key: 'node',
        onKeyDown: this.handleKeyDown,
        className: 'jsoneditor-node jsoneditor-object'
      }, [
      this.renderExpandButton(),
      // this.renderActionMenu('update', this.state.menu, this.handleCloseActionMenu),
      // this.renderActionMenuButton(),
      this.renderProperty(prop, index, eson, options),
      this.renderReadonly(`{${props.length}}`, `Array containing ${props.length} items`),
      // this.renderFloatingMenuButton(),
      this.renderError(eson[META].error)
    ])

    let childs
    if (eson[META].expanded) {
      if (props.length > 0) {
        const propsChilds = props.map(prop => h(this.constructor, {
          key: eson[prop][META].id,
          // parent: this,
          prop,
          eson: eson[prop],
          options,
          events
        }))

        childs = h('div', {key: 'childs', className: 'jsoneditor-list'}, propsChilds)
      }
      else {
        childs = h('div', {key: 'childs', className: 'jsoneditor-list'},
          this.renderAppend('(empty object)')
        )
      }
    }

    const floatingMenu = (eson[META].selected === SELECTED_END)
        ? this.renderFloatingMenu([
            {type: 'sort'},
            {type: 'duplicate'},
            {type: 'cut'},
            {type: 'copy'},
            {type: 'paste'},
            {type: 'remove'}
          ])
        : null

    const insertArea = this.renderInsertBeforeArea()

    return h('div', {
      'data-path': compileJSONPointer(this.props.eson[META].path),
      className: this.getContainerClassName(eson[META].selected, this.state.hover),
      onMouseOver: this.handleMouseOver,
      onMouseLeave: this.handleMouseLeave
    }, [node, floatingMenu, insertArea, childs])
  }

  renderJSONArray ({prop, index, eson, options, events}) {
    const node = h('div', {
        key: 'node',
        onKeyDown: this.handleKeyDown,
        className: 'jsoneditor-node jsoneditor-array'
      }, [
      this.renderExpandButton(),
      // this.renderActionMenu('update', this.state.menu, this.handleCloseActionMenu),
      // this.renderActionMenuButton(),
      this.renderProperty(prop, index, eson, options),
      this.renderReadonly(`[${eson.length}]`, `Array containing ${eson.length} items`),
      // this.renderFloatingMenuButton(),
      this.renderError(eson[META].error)
    ])

    let childs
    if (eson[META].expanded) {
      if (eson.length > 0) {
        const items = eson.map((item, index) => h(this.constructor, {
          key : item[META].id,
          // parent: this,
          index,
          eson: item,
          options,
          events
        }))

        childs = h('div', {key: 'childs', className: 'jsoneditor-list'}, items)
      }
      else {
        childs = h('div', {key: 'childs', className: 'jsoneditor-list'},
          this.renderAppend('(empty array)')
        )
      }
    }

    const floatingMenu = (eson[META].selected === SELECTED_END)
        ? this.renderFloatingMenu([
            {type: 'sort'},
            {type: 'duplicate'},
            {type: 'cut'},
            {type: 'copy'},
            {type: 'paste'},
            {type: 'remove'}
          ])
        : null

    const insertArea = this.renderInsertBeforeArea()

    return h('div', {
      'data-path': compileJSONPointer(this.props.eson[META].path),
      className: this.getContainerClassName(eson[META].selected, this.state.hover),
      onMouseOver: this.handleMouseOver,
      onMouseLeave: this.handleMouseLeave
    }, [node, floatingMenu, insertArea, childs])
  }

  renderJSONValue ({prop, index, eson, options}) {
    const node = h('div', {
        key: 'node',
        onKeyDown: this.handleKeyDown,
        className: 'jsoneditor-node'
      }, [
      this.renderPlaceholder(),
      // this.renderActionMenu('update', this.state.menu, this.handleCloseActionMenu),
      // this.renderActionMenuButton(),
      this.renderProperty(prop, index, eson, options),
      this.renderSeparator(),
      this.renderValue(eson[META].value, eson[META].searchValue, options),
      // this.renderFloatingMenuButton(),
      this.renderError(eson[META].error)
    ])

    const floatingMenu = (eson[META].selected === SELECTED_END)
        ? this.renderFloatingMenu([
            // {text: 'String', onClick: this.props.events.onChangeType, type: 'checkbox', checked: false},
            {type: 'duplicate'},
            {type: 'cut'},
            {type: 'copy'},
            {type: 'paste'},
            {type: 'remove'}
          ])
        : null

    const insertArea = this.renderInsertBeforeArea()

    return h('div', {
      'data-path': compileJSONPointer(this.props.eson[META].path),
      className: this.getContainerClassName(eson[META].selected, this.state.hover),
      onMouseOver: this.handleMouseOver,
      onMouseLeave: this.handleMouseLeave
    }, [node, floatingMenu, insertArea])
  }

  renderInsertBeforeArea () {
    const floatingMenu = (this.props.eson[META].selected === SELECTED_BEFORE)
        ? this.renderFloatingMenu([
            {type: 'insertStructure'},
            {type: 'insertValue'},
            {type: 'insertObject'},
            {type: 'insertArray'},
            {type: 'paste'},
          ])
        : null

    return h('div', {
      key: 'menu',
      className: 'jsoneditor-insert-area',
      'data-area': 'before'
    }, [floatingMenu])
  }

  /**
   * Render contents for an empty object or array
   * @param {string} text
   * @return {*}
   */
  renderAppend (text) {
    return h('div', {
        'data-path': compileJSONPointer(this.props.eson[META].path) + '/-',
        className: 'jsoneditor-node',
        onKeyDown: this.handleKeyDownAppend
      }, [
      this.renderPlaceholder(),
      // this.renderActionMenu('append', this.state.appendMenu, this.handleCloseAppendActionMenu),
      // this.renderAppendActionMenuButton(),
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

  /**
   * Render a property field of a JSONNode
   * @param {string} [prop]
   * @param {string} [index]
   * @param {ESON} eson
   * @param {{escapeUnicode: boolean, isPropertyEditable: function(Path) : boolean}} options
   */
  renderProperty (prop, index, eson, options) {
    const isIndex = typeof index === 'number'
    const isProp = typeof prop === 'string'

    if (!isProp && !isIndex) {
      // root node
      const rootName = JSONNode.getRootName(eson, options)

      return h('div', {
        key: 'property',
        className: 'jsoneditor-property jsoneditor-readonly',
        spellCheck: 'false',
        onBlur: this.handleChangeProperty
      }, rootName)
    }

    const editable = !isIndex && (!options.isPropertyEditable || options.isPropertyEditable(this.props.eson[META].path))

    const emptyClassName = (prop != null && prop.length === 0) ? ' jsoneditor-empty' : ''
    const searchClassName = prop != null ? JSONNode.getSearchResultClass(eson[META].searchProperty) : ''
    const escapedPropName = prop != null ? escapeHTML(prop, options.escapeUnicode) : null

    if (editable) {
      return h('div', {
        key: 'property',
        className: 'jsoneditor-property' + emptyClassName + searchClassName,
        contentEditable: 'true',
        suppressContentEditableWarning: true,
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

    const editable = !options.isValueEditable || options.isValueEditable(this.props.eson[META].path)
    if (editable) {
      return h('div', {
        key: 'value',
        className: JSONNode.getValueClass(type, itsAnUrl, isEmpty) +
            JSONNode.getSearchResultClass(searchResult),
        contentEditable: 'true',
        suppressContentEditableWarning: true,
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

  getContainerClassName (selected, hover) {
    return 'jsoneditor-node-container' +
      (hover ? (HOVERED_CLASS_NAMES[hover]) : '') +
      (selected ? (SELECTED_CLASS_NAMES[selected]) : '')
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
        JSONNode.getSearchResultClass(this.props.eson[META].searchValue)
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
   * @param {SearchResultStatus} [searchResultStatus]
   */
  static getSearchResultClass (searchResultStatus) {
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
    const className = `jsoneditor-button jsoneditor-${this.props.eson[META].expanded ? 'expanded' : 'collapsed'}`

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
      path: this.props.eson[META].path,
      events: this.props.events,
      type: this.props.eson[META].type, // TODO: fix type

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

  // TODO: cleanup
  renderFloatingMenuButton () {
    const className = 'jsoneditor-button jsoneditor-floatingmenu' +
        ((this.state.open) ? ' jsoneditor-visible' : '')

    return h('div', {className: 'jsoneditor-button-container', key: 'action'}, [
      h('button', {
        key: 'button',
        className,
        onClick: this.handleOpenActionMenu
      })
    ])
  }

  renderFloatingMenu (items) {
    return h(FloatingMenu, {
      key: 'floating-menu',
      path: this.props.eson[META].path,
      events: this.props.events,
      items
    })
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

  handleMouseOver = (event) => {
    if (event.buttons === 0) { // no mouse button down, no dragging
      event.stopPropagation()

      const hover = (event.target.className.indexOf('jsoneditor-insert-area') !== -1)
          ? SELECTED_AFTER
          : SELECTED

      if (hoveredNode && hoveredNode !== this) {
        // FIXME: this gives issues when the hovered node doesn't exist anymore. check whether mounted?
        hoveredNode.setState({hover: null})
      }

      if (hover !== this.state.hover) {
        this.setState({hover})
        hoveredNode = this
      }
    }
  }

  handleMouseLeave = (event) => {
    event.stopPropagation()
    // FIXME: this gives issues when the hovered node doesn't exist anymore. check whether mounted?
      hoveredNode.setState({hover: false})

      this.setState({hover: null})
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

  static getRootName (eson, options) {
    return typeof options.name === 'string'
        ? options.name
        : valueType(eson)
  }

  /** @private */
  handleChangeProperty = (event) => {
    const parentPath = initial(this.props.eson[META].path)
    const oldProp = this.props.prop
    const newProp = unescapeHTML(getInnerText(event.target))

    if (newProp !== oldProp) {
      this.props.events.onChangeProperty(parentPath, oldProp, newProp)
    }
  }

  /** @private */
  handleChangeValue = (event) => {
    const value = this.getValueFromEvent(event)

    if (value !== this.props.eson[META].value) {
      this.props.events.onChangeValue(this.props.eson[META].path, value)
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
      this.props.events.onDuplicate(this.props.eson[META].path)
    }

    if (keyBinding === 'insert') {
      event.preventDefault()
      this.props.events.onInsert(this.props.eson[META].path, 'value')
    }

    if (keyBinding === 'remove') {
      event.preventDefault()
      this.props.events.onRemove(this.props.eson[META].path)
    }

    if (keyBinding === 'expand') {
      event.preventDefault()
      const recurse = false
      const expanded = !this.props.eson[META].expanded
      this.props.events.onExpand(this.props.eson[META].path, expanded, recurse)
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
      this.props.events.onAppend(this.props.eson[META].path, 'value')
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
    const path = this.props.eson[META].path
    const expanded = !this.props.eson[META].expanded

    this.props.events.onExpand(path, expanded, recurse)
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
    return this.props.eson[META].type === 'string'
        ? stringValue
        : stringConvert(stringValue)
  }
}

// singleton holding the node that's currently being hovered
let hoveredNode = null
