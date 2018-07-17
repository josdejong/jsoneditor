/*!
 * Selectr 2.4.0
 * https://github.com/Mobius1/Selectr
 *
 * Released under the MIT license
 */

'use strict';

/**
 * Default configuration options
 * @type {Object}
 */
var defaultConfig = {
  /**
   * Emulates browser behaviour by selecting the first option by default
   * @type {Boolean}
   */
  defaultSelected: true,

  /**
   * Sets the width of the container
   * @type {String}
   */
  width: "auto",

  /**
   * Enables/ disables the container
   * @type {Boolean}
   */
  disabled: false,

  /**
   * Enables / disables the search function
   * @type {Boolean}
   */
  searchable: true,

  /**
   * Enable disable the clear button
   * @type {Boolean}
   */
  clearable: false,

  /**
   * Sort the tags / multiselect options
   * @type {Boolean}
   */
  sortSelected: false,

  /**
   * Allow deselecting of select-one options
   * @type {Boolean}
   */
  allowDeselect: false,

  /**
   * Close the dropdown when scrolling (@AlexanderReiswich, #11)
   * @type {Boolean}
   */
  closeOnScroll: false,

  /**
   * Allow the use of the native dropdown (@jonnyscholes, #14)
   * @type {Boolean}
   */
  nativeDropdown: false,

  /**
   * Set the main placeholder
   * @type {String}
   */
  placeholder: "Select an option...",

  /**
   * Allow the tagging feature
   * @type {Boolean}
   */
  taggable: false,

  /**
   * Set the tag input placeholder (@labikmartin, #21, #22)
   * @type {String}
   */
  tagPlaceholder: "Enter a tag..."
};

/**
 * Event Emitter
 */
var Events = function() {};

/**
 * Event Prototype
 * @type {Object}
 */
