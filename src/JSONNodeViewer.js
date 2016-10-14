import { h } from 'preact'

import { escapeHTML } from './utils/stringUtils'
import JSONNode from './JSONNode'
import { valueType, isUrl } from  './utils/typeUtils'

export default class JSONNodeViewer extends JSONNode {
  constructor (props) {
    super(props)
  }

  renderActionMenuButton () {
    return null
  }

  renderAppendMenuButton () {
    return null
  }

  renderProperty (prop, data, options) {
    if (prop !== null) {
      const isIndex = typeof prop === 'number' // FIXME: pass an explicit prop isIndex

      if (isIndex) { // array item
        return h('div', {
          class: 'jsoneditor-property jsoneditor-readonly'
        }, prop)
      }
      else { // object property
        const escapedProp = escapeHTML(prop)

        return h('div', {
          class: 'jsoneditor-property' + (prop.length === 0 ? ' jsoneditor-empty' : '')
        }, escapedProp)
      }
    }
    else {
      // root node
      const content = JSONNode.getRootName(data, options)

      return h('div', {
        class: 'jsoneditor-property jsoneditor-readonly'
      }, content)
    }
  }

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
        contentEditable: 'false',
        spellCheck: 'false',
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
