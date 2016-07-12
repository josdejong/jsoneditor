'use strict';

var ContextMenu = require('./ContextMenu');

/**
 * Create a select box to be used in the editor menu's, which allows to switch mode
 * @param {HTMLElement} container
 * @param {String[]} modes  Available modes: 'code', 'form', 'text', 'tree', 'view'
 * @param {String} current  Available modes: 'code', 'form', 'text', 'tree', 'view'
 * @param {function(mode: string)} onSwitch  Callback invoked on switch
 * @constructor
 */
function ModeSwitcher(container, modes, current, onSwitch) {
  // available modes
  var availableModes = {
    code: {
      'text': 'Code',
      'title': 'Switch to code highlighter',
      'click': function () {
        onSwitch('code')
      }
    },
    form: {
      'text': 'Form',
      'title': 'Switch to form editor',
      'click': function () {
        onSwitch('form');
      }
    },
    text: {
      'text': 'Text',
      'title': 'Switch to plain text editor',
      'click': function () {
        onSwitch('text');
      }
    },
    tree: {
      'text': 'Tree',
      'title': 'Switch to tree editor',
      'click': function () {
        onSwitch('tree');
      }
    },
    view: {
      'text': 'View',
      'title': 'Switch to tree view',
      'click': function () {
        onSwitch('view');
      }
    }
  };

  // list the selected modes
  var items = [];
  for (var i = 0; i < modes.length; i++) {
    var mode = modes[i];
    var item = availableModes[mode];
    if (!item) {
      throw new Error('Unknown mode "' + mode + '"');
    }

    item.className = 'jsoneditor-type-modes' + ((current == mode) ? ' jsoneditor-selected' : '');
    items.push(item);
  }

  // retrieve the title of current mode
  var currentMode = availableModes[current];
  if (!currentMode) {
    throw new Error('Unknown mode "' + current + '"');
  }
  var currentTitle = currentMode.text;

  // create the html element
  var box = document.createElement('button');
  box.className = 'jsoneditor-modes jsoneditor-separator';
  box.innerHTML = currentTitle + ' &#x25BE;';
  box.title = 'Switch editor mode';
  box.onclick = function () {
    var menu = new ContextMenu(items);
    menu.show(box);
  };

  var frame = document.createElement('div');
  frame.className = 'jsoneditor-modes';
  frame.style.position = 'relative';
  frame.appendChild(box);

  container.appendChild(frame);

  this.dom = {
    container: container,
    box: box,
    frame: frame
  };
}

/**
 * Set focus to switcher
 */
ModeSwitcher.prototype.focus = function () {
  this.dom.box.focus();
};

/**
 * Destroy the ModeSwitcher, remove from DOM
 */
ModeSwitcher.prototype.destroy = function () {
  if (this.dom && this.dom.frame && this.dom.frame.parentNode) {
    this.dom.frame.parentNode.removeChild(this.dom.frame);
  }
  this.dom = null;
};

module.exports = ModeSwitcher;
