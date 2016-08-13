import { h, render } from 'preact'
import TreeMode from './TreeMode'

import '!style!css!less!./jsoneditor.less'

/**
 * Factory function to create a new JSONEditor
 * @param container
 * @param {Options} options
 * @return {*}
 * @constructor
 */
function jsoneditor (container, options) {
  // TODO: use JSONEditor instead of TreeMode
  const elem = render(h(TreeMode, {options}), container)
  return elem._component
}

// TODO: use export default jsoneditor, doesn't work out of the box in webpack
module.exports = jsoneditor;
