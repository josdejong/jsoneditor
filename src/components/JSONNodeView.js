import { createElement as h } from 'react'

import { escapeHTML } from '../utils/stringUtils'
import { valueType, isUrl } from  '../utils/typeUtils'
import JSONNode from './JSONNode'
import JSONNodeForm from './JSONNodeForm'

/**
 * JSONNodeView
 *
 * Creates JSONNodes without action menus and with readonly properties and values
 */
export default class JSONNodeView extends JSONNodeForm {

  // render a readonly value but with colors
  renderValue (value, searchResult, options) {
    const escapedValue = escapeHTML(value, options.escapeUnicode)
    const type = valueType (value)
    const itsAnUrl = isUrl(value)
    const isEmpty = escapedValue.length === 0

    const editable = !options.isValueEditable || options.isValueEditable(this.props.path)
    if (editable) {
      return h('div', {
        key: 'value',
        ref: 'value',
        className: JSONNode.getValueClass(type, itsAnUrl, isEmpty) +
        JSONNode.getSearchResultClass(searchResult),
        contentEditable: 'false',
        spellCheck: 'false',
        onClick: this.handleClickValue,
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

  handleClickValue = (event) => {
    if (event.button === 0) { // Left click
      this.openLinkIfUrl(event)
    }
  }
}