Events.prototype = {
  /**
   * Add custom event listener
   * @param  {String} event Event type
   * @param  {Function} func   Callback
   * @return {Void}
   */
  on: function(event, func) {
    this._events = this._events || {};
    this._events[event] = this._events[event] || [];
    this._events[event].push(func);
  },

  /**
   * Remove custom event listener
   * @param  {String} event Event type
   * @param  {Function} func   Callback
   * @return {Void}
   */
  off: function(event, func) {
    this._events = this._events || {};
    if (event in this._events === false) return;
    this._events[event].splice(this._events[event].indexOf(func), 1);
  },

  /**
   * Fire a custom event
   * @param  {String} event Event type
   * @return {Void}
   */
  emit: function(event /* , args... */ ) {
    this._events = this._events || {};
    if (event in this._events === false) return;
    for (var i = 0; i < this._events[event].length; i++) {
      this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
  }
};

/**
 * Event mixin
 * @param  {Object} obj
 * @return {Object}
 */
Events.mixin = function(obj) {
  var props = ['on', 'off', 'emit'];
  for (var i = 0; i < props.length; i++) {
    if (typeof obj === 'function') {
      obj.prototype[props[i]] = Events.prototype[props[i]];
    } else {
      obj[props[i]] = Events.prototype[props[i]];
    }
  }
  return obj;
};

/**
 * Helpers
 * @type {Object}
 */
var util = {
  extend: function(src, props) {
    props = props || {};
    var p;
    for (p in src) {
      if (src.hasOwnProperty(p)) {
        if (!props.hasOwnProperty(p)) {
          props[p] = src[p];
        }
      }
    }
    return props;
  },
  each: function(a, b, c) {
    if ("[object Object]" === Object.prototype.toString.call(a)) {
      for (var d in a) {
        if (Object.prototype.hasOwnProperty.call(a, d)) {
          b.call(c, d, a[d], a);
        }
      }
    } else {
      for (var e = 0, f = a.length; e < f; e++) {
        b.call(c, e, a[e], a);
      }
    }
  },
  createElement: function(e, a) {
    var d = document,
        el = d.createElement(e);
    if (a && "[object Object]" === Object.prototype.toString.call(a)) {
      var i;
      for (i in a)
        if (i in el) el[i] = a[i];
        else if ("html" === i) el.innerHTML = a[i];
        else if ("text" === i) {
          var t = d.createTextNode(a[i]);
          el.appendChild(t);
        } else el.setAttribute(i, a[i]);
    }
    return el;
  },
  hasClass: function(a, b) {
    if (a)
      return a.classList ? a.classList.contains(b) : !!a.className && !!a.className.match(new RegExp("(\\s|^)" + b + "(\\s|$)"));
  },
  addClass: function(a, b) {
    if (!util.hasClass(a, b)) {
      if (a.classList) {
        a.classList.add(b);
      } else {
        a.className = a.className.trim() + " " + b;
      }
    }
  },
  removeClass: function(a, b) {
    if (util.hasClass(a, b)) {
      if (a.classList) {
        a.classList.remove(b);
      } else {
        a.className = a.className.replace(new RegExp("(^|\\s)" + b.split(" ").join("|") + "(\\s|$)", "gi"), " ");
      }
    }
  },
  closest: function(el, fn) {
    return el && el !== document.body && (fn(el) ? el : util.closest(el.parentNode, fn));
  },
  isInt: function(val) {
    return typeof val === 'number' && isFinite(val) && Math.floor(val) === val;
  },
  debounce: function(a, b, c) {
    var d;
    return function() {
      var e = this,
          f = arguments,
          g = function() {
            d = null;
            if (!c) a.apply(e, f);
          },
          h = c && !d;
      clearTimeout(d);
      d = setTimeout(g, b);
      if (h) {
        a.apply(e, f);
      }
    };
  },
  rect: function(el, abs) {
    var w = window;
    var r = el.getBoundingClientRect();
    var x = abs ? w.pageXOffset : 0;
    var y = abs ? w.pageYOffset : 0;

    return {
      bottom: r.bottom + y,
      height: r.height,
      left: r.left + x,
      right: r.right + x,
      top: r.top + y,
      width: r.width
    };
  },
  includes: function(a, b) {
    return a.indexOf(b) > -1;
  },
  truncate: function(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }
};


function isset(obj, prop) {
  return obj.hasOwnProperty(prop) && (obj[prop] === true || obj[prop].length);
}

/**
 * Append an item to the list
 * @param  {Object} item
 * @param  {Object} custom
 * @return {Void}
 */
function appendItem(item, parent, custom) {
  if (item.parentNode) {
    if (!item.parentNode.parentNode) {
      parent.appendChild(item.parentNode);
    }
  } else {
    parent.appendChild(item);
  }

  util.removeClass(item, "excluded");
  if (!custom) {
    item.innerHTML = item.textContent;
  }
}

/**
 * Render the item list
 * @return {Void}
 */
var render = function() {
  if (this.items.length) {
    var f = document.createDocumentFragment();

    if (this.config.pagination) {
      var pages = this.pages.slice(0, this.pageIndex);

      util.each(pages, function(i, items) {
        util.each(items, function(j, item) {
          appendItem(item, f, this.customOption);
        }, this);
      }, this);
    } else {
      util.each(this.items, function(i, item) {
        appendItem(item, f, this.customOption);
      }, this);
    }

    if (f.childElementCount) {
      util.removeClass(this.items[this.navIndex], "active");
      this.navIndex = f.querySelector(".selectr-option").idx;
      util.addClass(this.items[this.navIndex], "active");
    }

    this.tree.appendChild(f);
  }
};

/**
 * Dismiss / close the dropdown
 * @param  {obj} e
 * @return {void}
 */
var dismiss = function(e) {
  var target = e.target;
  if (!this.container.contains(target) && (this.opened || util.hasClass(this.container, "notice"))) {
    this.close();
  }
};

/**
 * Build a list item from the HTMLOptionElement
 * @param  {int} i      HTMLOptionElement index
 * @param  {HTMLOptionElement} option
 * @param  {bool} group  Has parent optgroup
 * @return {void}
 */
var createItem = function(option, data) {
  data = data || option;
  var content = this.customOption ? this.config.renderOption(data) : option.textContent;
  var opt = util.createElement("li", {
    class: "selectr-option",
    html: content,
    role: "treeitem",
    "aria-selected": false
  });

  opt.idx = option.idx;

  this.items.push(opt);

  if (option.defaultSelected) {
    this.defaultSelected.push(option.idx);
  }

  if (option.disabled) {
    opt.disabled = true;
    util.addClass(opt, "disabled");
  }

  return opt;
};

/**
 * Build the container
 * @return {Void}
 */
var build = function() {

  this.requiresPagination = this.config.pagination && this.config.pagination > 0;

  // Set width
  if (isset(this.config, "width")) {
    if (util.isInt(this.config.width)) {
      this.width = this.config.width + "px";
    } else {
      if (this.config.width === "auto") {
        this.width = "100%";
      } else if (util.includes(this.config.width, "%")) {
        this.width = this.config.width;
      }
    }
  }

  this.container = util.createElement("div", {
    class: "selectr-container"
  });

  // Custom className
  if (this.config.customClass) {
    util.addClass(this.container, this.config.customClass);
  }

  // Mobile device
  if (this.mobileDevice) {
    util.addClass(this.container, "selectr-mobile");
  } else {
    util.addClass(this.container, "selectr-desktop");
  }

  // Hide the HTMLSelectElement and prevent focus
  this.el.tabIndex = -1;

  // Native dropdown
  if (this.config.nativeDropdown || this.mobileDevice) {
    util.addClass(this.el, "selectr-visible");
  } else {
    util.addClass(this.el, "selectr-hidden");
  }

  this.selected = util.createElement("div", {
    class: "selectr-selected",
    disabled: this.disabled,
    tabIndex: 1, // enable tabIndex (#9)
    "aria-expanded": false
  });

  this.label = util.createElement(this.el.multiple ? "ul" : "span", {
    class: "selectr-label"
  });

  var dropdown = util.createElement("div", {
    class: "selectr-options-container"
  });

  this.tree = util.createElement("ul", {
    class: "selectr-options",
    role: "tree",
    "aria-hidden": true,
    "aria-expanded": false
  });

  this.notice = util.createElement("div", {
    class: "selectr-notice"
  });

  this.el.setAttribute("aria-hidden", true);

  if (this.disabled) {
    this.el.disabled = true;
  }

  if (this.el.multiple) {
    util.addClass(this.label, "selectr-tags");
    util.addClass(this.container, "multiple");

    // Collection of tags
    this.tags = [];

    // Collection of selected values
    this.selectedValues = this.getSelectedProperties('value');

    // Collection of selected indexes
    this.selectedIndexes = this.getSelectedProperties('idx');
  }

  this.selected.appendChild(this.label);

  if (this.config.clearable) {
    this.selectClear = util.createElement("button", {
      class: "selectr-clear",
      type: "button"
    });

    this.container.appendChild(this.selectClear);

    util.addClass(this.container, "clearable");
  }

  if (this.config.taggable) {
    var li = util.createElement('li', {
      class: 'input-tag'
    });
    this.input = util.createElement("input", {
      class: "selectr-tag-input",
      placeholder: this.config.tagPlaceholder,
      tagIndex: 0,
      autocomplete: "off",
      autocorrect: "off",
      autocapitalize: "off",
      spellcheck: "false",
      role: "textbox",
      type: "search"
    });

    li.appendChild(this.input);
    this.label.appendChild(li);
    util.addClass(this.container, "taggable");

    this.tagSeperators = [","];
    if (this.config.tagSeperators) {
      this.tagSeperators = this.tagSeperators.concat(this.config.tagSeperators);
    }
  }

  if (this.config.searchable) {
    this.input = util.createElement("input", {
      class: "selectr-input",
      tagIndex: -1,
      autocomplete: "off",
      autocorrect: "off",
      autocapitalize: "off",
      spellcheck: "false",
      role: "textbox",
      type: "search"
    });
    this.inputClear = util.createElement("button", {
      class: "selectr-input-clear",
      type: "button"
    });
    this.inputContainer = util.createElement("div", {
      class: "selectr-input-container"
    });

    this.inputContainer.appendChild(this.input);
    this.inputContainer.appendChild(this.inputClear);
    dropdown.appendChild(this.inputContainer);
  }

  dropdown.appendChild(this.notice);
  dropdown.appendChild(this.tree);

  // List of items for the dropdown
  this.items = [];

  // Establish options
  this.options = [];

  // Check for options in the element
  if (this.el.options.length) {
    this.options = [].slice.call(this.el.options);
  }

  // Element may have optgroups so
  // iterate element.children instead of element.options
  var group = false,
      j = 0;
  if (this.el.children.length) {
    util.each(this.el.children, function(i, element) {
      if (element.nodeName === "OPTGROUP") {

        group = util.createElement("ul", {
          class: "selectr-optgroup",
          role: "group",
          html: "<li class='selectr-optgroup--label'>" + element.label + "</li>"
        });

        util.each(element.children, function(x, el) {
          el.idx = j;
          group.appendChild(createItem.call(this, el, group));
          j++;
        }, this);
      } else {
        element.idx = j;
        createItem.call(this, element);
        j++;
      }
    }, this);
  }

  // Options defined by the data option
  if (this.config.data && Array.isArray(this.config.data)) {
    this.data = [];
    var optgroup = false,
        option;

    group = false;
    j = 0;

    util.each(this.config.data, function(i, opt) {
      // Check for group options
      if (isset(opt, "children")) {
        optgroup = util.createElement("optgroup", {
          label: opt.text
        });

        group = util.createElement("ul", {
          class: "selectr-optgroup",
          role: "group",
          html: "<li class='selectr-optgroup--label'>" + opt.text + "</li>"
        });

        util.each(opt.children, function(x, data) {
          option = new Option(data.text, data.value, false, data.hasOwnProperty("selected") && data.selected === true);

          option.disabled = isset(data, "disabled");

          this.options.push(option);

          optgroup.appendChild(option);

          option.idx = j;

          group.appendChild(createItem.call(this, option, data));

          this.data[j] = data;

          j++;
        }, this);
      } else {
        option = new Option(opt.text, opt.value, false, opt.hasOwnProperty("selected") && opt.selected === true);

        option.disabled = isset(opt, "disabled");

        this.options.push(option);

        option.idx = j;

        createItem.call(this, option, opt);

        this.data[j] = opt;

        j++;
      }
    }, this);
  }

  this.setSelected(true);

  var first;
  this.navIndex = 0;
  for (var i = 0; i < this.items.length; i++) {
    first = this.items[i];

    if (!util.hasClass(first, "disabled")) {

      util.addClass(first, "active");
      this.navIndex = i;
      break;
    }
  }

  // Check for pagination / infinite scroll
  if (this.requiresPagination) {
    this.pageIndex = 1;

    // Create the pages
    this.paginate();
  }

  this.container.appendChild(this.selected);
  this.container.appendChild(dropdown);

  this.placeEl = util.createElement("div", {
    class: "selectr-placeholder"
  });

  // Set the placeholder
  this.setPlaceholder();

  this.selected.appendChild(this.placeEl);

  // Disable if required
  if (this.disabled) {
    this.disable();
  }

  this.el.parentNode.insertBefore(this.container, this.el);
  this.container.appendChild(this.el);
};

/**
 * Navigate through the dropdown
 * @param  {obj} e
 * @return {void}
 */
var navigate = function(e) {
  e = e || window.event;

  // Filter out the keys we don"t want
  if (!this.items.length || !this.opened || !util.includes([13, 38, 40], e.which)) {
    this.navigating = false;
    return;
  }

  e.preventDefault();

  if (e.which === 13) {

    if (this.config.taggable && this.input.value.length > 0) {
      return false;
    }

    return this.change(this.navIndex);
  }

  var direction, prevEl = this.items[this.navIndex];

  switch (e.which) {
    case 38:
      direction = 0;
      if (this.navIndex > 0) {
        this.navIndex--;
      }
      break;
    case 40:
      direction = 1;
      if (this.navIndex < this.items.length - 1) {
        this.navIndex++;
      }
  }

  this.navigating = true;


  // Instead of wasting memory holding a copy of this.items
  // with disabled / excluded options omitted, skip them instead
  while (util.hasClass(this.items[this.navIndex], "disabled") || util.hasClass(this.items[this.navIndex], "excluded")) {
    if (direction) {
      this.navIndex++;
    } else {
      this.navIndex--;
    }

    if (this.searching) {
      if (this.navIndex > this.tree.lastElementChild.idx) {
        this.navIndex = this.tree.lastElementChild.idx;
        break;
      } else if (this.navIndex < this.tree.firstElementChild.idx) {
        this.navIndex = this.tree.firstElementChild.idx;
        break;
      }
    }
  }

  // Autoscroll the dropdown during navigation
  var r = util.rect(this.items[this.navIndex]);

  if (!direction) {
    if (this.navIndex === 0) {
      this.tree.scrollTop = 0;
    } else if (r.top - this.optsRect.top < 0) {
      this.tree.scrollTop = this.tree.scrollTop + (r.top - this.optsRect.top);
    }
  } else {
    if (this.navIndex === 0) {
      this.tree.scrollTop = 0;
    } else if ((r.top + r.height) > (this.optsRect.top + this.optsRect.height)) {
      this.tree.scrollTop = this.tree.scrollTop + ((r.top + r.height) - (this.optsRect.top + this.optsRect.height));
    }

    // Load another page if needed
    if (this.navIndex === this.tree.childElementCount - 1 && this.requiresPagination) {
      load.call(this);
    }
  }

  if (prevEl) {
    util.removeClass(prevEl, "active");
  }

  util.addClass(this.items[this.navIndex], "active");
};

/**
 * Add a tag
 * @param  {HTMLElement} item
 */
var addTag = function(item) {
  var that = this,
      r;

  var docFrag = document.createDocumentFragment();
  var option = this.options[item.idx];
  var data = this.data ? this.data[item.idx] : option;
  var content = this.customSelected ? this.config.renderSelection(data) : option.textContent;

  var tag = util.createElement("li", {
    class: "selectr-tag",
    html: content
  });
  var btn = util.createElement("button", {
    class: "selectr-tag-remove",
    type: "button"
  });

  tag.appendChild(btn);

  // Set property to check against later
  tag.idx = item.idx;
  tag.tag = option.value;

  this.tags.push(tag);

  if (this.config.sortSelected) {

    var tags = this.tags.slice();

    // Deal with values that contain numbers
    r = function(val, arr) {
      val.replace(/(\d+)|(\D+)/g, function(that, $1, $2) {
        arr.push([$1 || Infinity, $2 || ""]);
      });
    };

    tags.sort(function(a, b) {
      var x = [],
          y = [],
          ac, bc;
      if (that.config.sortSelected === true) {
        ac = a.tag;
        bc = b.tag;
      } else if (that.config.sortSelected === 'text') {
        ac = a.textContent;
        bc = b.textContent;
      }

      r(ac, x);
      r(bc, y);

      while (x.length && y.length) {
        var ax = x.shift();
        var by = y.shift();
        var nn = (ax[0] - by[0]) || ax[1].localeCompare(by[1]);
        if (nn) return nn;
      }

      return x.length - y.length;
    });

    util.each(tags, function(i, tg) {
      docFrag.appendChild(tg);
    });

    this.label.innerHTML = "";

  } else {
    docFrag.appendChild(tag);
  }

  if (this.config.taggable) {
    this.label.insertBefore(docFrag, this.input.parentNode);
  } else {
    this.label.appendChild(docFrag);
  }
};

/**
 * Remove a tag
 * @param  {HTMLElement} item
 * @return {void}
 */
var removeTag = function(item) {
  var tag = false;

  util.each(this.tags, function(i, t) {
    if (t.idx === item.idx) {
      tag = t;
    }
  }, this);

  if (tag) {
    this.label.removeChild(tag);
    this.tags.splice(this.tags.indexOf(tag), 1);
  }
};

/**
 * Load the next page of items
 * @return {void}
 */
var load = function() {
  var tree = this.tree;
  var scrollTop = tree.scrollTop;
  var scrollHeight = tree.scrollHeight;
  var offsetHeight = tree.offsetHeight;
  var atBottom = scrollTop >= (scrollHeight - offsetHeight);

  if ((atBottom && this.pageIndex < this.pages.length)) {
    var f = document.createDocumentFragment();

    util.each(this.pages[this.pageIndex], function(i, item) {
      appendItem(item, f, this.customOption);
    }, this);

    tree.appendChild(f);

    this.pageIndex++;

    this.emit("selectr.paginate", {
      items: this.items.length,
      total: this.data.length,
      page: this.pageIndex,
      pages: this.pages.length
    });
  }
};

/**
 * Clear a search
 * @return {void}
 */
var clearSearch = function() {
  if (this.config.searchable || this.config.taggable) {
    this.input.value = null;
    this.searching = false;
    if (this.config.searchable) {
      util.removeClass(this.inputContainer, "active");
    }

    if (util.hasClass(this.container, "notice")) {
      util.removeClass(this.container, "notice");
      util.addClass(this.container, "open");
      this.input.focus();
    }

    util.each(this.items, function(i, item) {
      // Items that didn't match need the class
      // removing to make them visible again
      util.removeClass(item, "excluded");
      // Remove the span element for underlining matched items
      if (!this.customOption) {
        item.innerHTML = item.textContent;
      }
    }, this);
  }
};

/**
 * Query matching for searches
 * @param  {string} query
 * @param  {HTMLOptionElement} option
 * @return {bool}
 */
var match = function(query, option) {
  var result = new RegExp(query, "i").exec(option.textContent);
  if (result) {
    return option.textContent.replace(result[0], "<span class='selectr-match'>" + result[0] + "</span>");
  }
  return false;
};

// Main Lib
var Selectr = function(el, config) {

  config = config || {};

  if (!el) {
    throw new Error("You must supply either a HTMLSelectElement or a CSS3 selector string.");
  }

  this.el = el;

  // CSS3 selector string
  if (typeof el === "string") {
    this.el = document.querySelector(el);
  }

  if (this.el === null) {
    throw new Error("The element you passed to Selectr can not be found.");
  }

  if (this.el.nodeName.toLowerCase() !== "select") {
    throw new Error("The element you passed to Selectr is not a HTMLSelectElement.");
  }

  this.render(config);
};

/**
 * Render the instance
 * @param  {object} config
 * @return {void}
 */
Selectr.prototype.render = function(config) {

  if (this.rendered) return;

  // Merge defaults with user set config
  this.config = util.extend(defaultConfig, config);

  // Store type
  this.originalType = this.el.type;

  // Store tabIndex
  this.originalIndex = this.el.tabIndex;

  // Store defaultSelected options for form reset
  this.defaultSelected = [];

  // Store the original option count
  this.originalOptionCount = this.el.options.length;

  if (this.config.multiple || this.config.taggable) {
    this.el.multiple = true;
  }

  // Disabled?
  this.disabled = isset(this.config, "disabled");

  this.opened = false;

  if (this.config.taggable) {
    this.config.searchable = false;
  }

  this.navigating = false;

  this.mobileDevice = false;
  if (/Android|webOS|iPhone|iPad|BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent)) {
    this.mobileDevice = true;
  }

  this.customOption = this.config.hasOwnProperty("renderOption") && typeof this.config.renderOption === "function";
  this.customSelected = this.config.hasOwnProperty("renderSelection") && typeof this.config.renderSelection === "function";

  // Enable event emitter
  Events.mixin(this);

  build.call(this);

  this.bindEvents();

  this.update();

  this.optsRect = util.rect(this.tree);

  this.rendered = true;

  // Fixes macOS Safari bug #28
  if (!this.el.multiple) {
    this.el.selectedIndex = this.selectedIndex;
  }

  var that = this;
  setTimeout(function() {
    that.emit("selectr.init");
  }, 20);
};

