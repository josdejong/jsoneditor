// This file contains functions to create menu entries

// TYPE_TITLES with explanation for the different types
const TYPE_TITLES = {
  'value': 'Item type "value". ' +
  'The item type is automatically determined from the value ' +
  'and can be a string, number, boolean, or null.',
  'Object': 'Item type "object". ' +
  'An object contains an unordered set of key/value pairs.',
  'Array': 'Item type "array". ' +
  'An array contains an ordered collection of values.',
  'string': 'Item type "string". ' +
  'Item type is not determined from the value, ' +
  'but always returned as string.'
}

export function createChangeType (path, type, onChangeType) {
  return {
    text: 'Type',
    title: 'Change the type of this field',
    className: 'jsoneditor-type-' + type,
    submenu: [
      {
        text: 'Value',
        className: 'jsoneditor-type-value' + (type == 'value' ? ' jsoneditor-selected' : ''),
        title: TYPE_TITLES.value,
        click: () => onChangeType(path, 'value')
      },
      {
        text: 'Array',
        className: 'jsoneditor-type-Array' + (type == 'Array' ? ' jsoneditor-selected' : ''),
        title: TYPE_TITLES.array,
        click: () => onChangeType(path, 'Array')
      },
      {
        text: 'Object',
        className: 'jsoneditor-type-Object' + (type == 'Object' ? ' jsoneditor-selected' : ''),
        title: TYPE_TITLES.object,
        click: () => onChangeType(path, 'Object')
      },
      {
        text: 'String',
        className: 'jsoneditor-type-string' + (type == 'string' ? ' jsoneditor-selected' : ''),
        title: TYPE_TITLES.string,
        click: () => onChangeType(path, 'string')
      }
    ]
  }
}

export function createSort (path, order, onSort) {
  var direction = ((order == 'asc') ? 'desc': 'asc')
  return {
    text: 'Sort',
    title: 'Sort the childs of this ' + TYPE_TITLES.type,
    className: 'jsoneditor-sort-' + direction,
    click: () => onSort(path),
    submenu: [
      {
        text: 'Ascending',
        className: 'jsoneditor-sort-asc',
        title: 'Sort the childs of this ' + TYPE_TITLES.type + ' in ascending order',
        click: () => onSort(path, 'asc')
      },
      {
        text: 'Descending',
        className: 'jsoneditor-sort-desc',
        title: 'Sort the childs of this ' + TYPE_TITLES.type +' in descending order',
        click: () => onSort(path, 'desc')
      }
    ]
  }
}

export function createInsert (path, onInsert) {
  return {
    text: 'Insert',
    title: 'Insert a new item with type \'value\' after this item (Ctrl+Ins)',
    submenuTitle: 'Select the type of the item to be inserted',
    className: 'jsoneditor-insert',
    click: () => onInsert(path, 'value'),
    submenu: [
      {
        text: 'Value',
        className: 'jsoneditor-type-value',
        title: TYPE_TITLES.value,
        click: () => onInsert(path, 'value')
      },
      {
        text: 'Array',
        className: 'jsoneditor-type-Array',
        title: TYPE_TITLES.array,
        click: () => onInsert(path, 'Array')
      },
      {
        text: 'Object',
        className: 'jsoneditor-type-Object',
        title: TYPE_TITLES.object,
        click: () => onInsert(path, 'Object')
      },
      {
        text: 'String',
        className: 'jsoneditor-type-string',
        title: TYPE_TITLES.string,
        click: () => onInsert(path, 'string')
      }
    ]
  }
}

export function createAppend (path, onAppend) {
  return {
    text: 'Insert',
    title: 'Insert a new item with type \'value\' after this item (Ctrl+Ins)',
    submenuTitle: 'Select the type of the item to be inserted',
    className: 'jsoneditor-insert',
    click: () => onAppend(path, 'value'),
    submenu: [
      {
        text: 'Value',
        className: 'jsoneditor-type-value',
        title: TYPE_TITLES.value,
        click: () => onAppend(path, 'value')
      },
      {
        text: 'Array',
        className: 'jsoneditor-type-Array',
        title: TYPE_TITLES.array,
        click: () => onAppend(path, 'Array')
      },
      {
        text: 'Object',
        className: 'jsoneditor-type-Object',
        title: TYPE_TITLES.object,
        click: () => onAppend(path, 'Object')
      },
      {
        text: 'String',
        className: 'jsoneditor-type-string',
        title: TYPE_TITLES.string,
        click: () => onAppend(path, 'string')
      }
    ]
  }
}

export function createDuplicate (path, onDuplicate) {
  return {
    text: 'Duplicate',
    title: 'Duplicate this item (Ctrl+D)',
    className: 'jsoneditor-duplicate',
    click: () => onDuplicate(path)
  }
}

export function createRemove (path, onRemove) {
  return {
    text: 'Remove',
    title: 'Remove this item (Ctrl+Del)',
    className: 'jsoneditor-remove',
    click: () => onRemove(path)
  }
}

export function createSeparator () {
  return {
    'type': 'separator'
  }
}