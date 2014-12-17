define(['./util'], function (util) {

  /**
   * A factory function to create an AppendNode, which depends on a Node
   * @param {Node} Node
   */
  function appendNodeFactory(Node) {
    /**
     * @constructor AppendNode
     * @extends Node
     * @param {TreeEditor} editor
     * Create a new AppendNode. This is a special node which is created at the
     * end of the list with childs for an object or array
     */
    function AppendNode (editor) {
      /** @type {TreeEditor} */
      this.editor = editor;
      this.dom = {};
    }

    AppendNode.prototype = new Node();

    /**
     * Return a table row with an append button.
     * @return {Element} dom   TR element
     */
    AppendNode.prototype.getDom = function () {
      // TODO: implement a new solution for the append node
      var dom = this.dom;

      if (dom.tr) {
        return dom.tr;
      }

      this._updateEditability();

      // a row for the append button
      var trAppend = document.createElement('tr');
      trAppend.node = this;
      dom.tr = trAppend;

      // TODO: consistent naming

      if (this.editable.field) {
        // a cell for the dragarea column
        dom.tdDrag = document.createElement('td');

      }

      // a cell for the contents (showing text 'empty')
      var tdAppend = document.createElement('td');
      tdAppend.className = 'appenditem';
      var domText = document.createElement('div');
      domText.innerHTML = '(empty)';
      domText.className = 'readonly';
      var icon = document.createElement('div');
      icon.className = 'icon';
      tdAppend.appendChild(icon);
      tdAppend.appendChild(domText);
      dom.td = tdAppend;
      dom.text = domText;

      this.updateDom();

      return trAppend;
    };

    /**
     * Update the HTML dom of the Node
     */
    AppendNode.prototype.updateDom = function () {
      var dom = this.dom;
      var tdAppend = dom.td;
      if (tdAppend) {
        tdAppend.style.paddingLeft = (this.getLevel() * 24 + 26) + 'px';
        // TODO: not so nice hard coded offset
      }

      var domText = dom.text;
      if (domText) {
        domText.innerHTML = 'Extend ' + this.parent.type.type;
      }

      // attach or detach the contents of the append node:
      // hide when the parent has childs, show when the parent has no childs
      var trAppend = dom.tr;
      if (!this.isVisible()) {
        if (dom.tr.firstChild) {
          if (dom.tdDrag) {
            trAppend.removeChild(dom.tdDrag);
          }
          trAppend.removeChild(tdAppend);
        }
      }
      else {
        if (!dom.tr.firstChild) {
          if (dom.tdDrag) {
            trAppend.appendChild(dom.tdDrag);
          }
          trAppend.appendChild(tdAppend);
        }
      }
    };

    /**
     * Check whether the AppendNode is currently visible.
     * the AppendNode is visible when its parent has no childs (i.e. is empty).
     * @return {boolean} isVisible
     */
    AppendNode.prototype.isVisible = function () {
      return this.parent.type == 'List' || this.parent.type == 'Dict';
    };

    /**
     * Handle an event. The event is catched centrally by the editor
     * @param {Event} event
     */
    AppendNode.prototype.onEvent = function (event) {
      var type = event.type;
      var target = event.target || event.srcElement;
      var dom = this.dom;

      if (type == 'click') {
        var type = this.parent.type.children[0];
        var value = ''; // FIXME: manufacture value of given type
        this._onAppend('', value, type);
      }
      if (type == 'keydown') {
        this.onKeyDown(event);
      }
    };

    return AppendNode;
  }

  // return the factory function
  return appendNodeFactory;
});
