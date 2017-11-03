// @flow weak

import { createElement as h, PureComponent } from 'react'
import { keyComboFromEvent } from '../../utils/keyBindings'

const MENU_CLASS_NAME = 'jsoneditor-floating-menu'
const MENU_ITEM_CLASS_NAME = 'jsoneditor-floating-menu-item'

// Array:             Sort | Map | Filter | Duplicate | Cut | Copy | Remove
//                         advanced sort (asc, desc, nested fields, custom comparator)
//                         sort, map, filter, open a popup covering the editor (not the whole page)
//                         (or if it's small, can be a dropdown)
// Object:            Sort | Duplicate | Cut | Copy | Remove
//                         simple sort (asc/desc)
// Value:             [x] String | Duplicate | Cut | Copy | Remove
//                         String is a checkmark
// Between:           Insert Structure | Insert Value | Insert Object | Insert Array | Paste
//    inserting (value selected):  [field] [value]
//    inserting (array selected):  (immediately show the "Between" menu to create the first item)
//    inserting (object selected): (immediately show the "Between" menu to create the first property)
//
// Selection:          Duplicate | Cut | Copy | Paste | Remove
//
// menu must have vertical orientation on small screens?
//
// icons
//   cut
//   copy
//   paste
//   duplicate
//   remove
//   sort
//   transform   ???  -> filter? cog?
//   undo
//   redo
//   expand    ???
//   collapse  ???
//   format/compact ???
//
//   https://github.com/FortAwesome/Font-Awesome/wiki/Customize-Font-Awesome
//   http://fontastic.me/
//   --> have to create my own icons I guess :(

// TODO: show quick keys in the title of the menu items
const CREATE_TYPE = {
  sort: (path, events) => h('button', {
    key: 'sort',
    className: MENU_ITEM_CLASS_NAME,
    onClick: () => events.onSort(path),
    title: 'Sort'
  }, 'Sort'),

  duplicate: (path, events) => h('button', {
    key: 'duplicate',
    className: MENU_ITEM_CLASS_NAME,
    onClick: () => events.onDuplicate(path),
    title: 'Duplicate'
  }, 'Duplicate'),

  cut: (path, events) => h('button', {
    key: 'cut',
    className: MENU_ITEM_CLASS_NAME,
    onClick: () => events.onCut(path),
    title: 'Cut'
  }, 'Cut'),

  copy: (path, events) => h('button', {
    key: 'copy',
    className: MENU_ITEM_CLASS_NAME,
    onClick: () => events.onCopy(path),
    title: 'Copy'
  }, 'Copy'),

  paste: (path, events) => h('button', {
    key: 'paste',
    className: MENU_ITEM_CLASS_NAME,
    onClick: () => events.onPaste(path),
    title: 'Paste'
  }, 'Paste'),

  remove: (path, events) => h('button', {
    key: 'remove',
    className: MENU_ITEM_CLASS_NAME,
    onClick: () => events.onRemove(path),
    title: 'Remove'
  }, 'Remove'),

  insertStructure: (path, events) => h('button', {
    key: 'insertStructure',
    className: MENU_ITEM_CLASS_NAME,
    // onClick: () => events.onRemove(path),
    title: 'Insert a new object with the same data structure as the item above'
  }, 'Insert structure'),

  insertValue: (path, events) => h('button', {
    key: 'insertValue',
    className: MENU_ITEM_CLASS_NAME,
    // onClick: () => events.onRemove(path),
    title: 'Insert value'
  }, 'Insert value'),

  insertObject: (path, events) => h('button', {
    key: 'insertObject',
    className: MENU_ITEM_CLASS_NAME,
    // onClick: () => events.onRemove(path),
    title: 'Insert Object'
  }, 'Insert Object'),

  insertArray: (path, events) => h('button', {
    key: 'insertArray',
    className: MENU_ITEM_CLASS_NAME,
    // onClick: () => events.onRemove(path),
    title: 'Insert Array'
  }, 'Insert Array'),

}

export default class FloatingMenu extends PureComponent {
  componentDidMount () {
    setTimeout(() => {
      const firstButton = this.refs.root && this.refs.root.querySelector('button')
      if (firstButton) {
        firstButton.focus()
      }
    })
  }

  render () {
    return h('div', {ref: 'root', className: MENU_CLASS_NAME}, this.props.items.map(item => {
      const type = typeof item === 'string' ? item : item.type
      const createType = CREATE_TYPE[type]
      if (createType) {
        return createType(this.props.path, this.props.events)
      }
      else {
        throw new Error('Unknown type of menu item for floating menu: ' + JSON.stringify(item))
      }
    }))
  }
}
