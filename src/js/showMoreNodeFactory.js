'use strict';

var translate = require('./i18n').translate;

/**
 * A factory function to create an ShowMoreNode, which depends on a Node
 * @param {function} Node
 */
function showMoreNodeFactory(Node) {
  /**
   * @constructor ShowMoreNode
   * @extends Node
   * @param {TreeEditor} editor
   * @param {Node} parent
   * Create a new ShowMoreNode. This is a special node which is created
   * for arrays or objects having more than 100 items
   */
  function ShowMoreNode (editor, parent) {
    /** @type {TreeEditor} */
    this.editor = editor;
    this.parent = parent;
    this.dom = {};
  }

  ShowMoreNode.prototype = new Node();

  /**
   * Return a table row with an append button.
   * @return {Element} dom   TR element
   */
  ShowMoreNode.prototype.getDom = function () {
    if (this.dom.tr) {
      return this.dom.tr;
    }

    this._updateEditability();

    // display "show more"
    if (!this.dom.tr) {
      var me = this;
      var parent = this.parent;
      var showMoreButton = document.createElement('a');
      showMoreButton.appendChild(document.createTextNode('show\u00A0more'));
      showMoreButton.href = '#';
      showMoreButton.onclick = function (event) {
        // TODO: use callback instead of accessing a method of the parent
        parent.maxVisibleChilds += Node.prototype.MAX_VISIBLE_CHILDS;
        me.updateDom();
        parent.showChilds();

        event.preventDefault();
        return false;
      };

      var showAllButton = document.createElement('a');
      showAllButton.appendChild(document.createTextNode('show\u00A0all'));
      showAllButton.href = '#';
      showAllButton.onclick = function (event) {
        // TODO: use callback instead of accessing a method of the parent
        parent.maxVisibleChilds = Infinity;
        me.updateDom();
        parent.showChilds();

        event.preventDefault();
        return false;
      };

      var moreContents = document.createElement('div');
      var moreText = document.createTextNode(this._getShowMoreText());
      moreContents.className = 'jsoneditor-show-more';
      moreContents.appendChild(moreText);
      moreContents.appendChild(showMoreButton);
      moreContents.appendChild(document.createTextNode('. '));
      moreContents.appendChild(showAllButton);
      moreContents.appendChild(document.createTextNode('. '));

      var tdContents = document.createElement('td');
      tdContents.appendChild(moreContents);

      var moreTr = document.createElement('tr');
      moreTr.appendChild(document.createElement('td'));
      moreTr.appendChild(document.createElement('td'));
      moreTr.appendChild(tdContents);
      this.dom.tr = moreTr;
      this.dom.moreContents = moreContents;
      this.dom.moreText = moreText;
    }

    this.updateDom();

    return this.dom.tr;
  };

  /**
   * Update the HTML dom of the Node
   */
  ShowMoreNode.prototype.updateDom = function(options) {
    if (this.isVisible()) {
      // attach to the right child node (the first non-visible child)
      this.dom.tr.node = this.parent.childs[this.parent.maxVisibleChilds];

      if (!this.dom.tr.parentNode) {
        var nextTr = this.parent._getNextTr();
        if (nextTr) {
          nextTr.parentNode.insertBefore(this.dom.tr, nextTr);
        }
      }

      // update the counts in the text
      this.dom.moreText.nodeValue = this._getShowMoreText();

      // update left margin
      this.dom.moreContents.style.marginLeft = (this.getLevel() + 1) * 24 + 'px';
    }
    else {
      if (this.dom.tr && this.dom.tr.parentNode) {
        this.dom.tr.parentNode.removeChild(this.dom.tr);
      }
    }
  };

  ShowMoreNode.prototype._getShowMoreText = function() {
    // TODO: implement in translate
    var childs = this.type === 'array' ? 'items' : 'properties';
    return 'displaying ' + this.parent.maxVisibleChilds +
        ' of ' + this.parent.childs.length + ' ' + childs + '. ';
  };

  /**
   * Check whether the ShowMoreNode is currently visible.
   * the ShowMoreNode is visible when it's parent has more childs than
   * the current maxVisibleChilds
   * @return {boolean} isVisible
   */
  ShowMoreNode.prototype.isVisible = function () {
    return this.parent.expanded && this.parent.childs.length > this.parent.maxVisibleChilds;
  };

  /**
   * Handle an event. The event is caught centrally by the editor
   * @param {Event} event
   */
  ShowMoreNode.prototype.onEvent = function (event) {
    var type = event.type;
    if (type === 'keydown') {
      this.onKeyDown(event);
    }
  };

  return ShowMoreNode;
}

module.exports = showMoreNodeFactory;
