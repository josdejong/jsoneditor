/**
 * A splitter control.
 * Turns an existing HTML element into an horizontal splitter control.
 * @constructor Splitter
 * @param {Object} params   Available parameters:
 *                          {Element} container  HTML container representing
 *                                               the splitter
 *                          {Number} [snap]      Number of pixels to snap to
 *                                               the edges (0 or 1)
 *                          {function} [change]  Callback method called when
 *                                               the splitter value has changed.
 *                                               The callback is called with
 *                                               the new value as parameter
 */
function Splitter (params) {
  if (!params || !params.container) {
    throw new Error('params.container undefined in Splitter constructor');
  }

  var me = this;
  jsoneditor.util.addEventListener(params.container, "mousedown", function (event) {
    me.onMouseDown(event);
  });

  this.container = params.container;
  this.snap = Number(params.snap) || 200; // px
  this.width = undefined;
  this.value = undefined;
  this.onChange = (params.change) ? params.change : function () {};
  this.params = {};
}

/**
 * Handle mouse down event. Start dragging the splitter.
 * @param {Event} event
 * @private
 */
Splitter.prototype.onMouseDown = function (event) {
  var me = this;
  var leftButtonDown = event.which ? (event.which == 1) : (event.button == 1);
  if (!leftButtonDown) {
    return;
  }
  jsoneditor.util.addClassName(this.container, 'active');

  if (!this.params.mousedown) {
    this.params.mousedown = true;
    this.params.mousemove =
        jsoneditor.util.addEventListener(document, 'mousemove', function (event) {
          me.onMouseMove(event);
        });
    this.params.mouseup =
        jsoneditor.util.addEventListener(document, 'mouseup', function (event) {
          me.onMouseUp(event);
        });
    this.params.screenX = event.screenX;
    this.params.changed = false;
    this.params.value = this.getValue();
  }
  event.preventDefault();
  event.stopPropagation();
};

/**
 * Handle on mouse move event. Used to drag the splitter
 * @param {Event} event
 * @private
 */
Splitter.prototype.onMouseMove = function (event) {
  if (this.width != undefined) {
    var diff = event.screenX - this.params.screenX;

    var value = this.params.value + diff / this.width;
    value = this.setValue(value);

    if (value != this.params.value) {
      // value has been changed
      this.params.changed = true;
    }

    this.onChange(value);
  }

  event.preventDefault();
  event.stopPropagation();
};

/**
 * Handle on mouse up event
 * @param {Event} event
 * @private
 */
Splitter.prototype.onMouseUp = function (event) {
  jsoneditor.util.removeClassName(this.container, 'active');

  if (this.params.mousedown) {
    jsoneditor.util.removeEventListener(document, 'mousemove', this.params.mousemove);
    jsoneditor.util.removeEventListener(document, 'mouseup', this.params.mouseup);
    this.params.mousemove = undefined;
    this.params.mouseup = undefined;
    this.params.mousedown = false;

    var value = this.getValue();
    if (!this.params.changed) {
      // value is unchanged -> unsnap when currently snapped
      if (value == 0) {
        value = this.setValue(0.2);
        this.onChange(value);
      }
      if (value == 1) {
        value = this.setValue(0.8);
        this.onChange(value);
      }
    }
  }
  event.preventDefault();
  event.stopPropagation();
};

/**
 * Set the window width for the splitter
 * @param {Number} width
 */
Splitter.prototype.setWidth = function (width) {
  this.width = width;
};

/**
 * Set a value for the splitter (UI is not adjusted)
 * @param {Number} value   A number between 0 and 1
 * @return {Number} value  The stored value
 */
Splitter.prototype.setValue = function (value) {
  value = Number(value);

  // snap to 0 or 1 when close
  if (this.width != undefined && this.width > this.snap) {
    if (value < this.snap / this.width) {
      value = 0;
    }
    if (value > (this.width - this.snap) / this.width) {
      value = 1;
    }
  }

  this.value = value;

  try {
    localStorage['splitterValue'] = value;
  }
  catch (e) {
    if (console && console.log) {
      console.log(e);
    }
  }
  return value;
};

/**
 * Get the splitter value from local storage
 * @return {Number} value   A value between 0.1 and 0.9
 */
Splitter.prototype.getValue = function () {
  var value = this.value;
  if (value == undefined) {
    // read from localStorage once
    try {
      if (localStorage['splitterValue'] != undefined) {
        value = Number(localStorage['splitterValue']); // read
        value = this.setValue(value);          // verify and store
      }
    }
    catch (e) {
      console.log(e);
    }
  }
  if (value == undefined) {
    value = this.setValue(0.5);
  }
  return value;
};
