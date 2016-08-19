import { h, render } from 'preact'
import TreeMode from './TreeMode'

import '!style!css!less!./jsoneditor.less'

/**
 * Create a new json editor
 * @param {HTMLElement} container
 * @param {Options} options
 * @return {Object}
 * @constructor
 */
function jsoneditor (container, options) {
  const elem = render(h(TreeMode, {options}), container)
  const component = elem._component

  return {
    isJSONEditor: true,

    _container: container,
    _options: options,
    _component: component,

    /**
     * Set JSON object in editor
     * @param {Object | Array | string | number | boolean | null} json JSON data
     * @param {SetOptions} [options]
     */
    set: function (json, options = {}) {
      component.set(json, options)
    },

    /**
     * Get JSON from the editor
     * @returns {Object | Array | string | number | boolean | null} json
     */
    get: function () {
      return component.get()
    }

    // TODO: implement getText
    // TODO: implement setText
    // TODO: implement expand
  }
}

// TODO: use export default jsoneditor, doesn't work out of the box in webpack
module.exports = jsoneditor