Selectr.prototype.getSelected = function () {
  var selected = this.el.querySelectorAll('option:checked');
  return selected;
};

Selectr.prototype.getSelectedProperties = function (prop) {
  var selected = this.getSelected();
  var values = [].slice.call(selected)
      .map(function(option) { return option[prop]; })
      .filter(function(i) { return i!==null && i!==undefined; });
  return values;
};

/**
 * Attach the required event listeners
 */
Selectr.prototype.bindEvents = function() {

  var that = this;

  this.events = {};

  this.events.dismiss = dismiss.bind(this);
  this.events.navigate = navigate.bind(this);
  this.events.reset = this.reset.bind(this);

  if (this.config.nativeDropdown || this.mobileDevice) {

    this.container.addEventListener("touchstart", function(e) {
      if (e.changedTouches[0].target === that.el) {
        that.toggle();
      }
    });

    if (this.config.nativeDropdown || this.mobileDevice) {
      this.container.addEventListener("click", function(e) {
        e.preventDefault();  // Jos: Added to prevent emitting clear directly after select
        e.stopPropagation(); // Jos: Added to prevent emitting clear directly after select

        if (e.target === that.el) {
          that.toggle();
        }
      });
    }

    var getChangedOptions = function(last, current) {
      var added=[], removed=last.slice(0);
      var idx;
      for (var i=0; i<current.length; i++) {
        idx = removed.indexOf(current[i]);
        if (idx > -1)
          removed.splice(idx, 1);
        else
          added.push(current[i]);
      }
      return [added, removed];
    };

    // Listen for the change on the native select
    // and update accordingly
    this.el.addEventListener("change", function(e) {
      if (that.el.multiple) {
        var indexes = that.getSelectedProperties('idx');
        var changes = getChangedOptions(that.selectedIndexes, indexes);

        util.each(changes[0], function(i, idx) {
          that.select(idx);
        }, that);

        util.each(changes[1], function(i, idx) {
          that.deselect(idx);
        }, that);

      } else {
        if (that.el.selectedIndex > -1) {
          that.select(that.el.selectedIndex);
        }
      }
    });

  }

  // Open the dropdown with Enter key if focused
  if (this.config.nativeDropdown) {
    this.container.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && that.selected === document.activeElement) {
        // Show the native
        that.toggle();

        // Focus on the native multiselect
        setTimeout(function() {
          that.el.focus();
        }, 200);
      }
    });
  }

  // Non-native dropdown
  this.selected.addEventListener("click", function(e) {

    if (!that.disabled) {
      that.toggle();
    }

    e.preventDefault();
    e.stopPropagation(); // Jos: Added to prevent emitting clear directly after select
  });

  // Remove tag
  this.label.addEventListener("click", function(e) {
    if (util.hasClass(e.target, "selectr-tag-remove")) {
      that.deselect(e.target.parentNode.idx);
    }
  });

  // Clear input
  if (this.selectClear) {
    this.selectClear.addEventListener("click", this.clear.bind(this));
  }

  // Prevent text selection
  this.tree.addEventListener("mousedown", function(e) {
    e.preventDefault();
  });

  // Select / deselect items
  this.tree.addEventListener("click", function(e) {
    e.preventDefault();  // Jos: Added to prevent emitting clear directly after select
    e.stopPropagation(); // Jos: Added to prevent emitting clear directly after select

    var item = util.closest(e.target, function(el) {
      return el && util.hasClass(el, "selectr-option");
    });

    if (item) {
      if (!util.hasClass(item, "disabled")) {
        if (util.hasClass(item, "selected")) {
          if (that.el.multiple || !that.el.multiple && that.config.allowDeselect) {
            that.deselect(item.idx);
          }
        } else {
          that.select(item.idx);
        }

        if (that.opened && !that.el.multiple) {
          that.close();
        }
      }
    }
  });

  // Mouseover list items
  this.tree.addEventListener("mouseover", function(e) {
    if (util.hasClass(e.target, "selectr-option")) {
      if (!util.hasClass(e.target, "disabled")) {
        util.removeClass(that.items[that.navIndex], "active");

        util.addClass(e.target, "active");

        that.navIndex = [].slice.call(that.items).indexOf(e.target);
      }
    }
  });

  // Searchable
  if (this.config.searchable) {
    // Show / hide the search input clear button

    this.input.addEventListener("focus", function(e) {
      that.searching = true;
    });

    this.input.addEventListener("blur", function(e) {
      that.searching = false;
    });

    this.input.addEventListener("keyup", function(e) {
      that.search();

      if (!that.config.taggable) {
        // Show / hide the search input clear button
        if (this.value.length) {
          util.addClass(this.parentNode, "active");
        } else {
          util.removeClass(this.parentNode, "active");
        }
      }
    });

    // Clear the search input
    this.inputClear.addEventListener("click", function(e) {
      that.input.value = null;
      clearSearch.call(that);

      if (!that.tree.childElementCount) {
        render.call(that);
      }
    });
  }

  if (this.config.taggable) {
    this.input.addEventListener("keyup", function(e) {

      that.search();

      if (that.config.taggable && this.value.length) {
        var val = this.value.trim();

        if (e.which === 13 || util.includes(that.tagSeperators, e.key)) {

          util.each(that.tagSeperators, function(i, k) {
            val = val.replace(k, '');
          });

          var option = that.add({
            value: val,
            text: val,
            selected: true
          }, true);

          if (!option) {
            this.value = '';
            that.setMessage('That tag is already in use.');
          } else {
            that.close();
            clearSearch.call(that);
          }
        }
      }
    });
  }

  this.update = util.debounce(function() {
    // Optionally close dropdown on scroll / resize (#11)
    if (that.opened && that.config.closeOnScroll) {
      that.close();
    }
    if (that.width) {
      that.container.style.width = that.width;
    }
    that.invert();
  }, 50);

  if (this.requiresPagination) {
    this.paginateItems = util.debounce(function() {
      load.call(this);
    }, 50);

    this.tree.addEventListener("scroll", this.paginateItems.bind(this));
  }

  // Dismiss when clicking outside the container
  document.addEventListener("click", this.events.dismiss);
  window.addEventListener("keydown", this.events.navigate);

  window.addEventListener("resize", this.update);
  window.addEventListener("scroll", this.update);

  // Listen for form.reset() (@ambrooks, #13)
  if (this.el.form) {
    this.el.form.addEventListener("reset", this.events.reset);
  }
};

