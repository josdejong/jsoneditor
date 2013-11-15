
/**
 * @prototype Hash
 * This prototype contains methods to manipulate the hash of the web page
 */
function Hash() {}

/**
 * get an object value with all parameters in the hash
 * @return {Object} query    object containing key/values
 */
Hash.prototype.getQuery = function () {
  var hash = window.location.hash.substring(1); // skip the # character
  var params = hash.split('&');
  var query = {};
  for (var i = 0, iMax = params.length; i < iMax; i++) {
    var keyvalue = params[i].split('=');
    if (keyvalue.length == 2) {
      var key = decodeURIComponent(keyvalue[0]);
      var value = decodeURIComponent(keyvalue[1]);
      query[key] = value;
    }
  }
  return query;
};

/**
 * Register a callback function which will be called when the hash of the web
 * page changes.
 * @param {String} key
 * @param {function} callback   Will be called with the new value as parameter
 */
Hash.prototype.onChange = function (key, callback) {
  this.prevHash = '';
  var me = this;
  if (!me.callbacks) {
    me.callbacks = [];
  }
  me.callbacks.push({
    'key': key,
    'value': undefined,
    'callback': callback
  });

  function checkForChanges() {
    for (var i = 0; i < me.callbacks.length; i++) {
      var obj = me.callbacks[i];
      var value = me.getValue(obj.key);
      var changed = (value !== obj.value);
      obj.value = value;
      if (changed) {
        obj.callback(value);
      }
    }
  }

  // source: http://stackoverflow.com/questions/2161906/handle-url-anchor-change-event-in-js
  if ('onhashchange' in window) {
    window.onhashchange = function () {
      checkForChanges();
    }
  }
  else {
    // onhashchange event not supported
    me.prevHash = window.location.hash;
    window.setInterval(function () {
      var hash = window.location.hash;
      if (hash != me.prevHash) {
        me.prevHash = hash;
        checkForChanges();
      }
    }, 500);
  }
};


/**
 * Set hash parameters
 * @param {Object} query    object with strings
 */
Hash.prototype.setQuery = function (query) {
  var hash = '';

  for (var key in query) {
    if (query.hasOwnProperty(key)) {
      var value = query[key];
      if (value != undefined) {
        if (hash.length) {
          hash += '&';
        }
        hash += encodeURIComponent(key);
        hash += '=';
        hash += encodeURIComponent(query[key]);
      }
    }
  }

  window.location.hash = (hash.length ? ('#' + hash) : '');
};


/**
 * Retrieve a parameter value from the hash
 * @param {String} key
 * @return {String | undefined} value   undefined when the value is not found
 */
Hash.prototype.getValue = function (key) {
  var query = this.getQuery();
  return query[key];
};

/**
 * Set an hash parameter
 * @param {String} key
 * @param {String} value
 */
Hash.prototype.setValue = function (key, value) {
  var query = this.getQuery();
  query[key] = value;
  this.setQuery(query);
};

/**
 * Remove an hash parameter
 * @param {String} key
 */
Hash.prototype.removeValue = function (key) {
  var query = this.getQuery();
  if (query[key]) {
    delete query[key];
    this.setQuery(query);
  }
};
