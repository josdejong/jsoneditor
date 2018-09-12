import { createElement as h, PureComponent } from 'react'
import PropTypes from 'prop-types'
import initial from 'lodash/initial'
import isEqual from 'lodash/isEqual'
import naturalSort from 'javascript-natural-sort'

import FloatingMenu from './menu/FloatingMenu'
import { escapeHTML, unescapeHTML } from '../utils/stringUtils'
import { getInnerText, insideRect } from '../utils/domUtils'
import { stringConvert, valueType, isUrl } from  '../utils/typeUtils'
import {
  SELECTED, SELECTED_START, SELECTED_END, SELECTED_AFTER, SELECTED_INSIDE,
  SELECTED_FIRST, SELECTED_LAST
} from '../eson'
import { compileJSONPointer } from '../jsonPointer'
import { ERROR, EXPANDED, ID, SEARCH_PROPERTY, SEARCH_VALUE, SELECTION, TYPE, VALUE } from '../eson'

import fontawesome from '@fortawesome/fontawesome'
import faExclamationTriangle from '@fortawesome/fontawesome-free-solid/faExclamationTriangle'
import faCaretRight from '@fortawesome/fontawesome-free-solid/faCaretRight'
import faCaretDown from '@fortawesome/fontawesome-free-solid/faCaretDown'

fontawesome.library.add(faExclamationTriangle, faCaretRight, faCaretDown)

export default class JSONNode extends PureComponent {
  static URL_TITLE = 'Ctrl+Click or Ctrl+Enter to open url'

  static propTypes = {
    parentPath: PropTypes.array,
    prop: PropTypes.string,     // in case of an object property
    index: PropTypes.number,    // in case of an array item
    eson: PropTypes.any,   // enriched JSON object: Object, Array, number, string, or null

    emit: PropTypes.func.isRequired,
    findKeyBinding: PropTypes.func.isRequired,

    // options
    options: PropTypes.shape({
      isPropertyEditable: PropTypes.func,
      isValueEditable: PropTypes.func,
      escapeUnicode: PropTypes.bool
    })
  }

  constructor(props) {
    super(props)

    this.state = {
      menu: null,       // can contain object {anchor, root}
      appendMenu: null, // can contain object {anchor, root}
      hover: null,
      path: null // initialized via getDerivedStateFromProps
    }
  }

  static getDerivedStateFromProps(props, state) {
    const path = props.parentPath
        ? props.parentPath.concat('index' in props ? props.index : props.prop)
        : []

    // only update the path in the state if there is actually something changed,
    // else we get unnecessary re-rendering of all nodes
    return isEqual(path, state.path)
        ? null
        : { path }
  }

  componentWillUnmount () {
    if (hoveredNode === this) {
      hoveredNode = null
    }
  }

  render () {
    if (this.props.eson[TYPE] === 'array') {
      return this.renderJSONArray()
    }
    else if (this.props.eson[TYPE] === 'object') {
      return this.renderJSONObject()
    }
    else { // no Object or Array
      return this.renderJSONValue()
    }
  }

  renderJSONObject () {
    // TODO: refactor renderJSONObject (too large/complex)
    const eson = this.props.eson
    const jsonProps = Object.keys(eson).sort(naturalSort)
    const jsonPropsCount = jsonProps.length

    const nodeStart = h('div', {
        key: 'node',
        onKeyDown: this.handleKeyDown,
        className: 'jsoneditor-node jsoneditor-object'
      }, [
      this.renderExpandButton(),
      // this.renderDelimiter('\u2610'),
      this.renderProperty(),
      this.renderSeparator(),
      this.renderDelimiter('{', 'jsoneditor-delimiter-start'),
      !this.props.eson[EXPANDED]
          ? [
            this.renderTag(`${jsonPropsCount} ${jsonPropsCount === 1 ? 'prop' : 'props'}`,
                `Object containing ${jsonPropsCount} ${jsonPropsCount === 1 ? 'property' : 'properties'}`),
            this.renderDelimiter('}', 'jsoneditor-delimiter-end jsoneditor-delimiter-collapsed')
          ]
          : null,
      this.renderError(this.props.eson[ERROR])
    ])

    let childs
    if (this.props.eson[EXPANDED]) {
      if (jsonPropsCount > 0) {
        const propsChilds = jsonProps.map((prop) => h(this.constructor, {
          key: eson[prop][ID],
          parentPath: this.state.path,
          prop,
          eson: eson[prop],
          emit: this.props.emit,
          findKeyBinding: this.props.findKeyBinding,
          options: this.props.options
        }))

        childs = h('div', {key: 'childs', className: 'jsoneditor-list'}, propsChilds)
      }
      else {
        childs = h('div', {key: 'childs', className: 'jsoneditor-list', 'data-area': 'emptyBefore'},
          this.renderAppend('(empty object)')
        )
      }
    }

    // FIXME
    const floatingMenu = this.renderFloatingMenu('object', this.props.eson[SELECTION])
    const nodeEnd = this.props.eson[EXPANDED]
        ? h('div', {key: 'node-end', className: 'jsoneditor-node-end', 'data-area': 'empty'}, [
          this.renderDelimiter('}', 'jsoneditor-delimiter-end')
        ])
        : null

    return h('div', {
      'data-path': compileJSONPointer(this.state.path),
      'data-area': 'empty',
      className: this.getContainerClassName(this.props.eson[SELECTION], this.state.hover),
      // onMouseOver: this.handleMouseOver,
      // onMouseLeave: this.handleMouseLeave
    }, [floatingMenu, nodeStart, childs, nodeEnd])
  }

