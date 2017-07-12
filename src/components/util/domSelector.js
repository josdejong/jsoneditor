import { selectContentEditable } from '../../utils/domUtils'

// singleton
let lastInputName = null

/**
 * Move the selection to the input field above current selected input
 * Heavily relies on classNames of the JSONEditor DOM
 * @param {Element} fromElement
 */
export function moveUp (fromElement) {
  const prev = findPreviousNode(fromElement)
  if (prev) {
    if (!lastInputName) {
      lastInputName = getInputName(fromElement)
    }

    const container = findContainer(fromElement)
    setSelection(container, prev.getAttribute('name'), lastInputName)
  }
}

/**
 * Move the selection to the input field below current selected input
 * Heavily relies on classNames of the JSONEditor DOM
 * @param {Element} fromElement
 */
export function moveDown (fromElement) {
  const prev = findNextNode(fromElement)
  if (prev) {
    if (!lastInputName) {
      lastInputName = getInputName(fromElement)
    }

    const container = findContainer(fromElement)
    setSelection(container, prev.getAttribute('name'), lastInputName)
  }
}

/**
 * Move the selection to the input field left from current selected input
 * Heavily relies on classNames of the JSONEditor DOM
 * @param {Element} fromElement
 */
export function moveLeft (fromElement) {
  const container = findContainer(fromElement)
  const node = findNode(fromElement, 'jsoneditor-node')
  const inputName = getInputName(fromElement)
  lastInputName = findInput(node, inputName, 'left')
  setSelection(container, node.getAttribute('name'), lastInputName)
}

/**
 * Move the selection to the input field right from current selected input
 * Heavily relies on classNames of the JSONEditor DOM
 * @param {Element} fromElement
 */
export function moveRight (fromElement) {
  const container = findContainer(fromElement)
  const node = findNode(fromElement, 'jsoneditor-node')
  const inputName = getInputName(fromElement)
  lastInputName = findInput(node, inputName, 'right')
  setSelection(container, node.getAttribute('name'), lastInputName)
}

/**
 * Set selection to a specific node and input field
 * @param {Element} container
 * @param {JSONPointer} path
 * @param {string} inputName
 */
export function setSelection (container, path, inputName) {
  const node = container.querySelector(`div[name="${path}"]`)
  if (node) {
    const closestInputName = findInput(node, inputName, 'closest')
    const element = findInputName(node, closestInputName)
    if (element) {
      element.focus()
      if (element.nodeName === 'DIV') {
        selectContentEditable(element)
      }
    }
  }
}

function findContainer (element) {
  return findNode (element, 'jsoneditor-tree-contents')
}

/**
 * Find the base element of a node from one of it's childs
 * @param {Element} element
 * @param {string} className
 * @return {Element} Returns the base element of the node
 */
function findNode (element, className) {
  let e = element
  do {
    if (e && e.className.includes(className)) {
      return e
    }

    e = e.parentNode
  }
  while (e)

  return null
}

function findPreviousNode (element) {
  const container = findContainer(element)
  const node = findNode(element, 'jsoneditor-node')

  // TODO: implement a faster way to find the previous node, by walking the DOM tree back, instead of a slow find all query
  const all = Array.from(container.querySelectorAll('div.jsoneditor-node'))
  const index = all.indexOf(node)

  return all[index - 1]
}

function findNextNode (element) {
  const container = findContainer(element)
  const node = findNode(element, 'jsoneditor-node')

  // TODO: implement a faster way to find the previous node, by walking the DOM tree, instead of a slow find all query
  const all = Array.from(container.querySelectorAll('div.jsoneditor-node'))
  const index = all.indexOf(node)

  return all[index + 1]
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

