'use strict'

import { findUniqueName } from './util'

/**
 * @constructor History
 * Store action history, enables undo and redo
 * @param {JSONEditor} editor
 */
export class NodeHistory {
  constructor (editor) {
    this.editor = editor
    this.history = []
    this.index = -1

    this.clear()

    // helper function to find a Node from a path
    function findNode (path) {
      return editor.node.findNodeByInternalPath(path)
    }

    // map with all supported actions
    this.actions = {
      editField: {
        undo: function (params) {
          const parentNode = findNode(params.parentPath)
          const node = parentNode.childs[params.index]
          node.updateField(params.oldValue)
        },
        redo: function (params) {
          const parentNode = findNode(params.parentPath)
          const node = parentNode.childs[params.index]
          node.updateField(params.newValue)
        }
      },
      editValue: {
        undo: function (params) {
          findNode(params.path).updateValue(params.oldValue)
        },
        redo: function (params) {
          findNode(params.path).updateValue(params.newValue)
        }
      },
      changeType: {
        undo: function (params) {
          findNode(params.path).changeType(params.oldType)
        },
        redo: function (params) {
          findNode(params.path).changeType(params.newType)
        }
      },

      appendNodes: {
        undo: function (params) {
          const parentNode = findNode(params.parentPath)
          params.paths.map(findNode).forEach(node => {
            parentNode.removeChild(node)
          })
        },
        redo: function (params) {
          const parentNode = findNode(params.parentPath)
          params.nodes.forEach(node => {
            parentNode.appendChild(node)
          })
        }
      },
      insertBeforeNodes: {
        undo: function (params) {
          const parentNode = findNode(params.parentPath)
          params.paths.map(findNode).forEach(node => {
            parentNode.removeChild(node)
          })
        },
        redo: function (params) {
          const parentNode = findNode(params.parentPath)
          const beforeNode = findNode(params.beforePath)
          params.nodes.forEach(node => {
            parentNode.insertBefore(node, beforeNode)
          })
        }
      },
      insertAfterNodes: {
        undo: function (params) {
          const parentNode = findNode(params.parentPath)
          params.paths.map(findNode).forEach(node => {
            parentNode.removeChild(node)
          })
        },
        redo: function (params) {
          const parentNode = findNode(params.parentPath)
          let afterNode = findNode(params.afterPath)
          params.nodes.forEach(node => {
            parentNode.insertAfter(node, afterNode)
            afterNode = node
          })
        }
      },
      removeNodes: {
        undo: function (params) {
          const parentNode = findNode(params.parentPath)
          const beforeNode = parentNode.childs[params.index] || parentNode.append
          params.nodes.forEach(node => {
            parentNode.insertBefore(node, beforeNode)
          })
        },
        redo: function (params) {
          const parentNode = findNode(params.parentPath)
          params.paths.map(findNode).forEach(node => {
            parentNode.removeChild(node)
          })
        }
      },
      duplicateNodes: {
        undo: function (params) {
          const parentNode = findNode(params.parentPath)
          params.clonePaths.map(findNode).forEach(node => {
            parentNode.removeChild(node)
          })
        },
        redo: function (params) {
          const parentNode = findNode(params.parentPath)
          let afterNode = findNode(params.afterPath)
          const nodes = params.paths.map(findNode)
          nodes.forEach(node => {
            const clone = node.clone()
            if (parentNode.type === 'object') {
              const existingFieldNames = parentNode.getFieldNames()
              clone.field = findUniqueName(node.field, existingFieldNames)
            }
            parentNode.insertAfter(clone, afterNode)
            afterNode = clone
          })
        }
      },
      moveNodes: {
        undo: function (params) {
          const oldParentNode = findNode(params.oldParentPath)
          const newParentNode = findNode(params.newParentPath)
          const oldBeforeNode = oldParentNode.childs[params.oldIndex] || oldParentNode.append

          // first copy the nodes, then move them
          const nodes = newParentNode.childs.slice(params.newIndex, params.newIndex + params.count)

          nodes.forEach((node, index) => {
            node.field = params.fieldNames[index]
            oldParentNode.moveBefore(node, oldBeforeNode)
          })

          // This is a hack to work around an issue that we don't know tha original
          // path of the new parent after dragging, as the node is already moved at that time.
          if (params.newParentPathRedo === null) {
            params.newParentPathRedo = newParentNode.getInternalPath()
          }
        },
        redo: function (params) {
          const oldParentNode = findNode(params.oldParentPathRedo)
          const newParentNode = findNode(params.newParentPathRedo)
          const newBeforeNode = newParentNode.childs[params.newIndexRedo] || newParentNode.append

          // first copy the nodes, then move them
          const nodes = oldParentNode.childs.slice(params.oldIndexRedo, params.oldIndexRedo + params.count)

          nodes.forEach((node, index) => {
            node.field = params.fieldNames[index]
            newParentNode.moveBefore(node, newBeforeNode)
          })
        }
      },

      sort: {
        undo: function (params) {
          const node = findNode(params.path)
          node.hideChilds()
          node.childs = params.oldChilds
          node.updateDom({ updateIndexes: true })
          node.showChilds()
        },
        redo: function (params) {
          const node = findNode(params.path)
          node.hideChilds()
          node.childs = params.newChilds
          node.updateDom({ updateIndexes: true })
          node.showChilds()
        }
      },

      transform: {
        undo: function (params) {
          findNode(params.path).setInternalValue(params.oldValue)

          // TODO: would be nice to restore the state of the node and childs
        },
        redo: function (params) {
          findNode(params.path).setInternalValue(params.newValue)

          // TODO: would be nice to restore the state of the node and childs
        }
      }

      // TODO: restore the original caret position and selection with each undo
      // TODO: implement history for actions "expand", "collapse", "scroll", "setDocument"
    }
  }

