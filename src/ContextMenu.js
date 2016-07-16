import { h, Component } from 'preact'

export default class ContextMenu extends Component {
  constructor(props) {
    super(props)
  }
  
  render () {
    return h('div', {class: 'jsoneditor-contextmenu'}, 'context menu...')
  }
}
