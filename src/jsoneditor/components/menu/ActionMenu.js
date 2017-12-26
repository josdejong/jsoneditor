import { createElement as h, Component } from 'react'
import Menu from './Menu'
import {
    createChangeType, createSort,
    createSeparator,
    createInsert, createAppend, createDuplicate, createRemove
} from './items'

export default class ActionMenu extends Component {
  /**
   * props = {open, anchor, root, path, type, menuType, events, onRequestClose}
   */

  render () {
    const items = this.props.menuType === 'append'  // update or append
        ? this.createAppendMenuItems()
        : this.createActionMenuItems()

    // TODO: implement a hook to adjust the action menu items

    return h(Menu, { ...this.props, items })
  }

  createActionMenuItems () {
    const props = this.props

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

    return items
  }

  createAppendMenuItems () {
    return [
      createAppend(this.props.path, this.props.events.onAppend)
    ]
  }
}
