/**
 * @prototype QueryParams
 * This prototype contains methods to manipulate the query parameters of the
 * web pages url
 */
function QueryParams ()  {}

/**
 * get an object value with all parameters in the query params
 * @return {Object} query    object containing key/values
 */
QueryParams.prototype.getQuery = function () {
  var search = window.location.search.substring(1); // skip the ? character
  var params = search.split('&');
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
 * Set query parameters parameters
 * @param {Object} query    object with strings
 */
QueryParams.prototype.setQuery = function (query) {
  var search = '';

  for (var key in query) {
    if (query.hasOwnProperty(key)) {
      var value = query[key];
      if (value != undefined) {
        if (search.length) {
          search += '&';
        }
        search += encodeURIComponent(key);
        search += '=';
        search += encodeURIComponent(query[key]);
      }
    }
  }

  window.location.search = (search.length ? ('#' + search) : '');
};


/**
 * Retrieve a parameter value from the query params
 * @param {String} key
 * @return {String} value   undefined when the value is not found
 */
QueryParams.prototype.getValue = function (key) {
  var query = this.getQuery();
  return query[key];
};

/**
 * Set an query parameter
 * @param {String} key
 * @param {String} value
 */
QueryParams.prototype.setValue = function (key, value) {
  var query = this.getQuery();
  query[key] = value;
  this.setQuery(query);
};
