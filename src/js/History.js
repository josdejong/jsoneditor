
/**
 * Keep track on any history, be able
 * @param {function} onChange
 * @param {function} calculateItemSize
 * @param {number} limit    Maximum size of all items in history
 * @constructor
 */
function History (onChange, calculateItemSize, limit) {
  this.onChange = onChange;
  this.calculateItemSize = calculateItemSize || function () {
    return 1;
  };
  this.limit = limit;

  this.items = [];
  this.index = -1;
}

History.prototype.add = function (item) {
  // limit number of items in history so that the total size doesn't
  // always keep at least one item in memory
  while (this._calculateHistorySize() > this.limit && this.items.length > 1) {
    this.items.shift();
    this.index--;
  }

  // cleanup any redo action that are not valid anymore
  this.items = this.items.slice(0, this.index + 1);

  this.items.push(item);
  this.index++;

  this.onChange();
};

History.prototype._calculateHistorySize = function () {
  var calculateItemSize = this.calculateItemSize;
  var totalSize = 0;

  this.items.forEach(function (item) {
    totalSize += calculateItemSize(item);
  });

  return totalSize;
}

History.prototype.undo = function () {
  if (!this.canUndo()) {
    return;
  }

  this.index--;

  this.onChange();

  return this.items[this.index];
};

History.prototype.redo = function () {
  if (!this.canRedo()) {
    return;
  }

  this.index++;

  this.onChange();

  return this.items[this.index];
};

History.prototype.canUndo = function () {
  return this.index > 0;
};

History.prototype.canRedo = function () {
  return this.index < this.items.length - 1;
};

History.prototype.clear = function () {
  this.items = [];
  this.index = -1;

  this.onChange();
};


module.exports = History;