  renderJSONArray () {
    // TODO: refactor renderJSONArray (too large/complex)
    const count = this.props.eson.length
    const nodeStart = h('div', {
        key: 'node',
        onKeyDown: this.handleKeyDown,
        className: 'jsoneditor-node jsoneditor-array'
      }, [
      this.renderExpandButton(),
      this.renderProperty(),
      this.renderSeparator(),
      this.renderDelimiter('[', 'jsoneditor-delimiter-start'),
      !this.props.eson[EXPANDED]
          ? [
            this.renderTag(`${count} ${count === 1 ? 'item' : 'items'}`,
                `Array containing ${count} ${count === 1 ? 'item' : 'items'}`),
            this.renderDelimiter(']', 'jsoneditor-delimiter-end jsoneditor-delimiter-collapsed'),
          ]
          : null,
      this.renderError(this.props.eson[ERROR])
    ])

    let childs
    if (this.props.eson[EXPANDED]) {
      if (count > 0) {
        const items = this.props.eson.map((item, index) => h(this.constructor, {
          key: item[ID],
          parentPath: this.state.path,
          index,
          eson: item,
          options: this.props.options,
          emit: this.props.emit,
          findKeyBinding: this.props.findKeyBinding
        }))

        childs = h('div', {key: 'childs', className: 'jsoneditor-list'}, items)
      }
      else {
        childs = h('div', {key: 'childs', className: 'jsoneditor-list', 'data-area': 'emptyBefore'},
          this.renderAppend('(empty array)')
        )
      }
    }

    const floatingMenu = this.renderFloatingMenu('array', this.props.eson[SELECTION])
    const nodeEnd = this.props.eson[EXPANDED]
        ? h('div', {key: 'node-end', className: 'jsoneditor-node-end', 'data-area': 'empty'}, [
            this.renderDelimiter(']', 'jsoneditor-delimiter-end')
        ])
        : null

    return h('div', {
      'data-path': compileJSONPointer(this.state.path),
      'data-area': 'empty',
      className: this.getContainerClassName(this.props.eson[SELECTION], this.state.hover),
      // onMouseOver: this.handleMouseOver,
      // onMouseLeave: this.handleMouseLeave
    }, [floatingMenu, nodeStart, childs, nodeEnd])
  }

  renderJSONValue () {
    const node = h('div', {
        key: 'node',
        onKeyDown: this.handleKeyDown,
        className: 'jsoneditor-node'
      }, [
      this.renderPlaceholder(),
      this.renderProperty(),
      this.renderSeparator(),
      this.renderValue(this.props.eson[VALUE], this.props.eson[SEARCH_VALUE], this.props.options), // FIXME
      this.renderError(this.props.eson[ERROR])
    ])

    const floatingMenu = this.renderFloatingMenu('value', this.props.eson[SELECTION])

    // const insertArea = this.renderInsertBeforeArea()

    return h('div', {
      'data-path': compileJSONPointer(this.state.path),
      'data-area': 'empty',
      className: this.getContainerClassName(this.props.eson[SELECTION], this.state.hover),
      // onMouseOver: this.handleMouseOver,
      // onMouseLeave: this.handleMouseLeave
    }, [node, floatingMenu])
  }

  /**
   * Render contents for an empty object or array
   * @param {string} text
   * @return {*}
   */
  renderAppend (text) {
    return h('div', {
        'data-path': compileJSONPointer(this.state.path) + '/-',
        'data-area': 'empty',
        className: 'jsoneditor-node',
        onKeyDown: this.handleKeyDownAppend
      }, [
      this.renderPlaceholder('inside'),
      this.renderReadonly(text)
    ])
  }

  renderPlaceholder (dataArea = 'value') {
    return h('div', {
      key: 'placeholder',
      'data-area': dataArea,
      className: 'jsoneditor-button-placeholder'
    })
  }

  renderReadonly (text, title = null, dataArea = 'inside') {
    return h('div', {
      key: 'readonly',
      'data-area': dataArea,
      className: 'jsoneditor-readonly',
      title
    }, text)
  }

