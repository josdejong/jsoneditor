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

// create namespace
var jsoneditor = jsoneditor || {};

/**
 * The highlighter can highlight/unhighlight a node, and
 * animate the visibility of a context menu.
 * @constructor jsoneditor.Highlighter
 */
jsoneditor.Highlighter = function () {
    this.locked = false;
};

/**
 * Hightlight given node and its childs
 * @param {jsoneditor.Node} node
 */
jsoneditor.Highlighter.prototype.highlight = function (node) {
    if (this.locked) {
        return;
    }

    if (this.node != node) {
        // unhighlight current node
        if (this.node) {
            this.node.setHighlight(false);
        }

        // highlight new node
        this.node = node;
        this.node.setHighlight(true);
    }

    // cancel any current timeout
    this._cancelUnhighlight();
};

/**
 * Unhighlight currently highlighted node.
 * Will be done after a delay
 */
jsoneditor.Highlighter.prototype.unhighlight = function () {
    if (this.locked) {
        return;
    }

    var me = this;
    if (this.node) {
        this._cancelUnhighlight();

        // do the unhighlighting after a small delay, to prevent re-highlighting
        // the same node when moving from the drag-icon to the contextmenu-icon
        // or vice versa.
        this.unhighlightTimer = setTimeout(function () {
            me.node.setHighlight(false);
            me.node = undefined;
            me.unhighlightTimer = undefined;
        }, 0);
    }
};

/**
 * Cancel an unhighlight action (if before the timeout of the unhighlight action)
 * @private
 */
jsoneditor.Highlighter.prototype._cancelUnhighlight = function () {
    if (this.unhighlightTimer) {
        clearTimeout(this.unhighlightTimer);
        this.unhighlightTimer = undefined;
    }
};

/**
 * Lock highlighting or unhighlighting nodes.
 * methods highlight and unhighlight do not work while locked.
 */
jsoneditor.Highlighter.prototype.lock = function () {
    this.locked = true;
};

/**
 * Unlock highlighting or unhighlighting nodes
 */
jsoneditor.Highlighter.prototype.unlock = function () {
    this.locked = false;
};
