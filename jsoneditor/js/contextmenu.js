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
 * A context menu
 * @param {Object[]} items    Array containing the menu structure
 *                            TODO: describe structure
 * @param {Object} [options]  Object with options. Available options:
 *                            {function} close    Callback called when the
 *                                                context menu is being closed.
 * @constructor
 */
JSONEditor.ContextMenu = function (items, options) {
    var me = this;
    this.items = items;
    this.eventListeners = {};
    this.visibleSubmenu = undefined;
    this.onClose = options ? options.close : undefined;

    // create a container element
    var menu = document.createElement('div');
    menu.className = 'jsoneditor-contextmenu';
    this.menu = menu;

    // create a list to hold the menu items
    var list = document.createElement('ul');
    list.className = 'menu';
    menu.appendChild(list);
    this.list = list;

    function createMenuItems (list, items) {
        items.forEach(function (item) {
            if (item.type == 'separator') {
                // create a separator
                var separator = document.createElement('div');
                separator.className = 'separator';
                li = document.createElement('li');
                li.appendChild(separator);
                list.appendChild(li);
            }
            else {
                // create a menu item
                var li = document.createElement('li');
                list.appendChild(li);

                // create a button in the menu item
                var button = document.createElement('button');
                button.className = item.className;
                if (item.title) {
                    button.title = item.title;
                }
                if (item.click) {
                    button.onclick = function () {
                        me.hide();
                        item.click();
                    };
                }
                li.appendChild(button);

                // create the contents of the button
                if (item.submenu) {
                    // add the icon to the button
                    var divIcon = document.createElement('div');
                    divIcon.className = 'icon';
                    button.appendChild(divIcon);
                    button.appendChild(document.createTextNode(item.text));

                    var buttonSubmenu;
                    if (item.click) {
                        // submenu and a button with a click handler
                        button.className += ' default';

                        var buttonExpand = document.createElement('button');
                        buttonExpand.className = 'expand';
                        buttonExpand.innerHTML = '<div class="expand"></div>';
                        li.appendChild(buttonExpand);
                        if (item.submenuTitle) {
                            buttonExpand.title = item.submenuTitle;
                        }

                        buttonSubmenu = buttonExpand;
                    }
                    else {
                        // submenu and a button without a click handler
                        var divExpand = document.createElement('div');
                        divExpand.className = 'expand';
                        button.appendChild(divExpand);

                        buttonSubmenu = button;
                    }

                    // attach a handler to expand/collapse the submenu
                    var selected = false;
                    buttonSubmenu.onclick = function () {
                        me._onShowSubmenu(submenu);
                    };

                    // create the submenu
                    var submenu = document.createElement('ul');
                    submenu.className = 'menu';
                    submenu.style.height = '0';
                    li.appendChild(submenu);
                    createMenuItems(submenu, item.submenu);
                }
                else {
                    // no submenu, just a button with clickhandler
                    button.innerHTML = '<div class="icon"></div>' + item.text;
                }
            }
        });
    }
    createMenuItems(list, items);

    // TODO: when the editor is small, show the submenu on the right instead of inline?

    // calculate the max height of the menu with one submenu expanded
    this.maxHeight = 0; // height in pixels
    items.forEach(function (item) {
        var height = (items.length + (item.submenu ? item.submenu.length : 0)) * 24;
        me.maxHeight = Math.max(me.maxHeight, height);
    });
};

// currently displayed context menu, a singleton. We may only have one visible context menu
JSONEditor.ContextMenu.visibleMenu = undefined;

/**
 * Attach the menu to an anchor
 * @param {Element} anchor
 */