  renderTag (text, title = null) {
    return h('div', {
      key: 'readonly',
      className: 'jsoneditor-tag',
      onClick: this.handleExpand,
      title
    }, text)
  }

  // TODO: simplify the method renderProperty

  /**
   * Render a property field of a JSONNode
   */
  renderProperty () {
    const isProp = typeof this.props.prop === 'string'

    if (!isProp) {
      return null
    }

    const editable = !this.props.options.isPropertyEditable ||
        this.props.options.isPropertyEditable(this.state.path)

    const emptyClassName = (this.props.prop != null && this.props.prop.length === 0) ? ' jsoneditor-empty' : ''
    const searchClassName = this.props.prop != null ? JSONNode.getSearchResultClass(this.props.eson[SEARCH_PROPERTY]) : ''
    const escapedPropName = this.props.prop != null ? escapeHTML(this.props.prop, this.props.options.escapeUnicode) : null

    if (editable) {
      return [
        h('div', {
            key: 'property',
            className: 'jsoneditor-property' + emptyClassName + searchClassName,
            contentEditable: 'true',
            suppressContentEditableWarning: true,
            spellCheck: 'false',
            onBlur: this.handleChangeProperty
          }, escapedPropName),
      ]
    }
    else {
      return h('div', {
        key: 'property',
        className: 'jsoneditor-property jsoneditor-readonly' + searchClassName,
        spellCheck: 'false'
      }, escapedPropName)
    }
  }

  renderSeparator() {
    const isProp = typeof this.props.prop === 'string'
    if (!isProp) {
      return null
    }

    return h('div', {
      key: 'separator',
      className: 'jsoneditor-delimiter',
      'data-area': 'value'
    }, ':')
  }

  renderDelimiter (text, className = '') {
    return h('div', {
      key: text,
      'data-area': 'value',
      className: 'jsoneditor-delimiter ' + className
    }, text)
  }