  /**
   * The method onChange is executed when the History is changed, and can
   * be overloaded.
   */
  onChange () {}

  /**
   * Add a new action to the history
   * @param {String} action  The executed action. Available actions: "editField",
   *                         "editValue", "changeType", "appendNode",
   *                         "removeNode", "duplicateNode", "moveNode"
   * @param {Object} params  Object containing parameters describing the change.
   *                         The parameters in params depend on the action (for
   *                         example for "editValue" the Node, old value, and new
   *                         value are provided). params contains all information
   *                         needed to undo or redo the action.
   */
  add (action, params) {
    this.index++
    this.history[this.index] = {
      action: action,
      params: params,
      timestamp: new Date()
    }

    // remove redo actions which are invalid now
    if (this.index < this.history.length - 1) {
      this.history.splice(this.index + 1, this.history.length - this.index - 1)
    }

    // fire onchange event
    this.onChange()
  }

  /**
   * Clear history
   */
  clear () {
    this.history = []
    this.index = -1

    // fire onchange event
    this.onChange()
  }

  /**
   * Check if there is an action available for undo
   * @return {Boolean} canUndo
   */
  canUndo () {
    return (this.index >= 0)
  }

  /**
   * Check if there is an action available for redo
   * @return {Boolean} canRedo
   */
  canRedo () {
    return (this.index < this.history.length - 1)
  }

  /**
   * Undo the last action
   */
  undo () {
    if (this.canUndo()) {
      const obj = this.history[this.index]
      if (obj) {
        const action = this.actions[obj.action]
        if (action && action.undo) {
          action.undo(obj.params)
          if (obj.params.oldSelection) {
            try {
              this.editor.setDomSelection(obj.params.oldSelection)
            } catch (err) {
              console.error(err)
            }
          }
        } else {
          console.error(new Error('unknown action "' + obj.action + '"'))
        }
      }
      this.index--

      // fire onchange event
      this.onChange()
    }
  }

  /**
   * Redo the last action
   */
  redo () {
    if (this.canRedo()) {
      this.index++

      const obj = this.history[this.index]
      if (obj) {
        const action = this.actions[obj.action]
        if (action && action.redo) {
          action.redo(obj.params)
          if (obj.params.newSelection) {
            try {
              this.editor.setDomSelection(obj.params.newSelection)
            } catch (err) {
              console.error(err)
            }
          }
        } else {
          console.error(new Error('unknown action "' + obj.action + '"'))
        }
      }

      // fire onchange event
      this.onChange()
    }
  }

  /**
   * Destroy history
   */
  destroy () {
    this.editor = null

    this.history = []
    this.index = -1
  }
}
