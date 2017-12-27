import { createElement as h, PureComponent } from 'react'
import PropTypes from 'prop-types'
import initial from 'lodash/initial'

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

  static propTypes = {
    prop: PropTypes.string,   // in case of an object property
    index: PropTypes.number,  // in case of an array item
    eson: PropTypes.oneOfType([ PropTypes.object, PropTypes.array ]).isRequired, // TODO: rename "eson" to "value"?

    emit: PropTypes.func.isRequired,
    findKeyBinding: PropTypes.func.isRequired,

    // options
    options: PropTypes.shape({
      name: PropTypes.string,   // name of the root item
      isPropertyEditable: PropTypes.func,
      isValueEditable: PropTypes.func,
      escapeUnicode: PropTypes.bool
    })
  }

  state = {
    menu: null,       // can contain object {anchor, root}
    appendMenu: null, // can contain object {anchor, root}
    hover: false
  }

  componentWillUnmount () {
    if (hoveredNode === this) {
      hoveredNode = null
    }
  }

  render () {
    // console.log('JSONNode.render ' + JSON.stringify(this.props.eson[META].path))
    if (this.props.eson[META].type === 'Object') {
      return this.renderJSONObject()
    }
    else if (this.props.eson[META].type === 'Array') {
      return this.renderJSONArray()
    }
    else { // no Object or Array
      return this.renderJSONValue()
    }
  }

  renderJSONObject () {
    const props = this.props.eson[META].props
    const node = h('div', {
        key: 'node',
        onKeyDown: this.handleKeyDown,
        className: 'jsoneditor-node jsoneditor-object'
      }, [
      this.renderExpandButton(),
      this.renderProperty(this.props.prop, this.props.index, this.props.eson, this.props.options),
      this.renderReadonly(`{${props.length}}`, `Object containing ${props.length} items`),
      this.renderError(this.props.eson[META].error)
    ])

    let childs
    if (this.props.eson[META].expanded) {
      if (props.length > 0) {
        const propsChilds = props.map(prop => h(this.constructor, {
          key: this.props.eson[prop][META].id,
          prop,
          eson: this.props.eson[prop],
          emit: this.props.emit,
          findKeyBinding: this.props.findKeyBinding,
          options: this.props.options
        }))

        childs = h('div', {key: 'childs', className: 'jsoneditor-list'}, propsChilds)
      }
      else {
        childs = h('div', {key: 'childs', className: 'jsoneditor-list'},
          this.renderAppend('(empty object)')
        )
      }
    }

    const floatingMenu = (this.props.eson[META].selected === SELECTED_END)
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
      className: this.getContainerClassName(this.props.eson[META].selected, this.state.hover),
      onMouseOver: this.handleMouseOver,
      onMouseLeave: this.handleMouseLeave
    }, [node, floatingMenu, insertArea, childs])
  }

  renderJSONArray () {
    const node = h('div', {
        key: 'node',
        onKeyDown: this.handleKeyDown,
        className: 'jsoneditor-node jsoneditor-array'
      }, [
      this.renderExpandButton(),
      this.renderProperty(this.props.prop, this.props.index, this.props.eson, this.props.options),
      this.renderReadonly(`[${this.props.eson.length}]`, `Array containing ${this.props.eson.length} items`),
      this.renderError(this.props.eson[META].error)
    ])

    let childs
    if (this.props.eson[META].expanded) {
      if (this.props.eson.length > 0) {
        const items = this.props.eson.map((item, index) => h(this.constructor, {
          key : item[META].id,
          index,
          eson: item,
          options: this.props.options,
          emit: this.props.emit,
          findKeyBinding: this.props.findKeyBinding
        }))

        childs = h('div', {key: 'childs', className: 'jsoneditor-list'}, items)
      }
      else {
        childs = h('div', {key: 'childs', className: 'jsoneditor-list'},
          this.renderAppend('(empty array)')
        )
      }
    }

    const floatingMenu = (this.props.eson[META].selected === SELECTED_END)
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
      className: this.getContainerClassName(this.props.eson[META].selected, this.state.hover),
      onMouseOver: this.handleMouseOver,
      onMouseLeave: this.handleMouseLeave
    }, [node, floatingMenu, insertArea, childs])
  }

  renderJSONValue () {
    const node = h('div', {
        key: 'node',
        onKeyDown: this.handleKeyDown,
        className: 'jsoneditor-node'
      }, [
      this.renderPlaceholder(),
      // this.renderActionMenu('update', this.state.menu, this.handleCloseActionMenu),
      // this.renderActionMenuButton(),
      this.renderProperty(this.props.prop, this.props.index, this.props.eson, this.props.options),
      this.renderSeparator(),
      this.renderValue(this.props.eson[META].value, this.props.eson[META].searchValue, this.props.options),
      // this.renderFloatingMenuButton(),
      this.renderError(this.props.eson[META].error)
    ])

    const floatingMenu = (this.props.eson[META].selected === SELECTED_END)
        ? this.renderFloatingMenu([
            // {text: 'String', onClick: this.props.emit('changeType', {type: 'checkbox', checked: false}}),
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
      className: this.getContainerClassName(this.props.eson[META].selected, this.state.hover),
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
   * @param {number} [index]
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

  renderFloatingMenu (items) {
    return h(FloatingMenu, {
      key: 'floating-menu',
      path: this.props.eson[META].path,
      emit: this.props.emit,
      items
    })
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
      this.props.emit('changeProperty', {parentPath, oldProp, newProp})
    }
  }

  /** @private */
  handleChangeValue = (event) => {
    const value = this.getValueFromEvent(event)
    const path = this.props.eson[META].path

    if (value !== this.props.eson[META].value) {
      this.props.emit('changeValue', {path, value})
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
    const keyBinding = this.props.findKeyBinding(event)

    if (keyBinding === 'duplicate') {
      event.preventDefault()
      this.props.emit('duplicate', {path: this.props.eson[META].path})
    }

    if (keyBinding === 'insert') {
      event.preventDefault()
      this.props.emit('insert', {path: this.props.eson[META].path, type: 'value'})
    }

    if (keyBinding === 'remove') {
      event.preventDefault()
      this.props.emit('remove', {path: this.props.eson[META].path})
    }

    if (keyBinding === 'expand') {
      event.preventDefault()
      const recurse = false
      const expanded = !this.props.eson[META].expanded
      this.props.emit('expand', {path: this.props.eson[META].path, expanded, recurse})
    }

    if (keyBinding === 'actionMenu') {
      event.preventDefault()
      this.handleOpenActionMenu(event)
    }
  }

  /** @private */
  handleKeyDownAppend = (event) => {
    const keyBinding = this.props.findKeyBinding(event)

    if (keyBinding === 'insert') {
      event.preventDefault()
      this.props.emit('append', {path: this.props.eson[META].path, type: 'value'})
    }

    if (keyBinding === 'actionMenu') {
      event.preventDefault()
      this.handleOpenAppendActionMenu(event)
    }
  }

  /** @private */
  handleKeyDownValue = (event) => {
    const keyBinding = this.props.findKeyBinding(event)

    if (keyBinding === 'openUrl') {
      this.openLinkIfUrl(event)
    }
  }

  /** @private */
  handleExpand = (event) => {
    const recurse = event.ctrlKey
    const path = this.props.eson[META].path
    const expanded = !this.props.eson[META].expanded

    this.props.emit('expand', {path, expanded, recurse})
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
