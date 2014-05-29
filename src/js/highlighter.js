/**
 * The highlighter can highlight/unhighlight a node, and
 * animate the visibility of a context menu.
 * @constructor Highlighter
 */
function Highlighter () {
  this.locked = false;
}

/**
 * Hightlight given node and its childs
 * @param {Node} node
 */
Highlighter.prototype.highlight = function (node) {
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
Highlighter.prototype.unhighlight = function () {
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
Highlighter.prototype._cancelUnhighlight = function () {
  if (this.unhighlightTimer) {
    clearTimeout(this.unhighlightTimer);
    this.unhighlightTimer = undefined;
  }
};

/**
 * Lock highlighting or unhighlighting nodes.
 * methods highlight and unhighlight do not work while locked.
 */
Highlighter.prototype.lock = function () {
  this.locked = true;
};

/**
 * Unlock highlighting or unhighlighting nodes
 */
Highlighter.prototype.unlock = function () {
  this.locked = false;
};
