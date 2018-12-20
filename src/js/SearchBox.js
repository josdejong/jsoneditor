'use strict';

/**
 * @constructor SearchBox
 * Create a search box in given HTML container
 * @param {JSONEditor} editor    The JSON Editor to attach to
 * @param {Element} container               HTML container element of where to
 *                                          create the search box
 */
function SearchBox (editor, container) {
  var searchBox = this;

  this.editor = editor;
  this.timeout = undefined;
  this.delay = 200; // ms
  this.lastText = undefined;

  this.dom = {};
  this.dom.container = container;

  var table = document.createElement('table');
  this.dom.table = table;
  table.className = 'jsoneditor-search';
  container.appendChild(table);
  var tbody = document.createElement('tbody');
  this.dom.tbody = tbody;
  table.appendChild(tbody);
  var tr = document.createElement('tr');
  tbody.appendChild(tr);

  var td = document.createElement('td');
  tr.appendChild(td);
  var results = document.createElement('div');
  this.dom.results = results;
  results.className = 'jsoneditor-results';
  td.appendChild(results);

  td = document.createElement('td');
  tr.appendChild(td);
  var divInput = document.createElement('div');
  this.dom.input = divInput;
  divInput.className = 'jsoneditor-frame';
  divInput.title = 'Search fields and values';
  td.appendChild(divInput);

  // table to contain the text input and search button
  var tableInput = document.createElement('table');
  divInput.appendChild(tableInput);
  var tbodySearch = document.createElement('tbody');
  tableInput.appendChild(tbodySearch);
  tr = document.createElement('tr');
  tbodySearch.appendChild(tr);

  var refreshSearch = document.createElement('button');
  refreshSearch.type = 'button';
  refreshSearch.className = 'jsoneditor-refresh';
  td = document.createElement('td');
  td.appendChild(refreshSearch);
  tr.appendChild(td);

  var search = document.createElement('input');
  // search.type = 'button';
  this.dom.search = search;
  search.oninput = function (event) {
    searchBox._onDelayedSearch(event);
  };
  search.onchange = function (event) { // For IE 9
    searchBox._onSearch();
  };
  search.onkeydown = function (event) {
    searchBox._onKeyDown(event);
  };
  search.onkeyup = function (event) {
    searchBox._onKeyUp(event);
  };
  refreshSearch.onclick = function (event) {
    search.select();
  };

  // TODO: ESC in FF restores the last input, is a FF bug, https://bugzilla.mozilla.org/show_bug.cgi?id=598819
  td = document.createElement('td');
  td.appendChild(search);
  tr.appendChild(td);

  var searchNext = document.createElement('button');
  searchNext.type = 'button';
  searchNext.title = 'Next result (Enter)';
  searchNext.className = 'jsoneditor-next';
  searchNext.onclick = function () {
    searchBox.next();
  };
  td = document.createElement('td');
  td.appendChild(searchNext);
  tr.appendChild(td);

  var searchPrevious = document.createElement('button');
  searchPrevious.type = 'button';
  searchPrevious.title = 'Previous result (Shift+Enter)';
  searchPrevious.className = 'jsoneditor-previous';
  searchPrevious.onclick = function () {
    searchBox.previous();
  };
  td = document.createElement('td');
  td.appendChild(searchPrevious);
  tr.appendChild(td);
}

/**
 * Go to the next search result
 * @param {boolean} [focus]   If true, focus will be set to the next result
 *                            focus is false by default.
 */
SearchBox.prototype.next = function(focus) {
  if (this.results != undefined) {
    var index = (this.resultIndex != undefined) ? this.resultIndex + 1 : 0;
    if (index > this.results.length - 1) {
      index = 0;
    }
    this._setActiveResult(index, focus);
  }
};

/**
 * Go to the prevous search result
 * @param {boolean} [focus]   If true, focus will be set to the next result
 *                            focus is false by default.
 */
SearchBox.prototype.previous = function(focus) {
  if (this.results != undefined) {
    var max = this.results.length - 1;
    var index = (this.resultIndex != undefined) ? this.resultIndex - 1 : max;
    if (index < 0) {
      index = max;
    }
    this._setActiveResult(index, focus);
  }
};

/**
 * Set new value for the current active result
 * @param {Number} index
 * @param {boolean} [focus]   If true, focus will be set to the next result.
 *                            focus is false by default.
 * @private
 */
