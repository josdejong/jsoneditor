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
  this.path.innerText = '/';
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

      me.path.appendChild(pathEl);

      if(idx < pathObjs.length - 1) {
        var sepEl = document.createElement('span');
        sepEl.className = 'jsoneditor-treepath-seperator';
        sepEl.innerText = '/';
        me.path.appendChild(sepEl);
      }
    });
  }
};

module.exports = TreePath;