'use strict';

var util = require('./util');
var ContextMenu = require('./ContextMenu');
var translate = require('./i18n').translate;

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
    trAppend.className = 'jsoneditor-append';
    trAppend.node = this;
    dom.tr = trAppend;

    // TODO: consistent naming

    if (this.editor.options.mode === 'tree') {
      // a cell for the dragarea column
      dom.tdDrag = document.createElement('td');

      // create context menu
      var tdMenu = document.createElement('td');
      dom.tdMenu = tdMenu;
      var menu = document.createElement('button');
      menu.type = 'button';
      menu.className = 'jsoneditor-button jsoneditor-contextmenu';
      menu.title = 'Click to open the actions menu (Ctrl+M)';
      dom.menu = menu;
      tdMenu.appendChild(dom.menu);
    }

    // a cell for the contents (showing text 'empty')
    var tdAppend = document.createElement('td');
    var domText = document.createElement('div');
    domText.innerHTML = '(' + translate('empty') + ')';
    domText.className = 'jsoneditor-readonly';
    tdAppend.appendChild(domText);
    dom.td = tdAppend;
    dom.text = domText;

    this.updateDom();

    return trAppend;
  };

  /**
   * Append node doesn't have a path
   * @returns {null}
   */
  AppendNode.prototype.getPath = function() {
    return null;
  };

  /**
   * Append node doesn't have an index
   * @returns {null}
   */
  AppendNode.prototype.getIndex = function() {
    return null;
  };

  /**
   * Update the HTML dom of the Node
   */
  AppendNode.prototype.updateDom = function(options) {
    var dom = this.dom;
    var tdAppend = dom.td;
    if (tdAppend) {
      tdAppend.style.paddingLeft = (this.getLevel() * 24 + 26) + 'px';
      // TODO: not so nice hard coded offset
    }

    var domText = dom.text;
    if (domText) {
      domText.innerHTML = '(' + translate('empty') + ' ' + this.parent.type + ')';
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
    var appendSubmenu = [
        {
            text: translate('auto'),
            className: 'jsoneditor-type-auto',
            title: titles.auto,
            click: function () {
                node._onAppend('', '', 'auto');
            }
        },
        {
            text: translate('array'),
            className: 'jsoneditor-type-array',
            title: titles.array,
            click: function () {
                node._onAppend('', []);
            }
        },
        {
            text: translate('object'),
            className: 'jsoneditor-type-object',
            title: titles.object,
            click: function () {
                node._onAppend('', {});
            }
        },
        {
            text: translate('string'),
            className: 'jsoneditor-type-string',
            title: titles.string,
            click: function () {
                node._onAppend('', '', 'string');
            }
        }
    ];
    node.addTemplates(appendSubmenu, true);
    var items = [
      // create append button
      {
        'text': translate('appendText'),
        'title': translate('appendTitleAuto'),
        'submenuTitle': translate('appendSubmenuTitle'),
        'className': 'jsoneditor-insert',
        'click': function () {
          node._onAppend('', '', 'auto');
        },
        'submenu': appendSubmenu
      }
    ];

    var menu = new ContextMenu(items, {close: onClose});
    menu.show(anchor, this.editor.content);
  };

  /**
   * Handle an event. The event is caught centrally by the editor
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
