'use strict';

var ContextMenu = require('./ContextMenu');
var translate = require('./i18n').translate;
var util = require('./util');

/**
 * Creates a component that visualize path selection in tree based editors
 * @param {HTMLElement} container 
 * @param {HTMLElement} root
 * @constructor
 */
function TreePath(container, root) {
  if (container) {
    this.root = root;
    this.path = document.createElement('div');
    this.path.className = 'jsoneditor-treepath';
    this.path.setAttribute('tabindex',0);
    this.contentMenuClicked;
    container.appendChild(this.path);
    this.reset();
  }
}

/**
 * Reset component to initial status
 */
TreePath.prototype.reset = function () {
  this.path.innerHTML = translate('selectNode');
};

/**
 * Renders the component UI according to a given path objects
 * @param {Array<{name: String, childs: Array}>} pathObjs a list of path objects
 * 
 */
TreePath.prototype.setPath = function (pathObjs) {
  var me = this;

  this.path.innerHTML = '';

  if (pathObjs && pathObjs.length) {
    pathObjs.forEach(function (pathObj, idx) {
      var pathEl = document.createElement('span');
      var sepEl;
      pathEl.className = 'jsoneditor-treepath-element';
      pathEl.innerText = pathObj.name;
      pathEl.onclick = _onSegmentClick.bind(me, pathObj);
  
      me.path.appendChild(pathEl);

      if (pathObj.children.length) {
        sepEl = document.createElement('span');
        sepEl.className = 'jsoneditor-treepath-seperator';
        sepEl.innerHTML = '&#9658;';

        sepEl.onclick = function () {
          me.contentMenuClicked = true;
          var items = [];
          pathObj.children.forEach(function (child) {
            items.push({
              'text': child.name,
              'className': 'jsoneditor-type-modes' + (pathObjs[idx + 1] + 1 && pathObjs[idx + 1].name === child.name ? ' jsoneditor-selected' : ''),
              'click': _onContextMenuItemClick.bind(me, pathObj, child.name)
            });
          });
          var menu = new ContextMenu(items);
          menu.show(sepEl, me.root, true);
        };

        me.path.appendChild(sepEl);
      }

      if(idx === pathObjs.length - 1) {
        var leftRectPos = (sepEl || pathEl).getBoundingClientRect().right;
        if(me.path.offsetWidth < leftRectPos) {
          me.path.scrollLeft = leftRectPos;
        }

        if (me.path.scrollLeft) {
          var showAllBtn = document.createElement('span');
          showAllBtn.className = 'jsoneditor-treepath-show-all-btn';
          showAllBtn.title = 'show all path';
          showAllBtn.innerHTML = '...';
          showAllBtn.onclick = _onShowAllClick.bind(me, pathObjs);
          me.path.insertBefore(showAllBtn, me.path.firstChild);
        }
      }
    });
  }

  function _onShowAllClick(pathObjs) {
    me.contentMenuClicked = false;
    util.addClassName(me.path, 'show-all');
    me.path.style.width = me.path.parentNode.getBoundingClientRect().width - 10 + 'px';
    me.path.onblur = function() {
      if (me.contentMenuClicked) {
        me.contentMenuClicked = false;
        me.path.focus();
        return;
      }
      util.removeClassName(me.path, 'show-all');
      me.path.onblur = undefined;
      me.path.style.width = '';
      me.setPath(pathObjs);
    };
  }

  function _onSegmentClick(pathObj) {
    if (this.selectionCallback) {
      this.selectionCallback(pathObj);
    }
  }

  function _onContextMenuItemClick(pathObj, selection) {
    if (this.contextMenuCallback) {
      this.contextMenuCallback(pathObj, selection);
    }
  }
};

/**
 * set a callback function for selection of path section
 * @param {Function} callback function to invoke when section is selected
 */
TreePath.prototype.onSectionSelected = function (callback) {
  if (typeof callback === 'function') {
    this.selectionCallback = callback;      
  }
};

/**
 * set a callback function for selection of path section
 * @param {Function} callback function to invoke when section is selected
 */
TreePath.prototype.onContextMenuItemSelected = function (callback) {
  if (typeof callback === 'function') {
    this.contextMenuCallback = callback;
  }
};

module.exports = TreePath;