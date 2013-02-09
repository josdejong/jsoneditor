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
 * @constructor jsoneditor.AppendNode
 * @extends jsoneditor.Node
 * @param {jsoneditor.JSONEditor} editor
 * Create a new AppendNode. This is a special node which is created at the
 * end of the list with childs for an object or array
 */
jsoneditor.AppendNode = function (editor) {
    this.editor = editor;
    this.dom = {};
};

jsoneditor.AppendNode.prototype = new jsoneditor.Node();

/**
 * Return a table row with an append button.
 * @return {Element} dom   TR element
 */
jsoneditor.AppendNode.prototype.getDom = function () {
    // TODO: do not create the DOM for the appendNode when in viewer mode
    // TODO: implement a new solution for the append node
    var dom = this.dom;

    if (dom.tr) {
        return dom.tr;
    }

    // a row for the append button
    var trAppend = document.createElement('tr');
    trAppend.node = this;
    dom.tr = trAppend;

    // when in viewer mode, don't create the contents for the append node
    // but return here.
    if (!this.editor.mode.editor) {
        return trAppend;
    }

    // TODO: consistent naming

    // a cell for the dragarea column
    var tdDrag = document.createElement('td');
    dom.tdDrag = tdDrag;

    // create context menu
    var tdMenu = document.createElement('td');
    var menu = document.createElement('button');
    menu.className = 'contextmenu';
    menu.title = 'Click to open the actions menu (Ctrl+M)';
    dom.menu = menu;
    dom.tdMenu = tdMenu;
    tdMenu.appendChild(dom.menu);

    // a cell for the contents (showing text 'empty')
    var tdAppend = document.createElement('td');
    var domText = document.createElement('div');
    domText.innerHTML = '(empty)';
    domText.className = 'readonly';
    tdAppend.appendChild(domText);
    dom.td = tdAppend;
    dom.text = domText;

    this.updateDom();

    return trAppend;
};

/**
 * Update the HTML dom of the Node
 */
jsoneditor.AppendNode.prototype.updateDom = function () {
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
            trAppend.removeChild(dom.tdDrag);
            trAppend.removeChild(dom.tdMenu);
            trAppend.removeChild(tdAppend);
        }
    }
    else {
        if (!dom.tr.firstChild) {
            trAppend.appendChild(dom.tdDrag);
            trAppend.appendChild(dom.tdMenu);
            trAppend.appendChild(tdAppend);
        }
    }
};

/**
 * Check whether the AppendNode is currently visible.
 * the AppendNode is visible when its parent has no childs (i.e. is empty).
 * @return {boolean} isVisible
 */
jsoneditor.AppendNode.prototype.isVisible = function () {
    return (this.parent.childs.length == 0);
};

/**
 * Show a contextmenu for this node
 * @param {HTMLElement} anchor   The element to attach the menu to.
 * @param {function} [onClose]   Callback method called when the context menu
 *                               is being closed.
 */
jsoneditor.AppendNode.prototype.showContextMenu = function (anchor, onClose) {
    var node = this;
    var titles = jsoneditor.Node.TYPE_TITLES;
    var items = [
        // create append button
        {
            'text': 'Append',
            'title': 'Append a new field with type \'auto\' (Ctrl+Shift+Ins)',
            'submenuTitle': 'Select the type of the field to be appended',
            'className': 'insert',
            'click': function () {
                node._onAppend('', '', 'auto');
            },
            'submenu': [
                {
                    'text': 'Auto',
                    'className': 'type-auto',
                    'title': titles.auto,
                    'click': function () {
                        node._onAppend('', '', 'auto');
                    }
                },
                {
                    'text': 'Array',
                    'className': 'type-array',
                    'title': titles.array,
                    'click': function () {
                        node._onAppend('', []);
                    }
                },
                {
                    'text': 'Object',
                    'className': 'type-object',
                    'title': titles.object,
                    'click': function () {
                        node._onAppend('', {});
                    }
                },
                {
                    'text': 'String',
                    'className': 'type-string',
                    'title': titles.string,
                    'click': function () {
                        node._onAppend('', '', 'string');
                    }
                }
            ]
        }
    ];

    var menu = new jsoneditor.ContextMenu(items, {close: onClose});
    menu.show(anchor);
};

/**
 * Handle an event. The event is catched centrally by the editor
 * @param {Event} event
 */
jsoneditor.AppendNode.prototype.onEvent = function (event) {
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
        jsoneditor.util.addClassName(dom.menu, 'selected');
        this.showContextMenu(dom.menu, function () {
            jsoneditor.util.removeClassName(dom.menu, 'selected');
            highlighter.unlock();
            highlighter.unhighlight();
        });
    }

    if (type == 'keydown') {
        this.onKeyDown(event);
    }
};
