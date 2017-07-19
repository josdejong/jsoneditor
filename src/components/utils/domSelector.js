import { selectContentEditable, getSelection as getDOMSelection } from '../../utils/domUtils'
import { compileJSONPointer, parseJSONPointer } from '../../jsonData'

// singleton
let lastInputName = null

// TODO: create a constants file with the CSS names that are used in domSelector
const SEARCH_TEXT_CLASS_NAME = 'jsoneditor-search-text'
const SEARCH_COMPONENT_CLASS_NAME = 'jsoneditor-search'
const NODE_CONTAINER_CLASS_NAME = 'jsoneditor-node'
const CONTENTS_CONTAINER_CLASS_NAME = 'jsoneditor-tree-contents'
const PROPERTY_CLASS_NAME = 'jsoneditor-property'
const VALUE_CLASS_NAME = 'jsoneditor-value'
const ACTION_MENU_CLASS_NAME = 'jsoneditor-actionmenu'
const EXPANDED_CLASS_NAME = 'jsoneditor-expanded'
const COLLAPSED_CLASS_NAME = 'jsoneditor-collapsed'

const EDITOR_CONTAINER_ATTRIBUTE = 'data-jsoneditor'
const PATH_ATTRIBUTE = 'data-path'

const INPUT_NAME_RULES = {
  closest: {
    'property': ['property', 'value', 'action', 'expand'],
    'value': ['value', 'property', 'action', 'expand'],
    'action': ['action', 'expand', 'property', 'value'],
    'expand': ['expand', 'action', 'property', 'value'],
  },
  left: {
    'property': ['action', 'expand'],
    'value': ['property', 'action', 'expand'],
    'action': ['expand'],
    'expand': [],
  },
  right: {
    'property': ['value'],
    'value': [],
    'action': ['property', 'value'],
    'expand': ['action', 'property', 'value'],
  }
}

/**
 * Move the selection to the input field above current selected input
 * @param {Element} fromElement
 * @param {String} [inputName] Optional name of the input where to move the focus
 * @return {boolean} Returns true when successfully moved down
 */
export function moveUp (fromElement, inputName = null) {
  const prev = findPreviousNode(fromElement)
  if (prev) {
    if (!lastInputName) {
      lastInputName = inputName || getInputName(fromElement)
    }

    const container = findContentsContainer(fromElement)
    const path = parseJSONPointer(prev.getAttribute(PATH_ATTRIBUTE))
    return setSelection(container, path, lastInputName)
  }

  return false
}

/**
 * Move the selection to the input field below current selected input
 * @param {Element} fromElement
 * @param {String} [inputName] Optional name of the input where to move the focus
 * @return {boolean} Returns true when successfully moved up
 */
export function moveDown (fromElement, inputName = null) {
  const next = findNextNode(fromElement)
  if (next) {
    if (!lastInputName) {
      lastInputName = inputName || getInputName(fromElement)
    }

    const container = findContentsContainer(fromElement)
    const path = parseJSONPointer(next.getAttribute(PATH_ATTRIBUTE))
    return setSelection(container, path, lastInputName)
  }

  return false
}

/**
 * Move the selection to the input field below current selected input,
 * to the first that is not a child of current node
 * @param {Element} fromElement
 * @param {String} [inputName] Optional name of the input where to move the focus
 * @return {boolean} Returns true when successfully moved up
 */
export function moveDownSibling (fromElement, inputName = null) {
  const next = findNextSibling(fromElement)
  if (next) {
    if (!lastInputName) {
      lastInputName = inputName || getInputName(fromElement)
    }

    const container = findContentsContainer(fromElement)
    const path = parseJSONPointer(next.getAttribute(PATH_ATTRIBUTE))
    return setSelection(container, path, lastInputName)
  }

  return false
}

/**
 * Move the selection to the input field left from current selected input
 * @param {Element} fromElement
 */
export function moveLeft (fromElement) {
  const container = findContentsContainer(fromElement)
  const node = findBaseNode(fromElement)
  const path = parseJSONPointer(node.getAttribute(PATH_ATTRIBUTE))
  const inputName = getInputName(fromElement)
  const lastInputName = findInput(node, inputName, 'left')
  setSelection(container, path, lastInputName)
}

/**
 * Move the selection to the input field right from current selected input
 * @param {Element} fromElement
 */
export function moveRight (fromElement) {
  const container = findContentsContainer(fromElement)
  const node = findBaseNode(fromElement)
  const path = parseJSONPointer(node.getAttribute(PATH_ATTRIBUTE))
  const inputName = getInputName(fromElement)
  const lastInputName = findInput(node, inputName, 'right')
  setSelection(container, path, lastInputName)
}

export function selectFind (eventTarget) {
  const container = findEditorContainer(eventTarget)
  const searchText = container.querySelector('input.' + SEARCH_TEXT_CLASS_NAME)

  if (searchText) {
    searchText.select()
  }
}

/**
 * Set selection to a specific node and input field
 * @param {Element} container
 * @param {Path} path
 * @param {string} inputName
 * @return {boolean} Returns true when successfully set
 */
export function setSelection (container, path, inputName) {
  const node = findNode(container, path)
  if (node) {
    const closestInputName = findInput(node, inputName, 'closest')
    const element = findInputName(node, closestInputName)
    if (element) {
      element.focus()
      if (element.nodeName === 'DIV') {
        selectContentEditable(element)
      }
      return true
    }
  }

  return false
}

