/**
 * @license
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy
 * of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Copyright (c) 2011-2013 Jos de Jong, http://jsoneditoronline.org
 *
 * @author  Jos de Jong, <wjosdejong@gmail.com>
 */

/**
 * @constructor JSONEditor.History
 * Store action history, enables undo and redo
 * @param {JSONEditor} editor
 */
JSONEditor.History = function (editor) {
    this.editor = editor;
    this.clear();

    // map with all supported actions
    this.actions = {
        'editField': {
            'undo': function (obj) {
                obj.params.node.updateField(obj.params.oldValue);
            },
            'redo': function (obj) {
                obj.params.node.updateField(obj.params.newValue);
            }
        },
        'editValue': {
            'undo': function (obj) {
                obj.params.node.updateValue(obj.params.oldValue);
            },
            'redo': function (obj) {
                obj.params.node.updateValue(obj.params.newValue);
            }
        },
        'appendNode': {
            'undo': function (obj) {
                obj.params.parent.removeChild(obj.params.node);
            },
            'redo': function (obj) {
                obj.params.parent.appendChild(obj.params.node);
            }
        },
        'insertBeforeNode': {
            'undo': function (obj) {
                obj.params.parent.removeChild(obj.params.node);
            },
            'redo': function (obj) {
                obj.params.parent.insertBefore(obj.params.node, obj.params.beforeNode);
            }
        },
        'insertAfterNode': {
            'undo': function (obj) {
                obj.params.parent.removeChild(obj.params.node);
            },
            'redo': function (obj) {
                obj.params.parent.insertAfter(obj.params.node, obj.params.afterNode);
            }
        },
        'removeNode': {
            'undo': function (obj) {
                var parent = obj.params.parent;
                var beforeNode = parent.childs[obj.params.index] || parent.append;
                parent.insertBefore(obj.params.node, beforeNode);
            },
            'redo': function (obj) {
                obj.params.parent.removeChild(obj.params.node);
            }
        },
        'duplicateNode': {
            'undo': function (obj) {
                obj.params.parent.removeChild(obj.params.clone);
            },
            'redo': function (obj) {
                obj.params.parent.insertAfter(obj.params.clone, obj.params.node);
            }
        },
        'changeType': {
            'undo': function (obj) {
                obj.params.node.changeType(obj.params.oldType);
            },
            'redo': function (obj) {
                obj.params.node.changeType(obj.params.newType);
            }
        },
        'moveNode': {
            'undo': function (obj) {
                obj.params.startParent.moveTo(obj.params.node, obj.params.startIndex);
            },
            'redo': function (obj) {
                obj.params.endParent.moveTo(obj.params.node, obj.params.endIndex);
            }
        },
        'sort': {
            'undo': function (obj) {
                var node = obj.params.node;
                node.hideChilds();
                node.sort = obj.params.oldSort;
                node.childs = obj.params.oldChilds;
                node.showChilds();
            },
            'redo': function (obj) {
                var node = obj.params.node;
                node.hideChilds();
                node.sort = obj.params.newSort;
                node.childs = obj.params.newChilds;
                node.showChilds();
            }
        }

        // TODO: restore the original caret position and selection with each undo
        // TODO: implement history for actions "expand", "collapse", "scroll", "setDocument"
    };
};

/**
 * The method onChange is executed when the History is changed, and can
 * be overloaded.
 */
JSONEditor.History.prototype.onChange = function () {};

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
JSONEditor.History.prototype.add = function (action, params) {
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
JSONEditor.History.prototype.clear = function () {
    this.history = [];
    this.index = -1;

    // fire onchange event
    this.onChange();
};

/**
 * Check if there is an action available for undo
 * @return {Boolean} canUndo
 */
JSONEditor.History.prototype.canUndo = function () {
    return (this.index >= 0);
};

/**
 * Check if there is an action available for redo
 * @return {Boolean} canRedo
 */
JSONEditor.History.prototype.canRedo = function () {
    return (this.index < this.history.length - 1);
};

/**
 * Undo the last action
 */
JSONEditor.History.prototype.undo = function () {
    if (this.canUndo()) {
        var obj = this.history[this.index];
        if (obj) {
            var action = this.actions[obj.action];
            if (action && action.undo) {
                action.undo(obj);
            }
            else {
                console.log('Error: unknown action "' + obj.action + '"');
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
JSONEditor.History.prototype.redo = function () {
    if (this.canRedo()) {
        this.index++;

        var obj = this.history[this.index];
        if (obj) {
            if (obj) {
                var action = this.actions[obj.action];
                if (action && action.redo) {
                    action.redo(obj);
                }
                else {
                    console.log('Error: unknown action "' + obj.action + '"');
                }
            }
        }

        // fire onchange event
        this.onChange();
    }
};