/**
 * Check for selected options
 * @param {bool} reset
 */
Selectr.prototype.setSelected = function(reset) {

  // Select first option as with a native select-one element - #21, #24
  if (!this.config.data && !this.el.multiple && this.el.options.length) {
    // Browser has selected the first option by default
    if (this.el.selectedIndex === 0) {
      if (!this.el.options[0].defaultSelected && !this.config.defaultSelected) {
        this.el.selectedIndex = -1;
      }
    }

    this.selectedIndex = this.el.selectedIndex;

    if (this.selectedIndex > -1) {
      this.select(this.selectedIndex);
    }
  }

  // If we're changing a select-one to select-multiple via the config
  // and there are no selected options, the first option will be selected by the browser
  // Let's prevent that here.
  if (this.config.multiple && this.originalType === "select-one" && !this.config.data) {
    if (this.el.options[0].selected && !this.el.options[0].defaultSelected) {
      this.el.options[0].selected = false;
    }
  }

  util.each(this.options, function(i, option) {
    if (option.selected && option.defaultSelected) {
      this.select(option.idx);
    }
  }, this);

  if (this.config.selectedValue) {
    this.setValue(this.config.selectedValue);
  }

  if (this.config.data) {


    if (!this.el.multiple && this.config.defaultSelected && this.el.selectedIndex < 0) {
      this.select(0);
    }

    var j = 0;
    util.each(this.config.data, function(i, opt) {
      // Check for group options
      if (isset(opt, "children")) {
        util.each(opt.children, function(x, item) {
          if (item.hasOwnProperty("selected") && item.selected === true) {
            this.select(j);
          }
          j++;
        }, this);
      } else {
        if (opt.hasOwnProperty("selected") && opt.selected === true) {
          this.select(j);
        }
        j++;
      }
    }, this);
  }
};