  renderValue (value, searchResult, options) {
    const escapedValue = escapeHTML(value, options.escapeUnicode)
    const type = valueType (value)
    const itsAnUrl = isUrl(value)
    const isEmpty = escapedValue.length === 0

    const editable = !options.isValueEditable || options.isValueEditable(this.state.path)
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
        [
            h('i', {className: 'fa fa-exclamation-triangle'}),
            h('div', {className: 'jsoneditor-popover jsoneditor-right'}, error.message)
        ]
      )
    }
    else {
      return null
    }
  }

  getContainerClassName (selected, hover) {
    let classNames = ['jsoneditor-node-container']

    if ((selected & SELECTED_INSIDE) !== 0) {
      classNames.push('jsoneditor-selected-insert-before')
    }
    else if ((selected & SELECTED_AFTER) !== 0) {
      classNames.push('jsoneditor-selected-insert-after')
    }
    else {
      if ((selected & SELECTED) !== 0)        { classNames.push('jsoneditor-selected') }
      if ((selected & SELECTED_START) !== 0)  { classNames.push('jsoneditor-selected-start') }
      if ((selected & SELECTED_END) !== 0)    { classNames.push('jsoneditor-selected-end') }
      if ((selected & SELECTED_FIRST) !== 0)  { classNames.push('jsoneditor-selected-first') }
      if ((selected & SELECTED_LAST) !== 0)   { classNames.push('jsoneditor-selected-last') }
    }

    if ((hover & SELECTED_INSIDE) !== 0) {
      classNames.push('jsoneditor-hover-insert-before')
    }
    else if ((hover & SELECTED_AFTER) !== 0) {
      classNames.push('jsoneditor-hover-insert-after')
    }
    else {
      if ((hover & SELECTED) !== 0)         { classNames.push('jsoneditor-hover') }
      if ((hover & SELECTED_START) !== 0)   { classNames.push('jsoneditor-hover-start') }
      if ((hover & SELECTED_END) !== 0)     { classNames.push('jsoneditor-hover-end') }
    }

    return classNames.join(' ')
  }

  /**
   * Find the best position for the popover: right, above, below, or left
   * from the warning icon.
   * @param event
   */
  updatePopoverDirection = (event) => {
    if (event.target.nodeName === 'BUTTON') {
      const popover = event.target.lastChild

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
        JSONNode.getSearchResultClass(this.props.eson[SEARCH_VALUE])
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
    const expanded = this.props.eson[EXPANDED]
    const className = `jsoneditor-button jsoneditor-${expanded ? 'expanded' : 'collapsed'}`

    // unique key depending on expanded state is to force the fontawesome icon to update
    return h('div', {key: expanded, className: 'jsoneditor-button-container'},
        h('button', {
          className: className,
          onClick: this.handleExpand,
          title:
            'Click to expand/collapse this field. \n' +
            'Ctrl+Click to expand/collapse including all childs.'
        }, h('i', {
          className: expanded ? 'fa fa-caret-down' : 'fa fa-caret-right'}))
    )
  }

  renderFloatingMenu (type, selected) {
    if (((selected & SELECTED_END) === 0) &&
        ((selected & SELECTED_INSIDE) === 0) &&
        ((selected & SELECTED_AFTER) === 0)) {
      return null
    }

    const isLastOfMultiple = ((selected & SELECTED_LAST) !== 0) &&
        ((selected & SELECTED_FIRST) === 0)
    const isAfter = ((selected & SELECTED_AFTER) !== 0)
    // const isInside = ((selected & SELECTED_INSIDE) !== 0) // TODO: nicely position menu when selected inside

    return h(FloatingMenu, {
      key: 'floating-menu',
      path: this.state.path,
      emit: this.props.emit,
      items: this.getFloatingMenuItems(type, selected),
      position: isLastOfMultiple || isAfter ? 'bottom' : 'top'
    })
  }

  getFloatingMenuItems (type, selected) {
    if ((selected & SELECTED_AFTER) !== 0) {
      return [
        {type: 'insertStructureAfter'},
        {type: 'insertValueAfter'},
        {type: 'insertObjectAfter'},
        {type: 'insertArrayAfter'},
        {type: 'paste'},
      ]
    }

    if ((selected & SELECTED_INSIDE) !== 0) {
      return [
        {type: 'insertStructureInside'},
        {type: 'insertValueInside'},
        {type: 'insertObjectInside'},
        {type: 'insertArrayInside'},
        {type: 'paste'},
      ]
    }

    if (type === 'object') {
      return [
        {type: 'sort'},
        {type: 'duplicate'},
        {type: 'cut'},
        {type: 'copy'},
        {type: 'paste'},
        {type: 'remove'}
      ]
    }

    if (type === 'array') {
      return [
        {type: 'sort'},
        {type: 'duplicate'},
        {type: 'cut'},
        {type: 'copy'},
        {type: 'paste'},
        {type: 'remove'}
      ]
    }

    if (type === 'value') {
      return [
        // {text: 'String', onClick: this.props.emit('changeType', {type: 'checkbox', checked: false}}),
        {type: 'duplicate'},
        {type: 'cut'},
        {type: 'copy'},
        {type: 'paste'},
        {type: 'remove'}
      ]
    }

    throw new Error(`Cannot create FloatingMenu items for type: ${type}, selected: ${selected})`)
  }

  handleMouseOver = (event) => {
    if (event.buttons === 0) { // no mouse button down, no dragging
      event.stopPropagation()

      const hover = (event.target.className.indexOf('jsoneditor-insert-area') !== -1)
          ? (SELECTED + SELECTED_AFTER)
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
      hoveredNode.setState({hover: null})

      this.setState({hover: null})
  }

  static getRootName (value, options) {
    return typeof options.name === 'string'
        ? options.name
        : value[TYPE]
  }

  /** @private */
  handleChangeProperty = (event) => {
    const parentPath = initial(this.state.path)
    const oldProp = this.props.prop
    const newProp = unescapeHTML(getInnerText(event.target))

    if (newProp !== oldProp) {
      this.props.emit('changeProperty', {parentPath, oldProp, newProp})
    }
  }

  /** @private */
  handleChangeValue = (event) => {
    const value = this.getValueFromEvent(event)
    const path = this.state.path

    if (value !== this.props.eson[VALUE]) {
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
    const path = this.state.path

    if (keyBinding === 'duplicate') {
      event.preventDefault()
      this.props.emit('duplicate', {path})
    }

    if (keyBinding === 'insert') {
      event.preventDefault()
      this.props.emit('insert', {path, type: 'value'})
    }

    if (keyBinding === 'remove') {
      event.preventDefault()
      this.props.emit('remove', {path})
    }

    if (keyBinding === 'expand') {
      event.preventDefault()
      const recurse = false
      const expanded = !this.props.eson[EXPANDED]
      this.props.emit('expand', {path, expanded, recurse})
    }

    if (keyBinding === 'actionMenu') {
      event.preventDefault()
      // FIXME: open floating menu
    }
  }

  /** @private */
  handleKeyDownAppend = (event) => {
    const keyBinding = this.props.findKeyBinding(event)
    const path = this.state.path

    if (keyBinding === 'insert') {
      event.preventDefault()
      this.props.emit('append', {path, type: 'value'})
    }

    if (keyBinding === 'actionMenu') {
      event.preventDefault()
      // FIXME: open floating menu
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
    const path = this.state.path
    const expanded = !this.props.eson[EXPANDED]

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
    return this.state.type === 'string' // FIXME
        ? stringValue
        : stringConvert(stringValue)
  }
}

// singleton holding the node that's currently being hovered
let hoveredNode = null
