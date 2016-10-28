import { h, Component } from 'preact'
import Menu from './Menu'
import {
    createChangeType, createSort,
    createSeparator,
    createInsert, createDuplicate, createRemove
} from './entries'

export default class ActionMenu extends Component {
  /**
   * @param {{open, anchor, root, path, type, events, onRequestClose}} props
   * @param state
   * @return {JSX.Element}
   */
  render (props, state) {
    let items = [] // array with menu items

    items.push(createChangeType(props.path, props.type, props.events.onChangeType))

    if (props.type === 'Array' || props.type === 'Object') {
      // FIXME: get current sort order (to display correct icon)
      const order = 'asc'
      items.push(createSort(props.path, order, props.events.onSort))
    }

    const hasParent = props.path.length > 0
    if (hasParent) {
      items.push(createSeparator())
      items.push(createInsert(props.path, props.events.onInsert))
      items.push(createDuplicate(props.path, props.events.onDuplicate))
      items.push(createRemove(props.path, props.events.onRemove))
    }

    // TODO: implement a hook to adjust the action menu

    return h(Menu, {
      ...props,
      items
    })
  }
}
