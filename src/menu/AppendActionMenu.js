import { h, Component } from 'preact'
import Menu from './Menu'
import { createAppend } from './entries'

export default class AppendActionMenu extends Component {
  /**
   * @param {{anchor, root, path, events}} props
   * @param state
   * @return {JSX.Element}
   */
  render (props, state) {
    const items = [
      createAppend(props.path, props.events.onAppend)
    ]

    // TODO: implement a hook to adjust the action menu

    return h(Menu, {
      ...props,
      items
    })
  }
}
