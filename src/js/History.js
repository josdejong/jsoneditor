'use strict';

var util = require('./util');

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

  // map with all supported actions
  this.actions = {
    'editField': {
      'undo': function (params) {
        params.node.updateField(params.oldValue);
      },
      'redo': function (params) {
        params.node.updateField(params.newValue);
      }
    },
    'editValue': {
      'undo': function (params) {
        params.node.updateValue(params.oldValue);
      },
      'redo': function (params) {
        params.node.updateValue(params.newValue);
      }
    },
    'changeType': {
      'undo': function (params) {
        params.node.changeType(params.oldType);
      },
      'redo': function (params) {
        params.node.changeType(params.newType);
      }
    },

    'appendNodes': {
      'undo': function (params) {
        params.nodes.forEach(function (node) {
          params.parent.removeChild(node);
        });
      },
      'redo': function (params) {
        params.nodes.forEach(function (node) {
          params.parent.appendChild(node);
        });
      }
    },
    'insertBeforeNodes': {
      'undo': function (params) {
        params.nodes.forEach(function (node) {
          params.parent.removeChild(node);
        });
      },
      'redo': function (params) {
        params.nodes.forEach(function (node) {
          params.parent.insertBefore(node, params.beforeNode);
        });
      }
    },
    'insertAfterNodes': {
      'undo': function (params) {
        params.nodes.forEach(function (node) {
          params.parent.removeChild(node);
        });
      },
      'redo': function (params) {
        var afterNode = params.afterNode;
        params.nodes.forEach(function (node) {
          params.parent.insertAfter(params.node, afterNode);
          afterNode = node;
        });
      }
    },
    'removeNodes': {
      'undo': function (params) {
        var parent = params.parent;
        var beforeNode = parent.childs[params.index] || parent.append;
        params.nodes.forEach(function (node) {
          parent.insertBefore(node, beforeNode);
        });
      },
      'redo': function (params) {
        params.nodes.forEach(function (node) {
          params.parent.removeChild(node);
        });
      }
    },
    'duplicateNodes': {
      'undo': function (params) {
        params.nodes.forEach(function (node) {
          params.parent.removeChild(node);
        });
      },
      'redo': function (params) {
        var afterNode = params.afterNode;
        params.nodes.forEach(function (node) {
          params.parent.insertAfter(node, afterNode);
          afterNode = node;
        });
      }
    },
    'moveNodes': {
      'undo': function (params) {
        params.nodes.forEach(function (node) {
          params.oldBeforeNode.parent.moveBefore(node, params.oldBeforeNode);
        });
      },
      'redo': function (params) {
        params.nodes.forEach(function (node) {
          params.newBeforeNode.parent.moveBefore(node, params.newBeforeNode);
        });
      }
    },

    'sort': {
      'undo': function (params) {
        var node = params.node;
        node.hideChilds();
        node.sort = params.oldSort;
        node.childs = params.oldChilds;
        node.showChilds();
      },
      'redo': function (params) {
        var node = params.node;
        node.hideChilds();
        node.sort = params.newSort;
        node.childs = params.newChilds;
        node.showChilds();
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
          this.editor.setSelection(obj.params.oldSelection);
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
          this.editor.setSelection(obj.params.newSelection);
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
