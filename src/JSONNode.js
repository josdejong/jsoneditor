import { h, Component } from 'preact'

import ContextMenu from './ContextMenu'
import { escapeHTML, unescapeHTML } from './utils/stringUtils'
import { last } from './utils/arrayUtils'
import { getInnerText } from './utils/domUtils'
import {stringConvert, valueType, isUrl} from  './utils/typeUtils'

// TYPE_TITLES with explanation for the different types
const TYPE_TITLES = {
  'value': 'Item type "value". ' +
    'The item type is automatically determined from the value ' +
    'and can be a string, number, boolean, or null.',
  'object': 'Item type "object". ' +
    'An object contains an unordered set of key/value pairs.',
  'array': 'Item type "array". ' +
    'An array contains an ordered collection of values.',
  'string': 'Item type "string". ' +
    'Item type is not determined from the value, ' +
    'but always returned as string.'
};


export default class JSONNode extends Component {
  constructor (props) {
    super(props)

    // TODO: create a function bindMethods(this)
    this.handleChangeProperty = this.handleChangeProperty.bind(this)
    this.handleChangeValue = this.handleChangeValue.bind(this)
    this.handleClickValue = this.handleClickValue.bind(this)
    this.handleKeyDownValue = this.handleKeyDownValue.bind(this)
    this.handleExpand = this.handleExpand.bind(this)
    this.handleContextMenu = this.handleContextMenu.bind(this)
  }

  render (props) {
    if (props.data.type === 'array') {
      return this.renderJSONArray(props)
    }
    else if (props.data.type === 'object') {
      return this.renderJSONObject(props)
    }
    else {
      return this.renderJSONValue(props)
    }
  }

  renderJSONObject ({path, data, options, events}) {
    const childCount = data.props.length
    const contents = [
      h('div', {class: 'jsoneditor-node jsoneditor-object'}, [
        this.renderExpandButton(),
        this.renderContextMenuButton(),
        this.renderProperty(path, data, options),
        this.renderSeparator(), // TODO: remove separator for Object and Array (gives an issue in Preact)
        this.renderReadonly(`{${childCount}}`, `Array containing ${childCount} items`)
      ])
    ]

    if (data.expanded) {
      const props = data.props.map(prop => {
        return h(JSONNode, {
          path: path.concat(prop.name),
          data: prop.value,
          options,
          events
        })
      })

      contents.push(h('ul', {class: 'jsoneditor-list'}, props))
    }

    return h('li', {}, contents)
  }

  renderJSONArray ({path, data, options, events}) {
    const childCount = data.items.length
    const contents = [
      h('div', {class: 'jsoneditor-node jsoneditor-array'}, [
        this.renderExpandButton(),
        this.renderContextMenuButton(),
        this.renderProperty(path, data, options),
        this.renderSeparator(), // TODO: remove separator for Object and Array (gives an issue in Preact)
        this.renderReadonly(`[${childCount}]`, `Array containing ${childCount} items`)
      ])
    ]

    if (data.expanded) {
      const items = data.items.map((child, index) => {
        return h(JSONNode, {
          path: path.concat(index),
          data: child,
          options,
          events
        })
      })

      contents.push(h('ul', {class: 'jsoneditor-list'}, items))
    }

    return h('li', {}, contents)
  }

  renderJSONValue ({path, data, options}) {
    return h('li', {}, [
      h('div', {class: 'jsoneditor-node'}, [
        h('div', {class: 'jsoneditor-button-placeholder'}),
        this.renderContextMenuButton(),
        this.renderProperty(path, data, options),
        this.renderSeparator(),
        this.renderValue(data.value)
      ])
    ])
  }

  renderReadonly (text, title = null) {
    return h('div', {class: 'jsoneditor-readonly', contentEditable: false, title}, text)
  }

  renderProperty (path, data, options) {
    console.log('renderProperty', path, data)

    if (path.length > 0) {
      const prop = last(path)
      const isIndex = typeof prop === 'number'

      if (isIndex) { // array item
        return h('div', {
          class: 'jsoneditor-property jsoneditor-readonly',
          contentEditable: 'false',
          spellCheck: 'false'
        }, prop)
      }
      else { // object property
        return h('div', {
          class: 'jsoneditor-property',
          contentEditable: 'true',
          spellCheck: 'false',
          onInput: this.handleChangeProperty
        }, prop)
      }
    }
    else {
      // root node
      const content = JSONNode._rootName(data, options)

      return h('div', {
        class: 'jsoneditor-property jsoneditor-readonly',
        contentEditable: 'false',
        spellCheck: 'false',
        onInput: this.handleChangeProperty
      }, content)
    }
  }