JSONEditor.ContextMenu.prototype.show = function (anchor) {
    this.hide();

    // calculate whether the menu fits below the anchor
    var windowHeight = JSONEditor.util.getWindowHeight();
    var anchorHeight = anchor.offsetHeight;
    var menuHeight = this.maxHeight;

    // position the menu
    var left = JSONEditor.util.getAbsoluteLeft(anchor);
    var top = JSONEditor.util.getAbsoluteTop(anchor);
    if (top + anchorHeight + menuHeight < windowHeight) {
        // display the menu below the anchor
        this.menu.style.left = left + 'px';
        this.menu.style.top = (top + anchorHeight) + 'px';
        this.menu.style.bottom = '';
    }
    else {
        // display the menu above the anchor
        this.menu.style.left = left + 'px';
        this.menu.style.top = '';
        this.menu.style.bottom = (windowHeight - top) + 'px';
    }

    // attach the menu to the document
    document.body.appendChild(this.menu);

    // create and attach event listeners
    var me = this;
    var list = this.list;
    this.eventListeners.mousedown = JSONEditor.util.addEventListener(
        document, 'mousedown', function (event) {
            // hide menu on click outside of the menu
            event = event || window.event;
            var target = event.target || event.srcElement;
            if ((target != list) && !me._isChildOf(target, list)) {
                me.hide();
            }
        });
    this.eventListeners.mousewheel = JSONEditor.util.addEventListener(
        document, 'mousewheel', function () {
            // hide the menu on mouse scroll
            me.hide();
        });
    this.eventListeners.keydown = JSONEditor.util.addEventListener(
        document, 'keydown', function (event) {
            // hide the menu on ESC key
            event = event || window.event;
            var keynum = event.which || event.keyCode;
            if (keynum == 27) { // ESC
                me.hide();
                JSONEditor.util.stopPropagation(event);
                JSONEditor.util.preventDefault(event);
            }
        });

    // TODO: focus to the first button in the context menu

    if (JSONEditor.ContextMenu.visibleMenu) {
        JSONEditor.ContextMenu.visibleMenu.hide();
    }
    JSONEditor.ContextMenu.visibleMenu = this;
};

/**
 * Hide the context menu if visible
 */
JSONEditor.ContextMenu.prototype.hide = function () {
    // remove the menu from the DOM
    if (this.menu.parentNode) {
        this.menu.parentNode.removeChild(this.menu);
        if (this.onClose) {
            this.onClose();
        }
    }

    // remove all event listeners
    // all event listeners are supposed to be attached to document.
    for (var name in this.eventListeners) {
        if (this.eventListeners.hasOwnProperty(name)) {
            var fn = this.eventListeners[name];
            if (fn) {
                JSONEditor.util.removeEventListener(document, name, fn);
            }
            delete this.eventListeners[name];
        }
    }
};

/**
 * Show or hide a submenu.
 * Any currently visible submenu will be hided.
 * @param {Element} submenu
 * @private
 */
JSONEditor.ContextMenu.prototype._onShowSubmenu = function (submenu) {
    var me = this;
    var alreadyVisible = (submenu == this.visibleSubmenu);

    // hide the currently visible submenu
    var visibleSubmenu = this.visibleSubmenu;
    if (visibleSubmenu) {
        visibleSubmenu.style.height = '0';
        visibleSubmenu.style.padding = '';
        setTimeout(function () {
            if (me.visibleSubmenu != visibleSubmenu) {
                visibleSubmenu.style.display = '';
                JSONEditor.util.removeClassName(visibleSubmenu.parentNode, 'selected');
            }
        }, 300); // timeout duration must match the css transition duration
        this.visibleSubmenu = undefined;
    }

    if (!alreadyVisible) {
        submenu.style.display = 'block';
        var height = submenu.clientHeight; // force a reflow in Firefox
        setTimeout(function () {
            if (me.visibleSubmenu == submenu) {
                submenu.style.height = (submenu.childNodes.length * 24) + 'px';
                submenu.style.padding = '5px 10px';
            }
        }, 0);
        JSONEditor.util.addClassName(submenu.parentNode, 'selected');
        this.visibleSubmenu = submenu;
    }
};

/**
 * Test if an element is a child of a parent element.
 * @param {Element} child
 * @param {Element} parent
 * @return {boolean} isChild
 */
JSONEditor.ContextMenu.prototype._isChildOf = function (child, parent) {
    var e = child.parentNode;
    while (e) {
        if (e == parent) {
            return true;
        }
        e = e.parentNode;
    }

    return false;
};

