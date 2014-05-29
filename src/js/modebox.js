/**
 * create a mode box to be used in the editor menu's
 * @param {JSONEditor} editor
 * @param {String[]} modes  Available modes: 'code', 'form', 'text', 'tree', 'view'
 * @param {String} current  Available modes: 'code', 'form', 'text', 'tree', 'view'
 * @returns {HTMLElement} box
 */
function createModeBox(editor, modes, current) {
  /**
   * Switch the mode of the editor
   * @param {String} mode
   */
  function switchMode(mode) {
    // switch mode
    editor.setMode(mode);

    // restore focus on mode box
    var modeBox = editor.dom && editor.dom.modeBox;
    if (modeBox) {
      modeBox.focus();
    }
  }

  // available modes
  var availableModes = {
    code: {
      'text': 'Code',
      'title': 'Switch to code highlighter',
      'click': function () {
        switchMode('code')
      }
    },
    form: {
      'text': 'Form',
      'title': 'Switch to form editor',
      'click': function () {
        switchMode('form');
      }
    },
    text: {
      'text': 'Text',
      'title': 'Switch to plain text editor',
      'click': function () {
        switchMode('text');
      }
    },
    tree: {
      'text': 'Tree',
      'title': 'Switch to tree editor',
      'click': function () {
        switchMode('tree');
      }
    },
    view: {
      'text': 'View',
      'title': 'Switch to tree view',
      'click': function () {
        switchMode('view');
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

    item.className = 'type-modes' + ((current == mode) ? ' selected' : '');
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
  box.className = 'modes separator';
  box.innerHTML = currentTitle + ' &#x25BE;';
  box.title = 'Switch editor mode';
  box.onclick = function () {
    var menu = new ContextMenu(items);
    menu.show(box);
  };

  return box;
}
