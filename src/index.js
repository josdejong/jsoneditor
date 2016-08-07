import { h, render } from 'preact'
import TreeMode from './TreeMode'

/**
 * Factory function to create a new JSONEditor
 * @param container
 * @param {Options} options
 * @return {*}
 * @constructor
 */
export default function jsoneditor (container, options) {
  // TODO: use JSONEditor instead of TreeMode
  const elem = render(h(TreeMode, {options}), container)
  return elem._component
}

// TODO: UMD export

window.jsoneditor = jsoneditor


// export JSONEditor

