import { h, render } from 'preact'
import CodeMode from './CodeMode'
import TextMode from './TextMode'
import TreeMode from './TreeMode'
import { compileJSONPointer, parseJSONPointer } from './jsonData'

import '!style!css!less!./jsoneditor.less'

const modes = {
  code: CodeMode,
  form: TreeMode,
  text: TextMode,
  tree: TreeMode,
  view: TreeMode
}

/**
 * Create a new json editor
 * @param {HTMLElement} container
 * @param {Options} options
 * @return {Object}
 * @constructor
 */
function jsoneditor (container, options = {}) {
  if (arguments.length > 2) {
    throw new Error ('Passing JSON via the constructor has been deprecated. ' +
        'Please pass JSON via editor.set(json).')
  }

  const editor = {
    isJSONEditor: true,

    utils: {
      compileJSONPointer,
      parseJSONPointer
    },

    _container: container,
    _options: options,
    _modes: modes,
    _mode: null,
    _element: null,
    _component: null
  }

  /**
   * Set JSON object in editor
   * @param {Object | Array | string | number | boolean | null} json JSON data
   * @param {SetOptions} [options]
   */
  editor.set = function (json, options = {}) {
    editor._component.set(json, options)
  }

  /**
   * Get JSON from the editor
   * @returns {Object | Array | string | number | boolean | null} json
   */
  editor.get = function () {
    return editor._component.get()
  }

  /**
   * Set a string containing a JSON document
   * @param {string} text
   */
  editor.setText = function (text) {
    editor._component.setText(text)
  }

  /**
   * Get the JSON document as text
   * @return {string} text
   */
  editor.getText = function () {
    return editor._component.getText()
  }

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
  editor.expand = function (callback) {
    editor._component.expand(callback)
  }

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
  editor.collapse = function (callback) {
    editor._component.collapse(callback)
  }

  /**
   * Apply a JSONPatch to the current JSON document
   * @param {Array} actions   JSONPatch actions
   * @return {Array} Returns a JSONPatch to revert the applied patch
   */
  editor.patch = function (actions) {
    return editor._component.patch(actions)
  }

  /**
   * Change the mode of the editor
   * @param {'tree' | 'text'} mode
   */
  editor.setMode = function (mode) {
    if (mode === editor._mode) {
      // mode stays the same. do nothing
      return
    }

    let success = false
    let initialChildCount = editor._container.children.length
    let element
    try {
      // find the constructor for the selected mode
      const constructor = editor._modes[mode]
      if (!constructor) {
        throw new Error('Unknown mode "' + mode + '". ' +
            'Choose from: ' + Object.keys(modes).join(', '))
      }

      function handleChangeMode (mode) {
        const prevMode = editor._mode

        editor.setMode(mode)

        if (editor._options.onChangeMode) {
          editor._options.onChangeMode(mode, prevMode)
        }
      }

      // create new component
      element = render(
          h(constructor, {
            mode,
            options: editor._options,
            onChangeMode: handleChangeMode
          }),
          editor._container)

      // set JSON (this can throw an error)
      const text = editor._component ? editor._component.getText() : '{}'
      element._component.setText(text)

      // when setText didn't fail, we will reach this point
      success = true
    }
    finally {
      if (success) {
        // destroy previous component
        if (editor._element) {
          editor._element._component.destroy()
          editor._element.parentNode.removeChild(editor._element)
        }

        editor._mode = mode
        editor._element = element
        editor._component = element._component
      }
      else {
        // TODO: fall back to text mode when loading code mode failed?

        // remove the just created component if any (where construction or setText failed)
        const childCount = editor._container.children.length
        if (childCount !== initialChildCount) {
          editor._container.removeChild(editor._container.lastChild)
        }
      }
    }
  }

  // TODO: implement destroy

  editor.setMode(options && options.mode || 'tree')

  return editor
}

module.exports = jsoneditor
