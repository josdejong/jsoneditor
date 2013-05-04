
// module exports
var jsoneditor = {
    'JSONEditor': JSONEditor,
    'JSONFormatter': function () {
        throw new Error('JSONFormatter is deprecated. ' +
            'Use JSONEditor with mode "text" or "code" instead');
    },
    'util': util
};

/**
 * load jsoneditor.css
 */
var loadCss = function () {
    // get the script location, and built the css file name from the js file name
    // http://stackoverflow.com/a/2161748/1262753
    var scripts = document.getElementsByTagName('script');
    var jsFile = scripts[scripts.length-1].src.split('?')[0];
    var cssFile = jsFile.substring(0, jsFile.length - 2) + 'css';

    // load css
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = cssFile;
    document.getElementsByTagName('head')[0].appendChild(link);
};

/**
 * CommonJS module exports
 */
if (typeof(module) != 'undefined' && typeof(exports) != 'undefined') {
    loadCss();
    module.exports = exports = jsoneditor;
}

/**
 * AMD module exports
 */
if (typeof(require) != 'undefined' && typeof(define) != 'undefined') {
    define(function () {
        loadCss();
        return jsoneditor;
    });
}
else {
    // attach the module to the window, load as a regular javascript file
    window['jsoneditor'] = jsoneditor;
}
