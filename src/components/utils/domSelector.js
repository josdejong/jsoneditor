import { selectContentEditable, getSelection as getDOMSelection } from '../../utils/domUtils'

// singleton
let lastInputName = null

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

    const container = findContainer(fromElement)
    return setSelection(container, prev.getAttribute('name'), lastInputName)
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

    const container = findContainer(fromElement)
    return setSelection(container, next.getAttribute('name'), lastInputName)
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

    const container = findContainer(fromElement)
    return setSelection(container, next.getAttribute('name'), lastInputName)
  }

  return false
}

/**
 * Move the selection to the input field left from current selected input
 * @param {Element} fromElement
 */
export function moveLeft (fromElement) {
  const container = findContainer(fromElement)
  const node = findBaseNode(fromElement)
  const inputName = getInputName(fromElement)
  lastInputName = findInput(node, inputName, 'left')
  setSelection(container, node.getAttribute('name'), lastInputName)
}

/**
 * Move the selection to the input field right from current selected input
 * @param {Element} fromElement
 */
export function moveRight (fromElement) {
  const container = findContainer(fromElement)
  const node = findBaseNode(fromElement)
  const inputName = getInputName(fromElement)
  lastInputName = findInput(node, inputName, 'right')
  setSelection(container, node.getAttribute('name'), lastInputName)
}

/**
 * Set selection to a specific node and input field
 * @param {Element} container
 * @param {String} path
 * @param {string} inputName
 * @return {boolean} Returns true when successfully set
 */
// TODO: pass string[] as path instead of JSONPointer?
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

export function findNode (container, path) {
  return container.querySelector(`div[name="${path}"]`)
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
//     path: node.getAttribute('name') // TODO: return parsed JSONPointer instead?
//   }
// }

function findContainer (element) {
  return findParent (element, 'jsoneditor-tree-contents')
}

function findBaseNode (element) {
  return findParent (element, 'jsoneditor-node')
}

/**
 * Find the base element of a node from one of it's childs
 * @param {Element} element
 * @param {string} className
 * @return {Element} Returns the base element of the node
 */
function findParent (element, className) {
  let e = element
  do {
    if (e && e.className && e.className.includes(className)) {
      return e
    }

    e = e.parentNode
  }
  while (e)

  return null
}

function findPreviousNode (element) {
  const container = findContainer(element)
  const node = findBaseNode(element)

  // TODO: is the following querySelectorAll a performance bottleneck?
  const all = Array.from(container.querySelectorAll('div.jsoneditor-node'))
  const index = all.indexOf(node)

  return all[index - 1]
}

function findNextNode (element) {
  const container = findContainer(element)
  const node = findBaseNode(element)

  // TODO: is the following querySelectorAll a performance bottleneck?
  const all = Array.from(container.querySelectorAll('div.jsoneditor-node'))
  const index = all.indexOf(node)

  return all[index + 1]
}

function findNextSibling (element) {
  const container = findContainer(element)
  const node = findBaseNode(element)

  // TODO: is the following querySelectorAll a performance bottleneck?
  const all = Array.from(container.querySelectorAll('div.jsoneditor-node'))
  const index = all.indexOf(node)

  const path = node.getAttribute('name')
  return all.slice(index).find(e => !e.getAttribute('name').startsWith(path))
}

/**
 * Get the input name of an element
 * @param {Element} element
 * @return {'property' | 'value' | 'action' | 'expand' | null}
 */
function getInputName (element) {
  if (element.className.includes('jsoneditor-property')) {
    return 'property'
  }

  if (element.className.includes('jsoneditor-value')) {
    return 'value'
  }

  if (element.className.includes('jsoneditor-actionmenu')) {
    return 'action'
  }

  if (element.className.includes('jsoneditor-expanded') ||
      element.className.includes('jsoneditor-collapsed')) {
    return 'expand'
  }

  return null
}

function findInputName (node, name) {
  if (node) {
    if (name === 'property') {
      const div = node.querySelector('.jsoneditor-property')
      return (div && div.contentEditable === 'true') ? div : null
    }

    if (name === 'value') {
      const div = node.querySelector('.jsoneditor-value')
      return (div && div.contentEditable === 'true') ? div : null
    }

    if (name === 'action') {
      return node.querySelector('.jsoneditor-actionmenu')
    }

    if (name === 'expand') {
      return node.querySelector('.jsoneditor-expanded') || node.querySelector('.jsoneditor-collapsed')
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