/**
 * Find the HTML element of a Node with a specific path
 * @param {Element} container
 * @param {Path} path
 * @return {Element}
 */
export function findNode (container, path) {
  return container.querySelector(`div[${PATH_ATTRIBUTE}="${compileJSONPointer(path)}"]`)
}

// TODO: fully implement getSelection, or cleanup if not needed
// function getSelectedElement () {
//   const selection = getDOMSelection()
//   return selection ? selection.startContainer : null
// }
//
// export function getSelection () {
//   const element = getSelectedElement()
//   const node = findBaseNode(element)
//
//   return {
//     path: node.getAttribute(PATH_ATTRIBUTE) // TODO: return parsed JSONPointer instead?
//   }
// }

function findContentsContainer (element) {
  return findParentWithClassName (element, CONTENTS_CONTAINER_CLASS_NAME)
}

export function findEditorContainer (element) {
  return findParentWithAttribute (element, EDITOR_CONTAINER_ATTRIBUTE, 'true')
}

function findBaseNode (element) {
  return findParentWithClassName (element, NODE_CONTAINER_CLASS_NAME)
}

/**
 * Check whether the search input currently has focus
 * @return {boolean}
 */
export function searchHasFocus () {
  if (document.activeElement) {
    return findParentWithClassName(document.activeElement, SEARCH_COMPONENT_CLASS_NAME) !== null
  }
  else {
    return false
  }
}

/**
 * Find the first parent element having a specific class name
 * @param {Element} element
 * @param {string} className
 * @return {Element} Returns the base element of the node
 */
function findParentWithClassName (element, className) {
  let e = element
  do {
    if (hasClassName(e, className)) {
      return e
    }

    e = e.parentNode
  }
  while (e)

  return null
}

/**
 * Find the base element of a node from one of it's childs
 * @param {Element} element
 * @param {string} attribute
 * @param {string} value
 * @return {Element} Returns the base element of the node
 */
function findParentWithAttribute (element, attribute, value) {
  let e = element
  do {
    if (e && e.hasAttribute && e.hasAttribute(attribute)) {
      if (value === undefined || e.getAttribute(attribute) === value) {
        return e
      }
    }

    e = e.parentNode
  }
  while (e)

  return null
}

function findPreviousNode (element) {
  const container = findContentsContainer(element)
  const node = findBaseNode(element)

  // TODO: is the following querySelectorAll a performance bottleneck?
  const all = Array.from(container.querySelectorAll('div.' + NODE_CONTAINER_CLASS_NAME))
  const index = all.indexOf(node)

  return all[index - 1]
}

function findNextNode (element) {
  const container = findContentsContainer(element)
  const node = findBaseNode(element)

  // TODO: is the following querySelectorAll a performance bottleneck?
  const all = Array.from(container.querySelectorAll('div.' + NODE_CONTAINER_CLASS_NAME))
  const index = all.indexOf(node)

  return all[index + 1]
}

function findNextSibling (element) {
  const container = findContentsContainer(element)
  const node = findBaseNode(element)

  // TODO: is the following querySelectorAll a performance bottleneck?
  const all = Array.from(container.querySelectorAll('div.' + NODE_CONTAINER_CLASS_NAME))
  const index = all.indexOf(node)

  const path = node.getAttribute(PATH_ATTRIBUTE)
  return all.slice(index).find(e => !e.getAttribute(PATH_ATTRIBUTE).startsWith(path))
}

/**
 * Get the input name of an element
 * @param {Element} element
 * @return {'property' | 'value' | 'action' | 'expand' | null}
 */
function getInputName (element) {

  if (hasClassName(element, PROPERTY_CLASS_NAME)) {
    return 'property'
  }

  if (hasClassName(element, VALUE_CLASS_NAME)) {
    return 'value'
  }

  if (hasClassName(element, ACTION_MENU_CLASS_NAME)) {
    return 'action'
  }

  if (hasClassName(element, EXPANDED_CLASS_NAME) ||
      hasClassName(element, COLLAPSED_CLASS_NAME)) {
    return 'expand'
  }

  return null
}

function findInputName (node, name) {
  if (node) {
    if (name === 'property') {
      const div = node.querySelector('.' + PROPERTY_CLASS_NAME)
      return (div && div.contentEditable === 'true') ? div : null
    }

    if (name === 'value') {
      const div = node.querySelector('.' + VALUE_CLASS_NAME)
      return (div && div.contentEditable === 'true') ? div : null
    }

    if (name === 'action') {
      return node.querySelector('.' + ACTION_MENU_CLASS_NAME)
    }

    if (name === 'expand') {
      return node.querySelector('.' + EXPANDED_CLASS_NAME) ||
          node.querySelector('.' + COLLAPSED_CLASS_NAME)
    }
  }

  return null
}

/**
 * Test whether a HTML element contains a specific className
 * @param {Element} element
 * @param {boolean} className
 * @return {boolean}
 */
function hasClassName (element, className) {
  return element && element.className
      ? element.className.split(' ').indexOf(className) !== -1
      : false
}

/**
 * find the closest input that actually exists in this node
 * @param {Element} node
 * @param {string} inputName
 * @param {'closest' | 'left' | 'right'} [rule]
 * @return {Element}
 */
function findInput (node, inputName, rule = 'closest') {
  const inputNames = INPUT_NAME_RULES[rule][inputName]
  if (inputNames) {
    return inputNames.find(name => {
      return findInputName(node, name)
    })
  }

  return null
}
