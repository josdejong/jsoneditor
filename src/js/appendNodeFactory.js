var util = require('./util');
var ContextMenu = require('./ContextMenu');

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

      //Get the context menu options
      var contextOptions = this.editor.options ? this.editor.options.context : undefined;
      //Get the items with a defined context menu
      var menuItems = (contextOptions) ? contextOptions.items : undefined;
      //Get the items of which the children have a defined context menu
      var menuChildren = (contextOptions) ? contextOptions.children : undefined;
      //Check if there is any defined context for the current node
      var itemWithContextMenu = (!menuItems && !menuChildren) || (menuItems && menuItems[this.field]);
      //Check if there is any defined context for the parent of the current node
      var childWithContextMenu = (!menuChildren && !menuItems) || (menuChildren && this.parent && menuChildren[this.parent.field]);

      //Set a flag indicating that the current node has a context menu that must be displayed
      this.displayContextMenu = itemWithContextMenu || childWithContextMenu;

      var tdMenu = document.createElement('td');
      dom.tdMenu = tdMenu;

      //Attach the context menu in the DOM
      if(this.displayContextMenu) {
        //Only the permitted menu actions will be displayed in the context menu
        this.contextMenuActions = (itemWithContextMenu && menuItems) ?
            menuItems[this.field] : (itemWithContextMenu && menuChildren) ? menuChildren[this.parent.field] : [];

        var menu = document.createElement('button');
        menu.className = 'jsoneditor-contextmenu';
        menu.title = 'Click to open the actions menu (Ctrl+M)';
        dom.menu = menu;
        tdMenu.appendChild(dom.menu);
      } else {
        //Allow special theming for columns without context menu
        //(e.g. reduce the width of the column)
        tdMenu.className = 'jsoneditor-no-contextmenu';
      }
    }

    // a cell for the contents (showing text 'empty')
    var tdAppend = document.createElement('td');
    var domText = document.createElement('div');
    domText.innerHTML = '(empty)';
    domText.className = 'jsoneditor-readonly';
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
      domText.innerHTML = '(empty ' + this.parent.type + ')';
    }

    // attach or detach the contents of the append node:
    // hide when the parent has childs, show when the parent has no childs
    var trAppend = dom.tr;
    if (!this.isVisible()) {
      if (dom.tr.firstChild) {
        if (dom.tdDrag) {
          trAppend.removeChild(dom.tdDrag);
        }
        if (dom.tdMenu) {
          trAppend.removeChild(dom.tdMenu);
        }
        trAppend.removeChild(tdAppend);
      }
    }
    else {
      if (!dom.tr.firstChild) {
        if (dom.tdDrag) {
          trAppend.appendChild(dom.tdDrag);
        }
        if (dom.tdMenu) {
          trAppend.appendChild(dom.tdMenu);
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
    return (this.parent.childs.length == 0);
  };

  /**
   * Show a contextmenu for this node
   * @param {HTMLElement} anchor   The element to attach the menu to.
   * @param {function} [onClose]   Callback method called when the context menu
   *                               is being closed.
   */
  AppendNode.prototype.showContextMenu = function (anchor, onClose) {
    var node = this;
    var titles = Node.TYPE_TITLES;
    //Get the permitted context menu actions of the node
    var menuActions = this.contextMenuActions ? this.contextMenuActions : [];
    //Build the submenu once and reuse it where needed
    var subMenu = [];
    if(!menuActions || menuActions.indexOf('Auto') >= 0){
      subMenu.push({
        text: 'Auto',
        className: 'jsoneditor-type-auto' +
        (this.type == 'auto' ? ' jsoneditor-selected' : ''),
        title: titles.auto,
        click: function () {
          node._onChangeType('auto');
        }
      });
    }

    if(!menuActions || menuActions.indexOf('Array') >= 0){
      subMenu.push({
        text: 'Array',
        className: 'jsoneditor-type-array' +
        (this.type == 'array' ? ' jsoneditor-selected' : ''),
        title: titles.array,
        click: function () {
          node._onChangeType('array');
        }
      });
    }

    if(!menuActions || menuActions.indexOf('Object') >= 0){
      subMenu.push({
        text: 'Object',
        className: 'jsoneditor-type-object' +
        (this.type == 'object' ? ' jsoneditor-selected' : ''),
        title: titles.object,
        click: function () {
          node._onChangeType('object');
        }
      });
    }

    if(!menuActions || menuActions.indexOf('String') >= 0){
      subMenu.push({
        text: 'String',
        className: 'jsoneditor-type-string' +
        (this.type == 'string' ? ' jsoneditor-selected' : ''),
        title: titles.string,
        click: function () {
          node._onChangeType('string');
        }
      });
    }

    subMenu = (subMenu.length > 0) ? subMenu : undefined;
    var items = [];
    if(!menuActions || menuActions.indexOf('Append') >= 0){
      items.push({
        'text': 'Append',
        'title': 'Append a new field with type \'auto\' (Ctrl+Shift+Ins)',
        'submenuTitle': 'Select the type of the field to be appended',
        'className': 'jsoneditor-insert',
        'click': function () {
          node._onAppend('', '', 'auto');
        },
        'submenu': subMenu
      });
    }

    //Display the context menu if there is one
    if(items.length > 0) {
      var menu = new ContextMenu(items, {close: onClose});
      menu.show(anchor, this.editor.content);
    }
  };

  /**
   * Handle an event. The event is catched centrally by the editor
   * @param {Event} event
   */
  AppendNode.prototype.onEvent = function (event) {
    var type = event.type;
    var target = event.target || event.srcElement;
    var dom = this.dom;

    // highlight the append nodes parent
    var menu = dom.menu;
    if (target == menu) {
      if (type == 'mouseover') {
        this.editor.highlighter.highlight(this.parent);
      }
      else if (type == 'mouseout') {
        this.editor.highlighter.unhighlight();
      }
    }

    // context menu events
    if (type == 'click' && target == dom.menu) {
      var highlighter = this.editor.highlighter;
      highlighter.highlight(this.parent);
      highlighter.lock();
      util.addClassName(dom.menu, 'jsoneditor-selected');
      this.showContextMenu(dom.menu, function () {
        util.removeClassName(dom.menu, 'jsoneditor-selected');
        highlighter.unlock();
        highlighter.unhighlight();
      });
    }

    if (type == 'keydown') {
      this.onKeyDown(event);
    }
  };

  return AppendNode;
}

module.exports = appendNodeFactory;
