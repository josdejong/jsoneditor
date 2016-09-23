import { h, render } from 'preact'
import TreeMode from './TreeMode'
import TextMode from './TextMode'

import '!style!css!less!./jsoneditor.less'

// TODO: allow adding new modes
const modes = {
  tree: TreeMode,
  text: TextMode,
  default: TreeMode
}

/**
 * Create a new json editor
 * @param {HTMLElement} container
 * @param {Options} options
 * @return {Object}
 * @constructor
 */
function jsoneditor (container, options) {
  const mode = options && options.mode
  const constructor = modes[mode] || modes['default']

  const elem = render(h(constructor, {options}), container)
  const component = elem._component

  return {
    isJSONEditor: true,

    _container: container,
    _options: options,
    _component: component,
    _modes: modes,

    // TODO: implement setMode

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
    },

    // TODO: implement getText
    // TODO: implement setText


    /**
     * Expand one or multiple objects or arrays.
     *
     * Example usage:
     *
     *     // expand one item at a specific path
     *     editor.expand(['foo', 1, 'bar'])
     *
     *     // expand all items nested at a maximum depth of 2
     *     editor.expand(function (path) {
     *       return path.length <= 2
     *     })
     *
     * @param {Path | function (path: Path) : boolean} callback
     */
    expand (callback) {
      component.expand(callback)
    },

    /**
     * Collapse one or multiple objects or arrays
     *
     * Example usage:
     *
     *     // collapse one item at a specific path
     *     editor.collapse(['foo', 1, 'bar'])
     *
     *     // collapse all items nested deeper than 2
     *     editor.collapse(function (path) {
     *       return path.length > 2
     *     })
     *
     * @param {Path | function (path: Path) : boolean} callback
     */
    collapse (callback) {
      component.collapse(callback)
    },

    /**
     * Apply a JSONPatch to the current JSON document
     * @param {Array} actions   JSONPatch actions
     * @return {Array} Returns a JSONPatch to revert the applied patch
     */
    patch (actions) {
      return component.patch(actions)
    }

    // TODO: implement destroy

  }
}

module.exports = jsoneditor
