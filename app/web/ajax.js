/**
 * ajax
 * Utility to perform ajax get and post requests. Supported browsers: 
 * Chrome, Firefox, Opera, Safari, Internet Explorer 7+.
 */
var ajax = (function () {
    function fetch (method, url, body, callback) {
        try {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    callback(xhr.responseText, xhr.status);
                }
            };
            xhr.open(method, url, true);
            xhr.send(body);
        }
        catch (err) {
            callback(err, 0);
        }
    }

    function get (url, callback) {
        fetch('GET', url, null, callback);
    }

    function post (url, body, callback) {
        fetch('POST', url, body, callback)
    }

    return {
        'fetch': fetch,
        'get': get,
        'post': post
    }
})();
