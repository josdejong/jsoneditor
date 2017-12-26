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

  /**
   * Render a property field of a JSONNode
   * @param {string} [prop]
   * @param {string} [index]
   * @param {ESON} eson
   * @param {{escapeUnicode: boolean, isPropertyEditable: function(Path) : boolean}} options
   */
  renderProperty (prop, index, eson, options) {
    const formOptions = Object.assign({}, options, { isPropertyEditable })

    return JSONNode.prototype.renderProperty.call(this, prop, index, eson, formOptions)
  }
}

function isPropertyEditable () {
  return false
}
