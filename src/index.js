import { h, render } from 'preact'
import Main from './Main'

/**
 * Factory function to create a new JSONEditor
 * @param container
 * @param {Options} options
 * @return {*}
 * @constructor
 */
export default function jsoneditor (container, options) {
  const elem = render(h(Main, {options}), container)
  return elem._component
}

// TODO: UMD export

window.jsoneditor = jsoneditor


// export JSONEditor

