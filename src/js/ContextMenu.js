'use strict';

var createAbsoluteAnchor = require('./createAbsoluteAnchor').createAbsoluteAnchor;
var util = require('./util');
var translate = require('./i18n').translate;

/**
 * A context menu
 * @param {Object[]} items    Array containing the menu structure
 *                            TODO: describe structure
 * @param {Object} [options]  Object with options. Available options:
 *                            {function} close    Callback called when the
 *                                                context menu is being closed.
 * @constructor
 */
function ContextMenu (items, options) {
  this.dom = {};

  var me = this;
  var dom = this.dom;
  this.anchor = undefined;
  this.items = items;
  this.eventListeners = {};
  this.selection = undefined; // holds the selection before the menu was opened
  this.onClose = options ? options.close : undefined;

  // create root element
  var root = document.createElement('div');
  root.className = 'jsoneditor-contextmenu-root';
  dom.root = root;

  // create a container element
  var menu = document.createElement('div');
  menu.className = 'jsoneditor-contextmenu';
  dom.menu = menu;
  root.appendChild(menu);

  // create a list to hold the menu items
  var list = document.createElement('ul');
  list.className = 'jsoneditor-menu';
  menu.appendChild(list);
  dom.list = list;
  dom.items = []; // list with all buttons

  // create a (non-visible) button to set the focus to the menu
  var focusButton = document.createElement('button');
  focusButton.type = 'button';
  dom.focusButton = focusButton;
  var li = document.createElement('li');
  li.style.overflow = 'hidden';
  li.style.height = '0';
  li.appendChild(focusButton);
  list.appendChild(li);

  function createMenuItems (list, domItems, items) {
    items.forEach(function (item) {
      if (item.type == 'separator') {
        // create a separator
        var separator = document.createElement('div');
        separator.className = 'jsoneditor-separator';
        li = document.createElement('li');
        li.appendChild(separator);
        list.appendChild(li);
      }
      else {
        var domItem = {};

        // create a menu item
        var li = document.createElement('li');
        list.appendChild(li);

        // create a button in the menu item
        var button = document.createElement('button');
        button.type = 'button';
        button.className = item.className;
        domItem.button = button;
        if (item.title) {
          button.title = item.title;
        }
        if (item.click) {
          button.onclick = function (event) {
            event.preventDefault();
            me.hide();
            item.click();
          };
        }
        li.appendChild(button);

        // create the contents of the button
        if (item.submenu) {
          // add the icon to the button
          var divIcon = document.createElement('div');
          divIcon.className = 'jsoneditor-icon';
          button.appendChild(divIcon);
          var divText = document.createElement('div');
          divText.className = 'jsoneditor-text' +
              (item.click ? '' : ' jsoneditor-right-margin');
          divText.appendChild(document.createTextNode(item.text));
          button.appendChild(divText);

          var buttonSubmenu;
          if (item.click) {
            // submenu and a button with a click handler
            button.className += ' jsoneditor-default';

            var buttonExpand = document.createElement('button');
            buttonExpand.type = 'button';
            domItem.buttonExpand = buttonExpand;
            buttonExpand.className = 'jsoneditor-expand';
            buttonExpand.innerHTML = '<div class="jsoneditor-expand"></div>';
            li.appendChild(buttonExpand);
            if (item.submenuTitle) {
              buttonExpand.title = item.submenuTitle;
            }

            buttonSubmenu = buttonExpand;
          }
          else {
            // submenu and a button without a click handler
            var divExpand = document.createElement('div');
            divExpand.className = 'jsoneditor-expand';
            button.appendChild(divExpand);

            buttonSubmenu = button;
          }

          // attach a handler to expand/collapse the submenu
          buttonSubmenu.onclick = function (event) {
            event.preventDefault();
            me._onExpandItem(domItem);
            buttonSubmenu.focus();
          };

          // create the submenu
          var domSubItems = [];
          domItem.subItems = domSubItems;
          var ul = document.createElement('ul');
          domItem.ul = ul;
          ul.className = 'jsoneditor-menu';
          ul.style.height = '0';
          li.appendChild(ul);
          createMenuItems(ul, domSubItems, item.submenu);
        }
        else {
          // no submenu, just a button with clickhandler
          button.innerHTML = '<div class="jsoneditor-icon"></div>' +
              '<div class="jsoneditor-text">' + translate(item.text) + '</div>';
        }

        domItems.push(domItem);
      }
    });
  }
  createMenuItems(list, this.dom.items, items);

  // TODO: when the editor is small, show the submenu on the right instead of inline?

  // calculate the max height of the menu with one submenu expanded
  this.maxHeight = 0; // height in pixels
  items.forEach(function (item) {
    var height = (items.length + (item.submenu ? item.submenu.length : 0)) * 24;
    me.maxHeight = Math.max(me.maxHeight, height);
  });
}