SearchBox.prototype._setActiveResult = function(index, focus) {
  // de-activate current active result
  if (this.activeResult) {
    var prevNode = this.activeResult.node;
    var prevElem = this.activeResult.elem;
    if (prevElem == 'field') {
      delete prevNode.searchFieldActive;
    }
    else {
      delete prevNode.searchValueActive;
    }
    prevNode.updateDom();
  }

  if (!this.results || !this.results[index]) {
    // out of range, set to undefined
    this.resultIndex = undefined;
    this.activeResult = undefined;
    return;
  }

  this.resultIndex = index;

  // set new node active
  var node = this.results[this.resultIndex].node;
  var elem = this.results[this.resultIndex].elem;
  if (elem == 'field') {
    node.searchFieldActive = true;
  }
  else {
    node.searchValueActive = true;
  }
  this.activeResult = this.results[this.resultIndex];
  node.updateDom();

  // TODO: not so nice that the focus is only set after the animation is finished
  node.scrollTo(function () {
    if (focus) {
      node.focus(elem);
    }
  });
};

/**
 * Cancel any running onDelayedSearch.
 * @private
 */
SearchBox.prototype._clearDelay = function() {
  if (this.timeout != undefined) {
    clearTimeout(this.timeout);
    delete this.timeout;
  }
};

/**
 * Start a timer to execute a search after a short delay.
 * Used for reducing the number of searches while typing.
 * @param {Event} event
 * @private
 */
SearchBox.prototype._onDelayedSearch = function (event) {
  // execute the search after a short delay (reduces the number of
  // search actions while typing in the search text box)
  this._clearDelay();
  var searchBox = this;
  this.timeout = setTimeout(function (event) {
    searchBox._onSearch();
  },
  this.delay);
};

/**
 * Handle onSearch event
 * @param {boolean} [forceSearch]  If true, search will be executed again even
 *                                 when the search text is not changed.
 *                                 Default is false.
 * @private
 */
SearchBox.prototype._onSearch = function (forceSearch) {
  this._clearDelay();

  var value = this.dom.search.value;
  var text = (value.length > 0) ? value : undefined;
  if (text !== this.lastText || forceSearch) {
    // only search again when changed
    this.lastText = text;
    this.results = this.editor.search(text);
    var MAX_SEARCH_RESULTS = this.results[0]
        ? this.results[0].node.MAX_SEARCH_RESULTS
        : Infinity;

    // try to maintain the current active result if this is still part of the new search results
    var activeResultIndex = 0;
    if (this.activeResult) {
      for (var i = 0; i < this.results.length; i++) {
        if (this.results[i].node === this.activeResult.node) {
          activeResultIndex = i;
          break;
        }
      }
    }

    this._setActiveResult(activeResultIndex, false);

    // display search results
    if (text !== undefined) {
      var resultCount = this.results.length;
      if (resultCount === 0) {
        this.dom.results.innerHTML = 'no&nbsp;results';
      }
      else if (resultCount === 1) {
        this.dom.results.innerHTML = '1&nbsp;result';
      }
      else if (resultCount > MAX_SEARCH_RESULTS) {
        this.dom.results.innerHTML = MAX_SEARCH_RESULTS + '+&nbsp;results';
      }
      else {
        this.dom.results.innerHTML = resultCount + '&nbsp;results';
      }
    }
    else {
      this.dom.results.innerHTML = '';
    }
  }
};

/**
 * Handle onKeyDown event in the input box
 * @param {Event} event
 * @private
 */
SearchBox.prototype._onKeyDown = function (event) {
  var keynum = event.which;
  if (keynum == 27) { // ESC
    this.dom.search.value = '';  // clear search
    this._onSearch();
    event.preventDefault();
    event.stopPropagation();
  }
  else if (keynum == 13) { // Enter
    if (event.ctrlKey) {
      // force to search again
      this._onSearch(true);
    }
    else if (event.shiftKey) {
      // move to the previous search result
      this.previous();
    }
    else {
      // move to the next search result
      this.next();
    }
    event.preventDefault();
    event.stopPropagation();
  }
};

/**
 * Handle onKeyUp event in the input box
 * @param {Event} event
 * @private
 */
SearchBox.prototype._onKeyUp = function (event) {
  var keynum = event.keyCode;
  if (keynum != 27 && keynum != 13) { // !show and !Enter
    this._onDelayedSearch(event);   // For IE 9
  }
};

/**
 * Clear the search results
 */
SearchBox.prototype.clear = function () {
  this.dom.search.value = '';
  this._onSearch();
};

/**
 * Refresh searchResults if there is a search value
 */
SearchBox.prototype.forceSearch = function () {
  this._onSearch(true);
};

/**
 * Test whether the search box value is empty
 * @returns {boolean} Returns true when empty.
 */
SearchBox.prototype.isEmpty = function () {
  return this.dom.search.value === '';
};

/**
 * Destroy the search box
 */
SearchBox.prototype.destroy = function () {
  this.editor = null;
  this.dom.container.removeChild(this.dom.table);
  this.dom = null;

  this.results = null;
  this.activeResult = null;

  this._clearDelay();

};

module.exports = SearchBox;