  renderSeparator() {
    return h('div', {class: 'jsoneditor-separator'}, ':')
  }

  renderValue (value) {
    const type = valueType (value)
    const _isUrl = isUrl(value)
    const valueClass = 'jsoneditor-value jsoneditor-' + type + (_isUrl ? ' jsoneditor-url' : '')

    return h('div', {
      class: valueClass,
      contentEditable: true,
      spellCheck: 'false',
      onInput: this.handleChangeValue,
      onClick: this.handleClickValue,
      onKeyDown: this.handleKeyDownValue,
      title: _isUrl ? 'Ctrl+Click or ctrl+Enter to open url' : null
    }, escapeHTML(value))
  }

  renderExpandButton () {
    const className = `jsoneditor-button jsoneditor-${this.props.data.expanded ? 'expanded' : 'collapsed'}`
    return h('div', {class: 'jsoneditor-button-container'},
        h('button', {class: className, onClick: this.handleExpand})
    )
  }

  renderContextMenuButton () {
    const className = 'jsoneditor-button jsoneditor-contextmenu' +
        (this.props.data.contextMenu ? ' jsoneditor-visible' : '')

    return h('div', {class: 'jsoneditor-button-container'},
        this.props.data.contextMenu
            ? this.renderContextMenu(this.props.data.contextMenu)
            : null,
        h('button', {class: className, onClick: this.handleContextMenu})
    )
  }

  renderContextMenu ({anchor, root}) {
    const path = this.props.path
    const hasParent = path.length > 0
    const type = this.props.data.type
    const events = this.props.events
    const items = [] // array with menu items

    items.push({
      text: 'Type',
      title: 'Change the type of this field',
      className: 'jsoneditor-type-' + type,
      submenu: [
        {
          text: 'Value',
          className: 'jsoneditor-type-value' + (type == 'value' ? ' jsoneditor-selected' : ''),
          title: TYPE_TITLES.value,
          click: () => events.onChangeType(path, 'value')
        },
        {
          text: 'Array',
          className: 'jsoneditor-type-array' + (type == 'array' ? ' jsoneditor-selected' : ''),
          title: TYPE_TITLES.array,
          click: () => events.onChangeType(path, 'array')
        },
        {
          text: 'Object',
          className: 'jsoneditor-type-object' + (type == 'object' ? ' jsoneditor-selected' : ''),
          title: TYPE_TITLES.object,
          click: () => events.onChangeType(path, 'object')
        },
        {
          text: 'String',
          className: 'jsoneditor-type-string' + (type == 'string' ? ' jsoneditor-selected' : ''),
          title: TYPE_TITLES.string,
          click: () => events.onChangeType(path, 'string')
        }
      ]
    });

    if (type === 'array' || type === 'object') {
      var direction = ((this.sortOrder == 'asc') ? 'desc': 'asc');
      items.push({
        text: 'Sort',
        title: 'Sort the childs of this ' + TYPE_TITLES.type,
        className: 'jsoneditor-sort-' + direction,
        click: () => events.onSort(path),
        submenu: [
          {
            text: 'Ascending',
            className: 'jsoneditor-sort-asc',
            title: 'Sort the childs of this ' + TYPE_TITLES.type + ' in ascending order',
            click: () => events.onSort(path, 'asc')
          },
          {
            text: 'Descending',
            className: 'jsoneditor-sort-desc',
            title: 'Sort the childs of this ' + TYPE_TITLES.type +' in descending order',
            click: () => events.onSort(path, 'desc')
          }
        ]
      });
    }

    if (hasParent) {
      if (items.length) {
        // create a separator
        items.push({
          'type': 'separator'
        });
      }

      // create insert button
      items.push({
        text: 'Insert',
        title: 'Insert a new item with type \'value\' after this item (Ctrl+Ins)',
        submenuTitle: 'Select the type of the item to be inserted',
        className: 'jsoneditor-insert',
        click: () => events.onInsert(path, 'value'),
        submenu: [
          {
            text: 'Value',
            className: 'jsoneditor-type-value',
            title: TYPE_TITLES.value,
            click: () => events.onInsert(path, 'value')
          },
          {
            text: 'Array',
            className: 'jsoneditor-type-array',
            title: TYPE_TITLES.array,
            click: () => events.onInsert(path, 'array')
          },
          {
            text: 'Object',
            className: 'jsoneditor-type-object',
            title: TYPE_TITLES.object,
            click: () => events.onInsert(path, 'object')
          },
          {
            text: 'String',
            className: 'jsoneditor-type-string',
            title: TYPE_TITLES.string,
            click: () => events.onInsert(path, 'string')
          }
        ]
      });

      if (this.props.path !== '') {
        // create duplicate button
        items.push({
          text: 'Duplicate',
          title: 'Duplicate this item (Ctrl+D)',
          className: 'jsoneditor-duplicate',
          click: () => events.onDuplicate(path)
        });

        // create remove button
        items.push({
          text: 'Remove',
          title: 'Remove this item (Ctrl+Del)',
          className: 'jsoneditor-remove',
          click: () => events.onRemove(path)
        });
      }
    }

    // TODO: implement a hook to adjust the context menu

    return h(ContextMenu, {anchor, root, items})
  }

