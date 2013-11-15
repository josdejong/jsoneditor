/**
 * ajax
 * Utility to perform ajax get and post requests. Supported browsers:
 * Chrome, Firefox, Opera, Safari, Internet Explorer 7+.
 */
var ajax = (function () {
  function fetch (method, url, body, headers, callback) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          callback(xhr.responseText, xhr.status);
        }
      };
      xhr.open(method, url, true);
      if (headers) {
        for (var name in headers) {
          if (headers.hasOwnProperty(name)) {
            xhr.setRequestHeader(name, headers[name]);
          }
        }
      }
      xhr.send(body);
    }
    catch (err) {
      callback(err, 0);
    }
  }

  function get (url, headers, callback) {
    fetch('GET', url, null, headers, callback);
  }

  function post (url, body, headers, callback) {
    fetch('POST', url, body, headers, callback)
  }

  return {
    'fetch': fetch,
    'get': get,
    'post': post
  }
})();