/**
 * Destroy the instance
 * @return {void}
 */
Selectr.prototype.destroy = function() {

  if (!this.rendered) return;

  this.emit("selectr.destroy");

  // Revert to select-single if programtically set to multiple
  if (this.originalType === 'select-one') {
    this.el.multiple = false;
  }

  if (this.config.data) {
    this.el.innerHTML = "";
  }

  // Remove the className from select element
  util.removeClass(this.el, 'selectr-hidden');

  // Remove reset listener from parent form
  if (this.el.form) {
    util.off(this.el.form, "reset", this.events.reset);
  }

  // Remove event listeners attached to doc and win
  util.off(document, "click", this.events.dismiss);
  util.off(document, "keydown", this.events.navigate);
  util.off(window, "resize", this.update);
  util.off(window, "scroll", this.update);

  // Replace the container with the original select element
  this.container.parentNode.replaceChild(this.el, this.container);

  this.rendered = false;
};

/**
 * Change an options state
 * @param  {Number} index
 * @return {void}
 */
Selectr.prototype.change = function(index) {
  var item = this.items[index],
      option = this.options[index];

  if (option.disabled) {
    return;
  }

  if (option.selected && util.hasClass(item, "selected")) {
    this.deselect(index);
  } else {
    this.select(index);
  }

  if (this.opened && !this.el.multiple) {
    this.close();
  }
};

