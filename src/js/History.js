'use strict';

/**
 * @constructor History
 * Store action history, enables undo and redo
 * @param {JSONEditor} editor
 */
function History (editor) {
  this.editor = editor;
  this.history = [];
  this.index = -1;

  this.clear();

  // helper function to find a Node from a path
  function findNode(path) {
    return editor.node.findNodeByInternalPath(path)
  }

  // map with all supported actions
  this.actions = {
    'editField': {
      'undo': function (params) {
        var parentNode = findNode(params.parentPath);
        var node = parentNode.childs[params.index];
        node.updateField(params.oldValue);
      },
      'redo': function (params) {
        var parentNode = findNode(params.parentPath);
        var node = parentNode.childs[params.index];
        node.updateField(params.newValue);
      }
    },
    'editValue': {
      'undo': function (params) {
        findNode(params.path).updateValue(params.oldValue);
      },
      'redo': function (params) {
        findNode(params.path).updateValue(params.newValue);
      }
    },
    'changeType': {
      'undo': function (params) {
        findNode(params.path).changeType(params.oldType);
      },
      'redo': function (params) {
        findNode(params.path).changeType(params.newType);
      }
    },

    'appendNodes': {
      'undo': function (params) {
        var parentNode = findNode(params.parentPath);
        params.paths.map(findNode).forEach(function (node) {
          parentNode.removeChild(node);
        });
       },
      'redo': function (params) {
        var parentNode = findNode(params.parentPath);
        params.nodes.forEach(function (node) {
          parentNode.appendChild(node);
        });
      }
    },
    'insertBeforeNodes': {
      'undo': function (params) {
        var parentNode = findNode(params.parentPath);
        params.paths.map(findNode).forEach(function (node) {
          parentNode.removeChild(node);
        });
      },
      'redo': function (params) {
        var parentNode = findNode(params.parentPath);
        var beforeNode = findNode(params.beforePath);
        params.nodes.forEach(function (node) {
          parentNode.insertBefore(node, beforeNode);
        });
      }
    },
    'insertAfterNodes': {
      'undo': function (params) {
        var parentNode = findNode(params.parentPath);
        params.paths.map(findNode).forEach(function (node) {
          parentNode.removeChild(node);
        });
      },
      'redo': function (params) {
        var parentNode = findNode(params.parentPath);
        var afterNode = findNode(params.afterPath);
        params.nodes.forEach(function (node) {
          parentNode.insertAfter(node, afterNode);
          afterNode = node;
        });
      }
    },
    'removeNodes': {
      'undo': function (params) {
        var parentNode = findNode(params.parentPath);
        var beforeNode = parentNode.childs[params.index] || parentNode.append;
        params.nodes.forEach(function (node) {
          parentNode.insertBefore(node, beforeNode);
        });
      },
      'redo': function (params) {
        var parentNode = findNode(params.parentPath);
        params.paths.map(findNode).forEach(function (node) {
          parentNode.removeChild(node);
        });
      }
    },
    'duplicateNodes': {
      'undo': function (params) {
        var parentNode = findNode(params.parentPath);
        params.clonePaths.map(findNode).forEach(function (node) {
          parentNode.removeChild(node);
        });
      },
      'redo': function (params) {
        var parentNode = findNode(params.parentPath);
        var afterNode = findNode(params.afterPath);
        var nodes = params.paths.map(findNode);
        nodes.forEach(function (node) {
          var clone = node.clone();
          parentNode.insertAfter(clone, afterNode);
          afterNode = clone;
        });
      }
    },
    'moveNodes': {
      'undo': function (params) {
        var oldParentNode = findNode(params.oldParentPath);
        var newParentNode = findNode(params.newParentPath);
        var oldBeforeNode = oldParentNode.childs[params.oldIndex] || oldParentNode.append;

        // first copy the nodes, then move them
        var nodes = newParentNode.childs.slice(params.newIndex, params.newIndex + params.count);

        nodes.forEach(function (node, index) {
          node.field = params.fieldNames[index];
          oldParentNode.moveBefore(node, oldBeforeNode);
        });

        // This is a hack to work around an issue that we don't know tha original
        // path of the new parent after dragging, as the node is already moved at that time.
        if (params.newParentPathRedo === null) {
          params.newParentPathRedo = newParentNode.getInternalPath();
        }
      },
      'redo': function (params) {
        var oldParentNode = findNode(params.oldParentPathRedo);
        var newParentNode = findNode(params.newParentPathRedo);
        var newBeforeNode = newParentNode.childs[params.newIndexRedo] || newParentNode.append;

        // first copy the nodes, then move them
        var nodes = oldParentNode.childs.slice(params.oldIndexRedo, params.oldIndexRedo + params.count);

        nodes.forEach(function (node, index) {
          node.field = params.fieldNames[index];
          newParentNode.moveBefore(node, newBeforeNode);
        });
      }
    },

    'sort': {
      'undo': function (params) {
        var node = findNode(params.path);
        node.hideChilds();
        node.childs = params.oldChilds;
        node.updateDom({updateIndexes: true});
        node.showChilds();
      },
      'redo': function (params) {
        var node = findNode(params.path);
        node.hideChilds();
        node.childs = params.newChilds;
        node.updateDom({updateIndexes: true});
        node.showChilds();
      }
    },

    'transform': {
      'undo': function (params) {
        findNode(params.path).setInternalValue(params.oldValue);

        // TODO: would be nice to restore the state of the node and childs
      },
      'redo': function (params) {
        findNode(params.path).setInternalValue(params.newValue);

        // TODO: would be nice to restore the state of the node and childs
      }
    }

    // TODO: restore the original caret position and selection with each undo
    // TODO: implement history for actions "expand", "collapse", "scroll", "setDocument"
  };
}

