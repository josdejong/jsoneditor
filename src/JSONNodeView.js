import { h } from 'preact'

import { escapeHTML } from './utils/stringUtils'
import JSONNode from './JSONNode'
import JSONNodeForm from './JSONNodeForm'
import { valueType, isUrl } from  './utils/typeUtils'

/**
 * JSONNodeView
 *
 * Creates JSONNodes without action menus and with readonly properties and values
 */
export default class JSONNodeView extends JSONNodeForm {

  // render a readonly value
  renderValue (value) {
    const escapedValue = escapeHTML(value)
    const type = valueType (value)
    const isEmpty = escapedValue.length === 0
    const itsAnUrl = isUrl(value)
    const className = JSONNode.getValueClass(type, itsAnUrl, isEmpty)

    if (itsAnUrl) {
      return h('a', {
        class: className,
        href: escapedValue
      }, escapedValue)
    }
    else {
      return h('div', {
        class: className,
        onClick: this.handleClickValue
      }, escapedValue)
    }
  }

  handleClickValue = (event) => {
    if (event.button === 0) { // Left click
      this.openLinkIfUrl(event)
    }
  }
}