  shouldComponentUpdate(nextProps, nextState) {
    // WARNING: we suppose that JSONNode is stateless, we don't check changes in the state, only in props
    return Object.keys(nextProps).some(prop => this.props[prop] !== nextProps[prop])
  }

  static _rootName (data, options) {
    return typeof options.name === 'string'
        ? options.name
        : (data.type === 'object' || data.type === 'array')
        ? data.type
        : valueType(data.value)
  }

  handleChangeProperty (event) {
    const oldProp = last(this.props.path)
    const newProp = unescapeHTML(getInnerText(event.target))

    // remove last entry from the path to get the path of the parent object
    const parentPath = this.props.path.slice(0, this.props.path.length - 1)

    this.props.events.onChangeProperty(parentPath, oldProp, newProp)
  }

  handleChangeValue (event) {
    const value = this._getValueFromEvent(event)

    this.props.events.onChangeValue(this.props.path, value)
  }

  handleClickValue (event) {
    if (event.ctrlKey && event.button === 0) { // Ctrl+Left click
      this._openLinkIfUrl(event)
    }
  }

  handleKeyDownValue (event) {
    if (event.ctrlKey && event.which === 13) { // Ctrl+Enter
      this._openLinkIfUrl(event)
    }
  }

  handleExpand (event) {
    this.props.events.onExpand(this.props.path, !this.props.data.expanded)
  }

  handleContextMenu (event) {
    event.stopPropagation() // stop propagation, because else Main.js will hide the context menu again

    if (this.props.data.contextMenu) {
      this.props.events.hideContextMenu()
    }
    else {
      this.props.events.showContextMenu({
        path: this.props.path,
        anchor: event.target,
        root: JSONNode._findRootElement(event)
      })
    }
  }

  /**
   * When this JSONNode holds an URL as value, open this URL in a new browser tab
   * @param event
   * @private
   */
  _openLinkIfUrl (event) {
    const value = this._getValueFromEvent(event)

    if (isUrl(value)) {
      event.preventDefault()
      event.stopPropagation()

      window.open(value, '_blank')
    }
  }

  /**
   * Get the value of the target of an event, and convert it to it's type
   * @param event
   * @return {string | number | boolean | null}
   * @private
   */
  _getValueFromEvent (event) {
    const stringValue = unescapeHTML(getInnerText(event.target))
    return this.props.data.type === 'string'
        ? stringValue
        : stringConvert(stringValue)
  }

  /**
   * Find the root DOM element of the JSONEditor
   * Search is done based on the CSS class 'jsoneditor'
   * @param event
   * @return {*}
   * @private
   */
  static _findRootElement (event) {
    function isEditorElement (elem) {
      return elem.className.split(' ').indexOf('jsoneditor') !== -1
    }

    let elem = event.target
    while (elem) {
      if (isEditorElement(elem)) {
        return elem
      }

      elem = elem.parentNode
    }

    return null
  }

}