/**
 * The method onChange is executed when the History is changed, and can
 * be overloaded.
 */
History.prototype.onChange = function () {};

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
History.prototype.add = function (action, params) {
  this.index++;
  this.history[this.index] = {
    'action': action,
    'params': params,
    'timestamp': new Date()
  };

  // remove redo actions which are invalid now
  if (this.index < this.history.length - 1) {
    this.history.splice(this.index + 1, this.history.length - this.index - 1);
  }

  // fire onchange event
  this.onChange();
};

/**
 * Clear history
 */
History.prototype.clear = function () {
  this.history = [];
  this.index = -1;

  // fire onchange event
  this.onChange();
};

/**
 * Check if there is an action available for undo
 * @return {Boolean} canUndo
 */
History.prototype.canUndo = function () {
  return (this.index >= 0);
};

/**
 * Check if there is an action available for redo
 * @return {Boolean} canRedo
 */
History.prototype.canRedo = function () {
  return (this.index < this.history.length - 1);
};

/**
 * Undo the last action
 */
History.prototype.undo = function () {
  if (this.canUndo()) {
    var obj = this.history[this.index];
    if (obj) {
      var action = this.actions[obj.action];
      if (action && action.undo) {
        action.undo(obj.params);
        if (obj.params.oldSelection) {
          try {
            this.editor.setDomSelection(obj.params.oldSelection);
          }
          catch (err) {
            console.error(err);
          }
        }
      }
      else {
        console.error(new Error('unknown action "' + obj.action + '"'));
      }
    }
    this.index--;

    // fire onchange event
    this.onChange();
  }
};

/**
 * Redo the last action
 */
History.prototype.redo = function () {
  if (this.canRedo()) {
    this.index++;

    var obj = this.history[this.index];
    if (obj) {
      var action = this.actions[obj.action];
      if (action && action.redo) {
        action.redo(obj.params);
        if (obj.params.newSelection) {
          try {
            this.editor.setDomSelection(obj.params.newSelection);
          }
          catch (err) {
            console.error(err);
          }
        }
      }
      else {
        console.error(new Error('unknown action "' + obj.action + '"'));
      }
    }

    // fire onchange event
    this.onChange();
  }
};

/**
 * Destroy history
 */
History.prototype.destroy = function () {
  this.editor = null;

  this.history = [];
  this.index = -1;
};

module.exports = History;