/**
 * Get the currently visible buttons
 * @return {Array.<HTMLElement>} buttons
 * @private
 */
ContextMenu.prototype._getVisibleButtons = function () {
  var buttons = [];
  var me = this;
  this.dom.items.forEach(function (item) {
    buttons.push(item.button);
    if (item.buttonExpand) {
      buttons.push(item.buttonExpand);
    }
    if (item.subItems && item == me.expandedItem) {
      item.subItems.forEach(function (subItem) {
        buttons.push(subItem.button);
        if (subItem.buttonExpand) {
          buttons.push(subItem.buttonExpand);
        }
        // TODO: change to fully recursive method
      });
    }
  });

  return buttons;
};

// currently displayed context menu, a singleton. We may only have one visible context menu
ContextMenu.visibleMenu = undefined;

/**
 * Attach the menu to an anchor
 * @param {HTMLElement} anchor    Anchor where the menu will be attached as sibling.
 * @param {HTMLElement} frame     The root of the JSONEditor window
 * @param {Boolean=} ignoreParent ignore anchor parent in regard to the calculation of the position, needed when the parent position is absolute
 */
ContextMenu.prototype.show = function (anchor, frame, ignoreParent) {
  this.hide();

  // determine whether to display the menu below or above the anchor
  var showBelow = true;
  var parent = anchor.parentNode;
  var anchorRect = anchor.getBoundingClientRect();
  var parentRect = parent.getBoundingClientRect();
  var frameRect = frame.getBoundingClientRect();

  var me = this;
  this.dom.absoluteAnchor = createAbsoluteAnchor(anchor, frame, function () {
    me.hide()
  });

  if (anchorRect.bottom + this.maxHeight < frameRect.bottom) {
    // fits below -> show below
  }
  else if (anchorRect.top - this.maxHeight > frameRect.top) {
    // fits above -> show above
    showBelow = false;
  }
  else {
    // doesn't fit above nor below -> show below
  }

  var topGap = ignoreParent ? 0 : (anchorRect.top - parentRect.top);

  // position the menu
  if (showBelow) {
    // display the menu below the anchor
    var anchorHeight = anchor.offsetHeight;
    this.dom.menu.style.left = '0';
    this.dom.menu.style.top = topGap + anchorHeight + 'px';
    this.dom.menu.style.bottom = '';
  }
  else {
    // display the menu above the anchor
    this.dom.menu.style.left = '0';
    this.dom.menu.style.top = '';
    this.dom.menu.style.bottom = '0px';
  }

  // attach the menu to the temporary, absolute anchor
  // parent.insertBefore(this.dom.root, anchor);
  this.dom.absoluteAnchor.appendChild(this.dom.root);

  // move focus to the first button in the context menu
  this.selection = util.getSelection();
  this.anchor = anchor;
  setTimeout(function () {
    me.dom.focusButton.focus();
  }, 0);

  if (ContextMenu.visibleMenu) {
    ContextMenu.visibleMenu.hide();
  }
  ContextMenu.visibleMenu = this;
};

/**
 * Hide the context menu if visible
 */
ContextMenu.prototype.hide = function () {
  // remove temporary absolutely positioned anchor
  if (this.dom.absoluteAnchor) {
    this.dom.absoluteAnchor.destroy();
    delete this.dom.absoluteAnchor;
  }

  // remove the menu from the DOM
  if (this.dom.root.parentNode) {
    this.dom.root.parentNode.removeChild(this.dom.root);
    if (this.onClose) {
      this.onClose();
    }
  }

  if (ContextMenu.visibleMenu == this) {
    ContextMenu.visibleMenu = undefined;
  }
};

/**
 * Expand a submenu
 * Any currently expanded submenu will be hided.
 * @param {Object} domItem
 * @private
 */