/**
 * Select an option
 * @param  {Number} index
 * @return {void}
 */
Selectr.prototype.select = function(index) {

  var item = this.items[index],
      options = [].slice.call(this.el.options),
      option = this.options[index];

  if (this.el.multiple) {
    if (util.includes(this.selectedIndexes, index)) {
      return false;
    }

    if (this.config.maxSelections && this.tags.length === this.config.maxSelections) {
      this.setMessage("A maximum of " + this.config.maxSelections + " items can be selected.", true);
      return false;
    }

    this.selectedValues.push(option.value);
    this.selectedIndexes.push(index);

    addTag.call(this, item);
  } else {
    var data = this.data ? this.data[index] : option;
    this.label.innerHTML = this.customSelected ? this.config.renderSelection(data) : option.textContent;

    this.selectedValue = option.value;
    this.selectedIndex = index;

    util.each(this.options, function(i, o) {
      var opt = this.items[i];

      if (i !== index) {
        if (opt) {
          util.removeClass(opt, "selected");
        }
        o.selected = false;
        o.removeAttribute("selected");
      }
    }, this);
  }

  if (!util.includes(options, option)) {
    this.el.add(option);
  }

  item.setAttribute("aria-selected", true);

  util.addClass(item, "selected");
  util.addClass(this.container, "has-selected");

  option.selected = true;
  option.setAttribute("selected", "");

  this.emit("selectr.change", option);

  this.emit("selectr.select", option);
};

/**
 * Deselect an option
 * @param  {Number} index
 * @return {void}
 */
Selectr.prototype.deselect = function(index, force) {
  var item = this.items[index],
      option = this.options[index];

  if (this.el.multiple) {
    var selIndex = this.selectedIndexes.indexOf(index);
    this.selectedIndexes.splice(selIndex, 1);

    var valIndex = this.selectedValues.indexOf(option.value);
    this.selectedValues.splice(valIndex, 1);

    removeTag.call(this, item);

    if (!this.tags.length) {
      util.removeClass(this.container, "has-selected");
    }
  } else {

    if (!force && !this.config.clearable && !this.config.allowDeselect) {
      return false;
    }

    this.label.innerHTML = "";
    this.selectedValue = null;

    this.el.selectedIndex = this.selectedIndex = -1;

    util.removeClass(this.container, "has-selected");
  }


  this.items[index].setAttribute("aria-selected", false);

  util.removeClass(this.items[index], "selected");

  option.selected = false;

  option.removeAttribute("selected");

  this.emit("selectr.change", null);

  this.emit("selectr.deselect", option);
};

/**
 * Programmatically set selected values
 * @param {String|Array} value - A string or an array of strings
 */
Selectr.prototype.setValue = function(value) {
  var isArray = Array.isArray(value);

  if (!isArray) {
    value = value.toString().trim();
  }

  // Can't pass array to select-one
  if (!this.el.multiple && isArray) {
    return false;
  }

  util.each(this.options, function(i, option) {
    if (isArray && util.includes(value.toString(), option.value) || option.value === value) {
      this.change(option.idx);
    }
  }, this);
};

/**
 * Set the selected value(s)
 * @param  {bool} toObject Return only the raw values or an object
 * @param  {bool} toJson   Return the object as a JSON string
 * @return {mixed}         Array or String
 */
