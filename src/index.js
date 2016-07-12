import { h, render } from 'preact'
import Main from './Main'

/**
 * Factory function to create a new JSONEditor
 * @param container
 * @return {*}
 * @constructor
 */
export default function jsoneditor (container) {
  const elem = render(h(Main), container)
  return elem._component
}

// TODO: UMD export

window.jsoneditor = jsoneditor


// export JSONEditor

