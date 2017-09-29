import {
  selectContentEditable, hasClassName,
  findParentWithAttribute, findParentWithClassName
} from '../../utils/domUtils'
import { compileJSONPointer, parseJSONPointer } from '../../eson'

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
 * @return {boolean} Returns true when successfully moved up
 */
export function moveUp (fromElement, inputName = null) {
  return moveTo(fromElement, findPreviousNode(fromElement), inputName)
}

/**
 * Move the selection to the input field below current selected input
 * @param {Element} fromElement
 * @param {String} [inputName] Optional name of the input where to move the focus
 * @return {boolean} Returns true when successfully moved up
 */
export function moveDown (fromElement, inputName = null) {
  return moveTo(fromElement, findNextNode(fromElement), inputName)
}

/**
 * Move the selection to the input field below current selected input,
 * to the first that is not a child of current node
 * @param {Element} fromElement
 * @param {String} [inputName] Optional name of the input where to move the focus
 * @return {boolean} Returns true when successfully moved up
 */
export function moveDownSibling (fromElement, inputName = null) {
  return moveTo(fromElement, findNextSibling(fromElement), inputName)
}

/**
 * Move the selection to the first node
 * @param {Element} fromElement
 * @param {String} [inputName] Optional name of the input where to move the focus
 * @return {boolean} Returns true when successfully moved to home
 */
export function moveHome (fromElement, inputName = null) {
  return moveTo(fromElement, findFirstNode(fromElement), inputName)
}

/**
 * Move the selection to the last node
 * @param {Element} fromElement
 * @param {String} [inputName] Optional name of the input where to move the focus
 * @return {boolean} Returns true when successfully moved to home
 */
export function moveEnd (fromElement, inputName = null) {
  return moveTo(fromElement, findLastNode(fromElement), inputName)
}

/**
 * Move from an element to another element
 * @param {Element} fromElement
 * @param {Element} toElement
 * @param {string} [inputName]
 * @return {boolean} Returns true when successfully moved
 */
function moveTo (fromElement, toElement, inputName = null) {
  if (toElement) {
    if (!lastInputName) {
      lastInputName = inputName || getInputName(fromElement)
    }

    const container = findContentsContainer(fromElement)
    const path = parseJSONPointer(toElement.getAttribute(PATH_ATTRIBUTE))

    return setSelection(container, path, lastInputName)
  }
  else {
    return false
  }
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

function findContentsContainer (element) {
  return findParentWithClassName (element, CONTENTS_CONTAINER_CLASS_NAME)
}

export function findEditorContainer (element) {
  return findParentWithAttribute (element, EDITOR_CONTAINER_ATTRIBUTE, 'true')
}

// TODO: find a better name for this function
export function findBaseNode (element) {
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

function findFirstNode (element) {
  const container = findContentsContainer(element)

  // TODO: is the following querySelectorAll a performance bottleneck?
  const all = Array.from(container.querySelectorAll('div.' + NODE_CONTAINER_CLASS_NAME))

  return all[0]
}

function findLastNode (element) {
  const container = findContentsContainer(element)

  // TODO: is the following querySelectorAll a performance bottleneck?
  const all = Array.from(container.querySelectorAll('div.' + NODE_CONTAINER_CLASS_NAME))

  return all[all.length - 1]
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