Selectr.prototype.getValue = function(toObject, toJson) {
  var value;

  if (this.el.multiple) {
    if (toObject) {
      if (this.selectedIndexes.length) {
        value = {};
        value.values = [];
        util.each(this.selectedIndexes, function(i, index) {
          var option = this.options[index];
          value.values[i] = {
            value: option.value,
            text: option.textContent
          };
        }, this);
      }
    } else {
      value = this.selectedValues.slice();
    }
  } else {
    if (toObject) {
      var option = this.options[this.selectedIndex];
      value = {
        value: option.value,
        text: option.textContent
      };
    } else {
      value = this.selectedValue;
    }
  }

  if (toObject && toJson) {
    value = JSON.stringify(value);
  }

  return value;
};

/**
 * Add a new option or options
 * @param {object} data
 */
Selectr.prototype.add = function(data, checkDuplicate) {
  if (data) {

    this.data = this.data || [];
    this.items = this.items || [];
    this.options = this.options || [];

    if (Array.isArray(data)) {
      // We have an array on items
      util.each(data, function(i, obj) {
        this.add(obj, checkDuplicate);
      }, this);
    }
    // User passed a single object to the method
    // or Selectr passed an object from an array
    else if ("[object Object]" === Object.prototype.toString.call(data)) {

      if (checkDuplicate) {
        var dupe = false;

        util.each(this.options, function(i, option) {
          if (option.value.toLowerCase() === data.value.toLowerCase()) {
            dupe = true;
          }
        });

        if (dupe) {
          return false;
        }
      }

      var option = util.createElement('option', data);

      this.data.push(data);

      // Add the new option to the list
      this.options.push(option);

      // Add the index for later use
      option.idx = this.options.length > 0 ? this.options.length - 1 : 0;

      // Create a new item
      createItem.call(this, option);

      // Select the item if required
      if (data.selected) {
        this.select(option.idx);
      }

      return option;
    }

    // We may have had an empty select so update
    // the placeholder to reflect the changes.
    this.setPlaceholder();

    // Recount the pages
    if (this.config.pagination) {
      this.paginate();
    }

    return true;
  }
};

/**
 * Remove an option or options
 * @param  {Mixed} o Array, integer (index) or string (value)
 * @return {Void}
 */
Selectr.prototype.remove = function(o) {
  var options = [];
  if (Array.isArray(o)) {
    util.each(o, function(i, opt) {
      if (util.isInt(opt)) {
        options.push(this.getOptionByIndex(opt));
      } else if (typeof o === "string") {
        options.push(this.getOptionByValue(opt));
      }
    }, this);

  } else if (util.isInt(o)) {
    options.push(this.getOptionByIndex(o));
  } else if (typeof o === "string") {
    options.push(this.getOptionByValue(o));
  }

  if (options.length) {
    var index;
    util.each(options, function(i, option) {
      index = option.idx;

      // Remove the HTMLOptionElement
      this.el.remove(option);

      // Remove the reference from the option array
      this.options.splice(index, 1);

      // If the item has a parentNode (group element) it needs to be removed
      // otherwise the render function will still append it to the dropdown
      var parentNode = this.items[index].parentNode;

      if (parentNode) {
        parentNode.removeChild(this.items[index]);
      }

      // Remove reference from the items array
      this.items.splice(index, 1);

      // Reset the indexes
      util.each(this.options, function(i, opt) {
        opt.idx = i;
        this.items[i].idx = i;
      }, this);
    }, this);

    // We may have had an empty select now so update
    // the placeholder to reflect the changes.
    this.setPlaceholder();

    // Recount the pages
    if (this.config.pagination) {
      this.paginate();
    }
  }
};

/**
 * Remove all options
 */
Selectr.prototype.removeAll = function() {

  // Clear any selected options
  this.clear(true);

  // Remove the HTMLOptionElements
  util.each(this.el.options, function(i, option) {
    this.el.remove(option);
  }, this);

  // Empty the dropdown
  util.truncate(this.tree);

  // Reset variables
  this.items = [];
  this.options = [];
  this.data = [];

  this.navIndex = 0;

  if (this.requiresPagination) {
    this.requiresPagination = false;

    this.pageIndex = 1;
    this.pages = [];
  }

  // Update the placeholder
  this.setPlaceholder();
};

/**
 * Perform a search
 * @param  {string} query The query string
 */
Selectr.prototype.search = function(string) {

  if (this.navigating) return;

  string = string || this.input.value;

  var f = document.createDocumentFragment();

  // Remove message
  this.removeMessage();

  // Clear the dropdown
  util.truncate(this.tree);

  if (string.length > 1) {
    // Check the options for the matching string
    util.each(this.options, function(i, option) {
      var item = this.items[option.idx];
      var includes = util.includes(option.textContent.toLowerCase(), string.toLowerCase());

      if (includes && !option.disabled) {

        appendItem(item, f, this.customOption);

        util.removeClass(item, "excluded");

        // Underline the matching results
        if (!this.customOption) {
          item.innerHTML = match(string, option);
        }
      } else {
        util.addClass(item, "excluded");
      }
    }, this);


    if (!f.childElementCount) {
      if (!this.config.taggable) {
        this.setMessage("no results.");
      }
    } else {
      // Highlight top result (@binary-koan #26)
      var prevEl = this.items[this.navIndex];
      var firstEl = f.firstElementChild;

      util.removeClass(prevEl, "active");

      this.navIndex = firstEl.idx;

      util.addClass(firstEl, "active");
    }

  } else {
    render.call(this);
  }

  this.tree.appendChild(f);
};

/**
 * Toggle the dropdown
 * @return {void}
 */
Selectr.prototype.toggle = function() {
  if (!this.disabled) {
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
  }
};

/**
 * Open the dropdown
 * @return {void}
 */
Selectr.prototype.open = function() {

  var that = this;

  if (!this.options.length) {
    return false;
  }

  if (!this.opened) {
    this.emit("selectr.open");
  }

  this.opened = true;

  if (this.mobileDevice || this.config.nativeDropdown) {
    util.addClass(this.container, "native-open");

    if (this.config.data) {
      // Dump the options into the select
      // otherwise the native dropdown will be empty
      util.each(this.options, function(i, option) {
        this.el.add(option);
      }, this);
    }

    return;
  }

  util.addClass(this.container, "open");

  render.call(this);

  this.invert();

  this.tree.scrollTop = 0;

  util.removeClass(this.container, "notice");

  this.selected.setAttribute("aria-expanded", true);

  this.tree.setAttribute("aria-hidden", false);
  this.tree.setAttribute("aria-expanded", true);

  if (this.config.searchable && !this.config.taggable) {
    setTimeout(function() {
      that.input.focus();
      // Allow tab focus
      that.input.tabIndex = 0;
    }, 10);
  }
};

