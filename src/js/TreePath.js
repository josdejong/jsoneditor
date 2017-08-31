'use strict';

// var ContextMenu = require('./ContextMenu');

/**
 * Creates a component that visualize path selection in tree based editors
 * @param {HTMLElement} container 
 * @constructor
 */
function TreePath(container, modes, current, onSwitch) {
  this.path = document.createElement('div');
  this.path.className = 'jsoneditor-treepath';
  container.appendChild(this.path);
  this.reset();
};

/**
 * Reset component to initial status
 */
TreePath.prototype.reset = function () {
  this.path.innerHTML = '/';
}

/**
 * Renders the component UI according to a given path objects
 * @param {Array<name: String, childs: Array>} pathObjs a list of path objects
 * 
 */
TreePath.prototype.setPath = function (pathObjs) {
  var me = this;
  this.reset();
  if(pathObjs && pathObjs.length) {
    pathObjs.forEach(function (pathObj, idx) {
      var pathEl = document.createElement('span');
      pathEl.className = 'jsoneditor-treepath-element';
      pathEl.innerText = pathObj.name;
      pathEl.onclick = _onclick.bind(me, pathObj);

      me.path.appendChild(pathEl);

      if(idx < pathObjs.length - 1) {
        var sepEl = document.createElement('span');
        sepEl.className = 'jsoneditor-treepath-seperator';
        sepEl.innerText = '/';
        me.path.appendChild(sepEl);
      }
    });
  }

  function _onclick(pathObj) {
    if(this.selectionCallback) {
      this.selectionCallback(pathObj);
    }
  };
};

/**
 * set a callback function for selection of path section
 * @param {Function} callback function to invoke when section is selected
 */
TreePath.prototype.onSectionSelected = function (callback) {
  if(typeof callback === 'function') {
    this.selectionCallback = callback;      
  }
};

module.exports = TreePath;