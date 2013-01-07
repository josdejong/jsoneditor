/**
 * A splitter control.
 * Turns an existing HTML element into an horizontal splitter control.
 * @constructor Splitter
 * @param {Object} params   Available parameters:
 *                          {Element} container  HTML container representing
 *                                               the splitter
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
    JSONEditor.Events.addEventListener(params.container, "mousedown", function (event) {
        me.onMouseDown(event);
    });

    this.container = params.container;
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

    if (!this.params.mousedown) {
        this.params.mousedown = true;
        this.params.mousemove =
            JSONEditor.Events.addEventListener(document, 'mousemove', function (event) {
                me.onMouseMove(event);
            });
        this.params.mouseup =
            JSONEditor.Events.addEventListener(document, 'mouseup', function (event) {
                me.onMouseUp(event);
            });
        this.params.screenX = event.screenX;
        this.params.value = this.getValue();
    }
    JSONEditor.Events.preventDefault(event);
};

/**
 * Handle on mouse move event. Used to drag the splitter
 * @param {Event} event
 * @private
 */
Splitter.prototype.onMouseMove = function (event) {
    var width = (window.innerWidth || document.body.offsetWidth ||
        document.documentElement.offsetWidth);

    var diff = event.screenX - this.params.screenX;

    var value = this.params.value + diff / width;
    value = this.setValue(value);

    this.onChange(value);

    JSONEditor.Events.preventDefault(event);
};

/**
 * Handle on mouse up event
 * @param {Event} event
 * @private
 */
Splitter.prototype.onMouseUp = function (event) {
    if (this.params.mousedown) {
        JSONEditor.Events.removeEventListener(document, 'mousemove', this.params.mousemove);
        JSONEditor.Events.removeEventListener(document, 'mouseup', this.params.mouseup);
        this.params.mousemove = undefined;
        this.params.mouseup = undefined;
        this.params.mousedown = false;
    }
    JSONEditor.Events.preventDefault(event);
};

/**
 * Set a value for the splitter (UI is not adjusted)
 * @param {Number} value   A number between 0.1 and 0.9
 * @return {Number} value  The stored value
 */
Splitter.prototype.setValue = function (value) {
    value = Number(value);
    if (value < 0.1) {
        value = 0.1;
    }
    if (value > 0.9) {
        value = 0.9;
    }

    this.value = value;

    try {
        localStorage['splitterValue'] = value;
    }
    catch (e) {
        console.log(e);
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
