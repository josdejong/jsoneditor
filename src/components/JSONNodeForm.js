import { h } from 'preact'

import { escapeHTML } from './utils/stringUtils'
import JSONNode from './JSONNode'

/**
 * JSONNodeForm
 *
 * Creates JSONNodes without action menus and with readonly properties
 */
export default class JSONNodeForm extends JSONNode {

  // render no action menu...
  renderActionMenuButton () {
    return null
  }

  // render no append menu...
  renderAppendMenuButton () {
    return null
  }

  // render a readonly property
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
}