/**
 * Close the dropdown
 * @return {void}
 */
Selectr.prototype.close = function() {

  if (this.opened) {
    this.emit("selectr.close");
  }

  this.opened = false;

  if (this.mobileDevice || this.config.nativeDropdown) {
    util.removeClass(this.container, "native-open");
    return;
  }

  var notice = util.hasClass(this.container, "notice");

  if (this.config.searchable && !notice) {
    this.input.blur();
    // Disable tab focus
    this.input.tabIndex = -1;
    this.searching = false;
  }

  if (notice) {
    util.removeClass(this.container, "notice");
    this.notice.textContent = "";
  }

  util.removeClass(this.container, "open");
  util.removeClass(this.container, "native-open");

  this.selected.setAttribute("aria-expanded", false);

  this.tree.setAttribute("aria-hidden", true);
  this.tree.setAttribute("aria-expanded", false);

  util.truncate(this.tree);
  clearSearch.call(this);
};


/**
 * Enable the element
 * @return {void}
 */
Selectr.prototype.enable = function() {
  this.disabled = false;
  this.el.disabled = false;

  this.selected.tabIndex = this.originalIndex;

  if (this.el.multiple) {
    util.each(this.tags, function(i, t) {
      t.lastElementChild.tabIndex = 0;
    });
  }

  util.removeClass(this.container, "selectr-disabled");
};

/**
 * Disable the element
 * @param  {boolean} container Disable the container only (allow value submit with form)
 * @return {void}
 */
Selectr.prototype.disable = function(container) {
  if (!container) {
    this.el.disabled = true;
  }

  this.selected.tabIndex = -1;

  if (this.el.multiple) {
    util.each(this.tags, function(i, t) {
      t.lastElementChild.tabIndex = -1;
    });
  }

  this.disabled = true;
  util.addClass(this.container, "selectr-disabled");
};


/**
 * Reset to initial state
 * @return {void}
 */
Selectr.prototype.reset = function() {
  if (!this.disabled) {
    this.clear();

    this.setSelected(true);

    util.each(this.defaultSelected, function(i, idx) {
      this.select(idx);
    }, this);

    this.emit("selectr.reset");
  }
};

/**
 * Clear all selections
 * @return {void}
 */
Selectr.prototype.clear = function(force) {

  if (this.el.multiple) {
    // Loop over the selectedIndexes so we don't have to loop over all the options
    // which can be costly if there are a lot of them

    if (this.selectedIndexes.length) {
      // Copy the array or we'll get an error
      var indexes = this.selectedIndexes.slice();

      util.each(indexes, function(i, idx) {
        this.deselect(idx);
      }, this);
    }
  } else {
    if (this.selectedIndex > -1) {
      this.deselect(this.selectedIndex, force);
    }
  }

  this.emit("selectr.clear");
};

/**
 * Return serialised data
 * @param  {boolean} toJson
 * @return {mixed} Returns either an object or JSON string
 */
Selectr.prototype.serialise = function(toJson) {
  var data = [];
  util.each(this.options, function(i, option) {
    var obj = {
      value: option.value,
      text: option.textContent
    };

    if (option.selected) {
      obj.selected = true;
    }
    if (option.disabled) {
      obj.disabled = true;
    }
    data[i] = obj;
  });

  return toJson ? JSON.stringify(data) : data;
};

/**
 * Localised version of serialise() method
 */
Selectr.prototype.serialize = function(toJson) {
  return this.serialise(toJson);
};

/**
 * Sets the placeholder
 * @param {String} placeholder
 */
Selectr.prototype.setPlaceholder = function(placeholder) {
  // Set the placeholder
  placeholder = placeholder || this.config.placeholder || this.el.getAttribute("placeholder");

  if (!this.options.length) {
    placeholder = "No options available";
  }

  this.placeEl.innerHTML = placeholder;
};

/**
 * Paginate the option list
 * @return {Array}
 */
Selectr.prototype.paginate = function() {
  if (this.items.length) {
    var that = this;

    this.pages = this.items.map(function(v, i) {
      return i % that.config.pagination === 0 ? that.items.slice(i, i + that.config.pagination) : null;
    }).filter(function(pages) {
      return pages;
    });

    return this.pages;
  }
};

/**
 * Display a message
 * @param  {String} message The message
 */
Selectr.prototype.setMessage = function(message, close) {
  if (close) {
    this.close();
  }
  util.addClass(this.container, "notice");
  this.notice.textContent = message;
};

/**
 * Dismiss the current message
 */
Selectr.prototype.removeMessage = function() {
  util.removeClass(this.container, "notice");
  this.notice.innerHTML = "";
};

/**
 * Keep the dropdown within the window
 * @return {void}
 */
Selectr.prototype.invert = function() {
  var rt = util.rect(this.selected),
      oh = this.tree.parentNode.offsetHeight,
      wh = window.innerHeight,
      doInvert = rt.top + rt.height + oh > wh;

  if (doInvert) {
    util.addClass(this.container, "inverted");
    this.isInverted = true;
  } else {
    util.removeClass(this.container, "inverted");
    this.isInverted = false;
  }

  this.optsRect = util.rect(this.tree);
};

/**
 * Get an option via it's index
 * @param  {Integer} index The index of the HTMLOptionElement required
 * @return {HTMLOptionElement}
 */
Selectr.prototype.getOptionByIndex = function(index) {
  return this.options[index];
};

/**
 * Get an option via it's value
 * @param  {String} value The value of the HTMLOptionElement required
 * @return {HTMLOptionElement}
 */
Selectr.prototype.getOptionByValue = function(value) {
  var option = false;

  for (var i = 0, l = this.options.length; i < l; i++) {
    if (this.options[i].value.trim() === value.toString().trim()) {
      option = this.options[i];
      break;
    }
  }

  return option;
};

module.exports = Selectr;