ContextMenu.prototype._onExpandItem = function (domItem) {
  var me = this;
  var alreadyVisible = (domItem == this.expandedItem);

  // hide the currently visible submenu
  var expandedItem = this.expandedItem;
  if (expandedItem) {
    //var ul = expandedItem.ul;
    expandedItem.ul.style.height = '0';
    expandedItem.ul.style.padding = '';
    setTimeout(function () {
      if (me.expandedItem != expandedItem) {
        expandedItem.ul.style.display = '';
        util.removeClassName(expandedItem.ul.parentNode, 'jsoneditor-selected');
      }
    }, 300); // timeout duration must match the css transition duration
    this.expandedItem = undefined;
  }

  if (!alreadyVisible) {
    var ul = domItem.ul;
    ul.style.display = 'block';
    var height = ul.clientHeight; // force a reflow in Firefox
    setTimeout(function () {
      if (me.expandedItem == domItem) {
        var childsHeight = 0;
        for (var i = 0; i < ul.childNodes.length; i++) {
          childsHeight += ul.childNodes[i].clientHeight;
        }
        ul.style.height = childsHeight + 'px';
        ul.style.padding = '5px 10px';
      }
    }, 0);
    util.addClassName(ul.parentNode, 'jsoneditor-selected');
    this.expandedItem = domItem;
  }
};

/**
 * Handle onkeydown event
 * @param {Event} event
 * @private
 */
ContextMenu.prototype._onKeyDown = function (event) {
  var target = event.target;
  var keynum = event.which;
  var handled = false;
  var buttons, targetIndex, prevButton, nextButton;

  if (keynum == 27) { // ESC
    // hide the menu on ESC key

    // restore previous selection and focus
    if (this.selection) {
      util.setSelection(this.selection);
    }
    if (this.anchor) {
      this.anchor.focus();
    }

    this.hide();

    handled = true;
  }
  else if (keynum == 9) { // Tab
    if (!event.shiftKey) { // Tab
      buttons = this._getVisibleButtons();
      targetIndex = buttons.indexOf(target);
      if (targetIndex == buttons.length - 1) {
        // move to first button
        buttons[0].focus();
        handled = true;
      }
    }
    else { // Shift+Tab
      buttons = this._getVisibleButtons();
      targetIndex = buttons.indexOf(target);
      if (targetIndex == 0) {
        // move to last button
        buttons[buttons.length - 1].focus();
        handled = true;
      }
    }
  }
  else if (keynum == 37) { // Arrow Left
    if (target.className == 'jsoneditor-expand') {
      buttons = this._getVisibleButtons();
      targetIndex = buttons.indexOf(target);
      prevButton = buttons[targetIndex - 1];
      if (prevButton) {
        prevButton.focus();
      }
    }
    handled = true;
  }
  else if (keynum == 38) { // Arrow Up
    buttons = this._getVisibleButtons();
    targetIndex = buttons.indexOf(target);
    prevButton = buttons[targetIndex - 1];
    if (prevButton && prevButton.className == 'jsoneditor-expand') {
      // skip expand button
      prevButton = buttons[targetIndex - 2];
    }
    if (!prevButton) {
      // move to last button
      prevButton = buttons[buttons.length - 1];
    }
    if (prevButton) {
      prevButton.focus();
    }
    handled = true;
  }
  else if (keynum == 39) { // Arrow Right
    buttons = this._getVisibleButtons();
    targetIndex = buttons.indexOf(target);
    nextButton = buttons[targetIndex + 1];
    if (nextButton && nextButton.className == 'jsoneditor-expand') {
      nextButton.focus();
    }
    handled = true;
  }
  else if (keynum == 40) { // Arrow Down
    buttons = this._getVisibleButtons();
    targetIndex = buttons.indexOf(target);
    nextButton = buttons[targetIndex + 1];
    if (nextButton && nextButton.className == 'jsoneditor-expand') {
      // skip expand button
      nextButton = buttons[targetIndex + 2];
    }
    if (!nextButton) {
      // move to first button
      nextButton = buttons[0];
    }
    if (nextButton) {
      nextButton.focus();
      handled = true;
    }
    handled = true;
  }
  // TODO: arrow left and right

  if (handled) {
    event.stopPropagation();
    event.preventDefault();
  }
};

module.exports = ContextMenu;
